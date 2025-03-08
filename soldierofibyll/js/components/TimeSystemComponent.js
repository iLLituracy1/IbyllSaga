// TimeSystemComponent.js - Manages time, day, and related UI elements

class TimeSystemComponent extends Component {
  constructor() {
    super('timeSystem');
    this.state = {
      time: 480, // Start at 8:00 AM (in minutes since midnight)
      day: 1,
      timeOfDay: 'day', // dawn, day, evening, night
      weather: 'clear' // clear, cloudy, rainy, foggy, stormy
    };
    
    // References to elements
    this.timeDisplay = null;
    this.dayDisplay = null;
    this.dayNightIndicator = null;
    this.weatherIndicator = null;
  }

  initialize() {
    super.initialize();

    // Create the time display container if it doesn't exist
    this.createTimeElements();
    
    // Initialize with game state values if available
    if (window.gameTime !== undefined) {
      this.state.time = window.gameTime;
    }
    
    if (window.gameDay !== undefined) {
      this.state.day = window.gameDay;
    }
    
    if (window.gameState && window.gameState.weather) {
      this.state.weather = window.gameState.weather;
    }
    
    // Update time of day based on current time
    this.updateTimeOfDay();

    // Listen for events that should update the time display
    this.system.eventBus.subscribe('time:advance', this.advanceTime.bind(this));
    this.system.eventBus.subscribe('weather:change', this.updateWeather.bind(this));
    
    // Initial render
    this.render();
    
    console.log('Time system component initialized');
  }

  createTimeElements() {
    // Find the header element
    const header = document.querySelector('header');
    if (!header) {
      console.error('Header element not found, cannot create time elements');
      return;
    }
    
    // Create time container if it doesn't exist
    let timeContainer = document.querySelector('.time-display-container');
    if (!timeContainer) {
      timeContainer = document.createElement('div');
      timeContainer.className = 'time-display-container';
      header.appendChild(timeContainer);
    }
    
    // Create day-night indicator if needed
    this.dayNightIndicator = timeContainer.querySelector('.day-night-indicator');
    if (!this.dayNightIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'day-night-indicator';
      timeContainer.appendChild(indicator);
      this.dayNightIndicator = indicator;
    }
    
    // Create time info container if needed
    let timeInfo = timeContainer.querySelector('.time-info');
    if (!timeInfo) {
      timeInfo = document.createElement('div');
      timeInfo.className = 'time-info';
      timeContainer.appendChild(timeInfo);
    }
    
    // Create time display if needed
    this.timeDisplay = timeInfo.querySelector('#timeDisplay');
    if (!this.timeDisplay) {
      const timeElem = document.createElement('div');
      timeElem.id = 'timeDisplay';
      timeInfo.appendChild(timeElem);
      this.timeDisplay = timeElem;
    }
    
    // Create day display if needed
    this.dayDisplay = timeInfo.querySelector('#dayDisplay');
    if (!this.dayDisplay) {
      const dayElem = document.createElement('div');
      dayElem.id = 'dayDisplay';
      timeInfo.appendChild(dayElem);
      this.dayDisplay = dayElem;
    }
    
    // Create weather indicator if needed
    this.weatherIndicator = timeContainer.querySelector('.weather-indicator');
    if (!this.weatherIndicator) {
      const weather = document.createElement('div');
      weather.className = 'weather-indicator';
      weather.innerHTML = `
        <span class="weather-icon">☀️</span>
        <span class="weather-text">Clear</span>
      `;
      timeContainer.appendChild(weather);
      this.weatherIndicator = weather;
    }
  }

  advanceTime(data) {
    // Add minutes to current time
    const minutesToAdd = data.minutes || 0;
    
    // Add time
    this.state.time += minutesToAdd;
    
    // Check for day change
    while (this.state.time >= 1440) { // 1440 minutes in a day
      this.state.time -= 1440;
      this.state.day++;
      
      // Publish day change event
      this.system.eventBus.publish('day:change', { day: this.state.day });
      
      // Reset daily flags in game state
      if (window.gameState) {
        window.gameState.dailyTrainingCount = 0;
        window.gameState.dailyPatrolDone = false;
        window.gameState.dailyScoutDone = false;
      }
    }
    
    // Update time of day
    const oldTimeOfDay = this.state.timeOfDay;
    this.updateTimeOfDay();
    
    // Publish time of day change event if it changed
    if (oldTimeOfDay !== this.state.timeOfDay) {
      this.system.eventBus.publish('timeOfDay:change', { 
        timeOfDay: this.state.timeOfDay,
        previousTimeOfDay: oldTimeOfDay 
      });
    }

    // Update the global game state if it exists
    if (window.gameTime !== undefined) {
      window.gameTime = this.state.time;
    }
    
    if (window.gameDay !== undefined) {
      window.gameDay = this.state.day;
    }
    
    // Publish time update event
    this.system.eventBus.publish('time:update', {
      time: this.state.time,
      day: this.state.day,
      timeOfDay: this.state.timeOfDay,
      formattedTime: this.getFormattedTime()
    });
    
    // Render the update
    this.render();
  }

  updateTimeOfDay() {
    const hours = Math.floor(this.state.time / 60);
    
    // Determine time of day
    if (hours >= 5 && hours < 8) {
      this.state.timeOfDay = 'dawn';
    } else if (hours >= 8 && hours < 18) {
      this.state.timeOfDay = 'day';
    } else if (hours >= 18 && hours < 21) {
      this.state.timeOfDay = 'evening';
    } else {
      this.state.timeOfDay = 'night';
    }
    
    return this.state.timeOfDay;
  }

  getFormattedTime() {
    const hours = Math.floor(this.state.time / 60);
    const minutes = this.state.time % 60;
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  updateWeather(data) {
    this.state.weather = data.weather;
    this.render();
  }

  render() {
    // Update time display
    if (this.timeDisplay) {
      this.timeDisplay.textContent = `Time: ${this.getFormattedTime()}`;
    }
    
    // Update day display
    if (this.dayDisplay) {
      this.dayDisplay.textContent = `Day ${this.state.day}`;
    }
    
    // Update day/night indicator
    if (this.dayNightIndicator) {
      this.dayNightIndicator.className = `day-night-indicator time-${this.state.timeOfDay}`;
    }
    
    // Update weather indicator
    if (this.weatherIndicator) {
      const weatherIcon = this.weatherIndicator.querySelector('.weather-icon');
      const weatherText = this.weatherIndicator.querySelector('.weather-text');
      
      if (weatherIcon && weatherText) {
        weatherText.textContent = this.state.weather.charAt(0).toUpperCase() + this.state.weather.slice(1);
        
        // Update weather icon
        switch (this.state.weather) {
          case 'clear':
            weatherIcon.textContent = '☀️';
            break;
          case 'cloudy':
            weatherIcon.textContent = '☁️';
            break;
          case 'rainy':
            weatherIcon.textContent = '🌧️';
            break;
          case 'foggy':
            weatherIcon.textContent = '🌫️';
            break;
          case 'stormy':
            weatherIcon.textContent = '⛈️';
            break;
          default:
            weatherIcon.textContent = '☀️';
        }
      }
    }
  }

  // Public API Methods

  /**
   * Get the current time of day (dawn, day, evening, night)
   * This can be used by other components or global functions
   */
  getTimeOfDay() {
    return this.state.timeOfDay;
  }

  /**
   * Get the current time in minutes
   */
  getCurrentTime() {
    return this.state.time;
  }

  /**
   * Get the current day
   */
  getCurrentDay() {
    return this.state.day;
  }
}

// Register the component with the UI system when available
document.addEventListener('DOMContentLoaded', () => {
  if (window.uiSystem) {
    window.uiSystem.registerComponent('timeSystem', new TimeSystemComponent());
  } else {
    // If UI system isn't ready yet, wait for it
    document.addEventListener('uiSystemReady', () => {
      window.uiSystem.registerComponent('timeSystem', new TimeSystemComponent());
    });
  }
});
