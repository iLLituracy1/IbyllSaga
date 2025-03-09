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
  console.log(`selectOrigin called with origin: ${origin}`);
  
  // Check if origins object exists
  if (!window.origins) {
    console.error('window.origins is not defined! Cannot select origin.');
    return;
  }
  
  // Function to find origin regardless of case
  function findOriginKey(searchOrigin) {
    // First try exact match
    if (window.origins[searchOrigin]) {
      return searchOrigin;
    }
    
    // Then try case-insensitive match
    const lowerSearchOrigin = searchOrigin.toLowerCase();
    for (const key in window.origins) {
      if (key.toLowerCase() === lowerSearchOrigin) {
        console.log(`Found case-insensitive match: ${searchOrigin} -> ${key}`);
        return key;
      }
    }
    
    return null;
  }
  
  // Find the correct case of the origin
  const originKey = findOriginKey(origin);
  
  // Validate origin
  if (!originKey) {
    console.error(`Invalid origin: ${origin}`);
    console.log('Available origins:', Object.keys(window.origins).join(', '));
    return;
  }
  
  console.log(`Selected valid origin: ${originKey} - ${window.origins[originKey].name || originKey}`);
  
  // Set the selected origin - use the correct case
  window.player.origin = originKey;
  
  // Publish origin selected event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('origin:selected', { origin: originKey });
    console.log('Published origin:selected event');
  }
  
  // Update the UI to show origin description
  const descriptionElement = document.getElementById('originDescription');
  if (descriptionElement) {
    descriptionElement.innerHTML = window.origins[originKey].description;
    console.log('Updated origin description in UI');
  } else {
    console.error('Could not find originDescription element to update');
  }
  
  // Clear and populate career options based on the selected origin
  const careerOptionsDiv = document.getElementById('careerOptions');
  
  if (!careerOptionsDiv) {
    console.error('Could not find careerOptions element');
    return;
  }
  
  careerOptionsDiv.innerHTML = '';
  
  // Add career buttons for the selected origin
  console.log(`Creating career buttons for ${originKey}`);
  
  if (!window.origins[originKey] || !window.origins[originKey].careers) {
    console.error(`No career data found for origin: ${originKey}`);
    return;
  }
  
  window.origins[originKey].careers.forEach(career => {
    console.log(`Creating button for career: ${career.title}`);
    
    const careerButton = document.createElement('button');
    careerButton.className = 'menu-button';
    careerButton.id = `career-${career.title.toLowerCase().replace(/\s+/g, '-')}`;
    careerButton.textContent = career.title;
    
    // Add multiple event binding approaches for redundancy
    
    // 1. Standard onclick property
    careerButton.onclick = function(event) {
      console.log(`Career button clicked: ${career.title}`);
      window.selectCareer(career.title);
      
      // Transition to name section
      document.getElementById('originSection').classList.add('hidden');
      document.getElementById('nameSection').classList.remove('hidden');
      
      // Prevent event bubbling
      event.stopPropagation();
    };
    
    // 2. Add event listener as backup
    careerButton.addEventListener('click', function(event) {
      console.log(`Career button event listener triggered: ${career.title}`);
      window.selectCareer(career.title);
      
      // Transition to name section
      document.getElementById('originSection').classList.add('hidden');
      document.getElementById('nameSection').classList.remove('hidden');
      
      // Prevent event bubbling
      event.stopPropagation();
    });
    
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
  console.log(`selectCareer called with career: ${career}`);
  
  // Validate career exists
  if (!career) {
    console.error("Invalid career selected");
    return;
  }
  
  // Check if player and player.origin are defined
  if (!window.player) {
    console.error("Player object is not defined");
    return;
  }
  
  if (!window.player.origin) {
    console.error("Player origin is not set");
    return;
  }
  
  // Ensure prologues exist
  if (!window.prologues) {
    console.warn("Prologues object is not defined, using default description");
  }
  
  // Set the selected career - force career title as string
  window.player.career = {
    title: String(career),
    description: (window.prologues && window.prologues[career]) || "A skilled professional ready for battle."
  };
  
  console.log(`Career set: ${career} for ${window.player.origin} character`);
  
  // Publish career selected event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('career:selected', { 
      origin: window.player.origin, 
      career: career 
    });
    console.log("Published career:selected event");
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
      menRange: statRange.men
    });
  } else {
    console.error(`Stat ranges not found for origin: ${window.player.origin}`);
    // Set default values
    window.player.phy = 2;
    window.player.men = 2;
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
  console.log("setName function called");
  
  // Get the name from the input field
  const nameInput = document.getElementById('nameInput');
  
  if (!nameInput) {
    console.error("Name input element not found");
    return;
  }
  
  const name = nameInput.value.trim();
  
  // Validate the name
  if (!name) {
    alert("Please enter a name for your character.");
    nameInput.focus();
    return;
  }
  
  console.log(`Setting player name to: ${name}`);
  
  // Set the player name
  window.player.name = name;
  
  // Update the character summary
  window.updateCharacterSummary();
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'nameSection', 
      to: 'finalOutput' 
    });
    console.log("Published transition request from nameSection to finalOutput");
  } else {
    // Move to the final output screen using direct DOM manipulation
    document.getElementById('nameSection').classList.add('hidden');
    document.getElementById('finalOutput').classList.remove('hidden');
    console.log("Manually transitioned from nameSection to finalOutput");
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
  console.log("Confirming character:", window.player);
  
  // Check if prologueText element exists
  const prologueTextElement = document.getElementById('prologueText');
  if (!prologueTextElement) {
    console.error("prologueText element not found");
    alert("Error: Could not find prologue display element. Please check console for details.");
    return;
  }
  
  // Initialize relationships with camp characters if function exists
  if (typeof window.initializeRelationships === 'function') {
    window.initializeRelationships();
    console.log("Relationships initialized");
  } else {
    console.warn("initializeRelationships function not found");
  }
  
  // Publish character confirmed event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('character:confirmed', { player: window.player });
    console.log("Published character:confirmed event");
  }
  
  // Request prologue text if using the UI framework
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('prologue:request', {
      origin: window.player.origin,
      career: window.player.career.title
    });
    console.log("Published prologue:request event");
  }
  
  // Get prologue text
  let prologueText = "Your journey begins...";
  if (window.prologues && window.player.career && window.player.career.title) {
    prologueText = window.prologues[window.player.career.title] || prologueText;
  }
  console.log("Setting prologue text for career:", window.player.career?.title);
  
  // Set the prologue text
  prologueTextElement.innerHTML = prologueText;
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'finalOutput', 
      to: 'prologueSection'
    });
    console.log("Published transition request from finalOutput to prologueSection");
  } else {
    // Create the character and prepare for prologue using direct DOM manipulation
    console.log("Using direct DOM manipulation for transition");
    document.getElementById('finalOutput').classList.add('hidden');
    document.getElementById('prologueSection').classList.remove('hidden');
  }
};

window.showEmpireUpdate = function() {
  console.log("Showing empire update");
  
  // Check if empireText element exists
  const empireTextElement = document.getElementById('empireText');
  if (!empireTextElement) {
    console.error("empireText element not found");
    alert("Error: Could not find empire update element. Please check console for details.");
    return;
  }
  
  // Publish prologue complete event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('prologue:complete', {});
    console.log("Published prologue:complete event");
  }
  
  // Set default empire update text if not defined
  if (!window.empireUpdateText) {
    console.warn("empireUpdateText not defined, using default text");
    window.empireUpdateText = `
      <p>The Paanic Empire stretches its influence into new territories. The Western Hierarchate is your destination, with its towering fortresses and ancient battlefields. The Arrasi Peninsula awaits beyond, its crystalline plains still a mystery to many who will fight there.</p>
      <p>The Empire needs soldiers like you. Your skills and heritage will be put to the test in the challenges ahead.</p>
    `;
  }
  
  // Set the empire update text
  empireTextElement.innerHTML = window.empireUpdateText;
  console.log("Empire update text set successfully");
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'prologueSection', 
      to: 'empireSection'
    });
    console.log("Published transition request from prologueSection to empireSection");
  } else {
    // Show the empire update screen (second part of prologue) using direct DOM manipulation
    console.log("Using direct DOM manipulation for transition");
    document.getElementById('prologueSection').classList.add('hidden');
    document.getElementById('empireSection').classList.remove('hidden');
  }
};

window.startAdventure = function() {
  console.log("Starting adventure for character:", window.player.name);
  
  // Publish adventure start event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('adventure:start', { player: window.player });
    console.log("Published adventure:start event");
  }
  
  // Use TransitionSystem if available
  if (window.UI && window.UI.system && window.UI.system.components.transition) {
    window.UI.system.eventBus.publish('requestTransition', { 
      from: 'characterCreation', 
      to: 'mainGame'
    });
    console.log("Published transition request from characterCreation to mainGame");
  } else {
    // Transition from character creation to the main game using direct DOM manipulation
    console.log("Using direct DOM manipulation for game start transition");
    
    // Check if required elements exist
    const creatorElement = document.getElementById('creator');
    const gameContainerElement = document.getElementById('gameContainer');
    
    if (!creatorElement) {
      console.error("Creator element not found");
      alert("Error: Could not find creator element. Please check console for details.");
      return;
    }
    
    if (!gameContainerElement) {
      console.error("Game container element not found");
      alert("Error: Could not find game container element. Please check console for details.");
      return;
    }
    
    // Hide creator and show game container
    creatorElement.classList.add('hidden');
    gameContainerElement.classList.remove('hidden');
    console.log("Transitioned from character creation to game container");
    
    // Initialize game state if function exists
    if (typeof window.initializeGameState === 'function') {
      window.initializeGameState();
      console.log("Game state initialized");
    } else {
      console.warn("initializeGameState function not found");
    }
    
    // Update status bars if function exists
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars();
      console.log("Status bars updated");
    } else {
      console.warn("updateStatusBars function not found");
    }
    
    // Update time and day if function exists
    if (typeof window.updateTimeAndDay === 'function') {
      window.updateTimeAndDay(0); // Start at the initial time
      console.log("Time and day updated");
    } else {
      console.warn("updateTimeAndDay function not found");
    }
    
    // Update action buttons if function exists
    if (typeof window.updateActionButtons === 'function') {
      window.updateActionButtons();
      console.log("Action buttons updated");
    } else {
      console.warn("updateActionButtons function not found");
    }
    
    // Set initial narrative if function exists
    if (typeof window.setNarrative === 'function') {
      const introNarrative = `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
      Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
      The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
      For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`;
      
      window.setNarrative(introNarrative);
      console.log("Initial narrative set");
    } else {
      console.warn("setNarrative function not found");
    }
    
    console.log("Adventure started successfully!");
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
    // Diagnostic check - run after a short delay to ensure DOM is loaded
    setTimeout(this.runDiagnostics, 1000);
    
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
  
  // Run diagnostics on character creation UI
  runDiagnostics: function() {
    console.log('Running character creation diagnostics...');
    
    // Check if heritage options div exists
    const heritageOptionsDiv = document.querySelector('.heritage-options');
    if (!heritageOptionsDiv) {
      console.error('Heritage options div not found!');
      return;
    }
    
    // Ensure heritage buttons exist
    const buttonIds = ['paanic-button', 'nesian-button', 'lunarine-button', 'wyrdman-button'];
    const buttonLabels = ['Paanic', 'Nesian', 'Lunarine', 'Wyrdman'];
    
    for (let i = 0; i < buttonIds.length; i++) {
      const id = buttonIds[i];
      const label = buttonLabels[i];
      let button = document.getElementById(id);
      
      if (!button) {
        console.log(`Creating missing button: ${id}`);
        button = document.createElement('button');
        button.id = id;
        button.className = 'menu-button';
        button.textContent = label;
        button.onclick = function() {
          console.log(`${label} clicked`);
          window.selectOrigin(label);
          document.getElementById('intro').classList.add('hidden');
          document.getElementById('originSection').classList.remove('hidden');
        };
        heritageOptionsDiv.appendChild(button);
      }
      
      // Force proper styling
      button.style.minHeight = '50px';
      button.style.minWidth = '200px';
      button.style.width = '100%';
      button.style.display = 'block';
      button.style.marginBottom = '10px';
      button.style.border = '2px solid #c9a959';
      button.style.position = 'relative';
      button.style.zIndex = '10';
      button.style.cursor = 'pointer';
    }
    
    // Check if buttons exist and are visible
    let allButtonsOk = true;
    
    buttonIds.forEach(id => {
      const button = document.getElementById(id);
      if (!button) {
        console.error(`Button not found: ${id}`);
        allButtonsOk = false;
        return;
      }
      
      // Check if button is visible
      const style = window.getComputedStyle(button);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        console.error(`Button is hidden: ${id}`, style);
        allButtonsOk = false;
      }
      
      // Check if button is positioned within viewport
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.error(`Button has no size: ${id}`, rect);
        allButtonsOk = false;
      }
      
      // Log button dimensions and position
      console.log(`Button ${id}: width=${rect.width}, height=${rect.height}, top=${rect.top}, left=${rect.left}`);
      
      // Manually add click handler as backup
      button.addEventListener('click', function() {
        alert(`Button clicked: ${id}`);
        const origin = id.split('-')[0];
        const capitalizedOrigin = origin.charAt(0).toUpperCase() + origin.slice(1);
        window.selectOrigin(capitalizedOrigin);
        document.getElementById('intro').classList.add('hidden');
        document.getElementById('originSection').classList.remove('hidden');
      });
    });
    
    if (allButtonsOk) {
      console.log('All heritage buttons appear to be correctly rendered');
    } else {
      console.error('Some heritage buttons have display issues - check console for details');
    }
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

// Convert CharacterCreationSystem to properly extend Component class
window.CharacterCreationSystem = Object.assign({}, window.CharacterCreationSystem, {
  setSystem: function(system) {
    this.system = system;
    // Inherit debug setting from system if needed
    if (system.debug) {
      this.debug = true;
    }
  }
});

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

// Update character summary in the UI
window.updateCharacterSummary = function() {
  console.log("Updating character summary");
  
  const summaryElement = document.getElementById('characterSummary');
  if (!summaryElement) {
    console.error("Character summary element not found");
    return;
  }
  
  // Generate HTML summary
  let summary = `
    <h3>${window.player.name || "Unnamed Soldier"}</h3>
    <p><strong>Heritage:</strong> ${window.player.origin || "Unknown"}</p>
    <p><strong>Career:</strong> ${window.player.career?.title || "Undefined"}</p>
    <p><strong>Physical:</strong> ${window.player.phy || 0}</p>
    <p><strong>Mental:</strong> ${window.player.men || 0}</p>
    <h4>Skills:</h4>
    <ul>
  `;
  
  // Add skills if they exist
  if (window.player.skills) {
    for (const [skill, value] of Object.entries(window.player.skills)) {
      if (value > 0) {
        summary += `<li><strong>${skill}:</strong> ${value}</li>`;
      }
    }
  }
  
  summary += `</ul>`;
  
  // Update the summary element
  summaryElement.innerHTML = summary;
  console.log("Character summary updated");
};
