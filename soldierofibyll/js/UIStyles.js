// UIStyles.js
// Centralized management of UI styles

// Create global namespace for UI styles
window.UIStyles = {
  // Theme configuration
  theme: {
    current: 'dark', // 'dark' or 'light'
    dark: {
      // Background colors
      bgPrimary: '#1e293b',    // Main background
      bgSecondary: '#334155',  // Secondary backgrounds
      bgTertiary: '#475569',   // Tertiary backgrounds
      bgPanel: '#1e293b',      // Panel backgrounds
      
      // Text colors
      textPrimary: '#e2e8f0',    // Main text
      textSecondary: '#94a3b8',  // Secondary text
      textMuted: '#64748b',      // Muted text
      
      // Border colors
      borderPrimary: '#3a2e40',    // Main borders
      borderSecondary: '#475569',  // Secondary borders
      
      // Brand colors
      paanicGold: '#c9a959',      // Primary brand color
      paanicAccent: '#b02e26',    // Secondary brand color
      
      // Status colors
      health: 'linear-gradient(to right, #ff5f6d, #ffc371)',
      stamina: 'linear-gradient(to right, #56ab2f, #a8e063)',
      morale: 'linear-gradient(to right, #4776E6, #8E54E9)',
      
      // UI element colors
      buttonPrimary: '#3a2e40',     // Primary buttons
      buttonHover: '#4d3e54',       // Button hover state
      buttonActive: '#5d4b66',      // Button active state
      
      // Time of day colors
      dawn: '#f59e0b',
      day: '#0ea5e9',
      evening: '#8b5cf6',
      night: '#1e293b'
    },
    light: {
      // Background colors
      bgPrimary: '#f8fafc',    // Main background
      bgSecondary: '#f1f5f9',  // Secondary backgrounds
      bgTertiary: '#e2e8f0',   // Tertiary backgrounds
      bgPanel: '#ffffff',      // Panel backgrounds
      
      // Text colors
      textPrimary: '#0f172a',    // Main text
      textSecondary: '#334155',  // Secondary text
      textMuted: '#64748b',      // Muted text
      
      // Border colors
      borderPrimary: '#cbd5e1',    // Main borders
      borderSecondary: '#e2e8f0',  // Secondary borders
      
      // Brand colors
      paanicGold: '#b7922d',      // Primary brand color
      paanicAccent: '#991b15',    // Secondary brand color
      
      // Status colors
      health: 'linear-gradient(to right, #ff5f6d, #ffc371)',
      stamina: 'linear-gradient(to right, #56ab2f, #a8e063)',
      morale: 'linear-gradient(to right, #4776E6, #8E54E9)',
      
      // UI element colors
      buttonPrimary: '#e2e8f0',     // Primary buttons
      buttonHover: '#cbd5e1',       // Button hover state
      buttonActive: '#94a3b8',      // Button active state
      
      // Time of day colors
      dawn: '#fbbf24',
      day: '#0ea5e9', 
      evening: '#a78bfa',
      night: '#334155'
    }
  },
  
  // Initialize the styles
  init: function() {
    // Apply current theme
    this.applyTheme(this.theme.current);
    
    // Add main game UI styles
    this.addGameStyles();
    
    // Add responsive styles
    this.addResponsiveStyles();
    
    return this;
  },
  
  // Apply the specified theme
  applyTheme: function(themeName) {
    // Update current theme
    this.theme.current = themeName;
    
    // Get theme
    const theme = this.theme[themeName];
    if (!theme) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }
    
    // Apply theme as CSS variables
    const root = document.documentElement;
    
    // Apply all theme properties as CSS variables
    for (const key in theme) {
      root.style.setProperty(`--${key}`, theme[key]);
    }
    
    // Add theme class to body
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeName}`);
    
    // Dispatch theme change event
    window.publishEvent('ui:themeChange', { theme: themeName });
    
    return this;
  },
  
  // Toggle between dark and light themes
  toggleTheme: function() {
    const newTheme = this.theme.current === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return this;
  },
  
  // Add main game UI styles
  addGameStyles: function() {
    if (document.getElementById('ui-main-styles')) {
      return; // Already added
    }
    
    const style = document.createElement('style');
    style.id = 'ui-main-styles';
    style.textContent = `
      /* Base styles */
      :root {
        font-family: 'Crimson Text', serif;
        color: var(--textPrimary);
        line-height: 1.5;
      }
      
      body {
        background-color: var(--bgPrimary);
        margin: 0;
        padding: 0;
        font-size: 16px;
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        color: var(--paanicGold);
        font-weight: 600;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
      }
      
      p {
        margin-top: 0.5em;
        margin-bottom: 1em;
      }
      
      a {
        color: var(--paanicGold);
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      /* Layout */
      .hidden {
        display: none !important;
      }
      
      /* Header styles */
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background: var(--bgPanel);
        border-bottom: 2px solid var(--paanicGold);
        margin-bottom: 20px;
      }
      
      header h1 {
        margin: 0;
        font-size: 1.5em;
      }
      
      /* Main container */
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
        min-height: calc(100vh - 40px);
        padding: 20px;
      }
      
      /* Game sidebar */
      .game-sidebar {
        grid-area: sidebar;
        background: var(--bgPanel);
        border: 1px solid var(--borderPrimary);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }
      
      /* Game main content */
      .game-main {
        grid-area: main;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }
      
      /* Narrative */
      .narrative-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .narrative {
        flex: 1;
        background: var(--bgPanel);
        border: 1px solid var(--borderPrimary);
        border-radius: 8px;
        padding: 20px;
        overflow-y: auto;
        line-height: 1.6;
      }
      
      /* Narrative time-of-day variations */
      .narrative-dawn {
        background: linear-gradient(to bottom, var(--dawn), var(--bgPanel));
        color: var(--textPrimary);
      }
      
      .narrative-day {
        background: linear-gradient(to bottom, var(--day), var(--bgPanel));
        color: var(--textPrimary);
      }
      
      .narrative-evening {
        background: linear-gradient(to bottom, var(--evening), var(--bgPanel));
        color: var(--textPrimary);
      }
      
      .narrative-night {
        background: linear-gradient(to bottom, var(--night), var(--bgPanel));
        color: var(--textPrimary);
      }
      
      /* Actions container */
      .actions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        background: var(--bgPanel);
        border-radius: 8px;
        padding: 15px;
      }
      
      /* Action buttons */
      .action-btn {
        padding: 8px 16px;
        background: var(--buttonPrimary);
        color: var(--textPrimary);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        font-size: 1em;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .action-btn:hover {
        background: var(--buttonHover);
        transform: translateY(-2px);
      }
      
      .action-btn:active {
        background: var(--buttonActive);
        transform: translateY(0);
      }
      
      .action-icon {
        font-size: 1.2em;
      }
      
      /* Status bars */
      .status-bars {
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--bgPanel);
        border: 1px solid var(--borderPrimary);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      
      .status-bar {
        display: flex;
        align-items: center;
      }
      
      .status-label {
        width: 70px;
        font-weight: bold;
      }
      
      .bar-container {
        flex-grow: 1;
        height: 12px;
        background: #333;
        border-radius: 6px;
        overflow: hidden;
        margin: 0 10px;
      }
      
      .bar {
        height: 100%;
        border-radius: 6px;
        transition: width 0.3s ease;
      }
      
      .health-bar {
        background: var(--health);
      }
      
      .stamina-bar {
        background: var(--stamina);
      }
      
      .morale-bar {
        background: var(--morale);
      }
      
      .bar-value {
        width: 60px;
        text-align: right;
      }
      
      /* Critical status */
      .critical {
        background: #ff5f6d !important;
        animation: pulse 2s infinite;
      }
      
      .warning {
        background: #ffc371 !important;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
      
      /* Time display */
      .time-display-container {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .day-night-indicator {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--day);
      }
      
      .time-dawn {
        background: var(--dawn);
      }
      
      .time-day {
        background: var(--day);
      }
      
      .time-evening {
        background: var(--evening);
      }
      
      .time-night {
        background: var(--night);
      }
      
      .time-info {
        display: flex;
        flex-direction: column;
      }
      
      /* Character profile in sidebar */
      .character-summary {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--borderPrimary);
      }
      
      .character-name {
        font-size: 1.4em;
        font-weight: bold;
        color: var(--paanicGold);
      }
      
      .character-details {
        font-size: 0.9em;
        color: var(--textSecondary);
      }
      
      /* Quick status in sidebar */
      .quick-status {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 15px 0;
      }
      
      /* Sidebar navigation */
      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .sidebar-nav-button {
        text-align: left;
        padding: 10px 15px;
        background: var(--buttonPrimary);
        color: var(--textPrimary);
        border: none;
        border-left: 3px solid transparent;
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: inherit;
        font-size: 1em;
      }
      
      .sidebar-nav-button:hover {
        background: var(--buttonHover);
        border-left: 3px solid var(--paanicGold);
      }
      
      .sidebar-nav-button.active {
        background: var(--buttonActive);
        border-left: 3px solid var(--paanicGold);
      }
      
      /* Panels */
      .panel {
        position: fixed;
        background: var(--bgPanel);
        border: 1px solid var(--borderPrimary);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid var(--borderPrimary);
      }
      
      .panel-header h3 {
        margin: 0;
        color: var(--paanicGold);
      }
      
      .panel-close-btn {
        background: none;
        border: none;
        color: var(--textPrimary);
        font-size: 1.2em;
        cursor: pointer;
      }
      
      .panel-content {
        padding: 15px;
        overflow-y: auto;
        flex: 1;
      }
      
      .panel-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 80%;
      }
      
      .panel-right {
        top: 0;
        right: 0;
        bottom: 0;
        width: 300px;
      }
      
      .panel-left {
        top: 0;
        left: 0;
        bottom: 0;
        width: 300px;
      }
      
      .panel-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        height: 300px;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
      
      /* Character profile panel */
      .character-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .character-avatar {
        position: relative;
        font-size: 3em;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bgSecondary);
        border-radius: 50%;
      }
      
      .character-badge {
        position: absolute;
        bottom: 0;
        right: 0;
        font-size: 0.5em;
        background: var(--paanicGold);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .character-info {
        flex: 1;
      }
      
      .character-title {
        color: var(--textSecondary);
        margin-bottom: 10px;
      }
      
      .character-stats {
        display: flex;
        gap: 10px;
      }
      
      .stat-pill {
        background: var(--bgSecondary);
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8em;
      }
      
      .attributes-section {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .attribute-card {
        flex: 1;
        background: var(--bgSecondary);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .attribute-value {
        font-size: 2em;
        font-weight: bold;
        color: var(--paanicGold);
        margin: 10px 0;
      }
      
      .skills-section {
        margin-bottom: 20px;
      }
      
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }
      
      .skill-card {
        background: var(--bgSecondary);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .skill-radial {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 10px 0;
      }
      
      .skill-circle {
        fill: none;
        stroke: var(--bgTertiary);
        stroke-width: 8;
      }
      
      .skill-circle-filled {
        fill: none;
        stroke: var(--paanicGold);
        stroke-width: 8;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        transition: stroke-dashoffset 0.3s;
      }
      
      .skill-value {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.2em;
        font-weight: bold;
      }
      
      .relationships-section {
        margin-top: 20px;
      }
      
      .relationship-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .relationship-card {
        background: var(--bgSecondary);
        border-radius: 8px;
        padding: 15px;
      }
      
      .relationship-bar {
        height: 8px;
        background: var(--bgTertiary);
        border-radius: 4px;
        margin-top: 10px;
        overflow: hidden;
      }
      
      .relationship-fill {
        height: 100%;
        background: var(--paanicGold);
        border-radius: 4px;
        transition: width 0.3s;
      }
      
      /* Inventory panel */
      .inventory-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .inventory-tabs {
        display: flex;
        border-bottom: 1px solid var(--borderPrimary);
        margin-bottom: 15px;
      }
      
      .inventory-tab {
        padding: 10px 20px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        color: var(--textPrimary);
        font-family: inherit;
      }
      
      .inventory-tab.active {
        border-bottom: 3px solid var(--paanicGold);
        color: var(--paanicGold);
      }
      
      .inventory-content {
        display: flex;
        gap: 20px;
      }
      
      .equipment-panel {
        width: 220px;
        background: var(--bgSecondary);
        border-radius: 8px;
        padding: 15px;
      }
      
      .paperdoll {
        display: grid;
        grid-template-areas:
          "head"
          "body"
          "mainHand offHand"
          "accessory accessory";
        gap: 10px;
        margin-bottom: 20px;
      }
      
      .equipment-slot {
        background: var(--bgTertiary);
        border: 1px dashed var(--borderPrimary);
        border-radius: 4px;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        min-height: 50px;
      }
      
      .equipment-slot.filled {
        border: 1px solid var(--paanicGold);
        background: var(--bgSecondary);
      }
      
      .slot-head { grid-area: head; }
      .slot-body { grid-area: body; }
      .slot-mainHand { grid-area: mainHand; }
      .slot-offHand { grid-area: offHand; }
      .slot-accessory { grid-area: accessory; }
      
      .items-panel {
        flex: 1;
      }
      
      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
      }
      
      .item {
        background: var(--bgSecondary);
        border: 1px solid var(--borderPrimary);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .item:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      .item-icon {
        font-size: 2em;
        margin-bottom: 5px;
      }
      
      .item-name {
        font-size: 0.9em;
        text-align: center;
      }
      
      .item-rarity-common { color: #aaaaaa; }
      .item-rarity-uncommon { color: #00aa00; }
      .item-rarity-rare { color: #0066ff; }
      .item-rarity-epic { color: #aa00aa; }
      .item-rarity-legendary { color: #ff9900; }
      .item-rarity-unique { color: #aa0000; }
      
      /* Quest panel */
      .quest-categories {
        display: flex;
        border-bottom: 1px solid var(--borderPrimary);
        margin-bottom: 15px;
      }
      
      .quest-category {
        padding: 10px 20px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        color: var(--textPrimary);
        font-family: inherit;
      }
      
      .quest-category.active {
        border-bottom: 3px solid var(--paanicGold);
        color: var(--paanicGold);
      }
      
      .quest-item {
        background: var(--bgSecondary);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      
      .quest-title {
        font-weight: bold;
        color: var(--paanicGold);
        margin-bottom: 10px;
      }
      
      .quest-objective {
        margin: 5px 0;
      }
      
      .quest-objective-complete {
        color: #56ab2f;
        text-decoration: line-through;
      }
      
      /* Notifications */
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bgPanel);
        border-left: 5px solid var(--paanicGold);
        padding: 15px;
        border-radius: 4px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.3s forwards;
      }
      
      .notification-success {
        border-left-color: #56ab2f;
      }
      
      .notification-warning {
        border-left-color: #ffc371;
      }
      
      .notification-error {
        border-left-color: #ff5f6d;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
    
    console.log('Added main game styles');
    return this;
  },
  
  // Add responsive styles
  addResponsiveStyles: function() {
    if (document.getElementById('ui-responsive-styles')) {
      return; // Already added
    }
    
    const style = document.createElement('style');
    style.id = 'ui-responsive-styles';
    style.textContent = `
      /* Responsive adjustments */
      @media (max-width: 768px) {
        #gameContainer {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto 1fr;
          grid-template-areas:
            "header"
            "main";
          padding: 10px;
        }
        
        .game-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 250px;
          transform: translateX(-100%);
          z-index: 1000;
          transition: transform 0.3s ease;
        }
        
        .game-sidebar.show {
          transform: translateX(0);
        }
        
        .sidebar-toggle {
          display: flex;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1001;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--paanicAccent);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
        
        .panel-center {
          width: 95%;
          height: 90%;
        }
        
        .panel-right, .panel-left {
          width: 80%;
        }
        
        .panel-bottom {
          height: 50%;
        }
        
        .inventory-content {
          flex-direction: column;
        }
        
        .equipment-panel {
          width: 100%;
        }
        
        .skills-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .attributes-section {
          flex-direction: column;
          gap: 10px;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    console.log('Added responsive styles');
    return this;
  },
  
  // Add component-specific styles
  addComponentStyles: function(id, css) {
    if (document.getElementById(`ui-${id}-styles`)) {
      return; // Already added
    }
    
    const style = document.createElement('style');
    style.id = `ui-${id}-styles`;
    style.textContent = css;
    
    document.head.appendChild(style);
    
    console.log(`Added styles for ${id}`);
    return this;
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  window.UIStyles.init();
});
