/**
 * Viking Legacy - Exploration System
 * Handles exploration mechanics, parties, discoveries, and related events
 */

const ExploreManager = (function() {
    // Private variables
    
    // Party types with their characteristics
    const partyTypes = {
        ADVENTURER_BAND: {
            id: "adventurer_band",
            name: "Adventurer Band",
            description: "A small group of explorers who can travel quickly and stealthily.",
            minSize: 2,
            maxSize: 5,
            speedModifier: 1.5,
            supplyConsumption: 0.5, // Per person per day
            stealthModifier: 1.5,
            combatStrength: 0.7, // Lower combat strength
            requiredLeader: false
        },
        RAIDER_WARBAND: {
            id: "raider_warband",
            name: "Raider Warband",
            description: "A moderate-sized force capable of light combat and extended scouting missions.",
            minSize: 6,
            maxSize: 20,
            speedModifier: 1.0,
            supplyConsumption: 0.75,
            stealthModifier: 0.8,
            combatStrength: 1.0,
            requiredLeader: true
        },
        ARMY: {
            id: "army",
            name: "Army",
            description: "A large force with significant combat capability but slower movement and higher supply needs.",
            minSize: 21,
            maxSize: 100,
            speedModifier: 0.6,
            supplyConsumption: 1.0,
            stealthModifier: 0.4,
            combatStrength: 1.5,
            requiredLeader: true
        }
    };
    
    // Active exploration parties
    let activeExpeditions = [];
    
    // Expedition template
    const expeditionTemplate = {
        id: "",
        name: "",
        partyType: "", // Refers to partyTypes
        size: 0, // Number of warriors/explorers
        leader: null, // Character who leads the expedition
        morale: 100, // Starting morale
        supplies: 0, // Food supplies
        targetRegion: null, // Region being explored
        currentPosition: { x: 0, y: 0 },
        startDate: null, // Game date when expedition started
        returnDate: null, // Estimated return date
        status: "preparing", // preparing, exploring, returning, completed, failed
        discoveries: [], // Resources, settlements, or events discovered
        daysRemaining: 0, // Days until completion/return
        encountersResolved: 0, // Number of encounters already processed
        treasuresFound: 0, // Special items or treasures found
        casualtiesSuffered: 0 // Warriors lost during expedition
    };
    
    // Discovery chances by region type
    const discoveryChances = {
        FOREST: {
            resources: {
                wood: 75, 
                food: 50, 
                herbs: 30, 
                honey: 20,
                fur: 40,
                pitch: 25,
                leather: 20
            },
            settlements: 20,
            treasures: 10
        },
        PLAINS: {
            resources: {
                food: 75, 
                wood: 30, 
                stone: 20, 
                clay: 35,
                herbs: 25,
                honey: 25,
                cloth: 30
            },
            settlements: 40,
            treasures: 15
        },
        MOUNTAINS: {
            resources: {
                stone: 70, 
                metal: 60, 
                wood: 25, 
                herbs: 20,
                salt: 30,
                ice: 15
            },
            settlements: 10,
            treasures: 25
        },
        COASTAL: {
            resources: {
                food: 60, 
                salt: 50, 
                clay: 40, 
                stone: 30,
                whale_oil: 35
            },
            settlements: 50, // Higher chance of settlements near coasts
            treasures: 20
        },
        FJORD: {
            resources: {
                food: 50, 
                wood: 40, 
                stone: 30, 
                metal: 25,
                whale_oil: 45,
                ice: 35,
                fur: 30
            },
            settlements: 30,
            treasures: 30
        }
    };
    
    // Encounter types by region
    const encounterTypes = {
        FOREST: ["wild_beasts", "bandits", "lost_traveler", "ancient_grove", "abandoned_camp"],
        PLAINS: ["bandits", "nomads", "rival_scouts", "old_battlefield", "wandering_merchant"],
        MOUNTAINS: ["rock_slide", "cave_system", "mountain_tribe", "snow_storm", "ancient_ruins"],
        COASTAL: ["pirates", "stranded_ship", "fishing_village", "coastal_storm", "tidal_cave"],
        FJORD: ["sea_beasts", "hidden_cove", "rival_viking_band", "foreign_ship", "ancient_burial_site"]
    };
    
    // Event template for exploration
    const explorationEventTemplate = {
        title: "",
        description: "",
        options: [],
        chances: {}, // Success chances for different options
        outcomes: {}, // Outcomes for each option
        regionTypes: [], // What regions can this event occur in
        partyTypes: [], // What party types can trigger this event
        minimumMorale: 0, // Minimum morale required
        cooldown: 60 // Days before this event can occur again for the same player
    };
    
    // Private methods
    
    /**
     * Calculate the total strength of an expedition
     * @param {Object} expedition - Expedition object
     * @returns {number} - Total strength value
     */
    function calculateExpeditionStrength(expedition) {
        const partyType = partyTypes[expedition.partyType];
        if (!partyType) return 0;
        
        let strength = expedition.size * partyType.combatStrength;
        
        // Add bonus from leader if present
        if (expedition.leader) {
            const leaderCombatSkill = expedition.leader.skills?.combat || 1;
            const leaderBonus = 1 + (leaderCombatSkill / 10); // 10% bonus per combat skill point
            strength *= leaderBonus;
        }
        
        // Morale affects strength
        strength *= (expedition.morale / 100);
        
        return strength;
    }
    
    /**
     * Calculate supply consumption for an expedition
     * @param {Object} expedition - Expedition object
     * @param {number} days - Number of days
     * @returns {number} - Total supplies consumed
     */
    function calculateSupplyConsumption(expedition, days) {
        const partyType = partyTypes[expedition.partyType];
        if (!partyType) return 0;
        
        return expedition.size * partyType.supplyConsumption * days;
    }
    
    /**
     * Check if an expedition can be created with current resources and population
     * @param {string} partyTypeId - Type of party to check
     * @param {number} size - Size of the party
     * @param {number} duration - Duration in days
     * @returns {Object} - Object with canCreate flag and reason if not
     */
    function canCreateExpedition(partyTypeId, size, duration) {
        const partyType = partyTypes[partyTypeId];
        if (!partyType) return { canCreate: false, reason: "Invalid party type." };
        
        // Check size limits
        if (size < partyType.minSize) {
            return { 
                canCreate: false, 
                reason: `Party too small. ${partyType.name} requires at least ${partyType.minSize} members.`
            };
        }
        
        if (size > partyType.maxSize) {
            return { 
                canCreate: false, 
                reason: `Party too large. ${partyType.name} can have at most ${partyType.maxSize} members.`
            };
        }
        
        // Check available warriors
        const population = PopulationManager.getPopulation();
        
        // Use BuildingSystem's getWarriorData if available for more accurate warrior count
        const warriorCount = typeof BuildingSystem !== 'undefined' && 
                            typeof BuildingSystem.getWarriorData === 'function' ? 
                            BuildingSystem.getWarriorData().available : 
                            (population.warriors || 0);
        
        if (size > warriorCount) {
            return { 
                canCreate: false, 
                reason: `Not enough warriors available. Need ${size}, have ${warriorCount}.`
            };
        }
        
        // Check supplies
        const suppliesNeeded = calculateSupplyConsumption({ size, partyType: partyTypeId }, duration);
        const resources = ResourceManager.getResources();
        
        if (suppliesNeeded > resources.food) {
            return { 
                canCreate: false, 
                reason: `Not enough food supplies. Need ${Math.ceil(suppliesNeeded)}, have ${Math.floor(resources.food)}.`
            };
        }
        
        // Check for leader requirement
        if (partyType.requiredLeader) {
            // In a real game, we might check for an available character with leadership skills
            // For simplicity, we'll assume the player's leader is always available
            const leader = PopulationManager.getDynastyLeader();
            if (!leader) {
                return { 
                    canCreate: false, 
                    reason: `This expedition type requires a leader.`
                };
            }
        }
        
        return { canCreate: true };
    }
    
    /**
     * Generate a unique ID for an expedition
     * @returns {string} - Unique ID
     */
    function generateExpeditionId() {
        return `expedition_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Process exploration discoveries
     * @param {Object} expedition - Expedition object
     * @param {Object} region - Region being explored
     * @returns {Array} - Array of discoveries made
     */
    function processDiscoveries(expedition, region) {
        if (!region || !region.type) return [];
        
        const discoveries = [];
        const regionDiscoveryChances = discoveryChances[region.type];
        
        if (!regionDiscoveryChances) return discoveries;
        
        // Process resource discoveries
        for (const resource in regionDiscoveryChances.resources) {
            const baseChance = regionDiscoveryChances.resources[resource];
            // Party size increases discovery chance
            const sizeBonus = Math.min(expedition.size * 0.5, 25); // Max 25% bonus
            const finalChance = baseChance + sizeBonus;
            
            if (Utils.chanceOf(finalChance)) {
                // Determine amount based on party size and region modifiers
                const baseAmount = Utils.randomBetween(5, 20);
                const regionModifier = region.resourceModifiers[resource] || 1;
                const amount = Math.ceil(baseAmount * regionModifier);
                
                discoveries.push({
                    type: "resource",
                    resource: resource,
                    amount: amount,
                    description: `Discovered ${amount} ${resource}`
                });
            }
        }
        
        // Process settlement discoveries
        const settlementChance = regionDiscoveryChances.settlements;
        // Bigger parties are more likely to find settlements
        const settlementSizeBonus = Math.min(expedition.size * 0.3, 15); // Max 15% bonus
        
        if (Utils.chanceOf(settlementChance + settlementSizeBonus)) {
            // Check for nearby settlements from the WorldMap
            const nearbySettlements = WorldMap.getNearbySettlements(
                WorldMap.getPlayerSettlement().id, 
                (expedition.size * 10) // Exploration radius increases with party size
            );
            
            // Filter out already discovered settlements
            const undiscoveredSettlements = nearbySettlements.filter(settlement => {
                // In a real game, we would check if the settlement is already discovered
                // For simplicity, we'll use a random chance
                return Utils.chanceOf(70);
            });
            
            if (undiscoveredSettlements.length > 0) {
                const discoveredSettlement = undiscoveredSettlements[
                    Utils.randomBetween(0, undiscoveredSettlements.length - 1)
                ];
                
                discoveries.push({
                    type: "settlement",
                    settlement: discoveredSettlement.id,
                    name: discoveredSettlement.name,
                    faction: discoveredSettlement.type,
                    description: `Discovered ${discoveredSettlement.name}, a ${discoveredSettlement.type} settlement`
                });
            }
        }
        
        // Process treasure discoveries
        const treasureChance = regionDiscoveryChances.treasures;
        // Bigger parties might find more treasures
        const treasureSizeBonus = Math.min(expedition.size * 0.2, 10); // Max 10% bonus
        
        if (Utils.chanceOf(treasureChance + treasureSizeBonus)) {
            // Simple treasure types
            const treasureTypes = [
                "ancient_artifacts", "buried_silver", "old_weapons", 
                "trade_goods", "religious_items"
            ];
            const treasureType = treasureTypes[Utils.randomBetween(0, treasureTypes.length - 1)];
            const treasureValue = Utils.randomBetween(10, 50);
            
            discoveries.push({
                type: "treasure",
                treasureType: treasureType,
                value: treasureValue,
                description: `Found ${treasureType} worth ${treasureValue} silver`
            });
        }
        
        return discoveries;
    }
    
    /**
     * Process exploration encounters
     * @param {Object} expedition - Expedition object
     * @param {Object} region - Region being explored
     * @returns {Object|null} - Encounter object or null if no encounter
     */
    function processEncounter(expedition, region) {
        if (!region || !region.type) return null;
        
        // Base chance for an encounter
        const baseEncounterChance = 20; // 20% chance per processing
        
        // Party type affects encounter chance
        const partyType = partyTypes[expedition.partyType];
        let encounterChance = baseEncounterChance;
        
        if (partyType) {
            // Smaller, stealthier parties have fewer encounters
            encounterChance = baseEncounterChance * (2 - partyType.stealthModifier);
        }
        
        // Check if encounter happens
        if (!Utils.chanceOf(encounterChance)) {
            return null;
        }
        
        // Get encounter types for this region
        const regionEncounters = encounterTypes[region.type];
        if (!regionEncounters || regionEncounters.length === 0) {
            return null;
        }
        
        // Select random encounter type
        const encounterType = regionEncounters[
            Utils.randomBetween(0, regionEncounters.length - 1)
        ];
        
        // Create encounter event
        // In a real game, this would pull from a comprehensive encounter database
        // For simplicity, we'll create a basic encounter
        
        let encounterTitle, encounterDescription, encounterOptions;
        
        switch (encounterType) {
            case "wild_beasts":
                encounterTitle = "Wild Beasts";
                encounterDescription = "Your party encounters a pack of wild animals. They seem hostile.";
                encounterOptions = [
                    { text: "Hunt them for food and furs", outcome: "hunt" },
                    { text: "Try to scare them away", outcome: "scare" },
                    { text: "Retreat and find another path", outcome: "retreat" }
                ];
                break;
            case "bandits":
                encounterTitle = "Bandit Ambush";
                encounterDescription = "A group of bandits has set up an ambush on your path.";
                encounterOptions = [
                    { text: "Fight them", outcome: "fight" },
                    { text: "Try to negotiate", outcome: "negotiate" },
                    { text: "Attempt to sneak past", outcome: "sneak" }
                ];
                break;
            case "ancient_ruins":
            case "ancient_grove":
            case "ancient_burial_site":
                encounterTitle = "Ancient Site";
                encounterDescription = "Your party discovers an ancient site, possibly containing valuable artifacts.";
                encounterOptions = [
                    { text: "Explore thoroughly", outcome: "explore" },
                    { text: "Take a quick look", outcome: "quick_search" },
                    { text: "Leave it undisturbed", outcome: "leave" }
                ];
                break;
            case "lost_traveler":
            case "wandering_merchant":
                encounterTitle = "Traveler on the Road";
                encounterDescription = "You meet a traveler who seems to know the area well.";
                encounterOptions = [
                    { text: "Exchange information", outcome: "exchange" },
                    { text: "Offer to trade goods", outcome: "trade" },
                    { text: "Ask to join forces temporarily", outcome: "join" }
                ];
                break;
            default:
                encounterTitle = "Unusual Encounter";
                encounterDescription = "Your party encounters something unusual in their travels.";
                encounterOptions = [
                    { text: "Investigate closely", outcome: "investigate" },
                    { text: "Observe from a distance", outcome: "observe" },
                    { text: "Avoid and continue journey", outcome: "avoid" }
                ];
        }
        
        return {
            type: "encounter",
            encounterType: encounterType,
            title: encounterTitle,
            description: encounterDescription,
            options: encounterOptions,
            expedition: expedition.id,
            region: region.id
        };
    }
    
    /**
     * Handle encounter outcome
     * @param {Object} encounter - Encounter object
     * @param {string} chosenOption - Option chosen by player
     * @param {Object} expedition - Expedition object
     * @returns {Object} - Outcome of the encounter
     */
    function handleEncounterOutcome(encounter, chosenOption, expedition) {
        // Find the chosen option
        const option = encounter.options.find(opt => opt.outcome === chosenOption);
        if (!option) {
            return {
                success: false,
                message: "Invalid option selected.",
                changes: {}
            };
        }
        
        // Calculate success chance based on expedition strength, morale, and option
        let baseSuccessChance = 50; // Default 50% success chance
        const expeditionStrength = calculateExpeditionStrength(expedition);
        const strengthBonus = Math.min(expeditionStrength / 10, 30); // Max 30% bonus
        const moraleBonus = (expedition.morale - 50) / 2; // -25% to +25% based on morale
        
        // Different options have different success chances
        let optionModifier = 0;
        switch (chosenOption) {
            case "hunt":
            case "fight":
                optionModifier = expeditionStrength / 20; // Combat options scale with strength
                break;
            case "scare":
            case "negotiate":
                // These depend more on leader skills
                optionModifier = expedition.leader?.skills?.leadership || 0;
                break;
            case "retreat":
            case "sneak":
            case "avoid":
                // Stealth options depend on party type
                optionModifier = partyTypes[expedition.partyType]?.stealthModifier * 10 || 0;
                break;
            case "explore":
            case "investigate":
                // Thorough exploration takes time but might be more rewarding
                optionModifier = -10; // Harder but more rewarding
                break;
            case "quick_search":
            case "observe":
                // Quick actions are safer but less rewarding
                optionModifier = 20; // Easier but less rewarding
                break;
            case "exchange":
            case "trade":
            case "join":
                // Social interactions depend on leader skills
                optionModifier = (expedition.leader?.skills?.leadership || 0) * 2;
                break;
        }
        
        const finalSuccessChance = baseSuccessChance + strengthBonus + moraleBonus + optionModifier;
        const success = Utils.chanceOf(finalSuccessChance);
        
        // Initialize outcome
        const outcome = {
            success: success,
            message: "",
            changes: {
                morale: 0,
                casualties: 0,
                supplies: 0,
                discoveries: []
            }
        };
        
        // Handle different encounter types and outcomes
        switch (encounter.encounterType) {
            case "wild_beasts":
                if (chosenOption === "hunt") {
                    if (success) {
                        outcome.message = "Your party successfully hunts down the beasts, gaining food and furs.";
                        outcome.changes.morale = 5;
                        outcome.changes.supplies = expedition.size * 0.5; // Food gained
                        outcome.changes.discoveries.push({
                            type: "resource",
                            resource: "fur",
                            amount: Utils.randomBetween(2, 5 + Math.floor(expedition.size / 4)),
                            description: "Acquired furs from hunting"
                        });
                    } else {
                        outcome.message = "The hunt goes poorly. Your party suffers casualties and must retreat.";
                        outcome.changes.morale = -10;
                        outcome.changes.casualties = Math.max(1, Math.floor(expedition.size * 0.1));
                    }
                } else if (chosenOption === "scare") {
                    if (success) {
                        outcome.message = "Your party successfully scares away the beasts without bloodshed.";
                        outcome.changes.morale = 3;
                    } else {
                        outcome.message = "The beasts are not intimidated and attack. Your party takes casualties.";
                        outcome.changes.morale = -5;
                        outcome.changes.casualties = Math.max(1, Math.floor(expedition.size * 0.05));
                    }
                } else if (chosenOption === "retreat") {
                    if (success) {
                        outcome.message = "Your party successfully retreats without incident.";
                        // No significant changes
                    } else {
                        outcome.message = "The beasts pursue your retreating party, causing some injuries.";
                        outcome.changes.morale = -3;
                        outcome.changes.casualties = Math.floor(expedition.size * 0.03);
                    }
                }
                break;
                
            case "bandits":
                if (chosenOption === "fight") {
                    if (success) {
                        outcome.message = "Your warriors defeat the bandits and claim their hidden stash.";
                        outcome.changes.morale = 10;
                        outcome.changes.discoveries.push({
                            type: "treasure",
                            treasureType: "bandit_loot",
                            value: Utils.randomBetween(10, 30 + expedition.size),
                            description: "Silver and goods taken from defeated bandits"
                        });
                    } else {
                        outcome.message = "The bandits prove stronger than expected. Your party suffers heavy losses.";
                        outcome.changes.morale = -15;
                        outcome.changes.casualties = Math.max(1, Math.floor(expedition.size * 0.15));
                        outcome.changes.supplies = -Math.floor(expedition.supplies * 0.2); // Lose some supplies
                    }
                } else if (chosenOption === "negotiate") {
                    if (success) {
                        outcome.message = "You successfully negotiate safe passage with the bandits.";
                        outcome.changes.morale = 5;
                    } else {
                        outcome.message = "The bandits demand tribute for safe passage.";
                        outcome.changes.morale = -5;
                        outcome.changes.supplies = -Math.floor(expedition.supplies * 0.1); // Lose some supplies as tribute
                    }
                } else if (chosenOption === "sneak") {
                    if (success) {
                        outcome.message = "Your party sneaks past the bandits undetected.";
                        outcome.changes.morale = 5;
                    } else {
                        outcome.message = "The bandits spot your party while sneaking. A brief skirmish ensues.";
                        outcome.changes.morale = -5;
                        outcome.changes.casualties = Math.max(0, Math.floor(expedition.size * 0.05));
                    }
                }
                break;
                
            case "ancient_ruins":
            case "ancient_grove":
            case "ancient_burial_site":
                if (chosenOption === "explore") {
                    if (success) {
                        outcome.message = "Your thorough exploration uncovers valuable artifacts and hidden knowledge.";
                        outcome.changes.morale = 10;
                        
                        // Add significant discoveries
                        const treasureValue = Utils.randomBetween(20, 50 + (expedition.size * 2));
                        outcome.changes.discoveries.push({
                            type: "treasure",
                            treasureType: "ancient_artifacts",
                            value: treasureValue,
                            description: "Valuable ancient artifacts discovered during exploration"
                        });
                        
                        // Chance to discover special resources
                        if (Utils.chanceOf(50)) {
                            const specialResources = ["silver", "gold", "amber", "jewels"];
                            const resource = specialResources[Utils.randomBetween(0, specialResources.length - 1)];
                            const amount = Utils.randomBetween(5, 15);
                            
                            outcome.changes.discoveries.push({
                                type: "resource",
                                resource: resource,
                                amount: amount,
                                description: `Discovered ${amount} ${resource} in the ancient site`
                            });
                        }
                    } else {
                        outcome.message = "Your exploration disturbs ancient guardians or traps. The party suffers casualties.";
                        outcome.changes.morale = -10;
                        outcome.changes.casualties = Math.max(1, Math.floor(expedition.size * 0.1));
                    }
                } else if (chosenOption === "quick_search") {
                    if (success) {
                        outcome.message = "A quick search yields some interesting items without incident.";
                        outcome.changes.morale = 5;
                        
                        // Add moderate discoveries
                        const treasureValue = Utils.randomBetween(10, 25 + expedition.size);
                        outcome.changes.discoveries.push({
                            type: "treasure",
                            treasureType: "ancient_items",
                            value: treasureValue,
                            description: "Items recovered from a quick search of the ancient site"
                        });
                    } else {
                        outcome.message = "The hasty search yields little of value and damages some potential artifacts.";
                        outcome.changes.morale = -3;
                    }
                } else if (chosenOption === "leave") {
                    outcome.message = "You decide to leave the ancient site undisturbed out of respect or caution.";
                    outcome.changes.morale = 2;
                    outcome.success = true; // Always succeeds
                }
                break;
                
            case "lost_traveler":
            case "wandering_merchant":
                if (chosenOption === "exchange") {
                    if (success) {
                        outcome.message = "The traveler shares valuable information about the region.";
                        outcome.changes.morale = 5;
                        
                        // Reveal a nearby settlement or resource location
                        if (Utils.chanceOf(50)) {
                            // Simulate discovering a settlement
                            outcome.changes.discoveries.push({
                                type: "settlement_info",
                                description: "Learned about a nearby settlement from the traveler"
                            });
                        } else {
                            // Simulate discovering a resource location
                            const resources = ["food", "wood", "stone", "metal", "herbs", "fur"];
                            const resource = resources[Utils.randomBetween(0, resources.length - 1)];
                            
                            outcome.changes.discoveries.push({
                                type: "resource_info",
                                resource: resource,
                                description: `Learned about a good source of ${resource} from the traveler`
                            });
                        }
                    } else {
                        outcome.message = "The traveler's information turns out to be unreliable or a deliberate misdirection.";
                        outcome.changes.morale = -3;
                    }
                } else if (chosenOption === "trade") {
                    if (success) {
                        outcome.message = "You make a good trade with the traveler, acquiring useful items.";
                        outcome.changes.morale = 3;
                        
                        // Gain some resources but lose some supplies
                        outcome.changes.supplies = -Math.floor(expedition.supplies * 0.05);
                        
                        const resources = ["cloth", "leather", "salt", "herbs"];
                        const resource = resources[Utils.randomBetween(0, resources.length - 1)];
                        const amount = Utils.randomBetween(3, 10);
                        
                        outcome.changes.discoveries.push({
                            type: "resource",
                            resource: resource,
                            amount: amount,
                            description: `Acquired ${amount} ${resource} through trade`
                        });
                    } else {
                        outcome.message = "The trade goes poorly, and you feel you've been cheated.";
                        outcome.changes.morale = -5;
                        outcome.changes.supplies = -Math.floor(expedition.supplies * 0.1);
                    }
                } else if (chosenOption === "join") {
                    if (success) {
                        outcome.message = "The traveler joins your party temporarily, sharing knowledge and skills.";
                        outcome.changes.morale = 8;
                        
                        // Gain improved discovery chances for next encounter
                        expedition.temporaryBenefits = { 
                            discoveryBonus: 20,
                            duration: 1
                        };
                    } else {
                        outcome.message = "The traveler declines to join you, seeming suspicious of your intentions.";
                        outcome.changes.morale = -2;
                    }
                }
                break;
                
            default:
                if (chosenOption === "investigate") {
                    if (success) {
                        outcome.message = "Your investigation reveals something interesting and potentially valuable.";
                        outcome.changes.morale = 5;
                        
                        // Generic discovery
                        if (Utils.chanceOf(50)) {
                            const resources = ["food", "wood", "stone", "metal", "herbs", "cloth"];
                            const resource = resources[Utils.randomBetween(0, resources.length - 1)];
                            const amount = Utils.randomBetween(5, 15 + Math.floor(expedition.size / 2));
                            
                            outcome.changes.discoveries.push({
                                type: "resource",
                                resource: resource,
                                amount: amount,
                                description: `Discovered ${amount} ${resource} during investigation`
                            });
                        } else {
                            outcome.changes.discoveries.push({
                                type: "treasure",
                                treasureType: "unusual_find",
                                value: Utils.randomBetween(5, 20),
                                description: "An unusual item of some value"
                            });
                        }
                    } else {
                        outcome.message = "Your investigation reveals nothing of value and wastes time.";
                        outcome.changes.morale = -3;
                        outcome.changes.supplies = -Math.floor(expedition.size * 0.2); // Extra supplies consumed due to delay
                    }
                } else if (chosenOption === "observe") {
                    if (success) {
                        outcome.message = "Observing carefully provides useful information without risk.";
                        outcome.changes.morale = 3;
                    } else {
                        outcome.message = "Your observation reveals nothing of interest.";
                        outcome.changes.morale = -1;
                    }
                } else if (chosenOption === "avoid") {
                    if (success) {
                        outcome.message = "You successfully avoid the unusual phenomenon without incident.";
                        outcome.changes.morale = 2;
                    } else {
                        outcome.message = "Attempting to avoid the area leads you through difficult terrain, slowing progress.";
                        outcome.changes.morale = -2;
                        outcome.changes.supplies = -Math.floor(expedition.size * 0.1); // Extra supplies consumed due to detour
                    }
                }
        }
        
        return outcome;
    }
    
    /**
     * Process and apply encounter outcome to expedition
     * @param {Object} expedition - Expedition object
     * @param {Object} outcome - Encounter outcome
     * @returns {Object} - Updated expedition
     */
    function applyEncounterOutcome(expedition, outcome) {
        if (!outcome) return expedition;
        
        // Apply morale changes
        expedition.morale = Math.max(10, Math.min(100, expedition.morale + outcome.changes.morale));
        
        // Apply casualties
        if (outcome.changes.casualties > 0) {
            expedition.casualtiesSuffered += outcome.changes.casualties;
            expedition.size -= outcome.changes.casualties;
            
            // Ensure size doesn't go below 1
            expedition.size = Math.max(1, expedition.size);
        }
        
        // Apply supply changes
        if (outcome.changes.supplies !== 0) {
            expedition.supplies = Math.max(0, expedition.supplies + outcome.changes.supplies);
        }
        
        // Add discoveries
        if (outcome.changes.discoveries && outcome.changes.discoveries.length > 0) {
            expedition.discoveries = expedition.discoveries.concat(outcome.changes.discoveries);
            
            // Track treasure discoveries
            const treasures = outcome.changes.discoveries.filter(d => d.type === "treasure");
            expedition.treasuresFound += treasures.length;
        }
        
        // Increment encounters resolved
        expedition.encountersResolved++;
        
        return expedition;
    }
    
    /**
     * Create exploration UI
     */
    function createExplorationUI() {
        // Check if exploration panel already exists
        if (document.getElementById('explore-panel')) {
            return;
        }
        
        console.log("Creating exploration panel");
        
        // Create exploration panel
        const explorePanel = document.createElement('div');
        explorePanel.id = 'explore-panel';
        explorePanel.className = 'explore-panel hidden-panel';
        
        explorePanel.innerHTML = `
            <h2>Exploration</h2>
            <div class="explore-content">
                <div class="active-expeditions-section">
                    <h3>Active Expeditions</h3>
                    <div id="active-expeditions-list" class="active-expeditions-list">
                        <p class="no-expeditions-message">No active expeditions. Organize a new expedition to explore the world.</p>
                    </div>
                </div>
                
                <div class="expedition-form-section">
                    <h3>Organize Expedition</h3>
                    <div class="expedition-form">
                        <div class="form-group">
                            <label for="expedition-type">Expedition Type:</label>
                            <select id="expedition-type">
                                <option value="adventurer_band">Adventurer Band (2-5 warriors)</option>
                                <option value="raider_warband">Raider Warband (6-20 warriors)</option>
                                <option value="army">Army (21+ warriors)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="expedition-size">Party Size:</label>
                            <input type="number" id="expedition-size" min="2" value="5">
                            <div class="size-range" id="size-range">2-5 warriors</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="expedition-duration">Duration (days):</label>
                            <input type="number" id="expedition-duration" min="1" max="30" value="5">
                        </div>
                        
                        <div class="form-group">
                            <label for="expedition-supplies">Supplies Needed:</label>
                            <div id="expedition-supplies-needed">25 food</div>
                        </div>
                        
                        <div class="form-group" id="expedition-direction-group">
                            <label>Exploration Direction:</label>
                            <div class="direction-buttons">
                                <button id="direction-north" class="direction-btn">North</button>
                                <button id="direction-east" class="direction-btn">East</button>
                                <button id="direction-south" class="direction-btn">South</button>
                                <button id="direction-west" class="direction-btn">West</button>
                            </div>
                        </div>
                        
                        <div class="expedition-info" id="expedition-info">
                            Select an expedition type and size to see details.
                        </div>
                        
                        <button id="start-expedition" class="start-expedition-btn">Organize Expedition</button>
                    </div>
                </div>
                
                <div class="expedition-details-section" id="expedition-details-section" style="display: none;">
                    <h3>Expedition Details</h3>
                    <div id="expedition-details-content"></div>
                    <button id="back-to-expeditions" class="back-btn">Back to Expeditions</button>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(explorePanel);
            
            // Add event listeners
            document.getElementById('expedition-type').addEventListener('change', updateExpeditionForm);
            document.getElementById('expedition-size').addEventListener('input', updateExpeditionForm);
            document.getElementById('expedition-duration').addEventListener('input', updateExpeditionForm);
            document.getElementById('start-expedition').addEventListener('click', startExpedition);
            document.getElementById('back-to-expeditions').addEventListener('click', () => {
                document.getElementById('expedition-details-section').style.display = 'none';
                document.querySelector('.active-expeditions-section').style.display = 'block';
                document.querySelector('.expedition-form-section').style.display = 'block';
            });
            
            // Direction buttons
            const directionButtons = document.querySelectorAll('.direction-btn');
            directionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    directionButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                });
            });
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('explore-panel', 'world');
            }
            
            // Add CSS styles
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .explore-panel {
                    background-color: #f7f0e3;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .explore-panel h2 {
                    color: #5d4037;
                    border-bottom: 2px solid #a99275;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                
                .explore-panel h3 {
                    color: #5d4037;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                
                .active-expeditions-list {
                    margin-bottom: 20px;
                }
                
                .expedition-card {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-left: 4px solid #8b5d33;
                    border-radius: 4px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .expedition-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .expedition-title {
                    font-weight: bold;
                    font-size: 1.1em;
                    color: #5d4037;
                }
                
                .expedition-status {
                    font-size: 0.9em;
                    padding: 2px 8px;
                    border-radius: 10px;
                    background-color: #f0f0f0;
                }
                
                .status-preparing { background-color: #fff9c4; }
                .status-exploring { background-color: #c8e6c9; }
                .status-returning { background-color: #bbdefb; }
                .status-completed { background-color: #d7ccc8; }
                .status-failed { background-color: #ffcdd2; }
                
                .expedition-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 10px;
                    font-size: 0.9em;
                }
                
                .expedition-progress {
                    margin-top: 10px;
                }
                
                .progress-bar-container {
                    height: 10px;
                    background-color: #e0e0e0;
                    border-radius: 5px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background-color: #8b5d33;
                    width: 0%;
                }
                
                .expedition-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .expedition-form {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #5d4037;
                }
                
                .form-group select,
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                }
                
                .size-range {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 5px;
                }
                
                .direction-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                
                .direction-btn {
                    padding: 8px;
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .direction-btn.active {
                    background-color: #8b5d33;
                    color: white;
                    border-color: #5d4037;
                }
                
                .expedition-info {
                    background-color: #f9f9f9;
                    padding: 10px;
                    border-radius: 4px;
                    margin: 15px 0;
                }
                
                .start-expedition-btn {
                    background-color: #8b5d33;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .start-expedition-btn:hover {
                    background-color: #6d4c2a;
                }
                
                .start-expedition-btn:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                
                .back-btn {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 8px 15px;
                    cursor: pointer;
                    margin-top: 15px;
                }
                
                .expedition-details-content {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .expedition-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .metric-card {
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    padding: 10px;
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #5d4037;
                }
                
                .metric-label {
                    font-size: 0.9em;
                    color: #777;
                }
                
                .discovery-list {
                    margin-top: 15px;
                }
                
                .discovery-item {
                    background-color: #f9f9f9;
                    border-left: 3px solid #8b5d33;
                    padding: 10px;
                    margin-bottom: 8px;
                }
                
                .no-expeditions-message {
                    font-style: italic;
                    color: #777;
                }
                
                @media (max-width: 768px) {
                    .expedition-info {
                        grid-template-columns: 1fr;
                    }
                    
                    .expedition-metrics {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            
            document.head.appendChild(styleElement);
            
            // Initialize form
            updateExpeditionForm();
        }
    }
    
    /**
     * Update the expedition form based on selected options
     */
    function updateExpeditionForm() {
        const typeSelect = document.getElementById('expedition-type');
        const sizeInput = document.getElementById('expedition-size');
        const durationInput = document.getElementById('expedition-duration');
        const sizeRangeDisplay = document.getElementById('size-range');
        const suppliesNeededDisplay = document.getElementById('expedition-supplies-needed');
        const expeditionInfoDisplay = document.getElementById('expedition-info');
        const startButton = document.getElementById('start-expedition');
        
        // Get selected party type
        const selectedType = typeSelect.value;
        const partyType = partyTypes[selectedType];
        
        if (!partyType) return;
        
        // Update size range display
        sizeRangeDisplay.textContent = `${partyType.minSize}-${partyType.maxSize} warriors`;
        
        // Enforce min/max size for the selected party type
        sizeInput.min = partyType.minSize;
        sizeInput.max = partyType.maxSize;
        
        // Adjust size if out of range
        let size = parseInt(sizeInput.value);
        if (size < partyType.minSize) {
            sizeInput.value = partyType.minSize;
            size = partyType.minSize;
        } else if (size > partyType.maxSize) {
            sizeInput.value = partyType.maxSize;
            size = partyType.maxSize;
        }
        
        // Calculate supplies needed
        const duration = parseInt(durationInput.value);
        const suppliesNeeded = calculateSupplyConsumption({ size, partyType: selectedType }, duration);
        suppliesNeededDisplay.textContent = `${Math.ceil(suppliesNeeded)} food`;
        
        // Check if expedition can be created
        const expeditionCheck = canCreateExpedition(selectedType, size, duration);
        
        // Update expedition info
        expeditionInfoDisplay.innerHTML = `
            <div><strong>Type:</strong> ${partyType.name}</div>
            <div><strong>Description:</strong> ${partyType.description}</div>
            <div><strong>Speed:</strong> ${partyType.speedModifier.toFixed(1)}x</div>
            <div><strong>Stealth:</strong> ${partyType.stealthModifier.toFixed(1)}x</div>
            <div><strong>Combat:</strong> ${partyType.combatStrength.toFixed(1)}x</div>
            <div><strong>Supply Use:</strong> ${partyType.supplyConsumption.toFixed(1)}x</div>
            ${partyType.requiredLeader ? '<div><strong>Note:</strong> Requires a leader</div>' : ''}
        `;
        
        // Enable/disable start button
        startButton.disabled = !expeditionCheck.canCreate;
        
        if (!expeditionCheck.canCreate) {
            expeditionInfoDisplay.innerHTML += `
                <div class="expedition-warning">${expeditionCheck.reason}</div>
            `;
        }
    }
    
    /**
     * Start a new expedition
     */
    function startExpedition() {
        // Get form values
        const typeSelect = document.getElementById('expedition-type');
        const sizeInput = document.getElementById('expedition-size');
        const durationInput = document.getElementById('expedition-duration');
        
        const partyType = typeSelect.value;
        const size = parseInt(sizeInput.value);
        const duration = parseInt(durationInput.value);
        
        // Get selected direction
        const directionBtns = document.querySelectorAll('.direction-btn');
        let selectedDirection = null;
        
        directionBtns.forEach(btn => {
            if (btn.classList.contains('active')) {
                selectedDirection = btn.id.replace('direction-', '');
            }
        });
        
        if (!selectedDirection) {
            // Default to a random direction if none selected
            const directions = ['north', 'east', 'south', 'west'];
            selectedDirection = directions[Utils.randomBetween(0, 3)];
            
            // Mark the button as active
            document.getElementById(`direction-${selectedDirection}`).classList.add('active');
        }
        
        // Check if expedition can be created
        const expeditionCheck = canCreateExpedition(partyType, size, duration);
        
        if (!expeditionCheck.canCreate) {
            Utils.log(expeditionCheck.reason, "important");
            return;
        }
        
        // Calculate supplies
        const suppliesNeeded = calculateSupplyConsumption({ size, partyType }, duration);
        
        // Subtract resources
        const resourcesUsed = {
            food: suppliesNeeded
        };
        
        const resourcesSubtracted = ResourceManager.subtractResources(resourcesUsed);
        
        if (!resourcesSubtracted) {
            Utils.log("Failed to allocate resources for expedition.", "important");
            return;
        }
        
        // Get current game date
        const gameDate = GameEngine.getGameState().date;
        
        // Get leader if required
        let leader = null;
        if (partyTypes[partyType].requiredLeader) {
            leader = PopulationManager.getDynastyLeader();
        }
        
        // Create expedition
        const expedition = Object.assign({}, expeditionTemplate, {
            id: generateExpeditionId(),
            name: generateExpeditionName(partyType, selectedDirection),
            partyType: partyType,
            size: size,
            leader: leader,
            supplies: suppliesNeeded,
            startDate: { ...gameDate },
            daysRemaining: duration,
            status: "preparing",
            direction: selectedDirection
        });
        
        // Find target region based on direction
        const playerSettlement = WorldMap.getPlayerSettlement();
        const playerRegion = WorldMap.getPlayerRegion();
        
        if (playerSettlement && playerRegion) {
            expedition.currentPosition = { ...playerSettlement.position };
            
            // Choose a target region in the selected direction
            const nearbyRegions = WorldMap.getRegionsByLandmass(playerRegion.landmass);
            
            // Filter regions in the chosen direction
            const regionsInDirection = nearbyRegions.filter(region => {
                if (!region.position) return false;
                
                const dx = region.position.x - playerSettlement.position.x;
                const dy = region.position.y - playerSettlement.position.y;
                
                switch (selectedDirection) {
                    case 'north': return dy < 0 && Math.abs(dy) > Math.abs(dx);
                    case 'east': return dx > 0 && Math.abs(dx) > Math.abs(dy);
                    case 'south': return dy > 0 && Math.abs(dy) > Math.abs(dx);
                    case 'west': return dx < 0 && Math.abs(dx) > Math.abs(dy);
                    default: return false;
                }
            });
            
            if (regionsInDirection.length > 0) {
                // Choose the closest region in that direction
                let targetRegion = regionsInDirection[0];
                let minDistance = Number.MAX_VALUE;
                
                regionsInDirection.forEach(region => {
                    const dx = region.position.x - playerSettlement.position.x;
                    const dy = region.position.y - playerSettlement.position.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        targetRegion = region;
                    }
                });
                
                expedition.targetRegion = targetRegion.id;
            } else {
                // If no regions in that direction, choose a random nearby region
                if (nearbyRegions.length > 0) {
                    const randomRegion = nearbyRegions[Utils.randomBetween(0, nearbyRegions.length - 1)];
                    expedition.targetRegion = randomRegion.id;
                }
            }
        }
        
        // Update status to exploring
        expedition.status = "exploring";
        
        // Add to active expeditions
        activeExpeditions.push(expedition);
        
        // Remove warriors from available pool
        // In a real implementation, this would be handled by a call to PopulationManager or BuildingSystem
        // For demonstration, we'll assume the warriors are taken from BuildingSystem
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.assignWarriors === 'function') {
            BuildingSystem.assignWarriors(expedition.size);
        }
        
        // Log expedition start
        Utils.log(`A ${partyType.replace('_', ' ')} of ${size} warriors has departed to explore to the ${selectedDirection}.`, "success");
        
        // Update UI
        updateExpeditionsList();
        
        // Reset form
        resetExpeditionForm();
    }
    
    /**
     * Generate a name for an expedition
     * @param {string} partyType - Type of party
     * @param {string} direction - Direction of travel
     * @returns {string} - Generated name
     */
    function generateExpeditionName(partyType, direction) {
        const typeAdjectives = {
            adventurer_band: ["Bold", "Swift", "Curious", "Venturing", "Intrepid"],
            raider_warband: ["Fierce", "Mighty", "Valiant", "Battle-ready", "Thundering"],
            army: ["Conquering", "Glorious", "Imposing", "Unstoppable", "Formidable"]
        };
        
        const directionAdjectives = {
            north: ["Northern", "Frostbound", "Northward", "Arctic", "Boreal"],
            east: ["Eastern", "Sunrise", "Eastward", "Dawn", "Morning"],
            south: ["Southern", "Sunward", "Southbound", "Warm", "Midday"],
            west: ["Western", "Sunset", "Westward", "Dusk", "Evening"]
        };
        
        const nouns = ["Expedition", "Journey", "Quest", "Venture", "Voyage"];
        
        const typeAdj = typeAdjectives[partyType][Utils.randomBetween(0, 4)];
        const dirAdj = directionAdjectives[direction][Utils.randomBetween(0, 4)];
        const noun = nouns[Utils.randomBetween(0, 4)];
        
        return `The ${typeAdj} ${dirAdj} ${noun}`;
    }
    
    /**
     * Reset the expedition form
     */
    function resetExpeditionForm() {
        // Reset inputs to defaults
        document.getElementById('expedition-type').value = 'adventurer_band';
        document.getElementById('expedition-size').value = '5';
        document.getElementById('expedition-duration').value = '5';
        
        // Remove active class from direction buttons
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update form displays
        updateExpeditionForm();
    }
    
    /**
     * Update the active expeditions list
     */
    function updateExpeditionsList() {
        const expeditionsList = document.getElementById('active-expeditions-list');
        if (!expeditionsList) return;
        
        if (activeExpeditions.length === 0) {
            expeditionsList.innerHTML = `
                <p class="no-expeditions-message">No active expeditions. Organize a new expedition to explore the world.</p>
            `;
            return;
        }
        
        let html = '';
        
        activeExpeditions.forEach(expedition => {
            // Calculate progress percentage
            let progressPercent = 0;
            if (expedition.status === "exploring") {
                const totalDuration = expedition.startDate ? 
                    (expedition.daysRemaining + (GameEngine.getGameState().date.day - expedition.startDate.day)) : 0;
                    
                progressPercent = totalDuration > 0 ? 
                    Math.min(100, Math.max(0, 100 - (expedition.daysRemaining / totalDuration) * 100)) : 0;
            } else if (expedition.status === "returning") {
                progressPercent = 100 - (expedition.daysRemaining / expedition.returnDuration) * 100;
            } else if (expedition.status === "completed" || expedition.status === "failed") {
                progressPercent = 100;
            }
            
            // Get region name
            let regionName = "Unknown Region";
            if (expedition.targetRegion) {
                const region = WorldMap.getRegion(expedition.targetRegion);
                if (region) {
                    regionName = region.name;
                }
            }
            
            html += `
                <div class="expedition-card">
                    <div class="expedition-header">
                        <div class="expedition-title">${expedition.name}</div>
                        <div class="expedition-status status-${expedition.status}">${expedition.status.charAt(0).toUpperCase() + expedition.status.slice(1)}</div>
                    </div>
                    <div class="expedition-info">
                        <div><strong>Size:</strong> ${expedition.size} warriors</div>
                        <div><strong>Type:</strong> ${partyTypes[expedition.partyType].name}</div>
                        <div><strong>Target:</strong> ${regionName}</div>
                        <div><strong>Supplies:</strong> ${Math.ceil(expedition.supplies)}</div>
                        <div><strong>Days Left:</strong> ${expedition.daysRemaining}</div>
                        <div><strong>Morale:</strong> ${expedition.morale}%</div>
                    </div>
                    <div class="expedition-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="expedition-actions">
                        <button class="expedition-details-btn" data-expedition-id="${expedition.id}">Details</button>
                        ${expedition.status === "completed" || expedition.status === "failed" ? 
                            `<button class="expedition-dismiss-btn" data-expedition-id="${expedition.id}">Dismiss</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        expeditionsList.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.expedition-details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const expeditionId = this.dataset.expeditionId;
                showExpeditionDetails(expeditionId);
            });
        });
        
        document.querySelectorAll('.expedition-dismiss-btn').forEach(button => {
            button.addEventListener('click', function() {
                const expeditionId = this.dataset.expeditionId;
                dismissExpedition(expeditionId);
            });
        });
    }
    
    /**
     * Show detailed information about an expedition
     * @param {string} expeditionId - ID of the expedition
     */
    function showExpeditionDetails(expeditionId) {
        const expedition = activeExpeditions.find(exp => exp.id === expeditionId);
        if (!expedition) return;
        
        // Hide expedition list and form, show details section
        document.querySelector('.active-expeditions-section').style.display = 'none';
        document.querySelector('.expedition-form-section').style.display = 'none';
        document.getElementById('expedition-details-section').style.display = 'block';
        
        // Get region name
        let regionName = "Unknown Region";
        let regionType = "";
        if (expedition.targetRegion) {
            const region = WorldMap.getRegion(expedition.targetRegion);
            if (region) {
                regionName = region.name;
                regionType = region.typeName || "";
            }
        }
        
        let statusClass = `status-${expedition.status}`;
        let statusText = expedition.status.charAt(0).toUpperCase() + expedition.status.slice(1);
        
        // Build HTML
        let html = `
            <div class="expedition-details-content">
                <div class="expedition-header">
                    <h2>${expedition.name}</h2>
                    <div class="expedition-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="expedition-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${expedition.size}</div>
                        <div class="metric-label">Warriors</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${expedition.encountersResolved}</div>
                        <div class="metric-label">Encounters</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${expedition.treasuresFound}</div>
                        <div class="metric-label">Treasures</div>
                    </div>
                </div>
                
                <div class="expedition-summary">
                    <h3>Expedition Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item"><strong>Type:</strong> ${partyTypes[expedition.partyType].name}</div>
                        <div class="summary-item"><strong>Target Region:</strong> ${regionName} (${regionType})</div>
                        <div class="summary-item"><strong>Started:</strong> Year ${expedition.startDate?.year}, Day ${expedition.startDate?.day}</div>
                        <div class="summary-item"><strong>Morale:</strong> ${expedition.morale}%</div>
                        <div class="summary-item"><strong>Supplies:</strong> ${Math.ceil(expedition.supplies)}</div>
                        <div class="summary-item"><strong>Days Remaining:</strong> ${expedition.daysRemaining}</div>
                        <div class="summary-item"><strong>Casualties:</strong> ${expedition.casualtiesSuffered}</div>
                        <div class="summary-item"><strong>Direction:</strong> ${expedition.direction || "Unknown"}</div>
                    </div>
                </div>
        `;
        
        // Add discoveries if any
        if (expedition.discoveries && expedition.discoveries.length > 0) {
            html += `
                <div class="discovery-section">
                    <h3>Discoveries</h3>
                    <div class="discovery-list">
            `;
            
            expedition.discoveries.forEach(discovery => {
                // Create colored icon based on discovery type
                let iconHtml = '';
                let discoveryClass = '';
                
                if (discovery.type === "resource") {
                    iconHtml = '📦';
                    discoveryClass = 'resource-discovery';
                } else if (discovery.type === "settlement") {
                    iconHtml = '🏠';
                    discoveryClass = 'settlement-discovery';
                } else if (discovery.type === "treasure") {
                    iconHtml = '💰';
                    discoveryClass = 'treasure-discovery';
                } else {
                    iconHtml = '🔍';
                    discoveryClass = 'info-discovery';
                }
                
                html += `
                    <div class="discovery-item ${discoveryClass}">
                        <div class="discovery-icon">${iconHtml}</div>
                        <div class="discovery-text">${discovery.description}</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="discovery-section">
                    <h3>Discoveries</h3>
                    <p>No discoveries have been made yet.</p>
                </div>
            `;
        }
        
        // Add leader info if expedition has a leader
        if (expedition.leader) {
            html += `
                <div class="leader-section">
                    <h3>Expedition Leader</h3>
                    <div class="leader-card">
                        <div class="leader-name">${expedition.leader.name}</div>
                        <div class="leader-details">
                            <div><strong>Age:</strong> ${Math.floor(expedition.leader.age)}</div>
                            <div><strong>Combat:</strong> ${expedition.leader.skills?.combat || 0}</div>
                            <div><strong>Leadership:</strong> ${expedition.leader.skills?.leadership || 0}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        
        // Update details content
        document.getElementById('expedition-details-content').innerHTML = html;
    }
    
    /**
     * Dismiss an expedition from the list
     * @param {string} expeditionId - ID of the expedition
     */
    function dismissExpedition(expeditionId) {
        const expeditionIndex = activeExpeditions.findIndex(exp => exp.id === expeditionId);
        if (expeditionIndex === -1) return;
        
        // Only completed or failed expeditions can be dismissed
        const expedition = activeExpeditions[expeditionIndex];
        if (expedition.status !== "completed" && expedition.status !== "failed") {
            Utils.log("Cannot dismiss an active expedition.", "important");
            return;
        }
        
        // Remove from active expeditions
        activeExpeditions.splice(expeditionIndex, 1);
        
        // Update UI
        updateExpeditionsList();
        
        // Log dismissal
        Utils.log(`The ${expedition.name} expedition has been disbanded.`);
    }
    
    // Public API
    return {
        /**
         * Initialize the explore manager
         */
        init: function() {
            console.log("Initializing Explore Manager...");
            
            // Create UI
            createExplorationUI();
            
            // Register world action button
            const exploreButton = document.getElementById('btn-explore');
            if (exploreButton) {
                exploreButton.disabled = false;
                exploreButton.addEventListener('click', () => {
                    NavigationSystem.registerPanel('explore-panel', 'world');
                    NavigationSystem.switchToTab('world');
                });
            }
            
            console.log("Explore Manager initialized");
        },
        
        /**
         * Process active expeditions for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Skip if no active expeditions or tick size is 0
            if (activeExpeditions.length === 0 || tickSize <= 0) return;
            
            // Keep track of expeditions that need UI updates
            let uiNeedsUpdate = false;
            
            // Process each expedition
            for (let i = activeExpeditions.length - 1; i >= 0; i--) {
                const expedition = activeExpeditions[i];
                
                // Skip completed or failed expeditions
                if (expedition.status === "completed" || expedition.status === "failed") {
                    continue;
                }
                
                // Update days remaining
                expedition.daysRemaining -= tickSize;
                
                // Consume supplies
                const dailyConsumption = calculateSupplyConsumption(expedition, tickSize);
                expedition.supplies -= dailyConsumption;
                
                // Check for supply depletion
                if (expedition.supplies <= 0) {
                    // Supplies have run out - morale drops dramatically
                    expedition.morale = Math.max(10, expedition.morale - 15 * tickSize);
                    
                    // Chance of casualties from starvation
                    if (Utils.chanceOf(5 * tickSize)) {
                        const casualties = Math.max(1, Math.ceil(expedition.size * 0.05));
                        expedition.size -= casualties;
                        expedition.casualtiesSuffered += casualties;
                        
                        // Log starvation
                        Utils.log(`The ${expedition.name} expedition is suffering from starvation. ${casualties} warriors have died.`, "danger");
                    }
                    
                    // If expedition is reduced to zero, it fails
                    if (expedition.size <= 0) {
                        expedition.status = "failed";
                        expedition.daysRemaining = 0;
                        
                        // Log failure
                        Utils.log(`The ${expedition.name} expedition has been lost. No survivors have returned.`, "danger");
                        
                        uiNeedsUpdate = true;
                        continue;
                    }
                } else {
                    // Normal morale adjustments
                    // Small chance of morale boost or decrease
                    if (Utils.chanceOf(5 * tickSize)) {
                        const moraleChange = Utils.randomBetween(-5, 5);
                        expedition.morale = Math.max(10, Math.min(100, expedition.morale + moraleChange));
                    }
                }
                
                // Check if expedition is complete
                if (expedition.daysRemaining <= 0) {
                    // If exploring, switch to returning
                    if (expedition.status === "exploring") {
                        // Process any final discoveries
                        if (expedition.targetRegion) {
                            const region = WorldMap.getRegion(expedition.targetRegion);
                            if (region) {
                                const discoveries = processDiscoveries(expedition, region);
                                expedition.discoveries = expedition.discoveries.concat(discoveries);
                                
                                // Track treasure discoveries
                                const treasures = discoveries.filter(d => d.type === "treasure");
                                expedition.treasuresFound += treasures.length;
                            }
                        }
                        
                        // Set returning duration based on party speed
                        const partyType = partyTypes[expedition.partyType];
                        const baseReturnDays = 5; // Base days to return
                        expedition.returnDuration = baseReturnDays / (partyType?.speedModifier || 1);
                        expedition.daysRemaining = expedition.returnDuration;
                        expedition.status = "returning";
                        
                        // Log status change
                        Utils.log(`The ${expedition.name} expedition has completed its exploration and is returning home.`, "success");
                    }
                    // If returning, mark as completed
                    else if (expedition.status === "returning") {
                        expedition.status = "completed";
                        
                        // Process expedition results
                        processExpeditionResults(expedition);
                        
                        // Return warriors to the available pool
                        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.returnWarriors === 'function') {
                            BuildingSystem.returnWarriors(expedition.size);
                        }
                        
                        // Log completion
                        Utils.log(`The ${expedition.name} expedition has returned with their discoveries.`, "success");
                    }
                    
                    uiNeedsUpdate = true;
                    continue;
                }
                
                // Process encounters for exploring expeditions
                if (expedition.status === "exploring") {
                    // Get target region
                    const region = expedition.targetRegion ? WorldMap.getRegion(expedition.targetRegion) : null;
                    
                    if (region) {
                        // Process potential discoveries
                        if (Utils.chanceOf(10 * tickSize)) {
                            const discoveries = processDiscoveries(expedition, region);
                            if (discoveries.length > 0) {
                                expedition.discoveries = expedition.discoveries.concat(discoveries);
                                
                                // Track treasure discoveries
                                const treasures = discoveries.filter(d => d.type === "treasure");
                                expedition.treasuresFound += treasures.length;
                                
                                // Log significant discoveries
                                if (discoveries.length > 0) {
                                    const significantDiscovery = discoveries[0];
                                    Utils.log(`The ${expedition.name} expedition reports: ${significantDiscovery.description}.`, "success");
                                }
                                
                                uiNeedsUpdate = true;
                            }
                        }
                        
                        // Process potential encounters
                        if (Utils.chanceOf(5 * tickSize)) {
                            const encounter = processEncounter(expedition, region);
                            
                            if (encounter) {
                                // Create an event for the player to resolve
                                EventManager.addEvent({
                                    id: `expedition_encounter_${Date.now()}`,
                                    title: encounter.title,
                                    description: `The ${expedition.name} expedition reports: ${encounter.description}`,
                                    options: encounter.options.map(option => ({
                                        text: option.text,
                                        effects: (gameState) => {
                                            const outcome = handleEncounterOutcome(encounter, option.outcome, expedition);
                                            
                                            // Apply outcome to expedition
                                            activeExpeditions[i] = applyEncounterOutcome(expedition, outcome);
                                            
                                            // Log outcome
                                            Utils.log(outcome.message, outcome.success ? "success" : "important");
                                            
                                            // Process any resource discoveries immediately
                                            if (outcome.changes.discoveries) {
                                                outcome.changes.discoveries.forEach(discovery => {
                                                    if (discovery.type === "resource" && discovery.resource && discovery.amount) {
                                                        const resources = {};
                                                        resources[discovery.resource] = discovery.amount;
                                                        ResourceManager.addResources(resources);
                                                    }
                                                });
                                            }
                                            
                                            // Update UI
                                            updateExpeditionsList();
                                        }
                                    })),
                                    importance: 'moderate' // For fame calculation
                                });
                                
                                uiNeedsUpdate = true;
                            }
                        }
                    }
                }
                
                // Morale-based effects for returning expeditions
                if (expedition.status === "returning") {
                    // Low morale expeditions might suffer desertions
                    if (expedition.morale < 30 && Utils.chanceOf(2 * tickSize)) {
                        const deserters = Math.max(1, Math.floor(expedition.size * 0.05));
                        expedition.size -= deserters;
                        
                        // Log desertion
                        Utils.log(`${deserters} warriors have deserted from the ${expedition.name} expedition due to low morale.`, "important");
                        
                        uiNeedsUpdate = true;
                    }
                }
                
                // Update status in UI if needed
                if (uiNeedsUpdate) {
                    updateExpeditionsList();
                }
            }
        },
        
        /**
         * Process the results of a completed expedition
         * @param {Object} expedition - Completed expedition
         */
        processExpeditionResults: function(expedition) {
            processExpeditionResults(expedition);
        },
        
        /**
         * Get active expeditions
         * @returns {Array} - Array of active expeditions
         */
        getActiveExpeditions: function() {
            return [...activeExpeditions];
        },
        
        /**
         * Get party types
         * @returns {Object} - Object containing party type definitions
         */
        getPartyTypes: function() {
            return { ...partyTypes };
        },
        
        /**
         * Check if player can create an expedition
         * @param {string} partyTypeId - Type of party to check
         * @param {number} size - Size of the party
         * @param {number} duration - Duration in days
         * @returns {Object} - Object with canCreate flag and reason if not
         */
        canCreateExpedition: canCreateExpedition,
        
        /**
         * Update the expeditions UI
         */
        updateUI: function() {
            updateExpeditionsList();
        }
    };
})();

// Process expedition results when completed
function processExpeditionResults(expedition) {
    if (!expedition || expedition.status !== "completed") return;
    
    // Log completion
    Utils.log(`The ${expedition.name} expedition has returned.`, "success");
    
    // Award fame based on discoveries
    if (typeof RankManager !== 'undefined' && typeof RankManager.addFame === 'function') {
        // Base fame for completing an expedition
        let baseFame = 5;
        
        // Additional fame based on expedition type and size
        switch (expedition.partyType) {
            case "adventurer_band":
                baseFame += 2;
                break;
            case "raider_warband":
                baseFame += 5;
                break;
            case "army":
                baseFame += 10;
                break;
        }
        
        // Fame from discoveries
        let discoveryFame = 0;
        if (expedition.discoveries && expedition.discoveries.length > 0) {
            // Resource discoveries
            const resourceDiscoveries = expedition.discoveries.filter(d => d.type === "resource");
            discoveryFame += resourceDiscoveries.length * 1;
            
            // Settlement discoveries
            const settlementDiscoveries = expedition.discoveries.filter(d => d.type === "settlement");
            discoveryFame += settlementDiscoveries.length * 5;
            
            // Treasure discoveries
            const treasureDiscoveries = expedition.discoveries.filter(d => d.type === "treasure");
            discoveryFame += treasureDiscoveries.length * 3;
        }
        
        // Fame from encounters
        const encounterFame = expedition.encountersResolved * 2;
        
        // Total fame
        const totalFame = baseFame + discoveryFame + encounterFame;
        
        // Add fame with reason
        RankManager.addFame(totalFame, `Successful ${expedition.name} expedition`);
    }
    
    // Process resource discoveries
    if (expedition.discoveries && expedition.discoveries.length > 0) {
        const resourceDiscoveries = expedition.discoveries.filter(d => d.type === "resource");
        
        if (resourceDiscoveries.length > 0 && typeof ResourceManager !== 'undefined') {
            // Group resources by type
            const resources = {};
            
            resourceDiscoveries.forEach(discovery => {
                if (!resources[discovery.resource]) {
                    resources[discovery.resource] = 0;
                }
                resources[discovery.resource] += discovery.amount;
            });
            
            // Add resources
            ResourceManager.addResources(resources);
            
            // Log resource acquisition
            const resourceTypes = Object.keys(resources);
            if (resourceTypes.length > 0) {
                const resourceString = resourceTypes.map(type => 
                    `${Math.floor(resources[type])} ${type}`
                ).join(", ");
                
                Utils.log(`The ${expedition.name} expedition brought back: ${resourceString}.`, "success");
            }
        }
    }
    
    // Process settlement discoveries
    if (expedition.discoveries && expedition.discoveries.length > 0) {
        const settlementDiscoveries = expedition.discoveries.filter(d => d.type === "settlement");
        
        if (settlementDiscoveries.length > 0) {
            // In a full implementation, this would update the world map
            // and mark settlements as discovered
            
            // Log settlement discoveries
            settlementDiscoveries.forEach(discovery => {
                Utils.log(`The ${expedition.name} expedition discovered ${discovery.name}, a ${discovery.faction} settlement.`, "success");
            });
        }
    }
    
    // Check for significant treasure
    if (expedition.treasuresFound > 0) {
        // In a full implementation, unique treasures might have special effects
        // For now, just convert treasures to silver
        
        let totalValue = 0;
        const treasureDiscoveries = expedition.discoveries.filter(d => d.type === "treasure");
        
        treasureDiscoveries.forEach(treasure => {
            totalValue += treasure.value || 0;
        });
        
        if (totalValue > 0 && typeof ResourceManager !== 'undefined') {
            // Add silver
            ResourceManager.addResources({ silver: totalValue });
            
            // Log treasure acquisition
            Utils.log(`The ${expedition.name} expedition returned with treasures worth ${totalValue} silver.`, "success");
        }
    }
}

/**
 * Integration with GameEngine
 * Register the processTick method to be called each game tick
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when DOM is loaded
    if (typeof GameEngine !== 'undefined') {
        GameEngine.registerTickProcessor(ExploreManager.processTick);
    }
    
    // Initialize ExploreManager when game is ready
    if (typeof GameEngine !== 'undefined' && typeof GameEngine.init === 'function') {
        // Wait for GameEngine to initialize first
        const originalInit = GameEngine.init;
        GameEngine.init = function() {
            originalInit.apply(GameEngine);
            ExploreManager.init();
        };
    } else {
        // Fallback: Initialize directly
        ExploreManager.init();
    }
});
