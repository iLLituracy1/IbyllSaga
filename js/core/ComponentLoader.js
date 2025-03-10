// ComponentLoader.js - A new module to handle proper component initialization
// This replaces the initialization logic in Initialize.js and UISystem.js

class ComponentLoader {
  constructor() {
    this.components = {};
    this.registeredComponents = new Map(); // Map component name to instance
    this.dependencyGraph = new Map(); // Map component name to its dependencies
    this.initialized = new Set(); // Set of initialized components
    this.createdDOMElements = new Set(); // Track created DOM elements to prevent duplication
    this.debug = true;
  }

  /**
   * Register a component with the system
   * @param {string} name - Component name
   * @param {object} component - Component instance
   * @param {Array} dependencies - Array of component names this component depends on
   */
  registerComponent(name, component, dependencies = []) {
    this.log(`Registering component: ${name}`);
    
    // Store component instance
    this.registeredComponents.set(name, component);
    
    // Store component dependencies
    this.dependencyGraph.set(name, dependencies);
    
    // Set system reference on component
    if (component && typeof component.setSystem === 'function') {
      component.setSystem(window.UI.system);
    }
    
    return true;
  }

  /**
   * Initialize all components in dependency order
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
            
            // Register with UI system
            const component = this.registeredComponents.get(componentName);
            if (window.UI && window.UI.system && component) {
              window.UI.system.registerComponent(componentName, component);
            }
          } else {
            this.log(`Failed to initialize component: ${componentName}`, 'error');
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
    
    // Set up legacy function bridges after all components are initialized
    this.setupLegacyBridges();
    
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
    return dependencies.every(dep => this.initialized.has(dep));
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
    // For sidebar layout, make sure critical DOM structure exists
    if (componentName === 'sidebarLayout') {
      this.ensureSidebarDOMStructure(component);
    }
    
    // For core component, ensure game container exists
    if (componentName === 'core') {
      this.ensureGameContainer();
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
    const gameContainer = this.ensureGameContainer();
    
    // Look for existing sidebar and main content
    const existingSidebar = gameContainer.querySelector('.game-sidebar');
    const existingMain = gameContainer.querySelector('.game-main');
    
    // If both exist, we're good
    if (existingSidebar && existingMain) {
      this.log('Sidebar structure already exists');
      this.createdDOMElements.add('sidebarStructure');
      return;
    }
    
    // Get or create header
    let header = gameContainer.querySelector('header');
    if (!header) {
      header = document.createElement('header');
      header.innerHTML = `
        <h1>Kasvaari Camp</h1>
        <div id="location">Location: Kasvaari Camp, Western Hierarchate</div>
        <div class="time-display-container">
          <div id="dayNightIndicator" class="day-night-indicator"></div>
          <div class="time-info">
            <div id="timeDisplay">Time: 8:00 AM</div>
            <div id="dayDisplay">Day 1</div>
          </div>
        </div>
      `;
      gameContainer.appendChild(header);
    }
    
    // Create sidebar if needed
    let sidebar = existingSidebar;
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.className = 'game-sidebar';
      gameContainer.appendChild(sidebar);
    }
    
    // Create main content if needed
    let mainContent = existingMain;
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.className = 'game-main';
      gameContainer.appendChild(mainContent);
    }
    
    // Create narrative container in main content
    let narrativeContainer = mainContent.querySelector('.narrative-container');
    if (!narrativeContainer) {
      narrativeContainer = document.createElement('div');
      narrativeContainer.className = 'narrative-container';
      mainContent.appendChild(narrativeContainer);
    }
    
    // Create narrative element if needed
    let narrative = narrativeContainer.querySelector('#narrative');
    if (!narrative) {
      narrative = document.createElement('div');
      narrative.id = 'narrative';
      narrative.className = 'narrative';
      narrativeContainer.appendChild(narrative);
    }
    
    // Create actions container if needed
    let actionsContainer = narrativeContainer.querySelector('.actions-container');
    if (!actionsContainer) {
      actionsContainer = document.createElement('div');
      actionsContainer.className = 'actions-container';
      narrativeContainer.appendChild(actionsContainer);
    }
    
    // Create actions element if needed
    let actions = actionsContainer.querySelector('#actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'actions';
      actionsContainer.appendChild(actions);
    }
    
    // Add mobile sidebar toggle if needed
    if (!gameContainer.querySelector('.sidebar-toggle')) {
      const sidebarToggle = document.createElement('div');
      sidebarToggle.className = 'sidebar-toggle';
      sidebarToggle.textContent = '☰';
      gameContainer.appendChild(sidebarToggle);
    }
    
    this.log('Created sidebar structure');
    this.createdDOMElements.add('sidebarStructure');
    
    // If sidebar component has properties to store these elements, set them
    if (sidebarComponent) {
      if (sidebarComponent.sidebar === undefined) sidebarComponent.sidebar = sidebar;
      if (sidebarComponent.mainContent === undefined) sidebarComponent.mainContent = mainContent;
    }
  }

  /**
   * Ensure game container exists
   * @returns {HTMLElement} - The game container
   */
  ensureGameContainer() {
    // Check if we already ensured this
    if (this.createdDOMElements.has('gameContainer')) {
      return document.getElementById('gameContainer');
    }
    
    // Get or create game container
    let gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      gameContainer = document.createElement('div');
      gameContainer.id = 'gameContainer';
      document.body.appendChild(gameContainer);
    }
    
    // Make sure it's visible
    gameContainer.classList.remove('hidden');
    
    this.createdDOMElements.add('gameContainer');
    return gameContainer;
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
        if (!visited.has(dep)) {
          if (detectCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          this.log(`Circular dependency detected: ${node} -> ${dep}`, 'error');
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
   * Set up legacy function bridges for backwards compatibility
   */
  setupLegacyBridges() {
    this.log('Setting up legacy function bridges');
    
    // Store original functions
    const originals = {
      updateStatusBars: window.updateStatusBars,
      setNarrative: window.setNarrative,
      addToNarrative: window.addToNarrative,
      handleAction: window.handleAction,
      updateTimeAndDay: window.updateTimeAndDay
    };
    
    // Bridge for status bars update
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars = (data) => {
        try {
          // Try new system first
          if (window.UI && window.UI.system && window.UI.system.components.status) {
            window.UI.system.components.status.update(data || window.gameState);
            return;
          }
        } catch (error) {
          console.error('Error in new updateStatusBars, using original:', error);
          if (typeof originals.updateStatusBars === 'function') {
            originals.updateStatusBars(data);
          }
        }
      };
    }
    
    // Other bridges would be similar to above pattern
    // ...
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
