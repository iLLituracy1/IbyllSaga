/**
 * Viking Legacy - Land and Region Management System
 * Handles territory, land types, resources, and regional management
 */

const LandManager = (function() {
    // Private variables
    let territory = {
        totalAcreage: 50,  // Starting with a small territory
        regions: [
            {
                id: "settlement",
                name: "Settlement Area",
                type: "plains",
                acreage: 20,
                resources: {
                    food: { abundance: 50, accessibility: 80 },  // Wild game
                    wood: { abundance: 30, accessibility: 70 }   // Scattered trees
                },
                buildings: []
            },
            {
                id: "nearbyForest",
                name: "Nearby Forest",
                type: "forest",
                acreage: 20,
                resources: {
                    wood: { abundance: 90, accessibility: 60 },
                    food: { abundance: 60, accessibility: 50 },  // Wild game
                    herbs: { abundance: 40, accessibility: 70 }
                },
                buildings: []
            },
            {
                id: "rockyHills",
                name: "Rocky Hills",
                type: "hills",
                acreage: 10,
                resources: {
                    stone: { abundance: 80, accessibility: 50 },
                    metal: { abundance: 40, accessibility: 30 }
                },
                buildings: []
            }
        ],
        // Land that hasn't been explored/claimed yet
        unexploredLand: 100  
    };
    
    // Building definitions - will be moved to a building manager later
    const buildingTypes = {
        // Basic resource production buildings
        huntingLodge: {
            id: "huntingLodge",
            name: "Hunting Lodge",
            description: "A place for hunters to prepare for hunts and process game.",
            jobs: [
                { title: "Hunter", maxWorkers: 3, resourceType: "food", baseProduction: 3 }
            ],
            requirements: {
                acreage: 5,
                validTerrains: ["forest", "plains"],
                resources: { wood: 15 }
            },
            effects: {
                resourceMultipliers: { food: 1.2 }
            }
        },
        lumberCamp: {
            id: "lumberCamp",
            name: "Lumber Camp",
            description: "A camp for wood cutting operations in forested areas.",
            jobs: [
                { title: "Woodcutter", maxWorkers: 3, resourceType: "wood", baseProduction: 2 }
            ],
            requirements: {
                acreage: 5,
                validTerrains: ["forest"],
                resources: { wood: 10 }
            },
            effects: {
                resourceMultipliers: { wood: 1.2 }
            }
        },
        quarry: {
            id: "quarry",
            name: "Stone Quarry",
            description: "An area where stone can be cut and processed.",
            jobs: [
                { title: "Quarryman", maxWorkers: 3, resourceType: "stone", baseProduction: 1.5 }
            ],
            requirements: {
                acreage: 6,
                validTerrains: ["hills", "mountains"],
                resources: { wood: 15, metal: 5 }
            },
            effects: {
                resourceMultipliers: { stone: 1.2 }
            }
        },
        mine: {
            id: "mine",
            name: "Mine",
            description: "A shaft into the earth to extract metals and minerals.",
            jobs: [
                { title: "Miner", maxWorkers: 3, resourceType: "metal", baseProduction: 1 }
            ],
            requirements: {
                acreage: 4,
                validTerrains: ["hills", "mountains"],
                resources: { wood: 20, stone: 10 }
            },
            effects: {
                resourceMultipliers: { metal: 1.3 }
            }
        },
        farm: {
            id: "farm",
            name: "Farm",
            description: "Tilled fields for growing crops.",
            jobs: [
                { title: "Farmer", maxWorkers: 4, resourceType: "food", baseProduction: 2 }
            ],
            requirements: {
                acreage: 10,
                validTerrains: ["plains"],
                resources: { wood: 10 }
            },
            effects: {
                resourceMultipliers: { food: 1.5 }
            }
        },
        house: {
            id: "house",
            name: "House",
            description: "A dwelling for your people.",
            jobs: [],  // Houses don't create jobs
            requirements: {
                acreage: 1,
                validTerrains: ["plains", "forest", "hills"],
                resources: { wood: 20, stone: 10 }
            },
            effects: {
                housingCapacity: 5
            }
        }
    };
    
    // Constructed buildings
    let buildings = [];
    
    // Track worker assignments to buildings
    let workerAssignments = {};
    
    // Private methods
    
    /**
     * Check if a building can be constructed in a region
     * @param {string} buildingTypeId - Type of building
     * @param {string} regionId - Region to check
     * @returns {boolean} - Whether the building can be constructed
     */
    function canConstructBuilding(buildingTypeId, regionId) {
        const buildingType = buildingTypes[buildingTypeId];
        const region = getRegionById(regionId);
        
        if (!buildingType || !region) return false;
        
        // Check terrain compatibility
        if (!buildingType.requirements.validTerrains.includes(region.type)) {
            return false;
        }
        
        // Check available acreage
        const usedAcreage = region.buildings.reduce((total, buildingId) => {
            const building = getBuildingById(buildingId);
            if (building) {
                const type = buildingTypes[building.type];
                return total + (type.requirements.acreage || 0);
            }
            return total;
        }, 0);
        
        const remainingAcreage = region.acreage - usedAcreage;
        if (remainingAcreage < buildingType.requirements.acreage) {
            return false;
        }
        
        // Check resources (handled by ResourceManager)
        return true;
    }
    
    /**
     * Get region by ID
     * @param {string} regionId - Region ID to find
     * @returns {Object|null} - Region object or null if not found
     */
    function getRegionById(regionId) {
        return territory.regions.find(region => region.id === regionId) || null;
    }
    
    /**
     * Get building by ID
     * @param {string} buildingId - Building ID to find
     * @returns {Object|null} - Building object or null if not found
     */
    function getBuildingById(buildingId) {
        return buildings.find(building => building.id === buildingId) || null;
    }
    
    /**
     * Calculate production for a specific building
     * @param {Object} building - Building object
     * @returns {Object} - Resources produced by the building
     */
    function calculateBuildingProduction(building) {
        const buildingType = buildingTypes[building.type];
        const region = getRegionById(building.region);
        
        if (!buildingType || !region) return {};
        
        const production = {};
        
        // For each job in the building
        buildingType.jobs.forEach(job => {
            const resourceType = job.resourceType;
            const assignedWorkers = building.workers.length;
            
            if (assignedWorkers === 0 || !resourceType) return;
            
            // Base production from workers
            let baseAmount = job.baseProduction * assignedWorkers;
            
            // Adjust based on region abundance and accessibility
            if (region.resources[resourceType]) {
                const abundance = region.resources[resourceType].abundance / 100;
                const accessibility = region.resources[resourceType].accessibility / 100;
                baseAmount *= abundance * accessibility;
            }
            
            // Adjust based on building effects
            if (buildingType.effects.resourceMultipliers && 
                buildingType.effects.resourceMultipliers[resourceType]) {
                baseAmount *= buildingType.effects.resourceMultipliers[resourceType];
            }
            
            // Adjust based on building level/condition
            baseAmount *= building.condition / 100;
            
            // Add to production
            production[resourceType] = baseAmount;
        });
        
        return production;
    }
    
    // Public API
    return {
        /**
         * Initialize the land manager
         */
        init: function() {
            console.log("Land Manager initialized");
            
            // Set up starting buildings
            this.constructBuilding("house", "settlement");
            
            // Update UI
            this.updateUI();
        },
        
        /**
         * Get territory data
         * @returns {Object} - Current territory data
         */
        getTerritory: function() {
            return JSON.parse(JSON.stringify(territory)); // Deep copy
        },
        
        /**
         * Get all regions
         * @returns {Array} - Array of region objects
         */
        getRegions: function() {
            return [...territory.regions];
        },
        
        /**
         * Get all buildings
         * @returns {Array} - Array of building objects
         */
        getBuildings: function() {
            return [...buildings];
        },
        
        /**
         * Get all building types
         * @returns {Object} - Building type definitions
         */
        getBuildingTypes: function() {
            return {...buildingTypes}; // Shallow copy
        },
        
        /**
         * Construct a new building
         * @param {string} buildingTypeId - Type of building to construct
         * @param {string} regionId - Region to build in
         * @returns {Object|null} - New building or null if construction failed
         */
        constructBuilding: function(buildingTypeId, regionId) {
            // Check if building can be constructed
            if (!canConstructBuilding(buildingTypeId, regionId)) {
                console.warn(`Cannot construct ${buildingTypeId} in ${regionId}`);
                return null;
            }
            
            const buildingType = buildingTypes[buildingTypeId];
            
            // Check if we can afford the building
            const resources = buildingType.requirements.resources;
            if (!ResourceManager.canAffordBuilding(buildingTypeId)) {
                Utils.log(`Not enough resources to build ${buildingType.name}`, "important");
                return null;
            }
            
            // Pay for building
            if (!ResourceManager.payForBuilding(buildingTypeId)) {
                return null;
            }
            
            // Create new building
            const newBuilding = {
                id: `${buildingTypeId}_${Date.now()}`,
                type: buildingTypeId,
                name: buildingType.name,
                level: 1,
                region: regionId,
                workers: [],
                condition: 100 // 100% condition
            };
            
            // Add building to list
            buildings.push(newBuilding);
            
            // Add building to region
            const region = getRegionById(regionId);
            if (region) {
                region.buildings.push(newBuilding.id);
            }
            
            // Initialize worker assignment tracking
            workerAssignments[newBuilding.id] = [];
            
            // Log construction
            Utils.log(`A new ${buildingType.name} has been constructed in ${region.name}.`, "success");
            
            // Update UI
            this.updateUI();
            
            return newBuilding;
        },
        
        /**
         * Assign a worker to a building
         * @param {string} buildingId - Building ID
         * @param {string} workerId - Character ID of worker
         * @returns {boolean} - Whether assignment was successful
         */
        assignWorker: function(buildingId, workerId) {
            const building = getBuildingById(buildingId);
            if (!building) return false;
            
            const buildingType = buildingTypes[building.type];
            if (!buildingType) return false;
            
            // Check if building has any jobs
            if (buildingType.jobs.length === 0) return false;
            
            // Check if building is at max workers
            const maxWorkers = buildingType.jobs.reduce((total, job) => total + job.maxWorkers, 0);
            if (building.workers.length >= maxWorkers) return false;
            
            // Check if worker exists and is available
            const character = PopulationManager.getCharacterById(workerId);
            if (!character || character.role !== 'worker') return false;
            
            // Check if worker is already assigned to a building
            for (const b of buildings) {
                if (b.workers.includes(workerId)) {
                    // Remove from current building
                    b.workers = b.workers.filter(id => id !== workerId);
                    break;
                }
            }
            
            // Assign worker to building
            building.workers.push(workerId);
            
            // Update UI
            this.updateUI();
            
            return true;
        },
        
        /**
         * Remove a worker from a building
         * @param {string} buildingId - Building ID
         * @param {string} workerId - Character ID of worker
         * @returns {boolean} - Whether removal was successful
         */
        removeWorker: function(buildingId, workerId) {
            const building = getBuildingById(buildingId);
            if (!building) return false;
            
            // Remove worker from building
            const index = building.workers.indexOf(workerId);
            if (index === -1) return false;
            
            building.workers.splice(index, 1);
            
            // Update UI
            this.updateUI();
            
            return true;
        },
        
        /**
         * Process resource production for a game tick
         * @param {number} tickSize - Size of the game tick in days
         * @returns {Object} - Resources produced during this tick
         */
        processTick: function(tickSize) {
            const production = {};
            
            // Calculate production for each building
            for (const building of buildings) {
                const buildingProduction = calculateBuildingProduction(building);
                
                // Add building production to total
                for (const resource in buildingProduction) {
                    const amount = buildingProduction[resource] * tickSize;
                    if (production[resource]) {
                        production[resource] += amount;
                    } else {
                        production[resource] = amount;
                    }
                }
            }
            
            // Add resources
            if (Object.keys(production).length > 0) {
                ResourceManager.addResources(production);
            }
            
            return production;
        },
        
        /**
         * Explore and potentially claim new land
         * @returns {Object|null} - New region or null if exploration failed
         */
        exploreLand: function() {
            // Check if we have warriors available for exploration
            const population = PopulationManager.getPopulation();
            if (population.warriors < 1) {
                Utils.log("You need at least one warrior to explore new lands.", "important");
                return null;
            }
            
            // Check if there's unexplored land
            if (territory.unexploredLand <= 0) {
                Utils.log("There is no more land to explore in this area.", "important");
                return null;
            }
            
            // Determine region size
            const newAcreage = Utils.randomBetween(10, 20);
            
            // Determine region type
            const regionTypes = ["plains", "forest", "hills", "mountains", "coastline"];
            const regionType = regionTypes[Utils.randomBetween(0, regionTypes.length - 1)];
            
            // Determine resources based on region type
            const resources = {};
            
            switch (regionType) {
                case "plains":
                    resources.food = { abundance: Utils.randomBetween(60, 90), accessibility: Utils.randomBetween(70, 90) };
                    resources.wood = { abundance: Utils.randomBetween(20, 40), accessibility: Utils.randomBetween(80, 95) };
                    break;
                case "forest":
                    resources.wood = { abundance: Utils.randomBetween(70, 95), accessibility: Utils.randomBetween(60, 80) };
                    resources.food = { abundance: Utils.randomBetween(50, 70), accessibility: Utils.randomBetween(50, 70) };
                    resources.herbs = { abundance: Utils.randomBetween(40, 70), accessibility: Utils.randomBetween(60, 80) };
                    break;
                case "hills":
                    resources.stone = { abundance: Utils.randomBetween(60, 90), accessibility: Utils.randomBetween(50, 70) };
                    resources.metal = { abundance: Utils.randomBetween(30, 60), accessibility: Utils.randomBetween(30, 50) };
                    resources.wood = { abundance: Utils.randomBetween(30, 50), accessibility: Utils.randomBetween(60, 80) };
                    break;
                case "mountains":
                    resources.stone = { abundance: Utils.randomBetween(80, 95), accessibility: Utils.randomBetween(30, 50) };
                    resources.metal = { abundance: Utils.randomBetween(50, 80), accessibility: Utils.randomBetween(20, 40) };
                    break;
                case "coastline":
                    resources.food = { abundance: Utils.randomBetween(70, 90), accessibility: Utils.randomBetween(60, 80) }; // Fish
                    resources.salt = { abundance: Utils.randomBetween(60, 90), accessibility: Utils.randomBetween(70, 90) };
                    break;
            }
            
            // Create new region
            const regionId = `region_${Date.now()}`;
            const regionName = this.generateRegionName(regionType);
            
            const newRegion = {
                id: regionId,
                name: regionName,
                type: regionType,
                acreage: newAcreage,
                resources: resources,
                buildings: []
            };
            
            // Add to territory
            territory.regions.push(newRegion);
            territory.totalAcreage += newAcreage;
            territory.unexploredLand -= newAcreage;
            
            // Log exploration
            Utils.log(`Your warriors have explored and claimed ${newAcreage} acres of ${regionType} called ${regionName}.`, "success");
            
            // Update UI
            this.updateUI();
            
            // Award fame
            RankManager.addFame(10, "Expanded your territory");
            
            return newRegion;
        },
        
        /**
         * Generate a name for a new region
         * @param {string} regionType - Type of region
         * @returns {string} - Generated name
         */
        generateRegionName: function(regionType) {
            const prefixes = {
                plains: ["Vast", "Open", "Grassy", "Fertile", "Wild"],
                forest: ["Dark", "Dense", "Ancient", "Misty", "Green"],
                hills: ["Rolling", "Rocky", "Barren", "Windy", "Steep"],
                mountains: ["Jagged", "Towering", "Snowy", "Forbidding", "Craggy"],
                coastline: ["Sandy", "Rocky", "Windy", "Foggy", "Stormy"]
            };
            
            const suffixes = {
                plains: ["Plains", "Fields", "Grasslands", "Meadows", "Pastures"],
                forest: ["Forest", "Woods", "Timberland", "Grove", "Wilderness"],
                hills: ["Hills", "Highlands", "Ridges", "Knolls", "Bluffs"],
                mountains: ["Mountains", "Peaks", "Cliffs", "Crags", "Heights"],
                coastline: ["Shore", "Coast", "Beach", "Cove", "Bay"]
            };
            
            const prefix = prefixes[regionType][Utils.randomBetween(0, prefixes[regionType].length - 1)];
            const suffix = suffixes[regionType][Utils.randomBetween(0, suffixes[regionType].length - 1)];
            
            return `${prefix} ${suffix}`;
        },
        
        /**
         * Update the game UI with land and building information
         */
        updateUI: function() {
            // This would update the game UI with land and building information
            // Implementation depends on UI structure
            console.log("Land UI updated");
        }
    };
})();