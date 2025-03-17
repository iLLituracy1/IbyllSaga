/**
 * Viking Legacy - Raiding and Warfare System
 * Handles raiding, warfare, army management, and battle outcomes
 */

const WarfareManager = (function() {
    // Constants
    const RAID_TYPES = {
        QUICK_RAID: {
            id: "quick_raid",
            name: "Quick Raid",
            description: "A swift strike and retreat, targeting easy loot.",
            minWarriors: 5,
            lootMultiplier: 0.7,
            fameMultiplier: 0.5,
            dangerLevel: 1,
            defenseBonus: 0.3,
            captureChance: 0.1,
            duration: { min: 3, max: 5 }, // Days
            cooldown: 10, // Days before you can raid the same target
            favoredTargets: ["monastery", "village", "trading_post"],
            unguardedOnly: true
        },
        COASTAL_RAID: {
            id: "coastal_raid",
            name: "Coastal Raid",
            description: "A seaborne attack on coastal settlements.",
            minWarriors: 10,
            lootMultiplier: 1.0,
            fameMultiplier: 0.8,
            dangerLevel: 2,
            defenseBonus: 0.5,
            captureChance: 0.2,
            duration: { min: 7, max: 14 },
            cooldown: 20,
            favoredTargets: ["coastal_settlement", "port", "trade_hub"],
            requiresShips: true,
            unguardedOnly: false
        },
        PLUNDER_EXPEDITION: {
            id: "plunder_expedition",
            name: "Plunder Expedition",
            description: "A major raid deep into enemy territory, seeking significant wealth.",
            minWarriors: 25,
            lootMultiplier: 1.5,
            fameMultiplier: 1.2,
            dangerLevel: 3,
            defenseBonus: 0.7,
            captureChance: 0.3,
            duration: { min: 14, max: 30 },
            cooldown: 45,
            favoredTargets: ["town", "religious_center", "stronghold"],
            unguardedOnly: false
        },
        CONQUEST_CAMPAIGN: {
            id: "conquest_campaign",
            name: "Conquest Campaign",
            description: "A full military campaign seeking to conquer and hold territory.",
            minWarriors: 50,
            lootMultiplier: 1.0,
            fameMultiplier: 2.0,
            dangerLevel: 5,
            defenseBonus: 1.0,
            captureChance: 0.8,
            duration: { min: 30, max: 60 },
            cooldown: 90,
            favoredTargets: ["settlement", "stronghold", "territory"],
            conquerTerritory: true,
            unguardedOnly: false
        }
    };
    
    const UNIT_TYPES = {
        // Norse/Viking Units
        VIKING_WARRIOR: {
            id: "viking_warrior",
            name: "Viking Warrior",
            culture: "norse",
            description: "Versatile Norse fighters skilled with axe and shield.",
            attack: 5,
            defense: 4,
            morale: 6,
            speed: 5,
            upkeep: 2,
            trainTime: 10, // Days
            cost: {
                resources: { metal: 5, wood: 3 },
                population: 1
            },
            requirements: {
                buildings: ["training_ground"]
            }
        },
        BERSERKER: {
            id: "berserker",
            name: "Berserker",
            culture: "norse",
            description: "Fearsome warriors who fight with unmatched ferocity.",
            attack: 8,
            defense: 2,
            morale: 8,
            speed: 6,
            upkeep: 3,
            trainTime: 15,
            cost: {
                resources: { metal: 8, food: 5 },
                population: 1
            },
            requirements: {
                buildings: ["training_ground", "temple_of_thor"],
                research: ["berserker_training"]
            }
        },
        HUSCARL: {
            id: "huscarl",
            name: "Huscarl",
            culture: "norse",
            description: "Elite Viking warriors with superior equipment and training.",
            attack: 7,
            defense: 7,
            morale: 9,
            speed: 4,
            upkeep: 4,
            trainTime: 20,
            cost: {
                resources: { metal: 15, wood: 5 },
                population: 1
            },
            requirements: {
                buildings: ["longhouse", "smithy"],
                research: ["huscarl_training"]
            }
        },
        VIKING_ARCHER: {
            id: "viking_archer",
            name: "Viking Archer",
            culture: "norse",
            description: "Skilled ranged warriors supporting the shield wall.",
            attack: 6,
            defense: 2,
            morale: 5,
            speed: 5,
            upkeep: 2,
            trainTime: 12,
            cost: {
                resources: { wood: 10, metal: 3 },
                population: 1
            },
            requirements: {
                buildings: ["training_ground"]
            }
        },
        
        // Anglo-Saxon Units
        ANGLO_FOOTMAN: {
            id: "anglo_footman",
            name: "Anglo-Saxon Footman",
            culture: "anglo_saxon",
            description: "Stalwart infantry forming the backbone of Anglo-Saxon armies.",
            attack: 4,
            defense: 5,
            morale: 5,
            speed: 4,
            upkeep: 2,
            trainTime: 10,
            cost: {
                resources: { metal: 5, wood: 3 },
                population: 1
            },
            requirements: {
                buildings: ["barracks"]
            }
        },
        ANGLO_HUSCARL: {
            id: "anglo_huscarl",
            name: "Anglo-Saxon Huscarl",
            culture: "anglo_saxon",
            description: "Elite warriors serving Anglo-Saxon lords with unwavering loyalty.",
            attack: 6,
            defense: 8,
            morale: 8,
            speed: 3,
            upkeep: 4,
            trainTime: 20,
            cost: {
                resources: { metal: 15, wood: 5 },
                population: 1
            },
            requirements: {
                buildings: ["barracks", "smithy"],
                research: ["anglo_huscarl_training"]
            }
        },
        ANGLO_ARCHER: {
            id: "anglo_archer",
            name: "Anglo-Saxon Archer",
            culture: "anglo_saxon",
            description: "Skilled bowmen from the wooded regions of England.",
            attack: 5,
            defense: 2,
            morale: 4,
            speed: 5,
            upkeep: 2,
            trainTime: 12,
            cost: {
                resources: { wood: 10, metal: 2 },
                population: 1
            },
            requirements: {
                buildings: ["archery_range"]
            }
        },
        
        // Frankish Units
        FRANKISH_FOOTMAN: {
            id: "frankish_footman",
            name: "Frankish Footman",
            culture: "frankish",
            description: "Disciplined infantry from the Frankish kingdoms.",
            attack: 4,
            defense: 5,
            morale: 6,
            speed: 4,
            upkeep: 2,
            trainTime: 10,
            cost: {
                resources: { metal: 5, wood: 3 },
                population: 1
            },
            requirements: {
                buildings: ["barracks"]
            }
        },
        FRANKISH_KNIGHT: {
            id: "frankish_knight",
            name: "Frankish Knight",
            culture: "frankish",
            description: "Heavily armored mounted warriors, the elite of Frankish armies.",
            attack: 8,
            defense: 7,
            morale: 8,
            speed: 7,
            upkeep: 5,
            trainTime: 25,
            cost: {
                resources: { metal: 20, wood: 5, food: 10 },
                population: 1
            },
            requirements: {
                buildings: ["stables", "smithy"],
                research: ["frankish_cavalry_tactics"]
            }
        },
        FRANKISH_CROSSBOWMAN: {
            id: "frankish_crossbowman",
            name: "Frankish Crossbowman",
            culture: "frankish",
            description: "Skilled ranged warriors with powerful crossbows.",
            attack: 7,
            defense: 3,
            morale: 5,
            speed: 4,
            upkeep: 3,
            trainTime: 15,
            cost: {
                resources: { wood: 10, metal: 5 },
                population: 1
            },
            requirements: {
                buildings: ["archery_range", "smithy"],
                research: ["crossbow_construction"]
            }
        }
    };
    
    // Private variables
    let activeRaids = [];
    let raidHistory = [];
    let playerArmy = {
        units: {},
        totalStrength: 0,
        morale: 100,
        isRaiding: false
    };
    
    // Private methods
    
    /**
     * Calculate raid success chance
     * @param {Object} raid - Raid configuration
     * @param {Object} target - Target information
     * @param {Object} attackingForce - Attacking force information
     * @returns {number} - Success probability (0-1)
     */
    function calculateRaidSuccessChance(raid, target, attackingForce) {
        // Base success chance depending on raid type
        let baseChance = 0.5;
        
        // Adjust for raid type
        const raidType = RAID_TYPES[raid.type.toUpperCase()];
        if (raidType) {
            baseChance += 0.1 * (3 - raidType.dangerLevel); // Easier raids have higher base chance
        }
        
        // Adjust for attacker strength vs. target defense
        const strengthRatio = attackingForce.strength / Math.max(1, target.defense);
        baseChance += 0.2 * (strengthRatio - 1); // Bonus for overwhelming force
        
        // Adjust for morale
        baseChance += 0.1 * ((attackingForce.morale / 100) - 0.5); // Bonus for high morale
        
        // Adjust for terrain and fortifications
        baseChance -= 0.1 * target.defensiveBonus;
        
        // Random element
        const randomFactor = 0.1 * (Math.random() - 0.5); // -0.05 to 0.05
        
        // Calculate final chance
        const finalChance = baseChance + randomFactor;
        
        // Clamp to valid range
        return Math.max(0.1, Math.min(0.9, finalChance));
    }
    
    /**
     * Calculate raid loot
     * @param {Object} raid - Raid configuration
     * @param {Object} target - Target information
     * @param {boolean} success - Whether the raid was successful
     * @returns {Object} - Loot gained
     */
    function calculateRaidLoot(raid, target, success) {
        if (!success) {
            // Failed raid gets minimal loot
            return {
                resources: {
                    food: Math.floor(Math.random() * 5),
                    wood: Math.floor(Math.random() * 3),
                    metal: 0,
                    luxury: 0
                },
                wealth: Math.floor(Math.random() * 10),
                captives: 0,
                special: []
            };
        }
        
        // Base loot depends on target prosperity
        const baseLoot = {
            resources: {
                food: Math.floor(target.prosperity * (0.5 + Math.random())),
                wood: Math.floor(target.prosperity * (0.3 + Math.random() * 0.5)),
                metal: Math.floor(target.prosperity * (0.1 + Math.random() * 0.3)),
                luxury: Math.floor(target.prosperity * 0.1 * Math.random())
            },
            wealth: Math.floor(target.prosperity * (1 + Math.random())),
            captives: 0,
            special: []
        };
        
        // Adjust for target type
        switch (target.type) {
            case 'monastery':
                // Monasteries have more luxury goods and wealth, less practical resources
                baseLoot.resources.luxury += Math.floor(target.prosperity * 0.5);
                baseLoot.wealth += Math.floor(target.prosperity * 1.5);
                baseLoot.resources.food *= 0.5;
                baseLoot.resources.wood *= 0.5;
                
                // Chance for special religious artifacts
                if (Math.random() < 0.3) {
                    baseLoot.special.push({
                        type: 'religious_artifact',
                        name: 'Holy Relic',
                        value: Math.floor(50 + Math.random() * 150)
                    });
                }
                break;
                
            case 'village':
                // Villages have more food, less wealth
                baseLoot.resources.food *= 1.5;
                baseLoot.wealth *= 0.7;
                break;
                
            case 'town':
                // Towns have balanced resources and more wealth
                baseLoot.wealth *= 1.3;
                break;
                
            case 'trade_hub':
                // Trade hubs have more luxury goods and wealth
                baseLoot.resources.luxury += Math.floor(target.prosperity * 0.7);
                baseLoot.wealth *= 1.5;
                break;
                
            case 'stronghold':
                // Strongholds have more metal and wealth, but might be harder to raid
                baseLoot.resources.metal *= 2;
                baseLoot.wealth *= 1.2;
                break;
        }
        
        // Apply raid type loot multiplier
        const raidType = RAID_TYPES[raid.type.toUpperCase()];
        if (raidType && raidType.lootMultiplier) {
            baseLoot.resources.food = Math.floor(baseLoot.resources.food * raidType.lootMultiplier);
            baseLoot.resources.wood = Math.floor(baseLoot.resources.wood * raidType.lootMultiplier);
            baseLoot.resources.metal = Math.floor(baseLoot.resources.metal * raidType.lootMultiplier);
            baseLoot.resources.luxury = Math.floor(baseLoot.resources.luxury * raidType.lootMultiplier);
            baseLoot.wealth = Math.floor(baseLoot.wealth * raidType.lootMultiplier);
        }
        
        // Calculate captives (only if raid was successful)
        if (raidType && raidType.captureChance > 0) {
            // Number of potential captives based on target size
            const potentialCaptives = Math.floor(target.prosperity / 10);
            
            // Apply capture chance
            baseLoot.captives = Math.floor(potentialCaptives * raidType.captureChance * Math.random());
        }
        
        return baseLoot;
    }
    
    /**
     * Calculate raid casualties
     * @param {Object} raid - Raid configuration
     * @param {Object} target - Target information
     * @param {Object} attackingForce - Attacking force information
     * @param {boolean} success - Whether the raid was successful
     * @returns {Object} - Casualties for attacker and defender
     */
    function calculateRaidCasualties(raid, target, attackingForce, success) {
        const raidType = RAID_TYPES[raid.type.toUpperCase()];
        
        // Base casualty rates depend on raid danger level
        let baseCasualtyRate = (raidType ? raidType.dangerLevel : 2) * 0.05;
        
        // Adjust for success/failure
        if (!success) {
            // Failed raids are more costly for attackers
            baseCasualtyRate *= 1.5;
        }
        
        // Adjust for strength ratio
        const strengthRatio = attackingForce.strength / Math.max(1, target.defense);
        if (strengthRatio < 1) {
            // Attacking a stronger target is more costly
            baseCasualtyRate *= (2 - strengthRatio);
        } else {
            // Overwhelming force reduces casualties
            baseCasualtyRate /= strengthRatio;
        }
        
        // Adjust for target defenses
        baseCasualtyRate *= (1 + target.defensiveBonus);
        
        // Calculate attacker casualties
        const attackerCasualties = {};
        let totalAttackerCasualties = 0;
        
        for (const unitType in attackingForce.units) {
            const unitCount = attackingForce.units[unitType];
            if (unitCount > 0) {
                // Units with higher defense suffer fewer casualties
                const unitDef = UNIT_TYPES[unitType.toUpperCase()];
                const unitDefenseFactor = unitDef ? 1 - (unitDef.defense / 20) : 1;
                
                // Calculate casualties for this unit type
                const casualtyRate = baseCasualtyRate * unitDefenseFactor;
                const casualties = Math.floor(unitCount * casualtyRate * (0.5 + Math.random()));
                
                attackerCasualties[unitType] = Math.min(unitCount, casualties);
                totalAttackerCasualties += attackerCasualties[unitType];
            }
        }
        
        // Calculate defender casualties
        // Defenders lose more if raid is successful
        const defenderCasualtyRate = success ? baseCasualtyRate * 1.5 : baseCasualtyRate * 0.7;
        const defenderCasualties = Math.floor(target.garrison * defenderCasualtyRate * (0.5 + Math.random()));
        
        return {
            attacker: attackerCasualties,
            totalAttacker: totalAttackerCasualties,
            defender: Math.min(target.garrison, defenderCasualties)
        };
    }
    
    /**
     * Calculate fame gained from a raid
     * @param {Object} raid - Raid configuration
     * @param {Object} target - Target information
     * @param {Object} loot - Loot gained
     * @param {boolean} success - Whether the raid was successful
     * @returns {number} - Fame gained
     */
    function calculateRaidFame(raid, target, loot, success) {
        if (!success) {
            // Failed raids gain minimal fame
            return Math.floor(Math.random() * 5);
        }
        
        // Base fame depends on target importance
        let baseFame = 10 + target.importance * 5;
        
        // Add fame for wealth acquired
        baseFame += Math.floor(loot.wealth / 10);
        
        // Add fame for captives
        baseFame += loot.captives * 3;
        
        // Add fame for special items
        loot.special.forEach(item => {
            baseFame += Math.floor(item.value / 5);
        });
        
        // Apply raid type fame multiplier
        const raidType = RAID_TYPES[raid.type.toUpperCase()];
        if (raidType && raidType.fameMultiplier) {
            baseFame = Math.floor(baseFame * raidType.fameMultiplier);
        }
        
        return baseFame;
    }
    
    /**
     * Calculate diplomatic effects of a raid
     * @param {Object} raid - Raid configuration
     * @param {Object} target - Target information
     * @param {boolean} success - Whether the raid was successful
     * @returns {Object} - Diplomatic effects
     */
    function calculateDiplomaticEffects(raid, target, success) {
        const effects = {
            targetRelation: 0,
            otherRelations: {}
        };
        
        // Target faction relation always decreases
        effects.targetRelation = success ? -20 : -10;
        
        // Other factions react differently
        // - Norse factions might respect successful raids
        // - Christian factions dislike raids on churches/monasteries
        // - Allied factions dislike raids on their allies
        
        // Example: Norse factions React
        if (success && target.faction && target.faction.type !== 'norse') {
            effects.otherRelations.norse = 5; // Norse respect successful raids against non-Norse
        }
        
        // Severity depends on target type
        if (target.type === 'monastery' || target.type === 'religious_center') {
            effects.targetRelation *= 1.5; // Bigger diplomatic hit for religious targets
            
            // Christian factions are more upset
            effects.otherRelations.anglo_saxon = -15;
            effects.otherRelations.frankish = -15;
        }
        
        return effects;
    }
    
    // Public API
    return {
        /**
         * Initialize the warfare manager
         */
        init: function() {
            console.log("Warfare Manager initialized");
            
            // Reset player army
            playerArmy = {
                units: {},
                totalStrength: 0,
                morale: 100,
                isRaiding: false
            };
            
            activeRaids = [];
            raidHistory = [];
        },
        
        /**
         * Get available raid types
         * @returns {Object} - Available raid types
         */
        getAvailableRaidTypes: function() {
            return { ...RAID_TYPES };
        },
        
        /**
         * Get available unit types for a culture
         * @param {string} culture - Culture ID ('norse', 'anglo_saxon', 'frankish')
         * @returns {Object} - Available unit types for the culture
         */
        getAvailableUnitTypes: function(culture) {
            const availableUnits = {};
            
            for (const unitId in UNIT_TYPES) {
                const unit = UNIT_TYPES[unitId];
                if (unit.culture === culture) {
                    availableUnits[unitId] = { ...unit };
                }
            }
            
            return availableUnits;
        },
        
        /**
         * Get current player army
         * @returns {Object} - Current player army
         */
        getPlayerArmy: function() {
            return { ...playerArmy };
        },
        
        /**
         * Train units for player army
         * @param {string} unitType - Type of unit to train
         * @param {number} count - Number of units to train
         * @returns {boolean} - Whether the training was successful
         */
        trainUnits: function(unitType, count) {
            const unit = UNIT_TYPES[unitType.toUpperCase()];
            if (!unit) {
                console.warn(`Unknown unit type: ${unitType}`);
                return false;
            }
            
            // Check if requirements are met
            // This would check buildings, research, etc.
            // Simplified for now
            
            // Check if resources are available
            if (unit.cost && unit.cost.resources) {
                const sufficientResources = ResourceManager.canAfford(unit.cost.resources);
                if (!sufficientResources) {
                    console.warn(`Not enough resources to train ${count} ${unit.name}`);
                    return false;
                }
                
                // Pay for units
                ResourceManager.subtractResources({
                    food: (unit.cost.resources.food || 0) * count,
                    wood: (unit.cost.resources.wood || 0) * count,
                    metal: (unit.cost.resources.metal || 0) * count,
                    luxury: (unit.cost.resources.luxury || 0) * count
                });
            }
            
            // Add to player army
            if (!playerArmy.units[unit.id]) {
                playerArmy.units[unit.id] = 0;
            }
            
            playerArmy.units[unit.id] += count;
            
            // Update total strength
            this.recalculateArmyStrength();
            
            Utils.log(`Trained ${count} ${unit.name} units.`, "success");
            return true;
        },
        
        /**
         * Recalculate army strength based on current units
         */
        recalculateArmyStrength: function() {
            let strength = 0;
            
            for (const unitId in playerArmy.units) {
                const count = playerArmy.units[unitId];
                const unit = UNIT_TYPES[unitId.toUpperCase()];
                
                if (unit) {
                    // Calculate unit contribution based on attack, defense, and morale
                    const unitStrength = count * (unit.attack * 0.6 + unit.defense * 0.4);
                    strength += unitStrength;
                }
            }
            
            // Apply morale modifier
            strength *= (0.5 + playerArmy.morale / 200);
            
            playerArmy.totalStrength = Math.floor(strength);
        },
        
        /**
         * Find potential raid targets
         * @param {string} regionId - Current region ID
         * @param {string} raidType - Type of raid
         * @param {Object} worldData - World data
         * @returns {Array} - Array of potential targets
         */
        findRaidTargets: function(regionId, raidType, worldData) {
            const region = WorldGenerator.getRegionById(regionId);
            if (!region) return [];
            
            const raidTypeInfo = RAID_TYPES[raidType.toUpperCase()];
            if (!raidTypeInfo) return [];
            
            const potentialTargets = [];
            
            // Function to check if a region is a valid target
            const isValidTarget = (targetRegion) => {
                // Skip own regions
                if (targetRegion.ownerId === 'player_faction') return false;
                
                // Check if target is favored for this raid type
                let isFavoredTarget = false;
                
                // Determine target type based on region and settlements
                let targetType = 'settlement'; // Default
                let hasSettlement = false;
                
                // In a full implementation, we would check for actual settlements
                // For now, assume each region has a settlement based on terrain
                if (targetRegion.type === 'coastline') {
                    targetType = 'coastal_settlement';
                    hasSettlement = true;
                } else if (targetRegion.type === 'plains') {
                    targetType = 'village';
                    hasSettlement = true;
                } else if (targetRegion.type === 'hills' || targetRegion.type === 'mountains') {
                    // 50% chance for mining settlement
                    hasSettlement = Math.random() > 0.5;
                    targetType = hasSettlement ? 'mining_settlement' : targetRegion.type;
                } else {
                    // 70% chance for some kind of settlement
                    hasSettlement = Math.random() > 0.3;
                    targetType = hasSettlement ? 'small_settlement' : targetRegion.type;
                }
                
                // Check if this is a favored target type
                isFavoredTarget = raidTypeInfo.favoredTargets.includes(targetType);
                
                // For coastal raids, target must be coastal
                if (raidTypeInfo.id === 'coastal_raid' && targetType !== 'coastal_settlement') {
                    return false;
                }
                
                // If raid requires unguarded targets, check defense
                if (raidTypeInfo.unguardedOnly) {
                    // Check if region is defended
                    // In a full implementation, we would check actual garrison
                    const faction = FactionManager.getFactionById(targetRegion.ownerId);
                    if (faction && faction.strength > 100) {
                        return false;
                    }
                }
                
                return hasSettlement;
            };
            
            // For coastal raids, look at all coastal regions
            if (raidTypeInfo.id === 'coastal_raid') {
                worldData.regions
                    .filter(r => r.type === 'coastline' && isValidTarget(r))
                    .forEach(r => {
                        potentialTargets.push({
                            id: r.id,
                            name: r.name,
                            type: 'coastal_settlement',
                            distance: 2, // Simplified distance calculation
                            prosperity: r.resources.food ? r.resources.food.abundance : 50,
                            garrison: Math.floor(Math.random() * 20), // Simplified garrison calculation
                            defensiveBonus: 0.2,
                            factionId: r.ownerId,
                            faction: FactionManager.getFactionById(r.ownerId)
                        });
                    });
                
                return potentialTargets;
            }
            
            // For land raids, look at neighboring regions
            const checkedRegions = new Set();
            const regionsToCheck = [region.id];
            let searchDepth = 0;
            const maxSearchDepth = raidTypeInfo.id === 'plunder_expedition' ? 3 : 
                                  (raidTypeInfo.id === 'conquest_campaign' ? 5 : 1);
            
            while (regionsToCheck.length > 0 && searchDepth < maxSearchDepth) {
                const currentRegionId = regionsToCheck.shift();
                
                if (checkedRegions.has(currentRegionId)) continue;
                checkedRegions.add(currentRegionId);
                
                const currentRegion = WorldGenerator.getRegionById(currentRegionId);
                if (!currentRegion) continue;
                
                // Check if this region is a valid target
                if (currentRegionId !== region.id && isValidTarget(currentRegion)) {
                    // Get faction controlling the region
                    const faction = FactionManager.getFactionById(currentRegion.ownerId);
                    
                    // Calculate region prosperity based on resources
                    let prosperity = 50; // Default
                    if (currentRegion.resources.food) {
                        prosperity = currentRegion.resources.food.abundance;
                    }
                    
                    // Calculate defensive bonus based on terrain
                    let defensiveBonus = 0;
                    if (currentRegion.type === 'hills') defensiveBonus = 0.2;
                    if (currentRegion.type === 'mountains') defensiveBonus = 0.3;
                    if (currentRegion.type === 'forest') defensiveBonus = 0.1;
                    
                    // Calculate garrison strength (simplified)
                    const garrison = faction ? Math.floor(faction.strength / 10) : Math.floor(Math.random() * 10);
                    
                    // Determine target type
                    let targetType = 'village'; // Default
                    if (currentRegion.type === 'coastline') {
                        targetType = 'coastal_settlement';
                    } else if (Math.random() > 0.7) {
                        // Some chance for special targets
                        const specialTypes = ['monastery', 'trade_hub', 'stronghold'];
                        targetType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                    }
                    
                    // Add as potential target
                    potentialTargets.push({
                        id: currentRegion.id,
                        name: currentRegion.name,
                        type: targetType,
                        distance: searchDepth + 1,
                        prosperity: prosperity,
                        garrison: garrison,
                        defensiveBonus: defensiveBonus,
                        importance: defensiveBonus + (prosperity / 100), // Importance for fame calculation
                        factionId: currentRegion.ownerId,
                        faction: faction
                    });
                }
                
                // Add neighbors to check
                currentRegion.neighbors.forEach(neighborId => {
                    if (!checkedRegions.has(neighborId)) {
                        regionsToCheck.push(neighborId);
                    }
                });
                
                // Increment search depth when we've processed all regions at the current depth
                if (regionsToCheck.length === 0 && searchDepth < maxSearchDepth - 1) {
                    searchDepth++;
                }
            }
            
            return potentialTargets;
        },
        
        /**
         * Launch a raid against a target
         * @param {string} raidType - Type of raid
         * @param {Object} target - Target information
         * @param {Object} assignedUnits - Units assigned to the raid
         * @returns {Object|null} - Raid information or null if raid couldn't be launched
         */
        launchRaid: function(raidType, target, assignedUnits) {
            const raidTypeInfo = RAID_TYPES[raidType.toUpperCase()];
            if (!raidTypeInfo) {
                console.warn(`Unknown raid type: ${raidType}`);
                return null;
            }
            
            // Check if player has enough units
            let totalAssignedUnits = 0;
            for (const unitType in assignedUnits) {
                totalAssignedUnits += assignedUnits[unitType];
            }
            
            if (totalAssignedUnits < raidTypeInfo.minWarriors) {
                Utils.log(`Not enough warriors for this raid. Need at least ${raidTypeInfo.minWarriors}.`, "important");
                return null;
            }
            
            // Check if already raiding
            if (playerArmy.isRaiding) {
                Utils.log("Your forces are already engaged in a raid.", "important");
                return null;
            }
            
            // Check if ships are required
            if (raidTypeInfo.requiresShips) {
                // In a full implementation, we would check if player has ships
                // For now, assume they do
            }
            
            // Calculate raid duration
            const raidDuration = Utils.randomBetween(raidTypeInfo.duration.min, raidTypeInfo.duration.max);
            
            // Calculate attacker strength
            let attackerStrength = 0;
            let attackerMorale = playerArmy.morale;
            
            // Create deep copy of assigned units
            const raidingUnits = {};
            for (const unitType in assignedUnits) {
                const count = assignedUnits[unitType];
                if (count > 0) {
                    raidingUnits[unitType] = count;
                    
                    // Add to strength
                    const unit = UNIT_TYPES[unitType.toUpperCase()];
                    if (unit) {
                        attackerStrength += count * (unit.attack * 0.6 + unit.defense * 0.4);
                    }
                }
            }
            
            // Apply morale modifier
            attackerStrength *= (0.5 + attackerMorale / 200);
            
            // Create raid object
            const raid = {
                id: `raid_${Date.now()}`,
                type: raidTypeInfo.id,
                typeName: raidTypeInfo.name,
                target: {
                    id: target.id,
                    name: target.name,
                    type: target.type,
                    garrison: target.garrison,
                    defensiveBonus: target.defensiveBonus,
                    prosperity: target.prosperity,
                    defense: target.garrison * (1 + target.defensiveBonus),
                    factionId: target.factionId,
                    importance: target.importance || 1
                },
                attacker: {
                    units: raidingUnits,
                    strength: attackerStrength,
                    morale: attackerMorale
                },
                startTime: GameEngine.getGameState().date.day,
                duration: raidDuration,
                remainingDays: raidDuration,
                isCompleted: false,
                result: null
            };
            
            // Remove units from player army
            for (const unitType in raidingUnits) {
                playerArmy.units[unitType] -= raidingUnits[unitType];
                
                // Ensure we don't go below 0
                if (playerArmy.units[unitType] < 0) {
                    playerArmy.units[unitType] = 0;
                }
            }
            
            // Recalculate army strength
            this.recalculateArmyStrength();
            
            // Mark army as raiding
            playerArmy.isRaiding = true;
            
            // Add to active raids
            activeRaids.push(raid);
            
            Utils.log(`Your warriors set out on a ${raidTypeInfo.name} against ${target.name}.`, "important");
            
            return raid;
        },
        
        /**
         * Process active raids for a game tick
         * @param {number} daysPassed - Number of days that passed
         */
        processRaids: function(daysPassed) {
            const completedRaids = [];
            
            // Process each active raid
            activeRaids.forEach(raid => {
                // Decrease remaining days
                raid.remainingDays -= daysPassed;
                
                // Check if raid is completed
                if (raid.remainingDays <= 0 && !raid.isCompleted) {
                    raid.isCompleted = true;
                    completedRaids.push(raid);
                }
            });
            
            // Handle completed raids
            completedRaids.forEach(raid => {
                this.completeRaid(raid);
            });
            
            // Remove completed raids from active raids
            activeRaids = activeRaids.filter(raid => !raid.isCompleted);
        },
        
        /**
         * Complete a raid and determine outcome
         * @param {Object} raid - Raid to complete
         */
        completeRaid: function(raid) {
            // Calculate raid success
            const successChance = calculateRaidSuccessChance(raid, raid.target, raid.attacker);
            const isSuccess = Math.random() < successChance;
            
            // Calculate raid outcomes
            const loot = calculateRaidLoot(raid, raid.target, isSuccess);
            const casualties = calculateRaidCasualties(raid, raid.target, raid.attacker, isSuccess);
            const fame = calculateRaidFame(raid, raid.target, loot, isSuccess);
            const diplomaticEffects = calculateDiplomaticEffects(raid, raid.target, isSuccess);
            
            // Store results
            raid.result = {
                success: isSuccess,
                loot: loot,
                casualties: casualties,
                fame: fame,
                diplomaticEffects: diplomaticEffects
            };
            
            // Apply results
            
            // 1. Return surviving units to army
            for (const unitType in raid.attacker.units) {
                const surviving = raid.attacker.units[unitType] - (casualties.attacker[unitType] || 0);
                if (surviving > 0) {
                    if (!playerArmy.units[unitType]) {
                        playerArmy.units[unitType] = 0;
                    }
                    playerArmy.units[unitType] += surviving;
                }
            }
            
            // 2. Add loot to resources
            ResourceManager.addResources({
                food: loot.resources.food,
                wood: loot.resources.wood,
                metal: loot.resources.metal,
                luxury: loot.resources.luxury
            });
            
            // Add wealth/silver
            ResourceManager.addWealth(loot.wealth);
            
            // 3. Add fame
            if (RankManager && typeof RankManager.addFame === 'function') {
                RankManager.addFame(fame, isSuccess ? "Successful raid" : "Raid");
            }
            
            // 4. Update diplomatic relations
            if (raid.target.factionId) {
                FactionManager.modifyRelation('player_faction', raid.target.factionId, diplomaticEffects.targetRelation);
                
                // Update relations with other factions
                for (const factionType in diplomaticEffects.otherRelations) {
                    // Find factions of this type
                    const factionsOfType = FactionManager.getFactions().filter(f => f.type === factionType);
                    
                    factionsOfType.forEach(faction => {
                        if (faction.id !== 'player_faction') {
                            FactionManager.modifyRelation('player_faction', faction.id, diplomaticEffects.otherRelations[factionType]);
                        }
                    });
                }
            }
            
            // 5. Update morale based on success/failure
            if (isSuccess) {
                playerArmy.morale = Math.min(100, playerArmy.morale + 10);
            } else {
                playerArmy.morale = Math.max(20, playerArmy.morale - 15);
            }
            
            // 6. Process captives (if any)
            if (loot.captives > 0) {
                // In a full implementation, this would add slaves or prisoners
                // For now, just convert to wealth
                ResourceManager.addWealth(loot.captives * 10);
            }
            
            // Recalculate army strength
            this.recalculateArmyStrength();
            
            // Mark army as no longer raiding
            playerArmy.isRaiding = false;
            
            // Add to raid history
            raidHistory.push(raid);
            
            // Log outcome
            if (isSuccess) {
                Utils.log(`Your raid against ${raid.target.name} was successful! You gained ${loot.wealth} wealth and valuable resources.`, "success");
            } else {
                Utils.log(`Your raid against ${raid.target.name} failed. You suffered casualties and gained little loot.`, "important");
            }
            
            // Log casualties
            let casualtyMessage = `Casualties: `;
            let hasCasualties = false;
            
            for (const unitType in casualties.attacker) {
                if (casualties.attacker[unitType] > 0) {
                    const unit = UNIT_TYPES[unitType.toUpperCase()];
                    casualtyMessage += `${casualties.attacker[unitType]} ${unit ? unit.name : unitType}, `;
                    hasCasualties = true;
                }
            }
            
            if (hasCasualties) {
                Utils.log(casualtyMessage.slice(0, -2), "important");
            } else {
                Utils.log("Your warriors returned without any casualties.", "success");
            }
            
            // Return raid results for UI
            return raid.result;
        },
        
        /**
         * Get active raids
         * @returns {Array} - Array of active raids
         */
        getActiveRaids: function() {
            return [...activeRaids];
        },
        
        /**
         * Get raid history
         * @returns {Array} - Array of completed raids
         */
        getRaidHistory: function() {
            return [...raidHistory];
        },
        
        /**
         * Get active raid by ID
         * @param {string} raidId - Raid ID
         * @returns {Object|null} - Raid object or null if not found
         */
        getRaidById: function(raidId) {
            return activeRaids.find(r => r.id === raidId) || 
                   raidHistory.find(r => r.id === raidId) || 
                   null;
        }
    };
})();