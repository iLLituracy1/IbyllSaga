// MUSIC SYSTEM MODULE
// Adds background music functionality to the Soldier of Ibyll game

// Initialize the music system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Music System initializing...");
  
  // Initialize if not already done
  if (!window.musicSystemInitialized) {
    initMusicSystem();
  }
});

// Main initialization function
function initMusicSystem() {
  // Prevent multiple initializations
  if (window.musicSystemInitialized) {
    console.log("Music System already initialized");
    return;
  }
  
  window.musicSystemInitialized = true;
  console.log("Initializing Music System");
  
  // Create the music system object
  window.musicSystem = {
    // Audio player
    audio: new Audio(),
    
    // Configuration
    volume: parseFloat(localStorage.getItem('musicVolume') || 0.5),
    isMuted: localStorage.getItem('musicMuted') === 'true',
    isPlaying: false,
    currentTrackIndex: 0,
    repeatMode: localStorage.getItem('musicRepeat') || 'all', // 'none', 'one', 'all'
    
    // Playlist with the provided track names
    playlist: [
      { title: "Intro", file: "music/Intro.mp3", mood: "heroic" },
      { title: "Curious", file: "music/Curious.mp3", mood: "exploration" },
      { title: "Terra Firma", file: "music/TerraFirma.mp3", mood: "exploration" },
      { title: "Camp March", file: "music/CampMarch.mp3", mood: "heroic" },
      { title: "Victory Field", file: "music/VictoryField.mp3", mood: "heroic" },
      { title: "Wade Through", file: "music/WadeThrough.mp3", mood: "battle" },
      { title: "Gather", file: "music/Gather.mp3", mood: "calm" },
      { title: "End 1", file: "music/End1.mp3", mood: "melancholy" },
      { title: "End 2", file: "music/End2.mp3", mood: "melancholy" }
    ],
    
    // Methods
    init: function() {
      // Set up audio element
      this.audio.volume = this.isMuted ? 0 : this.volume;
      
      // Add event listeners
      this.audio.addEventListener('ended', () => this.playNext());
      this.audio.addEventListener('error', (e) => this.handleError(e));
      
      // Create UI
      this.createMusicControls();
      
      // Load first track but don't autoplay until user interacts
      this.loadTrack(0);
      
      console.log("Music System initialized with volume:", this.volume);
    },
    
    loadTrack: function(index) {
      // Default to first track if index is invalid
      if (index < 0 || index >= this.playlist.length) {
        index = 0;
      }
      
      this.currentTrackIndex = index;
      const track = this.playlist[index];
      
      // Try to load the track
      try {
        this.audio.src = track.file;
        this.audio.load();
        
        // Update UI
        document.getElementById('music-track-title').textContent = track.title;
        
        console.log(`Loaded track: ${track.title}`);
      } catch (error) {
        console.error("Error loading track:", error);
        this.handleError(error);
      }
    },
    
    play: function() {
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          this.updatePlayButton();
          console.log("Playing music");
        }).catch(error => {
          console.error("Playback error:", error);
          // Often, autoplay is blocked without user interaction
          this.isPlaying = false;
          this.updatePlayButton();
        });
      }
    },
    
    pause: function() {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayButton();
      console.log("Music paused");
    },
    
    togglePlay: function() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    
    playNext: function() {
      let nextIndex;
      
      if (this.repeatMode === 'one') {
        // Repeat current track
        nextIndex = this.currentTrackIndex;
      } else if (this.repeatMode === 'all') {
        // Go to next track, loop around if at end
        nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
      } else { // 'none'
        // Go to next track, stop if at end
        nextIndex = this.currentTrackIndex + 1;
        if (nextIndex >= this.playlist.length) {
          this.pause();
          return;
        }
      }
      
      this.loadTrack(nextIndex);
      if (this.isPlaying) {
        this.play();
      }
    },
    
    playPrevious: function() {
      // Go to previous track or beginning of current if far enough in
      let prevIndex;
      
      if (this.audio.currentTime > 3) { // If more than 3 seconds in, restart current
        this.audio.currentTime = 0;
        return;
      } else {
        // Go to previous track, loop to end if at beginning
        prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
          prevIndex = this.repeatMode === 'all' ? this.playlist.length - 1 : 0;
        }
      }
      
      this.loadTrack(prevIndex);
      if (this.isPlaying) {
        this.play();
      }
    },
    
    setVolume: function(value) {
      // Convert from percentage (0-100) to audio volume (0-1)
      const newVolume = Math.max(0, Math.min(1, value / 100));
      this.volume = newVolume;
      this.audio.volume = this.isMuted ? 0 : newVolume;
      
      // Update UI
      const volumeSlider = document.getElementById('music-volume-slider');
      if (volumeSlider) {
        volumeSlider.value = value;
      }
      
      // Save preference
      localStorage.setItem('musicVolume', newVolume);
      console.log(`Volume set to ${newVolume}`);
    },
    
    toggleMute: function() {
      this.isMuted = !this.isMuted;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      
      // Update UI
      const muteButton = document.getElementById('music-mute-button');
      if (muteButton) {
        muteButton.textContent = this.isMuted ? '🔇' : '🔊';
      }
      
      // Save preference
      localStorage.setItem('musicMuted', this.isMuted);
      console.log(`Mute toggled: ${this.isMuted}`);
    },
    
    toggleRepeat: function() {
      // Cycle through repeat modes
      if (this.repeatMode === 'none') {
        this.repeatMode = 'one';
      } else if (this.repeatMode === 'one') {
        this.repeatMode = 'all';
      } else {
        this.repeatMode = 'none';
      }
      
      // Update UI
      const repeatButton = document.getElementById('music-repeat-button');
      if (repeatButton) {
        if (this.repeatMode === 'none') repeatButton.textContent = '🔄';
        if (this.repeatMode === 'one') repeatButton.textContent = '🔂';
        if (this.repeatMode === 'all') repeatButton.textContent = '🔁';
      }
      
      // Save preference
      localStorage.setItem('musicRepeat', this.repeatMode);
      console.log(`Repeat mode set to ${this.repeatMode}`);
    },
    
    updatePlayButton: function() {
      const playButton = document.getElementById('music-play-button');
      if (playButton) {
        playButton.textContent = this.isPlaying ? '⏸️' : '▶️';
      }
    },
    
    handleError: function(error) {
      console.error("Music playback error:", error);
      
      // Show error in music player UI
      const trackTitle = document.getElementById('music-track-title');
      if (trackTitle) {
        const currentTrack = this.playlist[this.currentTrackIndex];
        trackTitle.textContent = `Error: ${currentTrack.title} not found`;
      }
      
      // Try next track after a brief delay
      setTimeout(() => this.playNext(), 2000);
    },
    
    // Create music control UI
    createMusicControls: function() {
      // First check if the controls already exist
      if (document.getElementById('music-player-container')) {
        console.log("Music controls already exist");
        return;
      }
      
      console.log("Creating music controls");
      
      // Create container
      const container = document.createElement('div');
      container.id = 'music-player-container';
      container.className = 'music-player';
      
      // Set styles
      container.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(26, 22, 33, 0.9);
        border: 1px solid #c9a959;
        border-radius: 8px;
        padding: 8px;
        z-index: 1000;
        font-family: 'Crimson Text', serif;
        color: #e0e0e0;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: all 0.3s;
        max-width: 250px;
      `;
      
      // Create header with title and toggle button
      const header = document.createElement('div');
      header.className = 'music-player-header';
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding-bottom: 5px;
        border-bottom: 1px solid rgba(201, 169, 89, 0.3);
      `;
      
      // Add header content
      header.innerHTML = `
        <div class="music-player-title" style="font-weight: bold; color: #c9a959;">Music Player</div>
        <div class="music-player-toggle" id="music-player-toggle" style="font-size: 1.2em;">🎵</div>
      `;
      
      // Create content container
      const content = document.createElement('div');
      content.id = 'music-player-content';
      content.className = 'music-player-content';
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      
      // Add track info
      content.innerHTML = `
        <div class="music-track-info" style="text-align: center; margin-bottom: 5px;">
          <div id="music-track-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">No track loaded</div>
        </div>
        
        <div class="music-controls" style="display: flex; justify-content: center; gap: 15px; align-items: center;">
          <button id="music-prev-button" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #e0e0e0;">⏮️</button>
          <button id="music-play-button" style="background: none; border: none; font-size: 1.4em; cursor: pointer; color: #e0e0e0;">▶️</button>
          <button id="music-next-button" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #e0e0e0;">⏭️</button>
        </div>
        
        <div class="music-volume" style="display: flex; align-items: center; gap: 10px;">
          <button id="music-mute-button" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #e0e0e0;">🔊</button>
          <input type="range" id="music-volume-slider" min="0" max="100" value="${this.volume * 100}" style="flex-grow: 1;">
          <button id="music-repeat-button" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #e0e0e0;">
            ${this.repeatMode === 'one' ? '🔂' : this.repeatMode === 'all' ? '🔁' : '🔄'}
          </button>
        </div>
      `;
      
      // Add container to body
      container.appendChild(header);
      container.appendChild(content);
      document.body.appendChild(container);
      
      // Set default state - collapsed unless user has expanded it before
      const wasExpanded = localStorage.getItem('musicPlayerExpanded') === 'true';
      if (!wasExpanded) {
        content.style.display = 'none';
      }
      
      // Add event listeners for controls
      
      // Toggle player expansion
      document.getElementById('music-player-toggle').addEventListener('click', function() {
        const content = document.getElementById('music-player-content');
        const isVisible = content.style.display !== 'none';
        
        content.style.display = isVisible ? 'none' : 'flex';
        localStorage.setItem('musicPlayerExpanded', !isVisible);
      });
      
      // Play/Pause button
      document.getElementById('music-play-button').addEventListener('click', () => this.togglePlay());
      
      // Next/Previous buttons
      document.getElementById('music-next-button').addEventListener('click', () => this.playNext());
      document.getElementById('music-prev-button').addEventListener('click', () => this.playPrevious());
      
      // Volume controls
      document.getElementById('music-volume-slider').addEventListener('input', (e) => this.setVolume(e.target.value));
      document.getElementById('music-mute-button').addEventListener('click', () => this.toggleMute());
      
      // Repeat button
      document.getElementById('music-repeat-button').addEventListener('click', () => this.toggleRepeat());
      
      // Set initial states
      this.updatePlayButton();
      document.getElementById('music-mute-button').textContent = this.isMuted ? '🔇' : '🔊';
      
      console.log("Music controls created");
    },
    
    // Change music based on game events or time of day
    contextualMusicChange: function(context) {
      // Determine appropriate tracks based on context
      let appropriateTracks = [];
      
      if (context === 'combat') {
        appropriateTracks = this.playlist.filter(track => track.mood === 'battle');
      } else if (context === 'camp') {
        appropriateTracks = this.playlist.filter(track => track.mood === 'calm');
      } else if (context === 'night') {
        appropriateTracks = this.playlist.filter(track => track.mood === 'melancholy' || track.mood === 'calm');
      } else if (context === 'day') {
        appropriateTracks = this.playlist.filter(track => track.mood === 'heroic' || track.mood === 'exploration');
      }
      
      // If no tracks match the context, don't change anything
      if (appropriateTracks.length === 0) return;
      
      // Pick a random track from appropriate tracks
      const randomTrack = appropriateTracks[Math.floor(Math.random() * appropriateTracks.length)];
      const trackIndex = this.playlist.findIndex(track => track.file === randomTrack.file);
      
      // Only change if it's different from current track
      if (trackIndex !== this.currentTrackIndex) {
        this.loadTrack(trackIndex);
        if (this.isPlaying) {
          this.play();
        }
      }
    }
  };
  
  // Initialize the music system
  window.musicSystem.init();
  
  // Add CSS for music player
  addMusicPlayerStyles();
  
  // Hook into game events to change music appropriately
  hookIntoGameEvents();
  
  console.log("Music System setup complete");
}

// Add CSS styles for music player
function addMusicPlayerStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .music-player {
      transition: opacity 0.3s, transform 0.3s;
    }
    
    .music-player:hover {
      opacity: 1 !important;
    }
    
    .music-player-minimized {
      opacity: 0.6;
      transform: scale(0.9);
    }
    
    .music-controls button:hover {
      transform: scale(1.1);
    }
    
    #music-volume-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      background: #3a2e40;
      outline: none;
      border-radius: 5px;
    }
    
    #music-volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: #c9a959;
      border-radius: 50%;
      cursor: pointer;
    }
    
    #music-volume-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: #c9a959;
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Hook into game events to change music contextually
function hookIntoGameEvents() {
  // Time of day changes
  const originalUpdateTimeAndDay = window.updateTimeAndDay;
  if (typeof originalUpdateTimeAndDay === 'function') {
    window.updateTimeAndDay = function(minutesToAdd) {
      // Call original function
      originalUpdateTimeAndDay(minutesToAdd);
      
      // Get time of day and update music
      if (typeof window.getTimeOfDay === 'function') {
        const timeOfDay = window.getTimeOfDay();
        window.musicSystem.contextualMusicChange(timeOfDay);
      }
    };
  }
  
  // Combat system
  if (window.gameState) {
    // Watch for changes to inBattle property
    let lastBattleState = window.gameState.inBattle;
    
    // Check periodically for battle state changes
    setInterval(() => {
      if (window.gameState.inBattle !== lastBattleState) {
        lastBattleState = window.gameState.inBattle;
        
        if (lastBattleState) {
          // Entered combat
          window.musicSystem.contextualMusicChange('combat');
        } else {
          // Left combat
          window.musicSystem.contextualMusicChange('camp');
        }
      }
    }, 1000);
  }
  
  // Initial music based on current game state
  setTimeout(() => {
    if (window.gameState && window.gameState.inBattle) {
      window.musicSystem.contextualMusicChange('combat');
    } else if (typeof window.getTimeOfDay === 'function') {
      window.musicSystem.contextualMusicChange(window.getTimeOfDay());
    } else {
      window.musicSystem.contextualMusicChange('camp');
    }
  }, 1000);
}

// Make a small "add music" function available to help users without music files
window.addCustomMusic = function(title, url, mood = 'calm') {
  if (!window.musicSystem) return;
  
  // Add a new track to the playlist
  window.musicSystem.playlist.push({
    title: title,
    file: url,
    mood: mood
  });
  
  console.log(`Added custom music track: ${title}`);
  
  // If this is the first track and nothing is playing, start it
  if (window.musicSystem.playlist.length === 1) {
    window.musicSystem.loadTrack(0);
  }
};

// Add example to help users without music files
function addExampleUrlMethod() {
  const helpText = document.createElement('div');
  helpText.style.cssText = `
    position: fixed;
    bottom: 95px;
    right: 10px;
    background: rgba(26, 22, 33, 0.9);
    border: 1px solid #c9a959;
    border-radius: 8px;
    padding: 8px;
    z-index: 999;
    font-family: 'Crimson Text', serif;
    color: #e0e0e0;
    font-size: 0.9em;
    max-width: 250px;
  `;
  
  helpText.innerHTML = `
    <p style="margin: 0 0 5px 0"><b>No music files?</b></p>
    <p style="margin: 0">Open browser console (F12) and run:</p>
    <code style="display: block; margin: 5px 0; padding: 3px; background: #000; color: #0f0;">
      addCustomMusic("Track Name", "https://url.to/music.mp3", "mood")
    </code>
    <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #aaa">This message will disappear in 15 seconds.</p>
  `;
  
  document.body.appendChild(helpText);
  
  // Remove after 15 seconds
  setTimeout(() => {
    if (helpText.parentNode) {
      helpText.parentNode.removeChild(helpText);
    }
  }, 15000);
}

// Initialize
initMusicSystem();

// Show example helper with a delay
setTimeout(addExampleUrlMethod, 3000);
