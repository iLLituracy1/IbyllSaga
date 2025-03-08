// characterCreation.js - Updated with UI integration
// Connects the character creation process with the UI framework

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

// CHARACTER CREATION MODULE
// Functions related to character creation

// Function to select origin (heritage)
window.selectOrigin = function(origin) {
  // Validate origin
  if (!window.origins[origin]) {
    console.error(`Invalid origin: ${origin}`);
    return;
  }
  
  // Set the selected origin - force as string
  window.player.origin = String(origin);
  
  // Publish origin selected event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('origin:selected', { origin: origin });
  }
  
  // Update the UI to show origin description
  document.getElementById('originDescription').innerHTML = window.origins[origin].description;
  
  // Clear and populate career options based on the selected origin
  const careerOptionsDiv = document.getElementById('careerOptions');
  careerOptionsDiv.innerHTML = '';
  
  // Add career buttons for the selected origin
  window.origins[origin].careers.forEach(career => {
    const careerButton = document.createElement('button');
    careerButton.className = 'menu-button';
    careerButton.textContent = career.title;
    careerButton.onclick = function() {
      window.selectCareer(career.title);
    };
    careerOptionsDiv.appendChild(careerButton);
    
    // Add career description paragraph below the button
    const careerDesc = document.createElement('p');
    careerDesc.textContent = career.description;
    careerOptionsDiv.appendChild(careerDesc);
  });
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'intro', 
      to: 'originSection' 
    });
  } else {
    // Fallback: Transition from intro to origin section using direct DOM manipulation
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('originSection').classList.remove('hidden');
  }
};

window.backToIntro = function() {
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'originSection', 
      to: 'intro' 
    });
  } else {
    // Return to the heritage selection screen using direct DOM manipulation
    document.getElementById('originSection').classList.add('hidden');
    document.getElementById('intro').classList.remove('hidden');
  }
};

window.selectCareer = function(career) {
  // Validate career exists
  if (!career) {
    console.error("Invalid career selected");
    return;
  }
  
  // Set the selected career - force career title as string
  window.player.career = {
    title: String(career),
    description: window.prologues[career] || "A skilled professional ready for battle."
  };
  
  // Publish career selected event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('career:selected', { 
      origin: window.player.origin, 
      career: career 
    });
  }
  
  // Update attributes based on origin - use explicit Number conversion
  const statRange = window.statRanges[window.player.origin];
  if (statRange) {
    const physValue = Math.floor(Math.random() * (statRange.phy[1] - statRange.phy[0] + 1)) + statRange.phy[0];
    const menValue = Math.floor(Math.random() * (statRange.men[1] - statRange.men[0] + 1)) + statRange.men[0];
    
    // Force conversion to number to avoid string/type issues
    window.player.phy = Number(physValue);
    window.player.men = Number(menValue);
    
    console.log("Initial attributes set:", {
      origin: window.player.origin,
      phy: window.player.phy,
      men: window.player.men,
      phyRange: statRange.phy,
      menRange: statRange.men,
      physValue: physValue,
      menValue: menValue
    });
  }
  
  // Set initial skills based on career
  window.setInitialSkills(career);
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'originSection', 
      to: 'nameSection' 
    });
  } else {
    // Move to the name entry screen using direct DOM manipulation
    document.getElementById('originSection').classList.add('hidden');
    document.getElementById('nameSection').classList.remove('hidden');
  }
};

window.backToOrigin = function() {
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'nameSection', 
      to: 'originSection' 
    });
  } else {
    // Return to the career selection screen using direct DOM manipulation
    document.getElementById('nameSection').classList.add('hidden');
    document.getElementById('originSection').classList.remove('hidden');
  }
};

window.setName = function() {
  // Get the name from the input field
  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value.trim();
  
  // Validate name (not empty)
  if (name === '') {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification('Please enter a name for your character.', 'warning');
    } else {
      alert('Please enter a name for your character.');
    }
    return;
  }
  
  // Set the character name
  window.player.name = name;
  
  // Publish name set event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('name:set', { name: name });
  }
  
  // Generate character summary
  const summary = window.generateCharacterSummary();
  document.getElementById('characterSummary').innerHTML = summary;
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'nameSection', 
      to: 'finalOutput' 
    });
  } else {
    // Move to the final character summary screen using direct DOM manipulation
    document.getElementById('nameSection').classList.add('hidden');
    document.getElementById('finalOutput').classList.remove('hidden');
  }
};

window.backToName = function() {
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'finalOutput', 
      to: 'nameSection' 
    });
  } else {
    // Return to the name entry screen using direct DOM manipulation
    document.getElementById('finalOutput').classList.add('hidden');
    document.getElementById('nameSection').classList.remove('hidden');
  }
};

window.confirmCharacter = function() {
  // Initialize relationships with camp characters
  window.initializeRelationships();
  
  // Publish character confirmed event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('character:confirmed', { player: window.player });
  }
  
  // Request prologue text if using the UI framework
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('prologue:request', {
      origin: window.player.origin,
      career: window.player.career.title
    });
  }
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'finalOutput', 
      to: 'prologueSection',
      beforeFn: function() {
        // Set prologue text based on selected career
        const prologueText = window.prologues[window.player.career.title] || "Your journey begins...";
        document.getElementById('prologueText').innerHTML = prologueText;
      }
    });
  } else {
    // Create the character and prepare for prologue using direct DOM manipulation
    document.getElementById('finalOutput').classList.add('hidden');
    document.getElementById('prologueSection').classList.remove('hidden');
    
    // Set prologue text based on selected career
    const prologueText = window.prologues[window.player.career.title] || "Your journey begins...";
    document.getElementById('prologueText').innerHTML = prologueText;
  }
};

window.showEmpireUpdate = function() {
  // Publish prologue complete event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('prologue:complete', {});
  }
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'prologueSection', 
      to: 'empireSection',
      beforeFn: function() {
        // Set empire update text
        document.getElementById('empireText').innerHTML = window.empireUpdateText;
      }
    });
  } else {
    // Show the empire update screen (second part of prologue) using direct DOM manipulation
    document.getElementById('prologueSection').classList.add('hidden');
    document.getElementById('empireSection').classList.remove('hidden');
    
    // Set empire update text
    document.getElementById('empireText').innerHTML = window.empireUpdateText;
  }
};

window.startAdventure = function() {
  // Publish adventure start event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('adventure:start', { player: window.player });
  }
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'characterCreation', 
      to: 'mainGame'
    });
  } else {
    // Transition from character creation to the main game using direct DOM manipulation
    document.getElementById('creator').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    // Initialize game state
    window.initializeGameState();
    
    // Update status bars and action buttons
    window.updateStatusBars();
    window.updateTimeAndDay(0); // Start at the initial time
    window.updateActionButtons();
    
    // Set initial narrative
    window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
    Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
    The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
    For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`);
  }
};

window.generateCharacterSummary = function() {
  let summary = `<p><strong>Name:</strong> ${window.player.name}</p>`;
  summary += `<p><strong>Heritage:</strong> ${window.player.origin}</p>`;
  summary += `<p><strong>Career:</strong> ${window.player.career.title}</p>`;
  summary += `<p><strong>Physical:</strong> ${window.player.phy}</p>`;
  summary += `<p><strong>Mental:</strong> ${window.player.men}</p>`;
  
  // Add career description if available
  const careerInfo = window.origins[window.player.origin].careers.find(c => c.title === window.player.career.title);
  if (careerInfo && careerInfo.description) {
    summary += `<p>${careerInfo.description}</p>`;
  }
  
  // Add skills
  summary += `<p><strong>Skills:</strong></p><ul>`;
  
  for (const [skill, value] of Object.entries(window.player.skills)) {
    if (value > 0) {
      summary += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${value.toFixed(1)}</li>`;
    }
  }
  
  summary += `</ul>`;
  
  return summary;
};

window.setInitialSkills = function(career) {
  // Reset all skills to base values
  for (const skill in window.player.skills) {
    window.player.skills[skill] = 0;
  }
  
  // If using the new career system for skills
  if (window.CareerSystem && typeof window.CareerSystem.generateCareerSkills === 'function') {
    const skills = window.CareerSystem.generateCareerSkills(career);
    Object.assign(window.player.skills, skills);
    console.log("Skills set using CareerSystem:", window.player.skills);
    return;
  }
  
  // Fallback: Set skills based on career - ensuring we use numbers
  if (career.includes("Regular") || career.includes("Infantry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Scout") || career.includes("Harrier")) {
    window.player.skills.marksmanship = Number(2);
    window.player.skills.survival = Number(1.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Geister")) {
    window.player.skills.melee = Number(1);
    window.player.skills.arcana = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Berserker") || career.includes("Primal")) {
    window.player.skills.melee = Number(2.5);
    window.player.skills.survival = Number(1.5);
  } else if (career.includes("Sellsword") || career.includes("Marine")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.marksmanship = Number(1.5);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Cavalry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.command = Number(1.5);
    window.player.skills.tactics = Number(1);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Marauder")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.command = Number(0.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Corsair")) {
    window.player.skills.melee = Number(1);
    window.player.skills.survival = Number(1);
    window.player.skills.tactics = Number(1);
    window.player.skills.organization = Number(1);
  } else if (career.includes("Squire")) {
    window.player.skills.melee = Number(.5);
    window.player.skills.discipline = Number(.5);
    window.player.skills.organization = Number(1);
    window.player.skills.survival = Number(.5);
  }
  
  // Add a bit of randomness to initial skill values - ensure we use numbers
  for (const skill in window.player.skills) {
    if (window.player.skills[skill] > 0) {
      const randomBonus = Number(parseFloat((Math.random() * 0.5).toFixed(1)));
      window.player.skills[skill] = Number(window.player.skills[skill]) + Number(randomBonus);
    }
  }
};

window.initializeRelationships = function() {
  // Initialize relationships with camp characters
  window.player.relationships = {};
  
  window.campCharacters.forEach(character => {
    window.player.relationships[character.id] = {
      name: character.name,
      disposition: character.disposition,
      interactions: 0
    };
  });
};

// NEW: Character Creation System object for UI integration
window.CharacterCreationSystem = {
  // Initialize the character creation system
  init: function() {
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Hook into existing buttons if not already done
      this.setupButtonHandlers();
      
      console.log('Character Creation system initialized with UI integration');
    } else {
      console.log('Character Creation system initialized (standalone)');
    }
    
    return this;
  },
  
  // Set up button handlers for UI integration
  setupButtonHandlers: function() {
    // Only set up if needed
    if (this.handlersInitialized) return;
    
    // Handle character confirmation
    window.UI.system.eventBus.subscribe('character:confirmed', data => {
      console.log('Character confirmed:', data.player);
      
      // Initialize game state if the function exists
      if (typeof window.initializeGameState === 'function') {
        window.initializeGameState();
      }
    });
    
    // Handle adventure start
    window.UI.system.eventBus.subscribe('adventure:start', data => {
      console.log('Adventure starting for:', data.player);
      
      // Initialize inventory if needed
      if (typeof window.initializeInventorySystem === 'function') {
        window.initializeInventorySystem();
      }
      
      // Add starting equipment
      if (typeof window.addStartingItems === 'function') {
        window.addStartingItems();
      }
    });
    
    this.handlersInitialized = true;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  // Check if UI system is ready directly or wait for it
  if (window.UI && window.UI.system) {
    window.CharacterCreationSystem.init();
    
    // Register with UI system
    window.UI.system.registerComponent('characterCreation', window.CharacterCreationSystem);
  } else {
    // Wait for UI system to be ready
    document.addEventListener('uiSystemReady', function() {
      window.CharacterCreationSystem.init();
      
      // Register with UI system
      window.UI.system.registerComponent('characterCreation', window.CharacterCreationSystem);
    });
  }
});
