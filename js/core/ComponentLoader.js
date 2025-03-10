// Enhanced ComponentLoader.js - Fixes component registration and initialization issues
// This fixes duplicate registrations and ensures proper dependency resolution

class ComponentLoader {
  constructor() {
    this.components = {};
    this.registeredComponents = new Map(); // Map component name to instance
    this.dependencyGraph = new Map(); // Map component name to its dependencies
    this.initialized = new Set(); // Set of initialized components
    this.aliasMap = new Map(); // Map alias names to canonical names
    this.createdDOMElements = new Set(); // Track created DOM elements to prevent duplication
    this.debug = true;
  }

  /**
   * Register a component with the system
   * @param {string} name - Component name
   * @param {object} component - Component instance
   * @param {Array} dependencies - Array of component names this component depends on
   * @param {Array} aliases - Optional aliases for this component
   * @returns {boolean} - Success status
   */
  registerComponent(name, component, dependencies = [], aliases = []) {
    // Skip if already registered with same instance
    if (this.registeredComponents.has(name) && this.registeredComponents.get(name) === component) {
      this.log(`Component ${name} already registered with same instance`);
      return true;
    }

    this.log(`Registering component: ${name}`);
    
    // Store component instance
    this.registeredComponents.set(name, component);
    
    // Store component dependencies
    this.dependencyGraph.set(name, dependencies);
    
    // Register aliases
    aliases.forEach(alias => {
      this.aliasMap.set(alias, name);
      this.log(`Registered alias: ${alias} → ${name}`);
    });
    
    // Set system reference on component
    if (component && typeof component.setSystem === 'function') {
      component.setSystem(window.UI.system);
    }
    
    return true;
  }

  /**
   * Initialize all components in dependency order
   * @returns {number} - Number of initialized components
   */
  initializeComponents() {
    this.log('Initializing components in dependency order');
    
    // Create a set of components that still need to be initialized
    const pending = new Set(this.registeredComponents.keys());
    
    // Track iterations to detect circular dependencies
    let iteration = 0;
    const MAX_ITERATIONS = 100;
    let progress = true;
    
    // Keep initializing components until all are done or no progress can be made
    while (pending.size > 0 && progress && iteration < MAX_ITERATIONS) {
      progress = false;
      iteration++;
      
      this.log(`Initialization iteration ${iteration}, pending: ${pending.size} components`);
      
      // Try to initialize components whose dependencies are already initialized
      for (const componentName of pending) {
        if (this.canInitialize(componentName)) {
          const success = this.initializeComponent(componentName);
          
          if (success) {
            // Mark as initialized and remove from pending
            this.initialized.add(componentName);
            pending.delete(componentName);
            progress = true;
            
            // Register with UI system - IMPORTANT: we register AFTER successful initialization
            const component = this.registeredComponents.get(componentName);
            if (window.UI && window.UI.system && component) {
              window.UI.system.registerComponent(componentName, component);
              
              // Also register any aliases
              this.aliasMap.forEach((canonical, alias) => {
                if (canonical === componentName) {
                  window.UI.system.registerComponent(alias, component);
                  this.log(`Registered component alias with UI system: ${alias} → ${componentName}`);
                }
              });
            }
          } else {
            this.log(`Failed to initialize component: ${componentName}`, 'warn');
          }
        }
      }
    }
    
    // Check for uninitialized components
    if (pending.size > 0) {
      this.log(`Failed to initialize ${pending.size} components: ${Array.from(pending).join(', ')}`, 'error');
      
      // Check for circular dependencies
      this.detectCircularDependencies();
      
      // Try to force initialize remaining components
      this.forceInitializeRemaining(pending);
    }
    
    this.log(`Completed initialization of ${this.initialized.size} components`);
    
    return this.initialized.size;
  }

  /**
   * Check if a component can be initialized (all dependencies are initialized)
   * @param {string} componentName - Component to check
   * @returns {boolean} - Whether component can be initialized
   */
  canInitialize(componentName) {
    const dependencies = this.dependencyGraph.get(componentName) || [];
    
    // Component can be initialized if all dependencies are already initialized
    return dependencies.every(dep => {
      // If dependency is an alias, get the canonical name
      const canonicalDep = this.aliasMap.get(dep) || dep;
      return this.initialized.has(canonicalDep);
    });
  }

  /**
   * Initialize a specific component
   * @param {string} componentName - Component to initialize
   * @returns {boolean} - Success status
   */
  initializeComponent(componentName) {
    this.log(`Initializing component: ${componentName}`);
    
    try {
      const component = this.registeredComponents.get(componentName);
      
      if (!component) {
        this.log(`Component not found: ${componentName}`, 'error');
        return false;
      }
      
      // Check if this component creates DOM elements that other components depend on
      if (this.isDOMProvider(componentName)) {
        this.log(`${componentName} is a DOM provider, ensuring DOM elements are created first`);
        this.ensureDOMElements(componentName, component);
      }
      
      // Call initialize if it exists
      if (typeof component.initialize === 'function') {
        const result = component.initialize();
        
        // If initialize returns explicit false, consider it failed
        if (result === false) {
          this.log(`Component ${componentName} initialization returned false`, 'warn');
          return false;
        }
      } else {
        this.log(`Component ${componentName} has no initialize method`, 'warn');
      }
      
      return true;
    } catch (error) {
      this.log(`Error initializing component ${componentName}: ${error.message}`, 'error');
      console.error(error);
      return false;
    }
  }

  /**
   * Detect if component is a DOM provider (creates DOM elements others depend on)
   * @param {string} componentName - Component to check
   * @returns {boolean} - Whether component is a DOM provider
   */
  isDOMProvider(componentName) {
    // Known DOM providers
    const domProviders = ['sidebarLayout', 'core'];
    return domProviders.includes(componentName);
  }

  /**
   * Ensure DOM elements are created for a DOM provider component
   * @param {string} componentName - Component name
   * @param {object} component - Component instance
   */
  ensureDOMElements(componentName, component) {
    // Only the SidebarLayout should be creating the game structure
    // Other components should wait for it
    if (componentName === 'sidebarLayout') {
      this.ensureSidebarDOMStructure(component);
    }
  }

  /**
   * Ensure the sidebar layout DOM structure exists
   * @param {object} sidebarComponent - The sidebar component instance
   */
  ensureSidebarDOMStructure(sidebarComponent) {
    // Check if we already created this structure
    if (this.createdDOMElements.has('sidebarStructure')) {
      return;
    }
    
    // Get or create game container
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      this.log('Game container not found, cannot ensure sidebar structure', 'error');
      return;
    }
    
    // Look for existing sidebar and main content
    const existingSidebar = gameContainer.querySelector('.game-sidebar');
    const existingMain = gameContainer.querySelector('.game-main');
    
    // If both exist, we're good
    if (existingSidebar && existingMain) {
      this.log('Sidebar structure already exists');
      this.createdDOMElements.add('sidebarStructure');
      
      // Set references on component if it has properties for them
      if (sidebarComponent) {
        if (sidebarComponent.sidebar === undefined) sidebarComponent.sidebar = existingSidebar;
        if (sidebarComponent.mainContent === undefined) sidebarComponent.mainContent = existingMain;
      }
      
      return;
    }
    
    // We won't create the structure here - we'll let the SidebarLayout component do it
    // We'll just make a note that we've checked
    this.log('SidebarLayout will create the structure during initialization');
  }

  /**
   * Detect circular dependencies in the dependency graph
   */
  detectCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    
    // Helper function for DFS to detect cycles
    const detectCycle = (node) => {
      visited.add(node);
      recursionStack.add(node);
      
      const dependencies = this.dependencyGraph.get(node) || [];
      
      for (const dep of dependencies) {
        // If dependency is an alias, get the canonical name
        const canonicalDep = this.aliasMap.get(dep) || dep;
        
        if (!visited.has(canonicalDep)) {
          if (detectCycle(canonicalDep)) {
            return true;
          }
        } else if (recursionStack.has(canonicalDep)) {
          this.log(`Circular dependency detected: ${node} → ${dep}`, 'error');
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    // Check each node
    for (const node of this.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node);
      }
    }
  }

  /**
   * Force initialize remaining components
   * @param {Set} pending - Set of pending components
   */
  forceInitializeRemaining(pending) {
    this.log(`Forcing initialization of ${pending.size} remaining components`, 'warn');
    
    for (const componentName of pending) {
      this.log(`Force initializing: ${componentName}`, 'warn');
      
      try {
        const component = this.registeredComponents.get(componentName);
        
        if (!component) continue;
        
        // Call initialize if it exists, ignoring dependencies
        if (typeof component.initialize === 'function') {
          component.initialize();
        }
        
        // Register with UI system
        if (window.UI && window.UI.system) {
          window.UI.system.registerComponent(componentName, component);
        }
        
        this.initialized.add(componentName);
      } catch (error) {
        this.log(`Error force initializing component ${componentName}: ${error}`, 'error');
      }
    }
  }

  /**
   * Logging utility with timestamps
   * @param {string} message - Message to log
   * @param {string} level - Log level (log, warn, error)
   */
  log(message, level = 'log') {
    if (!this.debug) return;
    
    const timestamp = new Date().toISOString().substring(11, 23);
    const formattedMessage = `[${timestamp}] ComponentLoader: ${message}`;
    
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }
}

// Export the ComponentLoader
window.ComponentLoader = ComponentLoader;
