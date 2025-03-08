// SidebarLayout.js
// Handles the sidebar layout integration for the game UI

class SidebarLayout extends Component {
  constructor() {
    super('sidebarLayout');
    
    this.state = {
      initialized: false,
      sidebarVisible: true,
      mobileSidebarOpen: false,
      mobile: false,
      breakpoint: 768, // Mobile breakpoint in pixels
    };
  }
  
  initialize() {
    // Call base Component initialization
    super.initialize();
    
    // Check if already initialized by another script
    this.checkExistingLayout();
    
    if (!this.state.initialized) {
      // Create the layout structure
      this.createLayoutStructure();
    } else {
      // Just update the existing sidebar
      this.updateSidebar();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up resize handling for responsive behavior
    this.setupResizeHandling();
    
    // Subscribe to events
    this.setupEventSubscriptions();
    
    console.log("SidebarLayout initialized");
  }
  
  /**
   * Check if sidebar layout already exists
   */
  checkExistingLayout() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      console.error("Game container not found");
      return;
    }
    
    // Check if sidebar and main content already exist
    const existingSidebar = gameContainer.querySelector('.game-sidebar');
    const existingMainContent = gameContainer.querySelector('.game-main');
    
    if (existingSidebar && existingMainContent) {
      this.state.initialized = true;
      console.log("Existing sidebar layout found");
      
      // Store references
      this.sidebar = existingSidebar;
      this.mainContent = existingMainContent;
    }
  }
  
  /**
   * Create the layout structure with sidebar and main content
   */
  createLayoutStructure() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      console.error("Game container not found");
      return;
    }
    
    console.log("Creating sidebar layout structure");
    
    // Store original elements that need to be moved
    const header = gameContainer.querySelector('header');
    const narrative = document.getElementById('narrative');
    const actions = document.getElementById('actions');
    const statusBars = document.querySelector('.status-bars');
    
    // Clear game container
    gameContainer.innerHTML = '';
    
    // Add header back if it exists
    if (header) {
      gameContainer.appendChild(header);
    } else {
      // Create a new header if missing
      this.createHeader(gameContainer);
    }
    
    // Create sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'game-sidebar';
    
    // Create main content container
    this.mainContent = document.createElement('div');
    this.mainContent.className = 'game-main';
    
    // Add sidebar and main content to game container
    gameContainer.appendChild(this.sidebar);
    gameContainer.appendChild(this.mainContent);
    
    // Create the sidebar content
    this.createSidebarContent();
    
    // Move narrative and actions to main content
    if (narrative && actions) {
      const narrativeContainer = document.createElement('div');
      narrativeContainer.className = 'narrative-container';
      
      // Create wrapper for actions
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'actions-container';
      
      // Move to new structure
      if (narrative.parentNode) {
        narrative.parentNode.removeChild(narrative);
      }
      
      if (actions.parentNode) {
        actions.parentNode.removeChild(actions);
      }
      
      actionsContainer.appendChild(actions);
      narrativeContainer.appendChild(narrative);
      narrativeContainer.appendChild(actionsContainer);
      
      this.mainContent.appendChild(narrativeContainer);
    } else {
      console.warn("Narrative or actions not found");
      
      // Create empty containers if needed
      this.mainContent.innerHTML = `
        <div class="narrative-container">
          <div id="narrative" class="narrative"></div>
          <div class="actions-container">
            <div id="actions"></div>
          </div>
        </div>
      `;
    }
    
    // Add mobile sidebar toggle
    const sidebarToggle = document.createElement('div');
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '☰';
    sidebarToggle.addEventListener('click', () => {
      this.toggleMobileSidebar();
    });
    
    gameContainer.appendChild(sidebarToggle);
    
    // Add layout styles
    this.addLayoutStyles();
    
    this.state.initialized = true;
    console.log("Layout structure created");
  }
  
  /**
   * Create a header if it's missing
   */
  createHeader(gameContainer) {
    const header = document.createElement('header');
    header.innerHTML = `
      <h1>Kasvaari Camp</h1>
      <div id="location">Location: Kasvaari Camp, somewhere in the Western Hierarchate of Nesia</div>
      <div class="day-night-indicator" id="dayNightIndicator"></div>
      <div id="timeDisplay">Time: 8:00 AM</div>
      <div id="dayDisplay">Day 1</div>
    `;
    gameContainer.appendChild(header);
    console.log("Created new header");
  }
  
  /**
   * Create the sidebar content
   */
  createSidebarContent() {
    // Safety check for player object
    if (!window.player || !window.player.name) {
      this.sidebar.innerHTML = `
        <div class="character-summary">
          <div class="character-name">Unknown Soldier</div>
          <div class="character-details">Player data not initialized</div>
        </div>
        
        <div class="quick-status">
          <div class="status-bar">
            <div class="status-label">Health</div>
            <div class="bar-container">
              <div id="sidebarHealthBar" class="bar health-bar" style="width: 100%;"></div>
            </div>
            <div id="sidebarHealthValue" class="bar-value">100/100</div>
          </div>
          <div class="status-bar">
            <div class="status-label">Stamina</div>
            <div class="bar-container">
              <div id="sidebarStaminaBar" class="bar stamina-bar" style="width: 100%;"></div>
            </div>
            <div id="sidebarStaminaValue" class="bar-value">100/100</div>
          </div>
          <div class="status-bar">
            <div class="status-label">Morale</div>
            <div class="bar-container">
              <div id="sidebarMoraleBar" class="bar morale-bar" style="width: 75%;"></div>
            </div>
            <div id="sidebarMoraleValue" class="bar-value">75/100</div>
          </div>
        </div>
        
        <div class="sidebar-nav">
          <button class="sidebar-nav-button" data-action="profile">
            <span class="nav-icon">👤</span> Profile
          </button>
          <button class="sidebar-nav-button" data-action="inventory">
            <span class="nav-icon">🎒</span> Inventory
          </button>
          <button class="sidebar-nav-button" data-action="questLog">
            <span class="nav-icon">📜</span> Quest Log
          </button>
        </div>
      `;
      return;
    }
    
    // Create character summary with player data
    this.sidebar.innerHTML = `
      <div class="character-summary">
        <div class="character-name">${window.player.name}</div>
        <div class="character-details">${window.player.origin || ''} ${window.player.career ? window.player.career.title || '' : ''}</div>
      </div>
      
      <div class="quick-status">
        <div class="status-bar">
          <div class="status-label">Health</div>
          <div class="bar-container">
            <div id="sidebarHealthBar" class="bar health-bar" style="width: 100%;"></div>
          </div>
          <div id="sidebarHealthValue" class="bar-value">100/100</div>
        </div>
        <div class="status-bar">
          <div class="status-label">Stamina</div>
          <div class="bar-container">
            <div id="sidebarStaminaBar" class="bar stamina-bar" style="width: 100%;"></div>
          </div>
          <div id="sidebarStaminaValue" class="bar-value">100/100</div>
        </div>
        <div class="status-bar">
          <div class="status-label">Morale</div>
          <div class="bar-container">
            <div id="sidebarMoraleBar" class="bar morale-bar" style="width: 75%;"></div>
          </div>
          <div id="sidebarMoraleValue" class="bar-value">75/100</div>
        </div>
      </div>
      
      <div class="sidebar-nav">
        <button class="sidebar-nav-button" data-action="profile">
          <span class="nav-icon">👤</span> Profile
        </button>
        <button class="sidebar-nav-button" data-action="inventory">
          <span class="nav-icon">🎒</span> Inventory
        </button>
        <button class="sidebar-nav-button" data-action="questLog">
          <span class="nav-icon">📜</span> Quest Log
        </button>
      </div>
    `;
    
    // Set up sidebar nav buttons
    const navButtons = this.sidebar.querySelectorAll('.sidebar-nav-button');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = button.getAttribute('data-action');
        
        if (action === 'profile' || action === 'inventory' || action === 'questLog') {
          // Use panel system to open the corresponding panel
          this.system.eventBus.publish('openPanel', { panel: action });
        } else if (typeof window.handleAction === 'function') {
          // Use action system for other actions
          window.handleAction(action);
        }
      });
    });
  }
  
  /**
   * Update the sidebar content (called when player data changes)
   */
  updateSidebar() {
    // Only update if sidebar exists
    if (!this.sidebar) return;
    
    // Update character summary
    if (window.player && window.player.name) {
      const nameElem = this.sidebar.querySelector('.character-name');
      const detailsElem = this.sidebar.querySelector('.character-details');
      
      if (nameElem) {
        nameElem.textContent = window.player.name;
      }
      
      if (detailsElem) {
        detailsElem.textContent = `${window.player.origin || ''} ${window.player.career ? window.player.career.title || '' : ''}`;
      }
    }
    
    // Update status bars
    this.updateStatusBars();
  }
  
  /**
   * Update the status bars in the sidebar
   */
  updateStatusBars() {
    if (!window.gameState) return;
    
    // Get sidebar bars
    const healthBar = document.getElementById('sidebarHealthBar');
    const staminaBar = document.getElementById('sidebarStaminaBar');
    const moraleBar = document.getElementById('sidebarMoraleBar');
    const healthValue = document.getElementById('sidebarHealthValue');
    const staminaValue = document.getElementById('sidebarStaminaValue');
    const moraleValue = document.getElementById('sidebarMoraleValue');
    
    // Update health bar
    if (healthBar && healthValue) {
      healthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
      healthValue.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
    }
    
    // Update stamina bar
    if (staminaBar && staminaValue) {
      staminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
      staminaValue.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
    }
    
    // Update morale bar
    if (moraleBar && moraleValue) {
      moraleBar.style.width = `${window.gameState.morale}%`;
      moraleValue.textContent = `${Math.round(window.gameState.morale)}/100`;
    }
  }
  
  /**
   * Set up event listeners for sidebar interactions
   */
  setupEventListeners() {
    // Set up sidebar nav buttons
    if (this.sidebar) {
      const navButtons = this.sidebar.querySelectorAll('.sidebar-nav-button');
      navButtons.forEach(button => {
        // Remove existing click listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new click handler
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          const action = newButton.getAttribute('data-action');
          
          if (action === 'profile' || action === 'inventory' || action === 'questLog') {
            // Use panel system to open the corresponding panel
            this.system.eventBus.publish('openPanel', { panel: action });
          } else if (typeof window.handleAction === 'function') {
            // Use action system for other actions
            window.handleAction(action);
          }
          
          // Close mobile sidebar after clicking an action
          if (this.state.mobile && this.state.mobileSidebarOpen) {
            this.toggleMobileSidebar(false);
          }
        });
      });
    }
    
    // Set up sidebar toggle if it exists
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
      // Remove existing listeners
      const newToggle = sidebarToggle.cloneNode(true);
      sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
      
      // Add new click handler
      newToggle.addEventListener('click', () => {
        this.toggleMobileSidebar();
      });
    }
  }
  
  /**
   * Set up window resize handling for responsive behavior
   */
  setupResizeHandling() {
    // Set initial mobile state
    this.checkMobileState();
    
    // Add resize listener
    window.addEventListener('resize', () => {
      this.checkMobileState();
    });
  }
  
  /**
   * Check if we're in mobile mode based on window width
   */
  checkMobileState() {
    const wasInMobile = this.state.mobile;
    this.state.mobile = window.innerWidth <= this.state.breakpoint;
    
    // If transitioning to desktop from mobile, ensure sidebar is visible
    if (wasInMobile && !this.state.mobile) {
      this.state.mobileSidebarOpen = false;
      this.updateMobileSidebarVisibility();
    }
  }
  
  /**
   * Toggle mobile sidebar visibility
   * @param {boolean} state - Force a specific state (optional)
   */
  toggleMobileSidebar(state) {
    if (!this.state.mobile) return;
    
    if (state !== undefined) {
      this.state.mobileSidebarOpen = state;
    } else {
      this.state.mobileSidebarOpen = !this.state.mobileSidebarOpen;
    }
    
    this.updateMobileSidebarVisibility();
  }
  
  /**
   * Update the visibility of the sidebar in mobile mode
   */
  updateMobileSidebarVisibility() {
    if (!this.sidebar) return;
    
    if (this.state.mobile) {
      if (this.state.mobileSidebarOpen) {
        this.sidebar.classList.add('show');
      } else {
        this.sidebar.classList.remove('show');
      }
    } else {
      // Always show in desktop mode
      this.sidebar.classList.remove('show');
    }
  }
  
  /**
   * Add CSS styles for the layout
   */
  addLayoutStyles() {
    // Check if styles already exist
    if (document.getElementById('sidebar-layout-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'sidebar-layout-styles';
    
    // Add CSS rules
    style.textContent = `
      /* Game container with sidebar and central content */
      #gameContainer {
        display: grid;
        grid-template-columns: 250px 1fr;
        grid-template-rows: auto 1fr;
        grid-template-areas:
          "header header"
          "sidebar main";
        gap: 20px;
        max-width: 1200px;
        margin: 0 auto;
        height: calc(100vh - 40px);
        padding: 20px;
        min-height: 100vh;
      }
      
      /* Header area */
      header {
        grid-area: header;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background: var(--panel-bg, #1e293b);
        border-bottom: 2px solid var(--paanic-gold, #c9a959);
        margin-bottom: 20px;
        border-radius: 8px;
      }
      
      /* Sidebar */
      .game-sidebar {
        grid-area: sidebar;
        background: var(--panel-bg, #1e293b);
        border: 1px solid var(--panel-border, #3a2e40);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        position: relative;
        transition: transform 0.3s ease;
      }
      
      /* Main content area */
      .game-main {
        grid-area: main;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }
      
      /* Narrative container */
      .narrative-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      /* Actions container */
      .actions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        background: var(--panel-bg, #1e293b);
        border-radius: 8px;
        padding: 15px;
      }
      
      /* Sidebar toggle button (mobile only) */
      .sidebar-toggle {
        display: none;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1001;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--paanic-accent, #b02e26);
        color: white;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
        cursor: pointer;
      }
      
      /* Character summary in sidebar */
      .character-summary {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--panel-border, #3a2e40);
      }
      
      .character-name {
        font-size: 1.4em;
        font-weight: bold;
        color: var(--paanic-gold, #c9a959);
      }
      
      .character-details {
        font-size: 0.9em;
        color: var(--text-secondary, #a0a0a0);
      }
      
      /* Quick status in sidebar */
      .quick-status {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 15px 0;
      }
      
      .status-bar {
        display: flex;
        align-items: center;
      }
      
      .status-label {
        width: 60px;
        font-weight: bold;
        font-size: 0.9em;
      }
      
      .bar-container {
        flex-grow: 1;
        height: 12px;
        background: #333;
        border-radius: 6px;
        overflow: hidden;
        margin: 0 8px;
      }
      
      .bar {
        height: 100%;
        border-radius: 6px;
        transition: width 0.3s ease;
      }
      
      .health-bar { background: var(--health-color, linear-gradient(to right, #ff5f6d, #ffc371)); }
      .stamina-bar { background: var(--stamina-color, linear-gradient(to right, #56ab2f, #a8e063)); }
      .morale-bar { background: var(--morale-color, linear-gradient(to right, #4776E6, #8E54E9)); }
      
      .bar-value {
        width: 60px;
        text-align: right;
        font-size: 0.9em;
      }
      
      /* Sidebar navigation buttons */
      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .sidebar-nav-button {
        text-align: left;
        padding: 10px 15px;
        background: var(--button-primary, #3a2e40);
        color: var(--text-primary, #e0e0e0);
        border: none;
        border-left: 3px solid transparent;
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .sidebar-nav-button:hover {
        background: var(--button-hover, #4d3e54);
        border-left: 3px solid var(--paanic-gold, #c9a959);
      }
      
      .sidebar-nav-button.active {
        background: var(--button-active, #5d4b66);
        border-left: 3px solid var(--paanic-gold, #c9a959);
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        #gameContainer {
          grid-template-columns: 1fr;
          grid-template-areas:
            "header"
            "main";
        }
        
        .game-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 250px;
          transform: translateX(-100%);
          z-index: 1000;
        }
        
        .game-sidebar.show {
          transform: translateX(0);
        }
        
        .game-main {
          margin-left: 0;
        }
        
        .sidebar-toggle {
          display: flex;
        }
      }
    `;
    
    // Add to document head
    document.head.appendChild(style);
    console.log("Added layout styles");
  }
  
  /**
   * Set up event subscriptions
   */
  setupEventSubscriptions() {
    // Subscribe to status bar update events
    this.system.eventBus.subscribe('updateStatusBars', () => {
      this.updateStatusBars();
    });
    
    // Subscribe to player update events
    this.system.eventBus.subscribe('playerUpdated', () => {
      this.updateSidebar();
    });
    
    // Subscribe to game start event
    this.system.eventBus.subscribe('gameStarted', () => {
      this.updateSidebar();
    });
  }
  
  /**
   * Update method called by the UI system
   */
  update(data) {
    // Update status bars
    this.updateStatusBars();
  }
}

// Export the component
window.SidebarLayout = SidebarLayout;
