/**
 * Viking Legacy - Building Management System
 * Handles building construction, upgrades, and job management
 */

const BuildingManager = (function() {
    // Building definitions
    const buildingTypes = {
        // Housing buildings
        house: {
            id: "house",
            name: "House",
            description: "A simple wooden house that can shelter a family.",
            category: "housing",
            buildCosts: { wood: 20, stone: 10 },
            maintenanceCosts: {},
            effects: {
                housingCapacity: 5
            },
            upgrades: ["longhouse"]
        },
        longhouse: {
            id: "longhouse",
            name: "Longhouse",
            description: "A larger structure that can house multiple families.",
            category: "housing",
            buildCosts: { wood: 40, stone: 20 },
            maintenanceCosts: {},
            effects: {
                housingCapacity: 15
            },
            requirements: {
                buildings: ["house"],
                rank: 3 // Requires "Rising Skald" rank or higher
            }
        },
        
        // Resource buildings
        huntersLodge: {
            id: "huntersLodge",
            name: "Hunter's Lodge",
            description: "A place for hunters to prepare for hunts and process game.",
            category: "resource",
            buildCosts: { wood: 15 },
            maintenanceCosts: {},
            jobs: [
                { 
                    title: "Hunter", 
                    maxWorkers: 3, 
                    produces: {
                        resource: "food",
                        baseAmount: 3,
                        skill: "hunting"
                    }
                }
            ],
            landRequirements: {
                terrain: ["forest", "plains"],
                acreage: 5
            }
        },
        lumberCamp: {
            id: "lumberCamp",
            name: "Lumber Camp",
            description: "A camp for wood cutting operations in forested areas.",
            category: "resource",
            buildCosts: { wood: 10 },
            maintenanceCosts: {},
            jobs: [
                { 
                    title: "Woodcutter", 
                    maxWorkers: 3, 
                    produces: {
                        resource: "wood",
                        baseAmount: 2,
                        skill: "woodcutting"
                    }
                }
            ],
            landRequirements: {
                terrain: ["forest"],
                acreage: 5
            }
        },
        quarry: {
            id: "quarry",
            name: "Stone Quarry",
            description: "An area where stone can be cut and processed.",
            category: "resource",
            buildCosts: { wood: 15, metal: 5 },
            maintenanceCosts: {},
            jobs: [
                { 
                    title: "Quarryman", 
                    maxWorkers: 3, 
                    produces: {
                        resource: "stone",
                        baseAmount: 1.5,
                        skill: "mining"
                    }
                }
            ],
            landRequirements: {
                terrain: ["hills", "mountains"],
                acreage: 6
            }
        },
        mine: {
            id: "mine",
            name: "Mine",
            description: "A shaft into the earth to extract metals and minerals.",
            category: "resource",
            buildCosts: { wood: 20, stone: 10 },
            maintenanceCosts: { wood: 0.5 }, // Consumes wood for supports
            jobs: [
                { 
                    title: "Miner", 
                    maxWorkers: 3, 
                    produces: {
                        resource: "metal",
                        baseAmount: 1,
                        skill: "mining"
                    }
                }
            ],
            landRequirements: {
                terrain: ["hills", "mountains"],
                acreage: 4
            },
            requirements: {
                rank: 2 // Requires "Humble Bondi" rank or higher
            }
        },
        farm: {
            id: "farm",
            name: "Farm",
            description: "Tilled fields for growing crops.",
            category: "resource",
            buildCosts: { wood: 10 },
            maintenanceCosts: {},
            jobs: [
                { 
                    title: "Farmer", 
                    maxWorkers: 4, 
                    produces: {
                        resource: "food",
                        baseAmount: 2,
                        skill: "farming"
                    }
                }
            ],
            landRequirements: {
                terrain: ["plains"],
                acreage: 10
            },
            seasonalModifiers: {
                "Spring": 0.8,  // Planting season, less production
                "Summer": 1.2,  // Growing season, more production
                "Fall": 1.5,    // Harvest season, max production
                "Winter": 0.2   // Winter, minimal production
            }
        },
        
        // Military buildings
        trainingGround: {
            id: "trainingGround",
            name: "Training Ground",
            description: "An area where warriors can train and improve their skills.",
            category: "military",
            buildCosts: { wood: 15, stone: 5 },
            maintenanceCosts: {},
            jobs: [
                { 
                    title: "Trainer", 
                    maxWorkers: 1,
                    effects: {
                        trainingEfficiency: 1.2
                    }
                }
            ],
            effects: {
                warriorTraining: true,
                skillGain: { combat: 1.5 }
            },
            landRequirements: {
                terrain: ["plains"],
                acreage: 8
            },
            requirements: {
                rank: 3 // Requires "Rising Skald" rank or higher
            }
        },
        
        // Crafting buildings
        smithy: {
            id: "smithy",
            name: "Smithy",
            description: "A workshop for crafting tools and weapons from metal.",
            category: "crafting",
            buildCosts: { wood: 25, stone: 15, metal: 5 },
            maintenanceCosts: { wood: 0.5 }, // Fuel for the forge
            jobs: [
                { 
                    title: "Blacksmith", 
                    maxWorkers: 2,
                    produces: {
                        // Will be used for crafting system
                    }
                }
            ],
            effects: {
                resourceModifiers: { metal: 1.5 },
                crafting: ["tools", "weapons"]
            },
            landRequirements: {
                terrain: ["plains", "hills"],
                acreage: 3
            },
            requirements: {
                rank: 2 // Requires "Humble Bondi" rank or higher
            }
        }
    };
    
    // Active buildings in the settlement
    let activeBuildings = [];
    
    // Track total housing capacity
    let housingCapacity = 0;
    
    // Private methods
    
    /**
     * Check if requirements for a building are met
     * @param {string} buildingTypeId - Type of building to check
     * @param {Object} gameState - Current game state
     * @param {string} regionId - Region to potentially build in
     * @returns {Object} - Object with result and reason
     */
    function checkBuildingRequirements(buildingTypeId, gameState, regionId) {
        const buildingType = buildingTypes[buildingTypeId];
        if (!buildingType) {
            return { 
                canBuild: false, 
                reason: "Unknown building type." 
            };
        }
        
        // Check rank requirements
        if (buildingType.requirements && buildingType.requirements.rank) {
            const currentRank = RankManager.getCurrentRank();
            if (currentRank.index < buildingType.requirements.rank) {
                return { 
                    canBuild: false, 
                    reason: `Requires ${RankManager.getRankByIndex(buildingType.requirements.rank).title} rank or higher.` 
                };
            }
        }
        
        // Check prerequisite buildings
        if (buildingType.requirements && buildingType.requirements.buildings) {
            for (const requiredBuilding of buildingType.requirements.buildings) {
                if (!activeBuildings.some(b => b.type === requiredBuilding)) {
                    return { 
                        canBuild: false, 
                        reason: `Requires a ${buildingTypes[requiredBuilding].name} to be built first.` 
                    };
                }
            }
        }
        
        // Check land requirements if we have a region specified
        if (regionId && buildingType.landRequirements) {
            const region = LandManager.getRegionById(regionId);
            if (!region) {
                return { 
                    canBuild: false, 
                    reason: "Invalid region." 
                };
            }
            
            // Check terrain compatibility
            if (buildingType.landRequirements.terrain && 
                !buildingType.landRequirements.terrain.includes(region.type)) {
                return { 
                    canBuild: false, 
                    reason: `Cannot build on ${region.type} terrain. Requires ${buildingType.landRequirements.terrain.join(" or ")}.` 
                };
            }
            
            // Check required acreage
            if (buildingType.landRequirements.acreage) {
                const usedAcreage = activeBuildings
                    .filter(b => b.regionId === regionId)
                    .reduce((total, building) => {
                        const type = buildingTypes[building.type];
                        return total + (type.landRequirements?.acreage || 0);
                    }, 0);
                
                const remainingAcreage = region.acreage - usedAcreage;
                if (remainingAcreage < buildingType.landRequirements.acreage) {
                    return { 
                        canBuild: false, 
                        reason: `Not enough available land. Requires ${buildingType.landRequirements.acreage} acres.` 
                    };
                }
            }
        }
        
        // Check resources
        if (buildingType.buildCosts) {
            for (const resource in buildingType.buildCosts) {
                const cost = buildingType.buildCosts[resource];
                const available = ResourceManager.getResourceAmount(resource);
                if (available < cost) {
                    return { 
                        canBuild: false, 
                        reason: `Not enough ${resource}. Need ${cost}, have ${available}.` 
                    };
                }
            }
        }
        
        return { canBuild: true };
    }
    
    /**
     * Calculate production from buildings based on assigned workers
     * @param {Object} gameState - Current game state with date and other info
     * @returns {Object} - Resources produced
     */
    function calculateProduction(gameState) {
        const production = {};
        
        // Process each building
        for (const building of activeBuildings) {
            const buildingType = buildingTypes[building.type];
            if (!buildingType || !buildingType.jobs) continue;
            
            // Get region resource modifiers
            const region = LandManager.getRegionById(building.regionId);
            const regionModifiers = region ? region.resources : {};
            
            // Process each job in the building
            for (const job of buildingType.jobs) {
                if (!job.produces || !job.produces.resource) continue;
                
                const resourceType = job.produces.resource;
                const assignedWorkers = building.workers.length;
                
                if (assignedWorkers === 0) continue;
                
                // Base production from assigned workers
                let baseAmount = job.produces.baseAmount * Math.min(assignedWorkers, job.maxWorkers);
                
                // Adjust based on worker skills
                let skillModifier = 1;
                if (job.produces.skill) {
                    const skillName = job.produces.skill;
                    const averageSkill = building.workers.reduce((sum, workerId) => {
                        const worker = PopulationManager.getCharacterById(workerId);
                        return sum + (worker ? (worker.skills[skillName] || 1) : 1);
                    }, 0) / assignedWorkers;
                    
                    // Skill modifier: 0.8 to 2.0 based on skill level (1-10)
                    skillModifier = 0.8 + (averageSkill / 10 * 1.2);
                }
                
                // Apply skill modifier
                baseAmount *= skillModifier;
                
                // Apply seasonal modifiers for farms and similar buildings
                if (buildingType.seasonalModifiers && gameState.date.season) {
                    const seasonModifier = buildingType.seasonalModifiers[gameState.date.season] || 1;
                    baseAmount *= seasonModifier;
                }
                
                // Apply region resource modifiers
                if (regionModifiers[resourceType]) {
                    const abundance = regionModifiers[resourceType].abundance / 100;
                    const accessibility = regionModifiers[resourceType].accessibility / 100;
                    baseAmount *= abundance * accessibility;
                }
                
                // Apply building condition modifier
                baseAmount *= building.condition / 100;
                
                // Add to production
                if (production[resourceType]) {
                    production[resourceType] += baseAmount;
                } else {
                    production[resourceType] = baseAmount;
                }
            }
            
            // Apply maintenance costs
            if (buildingType.maintenanceCosts) {
                for (const resource in buildingType.maintenanceCosts) {
                    const cost = buildingType.maintenanceCosts[resource];
                    
                    // Subtract from production or create negative production
                    if (production[resource]) {
                        production[resource] -= cost;
                    } else {
                        production[resource] = -cost;
                    }
                }
            }
        }
        
        return production;
    }
    
    /**
     * Update housing capacity based on buildings
     */
    function updateHousingCapacity() {
        housingCapacity = activeBuildings.reduce((total, building) => {
            const buildingType = buildingTypes[building.type];
            if (buildingType && buildingType.effects && buildingType.effects.housingCapacity) {
                return total + buildingType.effects.housingCapacity;
            }
            return total;
        }, 0);
    }
    
    // Public API
    return {
        /**
         * Initialize the building manager
         */
        init: function() {
            console.log("Building Manager initialized");
            
            // Create initial buildings
            this.constructBuilding("house", "settlement");
            
            // Update UI
            this.updateUI();
        },
        
        /**
         * Get all building types
         * @returns {Object} - All building type definitions
         */
        getBuildingTypes: function() {
            return {...buildingTypes}; // Shallow copy of building types
        },
        
        /**
         * Get building type information
         * @param {string} buildingTypeId - Building type ID
         * @returns {Object|null} - Building type definition or null if not found
         */
        getBuildingType: function(buildingTypeId) {
            return buildingTypes[buildingTypeId] ? {...buildingTypes[buildingTypeId]} : null;
        },
        
        /**
         * Get all active buildings
         * @returns {Array} - Array of active building objects
         */
        getBuildings: function() {
            return [...activeBuildings];
        },
        
        /**
         * Get total housing capacity
         * @returns {number} - Total housing capacity
         */
        getHousingCapacity: function() {
            return housingCapacity;
        },
        
        /**
         * Construct a new building
         * @param {string} buildingTypeId - Type of building to construct
         * @param {string} regionId - Region to build in
         * @returns {Object|null} - New building object or null if construction failed
         */
        constructBuilding: function(buildingTypeId, regionId) {
            // Get current game state for requirement checks
            const gameState = GameEngine.getGameState();
            
            // Check building requirements
            const requirements = checkBuildingRequirements(buildingTypeId, gameState, regionId);
            if (!requirements.canBuild) {
                Utils.log(`Cannot build ${buildingTypes[buildingTypeId]?.name || buildingTypeId}: ${requirements.reason}`, "important");
                return null;
            }
            
            const buildingType = buildingTypes[buildingTypeId];
            
            // Pay for building
            if (buildingType.buildCosts) {
                if (!ResourceManager.subtractResources(buildingType.buildCosts)) {
                    return null;
                }
            }
            
            // Create new building
            const newBuilding = {
                id: `${buildingTypeId}_${Date.now()}`,
                type: buildingTypeId,
                name: buildingType.name,
                level: 1,
                regionId: regionId,
                workers: [],
                condition: 100 // 100% condition
            };
            
            // Add building to list
            activeBuildings.push(newBuilding);
            
            // Update housing capacity
            updateHousingCapacity();
            
            // Log construction
            Utils.log(`A new ${buildingType.name} has been constructed.`, "success");
            
            // Update UI
            this.updateUI();
            
            // Award fame for construction
            RankManager.processBuildingConstruction(buildingTypeId);
            
            return newBuilding;
        },
        
        /**
         * Assign a worker to a building
         * @param {string} buildingId - Building ID
         * @param {string} workerId - Character ID of worker
         * @returns {boolean} - Whether assignment was successful
         */
        assignWorker: function(buildingId, workerId) {
            // Find building
            const building = activeBuildings.find(b => b.id === buildingId);
            if (!building) return false;
            
            const buildingType = buildingTypes[building.type];
            if (!buildingType || !buildingType.jobs || buildingType.jobs.length === 0) return false;
            
            // Check if building is at max workers
            const maxWorkers = buildingType.jobs.reduce((total, job) => total + job.maxWorkers, 0);
            if (building.workers.length >= maxWorkers) return false;
            
            // Check if worker exists and is available
            const character = PopulationManager.getCharacterById(workerId);
            if (!character || character.role !== 'worker') return false;
            
            // Check if worker is already assigned to a building
            for (const b of activeBuildings) {
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
            // Find building
            const building = activeBuildings.find(b => b.id === buildingId);
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
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         * @returns {Object} - Resources produced during this tick
         */
        processTick: function(gameState, tickSize) {
            // Calculate production rates
            const productionRates = calculateProduction(gameState);
            
            // Apply tick size to get actual production
            const production = {};
            for (const resource in productionRates) {
                production[resource] = productionRates[resource] * tickSize;
            }
            
            // Process building maintenance and deterioration
            for (const building of activeBuildings) {
                // Building deterioration (very slow)
                building.condition -= 0.1 * tickSize;
                if (building.condition < 0) building.condition = 0;
            }
            
            // Add resources
            if (Object.keys(production).length > 0) {
                ResourceManager.addResources(production);
            }
            
            return production;
        },
        
        /**
         * Upgrade a building
         * @param {string} buildingId - Building ID to upgrade
         * @returns {boolean} - Whether upgrade was successful
         */
        upgradeBuilding: function(buildingId) {
            // Find building
            const building = activeBuildings.find(b => b.id === buildingId);
            if (!building) return false;
            
            const buildingType = buildingTypes[building.type];
            if (!buildingType || !buildingType.upgrades || buildingType.upgrades.length === 0) return false;
            
            // For now, just take the first upgrade option
            const upgradeType = buildingType.upgrades[0];
            const upgradeDef = buildingTypes[upgradeType];
            
            if (!upgradeDef) return false;
            
            // Check requirements for upgrade
            const gameState = GameEngine.getGameState();
            const requirements = checkBuildingRequirements(upgradeType, gameState, building.regionId);
            if (!requirements.canBuild) {
                Utils.log(`Cannot upgrade to ${upgradeDef.name}: ${requirements.reason}`, "important");
                return false;
            }
            
            // Pay for upgrade
            if (upgradeDef.buildCosts) {
                if (!ResourceManager.subtractResources(upgradeDef.buildCosts)) {
                    return false;
                }
            }
            
            // Remove old building
            activeBuildings = activeBuildings.filter(b => b.id !== buildingId);
            
            // Create upgraded building
            const upgradedBuilding = {
                id: `${upgradeType}_${Date.now()}`,
                type: upgradeType,
                name: upgradeDef.name,
                level: 1,
                regionId: building.regionId,
                workers: [...building.workers], // Transfer workers
                condition: 100 // Reset condition
            };
            
            // Add upgraded building
            activeBuildings.push(upgradedBuilding);
            
            // Update housing capacity
            updateHousingCapacity();
            
            // Log upgrade
            Utils.log(`${buildingType.name} has been upgraded to ${upgradeDef.name}.`, "success");
            
            // Update UI
            this.updateUI();
            
            return true;
        },
        
        /**
         * Repair a building
         * @param {string} buildingId - Building ID to repair
         * @returns {boolean} - Whether repair was successful
         */
        repairBuilding: function(buildingId) {
            // Find building
            const building = activeBuildings.find(b => b.id === buildingId);
            if (!building || building.condition >= 100) return false;
            
            const buildingType = buildingTypes[building.type];
            if (!buildingType) return false;
            
            // Calculate repair cost (25% of build cost based on damage)
            const repairCost = {};
            const damagePercent = 100 - building.condition;
            
            for (const resource in buildingType.buildCosts) {
                repairCost[resource] = Math.ceil(buildingType.buildCosts[resource] * 0.25 * (damagePercent / 100));
                if (repairCost[resource] < 1) repairCost[resource] = 1;
            }
            
            // Pay for repair
            if (!ResourceManager.subtractResources(repairCost)) {
                return false;
            }
            
            // Repair the building
            building.condition = 100;
            
            // Log repair
            Utils.log(`${building.name} has been repaired.`, "success");
            
            // Update UI
            this.updateUI();
            
            return true;
        },
        
        /**
         * Update the UI with building information
         */
        updateUI: function() {
            // Would update the building UI component
            // Implementation depends on UI structure
            console.log("Building UI updated");
        }
    };
})();