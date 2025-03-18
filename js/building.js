/**
 * Viking Legacy - Building System
 * Handles building construction, management, and integration with land/resources
 */

const BuildingSystem = (function() {
    // Building definitions
    const buildingTypes = {
        HOUSE: {
            id: "house",
            name: "House",
            description: "A simple dwelling for your people.",
            category: "housing",
            landRequirement: {
                type: "settlement",
                amount: 1
            },
            constructionCost: {
                wood: 20,
                stone: 10
            },
            constructionTime: 5, // Days to build
            workerCapacity: 0, // Housing building, doesn't provide jobs
            workersRequired: 1, // Workers needed to build
            maintenanceCost: {
                wood: 1 // Maintenance cost per month
            },
            maxCount: null, // No limit on houses
            upgradesTo: "longhouse",
            effects: {
                housingCapacity: 5
            }
        },
        
        LONGHOUSE: {
            id: "longhouse",
            name: "Longhouse",
            description: "A larger dwelling that houses more people and serves as a community center.",
            category: "housing",
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 50,
                stone: 25
            },
            constructionTime: 10,
            workerCapacity: 0, // Housing building, doesn't provide jobs
            workersRequired: 3,
            maintenanceCost: {
                wood: 2
            },
            maxCount: null,
            upgradesTo: null,
            unlockRequirements: {
                rank: 3 // Requires player to be at least rank 3
            },
            effects: {
                housingCapacity: 10,
                fame: 2 // Fame bonus per month
            }
        },
        
        FARM: {
            id: "farm",
            name: "Farm",
            description: "Produces food from farmland.",
            category: "production",
            landRequirement: {
                type: "farmland",
                amount: 3
            },
            constructionCost: {
                wood: 15,
                stone: 5
            },
            constructionTime: 7,
            workerCapacity: 3, // Employs 3 farmers
            workersRequired: 2,
            maintenanceCost: {
                wood: 1
            },
            maxCount: function(gameState) {
                // Limit farms based on available farmland and population
                const farmlandAcres = LandManager.getLandData().landTypes.farmland;
                const maxFarmsByLand = Math.floor(farmlandAcres / 3);
                
                const population = PopulationManager.getPopulation().total;
                const maxFarmsByPop = Math.ceil(population / 5);
                
                return Math.min(maxFarmsByLand, maxFarmsByPop);
            },
            upgradesTo: "large_farm",
            effects: {
                resourceProduction: {
                    food: 25 // Base food production per day
                }
            }
        },
        
        LARGE_FARM: {
            id: "large_farm",
            name: "Large Farm",
            description: "An expanded farm with higher yields.",
            category: "production",
            landRequirement: {
                type: "farmland",
                amount: 5
            },
            constructionCost: {
                wood: 130,
                stone: 115
            },
            constructionTime: 12,
            workerCapacity: 15, // Employs 5 farmers
            workersRequired: 3,
            maintenanceCost: {
                wood: 2
            },
            maxCount: function(gameState) {
                const farmlandAcres = LandManager.getLandData().landTypes.farmland;
                return Math.floor(farmlandAcres / 5);
            },
            upgradesTo: null,
            unlockRequirements: {
                rank: 6
            },
            effects: {
                resourceProduction: {
                    food: 100
                }
            }
        },
        
        WOODCUTTER_LODGE: {
            id: "woodcutter_lodge",
            name: "Woodcutter's Lodge",
            description: "Increases wood production from woodland areas.",
            category: "production",
            landRequirement: {
                type: "woodland",
                amount: 3
            },
            constructionCost: {
                wood: 20,
                stone: 5
            },
            constructionTime: 5,
            workerCapacity: 3, // Employs 3 woodcutters
            workersRequired: 2,
            maintenanceCost: {
                metal: 1
            },
            maxCount: function(gameState) {
                const woodlandAcres = LandManager.getLandData().landTypes.woodland;
                return Math.floor(woodlandAcres / 3);
            },
            upgradesTo: "sawmill",
            effects: {
                resourceProduction: {
                    wood: 4
                }
            }
        },
        
        SAWMILL: {
            id: "sawmill",
            name: "Sawmill",
            description: "An advanced wood processing facility.",
            category: "production",
            landRequirement: {
                type: "woodland",
                amount: 4
            },
            constructionCost: {
                wood: 40,
                stone: 20,
                metal: 10
            },
            constructionTime: 10,
            workerCapacity: 4, // Employs 4 woodcutters
            workersRequired: 3,
            maintenanceCost: {
                metal: 2
            },
            maxCount: function(gameState) {
                const woodlandAcres = LandManager.getLandData().landTypes.woodland;
                return Math.floor(woodlandAcres / 4);
            },
            upgradesTo: null,
            unlockRequirements: {
                rank: 5,
                buildings: {
                    woodcutter_lodge: 1
                }
            },
            effects: {
                resourceProduction: {
                    wood: 10
                }
            }
        },
        
        QUARRY: {
            id: "quarry",
            name: "Quarry",
            description: "Extracts stone from rocky areas.",
            category: "production",
            landRequirement: {
                type: "mining",
                amount: 2
            },
            constructionCost: {
                wood: 25,
                metal: 5
            },
            constructionTime: 8,
            workerCapacity: 3, // Employs 3 miners
            workersRequired: 2,
            maintenanceCost: {
                metal: 1
            },
            maxCount: function(gameState) {
                const miningAcres = LandManager.getLandData().landTypes.mining;
                return Math.floor(miningAcres / 2);
            },
            upgradesTo: null,
            effects: {
                resourceProduction: {
                    stone: 3
                }
            }
        },
        
        MINE: {
            id: "mine",
            name: "Mine",
            description: "Extracts metal ore from deep in the earth.",
            category: "production",
            landRequirement: {
                type: "mining",
                amount: 3
            },
            constructionCost: {
                wood: 30,
                stone: 20
            },
            constructionTime: 10,
            workerCapacity: 3, // Employs 3 miners
            workersRequired: 3,
            maintenanceCost: {
                wood: 2
            },
            maxCount: function(gameState) {
                const miningAcres = LandManager.getLandData().landTypes.mining;
                return Math.floor(miningAcres / 3);
            },
            upgradesTo: null,
            effects: {
                resourceProduction: {
                    metal: 2
                }
            }
        },
        
        SMITHY: {
            id: "smithy",
            name: "Smithy",
            description: "Processes metal into tools and weapons.",
            category: "production",
            landRequirement: {
                type: "settlement",
                amount: 1
            },
            constructionCost: {
                wood: 25,
                stone: 15,
                metal: 5
            },
            constructionTime: 8,
            workerCapacity: 2, // Employs 2 workers (currently counted as miners)
            workersRequired: 2,
            maintenanceCost: {
                wood: 1,
                metal: 1
            },
            maxCount: function(gameState) {
                // Can have 1 smithy per 15 population
                const population = PopulationManager.getPopulation().total;
                return Math.ceil(population / 15);
            },
            upgradesTo: "forge",
            effects: {
                resourceProduction: {
                    metal: 1
                },
                resourceModifier: {
                    metal: 1.5 // Increases metal production
                }
            }
        },
        
        FORGE: {
            id: "forge",
            name: "Forge",
            description: "An advanced smithy with better metal processing.",
            category: "production",
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 40,
                stone: 30,
                metal: 15
            },
            constructionTime: 15,
            workerCapacity: 3, // Employs 3 workers (currently counted as miners)
            workersRequired: 3,
            maintenanceCost: {
                wood: 2,
                metal: 2
            },
            maxCount: 1, // Only 1 forge allowed
            upgradesTo: null,
            unlockRequirements: {
                rank: 6,
                buildings: {
                    smithy: 1
                }
            },
            effects: {
                resourceProduction: {
                    metal: 2
                },
                resourceModifier: {
                    metal: 2.0
                }
            }
        },
        
        STOREHOUSE: {
            id: "storehouse",
            name: "Storehouse",
            description: "Increases your resource storage capacity.",
            category: "infrastructure",
            landRequirement: {
                type: "settlement",
                amount: 1
            },
            constructionCost: {
                wood: 30,
                stone: 10
            },
            constructionTime: 6,
            workerCapacity: 1, // Employs 1 worker
            workersRequired: 2,
            maintenanceCost: {},
            maxCount: function(gameState) {
                // Can have 1 storehouse per 20 population
                const population = PopulationManager.getPopulation().total;
                return Math.ceil(population / 20);
            },
            upgradesTo: null,
            effects: {
                storageCapacity: {
                    food: 200,
                    wood: 150,
                    stone: 100,
                    metal: 50
                }
            }
        },
        
        FISHING_HUT: {
            id: "fishing_hut",
            name: "Fishing Hut",
            description: "Gathers food from coastal waters.",
            category: "production",
            landRequirement: {
                type: "coastal",
                amount: 2
            },
            constructionCost: {
                wood: 15,
                stone: 5
            },
            constructionTime: 5,
            workerCapacity: 2, // Employs 2 farmers
            workersRequired: 1,
            maintenanceCost: {
                wood: 1
            },
            maxCount: 3, // Limit to 3 fishing huts
            upgradesTo: null,
            effects: {
                resourceProduction: {
                    food: 4
                }
            },
            specialRequirements: function(gameState) {
                // Check if player's region is coastal
                const playerRegion = WorldMap.getPlayerRegion();
                return playerRegion && playerRegion.type === "COASTAL";
            }
        },
        
        HUNTING_LODGE: {
            id: "hunting_lodge",
            name: "Hunting Lodge",
            description: "Gathers food from wilderness and forests.",
            category: "production",
            landRequirement: {
                type: "wilderness",
                amount: 3
            },
            constructionCost: {
                wood: 20,
                stone: 5
            },
            constructionTime: 6,
            workerCapacity: 2, // Employs 2 farmers
            workersRequired: 1,
            maintenanceCost: {
                wood: 1
            },
            maxCount: 2,
            upgradesTo: null,
            effects: {
                resourceProduction: {
                    food: 3
                }
            }
        },
        
        MARKETPLACE: {
            id: "marketplace",
            name: "Marketplace",
            description: "Enables trading and increases settlement prosperity.",
            category: "infrastructure",
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 400,
                stone: 200,
                metal: 100
            },
            constructionTime: 12,
            workerCapacity: 3, // Employs 3 workers
            workersRequired: 4,
            maintenanceCost: {},
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 5
            },
            effects: {
                fame: 3,
                tradingEnabled: true
            }
        },
        
        MEAD_HALL: {
            id: "mead_hall",
            name: "Mead Hall",
            description: "A grand hall for feasting and celebrating, increasing fame and happiness.",
            category: "infrastructure",
            landRequirement: {
                type: "settlement",
                amount: 3
            },
            constructionCost: {
                wood: 6000,
                stone: 3000,
                metal: 1500
            },
            constructionTime: 20,
            workerCapacity: 2, // Employs 2 workers
            workersRequired: 5,
            maintenanceCost: {
                food: 500
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 7
            },
            effects: {
                fame: 5,
                happiness: 10
            }
        }
    };
    
    // Track built and in-progress buildings
    let buildings = {
        built: {}, // id -> count of completed buildings by type
        construction: [] // Array of buildings currently under construction
    };
    
    // Building template for construction projects
    const constructionTemplate = {
        id: "", // Unique ID for this construction project
        type: "", // Type of building
        progress: 0, // Construction progress (0-100%)
        daysWorked: 0, // Days of work completed
        workersAssigned: 0, // Workers currently assigned
        location: {
            x: 0,
            y: 0
        },
        startDate: null, // Game date when construction started
        estimatedCompletion: null // Estimated completion date
    };
    
    // Tracks workers assigned to each building
    let buildingWorkers = {};
    
    // Private methods
    
    /**
     * Check if a building type can be constructed
     * @param {string} buildingType - Type of building to check
     * @param {Object} gameState - Current game state
     * @returns {Object} - Result with success flag and reason
     */
    function canBuildType(buildingType, gameState) {
        const building = buildingTypes[buildingType.toUpperCase()];
        if (!building) {
            return { success: false, reason: "Invalid building type" };
        }
        
        // Check rank requirement
        if (building.unlockRequirements && building.unlockRequirements.rank) {
            const currentRank = RankManager.getCurrentRank().index;
            if (currentRank < building.unlockRequirements.rank) {
                return { 
                    success: false, 
                    reason: `Requires rank ${building.unlockRequirements.rank} (${RankManager.getAllRanks()[building.unlockRequirements.rank].title})` 
                };
            }
        }
        
        // Check prerequisite buildings
        if (building.unlockRequirements && building.unlockRequirements.buildings) {
            for (const reqBuilding in building.unlockRequirements.buildings) {
                const required = building.unlockRequirements.buildings[reqBuilding];
                const actual = buildings.built[reqBuilding] || 0;
                if (actual < required) {
                    return { 
                        success: false, 
                        reason: `Requires ${required} ${buildingTypes[reqBuilding.toUpperCase()].name}` 
                    };
                }
            }
        }
        
        // Check special requirements if any
        if (building.specialRequirements && typeof building.specialRequirements === 'function') {
            if (!building.specialRequirements(gameState)) {
                return { success: false, reason: "Special requirements not met" };
            }
        }
        
        // Check max building count
        const currentCount = buildings.built[building.id] || 0;
        
        if (typeof building.maxCount === 'function') {
            const maxAllowed = building.maxCount(gameState);
            if (currentCount >= maxAllowed) {
                return { 
                    success: false, 
                    reason: `Maximum number (${maxAllowed}) already built` 
                };
            }
        } else if (building.maxCount !== null && currentCount >= building.maxCount) {
            return { 
                success: false, 
                reason: `Maximum number (${building.maxCount}) already built` 
            };
        }
        
        // Check land requirements
        if (building.landRequirement) {
            const landData = LandManager.getLandData();
            const availableLand = landData.landTypes[building.landRequirement.type];
            
            // Calculate land currently used by buildings of this type
            const landUsed = (buildings.built[building.id] || 0) * building.landRequirement.amount;
            
            // Also check land used by buildings in construction
            const landInConstruction = buildings.construction
                .filter(project => project.type === building.id)
                .length * building.landRequirement.amount;
                
            if (availableLand < landUsed + landInConstruction + building.landRequirement.amount) {
                return { 
                    success: false, 
                    reason: `Not enough ${building.landRequirement.type} (need ${building.landRequirement.amount} more acres)` 
                };
            }
        }
        
        // Check resource cost
        if (building.constructionCost) {
            const resources = ResourceManager.getResources();
            for (const resource in building.constructionCost) {
                if (resources[resource] < building.constructionCost[resource]) {
                    return { 
                        success: false, 
                        reason: `Not enough ${resource} (need ${building.constructionCost[resource]})` 
                    };
                }
            }
        }
        
        // Check available workers
        const population = PopulationManager.getPopulation();
        
        // Calculate workers already assigned to construction
        const workersInConstruction = buildings.construction.reduce(
            (total, project) => total + project.workersAssigned, 0
        );
        
        const availableWorkers = population.workers - workersInConstruction;
        
        if (availableWorkers < building.workersRequired) {
            return { 
                success: false, 
                reason: `Not enough workers (need ${building.workersRequired} available)` 
            };
        }
        
        return { success: true };
    }
    
    /**
     * Start construction of a building
     * @param {string} buildingType - Type of building to construct
     * @param {Object} gameState - Current game state
     * @returns {Object} - Result with construction project or error
     */
    function startConstruction(buildingType, gameState) {
        const building = buildingTypes[buildingType.toUpperCase()];
        
        // Check if we can build this
        const canBuild = canBuildType(buildingType, gameState);
        if (!canBuild.success) {
            return { success: false, reason: canBuild.reason };
        }
        
        // Pay construction cost
        const paymentResult = ResourceManager.subtractResources(building.constructionCost);
        if (!paymentResult) {
            return { success: false, reason: "Failed to deduct resources" };
        }
        
        // Create construction project
        const project = Object.assign({}, constructionTemplate, {
            id: `construction_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: building.id,
            workersAssigned: building.workersRequired,
            startDate: { ...gameState.date },
            estimatedCompletion: {
                ...gameState.date,
                day: gameState.date.day + building.constructionTime
            }
        });
        
        // Add to construction list
        buildings.construction.push(project);
        
        // Log start of construction
        Utils.log(`Construction of ${building.name} has begun. Estimated completion in ${building.constructionTime} days.`, "success");
        
        return { success: true, project };
    }
    
    /**
     * Process construction projects for a game tick
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of game tick in days
     */
    function processConstruction(gameState, tickSize) {
        // Process each construction project
        for (let i = buildings.construction.length - 1; i >= 0; i--) {
            const project = buildings.construction[i];
            const building = buildingTypes[project.type.toUpperCase()];
            
            if (!building) {
                console.error(`Invalid building type in construction: ${project.type}`);
                buildings.construction.splice(i, 1);
                continue;
            }
            
            // Apply progress based on workers assigned
            const baseProgress = (project.workersAssigned / building.workersRequired) * tickSize;
            const progressThisTick = baseProgress / building.constructionTime * 100;
            
            project.progress += progressThisTick;
            project.daysWorked += tickSize;
            
            // Check if construction is complete
            if (project.progress >= 100 || project.daysWorked >= building.constructionTime) {
                // Complete the building
                if (!buildings.built[building.id]) {
                    buildings.built[building.id] = 0;
                }
                buildings.built[building.id]++;
                
                // Apply building effects
                applyBuildingEffects(building);
                
                // Log completion
                Utils.log(`Construction of ${building.name} is complete!`, "success");
                
                // Award fame for completing building
                RankManager.processBuildingConstruction(building.id);
                
                // Remove from construction
                buildings.construction.splice(i, 1);
            }
        }
    }
    
    /**
     * Apply the effects of a completed building
     * @param {Object} building - Building definition
     */
    function applyBuildingEffects(building) {
        if (!building.effects) return;
        
        // Apply housing effects
        if (building.effects.housingCapacity) {
            // The existing addBuilding method in PopulationManager only handles houses
            // For now, simulate adding X houses to get the right capacity
            const housesEquivalent = building.effects.housingCapacity / 5;
            for (let i = 0; i < housesEquivalent; i++) {
                PopulationManager.addBuilding('house');
            }
        }
        
        // Apply resource production modifiers
        if (building.effects.resourceModifier) {
            for (const resource in building.effects.resourceModifier) {
                ResourceManager.applyProductionModifier(
                    resource, 
                    building.effects.resourceModifier[resource]
                );
            }
        }
        
        // Apply resource storage increases
        if (building.effects.storageCapacity) {
            ResourceManager.addStorageCapacity(building.effects.storageCapacity);
            console.log(`Applied storage capacity from ${building.name}:`, building.effects.storageCapacity);
        }
        
        // Apply fame effects
        if (building.effects.fame) {
            RankManager.addFame(
                building.effects.fame, 
                `${building.name} completed`
            );
        }
    }
    
    /**
     * Process monthly building maintenance
     * @param {Object} gameState - Current game state
     */
    function processMonthlyMaintenance(gameState) {
        // Only run at the start of a new month
        if (gameState.date.dayOfMonth !== 1) return;
        
        let totalMaintenanceCost = {};
        
        // Calculate maintenance for all built buildings
        for (const buildingId in buildings.built) {
            const count = buildings.built[buildingId];
            const building = Object.values(buildingTypes).find(b => b.id === buildingId);
            
            if (!building || !building.maintenanceCost) continue;
            
            // Multiply maintenance cost by building count
            for (const resource in building.maintenanceCost) {
                if (!totalMaintenanceCost[resource]) {
                    totalMaintenanceCost[resource] = 0;
                }
                totalMaintenanceCost[resource] += building.maintenanceCost[resource] * count;
            }
        }
        
        // Deduct maintenance costs
        if (Object.keys(totalMaintenanceCost).length > 0) {
            const maintenanceResult = ResourceManager.subtractResources(totalMaintenanceCost);
            
            if (!maintenanceResult) {
                // Not enough resources for maintenance
                Utils.log("Warning: Not enough resources for building maintenance. Buildings may deteriorate.", "danger");
                
                // TODO: Add building deterioration mechanics
            } else {
                let maintenanceLog = "Monthly building maintenance: ";
                for (const resource in totalMaintenanceCost) {
                    maintenanceLog += `${totalMaintenanceCost[resource]} ${resource}, `;
                }
                maintenanceLog = maintenanceLog.slice(0, -2); // Remove trailing comma and space
                
                Utils.log(maintenanceLog, "important");
            }
        }
    }
    
    /**
     * Update resource production based on production buildings
     * @param {Object} gameState - Current game state
     */
    function updateResourceProduction(gameState) {
        // Reset base production
        const baseProduction = {
            food: 0,
            wood: 0,
            stone: 0,
            metal: 0
        };
        
        // Calculate production from buildings
        for (const buildingId in buildings.built) {
            const count = buildings.built[buildingId];
            const building = Object.values(buildingTypes).find(b => b.id === buildingId);
            
            if (!building || !building.effects || !building.effects.resourceProduction) continue;
            
            for (const resource in building.effects.resourceProduction) {
                baseProduction[resource] += building.effects.resourceProduction[resource] * count;
            }
        }
        
        // Update production rates in ResourceManager
        if (ResourceManager && typeof ResourceManager.updateBaseProductionRates === 'function') {
            // Apply base production from buildings to ResourceManager
            ResourceManager.updateBaseProductionRates(baseProduction);
            
            // Force an update of production rates with current workers
            const workerAssignments = PopulationManager.getWorkerAssignments();
            ResourceManager.updateProductionRates(workerAssignments);
        }
    }
    
    /**
     * Create the building UI
     */
    function createBuildingUI() {
        // Check if building panel already exists
        if (document.getElementById('building-panel')) {
            return;
        }
        
        // Create building management panel
        const buildingPanel = document.createElement('div');
        buildingPanel.className = 'building-panel';
        buildingPanel.id = 'building-panel';
        
        buildingPanel.innerHTML = `
            <h2>Buildings & Construction</h2>
            
            <div class="buildings-overview">
                <div class="buildings-count">
                    <h3>Built Structures</h3>
                    <div id="built-buildings-list">
                        <p>No buildings constructed yet.</p>
                    </div>
                </div>
                
                <div class="construction-projects">
                    <h3>Construction Projects</h3>
                    <div id="construction-list">
                        <p>No active construction projects.</p>
                    </div>
                </div>
            </div>
            
            <div class="new-construction">
                <h3>Start Construction</h3>
                <div class="building-categories">
                    <button class="category-button active" data-category="all">All</button>
                    <button class="category-button" data-category="housing">Housing</button>
                    <button class="category-button" data-category="production">Production</button>
                    <button class="category-button" data-category="infrastructure">Infrastructure</button>
                </div>
                
                <div id="available-buildings-list">
                    <!-- Available buildings will be listed here -->
                </div>
            </div>
        `;

        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(buildingPanel);
            
            // Setup category filter buttons
            const categoryButtons = buildingPanel.querySelectorAll('.category-button');
            categoryButtons.forEach(button => {
                button.addEventListener('click', function() {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    updateAvailableBuildingsList(this.dataset.category);
                });
            });
            
            // Initial update of UI
            updateBuildingUI();

            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('building-panel', 'buildings');
            }
        }
    }
    
    /**
     * Update the building UI to reflect current state
     */
    function updateBuildingUI() {
        updateBuiltBuildingsList();
        updateConstructionList();
        updateAvailableBuildingsList('all');
    }
    
    /**
     * Update the list of built buildings
     */
    function updateBuiltBuildingsList() {
        const listElement = document.getElementById('built-buildings-list');
        if (!listElement) return;
        
        if (Object.keys(buildings.built).length === 0) {
            listElement.innerHTML = '<p>No buildings constructed yet.</p>';
            return;
        }
        
        let html = '';
        
        for (const buildingId in buildings.built) {
            const count = buildings.built[buildingId];
            const building = Object.values(buildingTypes).find(b => b.id === buildingId);
            
            if (!building) continue;
            
            html += `
                <div class="building-item">
                    <div class="building-info">
                        <span class="building-name">${building.name}</span>
                        <span class="building-count">x${count}</span>
                    </div>
                    <div class="building-effects">
                        ${formatBuildingEffects(building)}
                    </div>
                    ${building.workerCapacity > 0 ? 
                    `<div class="building-workers">
                        <span class="worker-capacity-label">Workers:</span>
                        <span class="worker-capacity-value">${building.workerCapacity} per building</span>
                    </div>` : ''}
                </div>
            `;
        }
        
        listElement.innerHTML = html;
    }
    
    /**
     * Update the list of construction projects
     */
    function updateConstructionList() {
        const listElement = document.getElementById('construction-list');
        if (!listElement) return;
        
        if (buildings.construction.length === 0) {
            listElement.innerHTML = '<p>No active construction projects.</p>';
            return;
        }
        
        let html = '';
        
        buildings.construction.forEach(project => {
            const building = Object.values(buildingTypes).find(b => b.id === project.type);
            
            if (!building) return;
            
            html += `
                <div class="construction-item">
                    <div class="construction-header">
                        <span class="construction-name">${building.name}</span>
                        <span class="construction-workers">Workers: ${project.workersAssigned}/${building.workersRequired}</span>
                    </div>
                    <div class="construction-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${project.progress.toFixed(1)}%"></div>
                            <div class="progress-text">${project.progress.toFixed(1)}%</div>
                        </div>
                        <div class="estimated-completion">
                            Est. completion: Day ${project.estimatedCompletion.day}
                        </div>
                    </div>
                    <div class="construction-controls">
                        <button class="construction-btn" data-action="add-worker" data-id="${project.id}">+ Worker</button>
                        <button class="construction-btn" data-action="remove-worker" data-id="${project.id}">- Worker</button>
                    </div>
                </div>
            `;
        });
        
        listElement.innerHTML = html;
        
        // Add event listeners to buttons
        const buttons = listElement.querySelectorAll('.construction-btn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const projectId = this.dataset.id;
                
                if (action === 'add-worker') {
                    addWorkerToConstruction(projectId);
                } else if (action === 'remove-worker') {
                    removeWorkerFromConstruction(projectId);
                }
            });
        });
    }
    
    /**
     * Update the list of available buildings
     * @param {string} category - Category to filter by
     */
    function updateAvailableBuildingsList(category) {
        const listElement = document.getElementById('available-buildings-list');
        if (!listElement) return;
        
        let html = '';
        
        // Get current game state
        const gameState = GameEngine.getGameState();
        
        // Filter and sort available buildings
        const availableBuildings = Object.values(buildingTypes)
            .filter(building => {
                // Filter by category
                if (category !== 'all' && building.category !== category) {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => {
                // Sort by whether they can be built
                const canBuildA = canBuildType(a.id, gameState).success;
                const canBuildB = canBuildType(b.id, gameState).success;
                
                if (canBuildA && !canBuildB) return -1;
                if (!canBuildA && canBuildB) return 1;
                
                // Then by category
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                
                // Then by name
                return a.name.localeCompare(b.name);
            });
        
        availableBuildings.forEach(building => {
            const buildCheck = canBuildType(building.id, gameState);
            const canBuild = buildCheck.success;
            
            html += `
                <div class="available-building ${canBuild ? '' : 'unavailable'}">
                    <div class="building-header">
                        <span class="building-name">${building.name}</span>
                        <span class="building-count">Built: ${buildings.built[building.id] || 0}</span>
                    </div>
                    <div class="building-description">${building.description}</div>
                    <div class="building-requirements">
                        <div class="building-cost">
                            ${formatResourceList(building.constructionCost, 'Cost')}
                        </div>
                        <div class="building-land">
                            Requires: ${building.landRequirement.amount} acres of ${building.landRequirement.type}
                        </div>
                        <div class="building-time">
                            Construction time: ${building.constructionTime} days
                        </div>
                        <div class="building-workers">
                            Workers required: ${building.workersRequired}
                        </div>
                    </div>
                    ${building.workerCapacity > 0 ? 
                    `<div class="building-workers-info">
                        <div class="worker-capacity">
                            <span class="capacity-label">Employs:</span>
                            <span class="capacity-value">${building.workerCapacity} workers</span>
                        </div>
                    </div>` : ''}
                    <div class="building-effects">
                        ${formatBuildingEffects(building)}
                    </div>
                    <div class="building-controls">
                        <button class="build-btn" data-building="${building.id}" ${canBuild ? '' : 'disabled'}>
                            ${canBuild ? 'Construct' : buildCheck.reason}
                        </button>
                    </div>
                </div>
            `;
        });
        
        listElement.innerHTML = html;
        
        // Add event listeners to build buttons
        const buildButtons = listElement.querySelectorAll('.build-btn:not([disabled])');
        buildButtons.forEach(button => {
            button.addEventListener('click', function() {
                const buildingId = this.dataset.building;
                startConstruction(buildingId, GameEngine.getGameState());
                updateBuildingUI();
            });
        });
    }
    
    /**
     * Format building effects for display
     * @param {Object} building - Building definition
     * @returns {string} - Formatted HTML
     */
    function formatBuildingEffects(building) {
        if (!building.effects) return '';
        
        let html = '<ul class="effects-list">';
        
        // Housing capacity
        if (building.effects.housingCapacity) {
            html += `<li>Housing: +${building.effects.housingCapacity} capacity</li>`;
        }
        
        // Resource production
        if (building.effects.resourceProduction) {
            for (const resource in building.effects.resourceProduction) {
                html += `<li>${resource}: +${building.effects.resourceProduction[resource]}/day</li>`;
            }
        }
        
        // Resource modifiers
        if (building.effects.resourceModifier) {
            for (const resource in building.effects.resourceModifier) {
                const modifier = building.effects.resourceModifier[resource];
                const percent = ((modifier - 1) * 100).toFixed(0);
                html += `<li>${resource} production: +${percent}%</li>`;
            }
        }
        
        // Fame
        if (building.effects.fame) {
            html += `<li>Fame: +${building.effects.fame}/month</li>`;
        }
        
        // Other effects
        if (building.effects.tradingEnabled) {
            html += `<li>Enables trading</li>`;
        }
        
        if (building.effects.happiness) {
            html += `<li>Happiness: +${building.effects.happiness}</li>`;
        }
        
        html += '</ul>';
        return html;
    }
    
    /**
     * Format a resource list for display
     * @param {Object} resources - Resource object
     * @param {string} label - Label for the list
     * @returns {string} - Formatted HTML
     */
    function formatResourceList(resources, label) {
        if (!resources || Object.keys(resources).length === 0) {
            return '';
        }
        
        let html = `<span class="resource-label">${label}:</span> `;
        
        const resourceList = [];
        for (const resource in resources) {
            resourceList.push(`${resources[resource]} ${resource}`);
        }
        
        html += resourceList.join(', ');
        return html;
    }
    
    /**
     * Add a worker to a construction project
     * @param {string} projectId - ID of the construction project
     */
    function addWorkerToConstruction(projectId) {
        const project = buildings.construction.find(p => p.id === projectId);
        if (!project) return;
        
        const building = Object.values(buildingTypes).find(b => b.id === project.type);
        if (!building) return;
        
        // Check if we already have max workers
        if (project.workersAssigned >= building.workersRequired * 2) {
            Utils.log("Maximum workers already assigned to this project.", "important");
            return;
        }
        
        // Check if we have available workers
        const population = PopulationManager.getPopulation();
        const workersInConstruction = buildings.construction.reduce(
            (total, p) => total + p.workersAssigned, 0
        );
        
        // Also account for workers assigned to other tasks
        const assignedToTasks = getTotalAssignedWorkers();
        
        const availableWorkers = population.workers - workersInConstruction - assignedToTasks;
        
        if (availableWorkers <= 0) {
            Utils.log("No workers available to assign.", "important");
            return;
        }
        
        // Add worker
        project.workersAssigned++;
        
        // Recalculate estimated completion
        const remainingProgress = 100 - project.progress;
        const newDailyProgress = (project.workersAssigned / building.workersRequired) * 100 / building.constructionTime;
        const daysRemaining = remainingProgress / newDailyProgress;
        
        const gameState = GameEngine.getGameState();
        project.estimatedCompletion = {
            ...gameState.date,
            day: gameState.date.day + Math.ceil(daysRemaining)
        };
        
        // Update UI
        updateConstructionList();
    }
    
    /**
     * Remove a worker from a construction project
     * @param {string} projectId - ID of the construction project
     */
    function removeWorkerFromConstruction(projectId) {
        const project = buildings.construction.find(p => p.id === projectId);
        if (!project) return;
        
        const building = Object.values(buildingTypes).find(b => b.id === project.type);
        if (!building) return;
        
        // Check if we're at minimum workers
        if (project.workersAssigned <= 1) {
            Utils.log("Cannot remove the last worker from this project.", "important");
            return;
        }
        
        // Remove worker
        project.workersAssigned--;
        
        // Recalculate estimated completion
        const remainingProgress = 100 - project.progress;
        const newDailyProgress = (project.workersAssigned / building.workersRequired) * 100 / building.constructionTime;
        const daysRemaining = remainingProgress / newDailyProgress;
        
        const gameState = GameEngine.getGameState();
        project.estimatedCompletion = {
            ...gameState.date,
            day: gameState.date.day + Math.ceil(daysRemaining)
        };
        
        // Update UI
        updateConstructionList();
    }

    /**
     * Get the total number of workers assigned to all buildings of a specific type
     * @param {string} workerType - Type of worker (farmers, woodcutters, miners)
     * @returns {number} - Total workers of that type
     */
    function getWorkersOfType(workerType) {
        let total = 0;
        
        // Map building types to worker types
        const buildingToWorkerType = {
            farm: "farmers",
            large_farm: "farmers",
            fishing_hut: "farmers",
            hunting_lodge: "farmers",
            woodcutter_lodge: "woodcutters",
            sawmill: "woodcutters",
            quarry: "miners",
            mine: "miners",
            smithy: "miners",
            forge: "miners",
            storehouse: "unassigned",
            marketplace: "unassigned",
            mead_hall: "unassigned"
        };
        
        // Count workers in all relevant buildings
        for (const buildingId in buildings.built) {
            if (buildingToWorkerType[buildingId] === workerType) {
                const count = buildings.built[buildingId] || 0;
                const buildingType = Object.values(buildingTypes).find(b => b.id === buildingId);
                
                if (buildingType) {
                    // Calculate workers per building based on building worker capacity
                    const workersPerBuilding = buildingType.workerCapacity || 0;
                    total += count * workersPerBuilding;
                }
            }
        }
        
        return total;
    }
    
    /**
     * Get all worker assignments from buildings
     * @returns {Object} - Worker assignments by type
     */
    function getWorkerAssignments() {
        return {
            farmers: getWorkersOfType("farmers"),
            woodcutters: getWorkersOfType("woodcutters"),
            miners: getWorkersOfType("miners")
        };
    }
    
    /**
     * Get the total number of workers assigned to buildings
     * @returns {number} - Total assigned workers
     */
    function getTotalAssignedWorkers() {
        const assignments = getWorkerAssignments();
        return assignments.farmers + assignments.woodcutters + assignments.miners;
    }
    
    /**
     * Get available worker capacity for all buildings
     * @returns {Object} - Available capacity by worker type
     */
    function getAvailableCapacity() {
        const builtBuildings = buildings.built;
        const capacity = {
            farmers: 0,
            woodcutters: 0,
            miners: 0
        };
        
        // Building types that provide jobs
        const farmBuildings = ['farm', 'large_farm', 'fishing_hut', 'hunting_lodge'];
        const woodcutterBuildings = ['woodcutter_lodge', 'sawmill'];
        const minerBuildings = ['quarry', 'mine', 'smithy', 'forge'];
        
        // Calculate capacity for each building type
        for (const buildingId in builtBuildings) {
            const count = builtBuildings[buildingId];
            const building = Object.values(buildingTypes).find(b => b.id === buildingId);
            
            if (!building) continue;
            
            if (farmBuildings.includes(buildingId)) {
                capacity.farmers += count * building.workerCapacity;
            } else if (woodcutterBuildings.includes(buildingId)) {
                capacity.woodcutters += count * building.workerCapacity;
            } else if (minerBuildings.includes(buildingId)) {
                capacity.miners += count * building.workerCapacity;
            }
        }
        
        return capacity;
    }
    
    // Public API
    return {
        /**
         * Initialize the building system
         */
        init: function() {
            console.log("Initializing Building System...");
            
            // Set up initial data
            buildings = {
                built: {},
                construction: []
            };
            
            // Add starter house
            buildings.built.house = 1;
            
            // Create UI
            createBuildingUI();
            
            // Apply effects of starter buildings
            const starterHouse = buildingTypes.HOUSE;
            applyBuildingEffects(starterHouse);
            
            console.log("Building System initialized");
        },
        
        /**
         * Process building system for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Process construction projects
            processConstruction(gameState, tickSize);
            
            // Process monthly maintenance
            processMonthlyMaintenance(gameState);
            
            // Update resource production
            updateResourceProduction(gameState);
            
            // Update UI
            updateBuildingUI();
        },
        
        /**
         * Get data about all buildings
         * @returns {Object} - Building data
         */
        getBuildingData: function() {
            return {
                built: { ...buildings.built },
                construction: [...buildings.construction],
                available: Object.values(buildingTypes).map(type => ({
                    id: type.id,
                    name: type.name,
                    category: type.category
                }))
            };
        },
        
        /**
         * Get information about a specific building type
         * @param {string} buildingId - ID of the building type
         * @returns {Object|null} - Building type definition or null if not found
         */
        getBuildingType: function(buildingId) {
            const building = Object.values(buildingTypes).find(
                type => type.id === buildingId
            );
            
            return building ? { ...building } : null;
        },
        
        /**
         * Start construction of a new building
         * @param {string} buildingType - Type of building to construct
         * @returns {Object} - Result of construction attempt
         */
        startBuildingConstruction: function(buildingType) {
            return startConstruction(buildingType, GameEngine.getGameState());
        },
        
        /**
         * Check if a building can be built
         * @param {string} buildingType - Type of building to check
         * @returns {Object} - Result with success flag and reason
         */
        canBuildBuilding: function(buildingType) {
            return canBuildType(buildingType, GameEngine.getGameState());
        },
        
        /**
         * Get all buildings of a specific type
         * @param {string} buildingType - Type of building
         * @returns {number} - Number of buildings of that type
         */
        getBuildingCount: function(buildingType) {
            return buildings.built[buildingType] || 0;
        },

        // Building-based worker system methods
        /**
         * Get the total number of workers assigned to all buildings of a specific type
         * @param {string} workerType - Type of worker (farmers, woodcutters, miners)
         * @returns {number} - Total workers of that type
         */
        getWorkersOfType: getWorkersOfType,
        
        /**
         * Get all worker assignments from buildings
         * @returns {Object} - Worker assignments by type
         */
        getWorkerAssignments: getWorkerAssignments,
        
        /**
         * Get the total number of workers assigned to buildings
         * @returns {number} - Total assigned workers
         */
        getTotalAssignedWorkers: getTotalAssignedWorkers,
        
        /**
         * Get available worker capacity for all buildings
         * @returns {Object} - Available capacity by worker type
         */
        getAvailableCapacity: getAvailableCapacity,
        
        /**
         * Update the building UI
         * Public method that can be called from other modules
         */
        updateBuildingUI: updateBuildingUI
    };

    
})();

// After creating a new construction project
if (typeof NavigationSystem !== 'undefined') {
    NavigationSystem.switchToTab('buildings');
}