// EventBus.js - Event communication system
// Facilitates communication between components without direct dependencies

class EventBus {
  constructor() {
    // Event registry
    // Structure: { eventName: [callback1, callback2, ...] }
    this.events = {};
    
    // Debug mode - can be turned on for troubleshooting
    this.debug = false;
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    // Create event array if it doesn't exist
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    // Add callback to event listeners
    this.events[event].push(callback);
    
    if (this.debug) {
      console.log(`[EventBus] Subscribed to: ${event}`, callback);
    }
    
    // Return unsubscribe function
    return () => {
      if (this.debug) {
        console.log(`[EventBus] Unsubscribing from: ${event}`);
      }
      
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      
      // Clean up empty event arrays
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    };
  }
  
  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  publish(event, data) {
    // If no subscribers, do nothing
    if (!this.events[event]) {
      if (this.debug) {
        console.log(`[EventBus] No subscribers for: ${event}`);
      }
      return;
    }
    
    if (this.debug) {
      console.log(`[EventBus] Publishing: ${event}`, data);
    }
    
    // Call all registered callbacks with data
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in subscriber to ${event}:`, error);
      }
    });
  }
  
  /**
   * Check if an event has subscribers
   * @param {string} event - Event name
   * @returns {boolean} - True if event has subscribers
   */
  hasSubscribers(event) {
    return !!this.events[event] && this.events[event].length > 0;
  }
  
  /**
   * Get number of subscribers for an event
   * @param {string} event - Event name
   * @returns {number} - Number of subscribers
   */
  subscriberCount(event) {
    if (!this.events[event]) {
      return 0;
    }
    return this.events[event].length;
  }
  
  /**
   * List all events with subscribers
   * @returns {string[]} - Array of event names
   */
  listEvents() {
    return Object.keys(this.events);
  }
  
  /**
   * Remove all subscribers for an event
   * @param {string} event - Event name
   */
  clearEvent(event) {
    if (this.debug) {
      console.log(`[EventBus] Clearing all subscribers for: ${event}`);
    }
    delete this.events[event];
  }
  
  /**
   * Remove all subscribers for all events
   */
  clearAllEvents() {
    if (this.debug) {
      console.log(`[EventBus] Clearing all events and subscribers`);
    }
    this.events = {};
  }
  
  /**
   * Enable debug logging
   */
  enableDebug() {
    this.debug = true;
    console.log(`[EventBus] Debug mode enabled`);
  }
  
  /**
   * Disable debug logging
   */
  disableDebug() {
    console.log(`[EventBus] Debug mode disabled`);
    this.debug = false;
  }
}
