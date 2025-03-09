// UIEvents.js
// Centralized event definitions for the UI framework
// This provides consistent event names across all components

window.UIEvents = {
  // System events
  SYSTEM: {
    INITIALIZED: 'ui:initialized',
    ERROR: 'ui:error',
    READY: 'ui:ready'
  },
  
  // Game state events
  GAME: {
    STATE_UPDATED: 'gameState:updated',
    STARTED: 'game:started',
    PAUSED: 'game:paused',
    RESUMED: 'game:resumed',
    ENDED: 'game:ended',
    SAVED: 'game:saved',
    LOADED: 'game:loaded'
  },
  
  // Player events
  PLAYER: {
    UPDATED: 'player:updated',
    LEVEL_UP: 'player:levelUp',
    ATTRIBUTE_CHANGE: 'player:attributeChange',
    SKILL_CHANGE: 'player:skillChange',
    ITEM_ACQUIRED: 'player:itemAcquired',
    ITEM_LOST: 'player:itemLost',
    EQUIPMENT_CHANGE: 'player:equipmentChange'
  },
  
  // Status display events
  STATUS: {
    UPDATE: 'status:update',
    HEALTH_CHANGE: 'status:healthChange',
    STAMINA_CHANGE: 'status:staminaChange',
    MORALE_CHANGE: 'status:moraleChange'
  },
  
  // Narrative events
  NARRATIVE: {
    SET: 'narrative:set',
    ADD: 'narrative:add',
    CLEAR: 'narrative:clear',
    APPEND: 'narrative:append'
  },
  
  // Time events
  TIME: {
    ADVANCE: 'time:advance',
    DAY_CHANGE: 'time:dayChange',
    TIME_OF_DAY_CHANGE: 'time:timeOfDayChange',
    UPDATE: 'time:update'
  },
  
  // Action events
  ACTION: {
    EXECUTE: 'action:execute',
    AVAILABLE_CHANGED: 'action:availableChanged',
    CONTEXT_CHANGE: 'action:contextChange'
  },
  
  // Panel events
  PANEL: {
    OPEN: 'panel:open',
    CLOSE: 'panel:close',
    TOGGLE: 'panel:toggle',
    OPENED: 'panel:opened',
    CLOSED: 'panel:closed',
    CLOSE_ALL: 'panel:closeAll'
  },
  
  // Inventory events
  INVENTORY: {
    OPEN: 'inventory:open',
    CLOSE: 'inventory:close',
    ITEM_ADDED: 'inventory:itemAdded',
    ITEM_REMOVED: 'inventory:itemRemoved',
    ITEM_USED: 'inventory:itemUsed',
    ITEM_EQUIPPED: 'inventory:itemEquipped',
    ITEM_UNEQUIPPED: 'inventory:itemUnequipped',
    CURRENCY_CHANGE: 'inventory:currencyChange'
  },
  
  // Combat events
  COMBAT: {
    START: 'combat:start',
    END: 'combat:end',
    TURN_START: 'combat:turnStart',
    TURN_END: 'combat:turnEnd',
    ATTACK: 'combat:attack',
    DEFEND: 'combat:defend',
    DAMAGE: 'combat:damage',
    DEATH: 'combat:death',
    VICTORY: 'combat:victory',
    DEFEAT: 'combat:defeat'
  },
  
  // Location events
  LOCATION: {
    CHANGE: 'location:change',
    DISCOVERED: 'location:discovered',
    ENTERED: 'location:entered',
    EXITED: 'location:exited'
  },
  
  // Relationship events
  RELATIONSHIP: {
    CHANGE: 'relationship:change',
    IMPROVE: 'relationship:improve',
    WORSEN: 'relationship:worsen'
  },
  
  // UI events
  UI: {
    RESIZE: 'ui:resize',
    THEME_CHANGE: 'ui:themeChange',
    NOTIFICATION: 'ui:notification',
    CONFIRM_DIALOG: 'ui:confirmDialog',
    ALERT_DIALOG: 'ui:alertDialog'
  }
};

// Helper function to publish events with type checking
window.publishEvent = function(eventName, data) {
  // Validate event name exists in UIEvents
  let isValidEvent = false;
  
  // Check all categories
  Object.values(UIEvents).forEach(category => {
    if (Object.values(category).includes(eventName)) {
      isValidEvent = true;
    }
  });
  
  if (!isValidEvent) {
    console.warn(`Warning: Publishing unknown event "${eventName}"`);
  }
  
  // Publish to UI system if available
  if (window.UI && window.UI.system && window.UI.system.eventBus) {
    window.UI.system.eventBus.publish(eventName, data);
  } else {
    console.error(`Cannot publish event "${eventName}": UI system not initialized`);
  }
};

// Helper function to subscribe to events
window.subscribeToEvent = function(eventName, callback) {
  // Validate event name exists in UIEvents
  let isValidEvent = false;
  
  // Check all categories
  Object.values(UIEvents).forEach(category => {
    if (Object.values(category).includes(eventName)) {
      isValidEvent = true;
    }
  });
  
  if (!isValidEvent) {
    console.warn(`Warning: Subscribing to unknown event "${eventName}"`);
  }
  
  // Subscribe to UI system if available
  if (window.UI && window.UI.system && window.UI.system.eventBus) {
    return window.UI.system.eventBus.subscribe(eventName, callback);
  } else {
    console.error(`Cannot subscribe to event "${eventName}": UI system not initialized`);
    return () => {}; // Return empty unsubscribe function
  }
};
