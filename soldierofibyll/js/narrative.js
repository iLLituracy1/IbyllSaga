// Dynamic narrative elements for main game
window.narrativeElements = {
  training: [
    "You push yourself through grueling training drills, sweat streaming down your face as you master the movements.",
    "The clash of training weapons fills the air as you practice formations with fellow soldiers.",
    "Your muscles burn with the effort, but each repetition brings you closer to martial perfection.",
    "The drill instructor barks orders as you train. \"Again!\" they shout, but you can see approval in their eyes."
  ],
   
  rest: [
    // Daytime rest narratives
    "You find a quiet spot beneath a canvas awning and let your body recover from the day's exertions.",
    "During a break between training sessions, you catch a moment of peaceful rest.",

    // Evening rest narratives
    "As the sun begins to set, you settle into your quarters, reflecting on the day's events.",
    "The evening settles in, and you take the opportunity to rest and recover.",

    // Night rest narratives
    "Under the starry sky, you drift into a deep, restorative sleep.",
    "The night is quiet, allowing you to recuperate from the day's challenges."
  ],
  
  patrol: [
    "The perimeter of the camp reveals a land on the edge of conflict. You keep your eyes sharp for any sign of trouble.",
    "As you patrol, you encounter locals who regard imperial soldiers with a mixture of awe and fear.",
    "The patrol reveals strategic features of the surrounding terrain that could prove useful in coming battles.",
    "Your vigilance doesn't go unnoticed—senior officers take note of your dedication during patrol duty."
  ],
  
  mess: [
    "The mess hall buzzes with conversation and laughter, a brief respite from the looming reality of war.",
    "Over a bowl of hearty stew, you exchange rumors with soldiers from different regiments.",
    "The ale flows freely today, loosening tongues and forming bonds between strangers soon to be comrades.",
    "At your table, veterans share tales of past campaigns, lessons wrapped in embellished glory."
  ],
  
  guard: [
    "Standing vigil upon a watch tower, your mind wanders to the battles that lie ahead.",
    "The commander passes by during your shift, nodding in silent approval of your vigilance.",
    "Hours pass slowly on guard duty, but you notice subtle changes in camp security that could save lives.",
    "As you stand watch, you overhear officers discussing strategy for the upcoming invasion."
  ],
  
  report: [
    "The commander's tent is a hub of activity, maps spread across tables and messengers coming and going.",
    "Your report is received with thoughtful consideration, your observations adding to the tactical picture.",
    "The commander asks pointed questions about your background, seemingly evaluating your potential.",
    "You glimpse documents pointing to complications in the campaign that haven't been shared with the ranks."
  ],
  
  briefing: [
    "The strategy unfolds before you—maps marked with unit positions, supply lines, and enemy strongholds.",
    "Officers debate tactical approaches while you absorb every detail, preparing for your role.",
    "The briefing reveals the scale of the Empire's ambition and the high cost likely to be paid in blood.",
    "Between formal explanations, you catch whispers of doubt among some officers about the campaign's chances."
  ],
  
  gambling: [
    "The gambling tent is alive with the sounds of dice rolling and taelors clinking. Off-duty soldiers crowd around makeshift tables, their faces illuminated by lantern light.",
    "Smoke hangs thick in the air as soldiers laugh and curse their luck in equal measure. The tent flap stirs as another group enters, eager to try their hand.",
    "Cards snap against rough tables as dealers call out wins and losses. A grizzled veteran in the corner watches silently, counting cards with practiced precision.",
    "The gambling tent never truly sleeps, with games rotating as shifts change and new players seek their fortune. Tonight, the atmosphere is charged with anticipation."
  ],
  
  brawlerPits: [
    "The underground fighting pit is dimly lit, with soldiers forming a tight circle around a cleared space. The air is thick with sweat and anticipation.",
    "Bets exchange hands rapidly as two fighters circle each other in the makeshift arena. Veterans call encouragement from the sidelines, their voices low to avoid drawing attention from officers.",
    "The brawler pit tonight is housed in an abandoned supply tent, its interior transformed by hanging lanterns and a crude fighting ring marked in chalk on the packed earth.",
    "Blood stains the ground from previous matches as you enter the pit. The crowd parts slightly, sizing you up as a potential contender or easy mark."
  ]
};

// Add camp characters with relationships
window.campCharacters = [
  { id: "commander", name: "Commander Valarius", disposition: 0 },
  { id: "sergeant", name: "Sergeant Kasia", disposition: 0 },
  { id: "medic", name: "Medic Joren", disposition: 0 },
  { id: "quartermaster", name: "Quartermaster Thell", disposition: 0 }
];

// Define achievements
window.achievements = [
  {
    id: "first_blood",
    title: "First Blood",
    description: "Win your first combat encounter",
    unlocked: false,
    icon: "⚔️"
  },
  {
    id: "disciplined",
    title: "Disciplined",
    description: "Complete 10 training sessions",
    progress: 0,
    target: 10,
    unlocked: false,
    icon: "🏋️‍♂️"
  },
  {
    id: "scout_master",
    title: "Scout Master",
    description: "Discover 5 new locations",
    progress: 0,
    target: 5,
    unlocked: false,
    icon: "🔍"
  },
  {
    id: "respected",
    title: "Respected",
    description: "Reach 'Trusted Ally' status with any camp character",
    unlocked: false,
    icon: "🤝"
  },
  {
    id: "survivor",
    title: "Survivor",
    description: "Reach day 10 in the campaign",
    unlocked: false,
    icon: "📅"
  },
  {
    id: "collector",
    title: "Collector",
    description: "Collect 15 different items",
    progress: 0,
    target: 15,
    unlocked: false,
    icon: "🎒"
  },
  {
    id: "veteran",
    title: "Veteran",
    description: "Reach level 5",
    unlocked: false,
    icon: "⭐"
  }
];