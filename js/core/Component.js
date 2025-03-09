// Component.js - Base UI component class
// Parent class for all UI components with core functionality

class Component {
  /**
   * Base component constructor
   * @param {string} id - DOM element ID for this component
   * @param {Object} options - Optional component configuration
   */
  constructor(id, options = {}) {
    // Component identifier
    this.id = id;
    
    // Reference to the DOM element
    this.element = null;
    
    // Reference to the UI system
    this.system = null;
    
    // Component-specific state
    this.state = {
      initialized: false,
      visible: false,
      ...options.initialState
    };
    
    // Component options
    this.options = {
      autoCreate: true, // Automatically create element if not found
      debug: false,
      ...options
    };
    
    this.log(`Component created: ${id}`);
  }
  
  /**
   * Sets the parent UI system for this component
   * @param {UISystem} system - The UI system instance
   */
  setSystem(system) {
    this.system = system;
    
    // Inherit debug setting from system
    if (system.debug) {
      this.options.debug = true;
    }
  }
  
  /**
   * Initializes the component
   */
  initialize() {
    this.log(`Initializing component: ${this.id}`);
    
    // Find or create the component's DOM element
    this.element = document.getElementById(this.id);
    
    if (!this.element) {
      if (this.options.autoCreate) {
        this.log(`Element not found, creating: ${this.id}`);
        this.createRootElement();
      } else {
        console.error(`Element not found: ${this.id}`);
        return false;
      }
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Mark as initialized
    this.state.initialized = true;
    
    // Perform initial render
    this.render();
    
    return true;
  }
  
  /**
   * Creates the root DOM element for this component
   * Must be implemented by subclasses
   */
  createRootElement() {
    // Default implementation creates a div with the component ID
    const element = document.createElement('div');
    element.id = this.id;
    document.body.appendChild(element);
    this.element = element;
    
    this.log(`Created default element: ${this.id}`);
  }
  
  /**
   * Sets up component-specific event listeners
   * Should be overridden by subclasses
   */
  setupEventListeners() {
    // To be implemented by subclasses
  }
  
  /**
   * Renders the component
   * Must be implemented by subclasses
   */
  render() {
    this.log(`Render called on base component: ${this.id}`);
    // To be implemented by subclasses
  }
  
  /**
   * Updates the component with new data
   * @param {Object} data - Updated data for the component
   */
  update(data) {
    this.log(`Updating component: ${this.id}`);
    
    // Update component state with new data
    if (data) {
      // Only update properties that are relevant to this component
      // Subclasses should override this to filter their relevant data
      Object.assign(this.state, this.filterData(data));
    }
    
    // Re-render with updated state
    this.render();
  }
  
  /**
   * Filter the data relevant to this component
   * Should be overridden by subclasses
   * @param {Object} data - Data to filter
   * @returns {Object} - Filtered data
   */
  filterData(data) {
    // Default implementation returns everything
    // Subclasses should override to return only relevant data
    return data;
  }
  
  /**
   * Shows the component
   */
  show() {
    if (!this.element) {
      console.error(`Cannot show element: ${this.id} - not initialized`);
      return;
    }
    
    this.log(`Showing component: ${this.id}`);
    
    // Remove hidden class if present
    this.element.classList.remove('hidden');
    
    // Update state
    this.state.visible = true;
    
    // Trigger any necessary re-rendering
    this.render();
  }
  
  /**
   * Hides the component
   */
  hide() {
    if (!this.element) {
      console.error(`Cannot hide element: ${this.id} - not initialized`);
      return;
    }
    
    this.log(`Hiding component: ${this.id}`);
    
    // Add hidden class
    this.element.classList.add('hidden');
    
    // Update state
    this.state.visible = false;
  }
  
  /**
   * Adds a CSS class to the component
   * @param {string} className - CSS class to add
   */
  addClass(className) {
    if (this.element) {
      this.element.classList.add(className);
    }
  }
  
  /**
   * Removes a CSS class from the component
   * @param {string} className - CSS class to remove
   */
  removeClass(className) {
    if (this.element) {
      this.element.classList.remove(className);
    }
  }
  
  /**
   * Utility method for logging with timestamps
   * @param {string} message - Log message
   */
  log(message) {
    if (this.options.debug) {
      const timestamp = new Date().toISOString().substring(11, 23);
      console.log(`[${timestamp}] Component(${this.id}): ${message}`);
    }
  }
  
  /**
   * Safely gets a value from the game state
   * @param {string} path - Dot-separated path to the value
   * @param {*} defaultValue - Default value if not found
   * @returns {*} - The value from game state or default
   */
  getGameState(path, defaultValue) {
    if (!window.gameState) {
      return defaultValue;
    }
    
    const parts = path.split('.');
    let current = window.gameState;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  /**
   * Safely gets a value from the player state
   * @param {string} path - Dot-separated path to the value
   * @param {*} defaultValue - Default value if not found
   * @returns {*} - The value from player state or default
   */
  getPlayerState(path, defaultValue) {
    if (!window.player) {
      return defaultValue;
    }
    
    const parts = path.split('.');
    let current = window.player;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  /**
   * Safely creates and dispatches a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} detail - Event details
   */
  dispatchEvent(eventName, detail = {}) {
    if (this.element) {
      const event = new CustomEvent(eventName, { 
        detail,
        bubbles: true, 
        cancelable: true 
      });
      this.element.dispatchEvent(event);
    }
  }
}
