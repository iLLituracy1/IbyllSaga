// Initialize.js
// Enhanced entry point for the UI framework
// Provides robust dependency management and initialization sequence

// Create global namespace for UI framework
window.UI = window.UI || {};

// Configuration for component dependencies and initialization order
window.UI.componentConfig = {
  // Core components that must initialize first
  core: [
    { name: 'system', class: 'UISystem', required: true },
    { name: 'eventBus', class: 'EventBus', required: true }
  ],
  
  // UI components in dependency order
  components: [
    { name: 'sidebar', class: 'SidebarLayout', required: false },
    { name: 'status', class: 'StatusDisplayComponent', required: true },
    { name: 'time', class: 'TimeSystemComponent', required: true },
    { name: 'narrative', class: 'NarrativeComponent', required: true },
    { name: 'actionSystem', class: 'ActionSystemComponent', required: true },
    { name: 'panelSystem', class: 'PanelSystemComponent', required: true },
    { name: 'transition', class: 'TransitionSystem', required: true }
  ]
};

// Initialize function to be called after DOM is loaded
window.UI.initialize = function() {
  console.log('Initializing new UI framework');
  
  // Create initialization timestamp to track performance
  window.UI.initStartTime = Date.now();
  
  // Reset any existing state to prevent conflicts
  resetUIState();
  
  try {
    // Initialize the UI system
    initCore();
    
    // Enable debug mode for development (should be turned off in production)
    window.UI.system.debug = true;
    
    // Initialize components in correct dependency order
    initComponents();
    
    // Create compatibility layer with existing code
    createLegacyBridge();
    
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
  
  // Create the system
  window.UI.system = new UISystem();
  
  // Create separate instance for direct access
  window.uiSystem = window.UI.system;

  // Explicitly create and register the essential components
  // This ensures they're available before any other component initialization
  if (typeof Component === 'function') {
    // Create and register core component first
    const coreComponent = new Component('ui-core');
    window.UI.system.registerComponent('core', coreComponent);
    
    // Check for ActionSystemComponent and register as 'actions' if found
    const ActionSystemComponent = window.UI.system.components.actionSystem;
    if (ActionSystemComponent) {
      window.UI.system.registerComponent('actions', ActionSystemComponent);
    }
  }
}

// Initialize all UI components in dependency order
function initComponents() {
  console.log('Initializing UI components');
  
  // Create and register required base components first
  ensureBaseComponents();
  
  // Initialize each component
  window.UI.componentConfig.components.forEach(componentConfig => {
    initComponent(componentConfig);
  });
  
  // Initialize system to wire everything together
  if (window.UI.system.initialize) {
    window.UI.system.initialize();
  }
}

// Ensure base components like core and actions are properly registered
function ensureBaseComponents() {
  // Ensure core component exists
  if (!window.UI.system.components.core && typeof Component === 'function') {
    const coreComponent = new Component('ui-core');
    window.UI.system.registerComponent('core', coreComponent);
    console.log('Registered core component');
  }
  
  // After all components are initialized, ensure actions component is correctly registered
  // This needs to run after all other components are registered to make sure we can find actionSystem
  document.addEventListener('uiSystemReady', function() {
    if (!window.UI.system.components.actions && window.UI.system.components.actionSystem) {
      window.UI.system.registerComponent('actions', window.UI.system.components.actionSystem);
      console.log('Registered actionSystem as actions component');
    }
  });
}

// Initialize a specific component
function initComponent(config) {
  const { name, class: className, required } = config;
  
  try {
    // Skip if already registered
    if (window.UI.system.components[name]) {
      console.log(`Component ${name} already registered`);
      
      // Special case for actionSystem - also register as 'actions' 
      if (name === 'actionSystem' && !window.UI.system.components['actions']) {
        window.UI.system.registerComponent('actions', window.UI.system.components[name]);
        console.log('Registered actionSystem as actions component');
      }
      
      return true;
    }
    
    // Special case for 'core' which should be created from Component class
    if (name === 'core' && !window.UI.system.components.core) {
      const CoreComponent = new Component('ui-core');
      window.UI.system.registerComponent('core', CoreComponent);
      return true;
    }
    
    // Check if class exists in global scope
    if (typeof window[className] !== 'function') {
      // Try alternate locations
      if (typeof window.UI[className] === 'function') {
        console.log(`Found ${className} in UI namespace`);
      } else {
        const message = `Component class ${className} not found`;
        if (required) {
          throw new Error(message);
        } else {
          console.warn(message + " (optional)");
          return false;
        }
      }
    }
    
    // Create component instance
    const Component = window[className] || window.UI[className];
    const instance = new Component();
    
    // Register with UI system
    window.UI.system.registerComponent(name, instance);
    
    console.log(`Registered component: ${name}`);
    return true;
  } catch (error) {
    console.error(`Failed to initialize component ${name}:`, error);
    if (required) {
      throw error; // Re-throw for required components
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
        
        // Also update sidebar if it exists
        if (window.UI.system.components.sidebar) {
          window.UI.system.components.sidebar.updateStatusBars();
        }
        
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
    if (window.UI.system && window.UI.system.components.actionSystem) {
      try {
        // Publish to event bus to handle action
        window.UI.system.eventBus.publish('action:execute', { action });
        return;
      } catch (error) {
        console.error('Error using new action system, falling back to legacy:', error);
      }
    }
    
    // Fallback to original function
    if (typeof originalFunctions.handleAction === 'function') {
      originalFunctions.handleAction(action);
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

// Call initialize function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Delay initialization slightly to ensure all scripts are loaded
  setTimeout(window.UI.initialize, 100);
});
