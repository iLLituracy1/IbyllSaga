// origins.js - Updated with UI integration
// Maintains compatibility with existing code while adding event system integration

// Original game data preserved
window.origins = {
  "Paanic": {
    description: `
      <p>You hail from the Empire's heartland—a realm of rolling fields, fortified hilltops, and bustling cities built upon ancient technology. In Cennen, the Agri-Ring towers like a metallic mountain of plenty. Raised amidst the Empire's grand ambitions, you were instilled with pride and duty.</p>
      <p>You enlisted with visions of glory and honor. As a Paanic soldier, you believe in order, discipline, and tradition. Yet the war you now face is about expansion and the Empire's relentless hunger for resources and prestige.</p>
    `,
    careers: [
      { title: "Regular", description: "Molded by strict drills and shield formations, you are the unyielding wall of the Empire's armies." },
      { title: "Geister Initiate", description: "Trained in the dark arts of geisting, you confront the restless dead amid ancient rites and urgent demands." },
      { title: "Noble Youth", description: "Born to privilege but forged in war, you combine noble heritage with the rigorous demands of battlefield scouting." }
    ]
  },
  "Nesian": {
    description: `
      <p>From the western lands of Nesia—where towering walls, labyrinthine cities, and opulent courts arise from ancient ruins—you were born into a world of feudal intrigue and noble power. In Eterpau, the grand capital, your early years were shaped by high stone ramparts and secret alliances.</p>
      <p>Your loyalty to the Empire was secured by political maneuvering and power plays. Now, marching east under the imperial banner, you must prove your mettle in a landscape where honor and ambition collide.</p>
    `,
    careers: [
      { title: "Scout", description: "With a re-engineered matchlock rifle from ancient ruins, you serve as a keen-eyed forward observer." },
      { title: "Squire", description: "Trained under a noble banner, you mastered swordsmanship and etiquette, now tested in brutal warfare." },
      { title: "Castellan Cavalry", description: "Riding advanced equestrian constructs, you embody Nesia's proud martial tradition, though survival is never assured." }
    ]
  },
  "Lunarine": {
    description: `
      <p>In Lunaris, the bustling coastal realm of Luna, you grew up amidst trade, diverse cultures, and the vibrant clamor of bazaars. Life in the merchant city was a dance of fortunes rising and falling beneath gilded domes.</p>
      <p>You joined the army either for coin or to escape the intrigues of merchant lords. Your resourcefulness, honed on the docks, may become your greatest asset in the chaos of war.</p>
    `,
    careers: [
      { title: "Sellsword", description: "Having fought for coin in crowded taverns, you now wield your blade for survival and glory under the imperial banner." },
      { title: "Marine", description: "Trained on merchant galleys and patrol vessels, you excel in confined, chaotic combat—skills to be adapted for land warfare." },
      { title: "Corsair", description: "Once a free-spirited raider of the coasts, you now serve the empire, balancing your rogue's heart with disciplined ranks." }
    ]
  },
  "Wyrdman": {
    description: `
      <p>From the untamed Wyrdplains—where sweeping grasslands and erratic storms shape the land—you are a child of nature. Raised under endless skies and steeped in ancient lore, you possess a primal connection to the earth.</p>
      <p>Though many Wyrdmen pledge allegiance to the Empire, your wild spirit endures. As you join the ranks, you must reconcile your free-roaming nature with the rigid discipline of imperial service.</p>
    `,
    careers: [
      { title: "Berserker", description: "Your raw fury, honed among untamed clans, fuels devastating attacks. Will you harness your strength for glory or risk being consumed by it?" },
      { title: "Marauder", description: "Once a cunning free spirit on the Wyrdplains, you now tread a fine line between your feral past and your duty to the Empire." },
      { title: "Plains Huntsman", description: "Skilled with bow and spear, you were raised under open skies. The strict discipline of the legion challenges your independent nature." }
    ]
  }
};

// Primary attribute ranges based on origin
window.statRanges = {
  "Paanic": { phy: [1, 3], men: [1, 3] },
  "Nesian": { phy: [2, 2], men: [2, 3] },
  "Lunarine": { phy: [1, 3], men: [2, 3] },
  "Wyrdman": { phy: [3, 3], men: [1, 1] }
};

// NEW: Origin system integration with UI framework
window.OriginSystem = {
  // Initialize the origin system
  init: function() {
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Subscribe to origin selection events
      window.UI.system.eventBus.subscribe('origin:selected', this.handleOriginSelected.bind(this));
      
      // Subscribe to career selection events
      window.UI.system.eventBus.subscribe('career:selected', this.handleCareerSelected.bind(this));
      
      console.log('Origin system initialized with UI integration');
    } else {
      console.log('Origin system initialized (standalone)');
    }
    
    return this;
  },
  
  // Get all available origins
  getOrigins: function() {
    return Object.keys(window.origins);
  },
  
  // Get origin details by name
  getOrigin: function(originName) {
    return window.origins[originName] || null;
  },
  
  // Get careers for a specific origin
  getCareers: function(originName) {
    const origin = this.getOrigin(originName);
    return origin ? origin.careers : [];
  },
  
  // Get stat ranges for an origin
  getStatRanges: function(originName) {
    return window.statRanges[originName] || null;
  },
  
  // Generate random stats based on origin
  generateStats: function(originName) {
    const ranges = this.getStatRanges(originName);
    if (!ranges) return { phy: 1, men: 1 };
    
    // Generate random stats within range
    const phy = Math.floor(Math.random() * (ranges.phy[1] - ranges.phy[0] + 1)) + ranges.phy[0];
    const men = Math.floor(Math.random() * (ranges.men[1] - ranges.men[0] + 1)) + ranges.men[0];
    
    return { phy, men };
  },
  
  // Handle origin selection event
  handleOriginSelected: function(data) {
    const originName = data.origin;
    console.log(`Origin selected: ${originName}`);
    
    // Generate stats based on origin
    const stats = this.generateStats(originName);
    
    // Publish stats generated event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('stats:generated', { 
        origin: originName,
        stats: stats
      });
    }
    
    // Update DOM if running in standalone mode
    if (document.getElementById('originDescription')) {
      const origin = this.getOrigin(originName);
      if (origin) {
        document.getElementById('originDescription').innerHTML = origin.description;
      }
    }
  },
  
  // Handle career selection event
  handleCareerSelected: function(data) {
    const { origin, career } = data;
    console.log(`Career selected: ${career} (${origin})`);
    
    // Calculate final stats based on career
    const baseStats = this.generateStats(origin);
    
    // Apply career-specific stat modifications (if needed)
    // This is where you could add career-specific bonuses
    
    // Publish final stats event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('character:statsFinalized', {
        origin: origin,
        career: career,
        stats: baseStats
      });
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  window.OriginSystem.init();
  
  // If UI system is already loaded, register with it
  if (window.UI && window.UI.system) {
    window.UI.system.registerComponent('originSystem', window.OriginSystem);
  }
});
