/**
 * Viking Legacy - Resource Management Module
 * Handles all aspects of resource production, consumption, and management
 */

const ResourceManager = (function() {
    // Private variables
    let resources = {
        // Basic resources
        food: 150,
        wood: 130,
        stone: 100,
        metal: 50,
        
        // Advanced resources
        leather: 0,
        fur: 0,
        cloth: 0,
        clay: 0,
        pitch: 0,  // Tar/Pitch
        salt: 0,
        honey: 0,
        herbs: 0,  // Medicinal herbs
        
        // Wealth & Trade resources
        silver: 0,
        gold: 0,
        amber: 0,
        ivory: 0,
        jewels: 0,
        
        // Environmental resources
        peat: 0,
        whale_oil: 0,
        ice: 0,
        exotic: 0   // Exotic goods like spices, silk
    };
    
    // Storage capacity for resources
    let storageCapacity = {
        // Basic resources - larger starting capacity
        food: 300,
        wood: 200,
        stone: 150,
        metal: 100,
        
        // Advanced resources - medium capacity
        leather: 50,
        fur: 50,
        cloth: 50,
        clay: 50,
        pitch: 25,
        salt: 25,
        honey: 25,
        herbs: 25,
        
        // Wealth resources - small capacity (valuable items)
        silver: 25,
        gold: 10,
        amber: 10,
        ivory: 10,
        jewels: 10,
        
        // Environmental resources - medium capacity
        peat: 50,
        whale_oil: 25,
        ice: 25,
        exotic: 25
    };
    
    // Resource categories for UI organization
    const resourceCategories = {
        basic: ["food", "wood", "stone", "metal"],
        advanced: ["leather", "fur", "cloth", "clay", "pitch", "salt", "honey", "herbs"],
        wealth: ["silver", "gold", "amber", "ivory", "jewels"],
        environmental: ["peat", "whale_oil", "ice", "exotic"]
    };
    
    // Display names for resources
    const resourceDisplayNames = {
        food: "Food",
        wood: "Wood",
        stone: "Stone",
        metal: "Metal",
        leather: "Leather",
        fur: "Fur",
        cloth: "Cloth",
        clay: "Clay",
        pitch: "Tar/Pitch",
        salt: "Salt",
        honey: "Honey",
        herbs: "Herbs",
        silver: "Silver",
        gold: "Gold",
        amber: "Amber",
        ivory: "Ivory",
        jewels: "Jewels",
        peat: "Peat",
        whale_oil: "Whale Oil",
        ice: "Ice",
        exotic: "Exotic Goods"
    };
    
    // Production rates per worker per day
    const baseProductionRates = {
        // Basic resources
        food: 2,    // Food per farmer per day
        wood: 1.5,  // Wood per woodcutter per day
        stone: 1,   // Stone per miner per day
        metal: 0.5, // Metal per miner per day
        
        // Advanced resources - will be enabled by buildings/upgrades later
        leather: 0,
        fur: 0,
        cloth: 0,
        clay: 0,
        pitch: 0,
        salt: 0,
        honey: 0,
        herbs: 0,
        
        // Wealth resources - mostly gained through events/trade
        silver: 0,
        gold: 0,
        amber: 0,
        ivory: 0,
        jewels: 0,
        
        // Environmental resources - region-specific
        peat: 0,
        whale_oil: 0,
        ice: 0,
        exotic: 0
    };
    
    // Consumption rates per person per day
    const consumptionRates = {
        food: 1,  // Food consumed per person per day
        // Other resources aren't automatically consumed
    };
    
    // Building costs
    const buildingCosts = {
        house: { wood: 20, stone: 10 },
        farm: { wood: 15, stone: 5 },
        smithy: { wood: 25, stone: 15, metal: 5 }
    };
    
    // Current production modifiers (affected by buildings, events, etc.)
    let productionModifiers = {
        // Basic resources
        food: 1.0,
        wood: 1.0,
        stone: 1.0,
        metal: 1.0,
        
        // Advanced resources
        leather: 1.0,
        fur: 1.0,
        cloth: 1.0,
        clay: 1.0,
        pitch: 1.0,
        salt: 1.0,
        honey: 1.0,
        herbs: 1.0,
        
        // Wealth resources
        silver: 1.0,
        gold: 1.0,
        amber: 1.0,
        ivory: 1.0,
        jewels: 1.0,
        
        // Environmental resources
        peat: 1.0,
        whale_oil: 1.0,
        ice: 1.0,
        exotic: 1.0
    };
    
    // Resource production rates based on assigned workers
    let productionRates = {
        // Basic resources
        food: 0,
        wood: 0,
        stone: 0,
        metal: 0,
        
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
    
    // Private methods
    /**
     * Calculate production rates based on workers, modifiers, and region
     * @param {Object} workers - Object containing worker assignments
     */
    function calculateProductionRates(workers) {
        // Get region modifiers if available
        let regionModifiers = { food: 1.0, wood: 1.0, stone: 1.0, metal: 1.0 };
        
        // Check if WorldMap exists and has a player region
        if (typeof WorldMap !== 'undefined' && WorldMap.getPlayerRegion) {
            const playerRegion = WorldMap.getPlayerRegion();
            if (playerRegion && playerRegion.resourceModifiers) {
                regionModifiers = playerRegion.resourceModifiers;
            }
        }
        
        // Apply both regular modifiers and region modifiers
        productionRates.food = workers.farmers * baseProductionRates.food * productionModifiers.food * regionModifiers.food;
        productionRates.wood = workers.woodcutters * baseProductionRates.wood * productionModifiers.wood * regionModifiers.wood;
        productionRates.stone = workers.miners * baseProductionRates.stone * productionModifiers.stone * regionModifiers.stone;
        productionRates.metal = workers.miners * baseProductionRates.metal * productionModifiers.metal * regionModifiers.metal;
        
        // Special case: hunters can produce leather and fur
        if (workers.hunters) {
            productionRates.leather = workers.hunters * baseProductionRates.leather * productionModifiers.leather;
            productionRates.fur = workers.hunters * baseProductionRates.fur * productionModifiers.fur;
        }
        
        // Special case: crafters can produce cloth
        if (workers.crafters) {
            productionRates.cloth = workers.crafters * baseProductionRates.cloth * productionModifiers.cloth;
        }
        
        // Special case: gatherers can produce herbs and clay
        if (workers.gatherers) {
            productionRates.herbs = workers.gatherers * baseProductionRates.herbs * productionModifiers.herbs;
            productionRates.clay = workers.gatherers * baseProductionRates.clay * productionModifiers.clay;
        }
        
        // Environmental resources depend on region
        if (regionModifiers.peat) {
            productionRates.peat = workers.gatherers * baseProductionRates.peat * productionModifiers.peat * regionModifiers.peat;
        }
        
        if (regionModifiers.whale_oil) {
            productionRates.whale_oil = workers.hunters * baseProductionRates.whale_oil * productionModifiers.whale_oil * regionModifiers.whale_oil;
        }
        
        // Update UI
        updateResourceRatesUI();
    }
    
    /**
     * Update resource rates in the UI
     */
    function updateResourceRatesUI() {
        // Update basic resources first (these have dedicated UI elements)
        Utils.updateElement('food-rate', productionRates.food.toFixed(1));
        Utils.updateElement('wood-rate', productionRates.wood.toFixed(1));
        Utils.updateElement('stone-rate', productionRates.stone.toFixed(1));
        Utils.updateElement('metal-rate', productionRates.metal.toFixed(1));
        
        // Update any other resource rates that have UI elements
        for (const resource in productionRates) {
            if (resource !== 'food' && resource !== 'wood' && resource !== 'stone' && resource !== 'metal') {
                const rateElement = document.getElementById(`${resource}-rate`);
                if (rateElement) {
                    rateElement.textContent = productionRates[resource].toFixed(1);
                }
            }
        }
    }
    
    /**
     * Update resource values in the UI
     */
    // 2. Modify the updateResourceValues function:
function updateResourceValues() {
    if (!panelInstance) return;
    
    // Get current resources
    let resources = {};
    let storageCapacity = {};
    
    if (typeof ResourceManager !== 'undefined') {
        if (ResourceManager.getResources) {
            resources = ResourceManager.getResources();
        }
        
        // Get storage capacity if available
        if (ResourceManager.getStorageCapacity) {
            storageCapacity = ResourceManager.getStorageCapacity();
        }
    }
    
    // Update each resource value
    for (const resource in resources) {
        const element = document.getElementById(`persistent-${resource}-value`);
        if (element) {
            const value = Math.floor(resources[resource]);
            
            // If capacity exists for this resource, show value/capacity format
            if (storageCapacity[resource]) {
                element.textContent = `${value}/${storageCapacity[resource]}`;
            } else {
                // Otherwise just show the value
                element.textContent = value;
            }
        }
    }
}
    
    /**
     * Create or update the expanded resource UI
     */
    function createExpandedResourceUI() {
        // Check if resources panel exists
        const resourcesPanel = document.querySelector('.resources-panel');
        if (!resourcesPanel) return;
        
        // Clear current content and add categories structure
        resourcesPanel.innerHTML = `
            <h2>Resources</h2>
            <div class="resource-categories">
                <div class="resource-category">
                    <h3>Basic Resources</h3>
                    <div class="resource-grid basic-resources"></div>
                </div>
                <div class="resource-category advanced-category">
                    <h3>Advanced Resources</h3>
                    <div class="resource-grid advanced-resources"></div>
                </div>
                <div class="resource-category wealth-category">
                    <h3>Wealth Resources</h3>
                    <div class="resource-grid wealth-resources"></div>
                </div>
                <div class="resource-category environmental-category">
                    <h3>Environmental Resources</h3>
                    <div class="resource-grid environmental-resources"></div>
                </div>
            </div>
        `;
        
        // Add CSS for categories
        const style = document.createElement('style');
        style.textContent = `
            .resource-categories {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .resource-category {
                background-color: #f7f0e3;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .resource-category h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #5d4037;
                font-size: 1.1rem;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
            }
            
            .advanced-category, .wealth-category, .environmental-category {
                display: none; /* Hidden by default until resources are discovered */
            }
            
            /* Resource grid styling */
            .resource-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            @media (max-width: 768px) {
                .resource-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Colors for different resource types */
            .basic-resources .resource:nth-child(1) { border-left-color: #c62828; } /* Food - Red */
            .basic-resources .resource:nth-child(2) { border-left-color: #2e7d32; } /* Wood - Green */
            .basic-resources .resource:nth-child(3) { border-left-color: #5d4037; } /* Stone - Brown */
            .basic-resources .resource:nth-child(4) { border-left-color: #1565c0; } /* Metal - Blue */
            
            .advanced-resources .resource { border-left-color: #6a1b9a; } /* Advanced - Purple */
            .wealth-resources .resource { border-left-color: #ff8f00; } /* Wealth - Gold */
            .environmental-resources .resource { border-left-color: #00695c; } /* Environmental - Teal */
        `;
        document.head.appendChild(style);
        
        // Add basic resources
        const basicGrid = document.querySelector('.basic-resources');
        resourceCategories.basic.forEach(resource => {
            const resourceElement = document.createElement('div');
            resourceElement.className = 'resource';
            resourceElement.innerHTML = `
                <div class="resource-label">${resourceDisplayNames[resource]}:</div>
                <div id="${resource}-value">${Math.floor(resources[resource])}</div>
                <div class="resource-rate">(+<span id="${resource}-rate">${productionRates[resource].toFixed(1)}</span>/day)</div>
            `;
            basicGrid.appendChild(resourceElement);
        });
        
        // Add advanced resources (if any are discovered)
        const hasAdvancedResources = resourceCategories.advanced.some(resource => resources[resource] > 0);
        if (hasAdvancedResources) {
            document.querySelector('.advanced-category').style.display = 'block';
            const advancedGrid = document.querySelector('.advanced-resources');
            resourceCategories.advanced.forEach(resource => {
                if (resources[resource] > 0) {
                    const resourceElement = document.createElement('div');
                    resourceElement.className = 'resource';
                    resourceElement.innerHTML = `
                        <div class="resource-label">${resourceDisplayNames[resource]}:</div>
                        <div id="${resource}-value">${Math.floor(resources[resource])}</div>
                        <div class="resource-rate">(+<span id="${resource}-rate">${productionRates[resource].toFixed(1)}</span>/day)</div>
                    `;
                    advancedGrid.appendChild(resourceElement);
                }
            });
        }
        
        // Add wealth resources (if any are discovered)
        const hasWealthResources = resourceCategories.wealth.some(resource => resources[resource] > 0);
        if (hasWealthResources) {
            document.querySelector('.wealth-category').style.display = 'block';
            const wealthGrid = document.querySelector('.wealth-resources');
            resourceCategories.wealth.forEach(resource => {
                if (resources[resource] > 0) {
                    const resourceElement = document.createElement('div');
                    resourceElement.className = 'resource';
                    resourceElement.innerHTML = `
                        <div class="resource-label">${resourceDisplayNames[resource]}:</div>
                        <div id="${resource}-value">${Math.floor(resources[resource])}</div>
                        <div class="resource-rate">(+<span id="${resource}-rate">${productionRates[resource].toFixed(1)}</span>/day)</div>
                    `;
                    wealthGrid.appendChild(resourceElement);
                }
            });
        }
        
        // Add environmental resources (if any are discovered)
        const hasEnvironmentalResources = resourceCategories.environmental.some(resource => resources[resource] > 0);
        if (hasEnvironmentalResources) {
            document.querySelector('.environmental-category').style.display = 'block';
            const environmentalGrid = document.querySelector('.environmental-resources');
            resourceCategories.environmental.forEach(resource => {
                if (resources[resource] > 0) {
                    const resourceElement = document.createElement('div');
                    resourceElement.className = 'resource';
                    resourceElement.innerHTML = `
                        <div class="resource-label">${resourceDisplayNames[resource]}:</div>
                        <div id="${resource}-value">${Math.floor(resources[resource])}</div>
                        <div class="resource-rate">(+<span id="${resource}-rate">${productionRates[resource].toFixed(1)}</span>/day)</div>
                    `;
                    environmentalGrid.appendChild(resourceElement);
                }
            });
        }
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
            console.log("Resource Manager initialized with extended resources");
            // Create or update the expanded resource UI
            createExpandedResourceUI();
            // Fix: directly update values (don't call updateResourceValuesUI)
            this.refreshResourceUI();
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
         * @param {Object} workers - Current worker assignments
         */
        updateProductionRates: function(workers) {
            calculateProductionRates(workers);
        },
        
        /**
         * Process resource production and consumption for a game tick
         * @param {Object} population - Current population data
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(population, tickSize) {
            // Calculate daily production for basic resources
            const foodProduced = productionRates.food * tickSize;
            const woodProduced = productionRates.wood * tickSize;
            const stoneProduced = productionRates.stone * tickSize;
            const metalProduced = productionRates.metal * tickSize;
            
            // Calculate production for advanced resources
            const leatherProduced = productionRates.leather * tickSize;
            const furProduced = productionRates.fur * tickSize;
            const clothProduced = productionRates.cloth * tickSize;
            const clayProduced = productionRates.clay * tickSize;
            const pitchProduced = productionRates.pitch * tickSize;
            const saltProduced = productionRates.salt * tickSize;
            const honeyProduced = productionRates.honey * tickSize;
            const herbsProduced = productionRates.herbs * tickSize;
            
            // Calculate production for environmental resources
            const peatProduced = productionRates.peat * tickSize;
            const whaleOilProduced = productionRates.whale_oil * tickSize;
            const iceProduced = productionRates.ice * tickSize;
            
            // Wealth resources are mostly gained through events/trade, not passive production
            
            // Calculate consumption
            const foodConsumed = population.total * consumptionRates.food * tickSize;
            
            // Initialize resourcesGained object for tracking production
            const resourcesGained = {
                food: foodProduced,
                wood: woodProduced,
                stone: stoneProduced,
                metal: metalProduced,
                leather: leatherProduced,
                fur: furProduced,
                cloth: clothProduced,
                clay: clayProduced,
                pitch: pitchProduced,
                salt: saltProduced,
                honey: honeyProduced,
                herbs: herbsProduced,
                peat: peatProduced,
                whale_oil: whaleOilProduced,
                ice: iceProduced
            };
            
            // Process each resource respecting storage capacity
            let hitCapacity = false;
            for (const resource in resourcesGained) {
                const produced = resourcesGained[resource];
                if (produced > 0) {
                    // Check capacity limit
                    const capacity = storageCapacity[resource];
                    const currentAmount = resources[resource];
                    const newAmount = currentAmount + produced;
                    
                    if (capacity && newAmount > capacity) {
                        // Cap at maximum storage
                        resources[resource] = capacity;
                        hitCapacity = true;
                    } else {
                        // Normal addition
                        resources[resource] = newAmount;
                    }
                }
            }
            
            // Deduct consumed food
            resources.food -= foodConsumed;
            
            // Ensure resources don't go below 0
            for (const resource in resources) {
                resources[resource] = Math.max(0, resources[resource]);
            }
            
            // Update UI
            updateResourceValuesUI();
            
            // Notify player if storage is full
            if (hitCapacity) {
                Utils.log("Some of your storage is full! Consider building more storehouses.", "important");
            }
            
            // Check if UI needs to be refreshed for newly discovered resources
            const hasNewAdvancedResources = resourceCategories.advanced.some(
                resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
            );
            
            const hasNewWealthResources = resourceCategories.wealth.some(
                resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
            );
            
            const hasNewEnvironmentalResources = resourceCategories.environmental.some(
                resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
            );
            
            if (hasNewAdvancedResources || hasNewWealthResources || hasNewEnvironmentalResources) {
                createExpandedResourceUI();
            }
            
            // Return resource status for event processing
            return {
                foodProduced,
                foodConsumed,
                foodDeficit: foodConsumed > resources.food,
                resourcesGained
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
                
                let hitCapacity = false;
                
                for (const resource in amounts) {
                    if (resources.hasOwnProperty(resource)) {
                        // Validate resource amount is a number
                        if (typeof amounts[resource] !== 'number' || isNaN(amounts[resource])) {
                            console.warn(`Invalid amount for ${resource}:`, amounts[resource]);
                            continue;
                        }
                        
                        // Add resource with debug info
                        const prevAmount = resources[resource];
                        const capacity = storageCapacity[resource];
                        
                        // Check capacity limit
                        if (capacity && prevAmount + amounts[resource] > capacity) {
                            // Cap at maximum storage
                            resources[resource] = capacity;
                            hitCapacity = true;
                        } else {
                            // Normal addition
                            resources[resource] += amounts[resource];
                        }
                        
                        // Log for debugging
                        console.debug(`${resource}: ${prevAmount} → ${resources[resource]} (+${amounts[resource]})`);
                        
                        // Check if this is a newly discovered resource
                        if (prevAmount === 0 && resources[resource] > 0) {
                            // Log discovery
                            Utils.log(`You have discovered ${resourceDisplayNames[resource]}!`, "success");
                        }
                    } else {
                        console.warn(`Unknown resource type: ${resource}`);
                    }
                }
                
                // Notify player if storage is full
                if (hitCapacity) {
                    Utils.log("Some of your storage is full! Consider building more storehouses.", "important");
                }
                
                // Refresh UI if needed for newly discovered resources
                const hasNewAdvancedResources = resourceCategories.advanced.some(
                    resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
                );
                
                const hasNewWealthResources = resourceCategories.wealth.some(
                    resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
                );
                
                const hasNewEnvironmentalResources = resourceCategories.environmental.some(
                    resource => resources[resource] > 0 && !document.getElementById(`${resource}-value`)
                );
                
                if (hasNewAdvancedResources || hasNewWealthResources || hasNewEnvironmentalResources) {
                    createExpandedResourceUI();
                } else {
                    updateResourceValuesUI();
                }
                
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
         * @param {string} category - Resource category (basic, advanced, wealth, environmental)
         */
        addResourceType: function(resourceName, initialAmount, baseProductionRate, category = "advanced") {
            if (resources.hasOwnProperty(resourceName)) {
                console.warn(`Resource ${resourceName} already exists.`);
                return;
            }
            
            // Add resource
            resources[resourceName] = initialAmount;
            baseProductionRates[resourceName] = baseProductionRate;
            productionModifiers[resourceName] = 1.0;
            productionRates[resourceName] = 0;
            storageCapacity[resourceName] = 25; // Default storage capacity
            
            // Add to category
            if (resourceCategories[category]) {
                resourceCategories[category].push(resourceName);
            } else {
                console.warn(`Unknown category ${category}, adding to advanced.`);
                resourceCategories.advanced.push(resourceName);
            }
            
            // Add display name
            resourceDisplayNames[resourceName] = resourceName.charAt(0).toUpperCase() + resourceName.slice(1).replace('_', ' ');
            
            console.log(`Added new resource type: ${resourceName}`);
            
            // Update UI if needed
            if (initialAmount > 0) {
                createExpandedResourceUI();
            }
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
            const workerAssignments = PopulationManager.getWorkerAssignments();
            this.updateProductionRates(workerAssignments);
        },
        
        /**
         * Get storage capacity
         * @param {string} [resource] - Resource to get capacity for
         * @returns {Object|number} - Storage capacity object or capacity for specific resource
         */
        getStorageCapacity: function(resource) {
            if (resource) {
                return storageCapacity[resource] || Infinity;
            }
            return { ...storageCapacity };
        },
        
        /**
         * Get available storage space
         * @param {string} resource - Resource to check
         * @returns {number} - Available storage space
         */
        getAvailableStorage: function(resource) {
            if (!storageCapacity[resource]) return Infinity;
            return Math.max(0, storageCapacity[resource] - resources[resource]);
        },
        
        /**
         * Add storage capacity from buildings
         * @param {Object} capacities - Object with capacity increases by resource
         * @returns {boolean} - Whether capacity was added successfully
         */
        addStorageCapacity: function(capacities) {
            let capacityAdded = false;
            
            for (const resource in capacities) {
                if (storageCapacity.hasOwnProperty(resource)) {
                    storageCapacity[resource] += capacities[resource];
                    capacityAdded = true;
                    
                    // Log for debugging
                    console.log(`Storage capacity for ${resource} increased by ${capacities[resource]} to ${storageCapacity[resource]}`);
                }
            }
            
            // If any capacity was added, log to player
            if (capacityAdded) {
                Utils.log("Your settlement's storage capacity has increased!", "success");
            }
            
            return capacityAdded;
        },
        
        /**
         * Get resource categories
         * @returns {Object} - Resource categories
         */
        getResourceCategories: function() {
            return { ...resourceCategories };
        },
        
        /**
         * Get resource display names
         * @returns {Object} - Resource display names
         */
        getResourceDisplayNames: function() {
            return { ...resourceDisplayNames };
        },
        
        /**
         * Check if a resource has been discovered
         * @param {string} resource - Resource to check
         * @returns {boolean} - Whether the resource has been discovered
         */
        isResourceDiscovered: function(resource) {
            return resources.hasOwnProperty(resource) && resources[resource] > 0;
        },
        
        /**
         * Apply regional resource modifications based on player's current region
         * @param {Object} regionModifiers - Resource modifiers from the region
         */
        applyRegionalModifiers: function(regionModifiers) {
            for (const resource in regionModifiers) {
                if (productionModifiers.hasOwnProperty(resource)) {
                    // Update the production modifier
                    productionModifiers[resource] = regionModifiers[resource];
                }
            }
            
            // Recalculate production rates
            const workerAssignments = PopulationManager.getWorkerAssignments();
            this.updateProductionRates(workerAssignments);
        },
        
        /**
         * Refresh the resource UI display
         */
        refreshResourceUI: function() {
            createExpandedResourceUI();
        }
    };
})();