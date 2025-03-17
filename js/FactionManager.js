/**
 * Viking Legacy - Faction and Political System
 * Handles factions, rulers, territorial control, and political relations
 */

const FactionManager = (function() {
    // Constants and configuration
    const FACTION_TYPES = {
        NORSE: {
            id: "norse",
            name: "Norse",
            description: "Skilled seafarers and fearsome raiders from the north.",
            preferredLandmass: "scandinavia",
            titles: {
                1: "Karl", // Peasant/Free farmer
                2: "Bondi", // Independent landowner
                3: "Hersir", // Local chieftain
                4: "Jarl", // Powerful regional ruler
                5: "Konungr" // King
            },
            territoryNamePattern: "{ruler}'s Realm",
            strengthAttributes: ["raiding", "seafaring", "individual_combat"],
            weaknessAttributes: ["fortification", "administration", "agriculture"],
            specialUnits: ["berserker", "huscarl", "viking_raider"],
            specialBuildings: ["longhouse", "runestone", "longship_harbor"],
            priorityResources: ["wood", "metal", "food"],
            expansionStrategy: "raiding",
            npcExpansionChance: 0.4,
            npcRaidChance: 0.7,
            npcDefenseStrength: 0.8,
            religionId: "norse_paganism"
        },
        ANGLO_SAXON: {
            id: "anglo_saxon",
            name: "Anglo-Saxon",
            description: "Organized kingdoms of Britain with strong defensive positions.",
            preferredLandmass: "britannia",
            titles: {
                1: "Ceorl", // Commoner
                2: "Thegn", // Minor noble
                3: "Ealdorman", // Regional governor
                4: "Earl", // Powerful noble
                5: "King" // Ruler of a kingdom
            },
            territoryNamePattern: "Kingdom of {territory}",
            strengthAttributes: ["fortification", "agriculture", "archery"],
            weaknessAttributes: ["seafaring", "offensive_warfare", "adaptability"],
            specialUnits: ["huscarl", "fyrd", "longbowman"],
            specialBuildings: ["burh", "minster", "motte_and_bailey"],
            priorityResources: ["food", "stone", "wood"],
            expansionStrategy: "defensive",
            npcExpansionChance: 0.2,
            npcRaidChance: 0.1,
            npcDefenseStrength: 1.2,
            religionId: "christianity"
        },
        FRANKISH: {
            id: "frankish",
            name: "Frankish",
            description: "Wealthy realm with powerful central authority and infrastructure.",
            preferredLandmass: "frankia",
            titles: {
                1: "Serf", // Commoner
                2: "Knight", // Minor noble
                3: "Baron", // Local noble
                4: "Count", // Regional ruler
                5: "King" // Ruler of the realm
            },
            territoryNamePattern: "Realm of {territory}",
            strengthAttributes: ["heavy_cavalry", "administration", "wealth"],
            weaknessAttributes: ["naval_warfare", "adaptability", "individual_combat"],
            specialUnits: ["frankish_knight", "levy_spearman", "royal_guard"],
            specialBuildings: ["stone_keep", "cathedral", "royal_mint"],
            priorityResources: ["food", "metal", "stone", "luxury"],
            expansionStrategy: "administrative",
            npcExpansionChance: 0.3,
            npcRaidChance: 0.2,
            npcDefenseStrength: 1.1,
            religionId: "christianity"
        }
    };
    
    const RELIGION_TYPES = {
        NORSE_PAGANISM: {
            id: "norse_paganism",
            name: "Norse Paganism",
            description: "Worship of the Æsir and Vanir gods led by Odin and Thor.",
            holyBuildings: ["temple_of_thor", "odin_shrine", "sacred_grove"],
            specialUnits: ["berserker"],
            territoryBonus: {
                norse: { loyalty: 0.2, warrior_strength: 0.1 },
                anglo_saxon: { loyalty: -0.2, unrest: 0.1 },
                frankish: { loyalty: -0.2, unrest: 0.1 }
            },
            events: ["sacrifice_for_victory", "blot_feast", "divine_omen"]
        },
        CHRISTIANITY: {
            id: "christianity",
            name: "Christianity",
            description: "Monotheistic religion centered around Jesus Christ.",
            holyBuildings: ["church", "monastery", "cathedral"],
            specialUnits: ["crusader_knight"],
            territoryBonus: {
                norse: { loyalty: -0.2, unrest: 0.1 },
                anglo_saxon: { loyalty: 0.2, tax_efficiency: 0.1 },
                frankish: { loyalty: 0.2, tax_efficiency: 0.1 }
            },
            events: ["pilgrimage", "holy_relic_discovery", "monastery_founding"]
        }
    };
    
    // Faction AI behavior patterns
    const FACTION_AI = {
        raiding: {
            preferredTargets: ["wealthy_settlements", "coastal_regions", "religious_centers"],
            offensiveStrategy: "raid_and_retreat",
            resourcePriority: ["loot", "slaves", "territory"],
            settlementPatterns: "coastal_clustering"
        },
        defensive: {
            preferredTargets: ["border_territories", "strategic_locations", "resource_rich_areas"],
            offensiveStrategy: "methodical_conquest",
            resourcePriority: ["territory", "food_production", "defensive_positions"],
            settlementPatterns: "fortified_network"
        },
        administrative: {
            preferredTargets: ["trade_routes", "fertile_lands", "population_centers"],
            offensiveStrategy: "systematic_expansion",
            resourcePriority: ["tax_revenue", "infrastructure", "population"],
            settlementPatterns: "central_planning"
        }
    };
    
    // Private variables
    let factions = [];
    let rulers = [];
    let territories = [];
    let relations = {}; // Stores diplomatic relations between factions
    let playerFaction = null;
    
    // Private methods
    
    /**
     * Generate a ruler name based on faction
     * @param {string} factionId - Faction ID
     * @param {string} gender - Gender of ruler ('male' or 'female')
     * @returns {string} - Generated ruler name
     */
    function generateRulerName(factionId, gender = 'male') {
        // Names for different cultures
        const names = {
            norse: {
                male: ["Ragnar", "Bjorn", "Harald", "Erik", "Ivar", "Olaf", "Leif", "Gunnar", "Rollo", "Sigurd", "Ulf", "Hakon", "Knut", "Orm", "Thorvald"],
                female: ["Astrid", "Freya", "Sigrid", "Thyra", "Ingrid", "Helga", "Gudrun", "Sif", "Ragna", "Svanhild", "Thora", "Bothild", "Estrid", "Hilda", "Signe"],
                epithets: ["the Bold", "Ironside", "the Wise", "Bloodaxe", "Fairhair", "Bluetooth", "the Fearless", "the Red", "the Strong", "Raveneye", "Lothbrok", "Bearslayer", "Strongarm", "the Far-Traveled", "Thunderbolt"]
            },
            anglo_saxon: {
                male: ["Alfred", "Edward", "Athelstan", "Aethelred", "Edmund", "Egbert", "Oswald", "Edwin", "Offa", "Aelfric", "Godwin", "Harold", "Cuthbert", "Eadric", "Wulfstan"],
                female: ["Aethelflaed", "Edith", "Emma", "Elgiva", "Aelfgifu", "Matilda", "Edgiva", "Eadgyth", "Wulfhild", "Godiva", "Hilda", "Rowena", "Judith", "Aelswith", "Wilfreda"],
                epithets: ["the Great", "the Wise", "the Pious", "the Unready", "the Confessor", "the Just", "of Wessex", "the Peaceful", "the Magnificent", "the Fair", "the Steadfast", "the Good", "the Martyr", "the Learned", "Ironarm"]
            },
            frankish: {
                male: ["Charles", "Louis", "Lothair", "Pepin", "Robert", "Hugh", "Philip", "Odo", "Ralph", "Conrad", "Frederick", "Richard", "Theobald", "Bernard", "William"],
                female: ["Adela", "Bertha", "Constance", "Gerberga", "Hedwig", "Richilde", "Ermengarde", "Adelaide", "Beatrice", "Clotilde", "Gisela", "Matilda", "Theodora", "Brunhilda", "Fredegund"],
                epithets: ["the Great", "the Bold", "the Pious", "the Fair", "the Wise", "the Tall", "the Fat", "the Simple", "the Bald", "the Young", "of Paris", "Ironhand", "the Stammerer", "the Good", "the Learned"]
            }
        };
        
        if (!names[factionId]) {
            // Default to Norse if faction not found
            factionId = 'norse';
        }
        
        // Select name parts
        const firstName = names[factionId][gender][Math.floor(Math.random() * names[factionId][gender].length)];
        
        // 70% chance to add an epithet
        if (Math.random() < 0.7) {
            const epithet = names[factionId].epithets[Math.floor(Math.random() * names[factionId].epithets.length)];
            return `${firstName} ${epithet}`;
        }
        
        return firstName;
    }
    
    /**
     * Generate personality traits for a ruler
     * @returns {Object} - Generated personality traits
     */
    function generateRulerPersonality() {
        // Core personality traits
        const ambition = Utils.randomBetween(1, 10);
        const diplomacy = Utils.randomBetween(1, 10);
        const martial = Utils.randomBetween(1, 10);
        const stewardship = Utils.randomBetween(1, 10);
        const intrigue = Utils.randomBetween(1, 10);
        const piety = Utils.randomBetween(1, 10);
        
        // Behavior tendencies
        const aggressiveness = Utils.randomBetween(1, 10);
        const loyalty = Utils.randomBetween(1, 10);
        const generosity = Utils.randomBetween(1, 10);
        const cruelty = Utils.randomBetween(1, 10);
        
        return {
            ambition,
            diplomacy,
            martial,
            stewardship,
            intrigue,
            piety,
            aggressiveness,
            loyalty,
            generosity,
            cruelty
        };
    }
    
    /**
     * Generate initial diplomatic relations between factions
     * @param {Array} factionsList - List of factions
     * @returns {Object} - Relations object
     */
    function generateInitialRelations(factionsList) {
        const relationObj = {};
        
        factionsList.forEach(faction1 => {
            relationObj[faction1.id] = {};
            
            factionsList.forEach(faction2 => {
                if (faction1.id === faction2.id) {
                    // Same faction, always friendly
                    relationObj[faction1.id][faction2.id] = 100;
                } else {
                    // Base relation value with some randomness
                    let baseRelation = 0;
                    
                    // Adjust based on faction types
                    // Same culture groups are more friendly
                    if (faction1.type === faction2.type) {
                        baseRelation += 20;
                    }
                    
                    // Religious differences cause tension
                    if (FACTION_TYPES[faction1.type.toUpperCase()].religionId !== 
                        FACTION_TYPES[faction2.type.toUpperCase()].religionId) {
                        baseRelation -= 30;
                    }
                    
                    // Geography matters - neighboring factions have more interactions
                    if (faction1.neighbors.includes(faction2.id)) {
                        // Neighboring can be good or bad depending on expansion strategy
                        if (FACTION_TYPES[faction1.type.toUpperCase()].expansionStrategy === 'raiding' &&
                            FACTION_TYPES[faction2.type.toUpperCase()].expansionStrategy === 'defensive') {
                            // Raiders vs defenders - negative relations
                            baseRelation -= 20;
                        } else if (FACTION_TYPES[faction1.type.toUpperCase()].expansionStrategy === 
                                   FACTION_TYPES[faction2.type.toUpperCase()].expansionStrategy) {
                            // Similar strategies might compete
                            baseRelation -= 10;
                        } else {
                            // Different strategies might complement
                            baseRelation += 10;
                        }
                    }
                    
                    // Add randomness
                    baseRelation += Utils.randomBetween(-20, 20);
                    
                    // Clamp to range
                    relationObj[faction1.id][faction2.id] = Math.max(-100, Math.min(100, baseRelation));
                }
            });
        });
        
        return relationObj;
    }
    
    /**
     * Create territory name for a faction
     * @param {Object} faction - Faction object
     * @param {string} regionName - Name of the main region
     * @returns {string} - Generated territory name
     */
    function createTerritoryName(faction, regionName) {
        const factionType = FACTION_TYPES[faction.type.toUpperCase()];
        if (!factionType) return `${regionName} Territory`;
        
        let pattern = factionType.territoryNamePattern || "{territory}";
        
        // Replace {ruler} with ruler's name if applicable
        if (pattern.includes("{ruler}") && faction.rulerId) {
            const ruler = rulers.find(r => r.id === faction.rulerId);
            if (ruler) {
                pattern = pattern.replace("{ruler}", ruler.name);
            }
        }
        
        // Replace {territory} with region name
        pattern = pattern.replace("{territory}", regionName);
        
        return pattern;
    }
    
    /**
     * Generate AI factions across the world
     * @param {Object} worldData - World data from WorldGenerator
     * @returns {Array} - Generated factions, rulers, and territories
     */
    function generateAIFactions(worldData) {
        const generatedFactions = [];
        const generatedRulers = [];
        const generatedTerritories = [];
        
        // Create major factions for each landmass
        worldData.landmasses.forEach(landmass => {
            const landmassType = landmass.type.toUpperCase();
            let preferredFactionType;
            
            // Determine preferred faction type for this landmass
            for (const type in FACTION_TYPES) {
                if (FACTION_TYPES[type].preferredLandmass === landmass.type) {
                    preferredFactionType = FACTION_TYPES[type].id;
                    break;
                }
            }
            
            if (!preferredFactionType) {
                preferredFactionType = 'norse'; // Default
            }
            
            // Number of major factions on this landmass (1-5 based on size)
            const numMajorFactions = Math.max(1, Math.min(5, Math.floor(landmass.size / 50)));
            
            // Create major factions
            for (let i = 0; i < numMajorFactions; i++) {
                // Generate ruler
                const ruler = {
                    id: `ruler_${preferredFactionType}_${i}_${Date.now()}`,
                    name: generateRulerName(preferredFactionType),
                    title: FACTION_TYPES[preferredFactionType.toUpperCase()].titles[
                        Math.min(5, Math.max(3, 3 + Math.floor(i / 2))) // Rank 3-5 for major factions
                    ],
                    gender: Math.random() > 0.8 ? 'female' : 'male', // 20% female rulers
                    age: Utils.randomBetween(25, 60),
                    personality: generateRulerPersonality(),
                    factionId: null, // To be set
                    wealth: Utils.randomBetween(500, 2000) * Math.max(3, Math.min(5, 3 + Math.floor(i / 2))), // More wealth for higher ranks
                    prestige: Utils.randomBetween(100, 500) * Math.max(3, Math.min(5, 3 + Math.floor(i / 2))), // More prestige for higher ranks
                    traits: []
                };
                
                generatedRulers.push(ruler);
                
                // Find suitable regions for this faction's territory
                const regionPool = worldData.regions.filter(r => 
                    r.landmassId === landmass.id && 
                    !r.ownerId && 
                    (r.type === 'plains' || r.type === 'coastline') // Prefer good settlement locations
                );
                
                if (regionPool.length === 0) continue; // Skip if no suitable regions
                
                // Select a random region as capital
                const capitalRegionIndex = Math.floor(Math.random() * regionPool.length);
                const capitalRegion = regionPool[capitalRegionIndex];
                
                // Create faction
                const faction = {
                    id: `faction_${preferredFactionType}_${i}_${Date.now()}`,
                    name: `${ruler.name}'s Domain`,
                    type: preferredFactionType,
                    rulerId: ruler.id,
                    capitalRegionId: capitalRegion.id,
                    territoryIds: [],
                    subFactionIds: [],
                    parentFactionId: null,
                    strength: Utils.randomBetween(50, 100) * Math.max(3, Math.min(5, 3 + Math.floor(i / 2))), // More strength for higher ranks
                    wealth: ruler.wealth * 2, // Faction wealth is greater than ruler personal wealth
                    militaryUnits: {},
                    neighbors: [],
                    isPlayerFaction: false
                };
                
                // Update ruler with faction ID
                ruler.factionId = faction.id;
                
                // Create territory
                const territory = {
                    id: `territory_${faction.id}_${Date.now()}`,
                    name: createTerritoryName(faction, capitalRegion.name),
                    factionId: faction.id,
                    regionIds: [capitalRegion.id],
                    mainRegionId: capitalRegion.id,
                    loyalty: Utils.randomBetween(60, 90), // Base loyalty
                    prosperity: Utils.randomBetween(40, 80), // Base prosperity
                    tax: 10, // Base tax rate (%)
                    unrest: Utils.randomBetween(0, 20), // Base unrest
                    hasRebellion: false
                };
                
                // Update region ownership
                capitalRegion.ownerId = faction.id;
                
                // Add territory to faction
                faction.territoryIds.push(territory.id);
                
                // Add some adjacent regions to the territory (simulates existing kingdoms)
                const numAdditionalRegions = Utils.randomBetween(2, 10); // Major factions have larger territories
                let regionsAdded = 1; // Already added capital
                
                // Simple expansion algorithm
                const expandQueue = [...capitalRegion.neighbors];
                const addedRegions = new Set([capitalRegion.id]);
                
                while (expandQueue.length > 0 && regionsAdded < numAdditionalRegions) {
                    const nextRegionId = expandQueue.shift();
                    if (addedRegions.has(nextRegionId)) continue;
                    
                    const nextRegion = worldData.regions.find(r => r.id === nextRegionId);
                    if (!nextRegion || nextRegion.ownerId) continue;
                    
                    // Add region to territory
                    territory.regionIds.push(nextRegion.id);
                    nextRegion.ownerId = faction.id;
                    addedRegions.add(nextRegion.id);
                    regionsAdded++;
                    
                    // Add neighbors to queue
                    nextRegion.neighbors.forEach(neighborId => {
                        if (!addedRegions.has(neighborId)) {
                            expandQueue.push(neighborId);
                        }
                    });
                }
                
                generatedFactions.push(faction);
                generatedTerritories.push(territory);
            }
            
            // Create minor factions/settlements (chieftains, minor nobles, etc.)
            const numMinorFactions = Math.floor(landmass.size / 20); // More minor factions
            
            // Find unclaimed regions
            const unclaimedRegions = worldData.regions.filter(r => 
                r.landmassId === landmass.id && !r.ownerId
            );
            
            for (let i = 0; i < Math.min(numMinorFactions, unclaimedRegions.length); i++) {
                // Pick a random unclaimed region
                const regionIndex = Math.floor(Math.random() * unclaimedRegions.length);
                const region = unclaimedRegions[regionIndex];
                
                // Remove from unclaimed list
                unclaimedRegions.splice(regionIndex, 1);
                
                // 80% chance to use preferred faction type, 20% chance for a different type
                let factionType = preferredFactionType;
                if (Math.random() > 0.8) {
                    const types = Object.keys(FACTION_TYPES).map(t => FACTION_TYPES[t].id).filter(t => t !== preferredFactionType);
                    if (types.length > 0) {
                        factionType = types[Math.floor(Math.random() * types.length)];
                    }
                }
                
                // Generate minor ruler
                const ruler = {
                    id: `ruler_minor_${factionType}_${i}_${Date.now()}`,
                    name: generateRulerName(factionType),
                    title: FACTION_TYPES[factionType.toUpperCase()].titles[
                        Math.min(3, Math.max(1, 1 + Math.floor(Math.random() * 3))) // Rank 1-3 for minor factions
                    ],
                    gender: Math.random() > 0.8 ? 'female' : 'male', // 20% female rulers
                    age: Utils.randomBetween(20, 70),
                    personality: generateRulerPersonality(),
                    factionId: null, // To be set
                    wealth: Utils.randomBetween(50, 500),
                    prestige: Utils.randomBetween(10, 100),
                    traits: []
                };
                
                generatedRulers.push(ruler);
                
                // Create minor faction
                const faction = {
                    id: `faction_minor_${factionType}_${i}_${Date.now()}`,
                    name: `${ruler.name}'s Homestead`,
                    type: factionType,
                    rulerId: ruler.id,
                    capitalRegionId: region.id,
                    territoryIds: [],
                    subFactionIds: [],
                    parentFactionId: null, // May be assigned to a major faction later
                    strength: Utils.randomBetween(10, 50),
                    wealth: ruler.wealth * 1.5,
                    militaryUnits: {},
                    neighbors: [],
                    isPlayerFaction: false
                };
                
                // Update ruler with faction ID
                ruler.factionId = faction.id;
                
                // Create territory
                const territory = {
                    id: `territory_${faction.id}_${Date.now()}`,
                    name: `${ruler.name}'s Land`,
                    factionId: faction.id,
                    regionIds: [region.id],
                    mainRegionId: region.id,
                    loyalty: Utils.randomBetween(50, 70),
                    prosperity: Utils.randomBetween(30, 60),
                    tax: 5, // Lower tax for minor factions
                    unrest: Utils.randomBetween(0, 30),
                    hasRebellion: false
                };
                
                // Update region ownership
                region.ownerId = faction.id;
                
                // Add territory to faction
                faction.territoryIds.push(territory.id);
                
                // 30% chance to add one adjacent region
                if (Math.random() < 0.3) {
                    const adjacentRegionIds = region.neighbors.filter(id => {
                        const neighborRegion = worldData.regions.find(r => r.id === id);
                        return neighborRegion && !neighborRegion.ownerId;
                    });
                    
                    if (adjacentRegionIds.length > 0) {
                        const adjacentRegionId = adjacentRegionIds[Math.floor(Math.random() * adjacentRegionIds.length)];
                        const adjacentRegion = worldData.regions.find(r => r.id === adjacentRegionId);
                        
                        territory.regionIds.push(adjacentRegionId);
                        adjacentRegion.ownerId = faction.id;
                        
                        // Remove from unclaimed regions if present
                        const unclaimed_idx = unclaimedRegions.findIndex(r => r.id === adjacentRegionId);
                        if (unclaimed_idx >= 0) {
                            unclaimedRegions.splice(unclaimed_idx, 1);
                        }
                    }
                }
                
                generatedFactions.push(faction);
                generatedTerritories.push(territory);
            }
        });
        
        // Setup faction neighbors
        generatedFactions.forEach(faction => {
            // Get all regions owned by this faction
            const factionRegionIds = generatedTerritories
                .filter(t => t.factionId === faction.id)
                .flatMap(t => t.regionIds);
            
            // Find all adjacent factions
            const neighborFactionIds = new Set();
            
            factionRegionIds.forEach(regionId => {
                const region = worldData.regions.find(r => r.id === regionId);
                if (!region) return;
                
                region.neighbors.forEach(neighborId => {
                    const neighborRegion = worldData.regions.find(r => r.id === neighborId);
                    if (!neighborRegion || !neighborRegion.ownerId || neighborRegion.ownerId === faction.id) return;
                    
                    neighborFactionIds.add(neighborRegion.ownerId);
                });
            });
            
            faction.neighbors = Array.from(neighborFactionIds);
        });
        
        return { generatedFactions, generatedRulers, generatedTerritories };
    }
    
    // Public API
    return {
        /**
         * Initialize the faction manager
         */
        init: function() {
            console.log("Faction Manager initialized");
        },
        
        /**
         * Generate factions for a world
         * @param {Object} worldData - World data from WorldGenerator
         * @returns {Object} - Generated faction data
         */
        generateFactions: function(worldData) {
            console.log("Generating factions...");
            
            // Reset faction data
            factions = [];
            rulers = [];
            territories = [];
            playerFaction = null;
            
            // Generate AI factions
            const { generatedFactions, generatedRulers, generatedTerritories } = generateAIFactions(worldData);
            
            factions = generatedFactions;
            rulers = generatedRulers;
            territories = generatedTerritories;
            
            // Generate diplomatic relations
            relations = generateInitialRelations(factions);
            
            console.log(`Generated ${factions.length} factions with ${rulers.length} rulers controlling ${territories.length} territories.`);
            
            return {
                factions,
                rulers,
                territories,
                relations
            };
        },
        
        /**
         * Create a new player faction
         * @param {Object} startingRegion - Starting region from WorldGenerator
         * @param {Object} ruler - Player ruler information (name, gender)
         * @returns {Object} - Player faction data
         */
        createPlayerFaction: function(startingRegion, ruler) {
            if (!startingRegion) {
                console.error("No starting region provided");
                return null;
            }
            
            // Create player ruler
            const playerRuler = {
                id: `player_ruler_${Date.now()}`,
                name: ruler.name || generateRulerName('norse', ruler.gender || 'male'),
                title: FACTION_TYPES.NORSE.titles[1], // Start as lowest rank
                gender: ruler.gender || 'male',
                age: ruler.age || 25,
                personality: ruler.personality || generateRulerPersonality(),
                factionId: null, // To be set
                wealth: 100, // Starting wealth
                prestige: 0, // Starting prestige
                traits: ruler.traits || []
            };
            
            // Create player faction
            const playerFactionId = `player_faction_${Date.now()}`;
            playerFaction = {
                id: playerFactionId,
                name: `${playerRuler.name}'s Clan`,
                type: 'norse', // Start as Norse
                rulerId: playerRuler.id,
                capitalRegionId: startingRegion.id,
                territoryIds: [],
                subFactionIds: [],
                parentFactionId: null,
                strength: 50, // Starting strength
                wealth: playerRuler.wealth * 1.5,
                militaryUnits: {},
                neighbors: [],
                isPlayerFaction: true
            };
            
            // Update ruler with faction ID
            playerRuler.factionId = playerFactionId;
            
            // Create player territory
            const playerTerritory = {
                id: `player_territory_${Date.now()}`,
                name: `${playerRuler.name}'s Homestead`,
                factionId: playerFactionId,
                regionIds: [startingRegion.id],
                mainRegionId: startingRegion.id,
                loyalty: 100, // Your people are loyal to you
                prosperity: 40, // Starting prosperity
                tax: 0, // No tax initially
                unrest: 0, // No unrest initially
                hasRebellion: false
            };
            
            // Update region ownership
            startingRegion.ownerId = playerFactionId;
            
            // Add territory to faction
            playerFaction.territoryIds.push(playerTerritory.id);
            
            // Add to global lists
            factions.push(playerFaction);
            rulers.push(playerRuler);
            territories.push(playerTerritory);
            
            // Update faction neighbors
            this.updateFactionNeighbors(playerFaction.id, worldData);
            
            // Add to diplomatic relations
            relations[playerFactionId] = {};
            factions.forEach(faction => {
                if (faction.id === playerFactionId) {
                    relations[playerFactionId][playerFactionId] = 100; // Self-relation
                } else {
                    // Initial relations with other factions
                    if (faction.type === 'norse') {
                        // Better relations with other Norse factions
                        relations[playerFactionId][faction.id] = Utils.randomBetween(0, 50);
                    } else {
                        // Cautious relations with non-Norse
                        relations[playerFactionId][faction.id] = Utils.randomBetween(-20, 20);
                    }
                    
                    // Add reciprocal relation
                    if (!relations[faction.id]) {
                        relations[faction.id] = {};
                    }
                    relations[faction.id][playerFactionId] = relations[playerFactionId][faction.id];
                }
            });
            
            console.log(`Player faction created: ${playerFaction.name}`);
            
            return {
                faction: playerFaction,
                ruler: playerRuler,
                territory: playerTerritory
            };
        },
        
        /**
         * Update faction neighbors based on current territory
         * @param {string} factionId - Faction ID to update
         * @param {Object} worldData - World data
         */
        updateFactionNeighbors: function(factionId, worldData) {
            const faction = factions.find(f => f.id === factionId);
            if (!faction) return;
            
            // Get all regions owned by this faction
            const factionRegionIds = territories
                .filter(t => t.factionId === faction.id)
                .flatMap(t => t.regionIds);
            
            // Find all adjacent factions
            const neighborFactionIds = new Set();
            
            factionRegionIds.forEach(regionId => {
                const region = worldData.regions.find(r => r.id === regionId);
                if (!region) return;
                
                region.neighbors.forEach(neighborId => {
                    const neighborRegion = worldData.regions.find(r => r.id === neighborId);
                    if (!neighborRegion || !neighborRegion.ownerId || neighborRegion.ownerId === faction.id) return;
                    
                    neighborFactionIds.add(neighborRegion.ownerId);
                });
            });
            
            faction.neighbors = Array.from(neighborFactionIds);
        },
        
        /**
         * Get faction by ID
         * @param {string} factionId - Faction ID
         * @returns {Object|null} - Faction object or null if not found
         */
        getFactionById: function(factionId) {
            return factions.find(f => f.id === factionId) || null;
        },
        
        /**
         * Get all factions
         * @returns {Array} - Array of faction objects
         */
        getFactions: function() {
            return [...factions];
        },
        
        /**
         * Get ruler by ID
         * @param {string} rulerId - Ruler ID
         * @returns {Object|null} - Ruler object or null if not found
         */
        getRulerById: function(rulerId) {
            return rulers.find(r => r.id === rulerId) || null;
        },
        
        /**
         * Get territory by ID
         * @param {string} territoryId - Territory ID
         * @returns {Object|null} - Territory object or null if not found
         */
        getTerritoryById: function(territoryId) {
            return territories.find(t => t.id === territoryId) || null;
        },
        
        /**
         * Get faction controlling a region
         * @param {string} regionId - Region ID
         * @returns {Object|null} - Faction object or null if region is uncontrolled
         */
        getFactionControllingRegion: function(regionId) {
            const region = WorldGenerator.getRegionById(regionId);
            if (!region || !region.ownerId) return null;
            
            return this.getFactionById(region.ownerId);
        },
        
        /**
         * Get player faction
         * @returns {Object|null} - Player faction or null if not created
         */
        getPlayerFaction: function() {
            return playerFaction;
        },
        
        /**
         * Get diplomatic relation between two factions
         * @param {string} faction1Id - First faction ID
         * @param {string} faction2Id - Second faction ID
         * @returns {number} - Relation value (-100 to 100)
         */
        getRelation: function(faction1Id, faction2Id) {
            if (!relations[faction1Id] || !relations[faction1Id][faction2Id]) {
                return 0; // Default neutral
            }
            
            return relations[faction1Id][faction2Id];
        },
        
        /**
         * Modify relation between two factions
         * @param {string} faction1Id - First faction ID
         * @param {string} faction2Id - Second faction ID
         * @param {number} change - Change in relation value
         * @returns {number} - New relation value
         */
        modifyRelation: function(faction1Id, faction2Id, change) {
            if (!relations[faction1Id]) {
                relations[faction1Id] = {};
            }
            
            if (!relations[faction1Id][faction2Id]) {
                relations[faction1Id][faction2Id] = 0;
            }
            
            relations[faction1Id][faction2Id] += change;
            
            // Clamp to range
            relations[faction1Id][faction2Id] = Math.max(-100, Math.min(100, relations[faction1Id][faction2Id]));
            
            // Update reciprocal relation (but by half as much)
            if (!relations[faction2Id]) {
                relations[faction2Id] = {};
            }
            
            if (!relations[faction2Id][faction1Id]) {
                relations[faction2Id][faction1Id] = 0;
            }
            
            relations[faction2Id][faction1Id] += change / 2;
            
            // Clamp to range
            relations[faction2Id][faction1Id] = Math.max(-100, Math.min(100, relations[faction2Id][faction1Id]));
            
            return relations[faction1Id][faction2Id];
        },
        
        /**
         * Process faction AI tick
         * @param {number} daysPassed - Number of days passed
         * @param {Object} worldData - World data
         */
        processTick: function(daysPassed, worldData) {
            // Skip player faction
            const aiFactions = factions.filter(f => !f.isPlayerFaction);
            
            // Process each AI faction
            aiFactions.forEach(faction => {
                const factionConfig = FACTION_TYPES[faction.type.toUpperCase()];
                
                if (!factionConfig) return;
                
                // Get faction's expansion strategy
                const strategy = factionConfig.expansionStrategy;
                const aiPattern = FACTION_AI[strategy];
                
                if (!aiPattern) return;
                
                // Process based on strategy
                switch (strategy) {
                    case 'raiding':
                        // Check for raid opportunity
                        if (Math.random() < factionConfig.npcRaidChance * (daysPassed / 30)) {
                            this.processRaidOpportunity(faction, worldData);
                        }
                        break;
                        
                    case 'defensive':
                        // Focus on defense and slow expansion
                        if (Math.random() < factionConfig.npcExpansionChance * (daysPassed / 60)) {
                            this.processExpansionOpportunity(faction, worldData);
                        }
                        break;
                        
                    case 'administrative':
                        // Focus on infrastructure and steady expansion
                        if (Math.random() < factionConfig.npcExpansionChance * (daysPassed / 45)) {
                            this.processExpansionOpportunity(faction, worldData);
                        }
                        break;
                }
                
                // Process ruler age and succession
                const ruler = this.getRulerById(faction.rulerId);
                if (ruler) {
                    // Age the ruler
                    ruler.age += daysPassed / 365;
                    
                    // Check for natural death (simplified)
                    const deathChance = Math.pow(ruler.age / 80, 2) * (daysPassed / 365);
                    if (Math.random() < deathChance) {
                        this.processRulerDeath(ruler, faction, worldData);
                    }
                }
                
                // Process territory prosperity and unrest
                faction.territoryIds.forEach(territoryId => {
                    const territory = this.getTerritoryById(territoryId);
                    if (!territory) return;
                    
                    // Adjust prosperity based on territory features
                    const prosperityChange = (daysPassed / 30) * (Math.random() * 2 - 0.5); // -0.5 to 1.5 per month
                    territory.prosperity = Math.max(10, Math.min(100, territory.prosperity + prosperityChange));
                    
                    // Adjust unrest based on tax and loyalty
                    const taxFactor = territory.tax / 10; // Higher tax increases unrest
                    const loyaltyFactor = territory.loyalty / 100; // Higher loyalty decreases unrest
                    
                    const unrestChange = (daysPassed / 30) * (taxFactor - loyaltyFactor + (Math.random() * 0.4 - 0.2)); // -0.2 to 0.2 random
                    territory.unrest = Math.max(0, Math.min(100, territory.unrest + unrestChange));
                    
                    // Check for rebellion
                    if (!territory.hasRebellion && territory.unrest > 80 && Math.random() < (territory.unrest - 80) / 100) {
                        this.processRebellion(territory, faction, worldData);
                    }
                });
            });
        },
        
        /**
         * Process raid opportunity for a faction
         * @param {Object} faction - Raiding faction
         * @param {Object} worldData - World data
         */
        processRaidOpportunity: function(faction, worldData) {
            // Implementation would select targets, calculate raid success, adjust relations, etc.
            console.log(`${faction.name} is considering a raid opportunity`);
        },
        
        /**
         * Process expansion opportunity for a faction
         * @param {Object} faction - Expanding faction
         * @param {Object} worldData - World data
         */
        processExpansionOpportunity: function(faction, worldData) {
            // Implementation would select expansion targets, calculate success, etc.
            console.log(`${faction.name} is considering an expansion opportunity`);
        },
        
        /**
         * Process ruler death and succession
         * @param {Object} ruler - Deceased ruler
         * @param {Object} faction - Ruler's faction
         * @param {Object} worldData - World data
         */
        processRulerDeath: function(ruler, faction, worldData) {
            // Implementation would handle succession, potential splits, etc.
            console.log(`Ruler ${ruler.name} of ${faction.name} has died`);
        },
        
        /**
         * Process territory rebellion
         * @param {Object} territory - Rebelling territory
         * @param {Object} faction - Territory's faction
         * @param {Object} worldData - World data
         */
        processRebellion: function(territory, faction, worldData) {
            // Implementation would handle rebellion outcomes, new factions, etc.
            console.log(`Rebellion in ${territory.name} against ${faction.name}`);
        }
    };
})();