// ActionSystemComponent.js - Manages player action buttons

class ActionSystemComponent extends Component {
  constructor() {
    super('actions');
    this.state = {
      availableActions: [],
      currentContext: 'default', // e.g., 'default', 'training', 'gambling', 'brawling'
      contextStack: [] // For keeping track of nested menus
    };
    
    // Action icon mapping
    this.actionIcons = {
      'train': '🏋️',
      'rest': '💤',
      'patrol': '👁️',
      'mess': '🍲',
      'guard': '⚔️',
      'gambling': '🎲',
      'brawler_pits': '👊',
      'physical_training': '💪',
      'mental_training': '🧠',
      'melee_drill': '⚔️',
      'ranged_drill': '🏹',
      'squad_exercises': '👥',
      'profile': '👤',
      'inventory': '🎒',
      'questLog': '📜',
      'play_cards': '🃏',
      'play_dice': '🎲',
      'novice_match': '🥊',
      'standard_match': '🥊',
      'veteran_match': '🥊',
      'back': '⬅️'
    };
  }

  initialize() {
    super.initialize();
    
    // Create container for actions if not exists
    this.createActionsContainer();
    
    // Subscribe to relevant events
    this.system.eventBus.subscribe('time:update', this.onTimeUpdate.bind(this));
    this.system.eventBus.subscribe('game:stateChange', this.onGameStateChange.bind(this));
    this.system.eventBus.subscribe('action:execute', this.executeAction.bind(this));
    this.system.eventBus.subscribe('actions:update', this.updateAvailableActions.bind(this));
    this.system.eventBus.subscribe('context:change', this.changeContext.bind(this));
    
    // Set the initial available actions based on current game state
    this.updateAvailableActions();
    
    console.log('Action system component initialized');
  }

  createRootElement() {
    const actions = document.createElement('div');
    actions.id = 'actions';
    
    // Find parent container
    const actionsContainer = document.querySelector('.actions-container');
    if (actionsContainer) {
      actionsContainer.appendChild(actions);
    } else {
      // Fallback if action container doesn't exist yet
      const narrative = document.getElementById('narrative');
      if (narrative && narrative.parentNode) {
        narrative.parentNode.insertBefore(actions, narrative.nextSibling);
      } else {
        const parent = document.querySelector('.game-main') || document.getElementById('gameContainer');
        if (parent) {
          parent.appendChild(actions);
        } else {
          document.body.appendChild(actions);
          console.warn('Could not find parent for actions, appended to body');
        }
      }
    }
    
    this.element = actions;
  }

  createActionsContainer() {
    // Check if actions container already exists
    if (!document.querySelector('.actions-container') && document.getElementById('narrative')) {
      const narrative = document.getElementById('narrative');
      
      if (narrative && narrative.parentNode) {
        // Create narrative container if it doesn't exist
        let narrativeContainer = narrative.parentNode.querySelector('.narrative-container');
        if (!narrativeContainer) {
          narrativeContainer = document.createElement('div');
          narrativeContainer.className = 'narrative-container';
          narrative.parentNode.insertBefore(narrativeContainer, narrative);
          
          // Move narrative into container
          narrativeContainer.appendChild(narrative);
        }
        
        // Create actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';
        narrativeContainer.appendChild(actionsContainer);
        
        // If actions element exists, move it inside container
        const existingActions = document.getElementById('actions');
        if (existingActions) {
          actionsContainer.appendChild(existingActions);
        }
      }
    }
  }

  onTimeUpdate(timeData) {
    // Update actions if time of day changed
    this.updateAvailableActions();
  }

  onGameStateChange(stateData) {
    // Update actions when game state changes (e.g., entering combat)
    this.updateAvailableActions();
  }

  executeAction(data) {
    const action = data.action;
    
    // Handle special context changes
    switch (action) {
      case 'train':
        this.pushContext('training');
        break;
      case 'gambling':
        this.pushContext('gambling');
        break;
      case 'brawler_pits':
        this.pushContext('brawling');
        break;
      case 'back_from_training':
      case 'back_from_gambling':
      case 'back_from_brawler':
        this.popContext();
        break;
      default:
        // For other actions, delegate to original handler and update actions
        if (window.handleAction && typeof window.handleAction === 'function') {
          window.handleAction(action);
        } else {
          console.warn('Original handleAction function not found');
        }
    }
    
    // Update actions after executing
    this.updateAvailableActions();
  }

  pushContext(context) {
    // Save current context to stack
    this.state.contextStack.push(this.state.currentContext);
    
    // Set new context
    this.state.currentContext = context;
    
    // Update actions for new context
    this.updateAvailableActions();
    
    // Publish context change event
    this.system.eventBus.publish('context:changed', { 
      context: context, 
      previousContext: this.state.contextStack[this.state.contextStack.length - 1] 
    });
  }

  popContext() {
    // Pop previous context from stack
    if (this.state.contextStack.length > 0) {
      const previousContext = this.state.contextStack.pop();
      const currentContext = this.state.currentContext;
      
      // Restore previous context
      this.state.currentContext = previousContext;
      
      // Update actions for restored context
      this.updateAvailableActions();
      
      // Publish context change event
      this.system.eventBus.publish('context:changed', { 
        context: previousContext, 
        previousContext: currentContext 
      });
    } else {
      // Default to main context if stack is empty
      this.state.currentContext = 'default';
      this.updateAvailableActions();
    }
  }

  changeContext(data) {
    const context = data.context;
    const resetStack = data.resetStack || false;
    
    if (resetStack) {
      // Clear context stack
      this.state.contextStack = [];
    }
    
    // Set new context
    this.state.currentContext = context;
    
    // Update actions for new context
    this.updateAvailableActions();
  }

  updateAvailableActions() {
    // Get current game state
    const gameState = window.gameState || {};
    const inBattle = gameState.inBattle || false;
    const inMission = gameState.inMission || false;
    
    // Get time information from our time system or fallback to window functions
    let timeOfDay, hours;
    const timeSystem = this.system.components['timeSystem'];
    
    if (timeSystem) {
      timeOfDay = timeSystem.getTimeOfDay();
      hours = Math.floor(timeSystem.getCurrentTime() / 60);
    } else if (typeof window.getTimeOfDay === 'function') {
      timeOfDay = window.getTimeOfDay();
      hours = Math.floor(window.gameTime / 60);
    } else {
      // Default values if no time system available
      timeOfDay = 'day';
      hours = 12;
    }
    
    // Build available actions based on context
    let availableActions = [];
    
    if (inBattle) {
      // Combat context - to be implemented with combat system
      availableActions = [];
    } else if (inMission) {
      // Mission context - to be implemented with mission system
      availableActions = [];
    } else {
      // Standard camp actions based on current context
      switch (this.state.currentContext) {
        case 'training':
          availableActions = [
            { label: 'Physical Training', action: 'physical_training' },
            { label: 'Mental Training', action: 'mental_training' },
            { label: 'Melee Weapons Drill', action: 'melee_drill' },
            { label: 'Ranged Weapons Drill', action: 'ranged_drill' },
            { label: 'Squad Exercises', action: 'squad_exercises' },
            { label: 'Back', action: 'back_from_training' }
          ];
          break;
          
        case 'gambling':
          availableActions = [
            { label: 'Play Cards', action: 'play_cards' },
            { label: 'Play Dice', action: 'play_dice' },
            { label: 'Back', action: 'back_from_gambling' }
          ];
          break;
          
        case 'brawling':
          availableActions = [
            { label: 'Novice Match', action: 'novice_match' },
            { label: 'Standard Match', action: 'standard_match' },
            { label: 'Veteran Match', action: 'veteran_match' },
            { label: 'Back', action: 'back_from_brawler' }
          ];
          break;
          
        default:
          // Default context - main camp actions
          availableActions = [];
          
          // Training available during the day
          if (timeOfDay === 'day' || timeOfDay === 'dawn') {
            availableActions.push({ label: 'Train', action: 'train' });
          }
          
          // Rest always available
          availableActions.push({ label: 'Rest', action: 'rest' });
          
          // Patrol available during day and evening
          if ((timeOfDay === 'day' || timeOfDay === 'evening') && !gameState.dailyPatrolDone) {
            availableActions.push({ label: 'Patrol', action: 'patrol' });
          }
          
          // Mess hall available during meal times
          if ((hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20)) {
            availableActions.push({ label: 'Mess Hall', action: 'mess' });
          }
          
          // Guard duty available all times
          availableActions.push({ label: 'Guard Duty', action: 'guard' });
          
          // Gambling and Brawler Pits availability
          if (timeOfDay === 'evening' || timeOfDay === 'night') {
            // Only show if player has discovered it or has the right background
            if (gameState.discoveredGamblingTent) {
              availableActions.push({ label: 'Gambling Tent', action: 'gambling' });
            }
            
            if (gameState.discoveredBrawlerPits) {
              availableActions.push({ label: 'Brawler Pits', action: 'brawler_pits' });
            }
          }
      }
    }
    
    // Update state
    this.state.availableActions = availableActions;
    
    // Render the updated actions
    this.render();
  }

  render() {
    if (!this.element) return;
    
    // Clear existing buttons
    this.element.innerHTML = '';
    
    // Create buttons for each available action
    this.state.availableActions.forEach(action => {
      this.addActionButton(action.label, action.action);
    });
  }

  addActionButton(label, action) {
    // Get icon for this action
    const icon = this.actionIcons[action] || null;
    
    // Create button
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.setAttribute('data-action', action);
    
    // Add icon if available
    if (icon) {
      btn.innerHTML = `<span class="action-icon">${icon}</span> ${label}`;
    } else {
      btn.textContent = label;
    }
    
    // Add click handler
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      // Publish action execution event
      this.system.eventBus.publish('action:execute', { action });
    });
    
    // Add to container
    this.element.appendChild(btn);
  }
}

// Register the component with the UI system when available
document.addEventListener('DOMContentLoaded', () => {
  if (window.uiSystem) {
    window.uiSystem.registerComponent('actionSystem', new ActionSystemComponent());
  } else {
    // If UI system isn't ready yet, wait for it
    document.addEventListener('uiSystemReady', () => {
      window.uiSystem.registerComponent('actionSystem', new ActionSystemComponent());
    });
  }
});
