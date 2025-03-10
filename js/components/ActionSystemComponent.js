// ActionSystemComponent.js - Manages player action buttons

class ActionSystemComponent extends Component {
  constructor() {
    super('actionSystem');
    this.state = {
      availableActions: [],
      currentContext: 'default', // e.g., 'default', 'training', 'gambling', 'brawling'
      contextStack: [], // For keeping track of nested menus
      processingAction: null // Flag to prevent infinite recursion
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
    // Call parent initialize
    super.initialize();
    
    if (!this.element) {
      this.createRootElement();
    }
    
    // Create the actions container
    this.createActionsContainer();
    
    // Subscribe to relevant events
    if (this.system && this.system.eventBus) {
      this.system.eventBus.subscribe('time:update', this.onTimeUpdate.bind(this));
      this.system.eventBus.subscribe('game:stateChange', this.onGameStateChange.bind(this));
      this.system.eventBus.subscribe('action:execute', this.executeAction.bind(this));
      this.system.eventBus.subscribe('actions:update', this.updateAvailableActions.bind(this));
      this.system.eventBus.subscribe('context:change', this.changeContext.bind(this));
    }
    
    // Set the initial available actions based on current game state
    this.updateAvailableActions();
    
    this.log('Action system component initialized');
    return true;
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
    
    // IMPORTANT: Skip if already processing to prevent infinite recursion
    if (this.processingAction === action) {
      console.log(`Skipping duplicate action execution: ${action}`);
      return;
    }
    
    // Set flag to prevent infinite recursion
    this.processingAction = action;
    
    console.log(`Executing action: ${action}`);
    
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
        // For other actions, delegate to direct handler
        try {
          this.handleActionDirect(action);
        } catch (error) {
          console.warn('Error processing action:', error);
        }
    }
    
    // Update actions after executing
    this.updateAvailableActions();
    
    // Clear processing flag
    this.processingAction = null;
  }

  // Direct action handler to avoid using window.handleAction which causes recursion
  handleActionDirect(action) {
    console.log(`Executing action directly: ${action}`);
    
    // Simple action mapping
    if (action === 'rest') {
      if (window.gameState) {
        // Apply rest effects
        window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 20);
        window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + 10);
        
        // Pass time
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(60); // 1 hour
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          const restNarratives = window.narrativeElements?.rest || [
            "You take some time to rest and recover."
          ];
          const randomIndex = Math.floor(Math.random() * restNarratives.length);
          this.system.eventBus.publish('narrative:add', restNarratives[randomIndex]);
        } else if (typeof window.addToNarrative === 'function') {
          const restNarratives = window.narrativeElements?.rest || [
            "You take some time to rest and recover."
          ];
          const randomIndex = Math.floor(Math.random() * restNarratives.length);
          window.addToNarrative(restNarratives[randomIndex]);
        }
      }
    }
    else if (action === 'patrol') {
      if (window.gameState) {
        // Apply patrol effects
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 15);
        window.gameState.dailyPatrolDone = true;
        
        // Pass time
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(120); // 2 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          const patrolNarratives = window.narrativeElements?.patrol || [
            "You patrol the camp perimeter, keeping a watchful eye."
          ];
          const randomIndex = Math.floor(Math.random() * patrolNarratives.length);
          this.system.eventBus.publish('narrative:add', patrolNarratives[randomIndex]);
        } else if (typeof window.addToNarrative === 'function') {
          const patrolNarratives = window.narrativeElements?.patrol || [
            "You patrol the camp perimeter, keeping a watchful eye."
          ];
          const randomIndex = Math.floor(Math.random() * patrolNarratives.length);
          window.addToNarrative(patrolNarratives[randomIndex]);
        }
      }
    }
    else if (action === 'mess') {
      if (window.gameState) {
        // Apply mess hall effects
        window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 15);
        window.gameState.morale += 5;
        
        // Pass time
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(45); // 45 minutes
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          const messNarratives = window.narrativeElements?.mess || [
            "You get a meal at the mess hall, exchanging news with fellow soldiers."
          ];
          const randomIndex = Math.floor(Math.random() * messNarratives.length);
          this.system.eventBus.publish('narrative:add', messNarratives[randomIndex]);
        } else if (typeof window.addToNarrative === 'function') {
          const messNarratives = window.narrativeElements?.mess || [
            "You get a meal at the mess hall, exchanging news with fellow soldiers."
          ];
          const randomIndex = Math.floor(Math.random() * messNarratives.length);
          window.addToNarrative(messNarratives[randomIndex]);
        }
      }
    }
    else if (action === 'guard') {
      if (window.gameState) {
        // Apply guard duty effects
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 10);
        
        // Pass time
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(240); // 4 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          const guardNarratives = window.narrativeElements?.guard || [
            "You stand guard, keeping watch over the camp."
          ];
          const randomIndex = Math.floor(Math.random() * guardNarratives.length);
          this.system.eventBus.publish('narrative:add', guardNarratives[randomIndex]);
        } else if (typeof window.addToNarrative === 'function') {
          const guardNarratives = window.narrativeElements?.guard || [
            "You stand guard, keeping watch over the camp."
          ];
          const randomIndex = Math.floor(Math.random() * guardNarratives.length);
          window.addToNarrative(guardNarratives[randomIndex]);
        }
      }
    }
    // Handle training action
    else if (action === 'physical_training') {
      if (window.gameState) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 30);
        
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(90); // 1.5 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('narrative:add', "You complete a series of strenuous physical exercises, pushing your body to its limits.");
        } else if (typeof window.addToNarrative === 'function') {
          window.addToNarrative("You complete a series of strenuous physical exercises, pushing your body to its limits.");
        }
        
        if (window.player) {
          // Improve physical-related skills
          window.player.skills.melee += 0.2;
          
          if (this.system && this.system.eventBus) {
            this.system.eventBus.publish('narrative:add', "Your physical prowess has improved.");
          } else if (typeof window.addToNarrative === 'function') {
            window.addToNarrative("Your physical prowess has improved.");
          }
        }
      }
      
      // Return to default context
      this.popContext();
    }
    else if (action === 'mental_training') {
      if (window.gameState) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 10);
        
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(120); // 2 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('narrative:add', "You spend time studying military tactics and strategy, exercising your mind.");
        } else if (typeof window.addToNarrative === 'function') {
          window.addToNarrative("You spend time studying military tactics and strategy, exercising your mind.");
        }
        
        if (window.player) {
          // Improve mental-related skills
          window.player.skills.tactics += 0.2;
          
          if (this.system && this.system.eventBus) {
            this.system.eventBus.publish('narrative:add', "Your tactical acumen has improved.");
          } else if (typeof window.addToNarrative === 'function') {
            window.addToNarrative("Your tactical acumen has improved.");
          }
        }
      }
      
      // Return to default context
      this.popContext();
    }
    else if (action === 'melee_drill') {
      if (window.gameState) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 25);
        
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(90); // 1.5 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('narrative:add', "You practice melee combat techniques, sparring with fellow soldiers.");
        } else if (typeof window.addToNarrative === 'function') {
          window.addToNarrative("You practice melee combat techniques, sparring with fellow soldiers.");
        }
        
        if (window.player) {
          // Improve melee skill
          window.player.skills.melee += 0.3;
          
          if (this.system && this.system.eventBus) {
            this.system.eventBus.publish('narrative:add', "Your melee combat skills have noticeably improved.");
          } else if (typeof window.addToNarrative === 'function') {
            window.addToNarrative("Your melee combat skills have noticeably improved.");
          }
        }
      }
      
      // Return to default context
      this.popContext();
    }
    else if (action === 'ranged_drill') {
      if (window.gameState) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 20);
        
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(90); // 1.5 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('narrative:add', "You spend time at the firing range, perfecting your aim with ranged weapons.");
        } else if (typeof window.addToNarrative === 'function') {
          window.addToNarrative("You spend time at the firing range, perfecting your aim with ranged weapons.");
        }
        
        if (window.player) {
          // Improve marksmanship skill
          window.player.skills.marksmanship += 0.3;
          
          if (this.system && this.system.eventBus) {
            this.system.eventBus.publish('narrative:add', "Your marksmanship has noticeably improved.");
          } else if (typeof window.addToNarrative === 'function') {
            window.addToNarrative("Your marksmanship has noticeably improved.");
          }
        }
      }
      
      // Return to default context
      this.popContext();
    }
    else if (action === 'squad_exercises') {
      if (window.gameState) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 35);
        
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(150); // 2.5 hours
        }
        
        // Update UI
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('status:update', window.gameState);
        }
        
        // Add to narrative
        if (this.system && this.system.eventBus) {
          this.system.eventBus.publish('narrative:add', "You participate in squad formation exercises, practicing coordinated movement and tactics.");
        } else if (typeof window.addToNarrative === 'function') {
          window.addToNarrative("You participate in squad formation exercises, practicing coordinated movement and tactics.");
        }
        
        if (window.player) {
          // Improve multiple skills
          window.player.skills.discipline += 0.2;
          window.player.skills.command += 0.2;
          
          if (this.system && this.system.eventBus) {
            this.system.eventBus.publish('narrative:add', "Your discipline and command abilities have improved.");
          } else if (typeof window.addToNarrative === 'function') {
            window.addToNarrative("Your discipline and command abilities have improved.");
          }
        }
      }
      
      // Return to default context
      this.popContext();
    }
    // If action isn't handled here, log it
    else {
      console.log(`Action not directly handled: ${action}`);
    }
  }

  pushContext(context) {
    // Save current context to stack
    this.state.contextStack.push(this.state.currentContext);
    
    // Set new context
    this.state.currentContext = context;
    
    // Update actions for new context
    this.updateAvailableActions();
    
    // Publish context change event
    if (this.system && this.system.eventBus) {
      this.system.eventBus.publish('context:changed', { 
        context: context, 
        previousContext: this.state.contextStack[this.state.contextStack.length - 1] 
      });
    }
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
      if (this.system && this.system.eventBus) {
        this.system.eventBus.publish('context:changed', { 
          context: previousContext, 
          previousContext: currentContext 
        });
      }
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
    if (this.system && this.system.components && this.system.components.timeSystem) {
      const timeSystem = this.system.components.timeSystem;
      timeOfDay = typeof timeSystem.getTimeOfDay === 'function' ? timeSystem.getTimeOfDay() : 'day';
      hours = typeof timeSystem.getCurrentTime === 'function' ? Math.floor(timeSystem.getCurrentTime() / 60) : 12;
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
    
    // Add click handler - use event delegation instead of direct event listener
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      // Publish action execution event
      if (this.system && this.system.eventBus) {
        this.system.eventBus.publish('action:execute', { action });
      } else {
        // Fallback to direct action execution
        this.executeAction({ action });
      }
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

// Export component for use in other modules
window.ActionSystemComponent = ActionSystemComponent;
