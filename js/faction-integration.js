/**
 * Viking Legacy - Faction Integration Module
 * Integrates FactionManager functionality with existing game systems
 * Enhances AI settlements with faction-specific behaviors
 */

const FactionIntegration = (function() {
    // Track faction data
    let factionData = {
        factions: [],        // All factions including kingdoms and minor realms
        kingdoms: [],        // Major kingdoms (rank 5 realms)
        territories: [],     // Controlled regions
        rulers: [],          // All rulers
        relations: {},       // Diplomatic relations
        vassalage: {},       // Tracks liege-vassal relationships
        specialLocations: [] // For future expansion
    };
    
    // Map settlement types to faction types
    const SETTLEMENT_TO_FACTION_TYPE = {
        "Viking": "NORSE",
        "Anglo": "ANGLO_SAXON",
        "Frankish": "FRANKISH"
    };
    
    // Titles for different ranks within each faction type
    const FACTION_TITLES = {
        NORSE: {
            1: "Karl", // Peasant/Free farmer
            2: "Bondi", // Independent landowner
            3: "Hersir", // Local chieftain
            4: "Jarl", // Powerful regional ruler
            5: "Konungr" // King
        },
        ANGLO_SAXON: {
            1: "Ceorl", // Commoner
            2: "Thegn", // Minor noble
            3: "Ealdorman", // Regional governor
            4: "Earl", // Powerful noble
            5: "King" // Ruler of a kingdom
        },
        FRANKISH: {
            1: "Serf", // Commoner
            2: "Knight", // Minor noble
            3: "Baron", // Local noble
            4: "Count", // Regional ruler
            5: "King" // Ruler of the realm
        }
    };
    
    // Territory name patterns
    const TERRITORY_NAME_PATTERNS = {
        NORSE: "{ruler}'s Realm",
        ANGLO_SAXON: "Kingdom of {territory}",
        FRANKISH: "Realm of {territory}"
    };
    
    // Faction behavior profiles - distinct behaviors for different factions
    const FACTION_PROFILES = {
        NORSE: {
            // Vikings: Aggressive raiders
            warriorRatio: 0.25, // 25% of population becomes warriors
            expansionChance: 0.4, // Medium chance to expand
            raidChance: 0.7, // High chance to raid
            defenseStrength: 0.8, // Lower defensive structures
            resourcePriorities: ["food", "wood", "metal"],
            buildingTypes: ["longhouse", "runestone", "longship_harbor"],
            specialLocationChance: 0.3, // Chance to spawn special locations
            kingdomCount: [2, 4], // Min/max number of kingdoms to generate
            vassalChance: 0.6, // Chance for a settlement to be a vassal rather than independent
            independenceSpirit: 0.7 // Higher values mean more fragmented realms
        },
        ANGLO_SAXON: {
            // Anglo-Saxons: Defensive realms
            warriorRatio: 0.15, // 15% of population becomes warriors
            expansionChance: 0.2, // Lower expansion rate
            raidChance: 0.1, // Low raid chance
            defenseStrength: 1.2, // Higher defensive structures
            resourcePriorities: ["food", "stone", "wood"],
            buildingTypes: ["burh", "minster", "motte_and_bailey"],
            specialLocationChance: 0.4, // Higher chance for special locations
            kingdomCount: [1, 3], // Min/max number of kingdoms to generate
            vassalChance: 0.8, // Higher chance for settlements to be vassals
            independenceSpirit: 0.4 // More centralized realms
        },
        FRANKISH: {
            // Frankish: Wealthy realms with strong central authority
            warriorRatio: 0.2, // 20% of population becomes warriors
            expansionChance: 0.3, // Medium expansion rate
            raidChance: 0.2, // Low-medium raid chance
            defenseStrength: 1.1, // High defensive structures
            resourcePriorities: ["food", "stone", "metal", "silver"],
            buildingTypes: ["stone_keep", "cathedral", "royal_mint"],
            specialLocationChance: 0.5, // High chance for special locations
            kingdomCount: [1, 2], // Min/max number of kingdoms to generate
            vassalChance: 0.9, // Very high chance for settlements to be vassals
            independenceSpirit: 0.2 // Very centralized realms
        }
    };
    
    // Special building/location definitions (for future use)
    const SPECIAL_BUILDINGS = {
        // Norse buildings
        longhouse: {
            name: "Viking Longhouse",
            description: "A large wooden hall where the chieftain holds feasts and councils.",
            lootable: true,
            lootTable: {
                food: [20, 50],
                silver: [5, 15],
                wood: [10, 20],
                fur: [5, 15],
                leather: [5, 10],
                mead: [5, 10]
            },
            defenseValue: 2,
            fameReward: 50
        },
        runestone: {
            name: "Ancient Runestone",
            description: "A stone carved with runic inscriptions commemorating great deeds.",
            lootable: false,
            specialEffect: "knowledge",
            fameReward: 75
        },
        longship_harbor: {
            name: "Longship Harbor",
            description: "A sheltered bay where Viking longships are built and maintained.",
            lootable: true,
            lootTable: {
                wood: [30, 60],
                metal: [10, 20],
                pitch: [10, 25],
                rope: [5, 15],
                whale_oil: [5, 15]
            },
            defenseValue: 3,
            fameReward: 80
        },
        
        // Anglo-Saxon buildings
        burh: {
            name: "Anglo-Saxon Burh",
            description: "A fortified settlement providing protection for the surrounding countryside.",
            lootable: true,
            lootTable: {
                food: [30, 70],
                silver: [10, 30],
                metal: [5, 15],
                cloth: [10, 20],
                leather: [5, 15],
                honey: [5, 10]
            },
            defenseValue: 5,
            fameReward: 90
        },
        minster: {
            name: "Minster Church",
            description: "A church serving as a religious center for the region.",
            lootable: true,
            lootTable: {
                silver: [20, 50],
                gold: [5, 15],
                jewels: [2, 8],
                herbs: [10, 20],
                cloth: [5, 15]
            },
            defenseValue: 2,
            fameReward: 100
        },
        motte_and_bailey: {
            name: "Motte and Bailey",
            description: "A wooden castle built on a raised earthwork with a fortified enclosure.",
            lootable: true,
            lootTable: {
                food: [20, 40],
                wood: [15, 30],
                metal: [10, 20],
                cloth: [5, 15],
                silver: [10, 20]
            },
            defenseValue: 4,
            fameReward: 85
        },
        
        // Frankish buildings
        stone_keep: {
            name: "Stone Keep",
            description: "A formidable stone fortress serving as the center of local power.",
            lootable: true,
            lootTable: {
                food: [40, 80],
                silver: [15, 40],
                metal: [10, 25],
                gold: [5, 15],
                cloth: [10, 25],
                exotic: [5, 15]
            },
            defenseValue: 6,
            fameReward: 120
        },
        cathedral: {
            name: "Cathedral",
            description: "An impressive stone church demonstrating wealth and religious devotion.",
            lootable: true,
            lootTable: {
                silver: [30, 60],
                gold: [10, 25],
                jewels: [5, 15],
                cloth: [15, 30],
                herbs: [10, 20],
                exotic: [5, 15]
            },
            defenseValue: 3,
            fameReward: 150
        },
        royal_mint: {
            name: "Royal Mint",
            description: "Where the kingdom's coins are produced and wealth is stored.",
            lootable: true,
            lootTable: {
                silver: [50, 100],
                gold: [15, 35],
                jewels: [5, 20],
                metal: [15, 30],
                exotic: [5, 15]
            },
            defenseValue: 4,
            fameReward: 130
        }
    };
    
    /**
     * Generate a complete set of resources for a region based on its type and faction
     * @param {Object} region - Region object with resource modifiers
     * @param {string} factionType - Type of faction (NORSE, ANGLO_SAXON, FRANKISH)
     * @returns {Object} - Complete resource object
     */
    function generateRegionalResources(region, factionType) {
        // Start with basic resources based on region modifiers
        const resources = {
            // Basic resources
            food: region.resourceModifiers.food * 150,
            wood: region.resourceModifiers.wood * 100,
            stone: region.resourceModifiers.stone * 80,
            metal: region.resourceModifiers.metal * 50,
            
            // Advanced resources
            leather: 0,
            fur: 0,
            cloth: 0,
            clay: 0,
            pitch: 0,
            salt: 0,
            honey: 0,
            herbs: 0,
            
            // Wealth resources
            silver: 0,
            gold: 0,
            amber: 0,
            ivory: 0,
            jewels: 0,
            
            // Environmental resources
            peat: 0,
            whale_oil: 0,
            ice: 0,
            exotic: 0
        };
        
        // Add advanced resources based on region modifiers
        // Go through all resource modifiers in the region and apply them
        for (const resource in region.resourceModifiers) {
            if (resources.hasOwnProperty(resource) && resource !== 'food' && resource !== 'wood' && resource !== 'stone' && resource !== 'metal') {
                // Base value calculation
                const modifier = region.resourceModifiers[resource];
                let baseAmount = 0;
                
                // Different base values for different resource categories
                if (['leather', 'fur', 'cloth', 'clay', 'pitch', 'salt', 'honey', 'herbs'].includes(resource)) {
                    // Advanced resources
                    baseAmount = 30;
                } else if (['silver', 'gold', 'amber', 'ivory', 'jewels'].includes(resource)) {
                    // Wealth resources - more rare
                    baseAmount = 10;
                } else if (['peat', 'whale_oil', 'ice', 'exotic'].includes(resource)) {
                    // Environmental resources
                    baseAmount = 20;
                }
                
                // Apply modifier
                resources[resource] = Math.round(baseAmount * modifier);
            }
        }
        
        // Apply faction-specific resource bonuses
        if (factionType === 'NORSE') {
            // Vikings have more hunting/raiding resources
            resources.fur *= 1.5;
            resources.leather *= 1.3;
            resources.whale_oil *= 2.0;
            resources.amber *= 1.5;
            
        } else if (factionType === 'ANGLO_SAXON') {
            // Anglo-Saxons have more agricultural and cloth production
            resources.cloth *= 1.5;
            resources.honey *= 1.3;
            resources.herbs *= 1.3;
            resources.silver *= 1.2;
            
        } else if (factionType === 'FRANKISH') {
            // Franks have more luxury and wealth resources
            resources.cloth *= 1.2;
            resources.silver *= 1.5;
            resources.gold *= 1.5;
            resources.exotic *= 1.8;
            resources.jewels *= 1.5;
        }
        
        // Add some randomness
        for (const resource in resources) {
            resources[resource] = Math.max(0, Math.round(resources[resource] * (0.8 + Math.random() * 0.4)));
        }
        
        // Ensure every resource is at least 0
        for (const resource in resources) {
            resources[resource] = Math.max(0, resources[resource]);
        }
        
        return resources;
    }
    
    /**
     * Initialize faction data from existing world data
     * @param {Object} worldData - Current world data from WorldMap
     */
    function initializeFactions(worldData) {
        console.log("Initializing faction data with political hierarchies...");
        
        // Group settlements by culture type and landmass
        const settlementsByTypeAndLandmass = {};
        
        worldData.settlements.forEach(settlement => {
            // Skip player settlement for now
            if (settlement.isPlayer) return;
            
            const factionType = SETTLEMENT_TO_FACTION_TYPE[settlement.type];
            if (!factionType) return;
            
            const landmass = worldData.landmasses.find(lm => lm.id === settlement.landmass);
            if (!landmass) return;
            
            const key = `${factionType}_${landmass.id}`;
            
            if (!settlementsByTypeAndLandmass[key]) {
                settlementsByTypeAndLandmass[key] = {
                    factionType: factionType,
                    landmassId: landmass.id,
                    landmassName: landmass.name,
                    settlements: []
                };
            }
            
            settlementsByTypeAndLandmass[key].settlements.push(settlement);
        });
        
        // For each culture group on each landmass, create kingdoms and lesser realms
        for (const key in settlementsByTypeAndLandmass) {
            const group = settlementsByTypeAndLandmass[key];
            const factionType = group.factionType;
            const profile = FACTION_PROFILES[factionType];
            
            if (!profile) continue;
            
            // Determine how many kingdoms to create for this culture on this landmass
            const minKingdoms = profile.kingdomCount[0];
            const maxKingdoms = profile.kingdomCount[1];
            const kingdomCount = Utils.randomBetween(minKingdoms, maxKingdoms);
            
            console.log(`Creating ${kingdomCount} ${factionType} kingdoms on ${group.landmassName}`);
            
            // Sort settlements by population (largest first) to find potential capitals
            const sortedSettlements = [...group.settlements].sort((a, b) => 
                (b.population || 0) - (a.population || 0)
            );
            
            // Create kingdoms
            const kingdoms = [];
            const kingdomSettlements = {};
            
            for (let i = 0; i < Math.min(kingdomCount, sortedSettlements.length); i++) {
                const capitalSettlement = sortedSettlements[i];
                
                // Create the ruler (rank 5 - King)
                const ruler = createRuler(factionType, 5, capitalSettlement);
                factionData.rulers.push(ruler);
                
                // Create the kingdom faction
                const kingdomId = `kingdom_${factionType.toLowerCase()}_${i}_${Date.now()}`;
                const kingdomName = generateKingdomName(factionType, capitalSettlement, ruler);
                
                const kingdom = {
                    id: kingdomId,
                    name: kingdomName,
                    type: factionType,
                    rank: 5, // Kingdom rank
                    rulerId: ruler.id,
                    capitalSettlementId: capitalSettlement.id,
                    territoryIds: [],
                    vassalIds: [], // For tracking vassals
                    strength: calculateFactionStrength(capitalSettlement),
                    neighbors: [],
                    isKingdom: true
                };
                
                kingdoms.push(kingdom);
                factionData.kingdoms.push(kingdom);
                factionData.factions.push(kingdom);
                
                // Update the capital settlement
                capitalSettlement.factionId = kingdomId;
                capitalSettlement.rulerId = ruler.id;
                capitalSettlement.rank = 5; // Capital of a kingdom
                capitalSettlement.title = FACTION_TITLES[factionType][5];
                
                // Initialize kingdom settlements list
                kingdomSettlements[kingdomId] = [capitalSettlement];
                
                // Update ruler with faction ID
                ruler.factionId = kingdomId;
            }
            
            // Distribute remaining settlements to kingdoms or make them independent
            const remainingSettlements = sortedSettlements.slice(kingdoms.length);
            
            remainingSettlements.forEach(settlement => {
                // Determine if this settlement should be part of a kingdom
                const vassalRoll = Math.random();
                
                if (vassalRoll < profile.vassalChance && kingdoms.length > 0) {
                    // This settlement will be a vassal of a kingdom
                    
                    // Find closest kingdom capital
                    let closestKingdom = null;
                    let shortestDistance = Infinity;
                    
                    kingdoms.forEach(kingdom => {
                        const capital = worldData.settlements.find(s => s.id === kingdom.capitalSettlementId);
                        if (!capital) return;
                        
                        // Calculate distance (simplified)
                        const distance = Math.sqrt(
                            Math.pow((settlement.position?.x || 0) - (capital.position?.x || 0), 2) +
                            Math.pow((settlement.position?.y || 0) - (capital.position?.y || 0), 2)
                        );
                        
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            closestKingdom = kingdom;
                        }
                    });
                    
                    if (closestKingdom) {
                        // Determine rank of settlement within the kingdom (1-4)
                        // Larger settlements get higher ranks
                        let settlementRank;
                        const populationSize = settlement.population || 0;
                        
                        if (populationSize >= 20) {
                            settlementRank = 4; // Earl/Count level
                        } else if (populationSize >= 12) {
                            settlementRank = 3; // Regional governor level
                        } else if (populationSize >= 5) {
                            settlementRank = 2; // Minor noble level
                        } else {
                            settlementRank = 1; // Commoner level
                        }
                        
                        // Create ruler for this settlement
                        const ruler = createRuler(factionType, settlementRank, settlement);
                        factionData.rulers.push(ruler);
                        
                        // If this is a high-ranking settlement (3-4), create a subfaction
                        if (settlementRank >= 3) {
                            const subfactionId = `faction_${factionType.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            const subfactionName = generateSubfactionName(factionType, settlement, ruler);
                            
                            const subfaction = {
                                id: subfactionId,
                                name: subfactionName,
                                type: factionType,
                                rank: settlementRank,
                                rulerId: ruler.id,
                                capitalSettlementId: settlement.id,
                                territoryIds: [],
                                vassalIds: [], // In case this faction has its own vassals
                                parentFactionId: closestKingdom.id,
                                strength: calculateFactionStrength(settlement),
                                neighbors: [],
                                isKingdom: false
                            };
                            
                            factionData.factions.push(subfaction);
                            
                            // Update settlement
                            settlement.factionId = subfactionId;
                            settlement.rulerId = ruler.id;
                            settlement.rank = settlementRank;
                            settlement.title = FACTION_TITLES[factionType][settlementRank];
                            
                            // Update ruler
                            ruler.factionId = subfactionId;
                            
                            // Add as vassal to kingdom
                            closestKingdom.vassalIds.push(subfactionId);
                            
                            // Track vassalage
                            if (!factionData.vassalage[closestKingdom.id]) {
                                factionData.vassalage[closestKingdom.id] = [];
                            }
                            factionData.vassalage[closestKingdom.id].push(subfactionId);
                            
                            // Add to kingdom settlements for territory creation
                            kingdomSettlements[closestKingdom.id].push(settlement);
                        } else {
                            // Minor settlement, just add directly to kingdom
                            settlement.factionId = closestKingdom.id;
                            settlement.rulerId = ruler.id;
                            settlement.rank = settlementRank;
                            settlement.title = FACTION_TITLES[factionType][settlementRank];
                            
                            // Update ruler
                            ruler.factionId = closestKingdom.id;
                            
                            // Add to kingdom settlements for territory creation
                            kingdomSettlements[closestKingdom.id].push(settlement);
                        }
                    }
                } else {
                    // Independent settlement - determine rank (1-3, can't be higher)
                    const independenceRoll = Math.random();
                    let settlementRank;
                    
                    if (independenceRoll < 0.2) {
                        settlementRank = 3; // Some are minor chieftains/regional governors
                    } else if (independenceRoll < 0.5) {
                        settlementRank = 2; // Many are minor nobles/landowners
                    } else {
                        settlementRank = 1; // Most are commoners
                    }
                    
                    // Create ruler
                    const ruler = createRuler(factionType, settlementRank, settlement);
                    factionData.rulers.push(ruler);
                    
                    // Create independent faction
                    const independentId = `faction_${factionType.toLowerCase()}_indep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    const independentName = generateSubfactionName(factionType, settlement, ruler);
                    
                    const independentFaction = {
                        id: independentId,
                        name: independentName,
                        type: factionType,
                        rank: settlementRank,
                        rulerId: ruler.id,
                        capitalSettlementId: settlement.id,
                        territoryIds: [],
                        vassalIds: [],
                        strength: calculateFactionStrength(settlement),
                        neighbors: [],
                        isKingdom: false,
                        isIndependent: true
                    };
                    
                    factionData.factions.push(independentFaction);
                    
                    // Update settlement
                    settlement.factionId = independentId;
                    settlement.rulerId = ruler.id;
                    settlement.rank = settlementRank;
                    settlement.title = FACTION_TITLES[factionType][settlementRank];
                    
                    // Update ruler
                    ruler.factionId = independentId;
                }
            });
            
            // Create territories for each kingdom
            kingdoms.forEach(kingdom => {
                // Create one territory for each kingdom
                const kingdomCapital = worldData.settlements.find(s => s.id === kingdom.capitalSettlementId);
                if (!kingdomCapital) return;
                
                const region = worldData.regions.find(r => r.id === kingdomCapital.region);
                if (!region) return;
                
                // Collect all settlements in this kingdom
                const kingdomSettlementList = kingdomSettlements[kingdom.id] || [];
                
                // Create territory
                const territory = {
                    id: `territory_${kingdom.id}_${Date.now()}`,
                    name: formatTerritoryName(factionType, region.name, kingdom),
                    factionId: kingdom.id,
                    regionId: region.id,
                    settlements: kingdomSettlementList.map(s => s.id),
                    resources: generateRegionalResources(region, factionType),
                    prosperity: Utils.randomBetween(50, 80),
                    unrest: Utils.randomBetween(0, 20)
                };
                
                factionData.territories.push(territory);
                kingdom.territoryIds.push(territory.id);
            });
        }
        
        // Create relationships between factions
        generateFactionRelations();
        
        console.log(`Initialized ${factionData.kingdoms.length} kingdoms and ${factionData.factions.length} total factions`);
    }
    
    /**
     * Create a ruler for a settlement
     * @param {string} factionType - Type of faction (NORSE, ANGLO_SAXON, FRANKISH)
     * @param {number} rank - Rank of the ruler (1-5)
     * @param {Object} settlement - Settlement object
     * @returns {Object} - Ruler object
     */
    function createRuler(factionType, rank, settlement) {
        // Generate name
        const gender = Math.random() > 0.8 ? 'female' : 'male';
        const name = settlement.name.split(" ")[0]; // Use first part of settlement name as base
        
        // Generate ruler
        const ruler = {
            id: `ruler_${factionType.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: name,
            gender: gender,
            age: Utils.randomBetween(25, 60),
            rank: rank,
            title: FACTION_TITLES[factionType][rank],
            factionId: null, // Will be set later
            traits: generateRulerTraits(factionType, rank),
            prestige: rank * 100 + Utils.randomBetween(0, 200)
        };
        
        return ruler;
    }
    
    /**
     * Generate traits for a ruler based on faction type and rank
     * @param {string} factionType - Type of faction
     * @param {number} rank - Rank of the ruler
     * @returns {Array} - Array of trait strings
     */
    function generateRulerTraits(factionType, rank) {
        const traits = [];
        
        // Common traits
        const commonTraits = ["Ambitious", "Patient", "Wrathful", "Generous", "Greedy", "Brave", "Craven", "Just", "Cruel"];
        
        // Faction-specific traits
        const factionTraits = {
            NORSE: ["Seafarer", "Raider", "Berserker", "Runecaster", "Ironside"],
            ANGLO_SAXON: ["Devout", "Scholar", "Planner", "Diplomat", "Fortifier"],
            FRANKISH: ["Administrator", "Knight", "Pious", "Architect", "Trader"]
        };
        
        // Add 1-3 common traits
        const traitCount = Utils.randomBetween(1, 3);
        for (let i = 0; i < traitCount; i++) {
            const trait = commonTraits[Utils.randomBetween(0, commonTraits.length - 1)];
            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }
        
        // Add 1 faction-specific trait
        if (factionTraits[factionType]) {
            const trait = factionTraits[factionType][Utils.randomBetween(0, factionTraits[factionType].length - 1)];
            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }
        
        // Higher rank rulers get an additional special trait
        if (rank >= 4) {
            const specialTraits = ["Brilliant", "Charismatic", "Tactician", "Strategist", "Renowned"];
            const trait = specialTraits[Utils.randomBetween(0, specialTraits.length - 1)];
            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }
        
        return traits;
    }
    
    /**
     * Calculate faction strength based on a settlement
     * @param {Object} settlement - Settlement object
     * @returns {number} - Faction strength value
     */
    function calculateFactionStrength(settlement) {
        if (!settlement) return 0;
        
        // Calculate based on population, military, and other factors
        let strength = 0;
        
        // Population contribution
        strength += (settlement.population || 5) * 2;
        
        // Military contribution
        if (settlement.military) {
            strength += (settlement.military.warriors || 0) * 3;
            strength += (settlement.military.defenses || 0) * 5;
            strength += (settlement.military.ships || 0) * 8;
        }
        
        // Resources contribution
        if (settlement.resources) {
            strength += Object.values(settlement.resources).reduce((sum, val) => sum + val / 10, 0);
        }
        
        return Math.round(strength);
    }
    
    /**
     * Generate a name for a kingdom
     * @param {string} factionType - Type of faction
     * @param {Object} settlement - Capital settlement
     * @param {Object} ruler - Ruler object
     * @returns {string} - Kingdom name
     */
    function generateKingdomName(factionType, settlement, ruler) {
        // Different naming conventions by culture
        switch (factionType) {
            case 'NORSE':
                // Vikings typically name realms after rulers
                return `${ruler.name}'s Kingdom`;
                
            case 'ANGLO_SAXON':
                // Anglo-Saxons typically use geographic names
                const regionName = settlement.name.split(" ")[0];
                return `Kingdom of ${regionName}`;
                
            case 'FRANKISH':
                // Franks use a mix of ruler and regional names
                if (Math.random() > 0.5) {
                    return `Kingdom of ${ruler.name}`;
                } else {
                    const regionName = settlement.name.split(" ")[0];
                    return `Realm of ${regionName}`;
                }
                
            default:
                return `Kingdom of ${settlement.name}`;
        }
    }
    
    /**
     * Generate a name for a subfaction (non-kingdom)
     * @param {string} factionType - Type of faction
     * @param {Object} settlement - Capital settlement
     * @param {Object} ruler - Ruler object
     * @returns {string} - Subfaction name
     */
    function generateSubfactionName(factionType, settlement, ruler) {
        // Different naming conventions by culture and rank
        if (ruler.rank <= 2) {
            // Lower ranks just use settlement name
            return `${settlement.name}`;
        }
        
        switch (factionType) {
            case 'NORSE':
                // Vikings use personal names
                return `${ruler.name}'s Hold`;
                
            case 'ANGLO_SAXON':
                // Anglo-Saxons use titles with region names
                const regionName = settlement.name.split(" ")[0];
                return `${ruler.title} of ${regionName}`;
                
            case 'FRANKISH':
                // Franks use titles with personal names
                return `${ruler.title} ${ruler.name}'s Domain`;
                
            default:
                return `${ruler.name}'s Domain`;
        }
    }
    
    /**
     * Format a territory name based on faction type
     * @param {string} factionType - Type of faction
     * @param {string} regionName - Name of the region
     * @param {Object} faction - Faction object
     * @returns {string} - Formatted territory name
     */
    function formatTerritoryName(factionType, regionName, faction) {
        let pattern = TERRITORY_NAME_PATTERNS[factionType] || "{territory}";
        
        // Replace {ruler} with ruler's name if applicable
        if (pattern.includes("{ruler}") && faction.rulerId) {
            const ruler = factionData.rulers.find(r => r.id === faction.rulerId);
            if (ruler) {
                pattern = pattern.replace("{ruler}", ruler.name);
            }
        }
        
        // Replace {territory} with region name
        pattern = pattern.replace("{territory}", regionName);
        
        return pattern;
    }
    
    /**
     * Generate diplomatic relations between all factions
     */
    function generateFactionRelations() {
        factionData.factions.forEach(faction1 => {
            if (!factionData.relations[faction1.id]) {
                factionData.relations[faction1.id] = {};
            }
            
            factionData.factions.forEach(faction2 => {
                // Skip self
                if (faction1.id === faction2.id) {
                    factionData.relations[faction1.id][faction2.id] = 100; // Self-relation is 100
                    return;
                }
                
                // Calculate base relation
                let baseRelation = 0;
                
                // Same type = better relations
                if (faction1.type === faction2.type) {
                    baseRelation += 20;
                }
                
                // Vikings have poor relations with others
                if (faction1.type === 'NORSE' && faction2.type !== 'NORSE') {
                    baseRelation -= 20;
                }
                
                // Anglo and Frankish have decent relations
                if ((faction1.type === 'ANGLO_SAXON' && faction2.type === 'FRANKISH') ||
                    (faction1.type === 'FRANKISH' && faction2.type === 'ANGLO_SAXON')) {
                    baseRelation += 10;
                }
                
                // Vassals have good relations with their liege
                if (faction1.parentFactionId === faction2.id) {
                    baseRelation += 40;
                }
                
                // Lieges have good relations with their vassals
                if (faction2.parentFactionId === faction1.id) {
                    baseRelation += 40;
                }
                
                // Fellow vassals have slightly better relations
                if (faction1.parentFactionId && faction1.parentFactionId === faction2.parentFactionId) {
                    baseRelation += 10;
                }
                
                // Higher rank difference = worse relations (jealousy/contempt)
                const rankDifference = Math.abs((faction1.rank || 3) - (faction2.rank || 3));
                baseRelation -= rankDifference * 5;
                
                // Add randomness
                baseRelation += Utils.randomBetween(-15, 15);
                
                // Clamp to range
                baseRelation = Math.max(-100, Math.min(100, baseRelation));
                
                factionData.relations[faction1.id][faction2.id] = baseRelation;
            });
        });
    }
    
    /**
     * Generate special locations for each faction territory
     * @param {Object} worldData - Current world data
     */
    function generateSpecialLocations(worldData) {
        console.log("Generating special locations for factions...");
        
        // Clear existing special locations
        factionData.specialLocations = [];
        
        // Generate locations for each territory
        factionData.territories.forEach(territory => {
            const faction = factionData.factions.find(f => f.id === territory.factionId);
            if (!faction) return;
            
            const profile = FACTION_PROFILES[faction.type];
            if (!profile) return;
            
            // Check if this territory gets special buildings
            if (Math.random() < profile.specialLocationChance) {
                // How many buildings (1-2)
                const buildingCount = Math.random() < 0.3 ? 2 : 1;
                
                // Select building types
                const availableTypes = [...profile.buildingTypes];
                
                for (let i = 0; i < buildingCount; i++) {
                    if (availableTypes.length === 0) break;
                    
                    // Select random building type
                    const typeIndex = Utils.randomBetween(0, availableTypes.length - 1);
                    const buildingType = availableTypes[typeIndex];
                    availableTypes.splice(typeIndex, 1); // Remove so we don't pick it twice
                    
                    const buildingTemplate = SPECIAL_BUILDINGS[buildingType];
                    if (!buildingTemplate) continue;
                    
                    // Create special location
                    const location = {
                        id: `location_${buildingType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        name: buildingTemplate.name,
                        description: buildingTemplate.description,
                        type: buildingType,
                        regionId: territory.regionId,
                        factionId: faction.id,
                        factionType: faction.type,
                        lootable: buildingTemplate.lootable,
                        lootTable: buildingTemplate.lootTable,
                        defenseValue: buildingTemplate.defenseValue,
                        fameReward: buildingTemplate.fameReward,
                        discovered: false
                    };
                    
                    factionData.specialLocations.push(location);
                }
            }
        });
        
        console.log(`Generated ${factionData.specialLocations.length} special locations`);
    }
    
    /**
     * Apply faction behaviors to settlements
     * @param {Object} worldData - Current world data
     */
    function applyFactionBehaviors(worldData) {
        console.log("Applying faction-specific behaviors to settlements...");
        
        worldData.settlements.forEach(settlement => {
            // Skip player settlement
            if (settlement.isPlayer) return;
            
            // Get faction type from settlement type
            const factionType = SETTLEMENT_TO_FACTION_TYPE[settlement.type];
            if (!factionType) return;
            
            const profile = FACTION_PROFILES[factionType];
            if (!profile) return;
            
            // Apply faction behavior profile
            
            // Update military values based on faction profile
            if (!settlement.military) settlement.military = {};
            
            // Warriors - based on population and faction profile
            const targetWarriors = Math.ceil(settlement.population * profile.warriorRatio);
            if (!settlement.military.warriors || settlement.military.warriors < targetWarriors) {
                settlement.military.warriors = targetWarriors;
            }
            
            // Defenses - based on faction profile
            const baseDefenses = Math.ceil(settlement.population / 10); // 1 defense per 10 population
            settlement.military.defenses = Math.ceil(baseDefenses * profile.defenseStrength);
            
            // Resources - prioritize based on faction profile
            if (!settlement.resources) {
                // Generate complete resource set based on region and faction
                const region = worldData.regions.find(r => r.id === settlement.region);
                if (region) {
                    settlement.resources = generateRegionalResources(region, factionType);
                    
                    // Scale resources based on settlement size
                    const sizeFactor = settlement.population / 10;
                    for (const resource in settlement.resources) {
                        settlement.resources[resource] = Math.round(settlement.resources[resource] * sizeFactor);
                    }
                } else {
                    settlement.resources = {};
                }
            }
            
            // Boost priority resources
            profile.resourcePriorities.forEach((resource, index) => {
                if (!settlement.resources[resource]) {
                    settlement.resources[resource] = 0;
                }
                
                // Higher priority resources get more focus
                const priorityMultiplier = 1 + (profile.resourcePriorities.length - index) * 0.2;
                const baseGain = settlement.population * 2 * priorityMultiplier;
                
                settlement.resources[resource] += baseGain;
            });
            
            // Add faction ID to settlement if not already present
            if (!settlement.factionId) {
                // Find matching faction
                const faction = factionData.factions.find(f => 
                    f.type === factionType && 
                    f.capitalSettlementId !== settlement.id
                );
                
                if (faction) {
                    settlement.factionId = faction.id;
                }
            }
        });
    }
    
    /**
     * Process a game tick for factions
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of the tick in days
     */
    function processFactionTick(gameState, tickSize) {
        // Skip if tickSize is too small
        if (tickSize <= 0) return;
        
        // Process faction behaviors
        factionData.factions.forEach(faction => {
            const factionType = faction.type;
            const profile = FACTION_PROFILES[factionType];
            
            if (!profile) return;
            
            // Get faction settlements
            const settlements = WorldMap.getWorldMap().settlements.filter(s => s.factionId === faction.id);
            
            // Calculate total strength
            let totalStrength = 0;
            settlements.forEach(settlement => {
                if (settlement.military) {
                    totalStrength += settlement.military.warriors * 2 + settlement.military.defenses * 3;
                }
            });
            
            faction.strength = totalStrength;
            
            // Expansion logic
            if (Math.random() < profile.expansionChance * (tickSize / 30)) {
                processFactionExpansion(faction);
            }
            
            // Resource distribution logic (help weaker settlements)
            if (settlements.length > 1) {
                distributeResources(settlements);
            }
        });
    }
    
    /**
     * Process faction expansion
     * @param {Object} faction - Faction object
     */
    function processFactionExpansion(faction) {
        // Simplified implementation - will be expanded later
        console.log(`Faction ${faction.name} is considering expansion`);
        
        // For now, just grow population in existing settlements
        const settlements = WorldMap.getWorldMap().settlements.filter(s => s.factionId === faction.id);
        
        settlements.forEach(settlement => {
            // Extra growth based on faction type
            const profile = FACTION_PROFILES[faction.type];
            if (profile) {
                // Population growth
                if (Math.random() < profile.expansionChance) {
                    settlement.population += Utils.randomBetween(1, 3);
                }
                
                // Military growth
                if (Math.random() < profile.expansionChance) {
                    if (!settlement.military) settlement.military = {};
                    
                    settlement.military.warriors = Math.ceil(settlement.population * profile.warriorRatio);
                    settlement.military.defenses = Math.max(1, Math.ceil(settlement.military.warriors * 0.2));
                }
            }
        });
    }
    
    /**
     * Distribute resources between settlements of the same faction
     * @param {Array} settlements - Settlements in the faction
     */
    function distributeResources(settlements) {
        // Only proceed if there are at least 2 settlements
        if (settlements.length < 2) return;
        
        // Find the wealthy and poor settlements
        const wealthySettlements = [];
        const poorSettlements = [];
        
        settlements.forEach(settlement => {
            if (!settlement.resources) settlement.resources = {};
            
            // Calculate total resources
            let totalResources = 0;
            for (const resource in settlement.resources) {
                totalResources += settlement.resources[resource];
            }
            
            // Determine if wealthy (> 100 per population) or poor (< 50 per population)
            const resourcePerCapita = totalResources / Math.max(1, settlement.population);
            
            if (resourcePerCapita > 100) {
                wealthySettlements.push(settlement);
            } else if (resourcePerCapita < 50) {
                poorSettlements.push(settlement);
            }
        });
        
        // If we have both wealthy and poor settlements, redistribute
        if (wealthySettlements.length > 0 && poorSettlements.length > 0) {
            // For each poor settlement, get aid from a wealthy one
            poorSettlements.forEach(poorSettlement => {
                // Select random wealthy settlement
                const wealthySettlement = wealthySettlements[Utils.randomBetween(0, wealthySettlements.length - 1)];
                
                // Transfer ~10% of resources from wealthy to poor
                for (const resource in wealthySettlement.resources) {
                    const transferAmount = Math.ceil(wealthySettlement.resources[resource] * 0.1);
                    
                    // Ensure poor settlement has resource field
                    if (!poorSettlement.resources[resource]) {
                        poorSettlement.resources[resource] = 0;
                    }
                    
                    // Transfer resources
                    wealthySettlement.resources[resource] -= transferAmount;
                    poorSettlement.resources[resource] += transferAmount;
                }
            });
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the faction integration module
         */
        init: function() {
            console.log("Initializing Faction Integration module...");
            
            // Try to get world data
            if (typeof WorldMap === 'undefined' || !WorldMap.getWorldMap) {
                console.error("World Map system not found, cannot initialize factions");
                return;
            }
            
            const worldData = WorldMap.getWorldMap();
            
            // Initialize factions from world data
            initializeFactions(worldData);
            
            // Generate special locations
            generateSpecialLocations(worldData);
            
            // Apply faction behaviors to settlements
            applyFactionBehaviors(worldData);
            
            // Register tick processor
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(processFactionTick);
            }
            
            console.log("Faction Integration module initialized");
        },
        
        /**
         * Get faction data
         * @returns {Object} - Current faction data
         */
        getFactionData: function() {
            return { ...factionData };
        },
        
        /**
         * Get special locations
         * @returns {Array} - Array of special locations
         */
        getSpecialLocations: function() {
            return [...factionData.specialLocations];
        },
        
        /**
         * Get special locations in a region
         * @param {string} regionId - ID of the region
         * @param {boolean} discoveredOnly - Whether to only return discovered locations
         * @returns {Array} - Array of special locations in the region
         */
        getLocationsByRegion: function(regionId, discoveredOnly = true) {
            return factionData.specialLocations.filter(
                loc => loc.regionId === regionId && (!discoveredOnly || loc.discovered)
            );
        },
        
        /**
         * Get a single special location by ID
         * @param {string} locationId - ID of the location
         * @returns {Object|undefined} - Special location object
         */
        getLocationById: function(locationId) {
            return factionData.specialLocations.find(loc => loc.id === locationId);
        },
        
        /**
         * Get faction by ID
         * @param {string} factionId - ID of the faction
         * @returns {Object|undefined} - Faction object
         */
        getFactionById: function(factionId) {
            return factionData.factions.find(f => f.id === factionId);
        },
        
        /**
         * Get faction by settlement ID
         * @param {string} settlementId - ID of the settlement
         * @returns {Object|undefined} - Faction object
         */
        getFactionBySettlementId: function(settlementId) {
            const settlement = WorldMap.getSettlement(settlementId);
            if (!settlement || !settlement.factionId) return undefined;
            
            return this.getFactionById(settlement.factionId);
        },
        
        /**
         * Get territory by ID
         * @param {string} territoryId - ID of the territory
         * @returns {Object|undefined} - Territory object
         */
        getTerritoryById: function(territoryId) {
            return factionData.territories.find(t => t.id === territoryId);
        },
        
        /**
         * Get territories by faction ID
         * @param {string} factionId - ID of the faction
         * @returns {Array} - Array of territory objects
         */
        getTerritoriesByFactionId: function(factionId) {
            return factionData.territories.filter(t => t.factionId === factionId);
        },
        
        /**
         * Get ruler by ID
         * @param {string} rulerId - ID of the ruler
         * @returns {Object|undefined} - Ruler object
         */
        getRulerById: function(rulerId) {
            return factionData.rulers.find(r => r.id === rulerId);
        },
        
        /**
         * Get relation between two factions
         * @param {string} faction1Id - ID of the first faction
         * @param {string} faction2Id - ID of the second faction
         * @returns {number} - Relation value between -100 and 100
         */
        getRelation: function(faction1Id, faction2Id) {
            if (!factionData.relations[faction1Id] || 
                !factionData.relations[faction1Id][faction2Id]) {
                return 0; // Default neutral
            }
            
            return factionData.relations[faction1Id][faction2Id];
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game engine to be ready
    const waitForGameEngine = setInterval(function() {
        if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning) {
            clearInterval(waitForGameEngine);
            
            // Initialize after a short delay to allow other systems to load
            setTimeout(function() {
                FactionIntegration.init();
            }, 1000);
        }
    }, 500);
});
