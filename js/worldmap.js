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
        ANGLO_LANDS: "Anglo Lands",     // Not-England
        FRANKISH_LANDS: "Frankish Lands", // Not-France
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
            // Use existing player values
            initialPopulation = 5; // Player starts with 5
            initialRank = 0; // Lowest rank
            militaryStrength = {
                warriors: 1,
                ships: 0,
                defenses: 0
            };
        } else {
            // AI settlement - more established
            switch (type) {
                case SETTLEMENT_TYPES.VIKING:
                    initialPopulation = Utils.randomBetween(20, 35);
                    initialRank = Utils.randomBetween(0, 5);
                    militaryStrength = {
                        warriors: Utils.randomBetween(1, 5),
                        ships: Utils.randomBetween(0, 2),
                        defenses: Utils.randomBetween(0, 2)
                    };
                    break;
                case SETTLEMENT_TYPES.ANGLO:
                case SETTLEMENT_TYPES.FRANKISH:
                    initialPopulation = Utils.randomBetween(10, 100);
                    initialRank = Utils.randomBetween(2, 7);
                    militaryStrength = {
                        warriors: Utils.randomBetween(3, 8),
                        ships: Utils.randomBetween(0, 1),
                        defenses: Utils.randomBetween(2, 5) // Higher defenses
                    };
                    break;
                default: // Neutral
                    initialPopulation = Utils.randomBetween(3, 15);
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
            

            settlement.region = region.id

            settlement.relations[otherSettlement.id] = relationValue;
            
            // Add reciprocal relation
            otherSettlement.relations[settlement.id] = relationValue;
        });
        
        return settlement;
    }

        /**
     * Connect regions with neighboring relationships
     * This should be called during world generation
     */
    function connectRegions() {
        console.log("Connecting regions with neighbors...");
        
        // Group regions by landmass
        const regionsByLandmass = {};
        worldMap.landmasses.forEach(landmass => {
            regionsByLandmass[landmass.id] = worldMap.regions.filter(r => r.landmass === landmass.id);
        });
        
        // For each landmass, connect its regions
        for (const landmassId in regionsByLandmass) {
            const regions = regionsByLandmass[landmassId];
            
            // Initialize neighbors array if needed
            regions.forEach(region => {
                if (!region.neighbors) {
                    region.neighbors = [];
                }
            });
            
            // Connect regions within the same landmass
            for (let i = 0; i < regions.length; i++) {
                for (let j = i + 1; j < regions.length; j++) {
                    const region1 = regions[i];
                    const region2 = regions[j];
                    
                    // Calculate distance between regions
                    const dx = region1.position.x - region2.position.x;
                    const dy = region1.position.y - region2.position.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    // If regions are close enough, connect them
                    const connectThreshold = (region1.size.width + region2.size.width + 
                                            region1.size.height + region2.size.height) / 4;
                    
                    if (distance < connectThreshold * 1.5) {
                        // Add bidirectional connection if not already connected
                        if (!region1.neighbors.includes(region2.id)) {
                            region1.neighbors.push(region2.id);
                        }
                        if (!region2.neighbors.includes(region1.id)) {
                            region2.neighbors.push(region1.id);
                        }
                    }
                }
            }
        }
        
        // Connect regions between landmasses (sea routes)
        // For now, just connect the closest regions between each pair of landmasses
        for (let i = 0; i < worldMap.landmasses.length; i++) {
            for (let j = i + 1; j < worldMap.landmasses.length; j++) {
                const landmass1 = worldMap.landmasses[i];
                const landmass2 = worldMap.landmasses[j];
                
                const regions1 = regionsByLandmass[landmass1.id];
                const regions2 = regionsByLandmass[landmass2.id];
                
                // Find coastal regions in each landmass
                const coastal1 = regions1.filter(r => r.type === 'COASTAL' || r.type === 'FJORD');
                const coastal2 = regions2.filter(r => r.type === 'COASTAL' || r.type === 'FJORD');
                
                if (coastal1.length > 0 && coastal2.length > 0) {
                    // Find the closest pair of coastal regions
                    let closestPair = null;
                    let shortestDistance = Infinity;
                    
                    for (const r1 of coastal1) {
                        for (const r2 of coastal2) {
                            const dx = r1.position.x - r2.position.x;
                            const dy = r1.position.y - r2.position.y;
                            const distance = Math.sqrt(dx*dx + dy*dy);
                            
                            if (distance < shortestDistance) {
                                shortestDistance = distance;
                                closestPair = [r1, r2];
                            }
                        }
                    }
                    
                    // Connect the closest pair
                    if (closestPair) {
                        const [r1, r2] = closestPair;
                        if (!r1.neighbors.includes(r2.id)) {
                            r1.neighbors.push(r2.id);
                        }
                        if (!r2.neighbors.includes(r1.id)) {
                            r2.neighbors.push(r1.id);
                        }
                        
                        console.log(`Connected ${r1.name} and ${r2.name} with a sea route`);
                    }
                }
            }
        }
        
        // Ensure all regions have at least one connection
        worldMap.regions.forEach(region => {
            if (!region.neighbors || region.neighbors.length === 0) {
                console.log(`Region ${region.name} has no connections, finding closest region...`);
                
                let closestRegion = null;
                let shortestDistance = Infinity;
                
                for (const otherRegion of worldMap.regions) {
                    if (otherRegion.id === region.id) continue;
                    
                    const dx = region.position.x - otherRegion.position.x;
                    const dy = region.position.y - otherRegion.position.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        closestRegion = otherRegion;
                    }
                }
                
                if (closestRegion) {
                    if (!region.neighbors) region.neighbors = [];
                    if (!closestRegion.neighbors) closestRegion.neighbors = [];
                    
                    region.neighbors.push(closestRegion.id);
                    closestRegion.neighbors.push(region.id);
                    
                    console.log(`Connected ${region.name} to ${closestRegion.name}`);
                }
            }
        });
        
        console.log("Region connections established");
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
        createRegionsForLandmass(vikingLandmass, 8);  // Viking homeland
        createRegionsForLandmass(angloLandmass, 12);   // Anglo lands
        createRegionsForLandmass(frankishLandmass, 22); // Frankish lands
        
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
        
        // Create other Viking settlements
        worldMap.regions.forEach(region => {
            const landmass = worldMap.landmasses.find(lm => lm.id === region.landmass);
            
            if (!landmass) return;
            
            // Skip player region for additional settlements
            if (region.id === worldMap.playerRegion?.id) return;
            
            if (landmass.type === LANDMASS_TYPES.VIKING_HOMELAND) {
                // 1-2 Viking settlements per region in homeland
                createSettlements(region, Utils.randomBetween(1, 2), SETTLEMENT_TYPES.VIKING);
            } else if (landmass.type === LANDMASS_TYPES.ANGLO_LANDS) {
                // 1-3 Anglo settlements per region
                createSettlements(region, Utils.randomBetween(1, 3), SETTLEMENT_TYPES.ANGLO);
            } else if (landmass.type === LANDMASS_TYPES.FRANKISH_LANDS) {
                // 1-3 Frankish settlements per region
                createSettlements(region, Utils.randomBetween(1, 3), SETTLEMENT_TYPES.FRANKISH);
            }
        });

            // Connect regions to establish travel routes
            connectRegions();
        
        console.log("World generation complete");
        console.log(`Created ${worldMap.landmasses.length} landmasses`);
        console.log(`Created ${worldMap.regions.length} regions`);
        console.log(`Created ${worldMap.settlements.length} settlements`);
    }
    
    /**
     * Find the player's settlement
     * @returns {Object|null} - Player settlement or null if not found
     */
    function getPlayerSettlement() {
        return worldMap.settlements.find(s => s.isPlayer);
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
                    <button id="btn-explore">Explore</button>
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

                const currentRegionSettlements = this.getSettlementsByRegion(playerRegion.id);
                const regionalSettlementsElement = document.getElementById('regional-settlements-list');

                if (regionalSettlementsElement) {
                    if (currentRegionSettlements.length > 0) {
                        let settlementsHTML = '';
                        
                        currentRegionSettlements.forEach(settlement => {
                            settlementsHTML += `
                                <div class="settlement-item settlement-${settlement.type.toLowerCase()}">
                                    <div class="settlement-name">${settlement.name}</div>
                                    <div class="settlement-type">${settlement.type}</div>
                                    <div class="settlement-population">Population: ~${settlement.population}</div>
                                </div>
                            `;
                        });
                        
                        regionalSettlementsElement.innerHTML = settlementsHTML;
                    } else {
                        regionalSettlementsElement.textContent = 'No settlements in this region.';
                    }
                }
            }
        },

                /**
         * Get neighboring regions of a specific region
         * @param {string} regionId - ID of the region
         * @returns {Array} - Array of neighboring region objects
         */
        getNeighborRegions: function(regionId) {
            const region = this.getRegion(regionId);
            if (!region || !region.neighbors) return [];
            
            return region.neighbors.map(id => this.getRegion(id)).filter(r => r !== null);
        },

        /**
         * Check if two regions are neighbors
         * @param {string} regionId1 - ID of the first region
         * @param {string} regionId2 - ID of the second region
         * @returns {boolean} - Whether the regions are neighbors
         */
        areRegionsNeighbors: function(regionId1, regionId2) {
            const region1 = this.getRegion(regionId1);
            if (!region1 || !region1.neighbors) return false;
            
            return region1.neighbors.includes(regionId2);
        },

        /**
         * Get the travel type between two regions
         * @param {string} regionId1 - ID of the first region
         * @param {string} regionId2 - ID of the second region
         * @returns {string} - Type of travel: 'land', 'sea', or 'none'
         */
        getTravelType: function(regionId1, regionId2) {
            if (!this.areRegionsNeighbors(regionId1, regionId2)) {
                return 'none';
            }
            
            const region1 = this.getRegion(regionId1);
            const region2 = this.getRegion(regionId2);
            
            // If regions are in different landmasses, it's a sea route
            if (region1.landmass !== region2.landmass) {
                return 'sea';
            }
            
            // Otherwise it's a land route
            return 'land';
        },

        /**
         * Get settlements in a specific region
         * @param {string} regionId - ID of the region to check
         * @returns {Array} - Array of settlement objects in the region
         */
        getSettlementsByRegion: function(regionId) {
            if (!regionId) return [];
            
            // First, check if the region exists
            const region = this.getRegion(regionId);
            if (!region) return [];
            
            // Return all settlements in this region
            return worldMap.settlements.filter(s => s.region === regionId);
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
         * Get region by ID with optional settlement data
         * @param {string} regionId - ID of the region
         * @param {boolean} includeSettlements - Whether to include settlement data
         * @returns {Object|undefined} - Region object or undefined if not found
         */
        getRegion: function(regionId, includeSettlements = false) {
            const region = worldMap.regions.find(r => r.id === regionId);
            
            // If we want to include settlements, add them to the region object
            if (region && includeSettlements) {
                region.settlements = this.getSettlementsByRegion(regionId);
            }
            
            return region;
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
                        const foodProduced = 0.5 * settlement.population * region.resourceModifiers.food * tickSize;
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
