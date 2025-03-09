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
   * Create the root element for this component
   */
  createRootElement() {
    this.log('Creating status display element');
    
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
    let parentElement = document.getElementById('gameContainer');
    let narrativeElement = document.getElementById('narrative');
    
    // Insert before narrative if both elements exist
    if (parentElement && narrativeElement && narrativeElement.parentNode === parentElement) {
      parentElement.insertBefore(element, narrativeElement);
    } 
    // Fallback: append to game container
    else if (parentElement) {
      parentElement.appendChild(element);
    } 
    // Last resort: append to body
    else {
      document.body.appendChild(element);
    }
    
    // Store reference to the element
    this.element = element;
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    // Call parent initialize
    super.initialize();
    
    if (!this.element) {
      console.error('Failed to initialize status display');
      // Try to create the root element as a recovery step
      this.createRootElement();
      
      if (!this.element) {
        return false;
      }
    }
    
    // Get references to bar elements
    this.bars.health = document.getElementById(`${this.id}-health-bar`);
    this.bars.stamina = document.getElementById(`${this.id}-stamina-bar`);
    this.bars.morale = document.getElementById(`${this.id}-morale-bar`);
    
    // Get references to value display elements
    this.values.health = document.getElementById(`${this.id}-health-value`);
    this.values.stamina = document.getElementById(`${this.id}-stamina-value`);
    this.values.morale = document.getElementById(`${this.id}-morale-value`);
    
    // Create missing elements instead of failing
    let elementsCreated = false;
    
    // Create bar elements if they don't exist
    if (!this.bars.health) {
      this.bars.health = document.createElement('div');
      this.bars.health.id = `${this.id}-health-bar`;
      this.bars.health.className = 'status-bar health-bar';
      this.element.appendChild(this.bars.health);
      elementsCreated = true;
    }
    
    if (!this.bars.stamina) {
      this.bars.stamina = document.createElement('div');
      this.bars.stamina.id = `${this.id}-stamina-bar`;
      this.bars.stamina.className = 'status-bar stamina-bar';
      this.element.appendChild(this.bars.stamina);
      elementsCreated = true;
    }
    
    if (!this.bars.morale) {
      this.bars.morale = document.createElement('div');
      this.bars.morale.id = `${this.id}-morale-bar`;
      this.bars.morale.className = 'status-bar morale-bar';
      this.element.appendChild(this.bars.morale);
      elementsCreated = true;
    }
    
    // Create value elements if they don't exist
    if (!this.values.health) {
      this.values.health = document.createElement('div');
      this.values.health.id = `${this.id}-health-value`;
      this.values.health.className = 'status-value health-value';
      this.element.appendChild(this.values.health);
      elementsCreated = true;
    }
    
    if (!this.values.stamina) {
      this.values.stamina = document.createElement('div');
      this.values.stamina.id = `${this.id}-stamina-value`;
      this.values.stamina.className = 'status-value stamina-value';
      this.element.appendChild(this.values.stamina);
      elementsCreated = true;
    }
    
    if (!this.values.morale) {
      this.values.morale = document.createElement('div');
      this.values.morale.id = `${this.id}-morale-value`;
      this.values.morale.className = 'status-value morale-value';
      this.element.appendChild(this.values.morale);
      elementsCreated = true;
    }
    
    if (elementsCreated) {
      console.log('Created missing status elements');
    }
    
    this.log('Status display initialized');
    return true;
  }
  
  /**
   * Update status bars with new values
   * @param {Object} data - Game state data
   */
  update(data) {
    // Filter out the data we need
    const filteredData = this.filterData(data);
    
    // Update component state
    super.update(filteredData);
    
    // Render the updated state
    this.render();
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
      maxMorale: 100 // Morale is always out of 100
    };
  }
  
  /**
   * Render the status bars with current state
   */
  render() {
    this.log('Rendering status bars');
    
    // Check if bars are available
    if (!this.bars.health || !this.bars.stamina || !this.bars.morale) {
      console.log('Creating missing status bars...');
      
      // Try to initialize them now as a recovery measure
      if (!this.element) {
        this.createRootElement();
      }
      
      // Create status bars if they don't exist
      if (this.element) {
        // Create bars if they don't exist
        if (!this.bars.health) {
          this.bars.health = document.createElement('div');
          this.bars.health.id = `${this.id}-health-bar`;
          this.bars.health.className = 'status-bar health-bar';
          this.element.appendChild(this.bars.health);
        }
        
        if (!this.bars.stamina) {
          this.bars.stamina = document.createElement('div');
          this.bars.stamina.id = `${this.id}-stamina-bar`;
          this.bars.stamina.className = 'status-bar stamina-bar';
          this.element.appendChild(this.bars.stamina);
        }
        
        if (!this.bars.morale) {
          this.bars.morale = document.createElement('div');
          this.bars.morale.id = `${this.id}-morale-bar`;
          this.bars.morale.className = 'status-bar morale-bar';
          this.element.appendChild(this.bars.morale);
        }
        console.log('Status bars created successfully');
      } else {
        console.error('Cannot create status bars: root element is missing');
        return;
      }
    }
    
    // Check if value displays are available
    if (!this.values.health || !this.values.stamina || !this.values.morale) {
      console.log('Creating missing status value displays...');
      
      // Create value displays if they don't exist
      if (this.element) {
        if (!this.values.health) {
          this.values.health = document.createElement('div');
          this.values.health.id = `${this.id}-health-value`;
          this.values.health.className = 'status-value health-value';
          this.element.appendChild(this.values.health);
        }
        
        if (!this.values.stamina) {
          this.values.stamina = document.createElement('div');
          this.values.stamina.id = `${this.id}-stamina-value`;
          this.values.stamina.className = 'status-value stamina-value';
          this.element.appendChild(this.values.stamina);
        }
        
        if (!this.values.morale) {
          this.values.morale = document.createElement('div');
          this.values.morale.id = `${this.id}-morale-value`;
          this.values.morale.className = 'status-value morale-value';
          this.element.appendChild(this.values.morale);
        }
        console.log('Status value displays created successfully');
      } else {
        console.error('Cannot create status value displays: root element is missing');
        return;
      }
    }
    
    try {
      // Update health bar
      const healthPercent = (this.state.health / this.state.maxHealth) * 100;
      if (this.bars.health) {
        this.bars.health.style.width = `${healthPercent}%`;
      }
      if (this.values.health) {
        this.values.health.textContent = `${Math.round(this.state.health)}/${this.state.maxHealth}`;
      }
      
      // Update stamina bar
      const staminaPercent = (this.state.stamina / this.state.maxStamina) * 100;
      if (this.bars.stamina) {
        this.bars.stamina.style.width = `${staminaPercent}%`;
      }
      if (this.values.stamina) {
        this.values.stamina.textContent = `${Math.round(this.state.stamina)}/${this.state.maxStamina}`;
      }
      
      // Update morale bar
      const moralePercent = (this.state.morale / this.state.maxMorale) * 100;
      if (this.bars.morale) {
        this.bars.morale.style.width = `${moralePercent}%`;
      }
      if (this.values.morale) {
        this.values.morale.textContent = `${Math.round(this.state.morale)}/100`;
      }
      
      // Add color classes based on percentages
      this.updateBarColors();
    } catch (error) {
      console.error('Error rendering status bars:', error);
    }
  }
  
  /**
   * Update bar colors based on current values
   */
  updateBarColors() {
    // Health bar colors
    this.updateBarColor(this.bars.health, this.state.health / this.state.maxHealth, [
      { threshold: 0.25, className: 'critical' },
      { threshold: 0.5, className: 'warning' }
    ]);
    
    // Stamina bar colors
    this.updateBarColor(this.bars.stamina, this.state.stamina / this.state.maxStamina, [
      { threshold: 0.25, className: 'critical' },
      { threshold: 0.5, className: 'warning' }
    ]);
    
    // Morale bar colors
    this.updateBarColor(this.bars.morale, this.state.morale / this.state.maxMorale, [
      { threshold: 0.25, className: 'critical' },
      { threshold: 0.5, className: 'warning' }
    ]);
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
   * Create a secondary status display for the sidebar
   * @param {string} containerId - ID of the container element
   * @returns {boolean} - Success status
   */
  createSidebarDisplay(containerId = 'game-sidebar') {
    this.log('Creating sidebar status display');
    
    // Find the container
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Sidebar container not found: ${containerId}`);
      return false;
    }
    
    // Create the sidebar status display
    const sidebarStatus = document.createElement('div');
    sidebarStatus.className = 'quick-status';
    sidebarStatus.innerHTML = `
      <div class="status-bar">
        <div class="status-label">Health</div>
        <div class="bar-container">
          <div id="sidebarHealthBar" class="bar health-bar" style="width: ${(this.state.health / this.state.maxHealth) * 100}%;"></div>
        </div>
        <div id="sidebarHealthValue" class="bar-value">${Math.round(this.state.health)}/${this.state.maxHealth}</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Stamina</div>
        <div class="bar-container">
          <div id="sidebarStaminaBar" class="bar stamina-bar" style="width: ${(this.state.stamina / this.state.maxStamina) * 100}%;"></div>
        </div>
        <div id="sidebarStaminaValue" class="bar-value">${Math.round(this.state.stamina)}/${this.state.maxStamina}</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Morale</div>
        <div class="bar-container">
          <div id="sidebarMoraleBar" class="bar morale-bar" style="width: ${this.state.morale}%;"></div>
        </div>
        <div id="sidebarMoraleValue" class="bar-value">${Math.round(this.state.morale)}/100</div>
      </div>
    `;
    
    // Find insertion point - after character-summary if it exists, or as first child
    const characterSummary = container.querySelector('.character-summary');
    if (characterSummary) {
      characterSummary.after(sidebarStatus);
    } else {
      container.prepend(sidebarStatus);
    }
    
    this.log('Sidebar status display created');
    return true;
  }
  
  /**
   * Update the sidebar status display
   */
  updateSidebarDisplay() {
    const sidebarHealthBar = document.getElementById('sidebarHealthBar');
    const sidebarStaminaBar = document.getElementById('sidebarStaminaBar');
    const sidebarMoraleBar = document.getElementById('sidebarMoraleBar');
    
    const sidebarHealthValue = document.getElementById('sidebarHealthValue');
    const sidebarStaminaValue = document.getElementById('sidebarStaminaValue');
    const sidebarMoraleValue = document.getElementById('sidebarMoraleValue');
    
    // Update if elements exist
    if (sidebarHealthBar && sidebarHealthValue) {
      sidebarHealthBar.style.width = `${(this.state.health / this.state.maxHealth) * 100}%`;
      sidebarHealthValue.textContent = `${Math.round(this.state.health)}/${this.state.maxHealth}`;
    }
    
    if (sidebarStaminaBar && sidebarStaminaValue) {
      sidebarStaminaBar.style.width = `${(this.state.stamina / this.state.maxStamina) * 100}%`;
      sidebarStaminaValue.textContent = `${Math.round(this.state.stamina)}/${this.state.maxStamina}`;
    }
    
    if (sidebarMoraleBar && sidebarMoraleValue) {
      sidebarMoraleBar.style.width = `${this.state.morale}%`;
      sidebarMoraleValue.textContent = `${Math.round(this.state.morale)}/100`;
    }
  }
}

window.StatusDisplayComponent = StatusDisplayComponent;