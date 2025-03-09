// items.js - Updated with UI integration
// Maintains compatibility with existing code while adding event system integration

// ITEM SYSTEM MODULE
// Defines item templates, categories, and functionality

// Item Categories
window.ITEM_CATEGORIES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material',
  QUEST: 'quest'
};

// Equipment Slots
window.EQUIPMENT_SLOTS = {
  HEAD: 'head',
  BODY: 'body',
  MAIN_HAND: 'mainHand',
  OFF_HAND: 'offHand',
  ACCESSORY: 'accessory',
  MOUNT: 'mount'
};

// Item Rarities with color codes
window.ITEM_RARITIES = {
  COMMON: { name: 'Common', color: '#aaaaaa', multiplier: 1.0, symbol: '●' },
  UNCOMMON: { name: 'Uncommon', color: '#00aa00', multiplier: 1.5, symbol: '◆' },
  RARE: { name: 'Rare', color: '#0066ff', multiplier: 2.5, symbol: '★' },
  EPIC: { name: 'Epic', color: '#aa00aa', multiplier: 4.0, symbol: '✧' },
  LEGENDARY: { name: 'Legendary', color: '#ff9900', multiplier: 6.0, symbol: '✦' },
  UNIQUE: { name: 'Unique', color: '#aa0000', multiplier: 10.0, symbol: '❖' }
};

// Item Symbols (instead of custom icons)
window.ITEM_SYMBOLS = {
  // Weapons
  SWORD: '⚔️',
  SPEAR: '🔱',
  AXE: '🪓',
  BOW: '🏹',
  STAFF: '🪄',
  MACE: '🔨',
  DAGGER: '🗡️',
  SHIELD: '🛡️',
  CROSSBOW: '⚔️', // No specific emoji, reuse sword
  RIFLE: '🔫',
  
  // Armor
  HELMET: '⛑️',
  CHEST: '👕',
  GLOVES: '🧤',
  BOOTS: '👢',
  
  // Accessories
  AMULET: '📿',
  RING: '💍',
  
  // Consumables
  POTION: '🧪',
  FOOD: '🍖',
  SCROLL: '📜',
  
  // Materials
  METAL: '🧲',
  PLANT: '🌿',
  GEM: '💎',
  
  // Quest
  QUEST: '❗',
  
  // Mounts
  MOUNT: '🐎',
  WARHORSE: '🐎',
  CHARGER: '🐎',
  CONSTRUCT: '🤖'
};

// Add mount type
window.MOUNT_TYPES = {
  WARHORSE: { name: 'Warhorse', symbol: window.ITEM_SYMBOLS.WARHORSE, slot: window.EQUIPMENT_SLOTS.MOUNT },
  CHARGER: { name: 'Charger', symbol: window.ITEM_SYMBOLS.CHARGER, slot: window.EQUIPMENT_SLOTS.MOUNT },
  CONSTRUCT: { name: 'Construct', symbol: window.ITEM_SYMBOLS.CONSTRUCT, slot: window.EQUIPMENT_SLOTS.MOUNT }
};

// Weapon Types
window.WEAPON_TYPES = {
  SWORD: { name: 'Sword', symbol: window.ITEM_SYMBOLS.SWORD, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  GREATSWORD: { name: 'Greatsword', symbol: window.ITEM_SYMBOLS.SWORD, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  SPEAR: { name: 'Spear', symbol: window.ITEM_SYMBOLS.SPEAR, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  AXE: { name: 'Axe', symbol: window.ITEM_SYMBOLS.AXE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  BATTLEAXE: { name: 'Battle Axe', symbol: window.ITEM_SYMBOLS.AXE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  BOW: { name: 'Bow', symbol: window.ITEM_SYMBOLS.BOW, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  CROSSBOW: { name: 'Crossbow', symbol: window.ITEM_SYMBOLS.CROSSBOW, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  DAGGER: { name: 'Dagger', symbol: window.ITEM_SYMBOLS.DAGGER, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  SHIELD: { name: 'Shield', symbol: window.ITEM_SYMBOLS.SHIELD, slot: window.EQUIPMENT_SLOTS.OFF_HAND, hands: 1 },
  RIFLE: { name: 'Rifle', symbol: window.ITEM_SYMBOLS.RIFLE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 }
};

// Armor Types
window.ARMOR_TYPES = {
  LIGHT: { name: 'Light Armor', protection: 'low', mobility: 'high' },
  MEDIUM: { name: 'Medium Armor', protection: 'medium', mobility: 'medium' },
  HEAVY: { name: 'Heavy Armor', protection: 'high', mobility: 'low' }
};

// Item Template constructor
window.createItemTemplate = function(config) {
  return {
    id: config.id || `item_${Date.now()}`,
    name: config.name || 'Unknown Item',
    description: config.description || 'No description available.',
    category: config.category || window.ITEM_CATEGORIES.MATERIAL,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 1,
    weight: config.weight || 0.1,
    symbol: config.symbol || '❓',
    stackable: config.stackable !== undefined ? config.stackable : false,
    maxStack: config.maxStack || 1,
    
    // Equipment properties
    equipSlot: config.equipSlot || null,
    hands: config.hands || 1,
    
    // Stats modifications
    stats: config.stats || {},
    
    // Special effects
    effects: config.effects || [],
    
    // Use function
    usable: config.usable !== undefined ? config.usable : false,
    useFunction: config.useFunction || null,
    
    // Additional properties for specific item types
    weaponType: config.weaponType || null,
    armorType: config.armorType || null,
    damageType: config.damageType || null,
    
    // Requirements to use
    requirements: config.requirements || {}
  };
};

// Create a new item instance from a template
window.createItemInstance = function(template, quantity = 1) {
  return {
    templateId: template.id,
    instanceId: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    quantity: template.stackable ? quantity : 1,
    durability: template.maxDurability || null,
    equipped: false,
    
    // Reference to template for easy access
    getTemplate: function() {
      return template;
    },
    
    // Convenience methods
    getName: function() {
      return template.name;
    },
    
    getSymbol: function() {
      return template.symbol;
    },
    
    getRarity: function() {
      return template.rarity;
    },
    
    getValue: function() {
      return template.value * template.rarity.multiplier;
    },
    
    use: function(character) {
      if (template.usable && template.useFunction) {
        return template.useFunction(character, this);
      }
      return false;
    },
    
    canEquip: function(character) {
      if (!template.equipSlot) return false;
      
      // Check requirements
      if (template.requirements) {
        if (template.requirements.minPhy && character.phy < template.requirements.minPhy) return false;
        if (template.requirements.minMen && character.men < template.requirements.minMen) return false;
        // Add more requirement checks as needed
      }
      
      return true;
    },
    
    getDescription: function() {
      let desc = template.description;
      
      // Add stats information if equipment
      if (template.equipSlot && Object.keys(template.stats).length > 0) {
        desc += "\n\nStats:";
        for (const [stat, value] of Object.entries(template.stats)) {
          const sign = value >= 0 ? '+' : '';
          desc += `\n${stat}: ${sign}${value}`;
        }
      }
      
      // Add effects information
      if (template.effects && template.effects.length > 0) {
        desc += "\n\nEffects:";
        template.effects.forEach(effect => {
          desc += `\n- ${effect.description}`;
        });
      }
      
      return desc;
    }
  };
};

// Create mount factory function
window.createMount = function(config) {
  const mountType = config.mountType || window.MOUNT_TYPES.WARHORSE;
  
  return window.createItemTemplate({
    name: config.name || `${mountType.name}`,
    description: config.description || `A loyal ${mountType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.MOUNT,
    rarity: config.rarity || window.ITEM_RARITIES.UNCOMMON,
    value: config.value || 300,
    weight: 0,  // Mounts don't count for inventory weight
    symbol: mountType.symbol,
    equipSlot: mountType.slot,
    stats: {
      speed: config.speed || 20,
      mobility: config.mobility || 15,
      durability: config.durability || 50,
      ...config.stats
    },
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create weapons
window.createWeapon = function(config) {
  const weaponType = config.weaponType || window.WEAPON_TYPES.SWORD;
  
  return window.createItemTemplate({
    name: config.name || `${weaponType.name}`,
    description: config.description || `A standard ${weaponType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.WEAPON,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 10,
    weight: config.weight || 1.0,
    symbol: weaponType.symbol,
    equipSlot: weaponType.slot,
    hands: weaponType.hands,
    weaponType: weaponType,
    stats: {
      damage: config.damage || 5,
      ...config.stats
    },
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create armor
window.createArmor = function(config) {
  const armorType = config.armorType || window.ARMOR_TYPES.MEDIUM;
  let symbol;
  
  switch(config.equipSlot) {
    case window.EQUIPMENT_SLOTS.HEAD:
      symbol = window.ITEM_SYMBOLS.HELMET;
      break;
    case window.EQUIPMENT_SLOTS.BODY:
      symbol = window.ITEM_SYMBOLS.CHEST;
      break;
    default:
      symbol = window.ITEM_SYMBOLS.CHEST;
  }
  
  return window.createItemTemplate({
    name: config.name || `${armorType.name}`,
    description: config.description || `A standard piece of ${armorType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.ARMOR,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 15,
    weight: config.weight || 2.0,
    symbol: symbol,
    equipSlot: config.equipSlot || window.EQUIPMENT_SLOTS.BODY,
    armorType: armorType,
    stats: {
      defense: config.defense || 3,
      ...config.stats
    },
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create consumable
window.createConsumable = function(config) {
  return window.createItemTemplate({
    name: config.name || "Potion",
    description: config.description || "A consumable item.",
    category: window.ITEM_CATEGORIES.CONSUMABLE,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 5,
    weight: config.weight || 0.2,
    symbol: config.symbol || window.ITEM_SYMBOLS.POTION,
    stackable: true,
    maxStack: config.maxStack || 10,
    usable: true,
    useFunction: config.useFunction || function(character, item) {
      console.log(`${character.name} used ${item.getName()}`);
      return true; // Item was successfully used
    },
    ...config
  });
};

// Compare two items of the same type
window.compareItems = function(itemA, itemB) {
  if (!itemA || !itemB) return null;
  
  // Get templates
  const templateA = itemA.getTemplate ? itemA.getTemplate() : itemA;
  const templateB = itemB.getTemplate ? itemB.getTemplate() : itemB;
  
  // If different categories, can't really compare
  if (templateA.category !== templateB.category) {
    return { comparable: false, reason: "Different item categories" };
  }
  
  // For weapons and armor, compare stats
  if (templateA.category === window.ITEM_CATEGORIES.WEAPON || 
      templateA.category === window.ITEM_CATEGORIES.ARMOR) {
    
    const comparison = {
      comparable: true,
      name: { a: templateA.name, b: templateB.name },
      rarity: { a: templateA.rarity.name, b: templateB.rarity.name },
      value: { a: templateA.value, b: templateB.value, diff: templateB.value - templateA.value },
      stats: {}
    };
    
    // Compare all stats
    const allStats = new Set([
      ...Object.keys(templateA.stats || {}),
      ...Object.keys(templateB.stats || {})
    ]);
    
    allStats.forEach(stat => {
      const valueA = (templateA.stats && templateA.stats[stat]) || 0;
      const valueB = (templateB.stats && templateB.stats[stat]) || 0;
      const diff = valueB - valueA;
      
      comparison.stats[stat] = {
        a: valueA,
        b: valueB,
        diff: diff,
        better: diff > 0 ? 'b' : diff < 0 ? 'a' : 'equal'
      };
    });
    
    return comparison;
  }
  
  // For consumables, just compare basic properties
  return {
    comparable: true,
    name: { a: templateA.name, b: templateB.name },
    rarity: { a: templateA.rarity.name, b: templateB.rarity.name },
    value: { a: templateA.value, b: templateB.value, diff: templateB.value - templateA.value }
  };
};

// Create a predefined set of item templates
window.initializeItemTemplates = function() {
  // Store all item templates here
  window.itemTemplates = {};
  
  // Add the standard weapon templates
  window.itemTemplates.basicSword = window.createWeapon({
    id: 'basic_sword',
    name: 'Paanic Military Sword',
    description: 'A standard issue military sword from the Paanic Empire. Reliable but unremarkable.',
    weaponType: window.WEAPON_TYPES.SWORD,
    damage: 8,
    value: 25
  });
  
  window.itemTemplates.nobleSword = window.createWeapon({
    id: 'noble_sword',
    name: 'Noble Ceremonial Sword',
    description: 'A finely crafted blade carried by nobility. More ceremonial than practical, but still deadly.',
    weaponType: window.WEAPON_TYPES.SWORD,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 10,
    value: 100,
    stats: {
      damage: 10,
      critChance: 5
    }
  });
  
  window.itemTemplates.royalGreatsword = window.createWeapon({
    id: 'royal_greatsword',
    name: 'Royal Greatsword',
    description: 'A massive two-handed blade carried by the royal guards of Cennen. Its heft can cleave through armor.',
    weaponType: window.WEAPON_TYPES.GREATSWORD,
    rarity: window.ITEM_RARITIES.RARE,
    damage: 18,
    value: 350,
    stats: {
      damage: 18,
      armorPenetration: 20,
      speed: -5
    },
    requirements: {
      minPhy: 8
    }
  });
  
  window.itemTemplates.matchlockRifle = window.createWeapon({
    id: 'matchlock_rifle',
    name: 'Nesian Matchlock Rifle',
    description: 'A firearm from Nesia, re-engineered from ancient Immortal designs. Powerful but slow to reload.',
    weaponType: window.WEAPON_TYPES.RIFLE,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 25,
    value: 220,
    stats: {
      damage: 25,
      range: 40,
      speed: -20
    },
    requirements: {
      minMen: 2
    }
  });
  
  window.itemTemplates.hunterBow = window.createWeapon({
    id: 'hunter_bow',
    name: 'Wyrd Hunter\'s Bow',
    description: 'A recurve bow crafted by the hunters of the Wyrdplains. Fast to draw and deadly accurate.',
    weaponType: window.WEAPON_TYPES.BOW,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 12,
    value: 120,
    stats: {
      damage: 12,
      range: 30,
      critChance: 10
    }
  });
  
  window.itemTemplates.legionShield = window.createWeapon({
    id: 'legion_shield',
    name: 'Paanic Legion Shield',
    description: 'A standard-issue military shield bearing the emblem of the Paanic Legion.',
    weaponType: window.WEAPON_TYPES.SHIELD,
    rarity: window.ITEM_RARITIES.COMMON,
    damage: 2,
    value: 40,
    stats: {
      damage: 2,
      defense: 15,
      blockChance: 30
    }
  });
  
  // Add the standard armor templates
  window.itemTemplates.legionHelmet = window.createArmor({
    id: 'legion_helmet',
    name: 'Legion Helmet',
    description: 'Standard issue helmet of the Paanic Legion. Provides decent protection.',
    equipSlot: window.EQUIPMENT_SLOTS.HEAD,
    armorType: window.ARMOR_TYPES.MEDIUM,
    defense: 5,
    value: 30
  });
  
  window.itemTemplates.legionArmor = window.createArmor({
    id: 'legion_armor',
    name: 'Legion Cuirass',
    description: 'Standard issue breastplate of the Paanic Legion. Reliable protection in battle.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.MEDIUM,
    defense: 12,
    value: 75
  });
  
  window.itemTemplates.cavalryArmor = window.createArmor({
    id: 'cavalry_armor',
    name: 'Nesian Cavalry Armor',
    description: 'Heavy plate armor worn by the elite cavalry of Nesia.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.HEAVY,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    defense: 18,
    value: 250,
    stats: {
      defense: 18,
      speed: -10,
      intimidation: 10
    },
    requirements: {
      minPhy: 1
    }
  });
  
  window.itemTemplates.scoutArmor = window.createArmor({
    id: 'scout_armor',
    name: 'Scout Leather Armor',
    description: 'Lightweight leather armor designed for mobility. Favored by scouts and archers.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.LIGHT,
    defense: 6,
    value: 60,
    stats: {
      defense: 6,
      speed: 10,
      stealth: 15
    }
  });
  
  // Add accessories
  window.itemTemplates.commandAmulet = window.createItemTemplate({
    id: 'command_amulet',
    name: 'Officer\'s Amulet',
    description: 'A military decoration worn by officers of the Paanic Empire. Enhances leadership abilities.',
    category: window.ITEM_CATEGORIES.ACCESSORY,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    value: 120,
    weight: 0.1,
    symbol: window.ITEM_SYMBOLS.AMULET,
    equipSlot: window.EQUIPMENT_SLOTS.ACCESSORY,
    stats: {
      command: 15,
      charisma: 5
    }
  });
  
  // Add consumables
  window.itemTemplates.healthPotion = window.createConsumable({
    id: 'health_potion',
    name: 'Health Potion',
    description: 'A red potion that restores 50 health when consumed.',
    symbol: window.ITEM_SYMBOLS.POTION,
    value: 20,
    useFunction: function(character, item) {
      if (window.gameState) {
        window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + 50);
        
        // Update UI
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Show notification
        if (window.UI && window.UI.system) {
          window.UI.system.showNotification('You restored 50 health!', 'success');
        } else if (typeof window.showNotification === 'function') {
          window.showNotification('You restored 50 health!', 'success');
        }
        
        return true;
      }
      return false;
    }
  });
  
  window.itemTemplates.staminaPotion = window.createConsumable({
    id: 'stamina_potion',
    name: 'Stamina Elixir',
    description: 'A green elixir that restores 75 stamina when consumed.',
    symbol: window.ITEM_SYMBOLS.POTION,
    value: 15,
    useFunction: function(character, item) {
      if (window.gameState) {
        window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 75);
        
        // Update UI
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Show notification
        if (window.UI && window.UI.system) {
          window.UI.system.showNotification('You restored 75 stamina!', 'success');
        } else if (typeof window.showNotification === 'function') {
          window.showNotification('You restored 75 stamina!', 'success');
        }
        
        return true;
      }
      return false;
    }
  });
  
  window.itemTemplates.rations = window.createConsumable({
    id: 'rations',
    name: 'Military Rations',
    description: 'Standard issue field rations. Not tasty, but nutritious. Restores 20 health and 30 stamina.',
    symbol: window.ITEM_SYMBOLS.FOOD,
    value: 8,
    useFunction: function(character, item) {
      if (window.gameState) {
        window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + 20);
        window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 30);
        
        // Update UI
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Show notification
        if (window.UI && window.UI.system) {
          window.UI.system.showNotification('You consumed your rations, restoring health and stamina.', 'success');
        } else if (typeof window.showNotification === 'function') {
          window.showNotification('You consumed your rations, restoring health and stamina.', 'success');
        }
        
        return true;
      }
      return false;
    }
  });

  // Add mount items
  window.itemTemplates.standardWarhorse = window.createMount({
    id: 'standard_warhorse',
    name: 'Standard Warhorse',
    description: 'A well-trained warhorse from the Nesian cavalry stables. Bred for endurance and courage in battle.',
    mountType: window.MOUNT_TYPES.WARHORSE,
    value: 250,
    stats: {
      speed: 20,
      mobility: 15,
      durability: 50,
      intimidation: 10
    }
  });
  
  window.itemTemplates.castellanCharger = window.createMount({
    id: 'castellan_charger',
    name: 'Castellan Charger',
    description: 'An elite Nesian cavalry mount, trained specifically for the Castellan forces. Renowned for its fearlessness and responsiveness in battle.',
    mountType: window.MOUNT_TYPES.CHARGER,
    rarity: window.ITEM_RARITIES.RARE,
    value: 500,
    stats: {
      speed: 30,
      mobility: 25,
      durability: 60,
      intimidation: 20,
      offense: 10
    }
  });
  
  window.itemTemplates.constructMount = window.createMount({
    id: 'construct_mount',
    name: 'Immortal Construct Mount',
    description: 'A rare and mysterious mechanical construct recovered from ancient Immortal ruins. Its inner workings are impossible to fully understand, but it serves as a formidable mount in battle.',
    mountType: window.MOUNT_TYPES.CONSTRUCT,
    rarity: window.ITEM_RARITIES.EPIC,
    value: 1200,
    stats: {
      speed: 35,
      mobility: 20,
      durability: 100,
      intimidation: 30,
      defense: 15
    }
  });
  
  console.log("Item templates initialized:", Object.keys(window.itemTemplates).length);
  return window.itemTemplates;
};

// NEW: Item system integration with UI framework
window.ItemSystem = {
  // Initialize the item system
  init: function() {
    // Make sure we have item templates
    if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
      window.initializeItemTemplates();
    }
    
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Subscribe to item-related events
      window.UI.system.eventBus.subscribe('item:inspect', this.handleItemInspect.bind(this));
      window.UI.system.eventBus.subscribe('item:compare', this.handleItemCompare.bind(this));
      window.UI.system.eventBus.subscribe('item:use', this.handleItemUse.bind(this));
      
      console.log('Item system initialized with UI integration');
    } else {
      console.log('Item system initialized (standalone)');
    }
    
    return this;
  },
  
  // Get an item template by ID
  getItemTemplate: function(id) {
    return window.itemTemplates[id] || null;
  },
  
  // Get all item templates
  getAllItemTemplates: function() {
    return window.itemTemplates;
  },
  
  // Create an item instance from a template
  createItem: function(templateId, quantity = 1) {
    const template = this.getItemTemplate(templateId);
    if (!template) {
      console.error(`Item template not found: ${templateId}`);
      return null;
    }
    
    return window.createItemInstance(template, quantity);
  },
  
  // Create a custom item
  createCustomItem: function(config) {
    // Determine item factory based on category
    let factory;
    switch (config.category) {
      case window.ITEM_CATEGORIES.WEAPON:
        factory = window.createWeapon;
        break;
      case window.ITEM_CATEGORIES.ARMOR:
        factory = window.createArmor;
        break;
      case window.ITEM_CATEGORIES.CONSUMABLE:
        factory = window.createConsumable;
        break;
      case window.ITEM_CATEGORIES.MOUNT:
        factory = window.createMount;
        break;
      default:
        factory = window.createItemTemplate;
    }
    
    // Create the item template
    const template = factory(config);
    
    // Add to item templates if ID provided
    if (config.id) {
      window.itemTemplates[config.id] = template;
    }
    
    // Create an instance
    return window.createItemInstance(template, config.quantity || 1);
  },
  
  // Compare two items
  compareItems: function(itemA, itemB) {
    return window.compareItems(itemA, itemB);
  },
  
  // Handle item inspect event
  handleItemInspect: function(data) {
    const { itemId, instanceId } = data;
    console.log(`Inspecting item: ${itemId || instanceId}`);
    
    // Get the item instance
    let item;
    if (window.player && window.player.inventory) {
      item = window.player.inventory.find(i => i.instanceId === instanceId);
    }
    
    if (!item && itemId) {
      // Create temporary item from template for inspection
      const template = this.getItemTemplate(itemId);
      if (template) {
        item = window.createItemInstance(template);
      }
    }
    
    if (!item) {
      console.error(`Item not found: ${itemId || instanceId}`);
      return;
    }
    
    // Publish item details event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('item:details', {
        item: item,
        template: item.getTemplate(),
        instanceId: item.instanceId,
        name: item.getName(),
        description: item.getDescription(),
        value: item.getValue(),
        rarity: item.getRarity(),
        symbol: item.getSymbol(),
        equipped: item.equipped
      });
    }
  },
  
  // Handle item compare event
  handleItemCompare: function(data) {
    const { itemAId, itemBId } = data;
    console.log(`Comparing items: ${itemAId} vs ${itemBId}`);
    
    // Get the item instances
    let itemA, itemB;
    
    if (window.player && window.player.inventory) {
      itemA = window.player.inventory.find(i => i.instanceId === itemAId);
      itemB = window.player.inventory.find(i => i.instanceId === itemBId);
    }
    
    // If not found in inventory, try templates
    if (!itemA && itemAId) {
      const template = this.getItemTemplate(itemAId);
      if (template) {
        itemA = window.createItemInstance(template);
      }
    }
    
    if (!itemB && itemBId) {
      const template = this.getItemTemplate(itemBId);
      if (template) {
        itemB = window.createItemInstance(template);
      }
    }
    
    if (!itemA || !itemB) {
      console.error(`Items not found for comparison: ${itemAId} vs ${itemBId}`);
      return;
    }
    
    // Compare items
    const comparison = this.compareItems(itemA, itemB);
    
    // Publish comparison results
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('item:comparisonResults', {
        itemA: itemA,
        itemB: itemB,
        comparison: comparison
      });
    }
  },
  
  // Handle item use event
  handleItemUse: function(data) {
    const { instanceId } = data;
    console.log(`Using item: ${instanceId}`);
    
    // Delegate to the inventory system for item use
    if (window.useItem && typeof window.useItem === 'function') {
      const success = window.useItem(instanceId);
      
      // Publish use result
      if (window.UI && window.UI.system) {
        window.UI.system.eventBus.publish('item:useResult', {
          instanceId: instanceId,
          success: success
        });
      }
      
      return success;
    }
    
    return false;
  }
};

// Initialize item templates when the script loads
window.initializeItemTemplates();

// Initialize the item system on load
document.addEventListener('DOMContentLoaded', function() {
  window.ItemSystem.init();
  
  // If UI system is already loaded, register with it
  if (window.UI && window.UI.system) {
    window.UI.system.registerComponent('itemSystem', window.ItemSystem);
  }
});
