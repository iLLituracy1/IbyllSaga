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
    }/**
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
        specialLocations: [] // For exploration
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
    
    // Special building/location definitions
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
            
            // Resources - priorItize based on faction profile
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
     * Enhance Explorer to show faction information and special locations
     */
    function enhanceExplorer() {
        console.log("Enhancing Explorer with faction support and special locations...");
        
        // Only proceed if ExplorerSystem exists
        if (typeof ExplorerSystem === 'undefined') {
            console.error("Explorer system not found, cannot enhance");
            return;
        }
        
        // Store original function references
        const originalUpdateRegionArrival = ExplorerSystem.updateRegionArrival;
        const originalShowSettlementDetails = ExplorerSystem.showSettlementDetails;
        
        // Override with an extended version that looks for special locations
        ExplorerSystem.updateRegionArrival = function(region) {
            // Call the original function first
            if (originalUpdateRegionArrival) {
                originalUpdateRegionArrival.call(ExplorerSystem, region);
            }
            
            // Check for special locations in this region
            const regionLocations = factionData.specialLocations.filter(loc => loc.regionId === region.id);
            
            // Chance to discover locations
            regionLocations.forEach(location => {
                // 50% chance to discover if not already discovered
                if (!location.discovered && Math.random() < 0.5) {
                    location.discovered = true;
                    
                    // Log discovery
                    Utils.log(`Your explorers have discovered ${location.name} in the region!`, "success");
                }
            });
            
            // Add faction information panel for this region
            addRegionalPoliticsPanel(region);
            
            // Update location display
            updateLocationDisplay();
        };
        
        // Override settlement details to include faction information
        ExplorerSystem.showSettlementDetails = function(settlement) {
            // Call the original function first to set up the base panel
            if (originalShowSettlementDetails) {
                originalShowSettlementDetails.call(ExplorerSystem, settlement);
            }
            
            // Now enhance the settlement detail panel with faction information
            setTimeout(() => {
                enhanceSettlementDetailPanel(settlement);
            }, 100);
        };
        
        // Add method to show special location details
        ExplorerSystem.showLocationDetails = function(locationId) {
            const location = factionData.specialLocations.find(loc => loc.id === locationId);
            if (!location) return;
            
            // Create location detail panel if it doesn't exist
            let detailPanel = document.getElementById('location-detail-panel');
            
            if (!detailPanel) {
                detailPanel = document.createElement('div');
                detailPanel.id = 'location-detail-panel';
                detailPanel.className = 'settlement-detail-panel';
                
                // Insert after settlements list
                const settlementsSection = document.getElementById('settlements-section');
                if (settlementsSection) {
                    settlementsSection.appendChild(detailPanel);
                }
            }
            
            // Get faction information
            const faction = factionData.factions.find(f => f.id === location.factionId);
            
            // Determine relationship type for styling
            let relationshipClass = 'neutral';
            if (location.factionType === 'NORSE') {
                relationshipClass = 'cautious';
            } else if (location.factionType === 'ANGLO_SAXON' || location.factionType === 'FRANKISH') {
                relationshipClass = 'hostile';
            }
            
            // Populate with location details
            detailPanel.innerHTML = `
                <div class="settlement-header">
                    <h4>${location.name}</h4>
                    <button class="btn-close-location">×</button>
                </div>
                <div class="settlement-description relationship-${relationshipClass}">
                    ${location.description}
                </div>
                <div class="settlement-stats">
                    <div>
                        <strong>Type:</strong> ${location.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                    <div>
                        <strong>Faction:</strong> ${faction ? faction.name : location.factionType.split('_').join('-')}
                    </div>
                    <div>
                        <strong>Defenses:</strong> ${location.defenseValue}
                    </div>
                    <div>
                        <strong>Fame Reward:</strong> ${location.fameReward}
                    </div>
                </div>
                <div class="settlement-action-buttons">
                    ${location.lootable ? 
                        `<button class="btn-raid-location" data-location-id="${location.id}">Raid</button>` : 
                        `<button class="btn-visit-location" data-location-id="${location.id}">Visit</button>`}
                </div>
            `;
            
            // Make panel visible
            detailPanel.classList.add('visible');
            
            // Add event listener for close button
            const closeButton = detailPanel.querySelector('.btn-close-location');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    detailPanel.classList.remove('visible');
                });
            }
            
            // Add event listener for raid button
            const raidButton = detailPanel.querySelector('.btn-raid-location');
            if (raidButton) {
                raidButton.addEventListener('click', function() {
                    FactionIntegration.raidLocation(location.id);
                    detailPanel.classList.remove('visible');
                });
            }
            
            // Add event listener for visit button
            const visitButton = detailPanel.querySelector('.btn-visit-location');
            if (visitButton) {
                visitButton.addEventListener('click', function() {
                    FactionIntegration.visitLocation(location.id);
                    detailPanel.classList.remove('visible');
                });
            }
        };
        
        // Add method to display faction info
        ExplorerSystem.showFactionDetails = function(factionId) {
            const faction = factionData.factions.find(f => f.id === factionId);
            if (!faction) return;
            
            // Create faction detail panel if it doesn't exist
            let detailPanel = document.getElementById('faction-detail-panel');
            
            if (!detailPanel) {
                detailPanel = document.createElement('div');
                detailPanel.id = 'faction-detail-panel';
                detailPanel.className = 'settlement-detail-panel';
                
                // Insert after politics panel
                const politicsPanel = document.getElementById('politics-panel');
                if (politicsPanel) {
                    politicsPanel.appendChild(detailPanel);
                } else {
                    // Fallback - add to settlements section
                    const settlementsSection = document.getElementById('settlements-section');
                    if (settlementsSection) {
                        settlementsSection.appendChild(detailPanel);
                    }
                }
            }
            
            // Get ruler
            const ruler = factionData.rulers.find(r => r.id === faction.rulerId);
            
            // Get capital settlement
            const capital = WorldMap.getSettlement(faction.capitalSettlementId);
            
            // Check if this is a kingdom
            const isKingdom = faction.isKingdom || faction.rank === 5;
            
            // Get vassals if this is a kingdom
            let vassals = [];
            if (factionData.vassalage[faction.id]) {
                vassals = factionData.vassalage[faction.id].map(vassal => {
                    const vassalFaction = factionData.factions.find(f => f.id === vassal);
                    const vassalRuler = vassalFaction ? factionData.rulers.find(r => r.id === vassalFaction.rulerId) : null;
                    return {
                        faction: vassalFaction,
                        ruler: vassalRuler
                    };
                }).filter(v => v.faction && v.ruler);
            }
            
            // Get parent kingdom if this is a vassal
            let liege = null;
            if (faction.parentFactionId) {
                const parentFaction = factionData.factions.find(f => f.id === faction.parentFactionId);
                const parentRuler = parentFaction ? factionData.rulers.find(r => r.id === parentFaction.rulerId) : null;
                
                if (parentFaction && parentRuler) {
                    liege = {
                        faction: parentFaction,
                        ruler: parentRuler
                    };
                }
            }
            
            // Create detailed faction content
            let content = `
                <div class="faction-header">
                    <h4>${faction.name}</h4>
                    <button class="btn-close-faction">×</button>
                </div>
                
                <div class="faction-ruler">
                    <h5>Ruler</h5>
                    <div class="ruler-info">
                        <div class="ruler-name">${ruler ? ruler.title : ''} ${ruler ? ruler.name : 'Unknown'}</div>
                        <div class="ruler-traits">${ruler && ruler.traits ? ruler.traits.join(', ') : ''}</div>
                    </div>
                </div>
                
                <div class="faction-capital">
                    <h5>Capital</h5>
                    <div>${capital ? capital.name : 'Unknown'}</div>
                </div>
                
                <div class="faction-strength">
                    <h5>Strength</h5>
                    <div>Military Power: ${faction.strength}</div>
                </div>
            `;
            
            // Add relationship with player if any
            if (factionData.relations[faction.id]) {
                const playerFactions = factionData.factions.filter(f => f.isPlayerFaction);
                if (playerFactions.length > 0) {
                    const playerFaction = playerFactions[0];
                    const relation = factionData.relations[faction.id][playerFaction.id] || 0;
                    
                    let relationDesc = "Neutral";
                    let relationClass = "neutral";
                    
                    if (relation > 75) {
                        relationDesc = "Friendly";
                        relationClass = "friendly";
                    } else if (relation > 50) {
                        relationDesc = "Positive";
                        relationClass = "positive";
                    } else if (relation > 25) {
                        relationDesc = "Cordial";
                        relationClass = "cordial";
                    } else if (relation < -75) {
                        relationDesc = "Hostile";
                        relationClass = "hostile";
                    } else if (relation < -50) {
                        relationDesc = "Negative";
                        relationClass = "negative";
                    } else if (relation < -25) {
                        relationDesc = "Wary";
                        relationClass = "wary";
                    }
                    
                    content += `
                        <div class="faction-relations">
                            <h5>Relations</h5>
                            <div class="relation ${relationClass}">Towards You: ${relationDesc} (${relation})</div>
                        </div>
                    `;
                }
            }
            
            // Add vassals section for kingdoms
            if (vassals.length > 0) {
                content += `
                    <div class="faction-vassals">
                        <h5>Vassals</h5>
                        <ul class="vassals-list">
                `;
                
                vassals.forEach(vassal => {
                    content += `
                        <li>
                            <span class="vassal-title">${vassal.ruler.title}</span>
                            <span class="vassal-name">${vassal.ruler.name}</span>
                            <span class="vassal-faction">(${vassal.faction.name})</span>
                        </li>
                    `;
                });
                
                content += `
                        </ul>
                    </div>
                `;
            }
            
            // Add liege info for vassals
            if (liege) {
                content += `
                    <div class="faction-liege">
                        <h5>Liege</h5>
                        <div class="liege-info">
                            <span class="liege-title">${liege.ruler.title}</span>
                            <span class="liege-name">${liege.ruler.name}</span>
                            <span class="liege-faction">(${liege.faction.name})</span>
                        </div>
                    </div>
                `;
            }
            
            // Add action buttons
            content += `
                <div class="faction-action-buttons">
                    <button class="btn-close-faction-details">Close</button>
                </div>
            `;
            
            // Add content to panel
            detailPanel.innerHTML = content;
            
            // Make panel visible
            detailPanel.classList.add('visible');
            
            // Add event listeners
            const closeButtons = detailPanel.querySelectorAll('.btn-close-faction, .btn-close-faction-details');
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    detailPanel.classList.remove('visible');
                });
            });
        };
        
        console.log("Explorer system enhanced with faction support");
    }
    
    /**
     * Add a regional politics panel to the explorer tab
     * @param {Object} region - Region object
     */
    function addRegionalPoliticsPanel(region) {
        // Get the exploration section
        const explorationSection = document.querySelector('.exploration-section');
        if (!explorationSection) return;
        
        // Check if politics panel already exists
        let politicsPanel = document.getElementById('politics-panel');
        
        if (!politicsPanel) {
            // Create the panel
            politicsPanel = document.createElement('div');
            politicsPanel.id = 'politics-panel';
            politicsPanel.className = 'politics-panel';
            politicsPanel.innerHTML = `
                <h4>Political Landscape</h4>
                <div id="regional-politics">
                    <p>Your scouts gather information about the local political situation...</p>
                </div>
            `;
            
            // Simply append to exploration section - safer method to avoid DOM errors
            explorationSection.appendChild(politicsPanel);
        }
        
        // Now populate with faction information for this region
        updateRegionalPolitics(region);
    }
    
    /**
     * Update the regional politics display for a region
     * @param {Object} region - Region object
     */
    function updateRegionalPolitics(region) {
        const politicsDiv = document.getElementById('regional-politics');
        if (!politicsDiv) return;
        
        // Get settlements in this region
        const settlements = WorldMap.getSettlementsByRegion(region.id);
        if (!settlements || settlements.length === 0) {
            politicsDiv.innerHTML = '<p>No known political entities in this area.</p>';
            return;
        }
        
        // Collect factions present in the region
        const factionIds = new Set();
        settlements.forEach(s => {
            if (s.factionId) factionIds.add(s.factionId);
        });
        
        // Get faction details
        const regionalFactions = Array.from(factionIds)
            .map(id => factionData.factions.find(f => f.id === id))
            .filter(f => f !== undefined);
        
        if (regionalFactions.length === 0) {
            politicsDiv.innerHTML = '<p>Your scouts could not determine who rules this land.</p>';
            return;
        }
        
        // Group factions by type
        const factionsByType = {};
        regionalFactions.forEach(faction => {
            if (!factionsByType[faction.type]) {
                factionsByType[faction.type] = [];
            }
            factionsByType[faction.type].push(faction);
        });
        
        // Create faction display
        let content = '';
        
        // For each culture type present
        for (const type in factionsByType) {
            // Get relevant factions
            const factions = factionsByType[type];
            
            // Sort by rank (highest first)
            factions.sort((a, b) => (b.rank || 3) - (a.rank || 3));
            
            // Display culture header
            const cultureName = type === 'NORSE' ? 'Norse' : 
                                type === 'ANGLO_SAXON' ? 'Anglo-Saxon' : 
                                type === 'FRANKISH' ? 'Frankish' : 'Unknown';
            
            content += `<div class="faction-culture faction-${type.toLowerCase()}">
                <h5>${cultureName} Presence</h5>`;
            
            // Display factions
            factions.forEach(faction => {
                // Get ruler
                const ruler = factionData.rulers.find(r => r.id === faction.rulerId);
                
                // Determine faction class based on rank
                let factionClass = 'minor-faction';
                if (faction.isKingdom || faction.rank === 5) factionClass = 'kingdom-faction';
                else if (faction.rank >= 4) factionClass = 'major-faction';
                else if (faction.rank >= 3) factionClass = 'regional-faction';
                
                content += `
                    <div class="faction-item ${factionClass}" data-faction-id="${faction.id}">
                        <div class="faction-name">${faction.name}</div>
                        <div class="faction-ruler">
                            ${ruler ? `${ruler.title} ${ruler.name}` : 'Unknown Ruler'}
                        </div>
                        <button class="btn-view-faction" data-faction-id="${faction.id}">View Details</button>
                    </div>
                `;
            });
            
            content += '</div>';
        }
        
        // Update the panel
        politicsDiv.innerHTML = content;
        
        // Add event listeners to faction buttons
        const factionButtons = document.querySelectorAll('.btn-view-faction');
        factionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                ExplorerSystem.showFactionDetails(factionId);
            });
        });
    }
    
    /**
     * Enhance settlement detail panel with faction information
     * @param {Object} settlement - Settlement object
     */
    function enhanceSettlementDetailPanel(settlement) {
        // Get the settlement detail panel
        const detailPanel = document.getElementById('settlement-detail-panel');
        if (!detailPanel || !detailPanel.classList.contains('visible')) return;
        
        // Skip player settlement
        if (settlement.isPlayer) return;
        
        // Get faction information
        const faction = settlement.factionId ? 
            factionData.factions.find(f => f.id === settlement.factionId) : null;
        
        if (!faction) return;
        
        // Get ruler information
        const ruler = settlement.rulerId ?
            factionData.rulers.find(r => r.id === settlement.rulerId) : null;
        
        // Create faction info element
        const factionInfo = document.createElement('div');
        factionInfo.className = 'settlement-faction-info';
        
        // Add faction details
        let factionContent = `
            <h4>Political Information</h4>
            <div class="faction-details">
                <div class="faction-ruler">
                    <strong>Ruler:</strong> ${ruler ? `${ruler.title} ${ruler.name}` : 'Unknown'}
                </div>
                <div class="faction-name">
                    <strong>Realm:</strong> ${faction.name}
                </div>
        `;
        
        // Add vassal/liege relationships if applicable
        if (faction.parentFactionId) {
            const liege = factionData.factions.find(f => f.id === faction.parentFactionId);
            if (liege) {
                const liegeRuler = factionData.rulers.find(r => r.id === liege.rulerId);
                factionContent += `
                    <div class="faction-liege">
                        <strong>Liege:</strong> ${liegeRuler ? `${liegeRuler.title} ${liegeRuler.name}` : 'Unknown'}
                    </div>
                `;
            }
        }
        
        // Add kingdom information if applicable
        if (faction.isKingdom) {
            const vassalCount = (factionData.vassalage[faction.id] || []).length;
            factionContent += `
                <div class="faction-vassals">
                    <strong>Vassals:</strong> ${vassalCount}
                </div>
            `;
        }
        
        // Close the faction details div
        factionContent += `</div>`;
        
        // Add a button to view full faction details
        factionContent += `
            <div class="faction-action">
                <button class="btn-view-faction-details" data-faction-id="${faction.id}">View Realm Details</button>
            </div>
        `;
        
        // Set the content
        factionInfo.innerHTML = factionContent;
        
        // Add to the settlement detail panel
        const statsElement = detailPanel.querySelector('.settlement-stats');
        if (statsElement) {
            statsElement.parentNode.insertBefore(factionInfo, statsElement.nextSibling);
            
            // Add event listener to view faction button
            const viewButton = detailPanel.querySelector('.btn-view-faction-details');
            if (viewButton) {
                viewButton.addEventListener('click', function() {
                    const factionId = this.dataset.factionId;
                    ExplorerSystem.showFactionDetails(factionId);
                });
            }
        }
    }
    
    /**
     * Update the location display in the explorer panel
     */
    function updateLocationDisplay() {
        // Get current explorer state
        if (typeof ExplorerSystem === 'undefined' || !ExplorerSystem.getExplorerState) return;
        
        const explorerState = ExplorerSystem.getExplorerState();
        if (!explorerState || !explorerState.currentRegion) return;
        
        // Get locations in the current region that are discovered
        const regionLocations = factionData.specialLocations.filter(
            loc => loc.regionId === explorerState.currentRegion && loc.discovered
        );
        
        // Find locations list element
        const locationsList = document.getElementById('locations-list');
        if (!locationsList) {
            // Create locations section if it doesn't exist
            const locationsSection = document.createElement('div');
            locationsSection.id = 'locations-section';
            locationsSection.innerHTML = `
                <h4>Special Locations</h4>
                <div id="locations-list">
                    <p>No special locations discovered in this region.</p>
                </div>
            `;
            
            // Add to explorer panel
            const explorerContent = document.querySelector('.exploration-section');
            if (explorerContent) {
                explorerContent.appendChild(locationsSection);
            }
            
            // Now try to get the list again
            const locationsList = document.getElementById('locations-list');
            if (!locationsList) return;
        }
        
        // Update locations list
        if (regionLocations.length === 0) {
            locationsList.innerHTML = '<p>No special locations discovered in this region.</p>';
            return;
        }
        
        let locationsHTML = '';
        
        regionLocations.forEach(location => {
            // Determine relationship class for styling
            let relationshipClass = 'neutral';
            if (location.factionType === 'NORSE') {
                relationshipClass = 'cautious';
            } else if (location.factionType === 'ANGLO_SAXON' || location.factionType === 'FRANKISH') {
                relationshipClass = 'hostile';
            }
            
            // Create HTML
            locationsHTML += `
                <div class="settlement-explorer-item relationship-${relationshipClass}" data-location-id="${location.id}">
                    <div class="settlement-name">${location.name}</div>
                    <div class="settlement-type">${location.factionType.split('_').join('-')}</div>
                    <div class="settlement-buttons">
                        <button class="btn-view-location" data-location-id="${location.id}">View</button>
                    </div>
                </div>
            `;
        });
        
        locationsList.innerHTML = locationsHTML;
        
        // Add event listeners
        document.querySelectorAll('.btn-view-location').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.dataset.locationId;
                ExplorerSystem.showLocationDetails(locationId);
            });
        });
    }
    
    /**
     * Process a raid on a special location
     * @param {string} locationId - ID of the location being raided
     */
    function processLocationRaid(locationId) {
        const location = factionData.specialLocations.find(loc => loc.id === locationId);
        if (!location || !location.lootable) {
            Utils.log("This location cannot be raided.", "important");
            return;
        }
        
        // Check if explorer party is active
        if (typeof ExplorerSystem === 'undefined' || !ExplorerSystem.getExplorerState) {
            Utils.log("No explorer party available for raiding.", "important");
            return;
        }
        
        const explorerState = ExplorerSystem.getExplorerState();
        if (!explorerState || !explorerState.active || explorerState.travelStatus.traveling) {
            Utils.log("Your explorer party must be active and not traveling to raid.", "important");
            return;
        }
        
        // Calculate attacker strength
        const attackerStrength = explorerState.warriors * 1.5; // Stronger than settlement raids
        
        // Calculate defender strength
        const defenderStrength = location.defenseValue * 3; // Fixed defense value
        
        // Determine outcome
        let outcome = "Defeat";
        const strengthRatio = attackerStrength / defenderStrength;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const adjustedRatio = strengthRatio * randomFactor;
        
        if (adjustedRatio >= 2.0) {
            outcome = "Decisive Victory";
        } else if (adjustedRatio >= 1.3) {
            outcome = "Victory";
        } else if (adjustedRatio >= 1.0) {
            outcome = "Pyrrhic Victory";
        } else if (adjustedRatio >= 0.7) {
            outcome = Math.random() < 0.4 ? "Tactical Retreat" : "Defeat";
        } else {
            outcome = Math.random() < 0.7 ? "Tactical Retreat" : "Disaster";
        }
        
        // Calculate casualties
        const casualtyRates = {
            "Decisive Victory": 0.05,
            "Victory": 0.1,
            "Pyrrhic Victory": 0.25,
            "Defeat": 0.3,
            "Disaster": 0.5,
            "Tactical Retreat": 0.15
        };
        
        const rate = casualtyRates[outcome] || 0.1;
        const randomCasualtyFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const casualties = Math.round(explorerState.warriors * rate * randomCasualtyFactor);
        
        // Calculate loot
        let loot = {};
        if (outcome.includes("Victory")) {
            // Generate loot based on loot table
            if (location.lootTable) {
                for (const resource in location.lootTable) {
                    const [min, max] = location.lootTable[resource];
                    loot[resource] = Utils.randomBetween(min, max);
                    
                    // Adjust based on outcome
                    if (outcome === "Decisive Victory") {
                        loot[resource] = Math.round(loot[resource] * 1.5);
                    } else if (outcome === "Pyrrhic Victory") {
                        loot[resource] = Math.round(loot[resource] * 0.7);
                    }
                }
            }
        }
        
        // Apply effects
        
        // 1. Adjust warrior count
        const remainingWarriors = Math.max(0, explorerState.warriors - casualties);
        if (typeof ExplorerSystem.adjustWarriorCount === 'function') {
            ExplorerSystem.adjustWarriorCount(remainingWarriors);
        }
        
        // 2. Add loot
        if (Object.keys(loot).length > 0 && ResourceManager && typeof ResourceManager.addResources === 'function') {
            ResourceManager.addResources(loot);
        }
        
        // 3. Add fame
        const fameRewards = {
            "Decisive Victory": location.fameReward * 1.5,
            "Victory": location.fameReward,
            "Pyrrhic Victory": location.fameReward * 0.7,
            "Defeat": location.fameReward * 0.1,
            "Disaster": 0,
            "Tactical Retreat": location.fameReward * 0.05
        };
        
        const fameGained = Math.round(fameRewards[outcome] || 0);
        if (fameGained > 0 && RankManager && typeof RankManager.addFame === 'function') {
            RankManager.addFame(fameGained, `Raid on ${location.name}: ${outcome}`);
        }
        
        // Show result
        showRaidResults({
            locationName: location.name,
            outcome: outcome,
            casualties: casualties,
            loot: loot,
            fame: fameGained
        });
        
        // Log to game log
        Utils.log(`Raid on ${location.name} - ${outcome}!`, outcome.includes("Victory") ? "success" : "important");
    }
    
    /**
     * Process visiting a non-lootable special location
     * @param {string} locationId - ID of the location being visited
     */
    function processLocationVisit(locationId) {
        const location = factionData.specialLocations.find(loc => loc.id === locationId);
        if (!location) {
            Utils.log("Location not found.", "important");
            return;
        }
        
        // Check if explorer party is active
        if (typeof ExplorerSystem === 'undefined' || !ExplorerSystem.getExplorerState) {
            Utils.log("No explorer party available to visit this location.", "important");
            return;
        }
        
        const explorerState = ExplorerSystem.getExplorerState();
        if (!explorerState || !explorerState.active || explorerState.travelStatus.traveling) {
            Utils.log("Your explorer party must be active and not traveling to visit locations.", "important");
            return;
        }
        
        // Apply special effects based on location type
        let message = `You visit ${location.name} and gain valuable knowledge.`;
        let fameGained = Math.round(location.fameReward * 0.5); // Less fame than raiding
        
        // Add fame
        if (fameGained > 0 && RankManager && typeof RankManager.addFame === 'function') {
            RankManager.addFame(fameGained, `Visit to ${location.name}`);
        }
        
        // Special effects for different location types
        if (location.type === 'runestone') {
            message = `You study the ancient runestone and gain wisdom from the runes carved upon it.`;
        } else if (location.type === 'minster' || location.type === 'cathedral') {
            message = `You visit the religious site and gain insight into the local culture and beliefs.`;
        }
        
        // Show result as simple alert
        const visitResult = document.createElement('div');
        visitResult.className = 'battle-result-modal';
        visitResult.innerHTML = `
            <div class="battle-result-content">
                <h3>Exploration Results</h3>
                <div class="battle-outcome neutral">
                    <div class="outcome-header">Visit Complete</div>
                </div>
                
                <div class="battle-details">
                    <p>${message}</p>
                    <div>
                        <h4>Rewards</h4>
                        <p>Fame gained: ${fameGained}</p>
                    </div>
                </div>
                
                <div class="battle-actions">
                    <button class="btn-close-battle">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(visitResult);
        
        // Add event listener to close button
        const closeButton = visitResult.querySelector('.btn-close-battle');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                document.body.removeChild(visitResult);
            });
        }
        
        // Log to game log
        Utils.log(message, "success");
    }
    
    /**
     * Show raid results modal
     * @param {Object} results - Results of the raid
     */
    function showRaidResults(results) {
        // Determine outcome class
        const outcomeClass = results.outcome.includes('Victory') ? 
            'victory' : (results.outcome === "Tactical Retreat" ? 
                'retreat' : 'defeat');
        
        // Prepare loot list
        let lootHTML = '<p>No resources captured.</p>';
        if (Object.keys(results.loot).some(key => results.loot[key] > 0)) {
            lootHTML = '<ul>';
            for (const resource in results.loot) {
                if (results.loot[resource] > 0) {
                    lootHTML += `<li>${results.loot[resource]} ${resource}</li>`;
                }
            }
            lootHTML += '</ul>';
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'battle-result-modal';
        modal.innerHTML = `
            <div class="battle-result-content">
                <h3>Raid Results</h3>
                <div class="battle-outcome ${outcomeClass}">
                    <div class="outcome-header">${results.outcome}!</div>
                </div>
                
                <div class="battle-details">
                    <div>
                        <h4>Target</h4>
                        <p>${results.locationName}</p>
                    </div>
                    
                    <div>
                        <h4>Casualties</h4>
                        <p>Your forces: ${results.casualties} warriors</p>
                    </div>
                    
                    <div>
                        <h4>Spoils of War</h4>
                        ${lootHTML}
                    </div>
                    
                    <div>
                        <h4>Rewards</h4>
                        <p>Fame gained: ${results.fame}</p>
                    </div>
                </div>
                
                <div class="battle-actions">
                    <button class="btn-close-battle">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener to close button
        const closeButton = modal.querySelector('.btn-close-battle');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
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
            
            // Enhance explorer to show faction locations
            enhanceExplorer();
            
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
         * Raid a special location
         * @param {string} locationId - ID of the location to raid
         */
        raidLocation: function(locationId) {
            processLocationRaid(locationId);
        },
        
        /**
         * Visit a special location
         * @param {string} locationId - ID of the location to visit
         */
        visitLocation: function(locationId) {
            processLocationVisit(locationId);
        },
        
        /**
         * Update the display of special locations
         */
        updateLocationDisplay: function() {
            updateLocationDisplay();
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
