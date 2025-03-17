/**
 * Viking Legacy - World Generation System
 * Handles the creation and management of the game world, landmasses, and regions
 */

const WorldGenerator = (function() {
    // Constants
    const LANDMASS_TYPES = {
        SCANDINAVIA: {
            id: "scandinavia",
            name: "Scandinavia",
            description: "The harsh northern homeland of the Vikings.",
            baseSizeRange: [300, 500], // Base size range in regions
            terrainDistribution: {
                forest: 40,      // 40% forest
                plains: 25,      // 25% plains
                hills: 20,       // 20% hills
                mountains: 10,   // 10% mountains
                coastline: 5     // 5% coastline
            },
            defaultFaction: "norse",
            resourceModifiers: {
                wood: 1.2,       // More wood
                metal: 1.1,      // Slightly more metal
                food: 0.9        // Less food
            },
            startingRegion: true  // Player can start here
        },
        BRITANNIA: {
            id: "britannia",
            name: "Britannia",
            description: "A wealthy island realm, divided into kingdoms.",
            baseSizeRange: [250, 400],
            terrainDistribution: {
                forest: 30,
                plains: 35,
                hills: 20,
                mountains: 5,
                coastline: 10
            },
            defaultFaction: "anglo_saxon",
            resourceModifiers: {
                food: 1.1,        // More food
                stone: 1.1,       // More stone
                metal: 1.2        // More metal
            },
            startingRegion: false
        },
        FRANKIA: {
            id: "frankia",
            name: "Frankia",
            description: "A vast realm of fertile lands and rich monasteries.",
            baseSizeRange: [350, 550],
            terrainDistribution: {
                forest: 25,
                plains: 45,
                hills: 15,
                mountains: 5,
                coastline: 10
            },
            defaultFaction: "frankish",
            resourceModifiers: {
                food: 1.2,        // Much more food
                wood: 1.1,        // More wood
                luxury: 1.3       // More luxury goods
            },
            startingRegion: false
        }
    };
    
    const REGION_SIZE_RANGE = [30, 100]; // Region size in acreage
    
    const TERRAIN_TYPES = {
        forest: {
            name: "Forest",
            description: "Dense woodland filled with timber and game.",
            baseResourceWeights: {
                wood: { abundance: [70, 95], accessibility: [60, 80] },
                food: { abundance: [40, 70], accessibility: [50, 70] }, // Hunting
                herbs: { abundance: [30, 60], accessibility: [60, 80] }
            },
            movementCost: 1.5,
            defensiveBonus: 0.2
        },
        plains: {
            name: "Plains",
            description: "Open grasslands suitable for farming and grazing.",
            baseResourceWeights: {
                food: { abundance: [60, 90], accessibility: [70, 90] },
                wood: { abundance: [20, 40], accessibility: [80, 95] }
            },
            movementCost: 1.0,
            defensiveBonus: 0
        },
        hills: {
            name: "Hills",
            description: "Rolling highlands with stone deposits.",
            baseResourceWeights: {
                stone: { abundance: [60, 90], accessibility: [50, 70] },
                metal: { abundance: [30, 60], accessibility: [30, 50] },
                wood: { abundance: [30, 50], accessibility: [60, 80] }
            },
            movementCost: 1.3,
            defensiveBonus: 0.1
        },
        mountains: {
            name: "Mountains",
            description: "Rugged peaks rich in metals and stone.",
            baseResourceWeights: {
                stone: { abundance: [80, 95], accessibility: [30, 50] },
                metal: { abundance: [50, 80], accessibility: [20, 40] }
            },
            movementCost: 2.0,
            defensiveBonus: 0.3
        },
        coastline: {
            name: "Coastline",
            description: "Coastal areas with fishing and salt production.",
            baseResourceWeights: {
                food: { abundance: [70, 90], accessibility: [60, 80] }, // Fish
                salt: { abundance: [60, 90], accessibility: [70, 90] }
            },
            movementCost: 1.2,
            defensiveBonus: 0,
            harborSuitability: 0.8
        },
        river: {
            name: "River",
            description: "Flowing waterways that provide fresh water and transportation.",
            baseResourceWeights: {
                food: { abundance: [60, 80], accessibility: [70, 90] }, // Fish
                water: { abundance: [90, 100], accessibility: [80, 100] }
            },
            movementCost: 1.5,
            defensiveBonus: 0.1,
            harborSuitability: 0.6
        },
        marsh: {
            name: "Marsh",
            description: "Wetlands with unique resources but difficult terrain.",
            baseResourceWeights: {
                herbs: { abundance: [50, 80], accessibility: [40, 60] },
                food: { abundance: [40, 60], accessibility: [30, 50] }
            },
            movementCost: 2.5,
            defensiveBonus: 0.2
        }
    };
    
    // World data structure
    let worldData = {
        seed: 0,
        year: 800, // Starting year
        landmasses: [],
        regions: [],
        settlements: [],
        factions: [],
        tradingPosts: [],
        seaRoutes: [],
        landRoutes: []
    };
    
    let playerStartingRegion = null;
    
    // Private methods
    
    /**
     * Generate a semi-random name for a region
     * @param {string} terrainType - Type of terrain
     * @param {string} landmassId - ID of the landmass
     * @returns {string} - Generated name
     */
    function generateRegionName(terrainType, landmassId) {
        const prefixes = {
            forest: ["Dark", "Dense", "Ancient", "Misty", "Green", "Wild", "Deep", "Red", "Black", "Shadow"],
            plains: ["Vast", "Open", "Grassy", "Fertile", "Golden", "Wind-swept", "Rolling", "Sunny", "Broad", "Endless"],
            hills: ["Rolling", "Rocky", "Barren", "Windy", "Steep", "Red", "High", "Low", "Stone", "Green"],
            mountains: ["Jagged", "Towering", "Snowy", "Forbidding", "Craggy", "Ice", "Cloud", "Frost", "Thunder", "Dragon"],
            coastline: ["Sandy", "Rocky", "Windy", "Foggy", "Stormy", "White", "Blue", "Gray", "Salt", "Wave"],
            river: ["Winding", "Rushing", "Broad", "Silty", "Clear", "Deep", "Shallow", "Fish", "Swift", "Calm"],
            marsh: ["Misty", "Foggy", "Gloomy", "Hidden", "Sunken", "Reed", "Frog", "Damp", "Bog", "Murky"]
        };
        
        const suffixes = {
            forest: ["Woods", "Forest", "Timberland", "Grove", "Wilderness", "Thicket", "Pines", "Oaks", "Birches", "Woodland"],
            plains: ["Fields", "Plains", "Grasslands", "Meadows", "Pastures", "Valley", "Flats", "Prairie", "Downs", "Heath"],
            hills: ["Hills", "Highlands", "Ridges", "Knolls", "Bluffs", "Slopes", "Rises", "Downs", "Mounds", "Heights"],
            mountains: ["Mountains", "Peaks", "Cliffs", "Crags", "Heights", "Mounts", "Spires", "Summit", "Ridge", "Range"],
            coastline: ["Shore", "Coast", "Beach", "Cove", "Bay", "Sands", "Cliffs", "Harbor", "Point", "Head"],
            river: ["River", "Stream", "Waters", "Ford", "Flow", "Current", "Rapids", "Creek", "Brook", "Banks"],
            marsh: ["Marsh", "Swamp", "Wetlands", "Bog", "Fen", "Mire", "Quagmire", "Reeds", "Pools", "Bottomlands"]
        };
        
        // Add cultural variations based on landmass
        const culturalNames = {
            scandinavia: {
                prefixes: ["Björn", "Frost", "Ulf", "Thor", "Odin", "Loki", "Jötun", "Æsir", "Ymir", "Balder"],
                suffixes: ["fjord", "heim", "gard", "mark", "dal", "fjell", "vik", "nes", "øy", "tind"]
            },
            britannia: {
                prefixes: ["Woden", "King's", "Queen's", "Mercia", "Wessex", "Angle", "Saxon", "Celt", "Pict", "Briton"],
                suffixes: ["shire", "borough", "field", "moor", "wold", "dale", "ham", "ton", "wick", "ford"]
            },
            frankia: {
                prefixes: ["Charle", "Louis", "Saint", "Royal", "High", "Black", "White", "Old", "New", "Grand"],
                suffixes: ["mont", "ville", "bourg", "champ", "val", "roche", "eau", "bois", "terre", "pont"]
            }
        };
        
        // Get the appropriate arrays based on terrain and landmass
        let prefix, suffix;
        
        // Decide whether to use cultural or terrain-based naming (50/50 chance)
        if (culturalNames[landmassId] && Math.random() > 0.5) {
            prefix = culturalNames[landmassId].prefixes[Math.floor(Math.random() * culturalNames[landmassId].prefixes.length)];
            suffix = culturalNames[landmassId].suffixes[Math.floor(Math.random() * culturalNames[landmassId].suffixes.length)];
            return `${prefix}${suffix}`;
        } else {
            const terrainPrefixes = prefixes[terrainType] || prefixes.plains;
            const terrainSuffixes = suffixes[terrainType] || suffixes.plains;
            
            prefix = terrainPrefixes[Math.floor(Math.random() * terrainPrefixes.length)];
            suffix = terrainSuffixes[Math.floor(Math.random() * terrainSuffixes.length)];
            return `${prefix} ${suffix}`;
        }
    }
    
    /**
     * Generate resources for a region based on terrain and landmass
     * @param {string} terrainType - Type of terrain
     * @param {string} landmassId - ID of the landmass
     * @returns {Object} - Generated resources
     */
    function generateRegionResources(terrainType, landmassId) {
        const terrain = TERRAIN_TYPES[terrainType];
        const landmass = LANDMASS_TYPES[landmassId.toUpperCase()];
        
        if (!terrain || !landmass) {
            console.error(`Invalid terrain type ${terrainType} or landmass ID ${landmassId}`);
            return {};
        }
        
        const resources = {};
        
        // Apply base resource weights from terrain
        for (const resourceType in terrain.baseResourceWeights) {
            const resourceWeight = terrain.baseResourceWeights[resourceType];
            
            resources[resourceType] = {
                abundance: Utils.randomBetween(resourceWeight.abundance[0], resourceWeight.abundance[1]),
                accessibility: Utils.randomBetween(resourceWeight.accessibility[0], resourceWeight.accessibility[1])
            };
            
            // Apply landmass modifiers
            if (landmass.resourceModifiers && landmass.resourceModifiers[resourceType]) {
                resources[resourceType].abundance *= landmass.resourceModifiers[resourceType];
                // Cap at 100
                if (resources[resourceType].abundance > 100) {
                    resources[resourceType].abundance = 100;
                }
            }
        }
        
        return resources;
    }
    
    /**
     * Generate a landmass with regions
     * @param {string} landmassType - Type of landmass
     * @returns {Object} - Generated landmass with regions
     */
    function generateLandmass(landmassType) {
        const landmassConfig = LANDMASS_TYPES[landmassType.toUpperCase()];
        if (!landmassConfig) {
            console.error(`Invalid landmass type: ${landmassType}`);
            return null;
        }
        
        // Determine landmass size (number of regions)
        const landmassSize = Utils.randomBetween(landmassConfig.baseSizeRange[0], landmassConfig.baseSizeRange[1]);
        
        // Create landmass
        const landmass = {
            id: `${landmassConfig.id}_${Date.now()}`,
            type: landmassConfig.id,
            name: landmassConfig.name,
            description: landmassConfig.description,
            size: landmassSize,
            regionIds: [],
            factionIds: [],
            neighborLandmasses: []
        };
        
        // Generate regions for this landmass
        const regions = [];
        
        for (let i = 0; i < landmassSize; i++) {
            // Determine terrain type based on distribution
            const terrainType = determineTerrainType(landmassConfig.terrainDistribution);
            
            // Generate region size in acreage
            const regionSize = Utils.randomBetween(REGION_SIZE_RANGE[0], REGION_SIZE_RANGE[1]);
            
            // Create region
            const region = {
                id: `region_${landmassConfig.id}_${i}_${Date.now()}`,
                landmassId: landmass.id,
                name: generateRegionName(terrainType, landmassConfig.id),
                type: terrainType,
                acreage: regionSize,
                resources: generateRegionResources(terrainType, landmassConfig.id),
                settlementIds: [],
                buildingIds: [],
                ownerId: null, // To be assigned later by faction system
                neighbors: [], // Adjacent regions
                discoveredByPlayer: false,
                exploredByPlayer: false
            };
            
            regions.push(region);
            landmass.regionIds.push(region.id);
            
            // Determine if this is a good starting position for player
            if (landmassConfig.startingRegion && 
                (terrainType === 'plains' || terrainType === 'coastline') &&
                !playerStartingRegion) {
                playerStartingRegion = region;
            }
        }
        
        // TODO: Create adjacency between regions (for a more realistic map)
        // This would require a more complex algorithm like Voronoi diagrams
        // For now, we'll just make some simple connections based on index
        
        // Connect regions (simplified for now)
        for (let i = 0; i < regions.length; i++) {
            // Connect to 2-4 other regions randomly
            const numConnections = Utils.randomBetween(2, 4);
            const potentialNeighbors = [...Array(regions.length).keys()].filter(j => j !== i);
            
            // Shuffle potential neighbors
            Utils.shuffleArray(potentialNeighbors);
            
            // Take the first N connections
            for (let j = 0; j < Math.min(numConnections, potentialNeighbors.length); j++) {
                const neighborIndex = potentialNeighbors[j];
                
                // Add as neighbor if not already a neighbor
                if (!regions[i].neighbors.includes(regions[neighborIndex].id)) {
                    regions[i].neighbors.push(regions[neighborIndex].id);
                    regions[neighborIndex].neighbors.push(regions[i].id);
                }
            }
        }
        
        return { landmass, regions };
    }
    
    /**
     * Determine terrain type based on distribution weights
     * @param {Object} distribution - Distribution of terrain types
     * @returns {string} - Selected terrain type
     */
    function determineTerrainType(distribution) {
        const totalWeight = Object.values(distribution).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const terrain in distribution) {
            if (random < distribution[terrain]) {
                return terrain;
            }
            random -= distribution[terrain];
        }
        
        // Default to plains if something went wrong
        return 'plains';
    }
    
    /**
     * Generate sea routes between landmasses
     * @param {Array} landmasses - Array of landmasses
     * @returns {Array} - Generated sea routes
     */
    function generateSeaRoutes(landmasses) {
        const seaRoutes = [];
        
        // Create routes between each pair of landmasses
        for (let i = 0; i < landmasses.length; i++) {
            for (let j = i + 1; j < landmasses.length; j++) {
                const landmass1 = landmasses[i];
                const landmass2 = landmasses[j];
                
                // Create sea route
                const seaRoute = {
                    id: `sea_route_${landmass1.id}_${landmass2.id}`,
                    endpoints: [landmass1.id, landmass2.id],
                    distance: Utils.randomBetween(3, 10), // Distance in days
                    dangerLevel: Utils.randomBetween(1, 5), // 1-5 danger scale
                    travelTime: Utils.randomBetween(3, 10) // Travel time in days
                };
                
                seaRoutes.push(seaRoute);
                
                // Add to neighbor list for both landmasses
                landmass1.neighborLandmasses.push(landmass2.id);
                landmass2.neighborLandmasses.push(landmass1.id);
            }
        }
        
        return seaRoutes;
    }
    
    // Public API
    return {
        /**
         * Initialize the world generator
         * @param {number} [seed] - Random seed for generation
         */
        init: function(seed) {
            worldData.seed = seed || Math.floor(Math.random() * 1000000);
            console.log(`World Generator initialized with seed ${worldData.seed}`);
        },
        
        /**
         * Generate a new world
         * @returns {Object} - Generated world data
         */
        generateWorld: function() {
            console.log("Generating new world...");
            
            // Reset world data
            worldData = {
                seed: worldData.seed,
                year: 800,
                landmasses: [],
                regions: [],
                settlements: [],
                factions: [],
                tradingPosts: [],
                seaRoutes: [],
                landRoutes: []
            };
            
            playerStartingRegion = null;
            
            // Generate Landmasses
            for (const landmassType in LANDMASS_TYPES) {
                console.log(`Generating ${landmassType} landmass...`);
                
                const { landmass, regions } = generateLandmass(landmassType);
                
                worldData.landmasses.push(landmass);
                worldData.regions.push(...regions);
            }
            
            // Generate sea routes between landmasses
            worldData.seaRoutes = generateSeaRoutes(worldData.landmasses);
            
            // If no starting region was found, pick one
            if (!playerStartingRegion) {
                const scandinavianRegions = worldData.regions.filter(
                    r => worldData.landmasses.find(
                        l => l.id === r.landmassId && l.type === 'scandinavia'
                    )
                );
                
                if (scandinavianRegions.length > 0) {
                    playerStartingRegion = scandinavianRegions[0];
                } else {
                    playerStartingRegion = worldData.regions[0];
                }
            }
            
            // Mark player's starting region as discovered
            playerStartingRegion.discoveredByPlayer = true;
            playerStartingRegion.exploredByPlayer = true;
            
            console.log(`World generation complete. Created ${worldData.landmasses.length} landmasses and ${worldData.regions.length} regions.`);
            
            return worldData;
        },
        
        /**
         * Get world data
         * @returns {Object} - Current world data
         */
        getWorldData: function() {
            return JSON.parse(JSON.stringify(worldData)); // Deep copy
        },
        
        /**
         * Get all landmasses
         * @returns {Array} - Array of landmass objects
         */
        getLandmasses: function() {
            return [...worldData.landmasses];
        },
        
        /**
         * Get all regions
         * @returns {Array} - Array of region objects
         */
        getRegions: function() {
            return [...worldData.regions];
        },
        
        /**
         * Get a specific region by ID
         * @param {string} regionId - Region ID
         * @returns {Object|null} - Region object or null if not found
         */
        getRegionById: function(regionId) {
            return worldData.regions.find(r => r.id === regionId) || null;
        },
        
        /**
         * Get player's starting region
         * @returns {Object} - Starting region
         */
        getPlayerStartingRegion: function() {
            return playerStartingRegion;
        },
        
        /**
         * Get neighboring regions of a specific region
         * @param {string} regionId - Region ID
         * @returns {Array} - Array of neighboring region objects
         */
        getNeighborRegions: function(regionId) {
            const region = this.getRegionById(regionId);
            if (!region) return [];
            
            return region.neighbors.map(id => this.getRegionById(id)).filter(r => r !== null);
        },
        
        /**
         * Mark a region as discovered by the player
         * @param {string} regionId - Region ID
         * @returns {boolean} - Whether the operation was successful
         */
        discoverRegion: function(regionId) {
            const region = this.getRegionById(regionId);
            if (!region) return false;
            
            region.discoveredByPlayer = true;
            return true;
        },
        
        /**
         * Mark a region as explored by the player
         * @param {string} regionId - Region ID
         * @returns {boolean} - Whether the operation was successful
         */
        exploreRegion: function(regionId) {
            const region = this.getRegionById(regionId);
            if (!region || !region.discoveredByPlayer) return false;
            
            region.exploredByPlayer = true;
            return true;
        },
        
        /**
         * Get all discovered regions
         * @returns {Array} - Array of discovered region objects
         */
        getDiscoveredRegions: function() {
            return worldData.regions.filter(r => r.discoveredByPlayer);
        },
        
        /**
         * Get all explored regions
         * @returns {Array} - Array of explored region objects
         */
        getExploredRegions: function() {
            return worldData.regions.filter(r => r.exploredByPlayer);
        },
        
        /**
         * Update world for a new game tick
         * @param {number} daysPassed - Number of days that passed
         */
        processTick: function(daysPassed) {
            // Update world date
            worldData.year += daysPassed / 365; // Approximate
            
            // Here we would update dynamic world elements
            // - Random events in regions
            // - NPC faction actions
            // - Resource regeneration
            // - Climate/seasonal changes
        }
    };
})();