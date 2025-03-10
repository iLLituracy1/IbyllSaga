// CharacterCreationSystem.js - Fixed version
// A centralized system for handling character creation

window.CharacterCreationSystem = {
  // State tracking
  state: {
    initialized: false,
    currentSection: 'intro',
    sections: ['intro', 'originSection', 'nameSection', 'finalOutput', 'prologueSection', 'empireSection'],
    buttonHandlersAttached: false
  },
  
  // Initialize the character creation system
  init: function() {
    console.log("Initializing Character Creation System...");
    
    // Prevent double initialization
    if (this.state.initialized) {
      console.log("Character Creation System already initialized");
      return this;
    }
    
    // Ensure player object exists
    if (!window.player) {
      window.player = {
        name: "",
        origin: "",
        career: { title: "", description: "" },
        phy: 0,
        men: 0,
        skills: {
          melee: 0,
          marksmanship: 0,
          survival: 0,
          command: 0,
          discipline: 0,
          tactics: 0,
          organization: 0,
          arcana: 0
        },
        inventory: [],
        equipment: {},
        relationships: {}
      };
    }
    
    // Setup event delegation for buttons to avoid multiple handlers
    this.setupButtonHandlers();
    
    // Verify all needed elements exist and are properly styled
    this.verifyDOMElements();
    
    // Set initialized flag
    this.state.initialized = true;
    console.log("Character Creation System initialized successfully");
    
    return this;
  },
  
  // Setup event handlers using single event delegation approach
  setupButtonHandlers: function() {
    if (this.state.buttonHandlersAttached) {
      return;
    }
    
    console.log("Setting up character creation button handlers");
    
    // Get the creator container
    const creator = document.getElementById('creator');
    if (!creator) {
      console.error("Creator container not found");
      return;
    }
    
    // Use a single delegated event handler for all buttons
    creator.addEventListener('click', (event) => {
      // Find the closest button ancestor
      const button = event.target.closest('button');
      if (!button) return; // Not a button click
      
      console.log("Button clicked:", button.id);
      
      // Handle button by ID
      if (button.id === 'paanic-button') this.selectOrigin('Paanic');
      else if (button.id === 'nesian-button') this.selectOrigin('Nesian');
      else if (button.id === 'lunarine-button') this.selectOrigin('Lunarine');
      else if (button.id === 'wyrdman-button') this.selectOrigin('Wyrdman');
      else if (button.id === 'back-to-intro-button') this.backToIntro();
      else if (button.id === 'back-to-origin-button') this.backToOrigin();
      else if (button.id === 'confirm-name-button') this.setName();
      else if (button.id === 'back-to-name-button') this.backToName();
      else if (button.id === 'confirm-character-button') this.confirmCharacter();
      else if (button.id === 'continue-to-empire-button') this.showEmpireUpdate();
      else if (button.id === 'start-adventure-button') this.startAdventure();
      else if (button.id.startsWith('career-')) {
        const careerElement = button.id.replace('career-', '');
        this.selectCareer(button.textContent);
        this.transitionToSection('originSection', 'nameSection');
      }

      
    });
    
    this.state.buttonHandlersAttached = true;
    console.log("Button handlers attached");
  },
  
  // Verify all DOM elements exist and have correct styles
  verifyDOMElements: function() {
    console.log("Verifying DOM elements...");
    
    // Check if creator exists
    const creator = document.getElementById('creator');
    if (!creator) {
      console.error("Creator element not found");
      return;
    }
    
    // Make sure creator is visible
    if (creator.classList.contains('hidden')) {
      console.log("Creator element was hidden, making visible");
      creator.classList.remove('hidden');
    }
    
    // Find the heritage options container
    const heritageOptions = creator.querySelector('.heritage-options');
    if (!heritageOptions) {
      console.error("Heritage options container not found");
      return;
    }
    
    // Ensure all heritage buttons exist and have proper styles
    const expectedButtons = [
      { id: 'paanic-button', text: 'Paanic' },
      { id: 'nesian-button', text: 'Nesian' },
      { id: 'lunarine-button', text: 'Lunarine' },
      { id: 'wyrdman-button', text: 'Wyrdman' }
    ];
    
    expectedButtons.forEach(buttonInfo => {
      let button = document.getElementById(buttonInfo.id);
      
      // Create button if it doesn't exist
      if (!button) {
        console.log(`Creating missing button: ${buttonInfo.id}`);
        button = document.createElement('button');
        button.id = buttonInfo.id;
        button.className = 'menu-button';
        button.textContent = buttonInfo.text;
        heritageOptions.appendChild(button);
      }
      
      // Ensure button has proper styles
      this.applyButtonStyles(button);
      
      // Verify button dimensions
      const rect = button.getBoundingClientRect();
      console.log(`Button ${buttonInfo.id}: width=${rect.width}, height=${rect.height}`);
      
      // If button has no size, something is still wrong - try one more fix
      if (rect.width === 0 || rect.height === 0) {
        console.log(`Applying emergency inline styles to ${buttonInfo.id}`);
        button.setAttribute('style', 'display: block !important; min-height: 50px !important; min-width: 200px !important; width: 100% !important; margin-bottom: 10px !important; border: 2px solid #c9a959 !important; background-color: #334155 !important; color: #e2e8f0 !important; padding: 0.75rem 1.5rem !important; border-radius: 4px !important; position: relative !important; z-index: 10 !important; cursor: pointer !important;');
      }
    });
    
    console.log("DOM elements verified");
  },
  
  // Apply consistent styles to buttons
  applyButtonStyles: function(button) {
    button.style.minHeight = '50px';
    button.style.minWidth = '200px';
    button.style.width = '100%';
    button.style.display = 'block';
    button.style.marginBottom = '10px';
    button.style.border = '2px solid #c9a959';
    button.style.backgroundColor = '#334155';
    button.style.color = '#e2e8f0';
    button.style.padding = '0.75rem 1.5rem';
    button.style.borderRadius = '4px';
    button.style.fontFamily = 'inherit';
    button.style.fontSize = '1rem';
    button.style.position = 'relative';
    button.style.zIndex = '10';
    button.style.cursor = 'pointer';
  },
  
  // Handle transitions between sections
  transitionToSection: function(fromSection, toSection) {
    console.log(`Transitioning from ${fromSection} to ${toSection}`);
    
    // Get section elements
    const fromElement = document.getElementById(fromSection);
    const toElement = document.getElementById(toSection);
    
    if (!fromElement) {
      console.error(`From section not found: ${fromSection}`);
      return;
    }
    
    if (!toElement) {
      console.error(`To section not found: ${toSection}`);
      return;
    }
    
    // Update state
    this.state.currentSection = toSection;
    
    // Hide from section and show to section
    fromElement.classList.add('hidden');
    toElement.classList.remove('hidden');
    
    // Use UI transition system if available
    if (window.UI && window.UI.system && window.UI.system.components.transition) {
      window.UI.system.eventBus.publish('requestTransition', { 
        from: fromSection, 
        to: toSection 
      });
    }
  },
  
  // Character creation workflow methods (reimplemented for reliability)
  
  // Select origin (heritage)
  selectOrigin: function(origin) {
    console.log(`Selecting origin: ${origin}`);
    
    // Validate origin
    if (!window.origins || !window.origins[origin]) {
      console.error(`Invalid origin: ${origin}`);
      return;
    }
    
    // Set player origin
    window.player.origin = origin;
    
    // Update origin description
    const descriptionElement = document.getElementById('originDescription');
    if (descriptionElement) {
      descriptionElement.innerHTML = window.origins[origin].description;
    }
    
    // Update career options
    this.updateCareerOptions(origin);
    
    // Transition to origin section
    this.transitionToSection('intro', 'originSection');
    
    // Publish event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('origin:selected', { origin });
    }
  },
  
  // Update career options based on selected origin
  updateCareerOptions: function(origin) {
    const careerOptionsDiv = document.getElementById('careerOptions');
    if (!careerOptionsDiv) {
      console.error("Career options container not found");
      return;
    }
    
    // Clear existing options
    careerOptionsDiv.innerHTML = '';
    
    // Get careers for this origin
    const careers = window.origins[origin].careers;
    if (!careers || careers.length === 0) {
      console.error(`No careers found for origin: ${origin}`);
      return;
    }
    
    // Add career buttons
    careers.forEach(career => {
      // Create sanitized ID from career title
      const careerId = `career-${career.title.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Create button
      const button = document.createElement('button');
      button.id = careerId;
      button.className = 'menu-button';
      button.textContent = career.title;
      
      // Apply styles
      this.applyButtonStyles(button);
      
      careerOptionsDiv.appendChild(button);
      
      // Add description
      const desc = document.createElement('p');
      desc.textContent = career.description;
      careerOptionsDiv.appendChild(desc);
    });
  },
  
  // Select a career
  selectCareer: function(career) {
    console.log(`Selecting career: ${career}`);
    
    // Make sure player object exists
    if (!window.player) {
      console.error("Player object not initialized");
      return;
    }
    
    // Set career
    window.player.career = {
      title: career,
      description: ""
    };
    
    // Generate stats
    this.generateStats();
    
    // Publish event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('career:selected', { 
        origin: window.player.origin, 
        career: career 
      });
    }
  },
  
  // Generate stats based on origin and career
  generateStats: function() {
    // Get stat ranges for origin
    const statRange = window.statRanges[window.player.origin];
    if (!statRange) {
      console.error(`Stat ranges not found for origin: ${window.player.origin}`);
      window.player.phy = 2;
      window.player.men = 2;
      return;
    }
    
    // Generate random stats within range
    window.player.phy = Math.floor(Math.random() * (statRange.phy[1] - statRange.phy[0] + 1)) + statRange.phy[0];
    window.player.men = Math.floor(Math.random() * (statRange.men[1] - statRange.men[0] + 1)) + statRange.men[0];
    
    // Set initial skills based on career
    this.setInitialSkills();
  },
  
  // Set initial skills based on career
  setInitialSkills: function() {
    // Reset skills
    for (const skill in window.player.skills) {
      window.player.skills[skill] = 0;
    }
    
    const career = window.player.career.title;
    
    // Try to use CareerSystem if available
    if (window.CareerSystem && typeof window.CareerSystem.generateCareerSkills === 'function') {
      const skills = window.CareerSystem.generateCareerSkills(career);
      Object.assign(window.player.skills, skills);
      return;
    }
    
    // Fallback manual skill assignment
    if (career.includes("Regular") || career.includes("Infantry")) {
      window.player.skills.melee = 2;
      window.player.skills.discipline = 1.5;
      window.player.skills.survival = 1;
    } else if (career.includes("Scout") || career.includes("Harrier")) {
      window.player.skills.marksmanship = 2;
      window.player.skills.survival = 1.5;
      window.player.skills.tactics = 1;
    } else if (career.includes("Geister")) {
      window.player.skills.melee = 1;
      window.player.skills.arcana = 2;
      window.player.skills.discipline = 1.5;
      window.player.skills.tactics = 1;
    } else if (career.includes("Berserker") || career.includes("Primal")) {
      window.player.skills.melee = 2.5;
      window.player.skills.survival = 1.5;
    } else if (career.includes("Sellsword") || career.includes("Marine")) {
      window.player.skills.melee = 1.5;
      window.player.skills.marksmanship = 1.5;
      window.player.skills.survival = 1;
    }
    
    // Add randomness to skills
    for (const skill in window.player.skills) {
      if (window.player.skills[skill] > 0) {
        const randomBonus = parseFloat((Math.random() * 0.5).toFixed(1));
        window.player.skills[skill] = Number(window.player.skills[skill]) + Number(randomBonus);
      }
    }
  },
  
  // Set player name
  setName: function() {
    const nameInput = document.getElementById('nameInput');
    if (!nameInput) {
      console.error("Name input not found");
      return;
    }
    
    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter a name for your character.");
      nameInput.focus();
      return;
    }
    
    // Set name
    window.player.name = name;
    
    // Update character summary
    this.updateCharacterSummary();
    
    // Transition to final output
    this.transitionToSection('nameSection', 'finalOutput');
  },
  
  // Update character summary
  updateCharacterSummary: function() {
    const summaryElement = document.getElementById('characterSummary');
    if (!summaryElement) {
      console.error("Character summary element not found");
      return;
    }
    
    // Generate summary HTML
    let summary = `
      <h3>${window.player.name || "Unnamed Soldier"}</h3>
      <p><strong>Heritage:</strong> ${window.player.origin || "Unknown"}</p>
      <p><strong>Career:</strong> ${window.player.career?.title || "Undefined"}</p>
      <p><strong>Physical:</strong> ${window.player.phy || 0}</p>
      <p><strong>Mental:</strong> ${window.player.men || 0}</p>
      <h4>Skills:</h4>
      <ul>
    `;
    
    // Add skills
    for (const [skill, value] of Object.entries(window.player.skills)) {
      if (value > 0) {
        summary += `<li><strong>${skill}:</strong> ${value.toFixed(1)}</li>`;
      }
    }
    
    summary += `</ul>`;
    
    // Update the summary
    summaryElement.innerHTML = summary;
  },
  
  // Confirm character and proceed to prologue
  confirmCharacter: function() {
    console.log("Confirming character:", window.player);
    
    // Initialize relationships
    if (window.campCharacters) {
      window.player.relationships = {};
      window.campCharacters.forEach(character => {
        window.player.relationships[character.id] = {
          name: character.name,
          disposition: character.disposition,
          interactions: 0
        };
      });
    }
    
    // Update prologue text
    const prologueText = document.getElementById('prologueText');
    if (prologueText) {
      if (window.prologues && window.player.career.title) {
        prologueText.innerHTML = window.prologues[window.player.career.title] || "Your journey begins...";
      } else {
        prologueText.innerHTML = "Your journey begins...";
      }
    }
    
    // Transition to prologue
    this.transitionToSection('finalOutput', 'prologueSection');
    
    // Publish event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('character:confirmed', { player: window.player });
    }
  },
  
  // Show empire update (after prologue)
  showEmpireUpdate: function() {
    // Update empire text
    const empireText = document.getElementById('empireText');
    if (empireText) {
      empireText.innerHTML = window.empireUpdateText || `
        <p>The Paanic Empire stretches its influence into new territories. The Western Hierarchate is your destination, with its towering fortresses and ancient battlefields. The Arrasi Peninsula awaits beyond, its crystalline plains still a mystery to many who will fight there.</p>
        <p>The Empire needs soldiers like you. Your skills and heritage will be put to the test in the challenges ahead.</p>
      `;
    }
    
    // Transition to empire section
    this.transitionToSection('prologueSection', 'empireSection');
    
    // Publish event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('prologue:complete', {});
    }
  },
  
  // Start adventure (main game)
  startAdventure: function() {
    console.log("Starting adventure");
    
    // Hide creator, show game container
    const creator = document.getElementById('creator');
    const gameContainer = document.getElementById('gameContainer');
    
    if (!creator || !gameContainer) {
      console.error("Creator or game container not found");
      return;
    }
    
    // First hide creator to avoid visual issues during transition
    creator.classList.add('hidden');
    
    // Ensure gameContainer is ready
    gameContainer.classList.remove('hidden');
    
    // Check for UI system and explicitly initialize the sidebar if needed
    if (window.UI && window.UI.system) {
      // 1. First check if the sidebar component exists
      if (window.UI.system.components.sidebar) {
        console.log("Explicitly initializing sidebar");
        try {
          // Force reinitialization of sidebar
          window.UI.system.components.sidebar.initialize();
        } catch (e) {
          console.error("Error initializing sidebar:", e);
        }
      } else {
        console.error("Sidebar component not found in UI system");
      }
        
      // 2. Request a proper transition through the transition system
      window.UI.system.eventBus.publish('requestTransition', { 
        from: 'characterCreation', 
        to: 'mainGame'
      });
        
      // 3. Notify that adventure is starting
      window.UI.system.eventBus.publish('adventure:start', { player: window.player });
    } else {
      console.warn("UI system not found, falling back to basic initialization");
      this.basicGameInitialization();
    }
  },
  
  // Basic game initialization without UI system
  basicGameInitialization: function() {
    // Initialize game state
    if (typeof window.initializeGameState === 'function') {
      window.initializeGameState();
    }
    
    // Update game UI
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars();
    }
    
    if (typeof window.updateTimeAndDay === 'function') {
      window.updateTimeAndDay(0);
    }
    
    // Set initial narrative
    if (typeof window.setNarrative === 'function') {
      const introNarrative = `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
      Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
      The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
      For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`;
      
      window.setNarrative(introNarrative);
    }
  
    
    // Publish event if UI system is available
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('adventure:start', { player: window.player });
      
      // Use transition system if available
      window.UI.system.eventBus.publish('requestTransition', { 
        from: 'characterCreation', 
        to: 'mainGame'
      });
    }
  },
  
  // Navigation helpers
  backToIntro: function() {
    this.transitionToSection('originSection', 'intro');
  },
  
  backToOrigin: function() {
    this.transitionToSection('nameSection', 'originSection');
  },
  
  backToName: function() {
    this.transitionToSection('finalOutput', 'nameSection');
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  // Short delay to ensure DOM is fully loaded
  setTimeout(() => {
    window.CharacterCreationSystem.init();
    
    // Register with UI system if available
    if (window.UI && window.UI.system) {
      window.UI.system.registerComponent('characterCreation', window.CharacterCreationSystem);
    }
  }, 100);
});

// Re-implement window functions to call our system
window.selectOrigin = function(origin) {
  window.CharacterCreationSystem.selectOrigin(origin);
};

window.selectCareer = function(career) {
  window.CharacterCreationSystem.selectCareer(career);
};

window.setName = function() {
  window.CharacterCreationSystem.setName();
};

window.confirmCharacter = function() {
  window.CharacterCreationSystem.confirmCharacter();
};

window.showEmpireUpdate = function() {
  window.CharacterCreationSystem.showEmpireUpdate();
};

window.startAdventure = function() {
  window.CharacterCreationSystem.startAdventure();
};

window.backToIntro = function() {
  window.CharacterCreationSystem.backToIntro();
};

window.backToOrigin = function() {
  window.CharacterCreationSystem.backToOrigin();
};

window.backToName = function() {
  window.CharacterCreationSystem.backToName();
};

window.updateCharacterSummary = function() {
  window.CharacterCreationSystem.updateCharacterSummary();
};
