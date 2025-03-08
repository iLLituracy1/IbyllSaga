// Initialize.js
// Entry point for the new UI framework
// Provides compatibility with existing code while transitioning to the new architecture

// Create global namespace for UI framework
window.UI = window.UI || {};

// Initialize function to be called after DOM is loaded
window.UI.initialize = function() {
  console.log('Initializing new UI framework');
  
  // Check if EventBus is loaded
  if (typeof EventBus !== 'function') {
    console.error('EventBus not loaded. Make sure EventBus.js is included before Initialize.js');
    return false;
  }
  
  // Check if Component is loaded
  if (typeof Component !== 'function') {
    console.error('Component not loaded. Make sure Component.js is included before Initialize.js');
    return false;
  }
  
  // Check if UISystem is loaded
  if (typeof UISystem !== 'function') {
    console.error('UISystem not loaded. Make sure UISystem.js is included before Initialize.js');
    return false;
  }
  
  try {
    // Create the UI system
    window.UI.system = new UISystem();
    
    // Enable debug mode for development
    window.UI.system.debug = true;
    
    // Initialize components (when they're available)
    initializeComponents();
    
    // Bridge with existing code
    createLegacyBridge();
    
    console.log('UI framework initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing UI framework:', error);
    return false;
  }
};

// Initialize UI components
function initializeComponents() {
  console.log('Initializing UI components');
  
  // Check if StatusDisplayComponent is loaded
  if (typeof StatusDisplayComponent === 'function') {
    // Create status display component
    const statusDisplay = new StatusDisplayComponent();
    window.UI.system.registerComponent('status', statusDisplay);
  } else {
    console.warn('StatusDisplayComponent not loaded. Status bars will use legacy code.');
  }
  
  // Other components will be registered here as they are developed
  
  // TODO: Create and register these components
  // - NarrativeComponent
  // - ActionSystemComponent
  // - TimeSystemComponent
  // - ProfilePanelComponent
  // - InventoryPanelComponent
  // - QuestPanelComponent
}

// Create bridge to legacy code
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
  
  // Override existing functions to use new components when available
  
  // Override updateStatusBars
  window.updateStatusBars = function() {
    console.log('Legacy updateStatusBars called, using new UI system when available');
    
    // Use new status component if available
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
  
  // More function overrides will be added as components are implemented
  
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

// Call initialize function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Delay initialization to ensure all scripts are loaded
  setTimeout(window.UI.initialize, 100);
});
