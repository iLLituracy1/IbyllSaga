// narrative.js - Updated with UI integration
// Connects the narrative elements with the UI framework

// Original game data preserved
window.narrativeElements = {
  training: [
    "You push yourself through grueling training drills, sweat streaming down your face as you master the movements.",
    "The clash of training weapons fills the air as you practice formations with fellow soldiers.",
    "Your muscles burn with the effort, but each repetition brings you closer to martial perfection.",
    "The drill instructor barks orders as you train. \"Again!\" they shout, but you can see approval in their eyes."
  ],
   
  rest: [
    // Daytime rest narratives
    "You find a quiet spot beneath a canvas awning and let your body recover from the day's exertions.",
    "During a break between training sessions, you catch a moment of peaceful rest.",

    // Evening rest narratives
    "As the sun begins to set, you settle into your quarters, reflecting on the day's events.",
    "The evening settles in, and you take the opportunity to rest and recover.",

    // Night rest narratives
    "Under the starry sky, you drift into a deep, restorative sleep.",
    "The night is quiet, allowing you to recuperate from the day's challenges."
  ],
  
  patrol: [
    "The perimeter of the camp reveals a land on the edge of conflict. You keep your eyes sharp for any sign of trouble.",
    "As you patrol, you encounter locals who regard imperial soldiers with a mixture of awe and fear.",
    "The patrol reveals strategic features of the surrounding terrain that could prove useful in coming battles.",
    "Your vigilance doesn't go unnoticed—senior officers take note of your dedication during patrol duty."
  ],
  
  mess: [
    "The mess hall buzzes with conversation and laughter, a brief respite from the looming reality of war.",
    "Over a bowl of hearty stew, you exchange rumors with soldiers from different regiments.",
    "The ale flows freely today, loosening tongues and forming bonds between strangers soon to be comrades.",
    "At your table, veterans share tales of past campaigns, lessons wrapped in embellished glory."
  ],
  
  guard: [
    "Standing vigil upon a watch tower, your mind wanders to the battles that lie ahead.",
    "The commander passes by during your shift, nodding in silent approval of your vigilance.",
    "Hours pass slowly on guard duty, but you notice subtle changes in camp security that could save lives.",
    "As you stand watch, you overhear officers discussing strategy for the upcoming invasion."
  ],
  
  report: [
    "The commander's tent is a hub of activity, maps spread across tables and messengers coming and going.",
    "Your report is received with thoughtful consideration, your observations adding to the tactical picture.",
    "The commander asks pointed questions about your background, seemingly evaluating your potential.",
    "You glimpse documents pointing to complications in the campaign that haven't been shared with the ranks."
  ],
  
  briefing: [
    "The strategy unfolds before you—maps marked with unit positions, supply lines, and enemy strongholds.",
    "Officers debate tactical approaches while you absorb every detail, preparing for your role.",
    "The briefing reveals the scale of the Empire's ambition and the high cost likely to be paid in blood.",
    "Between formal explanations, you catch whispers of doubt among some officers about the campaign's chances."
  ],
  
  gambling: [
    "The gambling tent is alive with the sounds of dice rolling and taelors clinking. Off-duty soldiers crowd around makeshift tables, their faces illuminated by lantern light.",
    "Smoke hangs thick in the air as soldiers laugh and curse their luck in equal measure. The tent flap stirs as another group enters, eager to try their hand.",
    "Cards snap against rough tables as dealers call out wins and losses. A grizzled veteran in the corner watches silently, counting cards with practiced precision.",
    "The gambling tent never truly sleeps, with games rotating as shifts change and new players seek their fortune. Tonight, the atmosphere is charged with anticipation."
  ],
  
  brawlerPits: [
    "The underground fighting pit is dimly lit, with soldiers forming a tight circle around a cleared space. The air is thick with sweat and anticipation.",
    "Bets exchange hands rapidly as two fighters circle each other in the makeshift arena. Veterans call encouragement from the sidelines, their voices low to avoid drawing attention from officers.",
    "The brawler pit tonight is housed in an abandoned supply tent, its interior transformed by hanging lanterns and a crude fighting ring marked in chalk on the packed earth.",
    "Blood stains the ground from previous matches as you enter the pit. The crowd parts slightly, sizing you up as a potential contender or easy mark."
  ]
};

// Add camp characters with relationships
window.campCharacters = [
  { id: "commander", name: "Commander Valarius", disposition: 0 },
  { id: "sergeant", name: "Sergeant Kasia", disposition: 0 },
  { id: "medic", name: "Medic Joren", disposition: 0 },
  { id: "quartermaster", name: "Quartermaster Thell", disposition: 0 }
];

// Define achievements
window.achievements = [
  {
    id: "first_blood",
    title: "First Blood",
    description: "Win your first combat encounter",
    unlocked: false,
    icon: "⚔️"
  },
  {
    id: "disciplined",
    title: "Disciplined",
    description: "Complete 10 training sessions",
    progress: 0,
    target: 10,
    unlocked: false,
    icon: "🏋️‍♂️"
  },
  {
    id: "scout_master",
    title: "Scout Master",
    description: "Discover 5 new locations",
    progress: 0,
    target: 5,
    unlocked: false,
    icon: "🔍"
  },
  {
    id: "respected",
    title: "Respected",
    description: "Reach 'Trusted Ally' status with any camp character",
    unlocked: false,
    icon: "🤝"
  },
  {
    id: "survivor",
    title: "Survivor",
    description: "Reach day 10 in the campaign",
    unlocked: false,
    icon: "📅"
  },
  {
    id: "collector",
    title: "Collector",
    description: "Collect 15 different items",
    progress: 0,
    target: 15,
    unlocked: false,
    icon: "🎒"
  },
  {
    id: "veteran",
    title: "Veteran",
    description: "Reach level 5",
    unlocked: false,
    icon: "⭐"
  }
];

// NEW: Narrative system integration with UI framework
window.NarrativeSystem = {
  // Current state of the narrative
  state: {
    currentContext: 'camp',
    lastAction: null,
    narrativeHistory: [],
    maxHistoryLength: 50 // Maximum number of narrative entries to keep
  },
  
  // Initialize the narrative system
  init: function() {
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Subscribe to relevant events
      window.UI.system.eventBus.subscribe('action:execute', this.handleActionExecuted.bind(this));
      window.UI.system.eventBus.subscribe('location:change', this.handleLocationChange.bind(this));
      window.UI.system.eventBus.subscribe('relationship:change', this.handleRelationshipChange.bind(this));
      window.UI.system.eventBus.subscribe('achievement:unlocked', this.handleAchievementUnlocked.bind(this));
      
      console.log('Narrative system initialized with UI integration');
    } else {
      console.log('Narrative system initialized (standalone)');
    }
    
    return this;
  },
  
  // Get a random narrative for an action type
  getRandomNarrative: function(actionType, timeOfDay) {
    // Check if we have narratives for this action type
    if (!window.narrativeElements[actionType] || window.narrativeElements[actionType].length === 0) {
      return `You ${actionType.toLowerCase()}.`;
    }
    
    // Get narratives for this action
    const narratives = window.narrativeElements[actionType];
    
    // If we have time-of-day-specific narratives, use those
    if (timeOfDay && Array.isArray(narratives.timeOfDay)) {
      // For future implementation
    }
    
    // Get a random narrative
    const randomIndex = Math.floor(Math.random() * narratives.length);
    return narratives[randomIndex];
  },
  
  // Set the main narrative text
  setNarrative: function(text) {
    // Clear narrative history
    this.state.narrativeHistory = [];
    
    // Add this as the first entry
    this.state.narrativeHistory.push({
      text: text,
      timestamp: new Date()
    });
    
    // Publish narrative update event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('narrative:set', text);
    } else if (typeof window.setNarrative === 'function') {
      // Legacy fallback
      window.setNarrative(text);
    }
  },
  
  // Add to the narrative
  addToNarrative: function(text) {
    // Add to narrative history
    this.state.narrativeHistory.push({
      text: text,
      timestamp: new Date()
    });
    
    // Trim history if it's too long
    if (this.state.narrativeHistory.length > this.state.maxHistoryLength) {
      this.state.narrativeHistory.shift();
    }
    
    // Publish narrative update event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('narrative:add', text);
    } else if (typeof window.addToNarrative === 'function') {
      // Legacy fallback
      window.addToNarrative(text);
    }
  },
  
  // Get the full narrative history
  getNarrativeHistory: function() {
    return this.state.narrativeHistory;
  },
  
  // Generate narrative for an action
  generateActionNarrative: function(action, gameState) {
    // Get time of day
    const timeOfDay = gameState && gameState.timeOfDay ? gameState.timeOfDay :
                     (typeof window.getTimeOfDay === 'function' ? window.getTimeOfDay() : 'day');
    
    // Get random narrative for this action
    const narrativeText = this.getRandomNarrative(action, timeOfDay);
    
    // Record the action
    this.state.lastAction = action;
    
    return narrativeText;
  },
  
  // Get camp character by ID
  getCampCharacter: function(characterId) {
    return window.campCharacters.find(char => char.id === characterId) || null;
  },
  
  // Get all camp characters
  getAllCampCharacters: function() {
    return window.campCharacters;
  },
  
  // Get player relationship with a character
  getRelationship: function(characterId) {
    if (!window.player || !window.player.relationships) return null;
    
    return window.player.relationships[characterId] || null;
  },
  
  // Update player relationship with a character
  updateRelationship: function(characterId, delta) {
    if (!window.player || !window.player.relationships) return false;
    
    // Get relationship
    const relationship = window.player.relationships[characterId];
    if (!relationship) return false;
    
    // Update disposition
    relationship.disposition += delta;
    relationship.interactions++;
    
    // Publish relationship change event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('relationship:change', {
        characterId: characterId,
        delta: delta,
        newDisposition: relationship.disposition,
        interactions: relationship.interactions
      });
    }
    
    return true;
  },
  
  // Get an achievement by ID
  getAchievement: function(achievementId) {
    return window.achievements.find(ach => ach.id === achievementId) || null;
  },
  
  // Get all achievements
  getAllAchievements: function() {
    return window.achievements;
  },
  
  // Unlock an achievement
  unlockAchievement: function(achievementId) {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) return false;
    
    // Skip if already unlocked
    if (achievement.unlocked) return true;
    
    // Unlock the achievement
    achievement.unlocked = true;
    
    // Publish achievement unlocked event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('achievement:unlocked', {
        id: achievementId,
        achievement: achievement
      });
    }
    
    return true;
  },
  
  // Update achievement progress
  updateAchievementProgress: function(achievementId, progress) {
    const achievement = this.getAchievement(achievementId);
    if (!achievement || !achievement.target) return false;
    
    // Skip if already unlocked
    if (achievement.unlocked) return true;
    
    // Update progress
    achievement.progress = progress;
    
    // Check if achievement should be unlocked
    if (achievement.progress >= achievement.target) {
      this.unlockAchievement(achievementId);
    }
    
    // Publish achievement progress event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('achievement:progress', {
        id: achievementId,
        achievement: achievement,
        progress: progress
      });
    }
    
    return true;
  },
  
  // Event handlers
  
  // Handle action execution
  handleActionExecuted: function(data) {
    // Generate narrative for the action
    const action = data.action;
    const gameState = window.gameState || {};
    
    // Skip if this is a UI action (like opening a panel)
    if (action === 'profile' || action === 'inventory' || action === 'questLog') {
      return;
    }
    
    // Generate narrative text
    const narrativeText = this.generateActionNarrative(action, gameState);
    
    // Add to narrative
    this.addToNarrative(narrativeText);
    
    // Handle action-specific logic
    this.handleActionSpecificLogic(action, gameState);
  },
  
  // Handle location change
  handleLocationChange: function(data) {
    const locationName = data.displayName || data.location;
    
    // Add location change to narrative
    this.addToNarrative(`You arrive at ${locationName}.`);
    
    // Update current context
    this.state.currentContext = data.location;
  },
  
  // Handle relationship change
  handleRelationshipChange: function(data) {
    const characterId = data.characterId;
    const character = this.getCampCharacter(characterId);
    
    if (!character) return;
    
    // Generate narrative text based on relationship change
    let narrativeText = '';
    
    if (data.delta > 0) {
      narrativeText = `${character.name} seems to appreciate your actions.`;
    } else if (data.delta < 0) {
      narrativeText = `${character.name} doesn't seem pleased with your actions.`;
    }
    
    // Add to narrative if we have text
    if (narrativeText) {
      this.addToNarrative(narrativeText);
    }
  },
  
  // Handle achievement unlocked
  handleAchievementUnlocked: function(data) {
    const achievement = data.achievement;
    
    // Add achievement unlocked to narrative
    this.addToNarrative(`<strong>Achievement Unlocked:</strong> ${achievement.title} - ${achievement.description}`);
    
    // Show notification
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification(`Achievement Unlocked: ${achievement.title}`, 'success');
    }
  },
  
  // Handle action-specific logic
  handleActionSpecificLogic: function(action, gameState) {
    // Update relevant achievement progress
    switch (action) {
      case 'train':
        this.updateAchievementProgress('disciplined', (gameState.trainingCount || 0) + 1);
        break;
        
      case 'patrol':
        // Example: Random chance to discover a new location
        if (Math.random() < 0.3) {
          this.addToNarrative("You discover a new location during your patrol.");
          this.updateAchievementProgress('scout_master', (gameState.locationsDiscovered || 0) + 1);
        }
        break;
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  window.NarrativeSystem.init();
  
  // Override legacy functions to use the narrative system
  if (typeof window.setNarrative !== 'function' || window.setNarrative.toString().indexOf('NarrativeSystem') === -1) {
    window.setNarrative = function(text) {
      window.NarrativeSystem.setNarrative(text);
    };
  }
  
  if (typeof window.addToNarrative !== 'function' || window.addToNarrative.toString().indexOf('NarrativeSystem') === -1) {
    window.addToNarrative = function(text) {
      window.NarrativeSystem.addToNarrative(text);
    };
  }
  
  // If UI system is already loaded, register with it
  if (window.UI && window.UI.system) {
    window.UI.system.registerComponent('narrativeSystem', window.NarrativeSystem);
  }
});
