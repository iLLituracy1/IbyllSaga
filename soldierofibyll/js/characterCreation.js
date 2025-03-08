// CHARACTER CREATION MODULE
// Functions related to character creation

// Function to select origin (heritage)
window.selectOrigin = function(origin) {
  // Set the selected origin - force as string
  window.player.origin = String(origin);
  
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
  
  // Transition from intro to origin section
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('originSection').classList.remove('hidden');
};

window.backToIntro = function() {
  // Return to the heritage selection screen
  document.getElementById('originSection').classList.add('hidden');
  document.getElementById('intro').classList.remove('hidden');
};

window.selectCareer = function(career) {
  // Set the selected career - force career title as string
  window.player.career = {
    title: String(career),
    description: window.prologues[career] || "A skilled professional ready for battle."
  };
  
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
  
  // Move to the name entry screen
  document.getElementById('originSection').classList.add('hidden');
  document.getElementById('nameSection').classList.remove('hidden');
};

window.backToOrigin = function() {
  // Return to the career selection screen
  document.getElementById('nameSection').classList.add('hidden');
  document.getElementById('originSection').classList.remove('hidden');
};

window.setName = function() {
  // Get the name from the input field
  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value.trim();
  
  // Validate name (not empty)
  if (name === '') {
    alert('Please enter a name for your character.');
    return;
  }
  
  // Set the character name
  window.player.name = name;
  
  // Generate character summary
  const summary = window.generateCharacterSummary();
  document.getElementById('characterSummary').innerHTML = summary;
  
  // Move to the final character summary screen
  document.getElementById('nameSection').classList.add('hidden');
  document.getElementById('finalOutput').classList.remove('hidden');
};

window.backToName = function() {
  // Return to the name entry screen
  document.getElementById('finalOutput').classList.add('hidden');
  document.getElementById('nameSection').classList.remove('hidden');
};

window.confirmCharacter = function() {
  // Create the character and prepare for prologue
  document.getElementById('finalOutput').classList.add('hidden');
  document.getElementById('prologueSection').classList.remove('hidden');
  
  // Set prologue text based on selected career
  const prologueText = window.prologues[window.player.career.title] || "Your journey begins...";
  document.getElementById('prologueText').innerHTML = prologueText;
  
  // Initialize relationships with camp characters
  window.initializeRelationships();
};

window.showEmpireUpdate = function() {
  // Show the empire update screen (second part of prologue)
  document.getElementById('prologueSection').classList.add('hidden');
  document.getElementById('empireSection').classList.remove('hidden');
  
  // Set empire update text
  document.getElementById('empireText').innerHTML = window.empireUpdateText;
};

window.startAdventure = function() {
  // Transition from character creation to the main game
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
  
  // Set skills based on career - ensuring we use numbers
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