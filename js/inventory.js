// inventory.js - Updated with UI integration
// Manages player inventory, equipment, and currency

// Initialize the inventory system
window.initializeInventorySystem = function() {
  console.log("Initializing inventory system...");
  
  // Initialize inventory if it doesn't exist
  if (!window.player.inventory) {
    window.player.inventory = [];
  }
  
  // Initialize equipment slots based on career
  if (!window.player.equipment) {
    window.player.equipment = {
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
      accessory: null
    };
    
    // Add mount slot only for Castellan Cavalry
    if (window.player.career && (window.player.career.title === "Castellan Cavalry")) {
      window.player.equipment.mount = null;
      console.log("Added mount slot for Castellan Cavalry");
    }
  }
  
  // Initialize currency if it doesn't exist
  if (!window.player.taelors) {
    window.player.taelors = 25;
  }
  
  // Set inventory capacity
  window.player.inventoryCapacity = 20;
  
  // Initialize inventory stats system
  window.player.equipmentStats = {
    damage: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    blockChance: 0,
    ranged: 0,
    stealth: 0,
    intimidation: 0,
    charisma: 0,
    command: 0,
    armorPenetration: 0,
    mobility: 0,
    durability: 0
  };
  
  // Update equipment stats
  window.recalculateEquipmentStats();
  
  // Publish inventory initialized event if UI system is available
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:initialized', { player: window.player });
  }
  
  console.log("Inventory system initialized");
};

// Add item to inventory
window.addItemToInventory = function(itemTemplate, quantity = 1) {
  if (!itemTemplate) {
    console.error("Cannot add null item template to inventory");
    return false;
  }
  
  // Create a new item instance from the template
  const newItem = window.createItemInstance(itemTemplate, quantity);
  
  // Check if inventory has space
  if (window.player.inventory.length >= window.player.inventoryCapacity) {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification("Your inventory is full!", "warning");
    } else {
      window.showNotification("Your inventory is full!", "warning");
    }
    return false;
  }
  
  // If item is stackable, check if we already have it
  if (itemTemplate.stackable) {
    const existingItem = window.player.inventory.find(item => 
      item.templateId === itemTemplate.id && item.quantity < itemTemplate.maxStack
    );
    
    if (existingItem) {
      // Calculate how many we can add to the stack
      const spaceInStack = itemTemplate.maxStack - existingItem.quantity;
      const amountToAdd = Math.min(spaceInStack, quantity);
      
      existingItem.quantity += amountToAdd;
      
      // Publish item added event
      if (window.UI && window.UI.system) {
        window.UI.system.eventBus.publish('inventory:itemAdded', { 
          item: existingItem,
          quantity: amountToAdd,
          stacked: true
        });
      }
      
      // If we added all, return success
      if (amountToAdd === quantity) {
        if (window.UI && window.UI.system) {
          window.UI.system.showNotification(`Added ${quantity} ${itemTemplate.name} to inventory`, "success");
        } else {
          window.showNotification(`Added ${quantity} ${itemTemplate.name} to inventory`, "success");
        }
        return true;
      }
      
      // Otherwise, create a new stack with the remainder
      quantity -= amountToAdd;
    }
  }
  
  // Add the new item to inventory
  window.player.inventory.push(newItem);
  
  // Publish item added event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:itemAdded', { 
      item: newItem,
      quantity: newItem.quantity,
      stacked: false
    });
    
    window.UI.system.showNotification(`Added ${newItem.getName()} to inventory`, "success");
  } else {
    window.showNotification(`Added ${newItem.getName()} to inventory`, "success");
  }
  
  return true;
};

// Remove item from inventory
window.removeItemFromInventory = function(instanceId, quantity = 1) {
  const itemIndex = window.player.inventory.findIndex(item => item.instanceId === instanceId);
  
  if (itemIndex === -1) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  const item = window.player.inventory[itemIndex];
  
  // If stackable, reduce quantity
  if (item.getTemplate().stackable) {
    if (item.quantity > quantity) {
      item.quantity -= quantity;
      
      // Publish item quantity changed event
      if (window.UI && window.UI.system) {
        window.UI.system.eventBus.publish('inventory:itemQuantityChanged', { 
          item: item,
          quantity: -quantity,
          remaining: item.quantity
        });
      }
      
      return true;
    }
  }
  
  // Remove the item completely
  const removedItem = window.player.inventory.splice(itemIndex, 1)[0];
  
  // Publish item removed event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:itemRemoved', { 
      instanceId: instanceId,
      item: removedItem
    });
  }
  
  return true;
};

// Use an item from inventory
window.useItem = function(instanceId) {
  const item = window.player.inventory.find(item => item.instanceId === instanceId);
  
  if (!item) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  // Check if item is usable
  if (!item.getTemplate().usable) {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification(`${item.getName()} is not usable`, "warning");
    } else {
      window.showNotification(`${item.getName()} is not usable`, "warning");
    }
    return false;
  }
  
  // Use the item
  const success = item.use(window.player);
  
  if (success) {
    // Publish item used event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:itemUsed', { 
        instanceId: instanceId,
        item: item
      });
    }
    
    // If stackable, decrease quantity
    if (item.getTemplate().stackable) {
      item.quantity--;
      
      // Remove if quantity is 0
      if (item.quantity <= 0) {
        window.removeItemFromInventory(instanceId);
      } else {
        // Publish item quantity changed event
        if (window.UI && window.UI.system) {
          window.UI.system.eventBus.publish('inventory:itemQuantityChanged', { 
            item: item,
            quantity: -1,
            remaining: item.quantity
          });
        }
      }
    } else {
      // Non-stackable items are removed after use
      window.removeItemFromInventory(instanceId);
    }
    
    return true;
  }
  
  return false;
};

// Equip an item
window.equipItem = function(instanceId) {
  const item = window.player.inventory.find(item => item.instanceId === instanceId);
  
  if (!item) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  const template = item.getTemplate();
  
  // Check if item is equippable
  if (!template.equipSlot) {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification(`${item.getName()} cannot be equipped`, "warning");
    } else {
      window.showNotification(`${item.getName()} cannot be equipped`, "warning");
    }
    return false;
  }
  
  // Check requirements
  if (!item.canEquip(window.player)) {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification(`You don't meet the requirements to equip ${item.getName()}`, "warning");
    } else {
      window.showNotification(`You don't meet the requirements to equip ${item.getName()}`, "warning");
    }
    return false;
  }
  
  // Handle two-handed weapons
  const isTwoHanded = template.category === window.ITEM_CATEGORIES.WEAPON && 
                       template.hands === 2;
  
  // Remember old items to return to inventory
  let oldItems = [];
  
  // If equipping a two-handed weapon, need to unequip both mainHand and offHand
  if (isTwoHanded) {
    if (window.player.equipment.mainHand) {
      oldItems.push(window.player.equipment.mainHand);
    }
    if (window.player.equipment.offHand) {
      oldItems.push(window.player.equipment.offHand);
    }
    
    // Clear both slots
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  } 
  // If equipping to mainHand and we have a two-handed weapon, unequip it
  else if (template.equipSlot === window.EQUIPMENT_SLOTS.MAIN_HAND &&
           window.player.equipment.mainHand &&
           window.player.equipment.mainHand.getTemplate().hands === 2) {
    oldItems.push(window.player.equipment.mainHand);
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  }
  // If equipping to offHand and we have a two-handed weapon, unequip it
  else if (template.equipSlot === window.EQUIPMENT_SLOTS.OFF_HAND &&
           window.player.equipment.mainHand &&
           window.player.equipment.mainHand.getTemplate().hands === 2) {
    oldItems.push(window.player.equipment.mainHand);
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  }
  // Normal case - just unequip the slot we're equipping to
  else if (window.player.equipment[template.equipSlot]) {
    oldItems.push(window.player.equipment[template.equipSlot]);
    window.player.equipment[template.equipSlot] = null;
  }
  
  // Remove item from inventory
  window.removeItemFromInventory(instanceId);
  
  // Add the old items back to inventory
  oldItems.forEach(oldItem => {
    window.player.inventory.push(oldItem);
    
    // Publish item added event for each old item
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:itemAdded', { 
        item: oldItem,
        quantity: 1,
        stacked: false,
        fromUnequip: true
      });
    }
  });
  
  // Equip the new item
  item.equipped = true;
  window.player.equipment[template.equipSlot] = item;
  
  // If two-handed, also mark the off-hand as occupied
  if (isTwoHanded && template.equipSlot === window.EQUIPMENT_SLOTS.MAIN_HAND) {
    window.player.equipment.offHand = "occupied";
  }
  
  // Recalculate equipment stats
  window.recalculateEquipmentStats();
  
  // Publish item equipped event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:itemEquipped', { 
      item: item,
      slot: template.equipSlot,
      previousItems: oldItems
    });
    
    window.UI.system.showNotification(`Equipped ${item.getName()}`, "success");
  } else {
    window.showNotification(`Equipped ${item.getName()}`, "success");
  }
  
  return true;
};

// Unequip an item
window.unequipItem = function(slot) {
  // Check if the slot has an item
  if (!window.player.equipment[slot] || window.player.equipment[slot] === "occupied") {
    return false;
  }
  
  // Check if inventory has space
  if (window.player.inventory.length >= window.player.inventoryCapacity) {
    if (window.UI && window.UI.system) {
      window.UI.system.showNotification("Your inventory is full! Cannot unequip.", "warning");
    } else {
      window.showNotification("Your inventory is full! Cannot unequip.", "warning");
    }
    return false;
  }
  
  const item = window.player.equipment[slot];
  
  // Add item to inventory
  window.player.inventory.push(item);
  
  // Clear the equipment slot
  window.player.equipment[slot] = null;
  item.equipped = false;
  
  // If this was a two-handed weapon, also clear the off-hand "occupied" marker
  if (item.getTemplate().hands === 2 && slot === window.EQUIPMENT_SLOTS.MAIN_HAND) {
    window.player.equipment.offHand = null;
  }
  
  // Recalculate equipment stats
  window.recalculateEquipmentStats();
  
  // Publish item unequipped event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:itemUnequipped', { 
      item: item,
      slot: slot
    });
    
    window.UI.system.eventBus.publish('inventory:itemAdded', { 
      item: item,
      quantity: 1,
      stacked: false,
      fromUnequip: true
    });
    
    window.UI.system.showNotification(`Unequipped ${item.getName()}`, "success");
  } else {
    window.showNotification(`Unequipped ${item.getName()}`, "success");
  }
  
  return true;
};

// Recalculate all equipment stats
window.recalculateEquipmentStats = function() {
  // Reset all stats
  for (const stat in window.player.equipmentStats) {
    window.player.equipmentStats[stat] = 0;
  }
  
  // Loop through equipped items
  for (const slot in window.player.equipment) {
    const item = window.player.equipment[slot];
    
    // Skip empty slots or "occupied" marker
    if (!item || item === "occupied") continue;
    
    const template = item.getTemplate();
    
    // Add stats from item
    if (template.stats) {
      for (const stat in template.stats) {
        if (window.player.equipmentStats.hasOwnProperty(stat)) {
          window.player.equipmentStats[stat] += template.stats[stat];
        }
      }
    }
  }
  
  // Publish equipment stats updated event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:equipmentStatsUpdated', { 
      stats: window.player.equipmentStats
    });
  }
  
  console.log("Equipment stats recalculated:", window.player.equipmentStats);
};

// Add currency
window.addCurrency = function(amount) {
  window.player.taelors += amount;
  
  // Publish currency changed event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:currencyChanged', { 
      amount: amount,
      total: window.player.taelors
    });
    
    window.UI.system.showNotification(`Gained ${amount} taelors`, "success");
  } else {
    window.showNotification(`Gained ${amount} taelors`, "success");
  }
};

// Remove currency
window.removeCurrency = function(amount) {
  if (window.player.taelors >= amount) {
    window.player.taelors -= amount;
    
    // Publish currency changed event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:currencyChanged', { 
        amount: -amount,
        total: window.player.taelors
      });
    }
    
    return true;
  }
  
  if (window.UI && window.UI.system) {
    window.UI.system.showNotification("Not enough taelors!", "warning");
  } else {
    window.showNotification("Not enough taelors!", "warning");
  }
  
  return false;
};

// Get current inventory weight
window.getInventoryWeight = function() {
  let totalWeight = 0;
  
  window.player.inventory.forEach(item => {
    const template = item.getTemplate();
    totalWeight += template.weight * (template.stackable ? item.quantity : 1);
  });
  
  return parseFloat(totalWeight.toFixed(1));
};

// Sort inventory by category, rarity, and name
window.sortInventory = function(criteria = 'category') {
  window.player.inventory.sort((a, b) => {
    const templateA = a.getTemplate();
    const templateB = b.getTemplate();
    
    if (criteria === 'category') {
      // First sort by category
      if (templateA.category !== templateB.category) {
        // Define category sort order
        const categoryOrder = [
          window.ITEM_CATEGORIES.WEAPON,
          window.ITEM_CATEGORIES.ARMOR,
          window.ITEM_CATEGORIES.ACCESSORY,
          window.ITEM_CATEGORIES.CONSUMABLE,
          window.ITEM_CATEGORIES.MATERIAL,
          window.ITEM_CATEGORIES.QUEST
        ];
        
        return categoryOrder.indexOf(templateA.category) - categoryOrder.indexOf(templateB.category);
      }
      
      // Then by rarity (higher rarity first)
      const rarityValueA = templateA.rarity.multiplier;
      const rarityValueB = templateB.rarity.multiplier;
      
      if (rarityValueA !== rarityValueB) {
        return rarityValueB - rarityValueA;
      }
      
      // Finally by name
      return templateA.name.localeCompare(templateB.name);
    } 
    else if (criteria === 'value') {
      // Sort by value (higher first)
      const valueA = templateA.value * templateA.rarity.multiplier;
      const valueB = templateB.value * templateB.rarity.multiplier;
      
      return valueB - valueA;
    }
    else if (criteria === 'name') {
      // Sort alphabetically
      return templateA.name.localeCompare(templateB.name);
    }
    
    return 0;
  });
  
  // Publish inventory sorted event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:sorted', { 
      criteria: criteria,
      inventory: window.player.inventory
    });
  }
  
  return window.player.inventory;
};

// Filter inventory by category
window.filterInventory = function(category) {
  if (!category) {
    return window.player.inventory;
  }
  
  return window.player.inventory.filter(item => 
    item.getTemplate().category === category
  );
};

// Get itemTemplate by ID
window.getItemTemplateById = function(templateId) {
  return window.itemTemplates[templateId] || null;
};

// Career-specific equipment
window.addStartingItems = function() {
  console.log("Adding starting items for career:", window.player.career.title);
  
  // Only run if the player object and career exist
  if (!window.player || !window.player.career) {
    console.error("Cannot add starting items - player or career is not initialized!");
    return;
  }
  
  // Add career-specific starting equipment
  switch(window.player.career.title) {
    case "Regular":
    case "Paanic Regular":
      window.addItemToInventory(window.itemTemplates.basicSword);
      window.addItemToInventory(window.itemTemplates.legionShield);
      window.addItemToInventory(window.itemTemplates.legionHelmet);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      
      // Auto-equip items - with slight delay to ensure inventory updates
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionShield = window.player.inventory.find(i => i.templateId === 'legion_shield');
          if (legionShield) window.equipItem(legionShield.instanceId);
          
          const legionHelmet = window.player.inventory.find(i => i.templateId === 'legion_helmet');
          if (legionHelmet) window.equipItem(legionHelmet.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Regular items:", err);
        }
      }, 100);
      break;
      
    case "Castellan Cavalry":
      window.addItemToInventory(window.itemTemplates.nobleSword);
      window.addItemToInventory(window.itemTemplates.cavalryArmor);
      window.addItemToInventory(window.itemTemplates.standardWarhorse);
      
      // Make sure we have a mount slot
      if (!window.player.equipment.mount) {
        window.player.equipment.mount = null;
        console.log("Added mount equipment slot for Cavalry character");
      }
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const nobleSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
          if (nobleSword) window.equipItem(nobleSword.instanceId);
          
          const cavalryArmor = window.player.inventory.find(i => i.templateId === 'cavalry_armor');
          if (cavalryArmor) window.equipItem(cavalryArmor.instanceId);
          
          const standardWarhorse = window.player.inventory.find(i => i.templateId === 'standard_warhorse');
          if (standardWarhorse) window.equipItem(standardWarhorse.instanceId);
        } catch (err) {
          console.error("Error equipping Cavalry items:", err);
        }
      }, 100);
      break;
    
    case "Nesian Scout":
    case "Scout":
      window.addItemToInventory(window.itemTemplates.matchlockRifle);
      window.addItemToInventory(window.itemTemplates.scoutArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const matchlockRifle = window.player.inventory.find(i => i.templateId === 'matchlock_rifle');
          if (matchlockRifle) window.equipItem(matchlockRifle.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Scout items:", err);
        }
      }, 100);
      break;
      
    case "Noble Youth":
    case "Paanic Noble Youth":
      window.addItemToInventory(window.itemTemplates.nobleSword);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      window.addCurrency(50); // Extra starting money
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const nobleSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
          if (nobleSword) window.equipItem(nobleSword.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Noble Youth items:", err);
        }
      }, 100);
      break;
      
    case "Wyrdman":
    case "Plains Huntsman":
    case "Berserker":
      window.addItemToInventory(window.itemTemplates.hunterBow);
      window.addItemToInventory(window.itemTemplates.scoutArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const hunterBow = window.player.inventory.find(i => i.templateId === 'hunter_bow');
          if (hunterBow) window.equipItem(hunterBow.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Huntsman items:", err);
        }
      }, 100);
      break;
      
    default:
      // Default equipment
      window.addItemToInventory(window.itemTemplates.basicSword);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping default items:", err);
        }
      }, 100);
      break;
  }

  // Everyone gets a health potion
  window.addItemToInventory(window.itemTemplates.healthPotion);

  console.log("Starting items added. Player inventory:", window.player.inventory);
  
  // Publish starting items added event
  if (window.UI && window.UI.system) {
    window.UI.system.eventBus.publish('inventory:startingItemsAdded', { 
      career: window.player.career.title,
      inventory: window.player.inventory,
      equipment: window.player.equipment
    });
  }
};

// NEW: Inventory system integration with UI framework
window.InventorySystem = {
  // Initialize the inventory system
  init: function() {
    // Make sure player inventory is initialized
    if (window.player && !window.player.inventory) {
      window.initializeInventorySystem();
    }
    
    // Set up event listeners if UI system is available
    if (window.UI && window.UI.system) {
      // Subscribe to inventory-related events
      window.UI.system.eventBus.subscribe('inventory:open', this.handleOpenInventory.bind(this));
      window.UI.system.eventBus.subscribe('inventory:equipItem', this.handleEquipItem.bind(this));
      window.UI.system.eventBus.subscribe('inventory:unequipItem', this.handleUnequipItem.bind(this));
      window.UI.system.eventBus.subscribe('inventory:useItem', this.handleUseItem.bind(this));
      window.UI.system.eventBus.subscribe('inventory:sortRequest', this.handleSortRequest.bind(this));
      window.UI.system.eventBus.subscribe('inventory:filterRequest', this.handleFilterRequest.bind(this));
      
      console.log('Inventory system initialized with UI integration');
    } else {
      console.log('Inventory system initialized (standalone)');
    }
    
    // Publish inventory ready event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:ready', {});
    }
    
    return this;
  },
  
  // Get the player's full inventory
  getInventory: function() {
    return window.player.inventory || [];
  },
  
  // Get the player's equipment
  getEquipment: function() {
    return window.player.equipment || {};
  },
  
  // Get player's currency
  getCurrency: function() {
    return window.player.taelors || 0;
  },
  
  // Get inventory capacity
  getCapacity: function() {
    return window.player.inventoryCapacity || 20;
  },
  
  // Get current inventory weight
  getWeight: function() {
    return window.getInventoryWeight();
  },
  
  // Get equipment stats
  getEquipmentStats: function() {
    return window.player.equipmentStats || {};
  },
  
  // Add item to inventory
  addItem: function(itemId, quantity = 1) {
    const template = window.getItemTemplateById(itemId);
    if (!template) {
      console.error(`Item template not found: ${itemId}`);
      return false;
    }
    
    return window.addItemToInventory(template, quantity);
  },
  
  // Remove item from inventory
  removeItem: function(instanceId, quantity = 1) {
    return window.removeItemFromInventory(instanceId, quantity);
  },
  
  // Use item from inventory
  useItem: function(instanceId) {
    return window.useItem(instanceId);
  },
  
  // Equip item
  equipItem: function(instanceId) {
    return window.equipItem(instanceId);
  },
  
  // Unequip item
  unequipItem: function(slot) {
    return window.unequipItem(slot);
  },
  
  // Sort inventory
  sortInventory: function(criteria = 'category') {
    return window.sortInventory(criteria);
  },
  
  // Filter inventory
  filterInventory: function(category) {
    return window.filterInventory(category);
  },
  
  // Add currency
  addCurrency: function(amount) {
    window.addCurrency(amount);
  },
  
  // Remove currency
  removeCurrency: function(amount) {
    return window.removeCurrency(amount);
  },
  
  // Recalculate equipment stats
  recalculateStats: function() {
    window.recalculateEquipmentStats();
  },
  
  // Handle inventory open event
  handleOpenInventory: function(data) {
    console.log('Opening inventory panel');
    
    // Gather inventory data
    const inventoryData = {
      items: this.getInventory(),
      equipment: this.getEquipment(),
      currency: this.getCurrency(),
      capacity: this.getCapacity(),
      weight: this.getWeight(),
      equipmentStats: this.getEquipmentStats()
    };
    
    // Publish inventory data event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:data', inventoryData);
    }
  },
  
  // Handle equip item event
  handleEquipItem: function(data) {
    const { instanceId } = data;
    console.log(`Equipping item: ${instanceId}`);
    
    return this.equipItem(instanceId);
  },
  
  // Handle unequip item event
  handleUnequipItem: function(data) {
    const { slot } = data;
    console.log(`Unequipping item from slot: ${slot}`);
    
    return this.unequipItem(slot);
  },
  
  // Handle use item event
  handleUseItem: function(data) {
    const { instanceId } = data;
    console.log(`Using item: ${instanceId}`);
    
    return this.useItem(instanceId);
  },
  
  // Handle sort request event
  handleSortRequest: function(data) {
    const { criteria } = data;
    console.log(`Sorting inventory by: ${criteria}`);
    
    return this.sortInventory(criteria);
  },
  
  // Handle filter request event
  handleFilterRequest: function(data) {
    const { category } = data;
    console.log(`Filtering inventory by category: ${category}`);
    
    const filteredItems = this.filterInventory(category);
    
    // Publish filtered items event
    if (window.UI && window.UI.system) {
      window.UI.system.eventBus.publish('inventory:filtered', { 
        category: category,
        items: filteredItems
      });
    }
    
    return filteredItems;
  }
};

// Convert InventorySystem to properly extend Component class
window.InventorySystem = Object.assign({}, window.InventorySystem, {
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
    window.InventorySystem.init();
    
    // Register with UI system
    window.UI.system.registerComponent('inventorySystem', window.InventorySystem);
  } else {
    // Wait for UI system to be ready
    document.addEventListener('uiSystemReady', function() {
      window.InventorySystem.init();
      
      // Register with UI system
      window.UI.system.registerComponent('inventorySystem', window.InventorySystem);
    });
  }
});
