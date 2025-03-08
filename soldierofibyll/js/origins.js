// Game data: Origins and heritages
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