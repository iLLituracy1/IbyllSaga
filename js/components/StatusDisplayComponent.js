// StatusDisplayComponent.js
// Manages the health, stamina and morale bars

class StatusDisplayComponent extends Component {
  /**
   * Constructor for status display component
   * @param {string} id - Component ID
   * @param {Object} options - Component options
   */
  constructor(id = 'status-display', options = {}) {
    // Call parent constructor
    super(id, {
      autoCreate: true,
      debug: options.debug || false,
      initialState: {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        morale: 75,
        maxMorale: 100,
        ...options.initialState
      }
    });
    
    // References to bar elements
    this.bars = {
      health: null,
      stamina: null,
      morale: null
    };
    
    // References to value display elements
    this.values = {
      health: null,
      stamina: null,
      morale: null
    };
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    // Call parent initialize
    super.initialize();
    
    // Wait for sidebar layout to be initialized
    if (this.system && this.system.components && this.system.components.sidebar) {
      // No need to wait for sidebar specifically - we'll just proceed
    } else {
      console.log("StatusDisplayComponent: Sidebar component not found, proceeding anyway");
    }
    
    // Find or create the status display element
    this.element = document.getElementById(this.id);
    if (!this.element) {
      this.createRootElement();
    }
    
    // Get references to bar elements
    this.findBarElements();
    
    // Subscribe to game state updates
    if (this.system && this.system.eventBus) {
      this.system.eventBus.subscribe('gameState:updated', this.update.bind(this));
      this.system.eventBus.subscribe('status:update', this.update.bind(this));
    }
    
    // Perform initial render with current game state
    if (window.gameState) {
      this.update(window.gameState);
    } else {
      this.render();
    }
    
    this.log('Status display component initialized');
    return true;
  }
  
  /**
   * Find bar and value elements by ID
   */
  findBarElements() {
    // Find bar elements
    this.bars.health = document.getElementById(`${this.id}-health-bar`) || 
                       document.getElementById('sidebarHealthBar');
    this.bars.stamina = document.getElementById(`${this.id}-stamina-bar`) || 
                        document.getElementById('sidebarStaminaBar');
    this.bars.morale = document.getElementById(`${this.id}-morale-bar`) || 
                      document.getElementById('sidebarMoraleBar');
    
    // Find value elements
    this.values.health = document.getElementById(`${this.id}-health-value`) || 
                        document.getElementById('sidebarHealthValue');
    this.values.stamina = document.getElementById(`${this.id}-stamina-value`) || 
                          document.getElementById('sidebarStaminaValue');
    this.values.morale = document.getElementById(`${this.id}-morale-value`) ||
                        document.getElementById('sidebarMoraleValue');
    
    // Log elements found
    const foundHealth = this.bars.health && this.values.health;
    const foundStamina = this.bars.stamina && this.values.stamina;
    const foundMorale = this.bars.morale && this.values.morale;
    
    this.log(`StatusDisplayComponent: Health elements found: ${foundHealth}`);
    this.log(`StatusDisplayComponent: Stamina elements found: ${foundStamina}`);
    this.log(`StatusDisplayComponent: Morale elements found: ${foundMorale}`);
    
    // Return true if all elements found
    return foundHealth && foundStamina && foundMorale;
  }
  
  /**
   * Create the root element for this component
   */
  createRootElement() {
    this.log('Creating status display element');
    
    // First check if sidebar already has status bars we can use
    const sidebarBars = document.querySelectorAll('.quick-status .status-bar');
    if (sidebarBars.length >= 3) {
      this.log('Using existing sidebar status bars');
      // We don't need to create elements, we'll use the sidebar ones
      return;
    }
    
    // Create root element
    const element = document.createElement('div');
    element.id = this.id;
    element.className = 'status-bars';
    
    // Create HTML structure for status bars
    element.innerHTML = `
      <div class="status-bar">
        <div class="status-label">Health</div>
        <div class="bar-container">
          <div id="${this.id}-health-bar" class="bar health-bar" style="width: 100%;"></div>
        </div>
        <div id="${this.id}-health-value" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Stamina</div>
        <div class="bar-container">
          <div id="${this.id}-stamina-bar" class="bar stamina-bar" style="width: 100%;"></div>
        </div>
        <div id="${this.id}-stamina-value" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Morale</div>
        <div class="bar-container">
          <div id="${this.id}-morale-bar" class="bar morale-bar" style="width: 75%;"></div>
        </div>
        <div id="${this.id}-morale-value" class="bar-value">75/100</div>
      </div>
    `;
    
    // Find where to insert the element
    const gameContainer = document.getElementById('gameContainer');
    const mainContent = document.querySelector('.game-main');
    const narrativeContainer = document.querySelector('.narrative-container');
    
    // Choose insertion point based on what exists
    if (narrativeContainer) {
      narrativeContainer.insertBefore(element, narrativeContainer.firstChild);
    } else if (mainContent) {
      mainContent.insertBefore(element, mainContent.firstChild);
    } else if (gameContainer) {
      gameContainer.appendChild(element);
    } else {
      document.body.appendChild(element);
      this.log('Could not find appropriate parent, appended to body');
    }
    
    // Store reference to the element
    this.element = element;
    
    this.log('Status display element created');
  }
  
  /**
   * Update status bars with new values
   * @param {Object} data - Game state data
   */
  update(data) {
    // Filter out the data we need
    const filteredData = this.filterData(data);
    
    // Update component state
    Object.assign(this.state, filteredData);
    
    // Render the updated state
    this.render();
    
    // Create sidebar status if necessary
    this.syncWithSidebar();
  }
  
  /**
   * Filter game state data for just what this component needs
   * @param {Object} data - Game state data
   * @returns {Object} - Filtered data for this component
   */
  filterData(data) {
    // If we're given complete game state
    if (data && data.health !== undefined) {
      return {
        health: data.health,
        maxHealth: data.maxHealth || this.state.maxHealth,
        stamina: data.stamina,
        maxStamina: data.maxStamina || this.state.maxStamina,
        morale: data.morale,
        maxMorale: data.maxMorale || this.state.maxMorale
      };
    }
    
    // Default: get data from window.gameState
    return {
      health: this.getGameState('health', this.state.health),
      maxHealth: this.getGameState('maxHealth', this.state.maxHealth),
      stamina: this.getGameState('stamina', this.state.stamina),
      maxStamina: this.getGameState('maxStamina', this.state.maxStamina),
      morale: this.getGameState('morale', this.state.morale),
      maxMorale: this.getGameState('maxMorale', this.state.maxMorale)
    };
  }
  
  /**
   * Render the status bars with current state
   */
  render() {
    this.log('Rendering status bars');
    
    // Re-attempt to find elements if they're not available
    if (!this.bars.health || !this.bars.stamina || !this.bars.morale ||
        !this.values.health || !this.values.stamina || !this.values.morale) {
      this.findBarElements();
    }
    
    try {
      // Update health bar if elements exist
      if (this.bars.health && this.values.health) {
        const healthPercent = (this.state.health / this.state.maxHealth) * 100;
        this.bars.health.style.width = `${healthPercent}%`;
        this.values.health.textContent = `${Math.round(this.state.health)}/${this.state.maxHealth}`;
        this.updateBarColor(this.bars.health, healthPercent/100, [
          { threshold: 0.25, className: 'critical' },
          { threshold: 0.5, className: 'warning' }
        ]);
      }
      
      // Update stamina bar if elements exist
      if (this.bars.stamina && this.values.stamina) {
        const staminaPercent = (this.state.stamina / this.state.maxStamina) * 100;
        this.bars.stamina.style.width = `${staminaPercent}%`;
        this.values.stamina.textContent = `${Math.round(this.state.stamina)}/${this.state.maxStamina}`;
        this.updateBarColor(this.bars.stamina, staminaPercent/100, [
          { threshold: 0.25, className: 'critical' },
          { threshold: 0.5, className: 'warning' }
        ]);
      }
      
      // Update morale bar if elements exist
      if (this.bars.morale && this.values.morale) {
        const moralePercent = (this.state.morale / this.state.maxMorale) * 100;
        this.bars.morale.style.width = `${moralePercent}%`;
        this.values.morale.textContent = `${Math.round(this.state.morale)}/100`;
        this.updateBarColor(this.bars.morale, moralePercent/100, [
          { threshold: 0.25, className: 'critical' },
          { threshold: 0.5, className: 'warning' }
        ]);
      }
    } catch (error) {
      console.error('Error rendering status bars:', error);
    }
  }
  
  /**
   * Update an individual bar's color based on its value
   * @param {HTMLElement} bar - The bar element
   * @param {number} ratio - Current value ratio (0-1)
   * @param {Array} thresholds - Array of threshold objects
   */
  updateBarColor(bar, ratio, thresholds) {
    // Remove existing state classes
    bar.classList.remove('critical', 'warning');
    
    // Add appropriate class based on thresholds
    for (const { threshold, className } of thresholds) {
      if (ratio <= threshold) {
        bar.classList.add(className);
        break;
      }
    }
  }
  
  /**
   * Sync status with sidebar display
   */
  syncWithSidebar() {
    // Update sidebar display if our elements are different from sidebar elements
    const sidebarHealthBar = document.getElementById('sidebarHealthBar');
    const sidebarStaminaBar = document.getElementById('sidebarStaminaBar');
    const sidebarMoraleBar = document.getElementById('sidebarMoraleBar');
    
    // Only sync if sidebar elements exist and are different from our elements
    if (sidebarHealthBar && sidebarHealthBar !== this.bars.health) {
      const healthPercent = (this.state.health / this.state.maxHealth) * 100;
      sidebarHealthBar.style.width = `${healthPercent}%`;
      
      const sidebarHealthValue = document.getElementById('sidebarHealthValue');
      if (sidebarHealthValue) {
        sidebarHealthValue.textContent = `${Math.round(this.state.health)}/${this.state.maxHealth}`;
      }
    }
    
    if (sidebarStaminaBar && sidebarStaminaBar !== this.bars.stamina) {
      const staminaPercent = (this.state.stamina / this.state.maxStamina) * 100;
      sidebarStaminaBar.style.width = `${staminaPercent}%`;
      
      const sidebarStaminaValue = document.getElementById('sidebarStaminaValue');
      if (sidebarStaminaValue) {
        sidebarStaminaValue.textContent = `${Math.round(this.state.stamina)}/${this.state.maxStamina}`;
      }
    }
    
    if (sidebarMoraleBar && sidebarMoraleBar !== this.bars.morale) {
      const moralePercent = (this.state.morale / this.state.maxMorale) * 100;
      sidebarMoraleBar.style.width = `${moralePercent}%`;
      
      const sidebarMoraleValue = document.getElementById('sidebarMoraleValue');
      if (sidebarMoraleValue) {
        sidebarMoraleValue.textContent = `${Math.round(this.state.morale)}/100`;
      }
    }
  }
  
  /**
   * Get a value from game state safely
   * @param {string} key - The key to get from game state
   * @param {*} defaultValue - Default value if not found
   */
  getGameState(key, defaultValue) {
    if (!window.gameState) return defaultValue;
    return window.gameState[key] !== undefined ? window.gameState[key] : defaultValue;
  }
}

// Export the component for use in other modules
window.StatusDisplayComponent = StatusDisplayComponent;