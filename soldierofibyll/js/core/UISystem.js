// UISystem.js - Core UI framework
// Main orchestrator that manages all UI components

class UISystem {
  constructor() {
    // Component registry
    this.components = {};
    
    // Global UI state
    this.state = {
      initialized: false,
      gameStarted: false,
      activePanel: null,
      transitioning: false,
      darkMode: false // For future theme support
    };
    
    // Create event bus for component communication
    this.eventBus = new EventBus();
    
    // Debug mode
    this.debug = false;
    
    this.log('UISystem created');
  }
  
  /**
   * Registers a component with the UI system
   * @param {string} name - Component name/identifier
   * @param {Component} component - Component instance
   */
  registerComponent(name, component) {
    this.log(`Registering component: ${name}`);
    this.components[name] = component;
    component.setSystem(this);
  }
  
  /**
   * Initializes all UI components in the correct order
   */
  initialize() {
    this.log('Initializing UI system');
    
    try {
      // Initialize in dependency order
      this.initializeCore();
      this.initializeStatusDisplay();
      this.initializeNarrative();
      this.initializeActionSystem();
      this.initializePanels();
      this.initializeTimeSystem();
      
      // Subscribe to global events
      this.setupEventListeners();
      
      this.state.initialized = true;
      this.log('UI system initialized');
      
      // Publish initialized event for other parts of the application
      this.eventBus.publish('ui:initialized', null);
    } catch (error) {
      console.error('Error initializing UI system:', error);
    }
  }
  
  /**
   * Initialize the core UI container
   */
  initializeCore() {
    this.log('Initializing core');
    
    if (!this.components.core) {
      console.error('Core component not registered');
      return;
    }
    
    this.components.core.initialize();
  }
  
  /**
   * Initialize the status display component
   */
  initializeStatusDisplay() {
    this.log('Initializing status display');
    
    if (!this.components.status) {
      console.error('Status component not registered');
      return;
    }
    
    this.components.status.initialize();
  }
  
  /**
   * Initialize the narrative display component
   */
  initializeNarrative() {
    this.log('Initializing narrative');
    
    if (!this.components.narrative) {
      console.error('Narrative component not registered');
      return;
    }
    
    this.components.narrative.initialize();
  }
  
  /**
   * Initialize the action buttons component
   */
  initializeActionSystem() {
    this.log('Initializing action system');
    
    if (!this.components.actions) {
      console.error('Actions component not registered');
      return;
    }
    
    this.components.actions.initialize();
  }
  
  /**
   * Initialize all panel components
   */
  initializePanels() {
    this.log('Initializing panels');
    
    // Initialize profile panel
    if (this.components.profilePanel) {
      this.components.profilePanel.initialize();
    }
    
    // Initialize inventory panel
    if (this.components.inventoryPanel) {
      this.components.inventoryPanel.initialize();
    }
    
    // Initialize quest panel
    if (this.components.questPanel) {
      this.components.questPanel.initialize();
    }
  }
  
  /**
   * Initialize the time system component
   */
  initializeTimeSystem() {
    this.log('Initializing time system');
    
    if (!this.components.time) {
      console.error('Time component not registered');
      return;
    }
    
    this.components.time.initialize();
  }
  
  /**
   * Set up event listeners for global events
   */
  setupEventListeners() {
    // Listen for panel open requests
    this.eventBus.subscribe('panel:open', (panelName) => {
      this.openPanel(panelName);
    });
    
    // Listen for panel close requests
    this.eventBus.subscribe('panel:close', (panelName) => {
      this.closePanel(panelName);
    });
    
    // Listen for game state updates
    this.eventBus.subscribe('gameState:updated', (data) => {
      this.updateComponents(data);
    });
    
    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.eventBus.publish('window:resize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    });
  }
  
  /**
   * Opens a panel and closes any other open panels
   * @param {string} panelName - Name of the panel to open
   */
  openPanel(panelName) {
    this.log(`Opening panel: ${panelName}`);
    
    // If another panel is open, close it first
    if (this.state.activePanel && this.state.activePanel !== panelName) {
      this.closePanel(this.state.activePanel);
    }
    
    // Set the active panel
    this.state.activePanel = panelName;
    
    // Find the component
    const panelComponent = this.components[panelName + 'Panel'];
    if (panelComponent) {
      panelComponent.show();
    } else {
      console.error(`Panel component not found: ${panelName}Panel`);
    }
    
    // Publish panel opened event
    this.eventBus.publish('panel:opened', panelName);
  }
  
  /**
   * Closes a panel
   * @param {string} panelName - Name of the panel to close
   */
  closePanel(panelName) {
    this.log(`Closing panel: ${panelName}`);
    
    // Find the component
    const panelComponent = this.components[panelName + 'Panel'];
    if (panelComponent) {
      panelComponent.hide();
    } else {
      console.error(`Panel component not found: ${panelName}Panel`);
    }
    
    // If this is the active panel, clear it
    if (this.state.activePanel === panelName) {
      this.state.activePanel = null;
    }
    
    // Publish panel closed event
    this.eventBus.publish('panel:closed', panelName);
  }
  
  /**
   * Updates all components with new game state
   * @param {Object} data - Game state data
   */
  updateComponents(data) {
    // Update each component with relevant data
    for (const name in this.components) {
      if (this.components[name] && typeof this.components[name].update === 'function') {
        try {
          this.components[name].update(data);
        } catch (error) {
          console.error(`Error updating component ${name}:`, error);
        }
      }
    }
  }
  
  /**
   * Show a notification message
   * @param {string} message - Message text
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {number} duration - How long to show the notification in ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    this.log(`Showing notification: ${message} (${type})`);
    
    // Find notification component if registered
    if (this.components.notification) {
      this.components.notification.show(message, type, duration);
    } else {
      // Fallback to existing notification system
      if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
      } else {
        console.log(`[Notification - ${type}] ${message}`);
      }
    }
  }
  
  /**
   * Handle the transition between character creation and game
   */
  startGame() {
    this.log('Starting game UI');
    
    if (this.state.gameStarted) {
      console.warn('Game already started');
      return;
    }
    
    this.state.transitioning = true;
    
    try {
      // Hide character creation
      const creator = document.getElementById('creator');
      if (creator) {
        creator.classList.add('hidden');
      }
      
      // Show game container
      const gameContainer = document.getElementById('gameContainer');
      if (gameContainer) {
        gameContainer.classList.remove('hidden');
      }
      
      // Update state
      this.state.gameStarted = true;
      this.eventBus.publish('game:started', null);
      
      // Initialize core components
      this.initialize();
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      this.state.transitioning = false;
    }
  }
  
  /**
   * Utility method for logging with timestamps
   * @param {string} message - Log message
   */
  log(message) {
    if (this.debug) {
      const timestamp = new Date().toISOString().substring(11, 23);
      console.log(`[${timestamp}] UISystem: ${message}`);
    }
  }
}
