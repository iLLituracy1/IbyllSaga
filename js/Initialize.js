// Initialize.js - Updated with ComponentLoader integration
// Provides robust dependency management and initialization sequence

// Create global namespace for UI framework
window.UI = window.UI || {};

// Component dependency configuration - enhanced with explicit DOM dependencies
window.UI.componentConfig = {
  // Core components that must initialize first
  core: [
    { name: 'system', class: 'UISystem', required: true },
    { name: 'eventBus', class: 'EventBus', required: true }
  ],
  
  // UI components with their dependencies
  components: [
    // Base layout must be first as it creates DOM structure others depend on
    { 
      name: 'sidebarLayout', 
      class: 'SidebarLayout', 
      required: true,
      dependencies: [],
      providesDOMElements: true
    },
    // Display components depend on sidebar layout
    { 
      name: 'status', 
      class: 'StatusDisplayComponent', 
      required: true,
      dependencies: ['sidebarLayout'] 
    },
    { 
      name: 'time', 
      class: 'TimeSystemComponent', 
      required: true,
      dependencies: ['sidebarLayout'] 
    },
    { 
      name: 'narrative', 
      class: 'NarrativeComponent', 
      required: true,
      dependencies: ['sidebarLayout'] 
    },
    // Action system depends on narrative component
    { 
      name: 'actionSystem', 
      class: 'ActionSystemComponent', 
      required: true,
      dependencies: ['narrative', 'sidebarLayout'] 
    },
    // Panel system has sidebar as dependency for button interaction
    { 
      name: 'panelSystem', 
      class: 'PanelSystemComponent', 
      required: true,
      dependencies: ['sidebarLayout'] 
    },
    // Transition system depends on core systems
    { 
      name: 'transition', 
      class: 'TransitionSystem', 
      required: true,
      dependencies: ['sidebarLayout'] 
    }
  ]
};

// Initialize function to be called after DOM is loaded
window.UI.initialize = function() {
  console.log('Initializing UI framework');
  
  // Create initialization timestamp to track performance
  window.UI.initStartTime = Date.now();
  
  try {
    // Check if new ComponentLoader is available
    const useComponentLoader = typeof window.ComponentLoader === 'function';
    
    if (useComponentLoader) {
      // Use new ComponentLoader for more robust initialization
      initWithComponentLoader();
    } else {
      // Fallback to legacy initialization
      console.warn('ComponentLoader not found, using legacy initialization');
      initLegacyApproach();
    }
    
    // Dispatch event indicating UI system is ready
    document.dispatchEvent(new CustomEvent('uiSystemReady', {
      detail: { 
        initTime: Date.now() - window.UI.initStartTime,
        componentsLoaded: Object.keys(window.UI.system.components).length
      }
    }));
    
    console.log(`UI framework initialized successfully in ${Date.now() - window.UI.initStartTime}ms`);
    return true;
  } catch (error) {
    console.error('Error initializing UI framework:', error);
    // Attempt recovery
    attemptRecovery();
    return false;
  }
};

// Initialize using the new ComponentLoader
function initWithComponentLoader() {
  console.log('Using ComponentLoader for initialization');
  
  // Create UI system and event bus
  initCore();
  
  // Create the ComponentLoader
  const loader = new window.ComponentLoader();
  window.UI.loader = loader; // Store for debugging
  
  // Register components with their dependencies
  registerComponentsWithLoader(loader);
  
  // Initialize all components in dependency order
  const initializedCount = loader.initializeComponents();
  console.log(`ComponentLoader initialized ${initializedCount} components`);
  
  // Create compatibility layer with legacy code if needed
  createLegacyBridge();
}

// Legacy initialization approach (existing code)
function initLegacyApproach() {
  // Reset any existing state to prevent conflicts
  resetUIState();
  
  // Initialize the UI system
  initCore();
  
  // Enable debug mode for development (should be turned off in production)
  if (window.UI.system) {
    window.UI.system.debug = true;
  }
  
  // Initialize components based on dependencies
  initComponents();
  
  // Create compatibility layer with existing code
  createLegacyBridge();
}

// Register all components with the loader
function registerComponentsWithLoader(loader) {
  // Register core components first
  window.UI.core.forEach(core => {
    const coreComponent = window[core.class] ? new window[core.class]() : null;
    if (coreComponent) {
      loader.registerComponent(core.name, coreComponent, []);
    }
  });
  
  // Register UI components with their dependencies
  window.UI.componentConfig.components.forEach(config => {
    try {
      // Find the component class
      let ComponentClass = window[config.class];
      
      if (!ComponentClass) {
        // Try alternate locations
        if (typeof window.UI[config.class] === 'function') {
          ComponentClass = window.UI[config.class];
        } else {
          console.warn(`Component class ${config.class} not found for ${config.name}`);
          return;
        }
      }
      
      // Create component instance
      const instance = new ComponentClass();
      
      // Register with loader
      loader.registerComponent(config.name, instance, config.dependencies || []);
      
      console.log(`Registered component with loader: ${config.name}`);
    } catch (error) {
      console.error(`Failed to register component ${config.name}:`, error);
    }
  });
}

// Reset UI state to allow clean initialization
function resetUIState() {
  // Store current state if it exists (for recovery)
  if (window.UI.system) {
    window.UI._prevState = {
      components: window.UI.system.components,
      state: window.UI.system.state
    };
  }
  
  // Create fresh system
  window.UI.system = null;
}

// Initialize core framework
function initCore() {
  console.log('Initializing UI core');
  
  // Check if core classes are loaded
  if (typeof UISystem !== 'function') {
    throw new Error('UISystem not loaded. Make sure UISystem.js is included before Initialize.js');
  }
  
  if (typeof EventBus !== 'function') {
    throw new Error('EventBus not loaded. Make sure EventBus.js is included before Initialize.js');
  }
  
  if (typeof Component !== 'function') {
    throw new Error('Component not loaded. Make sure Component.js is included before Initialize.js');
  }
  
  // Create the system and its event bus
  window.UI.system = new UISystem();
  window.UI.system.eventBus = new EventBus();
  
  // Create separate instance for direct access
  window.uiSystem = window.UI.system;
}

// Initialize all UI components based on dependency order
function initComponents() {
  console.log('Initializing UI components');
  
  // Create a dependency graph to determine initialization order
  const components = window.UI.componentConfig.components;
  const initialized = new Set();
  const remaining = new Set(components.map(c => c.name));
  
  // Function to check if dependencies are satisfied
  const dependenciesMet = (componentConfig) => {
    if (!componentConfig.dependencies || componentConfig.dependencies.length === 0) {
      return true;
    }
    
    return componentConfig.dependencies.every(dep => initialized.has(dep));
  };
  
  // Keep initializing components until all are done or no progress can be made
  let progress = true;
  let iteration = 0;
  const MAX_ITERATIONS = 10; // Safety to prevent infinite loops
  
  while (remaining.size > 0 && progress && iteration < MAX_ITERATIONS) {
    progress = false;
    iteration++;
    
    console.log(`Initialization iteration ${iteration}, remaining: ${remaining.size} components`);
    
    // Try to initialize components whose dependencies are met
    for (const componentConfig of components) {
      if (!remaining.has(componentConfig.name)) continue;
      
      if (dependenciesMet(componentConfig)) {
        // Initialize this component
        const success = initComponent(componentConfig);
        
        if (success) {
          initialized.add(componentConfig.name);
          remaining.delete(componentConfig.name);
          progress = true;
        } else if (componentConfig.required) {
          throw new Error(`Failed to initialize required component: ${componentConfig.name}`);
        }
      }
    }
  }
  
  // Check if any required components remain uninitialized
  if (remaining.size > 0) {
    const remainingComponents = [...remaining].join(', ');
    console.warn(`Failed to initialize all components. Remaining: ${remainingComponents}`);
    
    // Check for circular dependencies
    const remainingConfigs = components.filter(c => remaining.has(c.name));
    const dependencies = remainingConfigs.map(c => 
      `${c.name} depends on [${c.dependencies?.join(', ') || 'none'}]`
    ).join('; ');
    
    console.warn(`Possible circular dependencies: ${dependencies}`);
    
    // Try to force initialize required components
    let forcedComponents = 0;
    for (const componentConfig of remainingConfigs) {
      if (componentConfig.required) {
        console.warn(`Forcing initialization of required component: ${componentConfig.name}`);
        if (initComponent(componentConfig, true)) {
          forcedComponents++;
        }
      }
    }
    
    if (forcedComponents > 0) {
      console.log(`Forced initialization of ${forcedComponents} required components`);
    }
  }
  
  // Finalize initialization by calling initialize on the system
  if (window.UI.system && typeof window.UI.system.initialize === 'function') {
    window.UI.system.initialize();
  }
}

// Initialize a specific component
function initComponent(config, force = false) {
  const { name, class: className, required } = config;
  
  try {
    // Skip if already registered
    if (window.UI.system.components && window.UI.system.components[name]) {
      console.log(`Component ${name} already registered`);
      return true;
    }
    
    // Special case for 'core' which should be created from Component class
    if (name === 'core' && !window.UI.system.components?.core) {
      const CoreComponent = new Component('ui-core');
      window.UI.system.registerComponent('core', CoreComponent);
      return true;
    }
    
    // Check if class exists in global scope
    let ComponentClass = window[className];
    
    if (typeof ComponentClass !== 'function') {
      // Try alternate locations
      if (typeof window.UI[className] === 'function') {
        ComponentClass = window.UI[className];
        console.log(`Found ${className} in UI namespace`);
      } else {
        const message = `Component class ${className} not found`;
        if (required && !force) {
          throw new Error(message);
        } else {
          console.warn(message + " (optional)");
          return false;
        }
      }
    }
    
    // Create component instance
    const instance = new ComponentClass();
    
    // Register with UI system
    window.UI.system.registerComponent(name, instance);
    
    // Special case for actionSystem - also register as 'actions'
    if (name === 'actionSystem') {
      window.UI.system.registerComponent('actions', instance);
      console.log('Registered actionSystem as actions component');
    }
    
    console.log(`Registered component: ${name}`);
    
    // Initialize the component if it has an initialize method
    if (typeof instance.initialize === 'function') {
      const result = instance.initialize();
      if (result === false) {
        console.warn(`Component ${name} initialization returned false`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to initialize component ${name}:`, error);
    if (required && !force) {
      throw error; // Re-throw for required components unless forcing
    }
    return false;
  }
}

// Create compatibility layer with existing code
function createLegacyBridge() {
  console.log('Creating bridge to legacy code');
  
  // Store original functions for fallback
  const originalFunctions = {
    updateStatusBars: window.updateStatusBars,
    updateTimeAndDay: window.updateTimeAndDay,
    setNarrative: window.setNarrative,
    addToNarrative: window.addToNarrative,
    handleAction: window.handleAction,
    showNotification: window.showNotification,
    handleProfile: window.handleProfile
  };
  
  // Define wrapper for status bar updates
  window.updateStatusBars = function() {
    // First try new system
    if (window.UI.system && window.UI.system.components.status) {
      try {
        // Update status component with current game state
        window.UI.system.components.status.update(window.gameState);
        return;
      } catch (error) {
        console.error('Error using new status component, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.updateStatusBars === 'function') {
      originalFunctions.updateStatusBars();
    }
  };
  
  // Define wrapper for narrative updates
  window.setNarrative = function(text) {
    if (window.UI.system && window.UI.system.components.narrative) {
      try {
        // Publish to event bus to update narrative
        window.UI.system.eventBus.publish('narrative:set', text);
        return;
      } catch (error) {
        console.error('Error using new narrative component, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.setNarrative === 'function') {
      originalFunctions.setNarrative(text);
    }
  };
  
  // Define wrapper for adding to narrative
  window.addToNarrative = function(text) {
    if (window.UI.system && window.UI.system.components.narrative) {
      try {
        // Publish to event bus to add to narrative
        window.UI.system.eventBus.publish('narrative:add', text);
        return;
      } catch (error) {
        console.error('Error using new narrative component, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.addToNarrative === 'function') {
      originalFunctions.addToNarrative(text);
    }
  };
  
  // Define wrapper for action handling
  window.handleAction = function(action) {
    if (window.UI && window.UI.system && window.UI.system.components.actionSystem) {
      try {
        // Use direct execution method to avoid infinite loop
        if (typeof window.UI.system.components.actionSystem.handleActionDirect === 'function') {
          window.UI.system.components.actionSystem.handleActionDirect(action);
          return;
        }
        
        // Safely publish via event bus
        window.UI.system.eventBus.publish('action:execute', { 
          action: action,
          isRedirect: true // Prevention flag
        });
        return;
      } catch (error) {
        console.error('Error using new action system, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function if available
    if (typeof originalFunctions.handleAction === 'function') {
      originalFunctions.handleAction(action);
    } else {
      console.warn("No fallback action handler available for:", action);
    }
  };
  
  // Define wrapper for time updates
  window.updateTimeAndDay = function(minutesToAdd) {
    if (window.UI.system && window.UI.system.components.time) {
      try {
        // Publish to event bus to update time
        window.UI.system.eventBus.publish('time:advance', { minutes: minutesToAdd });
        return;
      } catch (error) {
        console.error('Error using new time system, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.updateTimeAndDay === 'function') {
      originalFunctions.updateTimeAndDay(minutesToAdd);
    }
  };
  
  // Define wrapper for notifications
  window.showNotification = function(message, type) {
    if (window.UI.system) {
      try {
        // Use UI system to show notification
        window.UI.system.showNotification(message, type);
        return;
      } catch (error) {
        console.error('Error using new notification system, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.showNotification === 'function') {
      originalFunctions.showNotification(message, type);
    } else {
      console.log(`[Notification - ${type}] ${message}`);
    }
  };
  
  // Define wrapper for profile handling
  window.handleProfile = function() {
    if (window.UI.system && window.UI.system.components.panelSystem) {
      try {
        // Use panel system to toggle profile
        window.UI.system.eventBus.publish('panel:toggle', { id: 'profile' });
        return;
      } catch (error) {
        console.error('Error using new panel system, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.handleProfile === 'function') {
      originalFunctions.handleProfile();
    }
  };
  
  // Hook into the global event system for game state updates
  if (window.gameState) {
    // Create proxy for game state to detect changes
    const gameStateProxy = new Proxy(window.gameState, {
      set: function(target, property, value) {
        // Set the property on the original object
        target[property] = value;
        
        // Notify UI system of the update
        if (window.UI.system && window.UI.system.eventBus) {
          window.UI.system.eventBus.publish('gameState:updated', window.gameState);
        }
        
        return true;
      }
    });
    
    // Replace the original gameState with the proxy
    window.gameState = gameStateProxy;
  }
}

// Recovery function for initialization failures
function attemptRecovery() {
  console.warn('Attempting UI system recovery');
  
  // Restore previous state if available
  if (window.UI._prevState) {
    window.UI.system = new UISystem();
    window.UI.system.components = window.UI._prevState.components;
    window.UI.system.state = window.UI._prevState.state;
    
    console.log('Restored previous UI state');
  }
  
  // If no system exists at all, create a minimal one
  if (!window.UI.system) {
    window.UI.system = new UISystem();
    console.log('Created minimal UI system');
  }
  
  // Make sure core functions exist
  ensureLegacyFunctions();
}

// Ensure legacy functions exist to prevent errors
function ensureLegacyFunctions() {
  // Define empty functions for critical UI operations if they don't exist
  if (typeof window.updateStatusBars !== 'function') {
    window.updateStatusBars = function() { 
      console.warn('Using placeholder updateStatusBars function');
    };
  }
  
  if (typeof window.setNarrative !== 'function') {
    window.setNarrative = function(text) {
      console.warn('Using placeholder setNarrative function');
      const narrative = document.getElementById('narrative');
      if (narrative) narrative.innerHTML = text;
    };
  }
  
  if (typeof window.addToNarrative !== 'function') {
    window.addToNarrative = function(text) {
      console.warn('Using placeholder addToNarrative function');
      const narrative = document.getElementById('narrative');
      if (narrative) narrative.innerHTML += `<p>${text}</p>`;
    };
  }
}

// Initialize game state function
window.initializeGameState = function() {
  console.log("Initializing game state...");
  
  // Create game state if it doesn't exist
  if (!window.gameState) {
    window.gameState = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      morale: 75,
      maxMorale: 100,
      level: 1,
      experience: 0,
      skillPoints: 0,
      inBattle: false,
      inMission: false,
      day: 1,
      time: 480, // 8:00 AM
      dailyPatrolDone: false,
      trainingCount: 0,
      locationsDiscovered: 0,
      mainQuest: {
        stage: 1,
        completed: false
      },
      sideQuests: []
    };
  }
  
  console.log("Game state initialized:", window.gameState);
  
  // Update UI with initial game state
  if (typeof window.updateStatusBars === 'function') {
    window.updateStatusBars();
  }
};

// Call initialize function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Short delay to ensure all scripts are loaded
  setTimeout(window.UI.initialize, 100);
});
