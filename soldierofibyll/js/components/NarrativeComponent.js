// NarrativeComponent.js - Handles the game's narrative display

class NarrativeComponent extends Component {
  constructor() {
    super('narrative');
    this.state = {
      currentText: '',
      location: 'camp', // Default location
      timeClass: 'day', // Default time of day
      transitioning: false
    };
  }

  initialize() {
    super.initialize();
    
    // Listen for events that should update the narrative
    this.system.eventBus.subscribe('narrative:set', this.setText.bind(this));
    this.system.eventBus.subscribe('narrative:add', this.addText.bind(this));
    this.system.eventBus.subscribe('time:update', this.updateTimeClass.bind(this));
    this.system.eventBus.subscribe('location:change', this.updateLocation.bind(this));
    
    // Create additional elements if they don't exist
    this.createLocationDisplay();
    
    console.log('Narrative component initialized');
  }

  createRootElement() {
    const narrative = document.createElement('div');
    narrative.id = 'narrative';
    narrative.className = 'narrative-day location-camp';
    
    // Find parent container (typically game-main or gameContainer)
    const parent = document.querySelector('.game-main') || document.getElementById('gameContainer');
    if (parent) {
      parent.appendChild(narrative);
    } else {
      document.body.appendChild(narrative);
      console.warn('Could not find parent for narrative, appended to body');
    }
    
    this.element = narrative;
  }

  createLocationDisplay() {
    if (!document.getElementById('location')) {
      const locationElem = document.createElement('div');
      locationElem.id = 'location';
      
      // Find header to append to
      const header = document.querySelector('header');
      if (header) {
        header.appendChild(locationElem);
      }
    }
  }

  setText(text) {
    this.state.currentText = text;
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
    // Append to existing narrative
    this.state.currentText += `<p>${text}</p>`;
    this.render();
    
    // Scroll to bottom of narrative
    if (this.element) {
      this.element.scrollTop = this.element.scrollHeight;
    }
  }

  updateTimeClass(timeData) {
    const timeOfDay = timeData.timeOfDay;
    
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
    const location = locationData.location;
    
    if (location === this.state.location) return;
    
    this.state.location = location;
    
    // Update location display
    const locationElem = document.getElementById('location');
    if (locationElem) {
      locationElem.textContent = locationData.displayName || `Location: ${location}`;
    }
    
    // Update narrative class based on location
    if (this.element) {
      // Remove existing location classes
      this.element.classList.remove('location-camp', 'location-training', 'location-battlefield', 'location-town');
      
      // Add new location class
      this.element.classList.add(`location-${location}`);
    }
  }

  render() {
    if (!this.element) return;
    
    // Sanitize text to prevent XSS (but allow HTML formatting)
    const sanitized = this.sanitizeHTML(this.state.currentText);
    
    // Update the content
    this.element.innerHTML = sanitized;
  }

  sanitizeHTML(html) {
    // Basic sanitization to allow paragraph tags but prevent scripts
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+="[^"]*"/g, '');
  }
}

// Register the component with the UI system when available
document.addEventListener('DOMContentLoaded', () => {
  if (window.uiSystem) {
    window.uiSystem.registerComponent('narrative', new NarrativeComponent());
  } else {
    // If UI system isn't ready yet, wait for it
    document.addEventListener('uiSystemReady', () => {
      window.uiSystem.registerComponent('narrative', new NarrativeComponent());
    });
  }
});
