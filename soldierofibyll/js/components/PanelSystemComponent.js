// PanelSystemComponent.js - Manages UI panels like Profile, Inventory, and Quest Log

class PanelSystemComponent extends Component {
  constructor() {
    super('panelSystem');
    this.state = {
      activePanels: [], // Currently active panels
      registeredPanels: {}, // Panel definitions
      modalOverlay: null // Shared modal overlay for panels
    };
  }

  initialize() {
    super.initialize();
    
    // Create modal overlay for panels
    this.createModalOverlay();
    
    // Register default panels
    this.registerDefaultPanels();
    
    // Subscribe to events
    this.system.eventBus.subscribe('panel:open', this.openPanel.bind(this));
    this.system.eventBus.subscribe('panel:close', this.closePanel.bind(this));
    this.system.eventBus.subscribe('panel:toggle', this.togglePanel.bind(this));
    this.system.eventBus.subscribe('panels:closeAll', this.closeAllPanels.bind(this));
    
    // Handle panel actions from existing buttons
    this.hookExistingButtons();
    
    console.log('Panel system component initialized');
  }

  createRootElement() {
    // Panel system doesn't need a root element as it manages other panels
    return null;
  }

  createModalOverlay() {
    // Create overlay for modal panels
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay hidden';
    overlay.id = 'panelSystemOverlay';
    
    // Close active panels when clicking overlay
    overlay.addEventListener('click', () => {
      this.closeAllPanels();
    });
    
    document.body.appendChild(overlay);
    this.state.modalOverlay = overlay;
  }

  registerDefaultPanels() {
    // Register the profile panel
    this.registerPanel({
      id: 'profile',
      title: 'Character Profile',
      modal: true,
      position: 'center',
      events: {
        'open': 'profile:beforeOpen',
        'close': 'profile:afterClose'
      },
      content: this.createProfileContent()
    });
    
    // Register the inventory panel
    this.registerPanel({
      id: 'inventory',
      title: 'Inventory',
      modal: true,
      position: 'center',
      events: {
        'open': 'inventory:beforeOpen',
        'close': 'inventory:afterClose'
      },
      content: this.createInventoryContent()
    });
    
    // Register the quest log panel
    this.registerPanel({
      id: 'questLog',
      title: 'Quest Log',
      modal: true,
      position: 'center',
      events: {
        'open': 'questLog:beforeOpen',
        'close': 'questLog:afterClose'
      },
      content: this.createQuestLogContent()
    });
  }

  createProfileContent() {
    const container = document.createElement('div');
    container.id = 'profileContent';
    
    // Profile content will be populated dynamically when opened
    container.innerHTML = '<div id="profileText"></div>';
    
    return container;
  }

  createInventoryContent() {
    const container = document.createElement('div');
    container.id = 'inventoryContent';
    
    // Inventory structure will be populated dynamically when opened
    container.innerHTML = `
      <div class="inventory-header">
        <div class="inventory-currency">
          <span id="currency-display">0 Taelors</span>
        </div>
        <div class="inventory-capacity">
          <span id="capacity-display">0/20</span>
        </div>
      </div>
      
      <div class="inventory-tabs">
        <button class="inventory-tab active" data-category="all">All</button>
        <button class="inventory-tab" data-category="weapon">Weapons</button>
        <button class="inventory-tab" data-category="armor">Armor</button>
        <button class="inventory-tab" data-category="consumable">Consumables</button>
        <button class="inventory-tab" data-category="material">Materials</button>
      </div>
      
      <div class="inventory-content">
        <div class="equipment-panel">
          <h4>Equipment</h4>
          <div class="paperdoll">
            <!-- Slot elements will be dynamically added -->
          </div>
          <div class="equipment-stats">
            <h4>Stats</h4>
            <div id="equipment-stats-display">
              No equipment stats
            </div>
          </div>
        </div>
        
        <div class="items-panel">
          <div class="item-sort">
            <label>Sort by: </label>
            <select id="sort-select">
              <option value="category">Category</option>
              <option value="value">Value</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div class="items-grid" id="items-grid">
            <!-- Items will be populated dynamically -->
          </div>
        </div>
      </div>
      
      <div class="item-details-panel hidden" id="item-details-panel">
        <!-- Item details will be populated dynamically -->
      </div>
    `;
    
    return container;
  }

  createQuestLogContent() {
    const container = document.createElement('div');
    container.id = 'questLogContent';
    
    // Quest log will be populated dynamically when opened
    container.innerHTML = `
      <div class="quest-categories">
        <button class="quest-category active" data-category="all">All Quests</button>
        <button class="quest-category" data-category="active">Active</button>
        <button class="quest-category" data-category="completed">Completed</button>
      </div>
      
      <div id="questList">
        <!-- Quests will be populated dynamically -->
      </div>
    `;
    
    return container;
  }

  registerPanel(panelConfig) {
    // Check if panel already exists in DOM
    let panel = document.getElementById(panelConfig.id);
    
    if (!panel) {
      // Create new panel
      panel = document.createElement('div');
      panel.id = panelConfig.id;
      panel.className = 'panel hidden';
      
      // Add modal class if specified
      if (panelConfig.modal) {
        panel.classList.add('modal-panel');
      }
      
      // Set panel position
      if (panelConfig.position) {
        panel.classList.add(`panel-${panelConfig.position}`);
      }
      
      // Create panel header
      const header = document.createElement('div');
      header.className = 'panel-header';
      header.innerHTML = `
        <h3>${panelConfig.title}</h3>
        <button class="panel-close-btn">✕</button>
      `;
      
      // Create panel content container
      const content = document.createElement('div');
      content.className = 'panel-content';
      
      // Add provided content if any
      if (panelConfig.content) {
        content.appendChild(panelConfig.content);
      }
      
      // Assemble panel
      panel.appendChild(header);
      panel.appendChild(content);
      
      // Add close button event
      const closeBtn = header.querySelector('.panel-close-btn');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePanel({ id: panelConfig.id });
      });
      
      // Add to document
      document.body.appendChild(panel);
    }
    
    // Register panel configuration
    this.state.registeredPanels[panelConfig.id] = {
      element: panel,
      config: panelConfig
    };
    
    return panel;
  }

  hookExistingButtons() {
    // Find and hook into existing sidebar buttons
    const sidebarButtons = document.querySelectorAll('.sidebar-nav-button');
    sidebarButtons.forEach(button => {
      const action = button.getAttribute('data-action');
      if (action === 'profile' || action === 'inventory' || action === 'questLog') {
        // Replace existing click handlers
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add our panel system handler
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.togglePanel({ id: action });
        });
      }
    });
    
    // Hook into existing panel close buttons
    document.querySelectorAll('.profile-close, .inventory-close, .quest-log-close').forEach(btn => {
      const panelId = btn.classList.contains('profile-close') ? 'profile' : 
                      btn.classList.contains('inventory-close') ? 'inventory' : 'questLog';
      
      // Replace existing click handler
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add our panel system handler
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closePanel({ id: panelId });
      });
    });
    
    // Make ESC key close panels
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.activePanels.length > 0) {
        this.closeAllPanels();
      }
    });
  }

  openPanel(data) {
    const panelId = data.id;
    const panelData = this.state.registeredPanels[panelId];
    
    if (!panelData) {
      console.error(`Cannot open panel: ${panelId} is not registered`);
      return;
    }
    
    // Close other panels if this is modal
    if (panelData.config.modal) {
      this.closeAllPanels();
      
      // Show modal overlay
      if (this.state.modalOverlay) {
        this.state.modalOverlay.classList.remove('hidden');
      }
    }
    
    // Trigger before open event if defined
    if (panelData.config.events && panelData.config.events.open) {
      this.system.eventBus.publish(panelData.config.events.open, { panelId });
    }
    
    // Special handling for each panel type
    switch (panelId) {
      case 'profile':
        this.updateProfileContent();
        break;
      case 'inventory':
        this.updateInventoryContent();
        break;
      case 'questLog':
        this.updateQuestLogContent();
        break;
    }
    
    // Show the panel
    panelData.element.classList.remove('hidden');
    
    // Add to active panels
    if (!this.state.activePanels.includes(panelId)) {
      this.state.activePanels.push(panelId);
    }
  }

  closePanel(data) {
    const panelId = data.id;
    const panelData = this.state.registeredPanels[panelId];
    
    if (!panelData) {
      console.error(`Cannot close panel: ${panelId} is not registered`);
      return;
    }
    
    // Hide the panel
    panelData.element.classList.add('hidden');
    
    // Remove from active panels
    this.state.activePanels = this.state.activePanels.filter(id => id !== panelId);
    
    // If no more active panels, hide overlay
    if (this.state.activePanels.length === 0 && this.state.modalOverlay) {
      this.state.modalOverlay.classList.add('hidden');
    }
    
    // Trigger after close event if defined
    if (panelData.config.events && panelData.config.events.close) {
      this.system.eventBus.publish(panelData.config.events.close, { panelId });
    }
  }

  togglePanel(data) {
    const panelId = data.id;
    const isActive = this.state.activePanels.includes(panelId);
    
    if (isActive) {
      this.closePanel({ id: panelId });
    } else {
      this.openPanel({ id: panelId });
    }
  }

  closeAllPanels() {
    // Create a copy of the array since we'll be modifying it during iteration
    const activePanels = [...this.state.activePanels];
    
    // Close each active panel
    activePanels.forEach(panelId => {
      this.closePanel({ id: panelId });
    });
    
    // Ensure overlay is hidden
    if (this.state.modalOverlay) {
      this.state.modalOverlay.classList.add('hidden');
    }
  }

  updateProfileContent() {
    const profileText = document.getElementById('profileText');
    if (!profileText || !window.player) return;
    
    try {
      // Calculate skill caps based on attributes
      const phy = Number(window.player.phy || 0);
      const men = Number(window.player.men || 0);
      const meleeCap = Math.floor(phy / 1.5);
      const marksmanshipCap = Math.floor((phy + men) / 3);
      const survivalCap = Math.floor((phy + men) / 3);
      const commandCap = Math.floor((men * 0.8 + phy * 0.2) / 1.5);
      const mentalSkillCap = Math.floor(men / 1.5);
      
      // Create avatar emoji based on origin
      let avatarEmoji = '👤';
      if (window.player.origin === 'Paanic') avatarEmoji = '⚔️';
      if (window.player.origin === 'Nesian') avatarEmoji = '🏹';
      if (window.player.origin === 'Lunarine') avatarEmoji = '⚓';
      if (window.player.origin === 'Wyrdman') avatarEmoji = '🏞️';
      
      // Create badge emoji based on career
      let badgeEmoji = '👤';
      if (window.player.career.title.includes('Regular')) badgeEmoji = '⚔️';
      if (window.player.career.title.includes('Scout')) badgeEmoji = '🏹';
      if (window.player.career.title.includes('Cavalry')) badgeEmoji = '🐎';
      if (window.player.career.title.includes('Geister')) badgeEmoji = '✨';
      if (window.player.career.title.includes('Marine')) badgeEmoji = '⚓';
      if (window.player.career.title.includes('Corsair')) badgeEmoji = '⛵';
      if (window.player.career.title.includes('Berserker')) badgeEmoji = '🪓';
      
      // Build enhanced profile
      profileText.innerHTML = `
        <div class="character-header">
          <div class="character-avatar">
            ${avatarEmoji}
            <div class="character-badge">${badgeEmoji}</div>
          </div>
          <div class="character-info">
            <h2>${window.player.name}</h2>
            <div class="character-title">${window.player.origin} ${window.player.career.title}</div>
            <div class="character-stats">
              <div class="stat-pill">Level ${window.gameState.level || 1}</div>
              <div class="stat-pill">XP: ${window.gameState.experience || 0}/${(window.gameState.level || 1) * 100}</div>
              <div class="stat-pill">Skill Points: ${window.gameState.skillPoints || 0}</div>
            </div>
          </div>
        </div>
        
        <div class="attributes-section">
          <div class="attribute-card">
            <h3>Physical (PHY)</h3>
            <div class="attribute-cap">Max: 15</div>
            <div class="attribute-value">${phy.toFixed(1)}</div>
            <div class="attribute-description">Strength, endurance, agility, and raw physical ability.</div>
          </div>
          
          <div class="attribute-card">
            <h3>Mental (MEN)</h3>
            <div class="attribute-cap">Max: 15</div>
            <div class="attribute-value">${men.toFixed(1)}</div>
            <div class="attribute-description">Intelligence, willpower, leadership, perception, and adaptability.</div>
          </div>
        </div>
        
        <div class="skills-section">
          <h3>Skills</h3>
          <div class="skills-grid">
            ${this.createSkillCard('Melee Combat', window.player.skills?.melee || 0, meleeCap)}
            ${this.createSkillCard('Marksmanship', window.player.skills?.marksmanship || 0, marksmanshipCap)}
            ${this.createSkillCard('Survival', window.player.skills?.survival || 0, survivalCap)}
            ${this.createSkillCard('Command', window.player.skills?.command || 0, commandCap)}
            ${this.createSkillCard('Discipline', window.player.skills?.discipline || 0, mentalSkillCap)}
            ${this.createSkillCard('Tactics', window.player.skills?.tactics || 0, mentalSkillCap)}
            ${this.createSkillCard('Organization', window.player.skills?.organization || 0, mentalSkillCap)}
            ${this.createSkillCard('Arcana', window.player.skills?.arcana || 0, mentalSkillCap)}
          </div>
        </div>
        
        <div class="relationships-section">
          <h3>Relationships</h3>
          <div class="relationship-cards">
            ${this.createRelationshipCards()}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error updating profile content:', error);
      profileText.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
    }
  }

  createSkillCard(skillName, skillValue, skillCap) {
    // Ensure values are numbers with defaults
    skillValue = Number(skillValue || 0);
    skillCap = Number(skillCap || 1);
    
    // Calculate percentage for circle
    const percentage = skillCap > 0 ? (skillValue / skillCap) * 100 : 0;
    const circumference = 2 * Math.PI * 36; // radius * 2PI
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
      <div class="skill-card">
        <div class="skill-name">${skillName}</div>
        <div class="skill-radial">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle class="skill-circle" cx="50" cy="50" r="36"/>
            <circle class="skill-circle-filled" cx="50" cy="50" r="36" 
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="skill-value">${skillValue.toFixed(1)}</div>
        </div>
        <div class="skill-cap">Cap: ${skillCap}</div>
      </div>
    `;
  }

  createRelationshipCards() {
    if (!window.player || !window.player.relationships) {
      return '<div class="relationship-card">No relationships established yet.</div>';
    }
    
    let cards = '';
    
    for (const id in window.player.relationships) {
      const relationship = window.player.relationships[id];
      let dispositionText = "Neutral";
      let barWidth = 50; // Default is neutral (50%)
      
      if (relationship.disposition >= 30) {
        dispositionText = "Friendly";
        barWidth = 65;
      }
      if (relationship.disposition >= 60) {
        dispositionText = "Trusted Ally";
        barWidth = 80;
      }
      if (relationship.disposition <= -30) {
        dispositionText = "Distrustful";
        barWidth = 35;
      }
      if (relationship.disposition <= -60) {
        dispositionText = "Hostile";
        barWidth = 20;
      }
      
      cards += `
        <div class="relationship-card">
          <div class="relationship-name">${relationship.name || id}</div>
          <div class="relationship-status">${dispositionText}</div>
          <div class="relationship-bar">
            <div class="relationship-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;
    }
    
    return cards || '<div class="relationship-card">No relationships established yet.</div>';
  }

  updateInventoryContent() {
    // This would interact with the inventory system
    // For now, we'll just trigger the existing inventory rendering function
    if (typeof window.renderInventoryItems === 'function') {
      window.renderInventoryItems();
    }
    
    if (typeof window.updateEquipmentDisplay === 'function') {
      window.updateEquipmentDisplay();
    }
  }

  updateQuestLogContent() {
    const questList = document.getElementById('questList');
    if (!questList || !window.gameState) return;
    
    try {
      questList.innerHTML = '';
      
      // Add main quest
      questList.innerHTML += `
        <div class="quest-item">
          <div class="quest-title">Main Quest: The Campaign</div>
          <div>Progress: Stage ${window.gameState.mainQuest.stage}/5</div>
        </div>
      `;
      
      // Add side quests
      if (!window.gameState.sideQuests || window.gameState.sideQuests.length === 0) {
        questList.innerHTML += `<p>No active side quests.</p>`;
      } else {
        window.gameState.sideQuests.forEach(quest => {
          questList.innerHTML += `
            <div class="quest-item">
              <div class="quest-title">${quest.title}</div>
              <div>${quest.description}</div>
              <div>Objectives:</div>
              <ul>
          `;
          
          quest.objectives.forEach(objective => {
            const className = objective.completed ? 'quest-objective-complete' : '';
            questList.innerHTML += `
              <li class="quest-objective ${className}">
                ${objective.text}: ${objective.count}/${objective.target}
              </li>
            `;
          });
          
          questList.innerHTML += `</ul></div>`;
        });
      }
    } catch (error) {
      console.error('Error updating quest log content:', error);
      questList.innerHTML = `<p>Error loading quests: ${error.message}</p>`;
    }
  }
}

// Register the component with the UI system when available
document.addEventListener('DOMContentLoaded', () => {
  if (window.uiSystem) {
    window.uiSystem.registerComponent('panelSystem', new PanelSystemComponent());
  } else {
    // If UI system isn't ready yet, wait for it
    document.addEventListener('uiSystemReady', () => {
      window.uiSystem.registerComponent('panelSystem', new PanelSystemComponent());
    });
  }
});
