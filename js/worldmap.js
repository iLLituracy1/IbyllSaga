/**
 * Viking Legacy - World Map System
 * Handles world generation, regions, landmasses, and AI entities
 */

const WorldMap = (function() {
    // Private variables
    let worldMap = {
        landmasses: [],
        regions: [],
        settlements: [],
        playerRegion: null,
        playerLandmass: null,
        mapSize: { width: 800, height: 600 } // Default map size in arbitrary units
    };
    
    // Landmass types
    const LANDMASS_TYPES = {
        VIKING_HOMELAND: "Viking Homeland",
        ANGLO_LANDS: "Britannia",     // Not-England
        FRANKISH_LANDS: "Frankia", // Not-France
        NEUTRAL_LANDS: "Neutral Lands"
    };
    
    // Region types with resource modifiers
    
// Region types with resource modifiers (extended)
const REGION_TYPES = {
    FOREST: {
        name: "Forest",
        resourceModifiers: {
            // Basic resources
            food: 1.2,
            wood: 1.5,
            stone: 0.8,
            metal: 0.7,
            // Advanced resources
            leather: 1.3, // Hunting in forests
            fur: 1.5,     // More animals for fur
            cloth: 0.8,   // Not much cloth production in forests
            clay: 0.7,    // Limited clay deposits
            pitch: 1.4,   // Pine trees produce good pitch
            salt: 0.5,    // Limited salt deposits
            honey: 1.3,   // Wild beehives
            herbs: 1.8,   // Rich in medicinal plants
            // Wealth resources - generally not directly produced
            // Environmental resources
            peat: 0.0,    // No peat in forests
            whale_oil: 0.0, // Inland, no whales
            ice: 0.0       // No ice preservation
        },
        description: "Dense forests provide ample wood, herbs, and hunting but make mining difficult."
    },
    
    PLAINS: {
        name: "Plains",
        resourceModifiers: {
            // Basic resources
            food: 1.3,
            wood: 0.7,
            stone: 0.9,
            metal: 0.8,
            // Advanced resources
            leather: 1.0, // Some hunting
            fur: 0.8,     // Limited fur animals
            cloth: 1.5,   // Good for crops for cloth
            clay: 1.3,    // Good clay deposits along rivers
            pitch: 0.5,   // Limited pitch production
            salt: 0.8,    // Some salt deposits
            honey: 1.2,   // Beekeeping possible
            herbs: 1.2,   // Some medicinal plants
            // Environmental resources
            peat: 0.8,    // Some peat in wetter areas
            whale_oil: 0.0, // Inland, no whales
            ice: 0.0       // No ice preservation
        },
        description: "Fertile plains ideal for farming, cloth production, and settlement."
    },
    
    MOUNTAINS: {
        name: "Mountains",
        resourceModifiers: {
            // Basic resources
            food: 0.7,
            wood: 0.8,
            stone: 1.5,
            metal: 1.7,
            // Advanced resources
            leather: 0.7, // Limited hunting
            fur: 1.0,     // Mountain animals provide fur
            cloth: 0.5,   // Poor conditions for crops
            clay: 0.8,    // Some clay deposits
            pitch: 0.7,   // Limited pitch production
            salt: 1.5,    // Salt deposits in mountains
            honey: 0.5,   // Limited beekeeping
            herbs: 1.4,   // Specialized mountain herbs
            // Environmental resources
            peat: 0.0,    // No peat in mountains
            whale_oil: 0.0, // Inland, no whales
            ice: 1.0       // Ice preservation possible in high mountains
        },
        description: "Rich in stone, metals, and salt, but farming and cloth production are difficult."
    },
    
    COASTAL: {
        name: "Coastal",
        resourceModifiers: {
            // Basic resources
            food: 1.3,
            wood: 1.0,
            stone: 1.0,
            metal: 0.7,
            // Advanced resources
            leather: 0.8, // Some hunting
            fur: 0.7,     // Limited fur animals
            cloth: 1.0,   // Average cloth production
            clay: 1.5,    // Good clay deposits in coastal areas
            pitch: 1.0,   // Average pitch production
            salt: 2.0,    // Excellent for salt production from seawater
            honey: 0.8,   // Some beekeeping
            herbs: 0.9,   // Some coastal herbs
            // Environmental resources
            peat: 0.5,    // Some peat in coastal marshes
            whale_oil: 1.5, // Whale hunting possible
            ice: 0.0       // Generally too warm for ice preservation
        },
        description: "Coastal regions provide excellent fishing, salt production, and trade opportunities."
    },
    
    FJORD: {
        name: "Fjord",
        resourceModifiers: {
            // Basic resources
            food: 1.1,
            wood: 1.2,
            stone: 1.2,
            metal: 0.9,
            // Advanced resources
            leather: 1.0, // Average hunting
            fur: 1.2,     // Good fur hunting
            cloth: 0.8,   // Limited cloth production
            clay: 1.0,    // Average clay deposits
            pitch: 1.2,   // Good pitch production
            salt: 1.5,    // Good salt production from seawater
            honey: 0.7,   // Limited beekeeping
            herbs: 1.0,   // Average herbs
            // Environmental resources
            peat: 0.5,    // Some peat in marshy areas
            whale_oil: 2.0, // Excellent whale hunting in fjords
            ice: 1.5       // Good ice preservation in northern fjords
        },
        description: "Sheltered waterways with access to both sea and land resources, excellent for whale hunting."
    }
};
    
    // Settlement types
    const SETTLEMENT_TYPES = {
        VIKING: "Viking",
        ANGLO: "Anglo",
        FRANKISH: "Frankish",
        NEUTRAL: "Neutral"
    };
    
    // Settlement structure - used to create AI settlements
    const settlementTemplate = {
        id: "",
        name: "",
        type: "",
        position: { x: 0, y: 0 },
        region: null,
        landmass: null,
        resources: {},
        population: 0,
        buildings: {},
        military: {
            warriors: 0,
            ships: 0,
            defenses: 0
        },
        relations: {}, // Relations with other settlements, including player
        faction: "", // Which faction this settlement belongs to
        rank: 0, // Similar to player ranks
        isPlayer: false
    };
    
    // Private methods
    
    /**
     * Generate a random name for a region or settlement based on its type
     * @param {string} type - Type of region or settlement
     * @returns {string} - Generated name
     */
    function generateName(type) {
        const vikingPrefixes = ["Thor", "Odin", "Fjord", "Nord", "Frost", "Vald", "Heim", "Björn"];
        const vikingSuffixes = ["heim", "vík", "gard", "borg", "strand", "fjord", "dal", "ness"];
        
        const angloSaxonPrefixes = ["Wes", "East", "North", "Sud", "Wood", "Win", "Ash", "Ox"];
        const angloSaxonSuffixes = ["ton", "ford", "bury", "ham", "wick", "shire", "field", "wold"];
        
        const frankishPrefixes = ["Beau", "Mont", "Saint", "Neu", "Roche", "Ville", "Clair", "Grand"];
        const frankishSuffixes = ["mont", "ville", "bourg", "court", "valleé", "champs", "fort", "lac"];
        
        let prefixes, suffixes;
        
        switch (type) {
            case SETTLEMENT_TYPES.VIKING:
            case LANDMASS_TYPES.VIKING_HOMELAND:
                prefixes = vikingPrefixes;
                suffixes = vikingSuffixes;
                break;
            case SETTLEMENT_TYPES.ANGLO:
            case LANDMASS_TYPES.ANGLO_LANDS:
                prefixes = angloSaxonPrefixes;
                suffixes = angloSaxonSuffixes;
                break;
            case SETTLEMENT_TYPES.FRANKISH:
            case LANDMASS_TYPES.FRANKISH_LANDS:
                prefixes = frankishPrefixes;
                suffixes = frankishSuffixes;
                break;
            default:
                // Mix of styles for neutral areas
                prefixes = [...vikingPrefixes, ...angloSaxonPrefixes, ...frankishPrefixes];
                suffixes = [...vikingSuffixes, ...angloSaxonSuffixes, ...frankishSuffixes];
        }
        
        const prefix = prefixes[Utils.randomBetween(0, prefixes.length - 1)];
        const suffix = suffixes[Utils.randomBetween(0, suffixes.length - 1)];
        
        return prefix + suffix;
    }
    
    /**
     * Generate a landmass
     * @param {string} type - Type of landmass
     * @param {Object} position - Position of the landmass center
     * @param {number} size - Size of the landmass
     * @returns {Object} - Generated landmass
     */
    function generateLandmass(type, position, size) {
        const landmass = {
            id: `landmass_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: generateName(type),
            type: type,
            position: position,
            size: size,
            regions: [],
            settlements: []
        };
        
        return landmass;
    }
    
    /**
     * Generate a region within a landmass
     * @param {Object} landmass - Parent landmass
     * @param {string} type - Region type
     * @param {Object} position - Position of the region
     * @param {number} size - Size of the region
     * @returns {Object} - Generated region
     */
    function generateRegion(landmass, type, position, size) {
        const regionType = REGION_TYPES[type];
        
        if (!regionType) {
            console.error(`Unknown region type: ${type}`);
            return null;
        }
        
        const region = {
            id: `region_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: generateName(landmass.type) + " " + regionType.name,
            type: type,
            typeName: regionType.name,
            position: position,
            size: size,
            landmass: landmass.id,
            resourceModifiers: regionType.resourceModifiers,
            description: regionType.description,
            settlements: []
        };
        
        return region;
    }
    
    
    /**
 * Generate a settlement within a region
 * @param {Object} region - Parent region
 * @param {string} type - Settlement type
 * @param {Object} position - Position of the settlement
 * @param {boolean} isPlayer - Whether this is the player's settlement
 * @returns {Object} - Generated settlement
 */
function generateSettlement(region, type, position, isPlayer = false) {
    const landmass = worldMap.landmasses.find(lm => lm.id === region.landmass);
    
    if (!landmass) {
        console.error(`Landmass not found for region: ${region.id}`);
        return null;
    }
    
    // Basic resources based on region modifiers
    const baseResources = {
        food: Utils.randomBetween(30, 70) * region.resourceModifiers.food,
        wood: Utils.randomBetween(20, 50) * region.resourceModifiers.wood,
        stone: Utils.randomBetween(10, 30) * region.resourceModifiers.stone,
        metal: Utils.randomBetween(5, 15) * region.resourceModifiers.metal
    };
    
    // Initialize with random starting population based on type
    let initialPopulation;
    let initialRank;
    let militaryStrength;
    
    if (isPlayer) {
        // FIXED: Get initial warrior count from Population object if it exists
        let initialWarriors = 1; // Default fallback value
        
        // Check if PopulationManager is initialized and get warriors value
        if (typeof window.PopulationManager !== 'undefined' && 
            typeof PopulationManager.getPopulation === 'function') {
            const pop = PopulationManager.getPopulation();
            if (pop && typeof pop.warriors === 'number') {
                initialWarriors = pop.warriors;
                console.log(`Using ${initialWarriors} warriors from population for player settlement`);
            }
        }
        
        // Use existing player values with potentially customized warriors
        initialPopulation = 5; // Player starts with 5
        initialRank = 0; // Lowest rank
        militaryStrength = {
            warriors: initialWarriors,
            ships: 0,
            defenses: 0
        };
    } else {
        // AI settlement - more established
        switch (type) {
            case SETTLEMENT_TYPES.VIKING:
                initialPopulation = Utils.randomBetween(45, 55);
                initialRank = Utils.randomBetween(0, 5);
                militaryStrength = {
                    warriors: Utils.randomBetween(40, 45),
                    ships: Utils.randomBetween(0, 2),
                    defenses: Utils.randomBetween(0, 2)
                };
                break;
                case SETTLEMENT_TYPES.ANGLO:
                    initialPopulation = Utils.randomBetween(60, 120);
                    initialRank = Utils.randomBetween(0, 5);
                    militaryStrength = {
                        warriors: Utils.randomBetween(10, 15),
                        ships: Utils.randomBetween(0, 2),
                        defenses: Utils.randomBetween(2, 3) // Somewhat defensive
                    };
                    break;
            case SETTLEMENT_TYPES.FRANKISH:
                initialPopulation = Utils.randomBetween(160, 250);
                initialRank = Utils.randomBetween(2, 7);
                militaryStrength = {
                    warriors: Utils.randomBetween(10, 20),
                    ships: Utils.randomBetween(0, 1),
                    defenses: Utils.randomBetween(5, 10) // Higher defenses
                };
                break;
            default: // Neutral
                initialPopulation = Utils.randomBetween(20, 50);
                initialRank = Utils.randomBetween(0, 3);
                militaryStrength = {
                    warriors: Utils.randomBetween(1, 3),
                    ships: Utils.randomBetween(0, 1),
                    defenses: Utils.randomBetween(1, 3)
                };
        }
    }
    
    const settlement = Object.assign({}, settlementTemplate, {
        id: `settlement_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: isPlayer ? "Your Settlement" : generateName(type),
        type: type,
        position: position,
        region: region.id,
        landmass: landmass.id,
        resources: baseResources,
        population: initialPopulation,
        military: militaryStrength,
        faction: type, // Simplified faction = type for now
        rank: initialRank,
        isPlayer: isPlayer
    });
    
    // Initialize relations with random values
    worldMap.settlements.forEach(otherSettlement => {
        // Initial relations based on factions
        let relationValue;
        
        if (settlement.faction === otherSettlement.faction) {
            // Same faction - friendly
            relationValue = Utils.randomBetween(50, 100);
        } else if (
            (settlement.faction === SETTLEMENT_TYPES.VIKING && 
             (otherSettlement.faction === SETTLEMENT_TYPES.ANGLO || otherSettlement.faction === SETTLEMENT_TYPES.FRANKISH)) ||
            ((settlement.faction === SETTLEMENT_TYPES.ANGLO || settlement.faction === SETTLEMENT_TYPES.FRANKISH) && 
             otherSettlement.faction === SETTLEMENT_TYPES.VIKING)
        ) {
            // Vikings vs Anglo/Frankish - hostile
            relationValue = Utils.randomBetween(0, 30);
        } else {
            // Other combinations - neutral
            relationValue = Utils.randomBetween(30, 70);
        }
        
        settlement.relations[otherSettlement.id] = relationValue;
        
        // Add reciprocal relation
        otherSettlement.relations[settlement.id] = relationValue;
    });
    
    return settlement;
}
    
    /**
     * Apply region resource modifiers to the player's resources
     * @param {Object} region - Region object with resource modifiers
     */
    function updateRegionResourceModifiers(region) {
        // Get the region type
        const regionType = REGION_TYPES[region.type];
        if (!regionType || !regionType.resourceModifiers) return;
        
        // Apply modifiers to resources in ResourceManager
        if (typeof ResourceManager !== 'undefined' && ResourceManager.applyRegionalModifiers) {
            ResourceManager.applyRegionalModifiers(regionType.resourceModifiers);
        }
        
        // Add discovery of rare resources based on region
        if (typeof ResourceManager !== 'undefined' && ResourceManager.addResources) {
            // Randomly discover rare resources based on region
            const discoveryChance = 0.3; // 30% chance
            
            if (Math.random() < discoveryChance) {
                const possibleResources = [];
                
                // Add resources with high modifiers to the possible discoveries
                for (const resource in regionType.resourceModifiers) {
                    if (regionType.resourceModifiers[resource] > 1.3 && 
                        ResourceManager.isResourceDiscovered && 
                        !ResourceManager.isResourceDiscovered(resource)) {
                        
                        possibleResources.push(resource);
                    }
                }
                
                // Discover a random resource if any are available
                if (possibleResources.length > 0) {
                    const resourceToDiscover = possibleResources[
                        Math.floor(Math.random() * possibleResources.length)
                    ];
                    
                    // Add a small amount to discover it
                    const discoveryAmount = {};
                    discoveryAmount[resourceToDiscover] = Math.random() * 5 + 1;
                    ResourceManager.addResources(discoveryAmount);
                    
                    // Log discovery
                    Utils.log(`While exploring the ${regionType.name}, you discovered ${resourceToDiscover}!`, "success");
                }
            }
        }
    }

  
    
    /**
     * Generate a complete world map
     */
    function generateWorld() {
        console.log("Generating world map...");

        if (typeof MapRenderer !== 'undefined') {
            MapRenderer.init();
        }
        
        // Clear existing world
        worldMap.landmasses = [];
        worldMap.regions = [];
        worldMap.settlements = [];
        
        // Map dimensions
        const mapWidth = worldMap.mapSize.width;
        const mapHeight = worldMap.mapSize.height;
        
        // 1. Generate landmasses
        
        // Viking homeland (always present)
        const vikingLandmass = generateLandmass(
            LANDMASS_TYPES.VIKING_HOMELAND,
            { x: mapWidth * 0.25, y: mapHeight * 0.3 },
            { width: mapWidth * 0.3, height: mapHeight * 0.3 }
        );
        worldMap.landmasses.push(vikingLandmass);
        
        // Anglo lands (Not-England)
        const angloLandmass = generateLandmass(
            LANDMASS_TYPES.ANGLO_LANDS,
            { x: mapWidth * 0.4, y: mapHeight * 0.7 },
            { width: mapWidth * 0.2, height: mapHeight * 0.25 }
        );
        worldMap.landmasses.push(angloLandmass);
        
        // Frankish lands (Not-France)
        const frankishLandmass = generateLandmass(
            LANDMASS_TYPES.FRANKISH_LANDS,
            { x: mapWidth * 0.7, y: mapHeight * 0.6 },
            { width: mapWidth * 0.25, height: mapHeight * 0.35 }
        );
        worldMap.landmasses.push(frankishLandmass);
        
        // 2. Generate regions for each landmass
        
        // Helper function to create multiple regions
        const createRegionsForLandmass = (landmass, regionCount) => {
            // Distribute region types based on landmass type
            let regionTypes = [];
            
            if (landmass.type === LANDMASS_TYPES.VIKING_HOMELAND) {
                regionTypes = ['FOREST', 'MOUNTAINS', 'COASTAL', 'FJORD', 'PLAINS'];
            } else if (landmass.type === LANDMASS_TYPES.ANGLO_LANDS) {
                regionTypes = ['FOREST', 'PLAINS', 'COASTAL', 'PLAINS', 'PLAINS'];
            } else if (landmass.type === LANDMASS_TYPES.FRANKISH_LANDS) {
                regionTypes = ['PLAINS', 'FOREST', 'MOUNTAINS', 'COASTAL', 'PLAINS'];
            } else {
                regionTypes = ['FOREST', 'PLAINS', 'MOUNTAINS', 'COASTAL'];
            }
            
            // Subdivide landmass into regions
            const regionWidth = landmass.size.width / Math.ceil(Math.sqrt(regionCount));
            const regionHeight = landmass.size.height / Math.ceil(Math.sqrt(regionCount));
            
            for (let i = 0; i < regionCount; i++) {
                // Calculate position within landmass
                const offsetX = Utils.randomBetween(-regionWidth * 0.2, regionWidth * 0.2);
                const offsetY = Utils.randomBetween(-regionHeight * 0.2, regionHeight * 0.2);
                
                const posX = landmass.position.x - landmass.size.width/2 + 
                            (i % Math.ceil(Math.sqrt(regionCount))) * regionWidth + regionWidth/2 + offsetX;
                const posY = landmass.position.y - landmass.size.height/2 + 
                            Math.floor(i / Math.ceil(Math.sqrt(regionCount))) * regionHeight + regionHeight/2 + offsetY;
                
                // Select region type
                const regionType = regionTypes[i % regionTypes.length];
                
                // Create region
                const region = generateRegion(
                    landmass,
                    regionType,
                    { x: posX, y: posY },
                    { width: regionWidth * 0.9, height: regionHeight * 0.9 }
                );
                
                worldMap.regions.push(region);
                landmass.regions.push(region.id);
            }
        };
        
        // Create regions for each landmass
        createRegionsForLandmass(vikingLandmass, 4);  // More regions in Viking homeland
        createRegionsForLandmass(angloLandmass, 6);   // Anglo lands
        createRegionsForLandmass(frankishLandmass, 8); // Frankish lands
        
        // 3. Generate settlements
        
        // Helper function to create settlements in a region
        const createSettlements = (region, count, type, includePlayer = false) => {
            const landmass = worldMap.landmasses.find(lm => lm.id === region.landmass);
            
            for (let i = 0; i < count; i++) {
                // For player settlement
                const isPlayer = includePlayer && i === 0;
                
                // Calculate position within region
                const offsetX = Utils.randomBetween(-region.size.width * 0.3, region.size.width * 0.3);
                const offsetY = Utils.randomBetween(-region.size.height * 0.3, region.size.height * 0.3);
                
                const position = {
                    x: region.position.x + offsetX,
                    y: region.position.y + offsetY
                };
                
                // Create settlement
                const settlement = generateSettlement(
                    region,
                    type,
                    position,
                    isPlayer
                );
                
                worldMap.settlements.push(settlement);
                region.settlements.push(settlement.id);
                landmass.settlements.push(settlement.id);
                
                // Set as player settlement if needed
                if (isPlayer) {
                    worldMap.playerRegion = region;
                    worldMap.playerLandmass = landmass;
                }
            }
        };
        
        // Set player in a random region in Viking homeland
        const playerRegion = worldMap.regions.find(r => {
            const landmass = worldMap.landmasses.find(lm => lm.id === r.landmass);
            return landmass && landmass.type === LANDMASS_TYPES.VIKING_HOMELAND;
        });
        
        if (playerRegion) {
            createSettlements(playerRegion, 1, SETTLEMENT_TYPES.VIKING, true);
        }
        
                // Mark player's region as discovered
        if (worldMap.playerRegion) {
            worldMap.playerRegion.discovered = true;
        }

        // Create other Viking settlements
        worldMap.regions.forEach(region => {
            const landmass = worldMap.landmasses.find(lm => lm.id === region.landmass);
            
            if (!landmass) return;
            
            // Skip player region for additional settlements
            if (region.id === worldMap.playerRegion?.id) return;
            
            if (landmass.type === LANDMASS_TYPES.VIKING_HOMELAND) {
                // 1-3 Viking settlements per region in homeland
                createSettlements(region, Utils.randomBetween(1, 1), SETTLEMENT_TYPES.VIKING);
                createSettlements(region, Utils.randomBetween(1, 2), SETTLEMENT_TYPES.NEUTRAL);
            } else if (landmass.type === LANDMASS_TYPES.ANGLO_LANDS) {
                // 4-7 Anglo settlements per region
                createSettlements(region, Utils.randomBetween(2, 2), SETTLEMENT_TYPES.ANGLO);
                createSettlements(region, Utils.randomBetween(1, 5), SETTLEMENT_TYPES.NEUTRAL);
            } else if (landmass.type === LANDMASS_TYPES.FRANKISH_LANDS) {
                // 6-12 Frankish settlements per region
                createSettlements(region, Utils.randomBetween(3, 3), SETTLEMENT_TYPES.FRANKISH);
                createSettlements(region, Utils.randomBetween(1, 5), SETTLEMENT_TYPES.NEUTRAL);
            }
        });
        
        console.log("World generation complete");
        console.log(`Created ${worldMap.landmasses.length} landmasses`);
        console.log(`Created ${worldMap.regions.length} regions`);
        console.log(`Created ${worldMap.settlements.length} settlements`);
    }
    
        



            // Track discovered sea lanes as pairs of region IDs
        let discoveredSeaLanes = new Set();

        /**
         * Create a unique ID for a sea lane between two regions
         */
        function createSeaLaneId(regionId1, regionId2) {
            // Sort IDs to ensure the same lane ID regardless of order
            const sortedIds = [regionId1, regionId2].sort();
            return `sea_lane_${sortedIds[0]}_${sortedIds[1]}`;
        }

                /**
         * Discover a sea lane between two coastal regions
         * @param {string} fromRegionId - Origin region ID
         * @param {string} toRegionId - Destination region ID
         * @returns {boolean} - Whether the sea lane was newly discovered
         */
        function discoverSeaLane(fromRegionId, toRegionId) {
            // Ensure regions exist
    const fromRegion = this.getRegion(fromRegionId);
    const toRegion = this.getRegion(toRegionId);
    
    if (!fromRegion || !toRegion) {
        return false;
    }

    // Check if both regions are coastal
    const isFromCoastal = fromRegion.type === 'COASTAL' || fromRegion.type === 'FJORD';
    const isToCoastal = toRegion.type === 'COASTAL' || toRegion.type === 'FJORD';
    
    // Only coastal regions can have sea lanes
    if (!isFromCoastal || !isToCoastal) return false;
    
    // Create sea lane ID for the Set
    const seaLaneId = createSeaLaneId(fromRegionId, toRegionId);
    
    // If already discovered in private Set, no change needed
    if (discoveredSeaLanes.has(seaLaneId)) return true;
    
    // Add to private Set
    discoveredSeaLanes.add(seaLaneId);
    
    // Initialize sea lanes object if needed
    if (!worldMap.seaLanes) {
        worldMap.seaLanes = {};
    }
    
    // Create lane key for the object
    const laneKey = [fromRegionId, toRegionId].sort().join('_');
    
    // Create or update sea lane in the object
    worldMap.seaLanes[laneKey] = {
        fromRegionId: fromRegionId,
        toRegionId: toRegionId,
        discovered: true,
        distance: this.estimateSeaDistance(fromRegion, toRegion)
    };
    
    // Also automatically discover both connected regions
    // This ensures when you find a sea lane, you know where it leads
    fromRegion.discovered = true;
    toRegion.discovered = true;
    
    // Log discovery
    Utils.log(`Your sailors have discovered a sea route from ${fromRegion.name} to ${toRegion.name}!`, "success");
    
    return true;
}

                /**
         * Get all discovered sea lanes
         */
        function getDiscoveredSeaLanes() {
            const lanes = [];
            
            discoveredSeaLanes.forEach(seaLaneId => {
                // Extract region IDs from sea lane ID
                const match = seaLaneId.match(/sea_lane_(.*)_(.*)/);
                if (match && match.length === 3) {
                    const regionId1 = match[1];
                    const regionId2 = match[2];
                    
                    const region1 = worldMap.regions.find(r => r.id === regionId1);
                    const region2 = worldMap.regions.find(r => r.id === regionId2);
                    
                    if (region1 && region2) {
                        lanes.push({
                            id: seaLaneId,
                            regionId1: regionId1,
                            regionId2: regionId2,
                            region1Name: region1.name,
                            region2Name: region2.name
                        });
                    }
                }
            });
            
            return lanes;
        }

           /**
 * Process sea lane discovery when coastal region is discovered
 * @param {string} regionId - ID of the coastal region
 */
function discoverPotentialSeaLanes(regionId) {
    const region = worldMap.regions.find(r => r.id === regionId);
    if (!region) return;
    
    console.log(`Checking potential sea lanes for ${region.name}`);
    
    // Check if region is coastal
    const isCoastal = region.type === 'COASTAL' || region.type === 'FJORD';
    if (!isCoastal) {
        console.log(`Region ${region.name} is not coastal, skipping sea lane discovery`);
        return;
    }
    
    // HIGH CHANCE (35%) TO DISCOVER A NEW LANDMASS
    // This is the key fix to break the catch-22 problem
    if (Math.random() < 0.35) {
        console.log("Attempting to discover a new coastal region on another landmass");
        const newRegion = discoverCoastalRegionOnNewLandmass();
        
        if (newRegion) {
            // Create a sea lane between our coastal region and the newly discovered one
            discoverSeaLane(region.id, newRegion.id);
            return; // Stop here, we've already made a discovery
        }
    }
    
    // Find other discovered coastal regions
    const discoveredCoastalRegions = worldMap.regions.filter(r => 
        r.id !== regionId && 
        r.discovered === true && 
        (r.type === 'COASTAL' || r.type === 'FJORD')
    );
    
    console.log(`Found ${discoveredCoastalRegions.length} discovered coastal regions`);
    
    // If no other coastal regions are discovered, nothing to do
    if (discoveredCoastalRegions.length === 0) {
        console.log("No other coastal regions discovered, can't create sea lanes yet");
        return;
    }
    
    // Usually only discover nearest lanes first
    let lanesToDiscover = 1;
    if (Math.random() < 0.4) lanesToDiscover = 2; // 40% chance for 2 lanes (increased from 30%)
    
    // Sort by distance (closest first)
    const sortedByDistance = discoveredCoastalRegions.sort((a, b) => {
        const distA = Math.sqrt(
            Math.pow(a.position.x - region.position.x, 2) + 
            Math.pow(a.position.y - region.position.y, 2)
        );
        const distB = Math.sqrt(
            Math.pow(b.position.x - region.position.x, 2) + 
            Math.pow(b.position.y - region.position.y, 2)
        );
        return distA - distB;
    });
    
    console.log(`Will discover up to ${lanesToDiscover} sea lanes`);
    
    // Discover nearest lanes
    const nearestRegions = sortedByDistance.slice(0, lanesToDiscover);
    let lanesDiscovered = 0;
    
    nearestRegions.forEach(nearRegion => {
        // Prioritize creating lanes to different landmasses
        if (nearRegion.landmass !== region.landmass) {
            const success = discoverSeaLane(region.id, nearRegion.id);
            if (success) lanesDiscovered++;
        }
    });
    
    console.log(`Discovered ${lanesDiscovered} new sea lanes`);
}


/**
    /**
     * Find the player's settlement
     * @returns {Object|null} - Player settlement or null if not found
     */
    function getPlayerSettlement() {
        return worldMap.settlements.find(s => s.isPlayer);
    }

    /**
 * Track discovered settlements separately from regions
 */
let discoveredSettlements = new Set();

/**
 * Discover a settlement - make it visible and raidable
 * @param {string} settlementId - ID of the settlement to discover
 * @returns {boolean} - Whether the settlement was newly discovered
 */
function discoverSettlement(settlementId) {
    // If already discovered, no change
    if (discoveredSettlements.has(settlementId)) return false;
    
    // Mark as discovered
    discoveredSettlements.add(settlementId);
    
    // Get settlement info
    const settlement = worldMap.settlements.find(s => s.id === settlementId);
    if (!settlement) return false;
    
    // Log discovery to the player
    Utils.log(`Your scouts have discovered ${settlement.name}!`, "success");
    
    return true;
}

/**
 * Discover coastal regions on other landmasses
 * This is the key fix that allows discovering the first region on another landmass
 */
function discoverCoastalRegionOnNewLandmass() {
    // Get the player's landmass
    const playerRegion = worldMap.playerRegion;
    if (!playerRegion) return null;
    
    // Find all undiscovered coastal regions on other landmasses
    const undiscoveredCoastalRegions = worldMap.regions.filter(r => 
        !r.discovered && 
        (r.type === 'COASTAL' || r.type === 'FJORD') &&
        r.landmass !== playerRegion.landmass
    );
    
    if (undiscoveredCoastalRegions.length === 0) return null;
    
    // Pick a random coastal region from another landmass
    const randomIndex = Math.floor(Math.random() * undiscoveredCoastalRegions.length);
    const targetRegion = undiscoveredCoastalRegions[randomIndex];
    
    // Mark it as discovered
    targetRegion.discovered = true;
    
    // Get landmass name
    const landmass = worldMap.landmasses.find(lm => lm.id === targetRegion.landmass);
    const landmassName = landmass ? landmass.name : "unknown lands";
    
    console.log(`Discovered new coastal region: ${targetRegion.name} on ${landmassName}`);
    
    // Log the discovery
    Utils.log(`Your sailors have spotted land across the sea! They've discovered ${targetRegion.name} in ${landmassName}!`, "success");
    
    return targetRegion;
}
    
    // Public API
    return {
        /**
         * Initialize the world map system
         */
        init: function() {
            console.log("Initializing World Map system...");
            
            // Generate the world data first
            generateWorld();

                        // Initialize region discovery system
            console.log("Initializing region discovery system...");
                
            // Ensure all regions start as undiscovered
            worldMap.regions.forEach(region => {
                region.discovered = false;
            });
                
            // Ensure player's starting region is discovered
            if (worldMap.playerRegion) {
                worldMap.playerRegion.discovered = true;
                console.log(`Player's starting region (${worldMap.playerRegion.name}) is discovered`);
            }
                

            if (worldMap.playerRegion) {
                const adjacentRegions = this.getAdjacentRegions(worldMap.playerRegion.id);
                adjacentRegions.forEach(regionId => {
                    const region = this.getRegion(regionId);
                    if (region) {
                        region.discovered = true;
                        console.log(`Adjacent region ${region.name} is discovered`);
                    }
                });
            }
                
            // Initialize all other regions as undiscovered
            worldMap.regions.forEach(region => {
                if (region.id !== worldMap.playerRegion?.id) {
                    region.discovered = false;
                }
            });
                
            console.log(`Player's starting region (${worldMap.playerRegion?.name}) is discovered`);
            
            // Create the UI panel
            this.createWorldMapPanel();
            
            // Log player location
            const playerSettlement = getPlayerSettlement();
            if (playerSettlement) {
                const playerRegion = worldMap.regions.find(r => r.id === playerSettlement.region);
                const playerLandmass = worldMap.landmasses.find(lm => lm.id === playerSettlement.landmass);
                
                console.log(`Player settlement: ${playerSettlement.name}`);
                console.log(`Located in region: ${playerRegion.name} (${REGION_TYPES[playerRegion.type].name})`);
                console.log(`On landmass: ${playerLandmass.name} (${playerLandmass.type})`);
                
                // Log to game console
                Utils.log(`Your settlement is established in ${playerRegion.name}, a ${REGION_TYPES[playerRegion.type].name} region.`, "important");
                Utils.log(REGION_TYPES[playerRegion.type].description);
                
                // Apply the regional modifiers
                updateRegionResourceModifiers(playerRegion);
            }
            
            console.log("World Map system initialized");
        },

        /**
         * Get all discovered settlements
         * @returns {Array} - Array of discovered settlement objects
         */
        getDiscoveredSettlements: function() {
            return worldMap.settlements.filter(s => discoveredSettlements.has(s.id));
        },

        /**
         * Check if a settlement is discovered
         * @param {string} settlementId - ID of the settlement
         * @returns {boolean} - Whether the settlement is discovered
         */
        isSettlementDiscovered: function(settlementId) {
            return discoveredSettlements.has(settlementId);
        },

/**
 * Mark a region as discovered
 * @param {string} regionId - ID of the region to discover
 * @returns {boolean} - Whether the region was newly discovered (true) or already known (false)
 */
discoverRegion: function(regionId) {
    const region = this.getRegion(regionId);
    if (!region) return false;
    
    // If already discovered, no change
    if (region.discovered === true) return false;
    
    // Mark as discovered
    region.discovered = true;
    console.log(`Region discovered: ${region.name} (${regionId})`);
    
    // Discover settlements in this region (increased chance)
    const settlementsInRegion = this.getSettlementsByRegion(regionId);
    if (settlementsInRegion && settlementsInRegion.length > 0) {
        // Discover a random settlement initially - always discover at least one
        const randomIndex = Math.floor(Math.random() * settlementsInRegion.length);
        const initialSettlement = settlementsInRegion[randomIndex];
        
        if (initialSettlement) {
            discoverSettlement(initialSettlement.id);
        }
    }
    
    // IMPORTANT: If this is a coastal region, discover potential sea lanes
    if (region.type === 'COASTAL' || region.type === 'FJORD') {
        console.log(`Discovered coastal region ${region.name}, checking for sea lanes`);
        discoverPotentialSeaLanes(regionId);
    }
    
    // Log discovery to the player
    Utils.log(`Your expedition has discovered ${region.name}!`, "success");
    
    // Trigger UI update
    if (window.MilitaryPanel && typeof MilitaryPanel.update === 'function') {
        MilitaryPanel.update();
    }
    
    return true;
},
        
        /**
         * Create the world map panel
         * This should be called only once during initialization
         */
        createWorldMapPanel: function() {
            console.log("Creating world map panel...");
            
            // Check if panel already exists
            if (document.getElementById('world-panel')) {
                console.log("World map panel already exists, skipping creation");
                return;
            }
            
            // Create panel container
            const worldPanel = document.createElement('div');
            worldPanel.id = 'world-panel';
            worldPanel.className = 'world-panel hidden-panel'; // Start hidden
            
            // Add panel content
            worldPanel.innerHTML = `
                <h2>World Map</h2>
                <div class="region-info">
                    <div class="region-name">
                        <div class="region-label">Current Region:</div>
                        <div id="current-region-name">Loading...</div>
                    </div>
                    <div class="region-description" id="region-description">Exploring your surroundings...</div>
                    <div class="resource-modifiers">
                        <h3>Resource Modifiers</h3>
                        <div class="modifier-grid">
                            <div class="modifier">
                                <div class="modifier-label">Food:</div>
                                <div id="food-modifier">1.0</div>
                            </div>
                            <div class="modifier">
                                <div class="modifier-label">Wood:</div>
                                <div id="wood-modifier">1.0</div>
                            </div>
                            <div class="modifier">
                                <div class="modifier-label">Stone:</div>
                                <div id="stone-modifier">1.0</div>
                            </div>
                            <div class="modifier">
                                <div class="modifier-label">Metal:</div>
                                <div id="metal-modifier">1.0</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nearby-settlements">
                    <h3>Nearby Settlements</h3>
                    <div id="settlements-list">None discovered yet.</div>
                </div>
                <div class="world-actions">
                    <button id="btn-explore" disabled>Explore (Coming Soon)</button>
                    <button id="btn-raid" disabled>Raid (Coming Soon)</button>
                    <button id="btn-trade" disabled>Trade (Coming Soon)</button>
                </div>
            `;
            
            // Add to game content
            const gameContent = document.querySelector('.game-content');
            if (gameContent) {
                gameContent.appendChild(worldPanel);
                
                // Register with NavigationSystem if it exists
                if (typeof NavigationSystem !== 'undefined') {
                    NavigationSystem.registerPanel('world-panel', 'world');
                    console.log("World panel registered with navigation system");
                }
            }
        },

        
        
        /**
         * Update the world map UI elements with current data
         * Public method to be called from GameEngine
         */
        updateUI: function() {
            // Get player region data
            const playerRegion = this.getPlayerRegion();
            
            if (!playerRegion) {
                return;
            }
            
            // Update region name and description
            const regionNameEl = document.getElementById('current-region-name');
            const regionDescEl = document.getElementById('region-description');
            if (regionNameEl) regionNameEl.textContent = playerRegion.name;
            if (regionDescEl) regionDescEl.textContent = playerRegion.description;
            
            // Update resource modifiers
            const foodModEl = document.getElementById('food-modifier');
            const woodModEl = document.getElementById('wood-modifier');
            const stoneModEl = document.getElementById('stone-modifier');
            const metalModEl = document.getElementById('metal-modifier');
            
            if (foodModEl) foodModEl.textContent = playerRegion.resourceModifiers.food.toFixed(1);
            if (woodModEl) woodModEl.textContent = playerRegion.resourceModifiers.wood.toFixed(1);
            if (stoneModEl) stoneModEl.textContent = playerRegion.resourceModifiers.stone.toFixed(1);
            if (metalModEl) metalModEl.textContent = playerRegion.resourceModifiers.metal.toFixed(1);
            
            // Update nearby settlements
            const playerSettlement = this.getPlayerSettlement();
            const settlementsListElement = document.getElementById('settlements-list');
            
            if (playerSettlement && settlementsListElement) {
                const nearbySettlements = this.getNearbySettlements(playerSettlement.id);
                
                if (nearbySettlements.length > 0) {
                    let settlementsHTML = '';
                    
                    nearbySettlements.forEach(settlement => {
                        settlementsHTML += `
                            <div class="settlement-item settlement-${settlement.type.toLowerCase()}">
                                <div class="settlement-name">${settlement.name}</div>
                                <div class="settlement-type">${settlement.type}</div>
                            </div>
                        `;
                    });
                    
                    settlementsListElement.innerHTML = settlementsHTML;
                } else {
                    settlementsListElement.textContent = 'No settlements nearby.';
                }
            }
        },

                        /**
                 * Check if a sea lane between two regions is discovered
                 */
                /**
         * Check if a sea lane between two regions has been discovered
         * @param {string} fromRegionId - Origin region ID
         * @param {string} toRegionId - Destination region ID
         * @returns {boolean} - Whether the sea lane has been discovered
         */
                isSeaLaneDiscovered: function(fromRegionId, toRegionId) {
                    // First check if both regions exist
                    const fromRegion = this.getRegion(fromRegionId);
                    const toRegion = this.getRegion(toRegionId);
                    
                    if (!fromRegion || !toRegion) {
                        return false;
                    }
                    
                    // Check the private Set first
                    const seaLaneId = createSeaLaneId(fromRegionId, toRegionId);
                    if (discoveredSeaLanes.has(seaLaneId)) {
                        return true;
                    }
                    
                    // Check if we're tracking sea lanes
                    if (!worldMap.seaLanes) {
                        worldMap.seaLanes = {}; // Initialize if not existing
                    }
                    
                    // Create a consistent key for this sea lane (sort IDs to ensure same key regardless of direction)
                    const laneKey = [fromRegionId, toRegionId].sort().join('_');
                    
                    // If the sea lane is explicitly tracked, return its status
                    if (worldMap.seaLanes[laneKey] !== undefined) {
                        return worldMap.seaLanes[laneKey].discovered || false;
                    }
                    
                    // Default case: 
                    // If both regions are discovered, assume the sea lane is discovered
                    if (fromRegion.discovered && toRegion.discovered) {
                        // If regions are on different landmasses, it's a sea lane
                        if (fromRegion.landmass !== toRegion.landmass) {
                            // Create the sea lane entry in our tracking
                            worldMap.seaLanes[laneKey] = {
                                fromRegionId: fromRegionId,
                                toRegionId: toRegionId,
                                discovered: true, // Default to discovered if both regions are known
                                distance: this.estimateSeaDistance(fromRegion, toRegion)
                            };
                            
                            // Also add to the private Set for consistency
                            discoveredSeaLanes.add(seaLaneId);
                            
                            return true;
                        }
                    }
                    
                    return false;
                },

                
                /**
         * Helper function to estimate sea distance between regions
         * @param {Object} region1 - First region object
         * @param {Object} region2 - Second region object
         * @returns {number} - Estimated distance
         */
        estimateSeaDistance: function(region1, region2) {
            // If regions don't have position data, return a default
            if (!region1.position || !region2.position) {
                return 10; // Default distance
            }
            
            // Calculate direct distance
            const dx = region1.position.x - region2.position.x;
            const dy = region1.position.y - region2.position.y;
            const directDistance = Math.sqrt(dx*dx + dy*dy);
            
            // Sea travel is typically longer than direct distance
            return directDistance * 1.5;
        },

                /**
         * Get all sea lanes connected to a region
         * @param {string} regionId - ID of the region
         * @returns {Array} - Array of sea lane objects
         */
        getRegionSeaLanes: function(regionId) {
            if (!worldMap.seaLanes) {
                return [];
            }
            
            const regionSeaLanes = [];
            
            // Check all sea lanes for connections to this region
            for (const key in worldMap.seaLanes) {
                const lane = worldMap.seaLanes[key];
                
                // If this lane connects to our region and is discovered
                if ((lane.fromRegionId === regionId || lane.toRegionId === regionId) && 
                    lane.discovered) {
                    
                    regionSeaLanes.push(lane);
                }
            }

            return regionSeaLanes;
        },

                /**
         * Discover a sea lane between two regions
         * @param {string} fromRegionId - Origin region ID
         * @param {string} toRegionId - Destination region ID
         * @returns {boolean} - Whether discovery was successful
         */
                discoverSeaLane: function(fromRegionId, toRegionId) {
                    // Ensure regions exist
                    const fromRegion = this.getRegion(fromRegionId);
                    const toRegion = this.getRegion(toRegionId);
                    
                    if (!fromRegion || !toRegion) {
                        console.log(`Cannot discover sea lane - region not found`, {fromRegionId, toRegionId});
                        return false;
                    }
                
                    // Check if both regions are coastal
                    const isFromCoastal = fromRegion.type === 'COASTAL' || fromRegion.type === 'FJORD';
                    const isToCoastal = toRegion.type === 'COASTAL' || fromRegion.type === 'FJORD';
                    
                    // Only coastal regions can have sea lanes
                    if (!isFromCoastal || !isToCoastal) {
                        console.log(`Cannot discover sea lane - one or both regions not coastal`, {
                            fromRegion: `${fromRegion.name} (${fromRegion.type})`,
                            toRegion: `${toRegion.name} (${toRegion.type})` 
                        });
                        return false;
                    }
                    
                    // Create sea lane ID for the Set
                    const seaLaneId = createSeaLaneId(fromRegionId, toRegionId);
                    
                    // If already discovered in private Set, no change needed
                    if (discoveredSeaLanes.has(seaLaneId)) {
                        console.log(`Sea lane already discovered in private Set`);
                        return true;
                    }
                    
                    // Add to private Set
                    discoveredSeaLanes.add(seaLaneId);
                    
                    // Initialize sea lanes object if needed
                    if (!worldMap.seaLanes) {
                        worldMap.seaLanes = {};
                    }
                    
                    // Create lane key for the object
                    const laneKey = [fromRegionId, toRegionId].sort().join('_');
                    
                    // Create or update sea lane in the object
                    worldMap.seaLanes[laneKey] = {
                        fromRegionId: fromRegionId,
                        toRegionId: toRegionId,
                        discovered: true,
                        distance: this.estimateSeaDistance(fromRegion, toRegion)
                    };
                    
                    console.log(`Created sea lane from ${fromRegion.name} to ${toRegion.name}`);
                    
                    // Also automatically discover both connected regions
                    // This ensures when you find a sea lane, you know where it leads
                    fromRegion.discovered = true;
                    toRegion.discovered = true;
                    
                    // Log discovery
                    Utils.log(`Your sailors have discovered a sea route from ${fromRegion.name} to ${toRegion.name}!`, "success");
                    
                    return true;
                },

        /**
         * Get all discovered sea lanes
         */
        getDiscoveredSeaLanes: function() {
            return getDiscoveredSeaLanes();
        },

        /**
         * Get all discovered settlements
         */
        getDiscoveredSettlements: function() {
            return worldMap.settlements.filter(s => discoveredSettlements.has(s.id));
        },

        /**
         * Check if a settlement is discovered
         */
        isSettlementDiscovered: function(settlementId) {
            return discoveredSettlements.has(settlementId);
        },

        /**
         * Discover a settlement by ID
         */
        discoverSettlement: function(settlementId) {
            return discoverSettlement(settlementId);
        },
        
        /**
         * Get the world map data
         * @returns {Object} - World map data
         */
        getWorldMap: function() {
            return { ...worldMap };
        },
        
        /**
         * Get regions by landmass
         * @param {string} landmassId - ID of the landmass
         * @returns {Array} - Array of regions in the landmass
         */
        getRegionsByLandmass: function(landmassId) {
            return worldMap.regions.filter(r => r.landmass === landmassId);
        },
        
        /**
         * Get settlements by region
         * @param {string} regionId - ID of the region
         * @returns {Array} - Array of settlements in the region
         */
        getSettlementsByRegion: function(regionId) {
            return worldMap.settlements.filter(s => s.region === regionId);
        },
        
        /**
         * Get landmass by ID
         * @param {string} landmassId - ID of the landmass
         * @returns {Object|undefined} - Landmass object
         */
        getLandmass: function(landmassId) {
            return worldMap.landmasses.find(lm => lm.id === landmassId);
        },
        
        /**
         * Get region by ID
         * @param {string} regionId - ID of the region
         * @returns {Object|undefined} - Region object
         */
        getRegion: function(regionId) {
            return worldMap.regions.find(r => r.id === regionId);
        },
        
        /**
         * Get settlement by ID
         * @param {string} settlementId - ID of the settlement
         * @returns {Object|undefined} - Settlement object
         */
        getSettlement: function(settlementId) {
            return worldMap.settlements.find(s => s.id === settlementId);
        },
        
        /**
         * Get the player's settlement
         * @returns {Object|undefined} - Player settlement
         */
        getPlayerSettlement: getPlayerSettlement,
        
        /**
         * Get the player's region
         * @returns {Object|undefined} - Player region
         */
        getPlayerRegion: function() {
            return worldMap.playerRegion;
        },
        
        /**
         * Get the player's landmass
         * @returns {Object|undefined} - Player landmass
         */
        getPlayerLandmass: function() {
            return worldMap.playerLandmass;
        },
        
        /**
         * Apply region resource modifiers to the player's resources
         * @param {Object} region - Region object with resource modifiers
         */
        updateRegionResourceModifiers: function(region) {
            updateRegionResourceModifiers(region);
        },
        
        /**
         * Get nearby settlements to a given settlement
         * @param {string} settlementId - ID of the settlement
         * @param {number} [maxDistance=100] - Maximum distance to consider
         * @returns {Array} - Array of nearby settlements
         */
        getNearbySettlements: function(settlementId, maxDistance = 100) {
            const settlement = this.getSettlement(settlementId);
            if (!settlement) return [];
            
            return worldMap.settlements.filter(s => {
                if (s.id === settlementId) return false;
                
                const dx = s.position.x - settlement.position.x;
                const dy = s.position.y - settlement.position.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                return distance <= maxDistance;
            });
        },

        
        
        /**
         * Process a game tick for all world entities
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Update AI settlements
            worldMap.settlements.forEach(settlement => {
                // Skip player settlement, that's handled by the game engine
                if (settlement.isPlayer) return;
                
                // Simple AI behavior - grow population, gather resources
                if (tickSize > 0) {
                    // Population growth - very simple model
                    if (Utils.chanceOf(2 * tickSize)) {
                        settlement.population += 1;
                    }
                    
                    // Resource gathering - based on region modifiers
                    const region = this.getRegion(settlement.region);
                    if (region) {
                        // Base production rates * population * region modifier
                        const foodProduced = 0.6 * settlement.population * region.resourceModifiers.food * tickSize;
                        const woodProduced = 0.3 * settlement.population * region.resourceModifiers.wood * tickSize;
                        const stoneProduced = 0.2 * settlement.population * region.resourceModifiers.stone * tickSize;
                        const metalProduced = 0.1 * settlement.population * region.resourceModifiers.metal * tickSize;
                        
                        // Update resources
                        settlement.resources.food += foodProduced;
                        settlement.resources.wood += woodProduced;
                        settlement.resources.stone += stoneProduced;
                        settlement.resources.metal += metalProduced;
                        
                        // Consumption
                        const foodConsumed = settlement.population * 0.8 * tickSize;
                        settlement.resources.food = Math.max(0, settlement.resources.food - foodConsumed);
                    }
                    
                    // Military growth
                    if (settlement.resources.food > settlement.population * 10 && 
                        settlement.resources.metal > 5 && 
                        Utils.chanceOf(3 * tickSize)) {
                        settlement.military.warriors += 1;
                        settlement.resources.food -= 10;
                        settlement.resources.metal -= 1;
                    }
                    
                    // Build defenses
                    if (settlement.resources.wood > 20 && 
                        settlement.resources.stone > 10 && 
                        Utils.chanceOf(2 * tickSize)) {
                        settlement.military.defenses += 1;
                        settlement.resources.wood -= 20;
                        settlement.resources.stone -= 10;
                    }
                    
                    // Viking settlements might build ships
                    if (settlement.type === SETTLEMENT_TYPES.VIKING && 
                        settlement.resources.wood > 30 && 
                        Utils.chanceOf(1 * tickSize)) {
                        settlement.military.ships += 1;
                        settlement.resources.wood -= 30;
                    }
                }
            });
        },



  /**
 * Mark a region as discovered
 * @param {string} regionId - ID of the region to discover
 * @returns {boolean} - Whether the region was newly discovered (true) or already known (false)
 */
discoverRegion: function(regionId) {
    const region = this.getRegion(regionId);
    if (!region) return false;
    
    // If already discovered, no change
    if (region.discovered === true) return false;
    
    // Mark as discovered
    region.discovered = true;
    
    // Log discovery to the player
    Utils.log(`Your expedition has discovered ${region.name}!`, "success");
    
    // Trigger UI update for any open panels that show regions
    if (window.MilitaryPanel && typeof MilitaryPanel.update === 'function') {
        MilitaryPanel.update();
    }
    
    console.log(`Region discovered: ${region.name} (${regionId})`);
    return true;
},

/**
 * Check if a region is discovered
 * @param {string} regionId - ID of the region
 * @returns {boolean} - Whether the region is discovered
 */
isRegionDiscovered: function(regionId) {
    const region = this.getRegion(regionId);
    return region ? (region.discovered === true) : false;
},

/**
 * Get all discovered regions
 * @returns {Array} - Array of discovered region objects
 */
getDiscoveredRegions: function() {
    return worldMap.regions.filter(region => region.discovered === true);
},

/**
 * Get all adjacent regions to a given region including sea lanes 
 * @param {string} regionId - ID of the region
 * @returns {Array} - Array of region IDs for adjacent regions
 */
getAdjacentRegions: function(regionId) {
    const region = this.getRegion(regionId);
    if (!region) return [];
    
    // Find regions in same landmass that are close enough to be adjacent
    const landmassRegions = this.getRegionsByLandmass(region.landmass);
    
    const adjacentRegions = landmassRegions
        .filter(r => {
            if (r.id === regionId) return false; // Skip self
            
            // Calculate distance
            const dx = r.position.x - region.position.x;
            const dy = r.position.y - region.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Consider adjacent if within certain range
            const adjacencyThreshold = (r.size.width + region.size.width) / 1.5;
            return distance <= adjacencyThreshold;
        })
        .map(r => r.id);
    
    // Add regions connected by sea lanes (if function exists and coastal/fjord region)
    if ((region.type === 'COASTAL' || region.type === 'FJORD') && 
        typeof this.getRegionSeaLanes === 'function') {
        
        const seaLanes = this.getRegionSeaLanes(regionId);
        
        seaLanes.forEach(lane => {
            // Get the other end of the sea lane
            const connectedRegionId = lane.fromRegionId === regionId ? 
                lane.toRegionId : lane.fromRegionId;
            
            // Add to adjacent regions if not already included
            if (!adjacentRegions.includes(connectedRegionId)) {
                adjacentRegions.push(connectedRegionId);
            }
        });
    }
    
    return adjacentRegions;
},

/**
 * Get all regions adjacent to a given region (by land or sea)
 * @param {string} regionId - ID of the region
 * @param {boolean} onlyDiscoveredSeaLanes - Only include sea lanes that are marked as discovered
 * @returns {Array} - Array of region IDs for adjacent regions
 */
getAdjacentRegions: function(regionId, onlyDiscoveredSeaLanes = true) {
    const region = this.getRegion(regionId);
    if (!region) return [];
    
    // Find regions in same landmass that are close enough to be adjacent
    const landmassRegions = this.getRegionsByLandmass(region.landmass);
    
    const adjacentRegions = landmassRegions
        .filter(r => {
            if (r.id === regionId) return false; // Skip self
            
            // Calculate distance
            const dx = r.position.x - region.position.x;
            const dy = r.position.y - region.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Consider adjacent if within certain range
            const adjacencyThreshold = (r.size.width + region.size.width) / 1.5;
            return distance <= adjacencyThreshold;
        })
        .map(r => r.id);
    
    // Add sea lane connections if appropriate
    if (typeof this.getRegionSeaLanes === 'function') {
        const seaLanes = this.getRegionSeaLanes(regionId);
        
        seaLanes.forEach(lane => {
            // Get the connected region ID (the "other end" of the lane)
            const connectedRegionId = lane.fromRegionId === regionId ? 
                lane.toRegionId : lane.fromRegionId;
            
            // Only add if not already in list and checking discovery status if needed
            if (!adjacentRegions.includes(connectedRegionId) && 
                (!onlyDiscoveredSeaLanes || 
                 !this.isSeaLaneDiscovered || 
                 this.isSeaLaneDiscovered(regionId, connectedRegionId))) {
                
                adjacentRegions.push(connectedRegionId);
            }
        });
    }
    
    return adjacentRegions;
},
        
        
        // Methods to be implemented in future iterations
        
        /**
         * Perform a raid from one settlement to another
         * @param {string} attackerId - ID of the attacking settlement
         * @param {string} targetId - ID of the target settlement
         * @returns {Object} - Result of the raid
         */
        performRaid: function(attackerId, targetId) {
            // Placeholder for raid logic
            // This will be implemented in future iterations
            return {
                success: false,
                message: "Raiding functionality is not yet implemented."
            };
        },
        
        /**
         * Get available raid targets for a settlement
         * @param {string} settlementId - ID of the settlement
         * @returns {Array} - Array of potential raid targets
         */
        getAvailableRaidTargets: function(settlementId) {
            // Placeholder
            return [];
        },
        
        /**
         * Get basic world map details to display to the player
         * @returns {Object} - Simplified world data for UI display
         */
        getWorldOverview: function() {
            return {
                landmasses: worldMap.landmasses.map(lm => ({
                    id: lm.id,
                    name: lm.name,
                    type: lm.type
                })),
                playerRegion: worldMap.playerRegion ? {
                    id: worldMap.playerRegion.id,
                    name: worldMap.playerRegion.name,
                    type: REGION_TYPES[worldMap.playerRegion.type].name,
                    resourceModifiers: worldMap.playerRegion.resourceModifiers
                } : null,
                playerLandmass: worldMap.playerLandmass ? {
                    id: worldMap.playerLandmass.id,
                    name: worldMap.playerLandmass.name,
                    type: worldMap.playerLandmass.type
                } : null,
                nearbySettlements: this.getPlayerSettlement() ? 
                    this.getNearbySettlements(this.getPlayerSettlement().id).map(s => ({
                        id: s.id,
                        name: s.name,
                        type: s.type
                    })) : []
            };
        }
    };
})();


