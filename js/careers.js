// careers.js - Updated with UI integration
// Maintains compatibility with existing code while adding event system integration

// Original game data preserved
window.prologues = {
  "Paanic Regular": `<p>The dust of a thousand battles clings to your boots, the weight of generations of soldiers' blood and sweat upon your shoulders. Born in the heartlands of the Empire, you were raised under the warhorn's call, with the clang of steel in narrow streets. Now, with spear or sword in hand, you stand as part of the iron core of the Empire's vast machine. Every command tests your resolve as you march on, even when the battlefield is soaked in blood.</p>`,
  "Geister Initiate": `<p>In the deeper corners of the Empire, where the world's weight presses hardest, you have tread paths few dare to follow. As an initiate of the Geister Charters, you have stood on the precipice of the supernatural, where the boundary between life and death is as thin as a whispered prayer. In the cold halls of your charter, you practiced ancient rites—wielding cleaver and sword, sealing doors against revenants. Now, the Empire's call forces you onto the front lines. Will the screams of battle forge a new destiny for you?</p>`,
  "Paanic Noble Youth": `<p>Born under the banner of a noble house, you were raised among the finest tutors, mastering court etiquette, swordsmanship, and horsemanship. Your world was one of marble halls and lush estates until the Empire's call forced you into the wilds of battle. Now, as a scout, you ride with the lightest of feet and the sharpest of wits, carving your path through chaos. The test is clear: rise above, or fade into obscurity.</p>`,
  "Nesian Scout": `<p>Behind the towering walls of Nesia, you were forged in a realm where danger lurks at every turn. With your matchlock rifle re-engineered from ancient ruins, you became a master of long-range death. From high battlements, you have observed battle unfold, yet now, far from home, your precise aim must guide you through the chaos of war.</p>`,
  "Nesian Squire": `<p>Raised beneath the noble spires of Nesia, you were trained in both the art of war and the manners of court. Now, as a man-at-arms, your loyalty and skill are tested on brutal battlefields. The shifting tides of war will decide whether discipline and honor are enough, or if your personal ambition will carve out your destiny.</p>`,
  "Castellan Cavalry": `<p>Born to a family of equestrian warriors, your destiny was written on horseback. As a Castellan, you are bred to shatter enemy lines with the thunder of your charge. Yet in foreign lands, your mount's speed and strength may bring victory—or swift demise. The pride of your house rides with you; will it be enough to survive the crucible of war?</p>`,
  "Lunarine Sellsword": `<p>The crowded streets of Lunaris were your first battlefield, where every brawl honed your skills as a fighter for hire. You fought for coin, survival, and fleeting glory. Now, under the imperial banner, your mercenary instincts are thrust into a grander conflict. Will the chaos of battle be just another job, or will you discover a higher calling amidst the clash of arms?</p>`,
  "Lunarine Marine": `<p>The salt wind, ocean spray, and roaring waves were your first teachers. As a marine, you mastered shipboard combat. Now, the Empire calls you inland to unfamiliar battlefields. Can your sea-honed instincts adapt to the challenges of land warfare?</p>`,
  "Lunarine Corsair": `<p>Once a free-spirited corsair of the open seas, you reveled in the thrill of plunder and independence. Forced under imperial orders, your rebellious spirit must now balance with disciplined service. Can you reconcile your past glories with your new role, or will your untamed nature forever haunt you?</p>`,
  "Berserker": `<p>The vast Wyrdplains taught you to fight with raw, unbridled fury. Among untamed clans, you learned to channel your rage into devastating attacks. Now conscripted into the Empire, your primal strength is both a weapon and a curse. Will you master the tempest within, or will uncontrolled fury lead to your downfall?</p>`,
  "Marauder": `<p>In the wild expanses of the Wyrdplains, you thrived as a raider—striking with silent, lethal precision. Forced into imperial service, the echoes of your feral past persist with every step. Can you leave your old ways behind, or will your raider's spirit continue to define you?</p>`,
  "Plains Huntsman": `<p>From a young age, you tracked game across endless plains, mastering the art of the hunt with bow and spear. Your deep connection to nature is your greatest strength, yet the strict discipline of the legion challenges your free spirit. Will you reconcile your bond with the wild and the call of war, or remain forever torn between two worlds?</p>`
};

// Empire Update text (Prologue Follow-Up)
window.empireUpdateText = `
  <p>The Paanic Empire, once a symbol of unmatched strength and ambition, now finds itself at a crossroads. For centuries, it pushed outward from its mountain stronghold, stretching its iron grip across vast lands—from the merchant coasts of Lunaris to the storm-swept shores of the Arrasi Peninsula—driven by the unyielding will of the Daoshiin, the living embodiment of the Empire's divine right to conquer. Under this Emperor, the military became a juggernaut, with armies feared across every border, and geisters and noble warriors hardened by endless warfare.</p>
  <p>But that was before the fall of the Daoshiin—before the untimely death of the Empire's greatest leader. The fragile unity that once bound the Empire now threatens to unravel. The ruling Cen'nara and the nobility struggle for control, each faction vying for dominance as the absence of their guiding force creates chaos within the Empire. Cracks appear in the once-unassailable hierarchy, and uncertainty breeds internal conflict even as external threats loom.</p>
  <p>To the west, the Arrasi Peninsula remains a persistent thorn. Its scattered kingdoms, fueled by ancient animosities and raiding traditions, now sense an opportunity in the Empire's weakness. Their fierce warriors, empowered by the mysterious forces of the Crystalline Plains, are preparing to strike in vengeance.</p>
  <p>Far to the north, in the Crownward Steppe, a coalition of feudal kingdoms has united to resist the Empire's advance. Once fractured, these kingdoms now stand together as a formidable force determined to repel the invaders. For the Empire's commanders, the Crownward is an impregnable bastion, yet its resistance comes at a steep cost.</p>
  <p>In the face of growing instability, the Empire calls upon all able-bodied citizens. Volunteers, conscripts, and the desperate alike are urged to march under the Paanic banner—a summons to defend the Empire's legacy, forge a new path through war and hardship, and claim a place in history.</p>
  <p>Your journey begins in the distant corners of the Empire, where you travel by caravan to Paan'eun, the heart of the Empire, where the Grand Citadel stands—a towering symbol of hope for those who pledge their lives to the cause. In the capital, you join new recruits undergoing rigorous training, where the clash of steel and the roar of marching feet forge a unity born of discipline and sacrifice.</p>
  <p>After months of arduous preparation at Fort Paalanus, you are assigned to a Kasvaari—a regiment at the heart of the Empire's military. Here, you train with your comrades, master deadly tactics, and forge bonds that will define your destiny. The Empire is fractured, its borders beset from within and without, yet you stand as a testament to its might, however fragile. Your story is only beginning. The path ahead is paved with blood, honor, and war. What will you make of it?</p>
`;

// NEW: Career system integration with UI framework
window.CareerSystem = {
  // Initialize the career system
  init: function() {
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Subscribe to prologue request events
      window.UI.system.eventBus.subscribe('prologue:request', this.handlePrologueRequest.bind(this));
      
      // Subscribe to prologue complete events
      window.UI.system.eventBus.subscribe('prologue:complete', this.handlePrologueComplete.bind(this));
      
      console.log('Career system initialized with UI integration');
    } else {
      console.log('Career system initialized (standalone)');
    }
    
    return this;
  },
  
  // Get prologue text for a specific career
  getPrologue: function(careerTitle) {
    return window.prologues[careerTitle] || `<p>You embark on your journey as a ${careerTitle}.</p>`;
  },
  
  // Get empire update text
  getEmpireUpdate: function() {
    return window.empireUpdateText;
  },
  
  // Generate career-specific skills
  generateCareerSkills: function(careerTitle) {
    const skills = {
      melee: 0,
      marksmanship: 0,
      survival: 0,
      command: 0,
      discipline: 0,
      tactics: 0,
      organization: 0,
      arcana: 0
    };
    
    // Assign skills based on career
    if (careerTitle.includes("Regular") || careerTitle.includes("Infantry")) {
      skills.melee = 2;
      skills.discipline = 1.5;
      skills.survival = 1;
    } else if (careerTitle.includes("Scout") || careerTitle.includes("Harrier")) {
      skills.marksmanship = 2;
      skills.survival = 1.5;
      skills.tactics = 1;
    } else if (careerTitle.includes("Geister")) {
      skills.melee = 1;
      skills.arcana = 2;
      skills.discipline = 1.5;
      skills.tactics = 1;
    } else if (careerTitle.includes("Berserker") || careerTitle.includes("Primal")) {
      skills.melee = 2.5;
      skills.survival = 1.5;
    } else if (careerTitle.includes("Sellsword") || careerTitle.includes("Marine")) {
      skills.melee = 1.5;
      skills.marksmanship = 1.5;
      skills.survival = 1;
    } else if (careerTitle.includes("Cavalry")) {
      skills.melee = 2;
      skills.command = 1.5;
      skills.tactics = 1;
      skills.survival = 1;
    } else if (careerTitle.includes("Marauder")) {
      skills.melee = 1.5;
      skills.command = 0.5;
      skills.tactics = 1;
    } else if (careerTitle.includes("Corsair")) {
      skills.melee = 1;
      skills.survival = 1;
      skills.tactics = 1;
      skills.organization = 1;
    } else if (careerTitle.includes("Squire")) {
      skills.melee = 0.5;
      skills.discipline = 0.5;
      skills.organization = 1;
      skills.survival = 0.5;
    }
    
    // Add a bit of randomness to initial skill values
    for (const skill in skills) {
      if (skills[skill] > 0) {
        const randomBonus = parseFloat((Math.random() * 0.5).toFixed(1));
        skills[skill] = Number(skills[skill]) + Number(randomBonus);
      }
    }
    
    return skills;
  },
  
  // Handle prologue request event
  handlePrologueRequest: function(data) {
    const { origin, career } = data;
    console.log(`Prologue requested for ${career} (${origin})`);
    
    // Get prologue text
    const prologueText = this.getPrologue(career);
    
    // Generate career skills
    const skills = this.generateCareerSkills(career);
    
    // Publish prologue text event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('prologue:text', { 
        origin: origin,
        career: career,
        text: prologueText,
        skills: skills
      });
    }
    
    // Update DOM if running in standalone mode
    if (document.getElementById('prologueText')) {
      document.getElementById('prologueText').innerHTML = prologueText;
    }
  },
  
  // Handle prologue complete event
  handlePrologueComplete: function(data) {
    console.log('Prologue complete, showing empire update');
    
    // Get empire update text
    const empireText = this.getEmpireUpdate();
    
    // Publish empire update text event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('empireUpdate:text', { 
        text: empireText
      });
    }
    
    // Update DOM if running in standalone mode
    if (document.getElementById('empireText')) {
      document.getElementById('empireText').innerHTML = empireText;
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  window.CareerSystem.init();
  
  // If UI system is already loaded, register with it
  if (window.UI && window.UI.system) {
    window.UI.system.registerComponent('careerSystem', window.CareerSystem);
  }
});
