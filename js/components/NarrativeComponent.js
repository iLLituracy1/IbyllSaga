// NarrativeComponent.js - Handles the narrative text display and updates

class NarrativeComponent extends Component {
  constructor() {
    super('narrative');
    this.state = {
      currentText: '',
      location: 'camp', // Default location
      timeClass: 'day', // Default time of day
      history: [], // Narrative history
      maxHistory: 50, // Maximum history entries
      transitioning: false
    };
  }

  initialize() {
    super.initialize();
    
    // Find narrative element or create it
    this.element = document.getElementById('narrative');
    if (!this.element) {
      this.createRootElement();
    }
    
    // Wait for layout to be ready
    this.waitForNarrativeContainer();
    
    // Create additional elements if they don't exist
    this.createLocationDisplay();
    
    // Listen for events that should update the narrative
    if (this.system && this.system.eventBus) {
      this.system.eventBus.subscribe('narrative:set', this.setText.bind(this));
      this.system.eventBus.subscribe('narrative:add', this.addText.bind(this));
      this.system.eventBus.subscribe('time:update', this.updateTimeClass.bind(this));
      this.system.eventBus.subscribe('location:change', this.updateLocation.bind(this));
    }
    
    console.log('Narrative component initialized');
    return true;
  }

  /**
   * Wait for narrative container to be ready before proceeding
   */
  waitForNarrativeContainer() {
    // Check if element is properly connected
    if (this.element && this.element.parentElement && 
        this.element.parentElement.classList.contains('narrative-container')) {
      console.log("Narrative element already in correct container");
      return;
    }
    
    // Look for narrative container
    const narrativeContainer = document.querySelector('.narrative-container');
    if (narrativeContainer && this.element) {
      // Move narrative into container if needed
      if (this.element.parentElement !== narrativeContainer) {
        console.log("Moving narrative element to narrative container");
        narrativeContainer.insertBefore(this.element, narrativeContainer.firstChild);
      }
    } else {
      console.log("Narrative container not found, will be created by SidebarLayout");
    }
  }

  createRootElement() {
    console.log("Creating narrative element");
    
    const narrative = document.createElement('div');
    narrative.id = 'narrative';
    narrative.className = 'narrative narrative-day location-camp';
    
    // Apply styles to control overflow and maintain visibility of action buttons
    narrative.style.maxHeight = 'calc(100vh - 330px)';
    narrative.style.overflowY = 'auto';
    narrative.style.scrollBehavior = 'smooth';
    
    // Find parent container (typically game-main or gameContainer)
    const narrativeContainer = document.querySelector('.narrative-container');
    if (narrativeContainer) {
      // Add to narrative container
      narrativeContainer.insertBefore(narrative, narrativeContainer.firstChild);
    } else {
      // Try to find main content
      const mainContent = document.querySelector('.game-main');
      if (mainContent) {
        // Create narrative container
        const container = document.createElement('div');
        container.className = 'narrative-container';
        container.style.position = 'relative';
        container.style.maxHeight = 'calc(100vh - 250px)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        
        // Add narrative to container
        container.appendChild(narrative);
        
        // Add container to main content
        mainContent.appendChild(container);
      } else {
        // Fallback to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
          gameContainer.appendChild(narrative);
        } else {
          // Last resort: add to body
          document.body.appendChild(narrative);
          console.warn('Could not find parent for narrative, appended to body');
        }
      }
    }
    
    this.element = narrative;
  }

  createLocationDisplay() {
    // Check if location element already exists
    if (document.getElementById('location')) {
      return;
    }
    
    console.log("Creating location display");
    
    // Create location element
    const locationElem = document.createElement('div');
    locationElem.id = 'location';
    locationElem.textContent = `Location: ${this.state.location}`;
    
    // Find header to append to
    const header = document.querySelector('header');
    if (header) {
      // Find specific position in header
      const title = header.querySelector('h1');
      if (title && title.nextSibling) {
        header.insertBefore(locationElem, title.nextSibling);
      } else {
        header.appendChild(locationElem);
      }
    } else {
      console.warn("Header not found, location display creation deferred");
    }
  }

  setText(text) {
    // Skip if identical text is already set
    if (text === this.state.currentText) {
      return;
    }
    
    // Store the new text
    this.state.currentText = text;
    
    // Clear history and add this as the first entry
    this.state.history = [{ text, timestamp: new Date() }];
    
    // Set transitioning flag
    this.state.transitioning = true;
    
    // Add fade out effect
    if (this.element) {
      this.element.classList.add('fade-out');
      
      // After animation, update content and fade back in
      setTimeout(() => {
        this.render();
        this.element.classList.remove('fade-out');
        this.state.transitioning = false;
        
        // Scroll to top of narrative
        this.element.scrollTop = 0;
      }, 300);
    } else {
      this.render();
      this.state.transitioning = false;
    }
  }

  addText(text) {
    // Don't add empty text
    if (!text || text.trim() === '') {
      return;
    }
    
    // Skip if transitioning
    if (this.state.transitioning) {
      console.warn('Skipping narrative addition during transition');
      
      // Queue the text to be added after transition
      setTimeout(() => this.addText(text), 400);
      return;
    }
    
    // Format as paragraph if it's not already HTML
    const formattedText = text.startsWith('<') ? text : `<p>${text}</p>`;
    
    // Append to existing narrative
    this.state.currentText += formattedText;
    
    // Add to history
    this.state.history.push({
      text: formattedText,
      timestamp: new Date()
    });
    
    // Trim history if it's too long
    if (this.state.history.length > this.state.maxHistory) {
      this.state.history.shift();
    }
    
    // Render the updated narrative
    this.render();
    
    // Scroll to bottom of narrative
    if (this.element) {
      // Use setTimeout to ensure rendering is complete
      setTimeout(() => {
        this.element.scrollTop = this.element.scrollHeight;
      }, 50);
    }
  }

  updateTimeClass(timeData) {
    const timeOfDay = timeData.timeOfDay || (typeof timeData === 'string' ? timeData : 'day');
    
    if (timeOfDay === this.state.timeClass) return;
    
    this.state.timeClass = timeOfDay;
    
    // Update narrative class based on time of day
    if (this.element) {
      // Remove existing time classes
      this.element.classList.remove('narrative-dawn', 'narrative-day', 'narrative-evening', 'narrative-night');
      
      // Add new time class
      this.element.classList.add(`narrative-${timeOfDay}`);
    }
  }

  updateLocation(locationData) {
    // Handle different input formats
    const location = typeof locationData === 'string' ? locationData : 
                    (locationData.location || this.state.location);
    
    const displayName = locationData.displayName || (typeof locationData === 'string' ? 
                         `Location: ${location}` : `Location: ${location}`);
    
    if (location === this.state.location) return;
    
    this.state.location = location;
    
    // Update location display
    const locationElem = document.getElementById('location');
    if (locationElem) {
      locationElem.textContent = displayName;
    } else {
      // Try creating it again
      this.createLocationDisplay();
    }
    
    // Update narrative class based on location
    if (this.element) {
      // Get all existing location classes
      const locationClasses = Array.from(this.element.classList)
        .filter(cls => cls.startsWith('location-'));
      
      // Remove existing location classes
      locationClasses.forEach(cls => this.element.classList.remove(cls));
      
      // Add new location class
      this.element.classList.add(`location-${location}`);
    }
  }

  render() {
    if (!this.element) {
      console.error("Cannot render narrative: element not found");
      return;
    }
    
    // Check if element is in document
    if (!document.contains(this.element)) {
      console.error("Narrative element is not in document, reconnecting");
      this.element = document.getElementById('narrative');
      if (!this.element) {
        this.createRootElement();
      }
    }
    
    // Sanitize text to prevent XSS (but allow HTML formatting)
    const sanitized = this.sanitizeHTML(this.state.currentText);
    
    // Update the content
    this.element.innerHTML = sanitized;
    
    // Make sure classes are correct
    this.element.classList.add(`narrative-${this.state.timeClass}`);
    this.element.classList.add(`location-${this.state.location}`);
  }

  sanitizeHTML(html) {
    // Don't sanitize empty content
    if (!html) return '';
    
    // Basic sanitization to allow paragraph tags but prevent scripts
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/on\w+="[^"]*"/g, '');
  }
  
  /**
   * Get the narrative history
   * @returns {Array} Array of history entries with text and timestamp
   */
  getHistory() {
    return this.state.history;
  }
  
  /**
   * Clear the narrative history
   */
  clearHistory() {
    this.state.history = [];
  }
}

// Export the component for use in other modules
window.NarrativeComponent = NarrativeComponent;