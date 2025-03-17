/**
 * Viking Legacy - Naval and Ship System
 * Handles ship construction, naval travel, sea raids, and naval warfare
 */

const NavalManager = (function() {
    // Constants
    const SHIP_TYPES = {
        KNARR: {
            id: "knarr",
            name: "Knarr",
            description: "A merchant vessel designed for cargo rather than speed or war.",
            crewMin: 4,
            crewMax: 12,
            cargoCapacity: 200,
            passengerCapacity: 6,
            speed: 3, // Relative speed factor
            seaworthiness: 0.7, // Ability to withstand storms (0-1)
            constructionCost: {
                wood: 150,
                metal: 15,
                wealth: 50
            },
            maintenanceCost: {
                wood: 5,
                wealth: 2
            },
            combatStats: {
                attack: 1,
                defense: 2
            },
            unlockRequirements: {
                buildings: ["shipyard"],
                research: ["basic_shipbuilding"]
            }
        },
        FAERING: {
            id: "faering",
            name: "Faering",
            description: "A small boat with four oars, suitable for fishing and coastal travel.",
            crewMin: 2,
            crewMax: 4,
            cargoCapacity: 50,
            passengerCapacity: 2,
            speed: 2,
            seaworthiness: 0.4,
            constructionCost: {
                wood: 50,
                metal: 5,
                wealth: 20
            },
            maintenanceCost: {
                wood: 2,
                wealth: 1
            },
            combatStats: {
                attack: 0,
                defense: 1
            },
            unlockRequirements: {
                buildings: ["dock"]
            }
        },
        LONGSHIP: {
            id: "longship",
            name: "Longship",
            description: "The iconic Viking warship, designed for speed, shallow draft, and carrying warriors.",
            crewMin: 20,
            crewMax: 40,
            cargoCapacity: 100,
            passengerCapacity: 30,
            speed: 5,
            seaworthiness: 0.8,
            constructionCost: {
                wood: 250,
                metal: 30,
                wealth: 100
            },
            maintenanceCost: {
                wood: 8,
                wealth: 3
            },
            combatStats: {
                attack: 5,
                defense: 3
            },
            unlockRequirements: {
                buildings: ["shipyard"],
                research: ["longship_construction"]
            }
        },
        KARVE: {
            id: "karve",
            name: "Karve",
            description: "A medium-sized, versatile ship good for both trade and raiding.",
            crewMin: 6,
            crewMax: 16,
            cargoCapacity: 120,
            passengerCapacity: 12,
            speed: 4,
            seaworthiness: 0.6,
            constructionCost: {
                wood: 180,
                metal: 20,
                wealth: 70
            },
            maintenanceCost: {
                wood: 6,
                wealth: 2
            },
            combatStats: {
                attack: 3,
                defense: 2
            },
            unlockRequirements: {
                buildings: ["shipyard"],
                research: ["intermediate_shipbuilding"]
            }
        },
        BUSSE: {
            id: "busse",
            name: "Busse",
            description: "The largest longship, designed for long expeditions with large crews.",
            crewMin: 40,
            crewMax: 70,
            cargoCapacity: 250,
            passengerCapacity: 60,
            speed: 4,
            seaworthiness: 0.9,
            constructionCost: {
                wood: 400,
                metal: 50,
                wealth: 200
            },
            maintenanceCost: {
                wood: 12,
                wealth: 5
            },
            combatStats: {
                attack: 7,
                defense: 5
            },
            unlockRequirements: {
                buildings: ["advanced_shipyard"],
                research: ["advanced_shipbuilding"],
                rank: 5 // Requires high rank
            }
        }
    };
    
    const NAVAL_EVENT_TYPES = {
        STORM: {
            id: "storm",
            name: "Ocean Storm",
            description: "A powerful storm tests your ship and crew.",
            probability: 0.2, // Chance per day at sea
            seasonalModifier: {
                Spring: 1.0,
                Summer: 0.7,
                Fall: 1.2,
                Winter: 1.5
            },
            outcomes: [
                {
                    id: "weather_storm",
                    description: "Your ship successfully weathers the storm.",
                    result: "You navigate through the turbulent waters, losing some time but avoiding damage.",
                    requirements: function(ship, crew) {
                        return ship.seaworthiness > 0.6 || crew.navigation > 3;
                    },
                    effects: function(voyage) {
                        voyage.remainingDays += 1; // Delay
                    }
                },
                {
                    id: "minor_damage",
                    description: "Your ship sustains minor damage.",
                    result: "The storm batters your ship, causing some damage that will need repairs.",
                    requirements: function(ship, crew) {
                        return ship.seaworthiness > 0.4;
                    },
                    effects: function(voyage) {
                        voyage.remainingDays += 2; // Longer delay
                        voyage.ship.condition -= 20; // Damage
                    }
                },
                {
                    id: "major_damage",
                    description: "Your ship sustains major damage.",
                    result: "The ferocious storm severely damages your ship, putting the voyage at risk.",
                    requirements: function() { return true; }, // Always possible
                    effects: function(voyage) {
                        voyage.remainingDays += 4; // Significant delay
                        voyage.ship.condition -= 50; // Severe damage
                        
                        // Lose some cargo
                        if (voyage.cargo) {
                            for (const goodId in voyage.cargo) {
                                voyage.cargo[goodId] = Math.floor(voyage.cargo[goodId] * 0.7); // Lose 30%
                            }
                        }
                    }
                },
                {
                    id: "shipwreck",
                    description: "Your ship is wrecked by the storm.",
                    result: "The storm overwhelms your ship, breaking it apart and forcing your crew to swim for shore.",
                    requirements: function(ship) {
                        return ship.seaworthiness < 0.5 && ship.condition < 50;
                    },
                    effects: function(voyage) {
                        voyage.wrecked = true; // Ship is lost
                        voyage.failureReason = "Shipwreck";
                        
                        // Crew casualties
                        voyage.crew.casualties = Math.floor(voyage.crew.size * 0.5); // 50% casualties
                        
                        // Lose all cargo
                        voyage.cargo = {};
                    }
                }
            ]
        },
        PIRATES: {
            id: "pirates",
            name: "Pirate Attack",
            description: "Your ship is approached by hostile pirates intent on plunder.",
            probability: 0.1,
            seasonalModifier: {
                Spring: 1.0,
                Summer: 1.2,
                Fall: 1.0,
                Winter: 0.6
            },
            outcomes: [
                {
                    id: "outrun_pirates",
                    description: "You outrun the pirates.",
                    result: "Your swift ship manages to escape the pursuing pirates.",
                    requirements: function(ship) {
                        return ship.speed > 3;
                    },
                    effects: function(voyage) {
                        voyage.remainingDays += 1; // Small delay
                    }
                },
                {
                    id: "fight_off_pirates",
                    description: "You fight off the pirates.",
                    result: "Your crew successfully repels the pirate attack.",
                    requirements: function(ship, crew) {
                        return (ship.combatStats.attack + ship.combatStats.defense) * crew.size > 100;
                    },
                    effects: function(voyage) {
                        voyage.remainingDays += 1;
                        voyage.crew.casualties = Math.floor(voyage.crew.size * 0.1); // 10% casualties
                        voyage.ship.condition -= 10; // Minor damage
                    }
                },
                {
                    id: "lose_cargo",
                    description: "You surrender some cargo to the pirates.",
                    result: "You negotiate with the pirates, giving up some cargo to avoid bloodshed.",
                    requirements: function() { return true; }, // Always possible
                    effects: function(voyage) {
                        // Lose half of cargo
                        if (voyage.cargo) {
                            for (const goodId in voyage.cargo) {
                                voyage.cargo[goodId] = Math.floor(voyage.cargo[goodId] * 0.5);
                            }
                        }
                    }
                },
                {
                    id: "ship_captured",
                    description: "Your ship is captured by the pirates.",
                    result: "The pirates overwhelm your defenses and capture your ship.",
                    requirements: function(ship, crew) {
                        return (ship.combatStats.attack + ship.combatStats.defense) * crew.size < 50;
                    },
                    effects: function(voyage) {
                        voyage.wrecked = true; // Ship is lost
                        voyage.failureReason = "Captured";
                        
                        // Crew casualties
                        voyage.crew.casualties = Math.floor(voyage.crew.size * 0.3);
                        
                        // Lose all cargo
                        voyage.cargo = {};
                    }
                }
            ]
        },
        DISCOVERY: {
            id: "discovery",
            name: "Discovery",
            description: "Your crew spots something interesting while at sea.",
            probability: 0.05,
            seasonalModifier: {
                Spring: 1.0,
                Summer: 1.2,
                Fall: 1.0,
                Winter: 0.7
            },
            outcomes: [
                {
                    id: "unknown_island",
                    description: "You discover an unknown island.",
                    result: "Your crew spots an island not on any known maps.",
                    requirements: function() { return true; },
                    effects: function(voyage) {
                        // In full implementation, would add island to map
                        voyage.discovery = { type: "island" };
                    }
                },
                {
                    id: "shipwreck_salvage",
                    description: "You find a shipwreck to salvage.",
                    result: "Your crew discovers the remains of a wrecked ship with salvageable goods.",
                    requirements: function() { return true; },
                    effects: function(voyage) {
                        voyage.remainingDays += 1; // Delay to salvage
                        
                        // Add random salvage
                        const salvageValue = Utils.randomBetween(20, 100);
                        voyage.discovery = { 
                            type: "salvage", 
                            goods: { 
                                wood: Utils.randomBetween(10, 30),
                                metal: Utils.randomBetween(5, 15),
                                wealth: salvageValue
                            }
                        };
                    }
                },
                {
                    id: "trading_opportunity",
                    description: "You encounter potential trading partners.",
                    result: "You meet a friendly ship willing to trade goods.",
                    requirements: function() { return true; },
                    effects: function(voyage) {
                        voyage.discovery = { type: "trade_opportunity" };
                    }
                }
            ]
        }
    };
    
    // Private variables
    let playerShips = [];
    let activeVoyages = [];
    let navalEvents = [];
    let discoveredSeaRoutes = [];
    
    // Private methods
    
    /**
     * Calculate the cost to build a ship
     * @param {string} shipTypeId - Type of ship to build
     * @returns {Object} - Construction costs
     */
    function calculateShipCost(shipTypeId) {
        const shipType = SHIP_TYPES[shipTypeId.toUpperCase()];
        if (!shipType) return null;
        
        return { ...shipType.constructionCost };
    }
    
    /**
     * Check if player meets requirements to build a ship
     * @param {string} shipTypeId - Type of ship to build
     * @returns {Object} - Result with success flag and reason
     */
    function checkShipRequirements(shipTypeId) {
        const shipType = SHIP_TYPES[shipTypeId.toUpperCase()];
        if (!shipType) {
            return { success: false, reason: "Unknown ship type." };
        }
        
        // Check for required buildings
        if (shipType.unlockRequirements && shipType.unlockRequirements.buildings) {
            for (const buildingId of shipType.unlockRequirements.buildings) {
                // In a full implementation, would check if player has the building
                // For now, assume they have it if not specified
                const hasBuilding = true;
                
                if (!hasBuilding) {
                    return { 
                        success: false, 
                        reason: `Requires a ${buildingId} to construct this ship.`
                    };
                }
            }
        }
        
        // Check for required research
        if (shipType.unlockRequirements && shipType.unlockRequirements.research) {
            for (const researchId of shipType.unlockRequirements.research) {
                // In a full implementation, would check if player has researched it
                // For now, assume they have it if not specified
                const hasResearch = true;
                
                if (!hasResearch) {
                    return {
                        success: false,
                        reason: `Requires the ${researchId} technology to construct this ship.`
                    };
                }
            }
        }
        
        // Check for required rank
        if (shipType.unlockRequirements && shipType.unlockRequirements.rank) {
            const playerRank = RankManager ? RankManager.getCurrentRank().index : 0;
            
            if (playerRank < shipType.unlockRequirements.rank) {
                return {
                    success: false,
                    reason: `Requires ${RankManager.getRankByIndex(shipType.unlockRequirements.rank).title} rank or higher.`
                };
            }
        }
        
        // Check if resources are available
        if (shipType.constructionCost) {
            const sufficientResources = ResourceManager.canAfford(shipType.constructionCost);
            if (!sufficientResources) {
                return {
                    success: false,
                    reason: "Not enough resources to build this ship."
                };
            }
        }
        
        return { success: true };
    }
    
    /**
     * Process a random naval event for a voyage
     * @param {Object} voyage - Voyage object
     * @param {string} season - Current season
     * @returns {Object|null} - Event result or null if no event occurred
     */
    function processRandomNavalEvent(voyage, season) {
        // Check each event type
        for (const eventTypeId in NAVAL_EVENT_TYPES) {
            const eventType = NAVAL_EVENT_TYPES[eventTypeId];
            
            // Adjust probability based on season
            let probability = eventType.probability;
            if (eventType.seasonalModifier && eventType.seasonalModifier[season]) {
                probability *= eventType.seasonalModifier[season];
            }
            
            // Check if event occurs
            if (Math.random() < probability) {
                // Event occurs!
                const event = {
                    type: eventType.id,
                    name: eventType.name,
                    description: eventType.description,
                    timestamp: GameEngine.getGameState().date.day,
                    voyageId: voyage.id
                };
                
                // Determine outcome
                const possibleOutcomes = eventType.outcomes.filter(outcome => 
                    outcome.requirements(voyage.ship, voyage.crew)
                );
                
                if (possibleOutcomes.length === 0) {
                    // No possible outcomes, default to worst outcome
                    const worstOutcome = eventType.outcomes[eventType.outcomes.length - 1];
                    event.outcome = worstOutcome;
                    
                    // Apply effects
                    worstOutcome.effects(voyage);
                } else {
                    // Randomly select from possible outcomes, weighted towards better outcomes
                    // based on ship/crew quality
                    let totalWeight = 0;
                    const weightedOutcomes = possibleOutcomes.map((outcome, index) => {
                        // Better outcomes have higher weight when ship is good
                        const qualityFactor = (voyage.ship.seaworthiness * 10) + (voyage.crew.navigation * 2);
                        const weight = Math.max(1, qualityFactor - (index * 5));
                        totalWeight += weight;
                        return { outcome, weight };
                    });
                    
                    // Select outcome based on weights
                    let random = Math.random() * totalWeight;
                    let selectedOutcome = weightedOutcomes[weightedOutcomes.length - 1].outcome;
                    
                    for (const { outcome, weight } of weightedOutcomes) {
                        if (random < weight) {
                            selectedOutcome = outcome;
                            break;
                        }
                        random -= weight;
                    }
                    
                    event.outcome = selectedOutcome;
                    
                    // Apply effects
                    selectedOutcome.effects(voyage);
                }
                
                // Add to naval events
                navalEvents.push(event);
                
                return event;
            }
        }
        
        return null;
    }
    
    // Public API
    return {
        /**
         * Initialize the naval manager
         */
        init: function() {
            console.log("Naval Manager initialized");
            
            // Reset variables
            playerShips = [];
            activeVoyages = [];
            navalEvents = [];
            discoveredSeaRoutes = [];
        },
        
        /**
         * Get ship types information
         * @returns {Object} - Ship types
         */
        getShipTypes: function() {
            return { ...SHIP_TYPES };
        },
        
        /**
         * Get player ships
         * @returns {Array} - Array of player ships
         */
        getPlayerShips: function() {
            return [...playerShips];
        },
        
        /**
         * Get a ship by ID
         * @param {string} shipId - Ship ID
         * @returns {Object|null} - Ship object or null if not found
         */
        getShipById: function(shipId) {
            return playerShips.find(s => s.id === shipId) || null;
        },
        
        /**
         * Build a new ship
         * @param {string} shipTypeId - Type of ship to build
         * @param {string} name - Name for the ship
         * @returns {Object|null} - New ship or null if construction failed
         */
        buildShip: function(shipTypeId, name) {
            // Check requirements
            const requirements = checkShipRequirements(shipTypeId);
            if (!requirements.success) {
                Utils.log(requirements.reason, "important");
                return null;
            }
            
            const shipType = SHIP_TYPES[shipTypeId.toUpperCase()];
            if (!shipType) {
                Utils.log("Invalid ship type.", "important");
                return null;
            }
            
            // Pay for ship
            if (shipType.constructionCost) {
                if (!ResourceManager.subtractResources(shipType.constructionCost)) {
                    Utils.log("Failed to allocate resources for ship construction.", "important");
                    return null;
                }
            }
            
            // Create ship
            const newShip = {
                id: `ship_${Date.now()}`,
                name: name || `${shipType.name} ${playerShips.length + 1}`,
                type: shipType.id,
                typeName: shipType.name,
                crewCapacity: shipType.crewMax,
                cargoCapacity: shipType.cargoCapacity,
                passengerCapacity: shipType.passengerCapacity,
                speed: shipType.speed,
                seaworthiness: shipType.seaworthiness,
                condition: 100, // 100% condition when new
                maintenanceDue: GameEngine.getGameState().date.day + 30, // 30 days until first maintenance
                combatStats: { ...shipType.combatStats },
                cargo: {},
                crew: {
                    size: 0,
                    assigned: false
                },
                location: GameEngine.getGameState().playerRegionId, // Current region
                inVoyage: false
            };
            
            playerShips.push(newShip);
            
            Utils.log(`Built a new ${shipType.name} named "${newShip.name}".`, "success");
            return newShip;
        },
        
        /**
         * Assign crew to a ship
         * @param {string} shipId - Ship ID
         * @param {number} crewSize - Number of crew to assign
         * @returns {boolean} - Whether assignment was successful
         */
        assignCrewToShip: function(shipId, crewSize) {
            const ship = this.getShipById(shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return false;
            }
            
            const shipType = SHIP_TYPES[ship.type.toUpperCase()];
            if (!shipType) {
                Utils.log("Invalid ship type.", "important");
                return false;
            }
            
            // Check if ship is in voyage
            if (ship.inVoyage) {
                Utils.log("Cannot change crew during a voyage.", "important");
                return false;
            }
            
            // Check if crew size is valid
            if (crewSize < shipType.crewMin) {
                Utils.log(`This ship requires at least ${shipType.crewMin} crew members.`, "important");
                return false;
            }
            
            if (crewSize > shipType.crewMax) {
                Utils.log(`This ship can only hold up to ${shipType.crewMax} crew members.`, "important");
                return false;
            }
            
            // Check if we have enough population
            // In a full implementation, would check if player has enough population
            // For now, assume they do if not specified
            const populationAvailable = true;
            
            if (!populationAvailable) {
                Utils.log("Not enough available crew members.", "important");
                return false;
            }
            
            // Assign crew
            ship.crew = {
                size: crewSize,
                assigned: true,
                navigation: Math.floor(Math.random() * 5) + 1, // Random skill level 1-5
                combat: Math.floor(Math.random() * 5) + 1
            };
            
            Utils.log(`Assigned ${crewSize} crew members to ${ship.name}.`, "success");
            return true;
        },
        
        /**
         * Load cargo onto a ship
         * @param {string} shipId - Ship ID
         * @param {Object} cargo - Cargo to load (goodId: quantity)
         * @returns {boolean} - Whether loading was successful
         */
        loadCargo: function(shipId, cargo) {
            const ship = this.getShipById(shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return false;
            }
            
            // Check if ship is in voyage
            if (ship.inVoyage) {
                Utils.log("Cannot load cargo during a voyage.", "important");
                return false;
            }
            
            // Calculate total cargo weight
            let totalWeight = 0;
            for (const goodId in cargo) {
                const quantity = cargo[goodId];
                const good = TradeManager.getTradeGoods()[goodId.toUpperCase()];
                
                if (good) {
                    totalWeight += good.weight * quantity;
                }
            }
            
            // Check if ship has enough capacity
            let currentWeight = 0;
            for (const goodId in ship.cargo) {
                const quantity = ship.cargo[goodId];
                const good = TradeManager.getTradeGoods()[goodId.toUpperCase()];
                
                if (good) {
                    currentWeight += good.weight * quantity;
                }
            }
            
            if (currentWeight + totalWeight > ship.cargoCapacity) {
                Utils.log("Not enough cargo capacity.", "important");
                return false;
            }
            
            // Check if player has the cargo
            // In a full implementation, would check player inventory
            // For now, assume they have it
            
            // Load cargo
            for (const goodId in cargo) {
                const quantity = cargo[goodId];
                
                if (!ship.cargo[goodId]) {
                    ship.cargo[goodId] = 0;
                }
                
                ship.cargo[goodId] += quantity;
            }
            
            Utils.log(`Loaded cargo onto ${ship.name}.`, "success");
            return true;
        },
        
        /**
         * Unload cargo from a ship
         * @param {string} shipId - Ship ID
         * @param {Object} cargo - Cargo to unload (goodId: quantity)
         * @returns {boolean} - Whether unloading was successful
         */
        unloadCargo: function(shipId, cargo) {
            const ship = this.getShipById(shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return false;
            }
            
            // Check if ship is in voyage
            if (ship.inVoyage) {
                Utils.log("Cannot unload cargo during a voyage.", "important");
                return false;
            }
            
            // Check if ship has the cargo
            for (const goodId in cargo) {
                const quantity = cargo[goodId];
                
                if (!ship.cargo[goodId] || ship.cargo[goodId] < quantity) {
                    Utils.log(`Not enough ${goodId} on the ship.`, "important");
                    return false;
                }
            }
            
            // Unload cargo
            for (const goodId in cargo) {
                const quantity = cargo[goodId];
                
                ship.cargo[goodId] -= quantity;
                
                // Remove entry if quantity is 0
                if (ship.cargo[goodId] <= 0) {
                    delete ship.cargo[goodId];
                }
                
                // In a full implementation, would add to player inventory
            }
            
            Utils.log(`Unloaded cargo from ${ship.name}.`, "success");
            return true;
        },
        
        /**
         * Repair a ship
         * @param {string} shipId - Ship ID
         * @returns {boolean} - Whether repair was successful
         */
        repairShip: function(shipId) {
            const ship = this.getShipById(shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return false;
            }
            
            // Check if ship is in voyage
            if (ship.inVoyage) {
                Utils.log("Cannot repair ship during a voyage.", "important");
                return false;
            }
            
            // Check if ship needs repair
            if (ship.condition >= 100) {
                Utils.log("Ship is already in perfect condition.", "important");
                return false;
            }
            
            const shipType = SHIP_TYPES[ship.type.toUpperCase()];
            if (!shipType) {
                Utils.log("Invalid ship type.", "important");
                return false;
            }
            
            // Calculate repair cost
            const damagePercent = 100 - ship.condition;
            const repairCost = {
                wood: Math.ceil(shipType.constructionCost.wood * 0.01 * damagePercent),
                metal: Math.ceil(shipType.constructionCost.metal * 0.01 * damagePercent),
                wealth: Math.ceil(shipType.constructionCost.wealth * 0.01 * damagePercent)
            };
            
            // Check if player can afford repair
            if (!ResourceManager.canAfford(repairCost)) {
                Utils.log(`Cannot afford repairs. Needs ${repairCost.wood} wood, ${repairCost.metal} metal, and ${repairCost.wealth} wealth.`, "important");
                return false;
            }
            
            // Pay for repair
            ResourceManager.subtractResources(repairCost);
            
            // Repair ship
            ship.condition = 100;
            
            // Reset maintenance due
            ship.maintenanceDue = GameEngine.getGameState().date.day + 30;
            
            Utils.log(`Repaired ${ship.name} to perfect condition.`, "success");
            return true;
        },
        
        /**
         * Start a voyage with a ship
         * @param {string} shipId - Ship ID
         * @param {string} destinationId - Destination region ID
         * @returns {Object|null} - Voyage object or null if failed to start
         */
        startVoyage: function(shipId, destinationId) {
            const ship = this.getShipById(shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return null;
            }
            
            // Check if ship is already in a voyage
            if (ship.inVoyage) {
                Utils.log("Ship is already on a voyage.", "important");
                return null;
            }
            
            // Check if ship has crew
            if (!ship.crew.assigned || ship.crew.size < SHIP_TYPES[ship.type.toUpperCase()].crewMin) {
                Utils.log("Ship needs a crew for a voyage.", "important");
                return null;
            }
            
            // Check if ship is in good condition
            if (ship.condition < 50) {
                Utils.log("Ship is in poor condition and needs repairs before sailing.", "important");
                return null;
            }
            
            // Get destination region
            const destinationRegion = WorldGenerator.getRegionById(destinationId);
            if (!destinationRegion) {
                Utils.log("Invalid destination.", "important");
                return null;
            }
            
            // Check if destination is reachable by sea
            if (destinationRegion.type !== "coastline") {
                Utils.log("Destination must be a coastal region.", "important");
                return null;
            }
            
            // Get current region
            const currentRegion = WorldGenerator.getRegionById(ship.location);
            if (!currentRegion || currentRegion.type !== "coastline") {
                Utils.log("Current location must be a coastal region.", "important");
                return null;
            }
            
            // Calculate travel time based on distance and ship speed
            // In a full implementation, would use proper path finding
            // For now, use a simplified approach
            const baseDistance = Utils.randomBetween(3, 10);
            const travelTime = Math.ceil(baseDistance / ship.speed * (1 + Math.random() * 0.2));
            
            // Create voyage
            const voyage = {
                id: `voyage_${Date.now()}`,
                shipId: ship.id,
                shipName: ship.name,
                startRegionId: ship.location,
                destinationRegionId: destinationId,
                startDate: GameEngine.getGameState().date.day,
                estimatedDuration: travelTime,
                remainingDays: travelTime,
                events: [],
                ship: { ...ship, cargo: { ...ship.cargo } }, // Clone ship for voyage
                crew: { ...ship.crew },
                isComplete: false,
                isSuccessful: false,
                wrecked: false,
                failureReason: null
            };
            
            // Mark ship as in voyage
            ship.inVoyage = true;
            
            // Add to active voyages
            activeVoyages.push(voyage);
            
            Utils.log(`${ship.name} has set sail for ${destinationRegion.name}. Estimated travel time: ${travelTime} days.`, "success");
            
            return voyage;
        },
        
        /**
         * Process active voyages for a game tick
         * @param {number} daysPassed - Number of days passed
         */
        processTick: function(daysPassed) {
            const currentSeason = GameEngine.getGameState().date.season;
            const completedVoyages = [];
            
            // Process each active voyage
            activeVoyages.forEach(voyage => {
                // Process each day separately for events
                for (let day = 0; day < daysPassed; day++) {
                    // Skip if voyage is already complete
                    if (voyage.isComplete) continue;
                    
                    // Decrement remaining days
                    voyage.remainingDays--;
                    
                    // Check for random events
                    const event = processRandomNavalEvent(voyage, currentSeason);
                    if (event) {
                        voyage.events.push(event);
                        
                        // Log event
                        Utils.log(`[${voyage.shipName}] ${event.name}: ${event.description}`, "important");
                        Utils.log(`Outcome: ${event.outcome.description} - ${event.outcome.result}`, "important");
                        
                        // Check if ship was wrecked
                        if (voyage.wrecked) {
                            voyage.isComplete = true;
                            voyage.isSuccessful = false;
                            
                            Utils.log(`${voyage.shipName} has been lost at sea! ${voyage.failureReason}.`, "danger");
                            
                            // Remove ship from player ships
                            playerShips = playerShips.filter(s => s.id !== voyage.shipId);
                            
                            break; // Stop processing this voyage
                        }
                    }
                    
                    // Check if voyage is complete
                    if (voyage.remainingDays <= 0) {
                        voyage.isComplete = true;
                        voyage.isSuccessful = true;
                        break;
                    }
                }
                
                // If voyage is newly completed this tick, add to completed voyages
                if (voyage.isComplete && !completedVoyages.includes(voyage)) {
                    completedVoyages.push(voyage);
                }
            });
            
            // Handle completed voyages
            completedVoyages.forEach(voyage => {
                if (voyage.isSuccessful) {
                    // Successful voyage
                    this.completeVoyage(voyage);
                }
                
                // Maintain active voyages list
                activeVoyages = activeVoyages.filter(v => v.id !== voyage.id);
            });
            
            // Process non-voyage ships for maintenance
            playerShips.forEach(ship => {
                if (!ship.inVoyage) {
                    // Check if maintenance is due
                    if (GameEngine.getGameState().date.day >= ship.maintenanceDue) {
                        // Ship condition deteriorates if not maintained
                        ship.condition = Math.max(0, ship.condition - 5);
                        
                        // Extend maintenance due date
                        ship.maintenanceDue += 30;
                        
                        Utils.log(`${ship.name} requires maintenance. Condition deteriorated to ${ship.condition}%.`, "important");
                    }
                }
            });
        },
        
        /**
         * Complete a voyage
         * @param {Object} voyage - Voyage to complete
         */
        completeVoyage: function(voyage) {
            // Get the ship
            const ship = this.getShipById(voyage.shipId);
            if (!ship) {
                Utils.log("Ship not found.", "important");
                return;
            }
            
            // Update ship location
            ship.location = voyage.destinationRegionId;
            
            // Update ship condition
            ship.condition = voyage.ship.condition;
            
            // Update ship cargo
            ship.cargo = { ...voyage.ship.cargo };
            
            // Mark ship as no longer in voyage
            ship.inVoyage = false;
            
            // Add fame for successful voyage
            RankManager.addFame(5, "Completed sea voyage");
            
            // Add to discovered sea routes
            const routeKey = `${voyage.startRegionId}_${voyage.destinationRegionId}`;
            const reverseRouteKey = `${voyage.destinationRegionId}_${voyage.startRegionId}`;
            
            if (!discoveredSeaRoutes.includes(routeKey) && !discoveredSeaRoutes.includes(reverseRouteKey)) {
                discoveredSeaRoutes.push(routeKey);
                
                // Add extra fame for discovering new route
                RankManager.addFame(10, "Discovered new sea route");
            }
            
            // Get destination region
            const destinationRegion = WorldGenerator.getRegionById(voyage.destinationRegionId);
            if (destinationRegion) {
                Utils.log(`${ship.name} has successfully reached ${destinationRegion.name}.`, "success");
            } else {
                Utils.log(`${ship.name} has successfully completed its voyage.`, "success");
            }
            
            // If player's ship, update player's region
            if (GameEngine.getGameState().playerShipId === ship.id) {
                GameEngine.setPlayerRegion(voyage.destinationRegionId);
            }
        },
        
        /**
         * Get active voyages
         * @returns {Array} - Array of active voyages
         */
        getActiveVoyages: function() {
            return [...activeVoyages];
        },
        
        /**
         * Get naval events
         * @returns {Array} - Array of naval events
         */
        getNavalEvents: function() {
            return [...navalEvents];
        },
        
        /**
         * Get discovered sea routes
         * @returns {Array} - Array of discovered sea routes
         */
        getDiscoveredSeaRoutes: function() {
            return [...discoveredSeaRoutes];
        },
        
        /**
         * Get voyage by ID
         * @param {string} voyageId - Voyage ID
         * @returns {Object|null} - Voyage object or null if not found
         */
        getVoyageById: function(voyageId) {
            return activeVoyages.find(v => v.id === voyageId) || null;
        },
        
        /**
         * Start a sea raid with a ship
         * @param {string} shipId - Ship ID
         * @param {Object} target - Raid target
         * @returns {Object|null} - Raid object or null if failed to start
         */
        startSeaRaid: function(shipId, target) {
            // Implementation would be similar to WarfareManager.launchRaid
            // but specialized for naval warfare
            console.log(`Starting sea raid with ${shipId} against ${target.name}`);
            return null; // Placeholder for now
        }
    };
})();