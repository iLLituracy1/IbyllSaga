/**
 * Viking Legacy - Resource Management Module
 * Handles all aspects of resource production, consumption, and management
 */

const ResourceManager = (function() {
    // Private variables
    let resources = {
        food: 150,
        wood: 130,
        stone: 100,
        metal: 50
    };
    
    // Production rates per worker per day
    const baseProductionRates = {
        food: 2,  // Food per farmer per day
        wood: 1.5,  // Wood per woodcutter per day
        stone: 1,  // Stone per miner per day
        metal: 0.5  // Metal per miner per day
    };
    
    // Consumption rates per person per day
    const consumptionRates = {
        food: 1  // Food consumed per person per day
    };
    
    // Building costs
    const buildingCosts = {
        house: { wood: 20, stone: 10 },
        farm: { wood: 15, stone: 5 },
        smithy: { wood: 25, stone: 15, metal: 5 }
    };
    
    // Current production modifiers (affected by buildings, events, etc.)
    let productionModifiers = {
        food: 1.0,
        wood: 1.0,
        stone: 1.0,
        metal: 1.0
    };
    
    // Resource production rates based on assigned workers
    let productionRates = {
        food: 0,
        wood: 0,
        stone: 0,
        metal: 0
    };
    
    // Private methods
    /**
     * Calculate production rates based on workers, modifiers, and region
     * @param {Object} workers - Object containing worker assignments
     */
    function calculateProductionRates(workers) {
        // Region and production modifiers
        let regionModifiers = { food: 1.0, wood: 1.0, stone: 1.0, metal: 1.0 };
        if (typeof WorldMap !== 'undefined' && WorldMap.getPlayerRegion) {
            const playerRegion = WorldMap.getPlayerRegion();
            if (playerRegion && playerRegion.resourceModifiers) {
                regionModifiers = playerRegion.resourceModifiers;
            }
        }
    
        // Worker-based production
        const workerFoodProduction = workers.farmers * baseProductionRates.food;
    
        // Building-based production
        let buildingFoodProduction = 0;
        if (typeof BuildingSystem !== 'undefined') {
            const buildingData = BuildingSystem.getBuildingData();
            
            for (const buildingType in buildingData.built) {
                const building = BuildingSystem.getBuildingType(buildingType);
                const buildingCount = buildingData.built[buildingType];
                
                if (building && building.effects && building.effects.resourceProduction && building.effects.resourceProduction.food) {
                    buildingFoodProduction += building.effects.resourceProduction.food * buildingCount;
                }
            }
        }
    
        // Total production with modifiers
        // KEY CHANGE: Don't add worker and building production before modifiers
        productionRates.food = (
            workerFoodProduction * productionModifiers.food * regionModifiers.food +
            buildingFoodProduction * productionModifiers.food * regionModifiers.food
        );
    
        // Rest of the method remains the same
        productionRates.wood = workers.woodcutters * baseProductionRates.wood * productionModifiers.wood * regionModifiers.wood;
        productionRates.stone = workers.miners * baseProductionRates.stone * productionModifiers.stone * regionModifiers.stone;
        productionRates.metal = workers.miners * baseProductionRates.metal * productionModifiers.metal * regionModifiers.metal;
    
        updateResourceRatesUI();
    }
    
    /**
     * Update resource rates in the UI
     */
    function updateResourceRatesUI() {
        Utils.updateElement('food-rate', productionRates.food.toFixed(1));
        Utils.updateElement('wood-rate', productionRates.wood.toFixed(1));
        Utils.updateElement('stone-rate', productionRates.stone.toFixed(1));
        Utils.updateElement('metal-rate', productionRates.metal.toFixed(1));
    }
    
    /**
     * Update resource values in the UI
     */
    function updateResourceValuesUI() {
        Utils.updateElement('food-value', Math.floor(resources.food));
        Utils.updateElement('wood-value', Math.floor(resources.wood));
        Utils.updateElement('stone-value', Math.floor(resources.stone));
        Utils.updateElement('metal-value', Math.floor(resources.metal));
    }
    
    /**
     * Check if player can afford a cost
     * @param {Object} cost - Object containing resource costs
     * @returns {boolean} - Whether player can afford the cost
     */
    function canAfford(cost) {
        for (const resource in cost) {
            if (resources[resource] < cost[resource]) {
                return false;
            }
        }
        return true;
    }
    
    // Public API
    return {
        /**
         * Initialize the resource manager
         */
        init: function() {
            console.log("Resource Manager initialized");
            updateResourceValuesUI();
        },
        
        /**
         * Get current resources
         * @returns {Object} - Current resource amounts
         */
        getResources: function() {
            return { ...resources };
        },
        
        /**
         * Get current production rates
         * @returns {Object} - Current production rates
         */
        getProductionRates: function() {
            return { ...productionRates };
        },
        
        /**
         * Update resource production rates based on worker assignments
         * Now pulls automatically from BuildingSystem if available
         */
        updateProductionRates: function(workers) {
            // Get workers from BuildingSystem if available, otherwise use provided workers
            let workerAssignments = workers;
            
            if (!workers && typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getWorkerAssignments === 'function') {
                workerAssignments = BuildingSystem.getWorkerAssignments();
            } else if (!workers && typeof PopulationManager !== 'undefined' && typeof PopulationManager.getWorkerAssignments === 'function') {
                workerAssignments = PopulationManager.getWorkerAssignments(); 
            }
            
            // Calculate production rates
            if (workerAssignments) {
                calculateProductionRates(workerAssignments);
            }
        },
        
        /**
         * Process resource production and consumption for a game tick
         * @param {Object} population - Current population data
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(population, tickSize) {
            // Update production rates based on current worker assignments from buildings
            if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getWorkerAssignments === 'function') {
                this.updateProductionRates(BuildingSystem.getWorkerAssignments());
            }
            
            // Calculate daily production
            const foodProduced = productionRates.food * tickSize;
            const woodProduced = productionRates.wood * tickSize;
            const stoneProduced = productionRates.stone * tickSize;
            const metalProduced = productionRates.metal * tickSize;
            
            // Calculate consumption
            const foodConsumed = population.total * consumptionRates.food * tickSize;
            
            // Update resources
            resources.food += foodProduced - foodConsumed;
            resources.wood += woodProduced;
            resources.stone += stoneProduced;
            resources.metal += metalProduced;
            
            // Ensure resources don't go below 0
            resources.food = Math.max(0, resources.food);
            resources.wood = Math.max(0, resources.wood);
            resources.stone = Math.max(0, resources.stone);
            resources.metal = Math.max(0, resources.metal);
            
            // Update UI
            updateResourceValuesUI();
            
            // Return resource status for event processing
            return {
                foodProduced,
                foodConsumed,
                foodDeficit: foodConsumed > resources.food,
                resourcesGained: {
                    food: foodProduced,
                    wood: woodProduced,
                    stone: stoneProduced,
                    metal: metalProduced
                }
            };
        },
        
            /**
         * Add resources manually (from events, actions, etc.)
         * @param {Object} amounts - Object containing resource amounts to add
         * @returns {boolean} - Whether the resources were successfully added
         */
        addResources: function(amounts) {
            try {
                if (!amounts || typeof amounts !== 'object') {
                    console.error("Invalid resource amounts:", amounts);
                    return false;
                }
                
                for (const resource in amounts) {
                    if (resources.hasOwnProperty(resource)) {
                        // Validate resource amount is a number
                        if (typeof amounts[resource] !== 'number' || isNaN(amounts[resource])) {
                            console.warn(`Invalid amount for ${resource}:`, amounts[resource]);
                            continue;
                        }
                        
                        // Add resource with debug info
                        const prevAmount = resources[resource];
                        resources[resource] += amounts[resource];
                        
                        // Log for debugging
                        console.debug(`${resource}: ${prevAmount} → ${resources[resource]} (+${amounts[resource]})`);
                    } else {
                        console.warn(`Unknown resource type: ${resource}`);
                    }
                }
                
                updateResourceValuesUI();
                return true;
            } catch (error) {
                console.error("Error adding resources:", error);
                return false;
            }
        },
        
            /**
         * Subtract resources manually (from events, actions, etc.)
         * @param {Object} amounts - Object containing resource amounts to subtract
         * @returns {boolean} - Whether the resources were successfully subtracted
         */
        subtractResources: function(amounts) {
            try {
                // Validate input
                if (!amounts || typeof amounts !== 'object') {
                    console.error("Invalid resource amounts:", amounts);
                    return false;
                }
                
                // Check if we have enough resources
                if (!canAfford(amounts)) {
                    console.log("Cannot afford:", amounts);
                    console.log("Current resources:", {...resources});
                    return false;
                }
                
                // Subtract resources
                for (const resource in amounts) {
                    if (resources.hasOwnProperty(resource)) {
                        // Validate resource amount is a number
                        if (typeof amounts[resource] !== 'number' || isNaN(amounts[resource])) {
                            console.warn(`Invalid amount for ${resource}:`, amounts[resource]);
                            continue;
                        }
                        
                        // Subtract resource with debug info
                        const prevAmount = resources[resource];
                        resources[resource] -= amounts[resource];
                        
                        // Ensure we don't go below zero (shouldn't happen due to canAfford check)
                        if (resources[resource] < 0) {
                            console.warn(`${resource} went below 0, setting to 0`);
                            resources[resource] = 0;
                        }
                        
                        // Log for debugging
                        console.debug(`${resource}: ${prevAmount} → ${resources[resource]} (-${amounts[resource]})`);
                    } else {
                        console.warn(`Unknown resource type: ${resource}`);
                    }
                }
                
                updateResourceValuesUI();
                return true;
            } catch (error) {
                console.error("Error subtracting resources:", error);
                return false;
            }
        },
        
        /**
         * Check if player can afford a building
         * @param {string} buildingType - Type of building to check
         * @returns {boolean} - Whether player can afford the building
         */
        canAffordBuilding: function(buildingType) {
            if (!buildingCosts.hasOwnProperty(buildingType)) {
                console.warn(`Unknown building type: ${buildingType}`);
                return false;
            }
            
            return canAfford(buildingCosts[buildingType]);
        },
        
        /**
         * Pay for a building
         * @param {string} buildingType - Type of building to pay for
         * @returns {boolean} - Whether payment was successful
         */
        payForBuilding: function(buildingType) {
            if (!buildingCosts.hasOwnProperty(buildingType)) {
                console.warn(`Unknown building type: ${buildingType}`);
                return false;
            }
            
            return this.subtractResources(buildingCosts[buildingType]);
        },
        
        /**
         * Apply a modifier to resource production
         * @param {string} resource - Resource to modify
         * @param {number} modifier - Modifier to apply (multiplicative)
         */
        applyProductionModifier: function(resource, modifier) {
            if (productionModifiers.hasOwnProperty(resource)) {
                productionModifiers[resource] *= modifier;
            }
        },
        
        /**
         * Reset production modifiers to default values
         */
        resetProductionModifiers: function() {
            for (const resource in productionModifiers) {
                productionModifiers[resource] = 1.0;
            }
        },
        
        /**
         * Get building costs
         * @param {string} buildingType - Type of building
         * @returns {Object|null} - Building costs or null if not found
         */
        getBuildingCost: function(buildingType) {
            return buildingCosts[buildingType] ? { ...buildingCosts[buildingType] } : null;
        },
        
        /**
         * Add a custom resource type (for mod support)
         * @param {string} resourceName - Name of the new resource
         * @param {number} initialAmount - Initial amount of the resource
         * @param {number} baseProductionRate - Base production rate for the resource
         */
        addResourceType: function(resourceName, initialAmount, baseProductionRate) {
            if (resources.hasOwnProperty(resourceName)) {
                console.warn(`Resource ${resourceName} already exists.`);
                return;
            }
            
            // Add resource
            resources[resourceName] = initialAmount;
            baseProductionRates[resourceName] = baseProductionRate;
            productionModifiers[resourceName] = 1.0;
            productionRates[resourceName] = 0;
            
            // This would need UI updates for new resources as well
            console.log(`Added new resource type: ${resourceName}`);
        },

                    /**
             * Get base production rates
             * @returns {Object} - Base production rates
             */
            getBaseProductionRates: function() {
                return { ...baseProductionRates };
            },

            /**
             * Set base production rates from buildings
             * @param {Object} rates - New base rates
             */
            updateBaseProductionRates: function(rates) {
                for (const resource in rates) {
                    if (baseProductionRates.hasOwnProperty(resource)) {
                        baseProductionRates[resource] = rates[resource];
                    }
                }
                
                // Recalculate production rates
                const workerAssignments = typeof BuildingSystem !== 'undefined' && 
                                        typeof BuildingSystem.getWorkerAssignments === 'function' ?
                                        BuildingSystem.getWorkerAssignments() :
                                        PopulationManager.getWorkerAssignments();
                                        
                this.updateProductionRates(workerAssignments);
            },

            /**
             * Add storage capacity (for storehouse buildings)
             * @param {Object} capacities - Storage capacities to add
             */
            addStorageCapacity: function(capacities) {
                // TODO: Implement resource storage limits
                console.log("Storage capacity increased:", capacities);
            }
    };
})();