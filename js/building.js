/**
 * Viking Legacy - Building System with Tier Progression
 * Handles building construction, management, and integration with land/resources
 * Updated to support tiered progression and warrior management
 */

const BuildingSystem = (function() {
    // Building definitions
    const buildingTypes = {
        // ===== MAIN BUILDINGS (Tier Progression) =====
        KARLS_HALL: {
            id: "karls_hall",
            name: "Karl's Hall",
            description: "The humble hall of a lowly Karl, serving as your settlement's center.",
            category: "main",
            tier: 1,
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 200,
                stone: 30
            },
            constructionTime: 8, // Days to build
            workerCapacity: 0, // Main buildings don't provide regular jobs
            workersRequired: 3, // Workers needed to build
            maintenanceCost: {
                wood: 1, // Maintenance cost per month
                food: 5
            },
            maxCount: 1, // Only one main building
            upgradesTo: "chieftains_hall",
            effects: {
                housingCapacity: 0,
                warriorCapacity: 15 // Can house/support 5 warriors
            }
        },
        
        CHIEFTAINS_HALL: {
            id: "chieftains_hall",
            name: "Chieftain's Hall",
            description: "A larger wooden structure with better quarters, befitting a Chieftain of growing renown.",
            category: "main",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 3
            },
            constructionCost: {
                wood: 500,
                metal: 100
            },
            constructionTime: 150,
            workerCapacity: 0,
            workersRequired: 15,
            maintenanceCost: {
                wood: 2,
                food: 8
            },
            maxCount: 1,
            upgradesTo: "jarls_keep",
            unlockRequirements: {
                rank: 5 // Requires player to be at least rank 5
            },
            effects: {
                housingCapacity: 0,
                warriorCapacity: 30,
                fame: 2 // Fame bonus per month
            }
        },
        
        JARLS_KEEP: {
            id: "jarls_keep",
            name: "Jarl's Keep",
            description: "A fortified timber and stone keep, showing your status as a Jarl with significant influence.",
            category: "main",
            tier: 3,
            landRequirement: {
                type: "settlement",
                amount: 4
            },
            constructionCost: {
                wood: 1200,
                metal: 250
            },
            constructionTime: 20,
            workerCapacity: 0,
            workersRequired: 8,
            maintenanceCost: {
                wood: 3,
                food: 12,
                metal: 1
            },
            maxCount: 1,
            upgradesTo: "earls_citadel",
            unlockRequirements: {
                rank: 10 // Requires player to be rank 10
            },
            effects: {
                housingCapacity: 0,
                warriorCapacity: 100,
                fame: 4
            }
        },
        
        EARLS_CITADEL: {
            id: "earls_citadel",
            name: "Earl's Citadel",
            description: "A formidable stone citadel with multiple towers and extensive quarters, marking you as a powerful Earl.",
            category: "main",
            tier: 4,
            landRequirement: {
                type: "settlement",
                amount: 6
            },
            constructionCost: {
                wood: 2500,
                stone: 3500,
                metal: 500
            },
            constructionTime: 30,
            workerCapacity: 0,
            workersRequired: 12,
            maintenanceCost: {
                wood: 5,
                food: 18,
                metal: 2
            },
            maxCount: 1,
            upgradesTo: "konungs_stronghold",
            unlockRequirements: {
                rank: 15
            },
            effects: {
                housingCapacity: 0,
                warriorCapacity: 200,
                fame: 8
            }
        },
        
        KONUNGS_STRONGHOLD: {
            id: "konungs_stronghold",
            name: "Konung's Stronghold",
            description: "A massive fortress worthy of a king, with impressive defensive works and royal accommodations.",
            category: "main",
            tier: 5,
            landRequirement: {
                type: "settlement",
                amount: 8
            },
            constructionCost: {
                wood: 4000,
                stone: 6000,
                metal: 1200
            },
            constructionTime: 40,
            workerCapacity: 0,
            workersRequired: 15,
            maintenanceCost: {
                wood: 8,
                food: 25,
                metal: 3
            },
            maxCount: 1,
            upgradesTo: "high_kings_capital",
            unlockRequirements: {
                rank: 17
            },
            effects: {
                housingCapacity: 0,
                warriorCapacity: 500,
                fame: 12
            }
        },
        
        HIGH_KINGS_CAPITAL: {
            id: "high_kings_capital",
            name: "High King's Capital",
            description: "The ultimate seat of power, a legendary stronghold that dominates the landscape and commands respect from all.",
            category: "main",
            tier: 6,
            landRequirement: {
                type: "settlement",
                amount: 10
            },
            constructionCost: {
                wood: 8000,
                stone: 10000,
                metal: 2000
            },
            constructionTime: 60,
            workerCapacity: 0,
            workersRequired: 20,
            maintenanceCost: {
                wood: 12,
                food: 35,
                metal: 5
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 19
            },
            effects: {
                housingCapacity: 0,
                warriorCapacity: 800,
                fame: 20
            }
        },
        
        // ===== TIER 1 BUILDINGS =====
        
        HOUSE: {
            id: "house",
            name: "House",
            description: "A simple dwelling for your people.",
            category: "housing",
            tier: 1,
            landRequirement: {
                type: "settlement",
                amount: .1
            },
            constructionCost: {
                wood: 20,
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
        
        WOODCUTTER_LODGE: {
            id: "woodcutter_lodge",
            name: "Woodcutter's Lodge",
            description: "Increases wood production from woodland areas.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "woodland",
                amount: 3
            },
            constructionCost: {
                wood: 20,
            },
            constructionTime: 5,
            workerCapacity: 13, // Employs 13 woodcutters
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
        
        FARM: {
            id: "farm",
            name: "Farm",
            description: "Produces food from farmland.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "farmland",
                amount: 3
            },
            constructionCost: {
                wood: 15,
            },
            constructionTime: 7,
            workerCapacity: 13, // Employs 13 farmers
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
                    food: 10 // Base food production per farmer-day
                }
            }
        },
        
        HUNTING_LODGE: {
            id: "hunting_lodge",
            name: "Hunting Lodge",
            description: "Gathers food from wilderness and forests.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "wilderness",
                amount: 3
            },
            constructionCost: {
                wood: 20,
            },
            constructionTime: 6,
            workerCapacity: 4, // Employs 4 hunters
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
        
        FISHING_HUT: {
            id: "fishing_hut",
            name: "Fishing Hut",
            description: "Gathers food from coastal waters.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "coastal",
                amount: 2
            },
            constructionCost: {
                wood: 15,
            },
            constructionTime: 5,
            workerCapacity: 2, // Employs 2 fishermen
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
        
        STOREHOUSE: {
            id: "storehouse",
            name: "Storehouse",
            description: "Increases your resource storage capacity.",
            category: "infrastructure",
            tier: 1,
            landRequirement: {
                type: "settlement",
                amount: 1
            },
            constructionCost: {
                wood: 130,
            },
            constructionTime: 16,
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

        MINE: {
            id: "mine",
            name: "Mine",
            description: "Extracts metal ore from deep in the earth.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "mining",
                amount: 3
            },
            constructionCost: {
                wood: 300,
            },
            constructionTime: 30,
            workerCapacity: 30, // Employs 30 miners
            workersRequired: 12,
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

        QUARRY: {
            id: "quarry",
            name: "Quarry",
            description: "Extracts stone from rocky areas.",
            category: "production",
            tier: 1,
            landRequirement: {
                type: "mining",
                amount: 2
            },
            constructionCost: {
                wood: 500,
            },
            constructionTime: 40,
            workerCapacity: 30, // Employs 30 miners
            workersRequired: 12,
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
        
        // ===== TIER 2 BUILDINGS =====
        
        LONGHOUSE: {
            id: "longhouse",
            name: "Longhouse",
            description: "A larger dwelling that houses more people and serves as a community center.",
            category: "housing",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 150,
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
        
        MEAD_HALL: {
            id: "mead_hall",
            name: "Mead Hall",
            description: "A grand hall for feasting and celebrating, increasing fame and happiness.",
            category: "infrastructure",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 3
            },
            constructionCost: {
                wood: 500,
                metal: 50
            },
            constructionTime: 12,
            workerCapacity: 2, // Employs 2 workers
            workersRequired: 4,
            maintenanceCost: {
                food: 5,
                wood: 1
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 5,
                tier: 2
            },
            effects: {
                fame: 3,
                happiness: 10
            }
        },
        
        MARKETPLACE: {
            id: "marketplace",
            name: "Marketplace",
            description: "Enables trading and increases settlement prosperity.",
            category: "infrastructure",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 300,
                metal: 50
            },
            constructionTime: 10,
            workerCapacity: 3, // Employs 3 workers
            workersRequired: 4,
            maintenanceCost: {},
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 5,
                tier: 2
            },
            effects: {
                fame: 2,
                tradingEnabled: true
            }
        },
        
        SMITHY: {
            id: "smithy",
            name: "Smithy",
            description: "Processes metal into tools and weapons.",
            category: "production",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 1
            },
            constructionCost: {
                wood: 125,
                metal: 50
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
            unlockRequirements: {
                rank: 4,
                tier: 2
            },
            effects: {
                resourceProduction: {
                    metal: 1
                },
                resourceModifier: {
                    metal: 1.5 // Increases metal production
                }
            }
        },
        
        WARRIOR_LODGE: {
            id: "warrior_lodge",
            name: "Warrior Lodge",
            description: "A dedicated building for housing and training warriors.",
            category: "military",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 250,
                metal: 50
            },
            constructionTime: 12,
            workerCapacity: 0, // Doesn't provide regular jobs
            workersRequired: 3,
            maintenanceCost: {
                wood: 2,
                metal: 1
            },
            maxCount: 3,
            upgradesTo: null,
            unlockRequirements: {
                rank: 5,
                tier: 2
            },
            effects: {
                warriorCapacity: 15, // Extra warrior housing
                warriorTrainingSpeed: 1.2 // 20% faster warrior training
            }
        },
        
        PALISADE: {
            id: "palisade",
            name: "Palisade",
            description: "Wooden defensive walls that provide basic protection for your settlement.",
            category: "military",
            tier: 2,
            landRequirement: {
                type: "settlement",
                amount: 4 // Covers the perimeter
            },
            constructionCost: {
                wood: 400,
            },
            constructionTime: 15,
            workerCapacity: 0,
            workersRequired: 5,
            maintenanceCost: {
                wood: 3
            },
            maxCount: 1,
            upgradesTo: "stone_walls",
            unlockRequirements: {
                rank: 5,
                tier: 2
            },
            effects: {
                defenseBonus: 1.3, // 30% defense bonus
                fame: 2
            }
        },
        
        // ===== TIER 3 BUILDINGS =====
        
        
        
        SHIPYARD: {
            id: "shipyard",
            name: "Shipyard",
            description: "Allows construction and maintenance of ships for trade and raiding.",
            category: "infrastructure",
            tier: 3,
            landRequirement: {
                type: "coastal",
                amount: 3
            },
            constructionCost: {
                wood: 500,
                stone: 200,
                metal: 100
            },
            constructionTime: 20,
            workerCapacity: 5,
            workersRequired: 6,
            maintenanceCost: {
                wood: 3,
                metal: 1
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 9,
                tier: 3
            },
            specialRequirements: function(gameState) {
                // Check if player's region is coastal
                const playerRegion = WorldMap.getPlayerRegion();
                return playerRegion && playerRegion.type === "COASTAL";
            },
            effects: {
                shipBuildingEnabled: true,
                fame: 3
            }
        },
        
        // ===== TIER 4+ BUILDINGS =====
        
        FORGE: {
            id: "forge",
            name: "Forge",
            description: "An advanced smithy with better metal processing.",
            category: "production",
            tier: 4,
            landRequirement: {
                type: "settlement",
                amount: 2
            },
            constructionCost: {
                wood: 240,
                stone: 230,
                metal: 150
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
                rank: 12,
                tier: 4,
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
        
        STONE_WALLS: {
            id: "stone_walls",
            name: "Stone Walls",
            description: "Sturdy stone walls providing significant protection for your settlement.",
            category: "military",
            tier: 4,
            landRequirement: {
                type: "settlement",
                amount: 5
            },
            constructionCost: {
                stone: 1000,
                wood: 200,
                metal: 100
            },
            constructionTime: 30,
            workerCapacity: 0,
            workersRequired: 8,
            maintenanceCost: {
                stone: 2
            },
            maxCount: 1,
            upgradesTo: "bulwarks",
            unlockRequirements: {
                rank: 12,
                tier: 4,
                buildings: {
                    palisade: 1
                }
            },
            effects: {
                defenseBonus: 1.8, // 80% defense bonus
                fame: 5
            }
        },
        
        GREAT_HALL: {
            id: "great_hall",
            name: "Great Hall",
            description: "An impressive hall for diplomatic meetings, celebrations, and showcasing your wealth.",
            category: "infrastructure",
            tier: 4,
            landRequirement: {
                type: "settlement",
                amount: 4
            },
            constructionCost: {
                wood: 1000,
                stone: 800,
                metal: 200
            },
            constructionTime: 25,
            workerCapacity: 3,
            workersRequired: 8,
            maintenanceCost: {
                wood: 3,
                food: 10
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 13,
                tier: 4,
                buildings: {
                    mead_hall: 1
                }
            },
            effects: {
                fame: 8,
                happiness: 15,
                diplomaticBonus: 1.4
            }
        },
        
        LARGE_FARM: {
            id: "large_farm",
            name: "Large Farm",
            description: "An expanded farm with higher yields.",
            category: "production",
            tier: 4,
            landRequirement: {
                type: "farmland",
                amount: 5
            },
            constructionCost: {
                wood: 130,
                stone: 115
            },
            constructionTime: 12,
            workerCapacity: 5, // Employs 5 farmers
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
                rank: 12,
                tier: 4
            },
            effects: {
                resourceProduction: {
                    food: 15
                }
            }
        },
        
        SAWMILL: {
            id: "sawmill",
            name: "Sawmill",
            description: "An advanced wood processing facility.",
            category: "production",
            tier: 4,
            landRequirement: {
                type: "woodland",
                amount: 4
            },
            constructionCost: {
                wood: 400,
                stone: 200,
                metal: 100
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
                rank: 11,
                tier: 4,
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
        
        // ===== TIER 5 BUILDINGS =====
        
        BULWARKS: {
            id: "bulwarks",
            name: "Fortified Bulwarks",
            description: "Formidable defensive structures that make your settlement nearly impenetrable.",
            category: "military",
            tier: 5,
            landRequirement: {
                type: "settlement",
                amount: 6
            },
            constructionCost: {
                stone: 3000,
                wood: 500,
                metal: 500
            },
            constructionTime: 40,
            workerCapacity: 0,
            workersRequired: 12,
            maintenanceCost: {
                stone: 4,
                metal: 2
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 16,
                tier: 5,
                buildings: {
                    stone_walls: 1
                }
            },
            effects: {
                defenseBonus: 2.5, // 150% defense bonus
                fame: 10
            }
        },
        
        GRAND_TEMPLE: {
            id: "grand_temple",
            name: "Grand Temple",
            description: "A magnificent temple dedicated to the gods, drawing pilgrims and increasing your divine favor.",
            category: "infrastructure",
            tier: 5,
            landRequirement: {
                type: "settlement",
                amount: 4
            },
            constructionCost: {
                stone: 2500,
                wood: 1000,
                metal: 300
            },
            constructionTime: 35,
            workerCapacity: 4,
            workersRequired: 10,
            maintenanceCost: {
                wood: 4,
                food: 8
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 16,
                tier: 5
            },
            effects: {
                fame: 12,
                happiness: 20,
                divineBonus: 1.5 // Divine favor for events
            }
        },
        
        NAVAL_YARD: {
            id: "naval_yard",
            name: "Naval Yard",
            description: "An advanced shipbuilding facility capable of constructing large warships and trade vessels.",
            category: "military",
            tier: 5,
            landRequirement: {
                type: "coastal",
                amount: 5
            },
            constructionCost: {
                wood: 2000,
                stone: 1000,
                metal: 500
            },
            constructionTime: 40,
            workerCapacity: 8,
            workersRequired: 12,
            maintenanceCost: {
                wood: 6,
                metal: 3
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 16,
                tier: 5,
                buildings: {
                    shipyard: 1
                }
            },
            specialRequirements: function(gameState) {
                // Check if player's region is coastal
                const playerRegion = WorldMap.getPlayerRegion();
                return playerRegion && playerRegion.type === "COASTAL";
            },
            effects: {
                advancedShipBuildingEnabled: true,
                fame: 8
            }
        },
        
        // ===== TIER 6 BUILDINGS =====
        
        LEGENDARY_MEAD_HALL: {
            id: "legendary_mead_hall",
            name: "Legendary Mead Hall",
            description: "A hall of legends where great sagas are told, treaties are signed, and feasts of unsurpassed grandeur are held.",
            category: "infrastructure",
            tier: 6,
            landRequirement: {
                type: "settlement",
                amount: 6
            },
            constructionCost: {
                wood: 4000,
                stone: 3000,
                metal: 1000
            },
            constructionTime: 45,
            workerCapacity: 8,
            workersRequired: 15,
            maintenanceCost: {
                wood: 8,
                food: 20,
                metal: 2
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 18,
                tier: 6,
                buildings: {
                    great_hall: 1
                }
            },
            effects: {
                fame: 20,
                happiness: 25,
                diplomaticBonus: 2.0
            }
        },
        
        GRAND_MARKET: {
            id: "grand_market",
            name: "Grand Market",
            description: "A sprawling marketplace that draws merchants from distant lands, dramatically increasing trade opportunities.",
            category: "infrastructure",
            tier: 6,
            landRequirement: {
                type: "settlement",
                amount: 5
            },
            constructionCost: {
                wood: 3000,
                stone: 4000,
                metal: 1000
            },
            constructionTime: 40,
            workerCapacity: 10,
            workersRequired: 12,
            maintenanceCost: {
                wood: 5,
                food: 5,
                metal: 2
            },
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 18,
                tier: 6,
                buildings: {
                    marketplace: 1
                }
            },
            effects: {
                tradingIncome: 2.5, // 150% more trading income
                fame: 15
            }
        },
        
        RUNESTONE_MONUMENT: {
            id: "runestone_monument",
            name: "Runestone Monument",
            description: "A massive runestone monument commemorating your deeds and ensuring your legacy for generations.",
            category: "infrastructure",
            tier: 6,
            landRequirement: {
                type: "settlement",
                amount: 4
            },
            constructionCost: {
                stone: 5000,
                metal: 1000
            },
            constructionTime: 30,
            workerCapacity: 0,
            workersRequired: 10,
            maintenanceCost: {},
            maxCount: 1,
            upgradesTo: null,
            unlockRequirements: {
                rank: 19,
                tier: 6
            },
            effects: {
                fame: 30 // Massive fame bonus
            }
        }
    };
    
    // Track built and in-progress buildings
    let buildings = {
        built: {}, // id -> count of completed buildings by type
        construction: [] // Array of buildings currently under construction
    };
    
    // Track current settlement tier
    let currentTier = 1;
    
    // Track warrior count and details
    let warriors = {
        total: 0,
        training: [],
        capacity: 5, // Initial capacity from starter hall
        trainingTime: 10 // Base days to train a warrior
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
    
    // Warrior training template
    const warriorTrainingTemplate = {
        id: "",
        progress: 0,
        daysInTraining: 0,
        startDate: null,
        estimatedCompletion: null
    };
    
    // Private methods
    
    /**
     * Get the main building for the current tier
     * @returns {Object|null} The main building or null if not found
     */
    function getMainBuilding() {
        const mainBuildingTypeIds = [
            "karls_hall", 
            "chieftains_hall", 
            "jarls_keep", 
            "earls_citadel", 
            "konungs_stronghold", 
            "high_kings_capital"
        ];
        
        // Find the highest tier main building that's built
        for (let i = mainBuildingTypeIds.length - 1; i >= 0; i--) {
            if (buildings.built[mainBuildingTypeIds[i]]) {
                const buildingType = getBuildingTypeById(mainBuildingTypeIds[i]);
                return buildingType;
            }
        }
        
        // Default to Karl's Hall (should always exist)
        return getBuildingTypeById("karls_hall");
    }
    
    /**
     * Get a building type by its ID
     * @param {string} id - Building type ID
     * @returns {Object|null} - Building type object or null if not found
     */
    function getBuildingTypeById(id) {
        return Object.values(buildingTypes).find(type => type.id === id) || null;
    }
    
    /**
     * Update the current tier based on main buildings
     */
    function updateCurrentTier() {
        // Check main buildings from highest to lowest tier
        const tierBuildings = {
            6: "high_kings_capital",
            5: "konungs_stronghold",
            4: "earls_citadel",
            3: "jarls_keep",
            2: "chieftains_hall",
            1: "karls_hall"
        };
        
        for (let tier = 6; tier >= 1; tier--) {
            if (buildings.built[tierBuildings[tier]]) {
                if (currentTier !== tier) {
                    currentTier = tier;
                    Utils.log(`Your settlement has progressed to Tier ${tier}!`, "success");
                }
                return;
            }
        }
        
        // Default to tier 1
        currentTier = 1;
    }
    
    /**
     * Update warrior capacity based on buildings
     */
    function updateWarriorCapacity() {
        let capacity = 0;
        
        // Get capacity from main building
        const mainBuilding = getMainBuilding();
        if (mainBuilding && mainBuilding.effects.warriorCapacity) {
            capacity += mainBuilding.effects.warriorCapacity;
        }
        
        // Add capacity from warrior lodges
        const warriorLodgeCount = buildings.built.warrior_lodge || 0;
        const warriorLodgeType = getBuildingTypeById("warrior_lodge");
        if (warriorLodgeType && warriorLodgeType.effects.warriorCapacity) {
            capacity += warriorLodgeCount * warriorLodgeType.effects.warriorCapacity;
        }
        
        // Update capacity
        warriors.capacity = capacity;
    }
    
    /**
     * Check if a building type can be constructed
     * @param {string} buildingType - Type of building to check
     * @param {Object} gameState - Current game state
     * @returns {Object} - Result with success flag and reason
     */
    function canBuildType(buildingType, gameState) {
        const building = getBuildingTypeById(buildingType);
        if (!building) {
            return { success: false, reason: "Invalid building type" };
        }
        
        // Check tier requirement
        if (building.tier > currentTier) {
            return { 
                success: false, 
                reason: `Requires Tier ${building.tier} (current: Tier ${currentTier})` 
            };
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
                        reason: `Requires ${required} ${getBuildingTypeById(reqBuilding).name}` 
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
        
        // Check available workers for construction
        const population = PopulationManager.getPopulation();
        const unassignedWorkers = PopulationManager.getUnassignedWorkers();
        
        // Calculate workers already assigned to construction
        const workersInConstruction = buildings.construction.reduce(
            (total, project) => total + project.workersAssigned, 0
        );
        
        if (unassignedWorkers - workersInConstruction < building.workersRequired) {
            return { 
                success: false, 
                reason: `Not enough unassigned workers for construction (need ${building.workersRequired})` 
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
        const building = getBuildingTypeById(buildingType);
        if (!building) {
            return { success: false, reason: "Invalid building type" };
        }
        
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
            const building = getBuildingTypeById(project.type);
            
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
                
                // Special case for main buildings (tier upgrades)
                if (building.category === "main") {
                    // For main buildings, we replace the previous main building
                    updateCurrentTier();
                }
                
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
     * Process warrior training
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of game tick in days
     */
    function processWarriorTraining(gameState, tickSize) {
        // Process each warrior in training
        for (let i = warriors.training.length - 1; i >= 0; i--) {
            const trainee = warriors.training[i];
            
            // Apply progress
            trainee.daysInTraining += tickSize;
            trainee.progress = (trainee.daysInTraining / warriors.trainingTime) * 100;
            
            // Check if training is complete
            if (trainee.progress >= 100 || trainee.daysInTraining >= warriors.trainingTime) {
                // Add warrior
                warriors.total++;
                
                // Log completion
                Utils.log("A new warrior has completed training and joined your forces!", "success");
                
                // Remove from training
                warriors.training.splice(i, 1);
            }
        }
    }
    
    /**
     * Process warrior upkeep
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of game tick in days
     */
    function processWarriorUpkeep(gameState, tickSize) {
        if (warriors.total <= 0) return;
        
        // Daily food consumption
        const foodPerDay = warriors.total * 1; // 1 food per warrior per day
        const foodConsumed = foodPerDay * tickSize;
        
        // Monthly wood and metal consumption
        if (gameState.date.dayOfMonth === 1) {
            const woodPerMonth = warriors.total * 0.05;
            const metalPerMonth = warriors.total * 0.05;
            
            // Try to pay upkeep
            const upkeepPaid = ResourceManager.subtractResources({
                wood: woodPerMonth,
                metal: metalPerMonth
            });
            
            if (!upkeepPaid) {
                // Not enough resources for maintenance
                Utils.log("Warning: Not enough resources for warrior maintenance. Morale is dropping.", "danger");
                // TODO: Add morale penalties or warrior desertion
            }
        }
        
        // Try to pay food costs
        const foodPaid = ResourceManager.subtractResources({
            food: foodConsumed
        });
        
        if (!foodPaid) {
            // Not enough food for warriors
            Utils.log("Warning: Not enough food to feed your warriors. Some may desert if this continues.", "danger");
            // TODO: Add desertion mechanics
            
            // Calculate starvation deaths
            const resources = ResourceManager.getResources();
            if (resources.food <= 0 && warriors.total > 0 && Utils.chanceOf(10 * tickSize)) {
                const deserters = Math.ceil(warriors.total * 0.05); // 5% desert
                warriors.total = Math.max(0, warriors.total - deserters);
                Utils.log(`${deserters} warriors have deserted due to lack of food!`, "danger");
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
        
        // Apply warrior capacity effects
        if (building.effects.warriorCapacity) {
            updateWarriorCapacity();
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
            const building = getBuildingTypeById(buildingId);
            
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
     * Update resource production based on buildings and assigned workers
     * @param {Object} gameState - Current game state
     */
    function updateResourceProduction(gameState) {
        // Reset base production (from buildings, not including workers)
        const baseProduction = {
            food: 0,
            wood: 0,
            stone: 0,
            metal: 0
        };
        
        // Update production rates in ResourceManager if available
        if (ResourceManager && typeof ResourceManager.updateBaseProductionRates === 'function') {
            // Apply base production from buildings to ResourceManager
            ResourceManager.updateBaseProductionRates(baseProduction);
            
            // Force an update of production rates with current workers
            const workerAssignments = PopulationManager.getWorkerAssignments();
            ResourceManager.updateProductionRates(workerAssignments);
        }
    }
    
    /**
 * Start training warriors
 * @param {Object} gameState - Current game state
 * @param {number} count - Number of warriors to train
 * @returns {Object} - Result with success flag and reason
 */
function startWarriorTraining(gameState, count = 1) {
    // Validate count
    count = Math.max(1, Math.min(20, count));
    
    // Check if we've reached capacity
    const totalWarriors = warriors.total + warriors.training.length;
    const remainingCapacity = warriors.capacity - totalWarriors;
    
    if (remainingCapacity <= 0) {
        return { 
            success: false, 
            reason: `Maximum warrior capacity reached (${warriors.capacity})` 
        };
    }
    
    // Limit count to available capacity
    count = Math.min(count, remainingCapacity);
    
    // Check resource cost for training
    const trainingCost = {
        food: 20 * count,
        metal: 5 * count,
        wood: 5 * count
    };
    
    // Check if we can afford it
    const canAfford = ResourceManager.subtractResources(trainingCost);
    if (!canAfford) {
        return { 
            success: false, 
            reason: "Not enough resources for warrior training" 
        };
    }
    
    // Apply training speed bonuses
    let trainingTime = warriors.trainingTime;
    const warriorLodgeCount = buildings.built.warrior_lodge || 0;
    if (warriorLodgeCount > 0) {
        const warriorLodgeType = getBuildingTypeById("warrior_lodge");
        if (warriorLodgeType && warriorLodgeType.effects.warriorTrainingSpeed) {
            trainingTime = Math.ceil(trainingTime / warriorLodgeType.effects.warriorTrainingSpeed);
        }
    }
    
    // Create training entries for each warrior
    for (let i = 0; i < count; i++) {
        // Create training entry
        const training = Object.assign({}, warriorTrainingTemplate, {
            id: `warrior_${Date.now()}_${Math.floor(Math.random() * 1000)}_${i}`,
            progress: 0,
            daysInTraining: 0,
            startDate: { ...gameState.date },
            estimatedCompletion: {
                ...gameState.date,
                day: gameState.date.day + trainingTime
            }
        });
        
        // Add to training list
        warriors.training.push(training);
    }
    
    // Log start of training
    if (count === 1) {
        Utils.log(`Warrior training has begun. Estimated completion in ${trainingTime} days.`, "success");
    } else {
        Utils.log(`Training ${count} warriors has begun. Estimated completion in ${trainingTime} days.`, "success");
    }
    
    return { success: true, count: count };
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
    
    <div class="settlement-tier">
        <div class="tier-header">
            <h3>Settlement Tier: <span id="settlement-tier">${currentTier}</span></h3>
            <div class="main-building">
                <span id="main-building-name">Karl's Hall</span>
            </div>
        </div>
        <div class="tier-info" id="tier-info">
            <p>Upgrade your main building to advance to the next tier and unlock new buildings.</p>
        </div>
    </div>
    
    <div class="warrior-management">
        <h3>Warrior Management</h3>
        <div class="warrior-stats">
            <div class="warrior-count">
                <span class="label">Warriors:</span>
                <span id="warrior-count">${warriors.total}</span>
                <span class="separator">/</span>
                <span id="warrior-capacity">${warriors.capacity}</span>
            </div>
            <div class="warrior-training">
                <span class="label">In Training:</span>
                <span id="warriors-training">${warriors.training.length}</span>
            </div>
            <div class="warrior-upkeep">
                <span class="label">Daily Upkeep:</span>
                <span id="warrior-upkeep-food">${warriors.total}</span> food
            </div>
            <div class="warrior-upkeep">
                <span class="label">Monthly Upkeep:</span>
                <span id="warrior-upkeep-wood">${(warriors.total * 0.05).toFixed(1)}</span> wood,
                <span id="warrior-upkeep-metal">${(warriors.total * 0.05).toFixed(1)}</span> metal
            </div>
        </div>
        
        <div class="warrior-training-controls">
            <div class="train-slider-container">
                <div class="slider-header">
                    <span class="train-label">Train Warriors:</span>
                    <span id="train-warriors-count">1</span>
                </div>
                <input type="range" id="train-warriors-slider" min="1" max="5" value="1" class="warrior-slider">
                <div class="train-cost">
                    <span class="cost-label">Cost:</span>
                    <span id="train-cost-food">20</span> food,
                    <span id="train-cost-wood">5</span> wood,
                    <span id="train-cost-metal">5</span> metal
                </div>
            </div>
            <button id="train-warrior-btn" class="control-btn">Train Warriors</button>
        </div>
    </div>
    
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
                    <button class="category-button" data-category="main">Main</button>
                    <button class="category-button" data-category="housing">Housing</button>
                    <button class="category-button" data-category="production">Production</button>
                    <button class="category-button" data-category="infrastructure">Infrastructure</button>
                    <button class="category-button" data-category="military">Military</button>
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
            
                    // Update train warrior button to use slider value
        const trainWarriorBtn = document.getElementById('train-warrior-btn');
        if (trainWarriorBtn) {
            trainWarriorBtn.addEventListener('click', function() {
                const slider = document.getElementById('train-warriors-slider');
                const count = slider ? parseInt(slider.value) : 1;
                
                const result = startWarriorTraining(GameEngine.getGameState(), count);
                if (!result.success) {
                    Utils.log(result.reason, "important");
                }
                updateBuildingUI();
            });
        }

                    // Setup train warrior slider
        const trainWarriorSlider = document.getElementById('train-warriors-slider');
        if (trainWarriorSlider) {
            trainWarriorSlider.addEventListener('input', function() {
                const count = parseInt(this.value);
                // Update displayed count
                const countDisplay = document.getElementById('train-warriors-count');
                if (countDisplay) countDisplay.textContent = count;
                
                // Update costs
                const foodCost = document.getElementById('train-cost-food');
                const woodCost = document.getElementById('train-cost-wood');
                const metalCost = document.getElementById('train-cost-metal');
                
                if (foodCost) foodCost.textContent = (20 * count);
                if (woodCost) woodCost.textContent = (5 * count);
                if (metalCost) metalCost.textContent = (5 * count);
            });
        }
            
            // Initial update of UI
            updateBuildingUI();

            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('building-panel', 'buildings');
            }
            
            // Add CSS for new elements
            addBuildingSystemStyles();
        }
    }
    
    /**
     * Add CSS styles for the building system
     */
    function addBuildingSystemStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Settlement Tier */
            .settlement-tier {
                background-color: #f7f0e3;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #8b5d33;
            }
            
            .tier-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .tier-header h3 {
                margin: 0;
                color: #5d4037;
            }
            
            .main-building {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .tier-info {
                font-size: 0.9rem;
                color: #5d4037;
                font-style: italic;
            }
            
            /* Warrior Management */
            .warrior-management {
                background-color: #f7f0e3;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #a52a2a; /* Brown-red for warriors */
            }
            
            .warrior-management h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #5d4037;
            }
            
            .warrior-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .warrior-count, .warrior-training, .warrior-upkeep {
                background-color: #ffffff;
                padding: 8px 12px;
                border-radius: 4px;
            }
            
            .warrior-count .label, .warrior-training .label, .warrior-upkeep .label {
                font-weight: 500;
                margin-right: 5px;
                color: #5d4037;
            }
            
            .warrior-count .separator {
                margin: 0 5px;
                color: #8b7355;
            }
            
            .warrior-controls {
                display: flex;
                gap: 10px;
            }
            
            .control-btn {
                padding: 8px 15px;
                background: linear-gradient(to bottom, #a52a2a, #8b0000);
                color: #ffffff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.3s;
            }
            
            .control-btn:hover {
                background: linear-gradient(to bottom, #c53b3b, #a52a2a);
                transform: translateY(-1px);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
            }
            
            /* Modify existing styles */
            .building-panel {
                padding-bottom: 30px;
            }
            
            .building-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 15px;
            }
            
            .category-button {
                padding: 5px 10px;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                cursor: pointer;
                border-radius: 3px;
                transition: all 0.2s;
            }
            
            .category-button:hover {
                background-color: #c9ba9b;
            }
            
            .category-button.active {
                background-color: #8b5d33;
                color: #fff;
                border: 1px solid #5d4037;
            }
            
            /* Building tier badges */
            .tier-badge {
                display: inline-block;
                padding: 2px 6px;
                background-color: #8b5d33;
                color: #ffffff;
                border-radius: 3px;
                font-size: 0.8rem;
                margin-left: 8px;
                vertical-align: middle;
            }
            
            /* Building in training section */
            .training-item {
                background-color: #f7f0e3;
                padding: 12px 15px;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid #a52a2a;
            }
            
            .training-progress {
                margin-top: 8px;
            }
            
            .progress-bar-container {
                height: 8px;
                background-color: #d7cbb9;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(to right, #a52a2a, #c53b3b);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .estimated-completion {
                font-size: 0.85rem;
                color: #8b7355;
                margin-top: 5px;
            }

            .warrior-training-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
}

.train-slider-container {
    background-color: #f5ebdc;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #d9c8b4;
}

.slider-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.train-label {
    font-weight: 500;
    color: #5d4037;
}

#train-warriors-count {
    font-weight: 600;
    color: #a52a2a;
}

.warrior-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: #d7cbb9;
    border-radius: 4px;
    outline: none;
    margin: 10px 0;
}

.warrior-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #a52a2a;
    cursor: pointer;
    transition: background 0.2s;
}

.warrior-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #a52a2a;
    cursor: pointer;
    transition: background 0.2s;
}

.warrior-slider::-webkit-slider-thumb:hover {
    background: #c53b3b;
}

.train-cost {
    font-size: 0.9rem;
    color: #5d4037;
    margin-top: 8px;
}

.cost-label {
    font-weight: 500;
    margin-right: 5px;
}

.control-btn {
    margin-top: 5px;
}
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Update the building UI to reflect current state
     */
    function updateBuildingUI() {
        updateTierInfo();
        updateWarriorManagementUI();
        updateBuiltBuildingsList();
        updateConstructionList();
        updateAvailableBuildingsList('all');
    }
    
    /**
     * Update tier information in the UI
     */
    function updateTierInfo() {
        // Update tier display
        Utils.updateElement('settlement-tier', currentTier);
        
        // Update main building name
        const mainBuilding = getMainBuilding();
        if (mainBuilding) {
            Utils.updateElement('main-building-name', mainBuilding.name);
        }
        
        // Update tier info
        const tierInfoElement = document.getElementById('tier-info');
        if (!tierInfoElement) return;
        
        // Check if there's a next tier
        if (currentTier < 6) {
            // Get next main building
            let nextTierBuilding = null;
            const tierBuildingIds = [
                "karls_hall", "chieftains_hall", "jarls_keep", 
                "earls_citadel", "konungs_stronghold", "high_kings_capital"
            ];
            
            if (currentTier < tierBuildingIds.length) {
                nextTierBuilding = getBuildingTypeById(tierBuildingIds[currentTier]);
            }
            
            if (nextTierBuilding) {
                // Check if we meet the requirements
                const canBuild = canBuildType(nextTierBuilding.id, GameEngine.getGameState());
                
                if (canBuild.success) {
                    tierInfoElement.innerHTML = `
                        <p>You can now upgrade to <strong>${nextTierBuilding.name}</strong> to advance to Tier ${currentTier + 1}.</p>
                    `;
                } else {
                    tierInfoElement.innerHTML = `
                        <p>To advance to Tier ${currentTier + 1}, you need to build <strong>${nextTierBuilding.name}</strong>.</p>
                        <p><em>Requirements: ${canBuild.reason}</em></p>
                    `;
                }
            } else {
                tierInfoElement.innerHTML = `
                    <p>You are currently at Tier ${currentTier}.</p>
                `;
            }
        } else {
            tierInfoElement.innerHTML = `
                <p>You have reached the maximum settlement tier!</p>
            `;
        }
    }
    
    /**
 * Update warrior management UI
 */
function updateWarriorManagementUI() {
    // Update warrior counts
    Utils.updateElement('warrior-count', warriors.total);
    Utils.updateElement('warrior-capacity', warriors.capacity);
    Utils.updateElement('warriors-training', warriors.training.length);
    
    // Update upkeep display
    Utils.updateElement('warrior-upkeep-food', warriors.total);
    Utils.updateElement('warrior-upkeep-wood', (warriors.total * 0.05).toFixed(1));
    Utils.updateElement('warrior-upkeep-metal', (warriors.total * 0.05).toFixed(1));
    
    // Enable/disable train button based on capacity
    const trainButton = document.getElementById('train-warrior-btn');
    const trainSlider = document.getElementById('train-warriors-slider');
    
    // Calculate remaining capacity
    const remainingCapacity = warriors.capacity - (warriors.total + warriors.training.length);
    
    if (trainButton) {
        const atCapacity = remainingCapacity <= 0;
        trainButton.disabled = atCapacity;
        
        if (atCapacity) {
            trainButton.title = "Maximum warrior capacity reached";
        } else {
            trainButton.title = "Train new warriors";
        }
    }
    
    // Update slider maximum based on available capacity and resources
    if (trainSlider) {
        // Get the maximum warriors we can afford
        const resources = ResourceManager.getResources();
        const maxByFood = Math.floor(resources.food / 20);
        const maxByWood = Math.floor(resources.wood / 5);
        const maxByMetal = Math.floor(resources.metal / 5);
        
        // Take the minimum of capacity and resources
        const maxTrainable = Math.min(
            remainingCapacity,
            maxByFood,
            maxByWood, 
            maxByMetal,
            20 // Hard cap at 20 for practical reasons
        );
        
        // Set slider max and ensure value doesn't exceed max
        trainSlider.max = Math.max(1, maxTrainable);
        trainSlider.value = Math.min(parseInt(trainSlider.value), maxTrainable);
        
        // Update displayed count and costs
        const countDisplay = document.getElementById('train-warriors-count');
        if (countDisplay) countDisplay.textContent = trainSlider.value;
        
        const foodCost = document.getElementById('train-cost-food');
        const woodCost = document.getElementById('train-cost-wood');
        const metalCost = document.getElementById('train-cost-metal');
        
        if (foodCost) foodCost.textContent = (20 * trainSlider.value);
        if (woodCost) woodCost.textContent = (5 * trainSlider.value);
        if (metalCost) metalCost.textContent = (5 * trainSlider.value);
    }
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
        
        // Group buildings by category
        const categorizedBuildings = {
            main: [],
            housing: [],
            production: [],
            infrastructure: [],
            military: []
        };
        
        // Group buildings by category
        for (const buildingId in buildings.built) {
            const count = buildings.built[buildingId];
            const building = getBuildingTypeById(buildingId);
            
            if (!building) continue;
            
            const category = building.category || 'infrastructure';
            
            categorizedBuildings[category].push({
                id: buildingId,
                name: building.name,
                count: count,
                tier: building.tier,
                effects: building.effects
            });
        }
        
        // Create section for each category
        for (const category in categorizedBuildings) {
            if (categorizedBuildings[category].length === 0) continue;
            
            let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            html += `<div class="building-category">
                <h4>${categoryName} Buildings</h4>
                <div class="category-buildings">`;
            
            // Sort buildings by tier
            categorizedBuildings[category].sort((a, b) => a.tier - b.tier);
            
            // Add each building
            categorizedBuildings[category].forEach(building => {
                html += `
                    <div class="building-item">
                        <div class="building-info">
                            <span class="building-name">${building.name}</span>
                            <span class="building-count">x${building.count}</span>
                            <span class="tier-badge">Tier ${building.tier}</span>
                        </div>
                        <div class="building-effects">
                            ${formatBuildingEffects(building)}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        listElement.innerHTML = html;
    }
    
    /**
     * Update the list of construction projects
     */
    function updateConstructionList() {
        const listElement = document.getElementById('construction-list');
        if (!listElement) return;
        
        let html = '';
        
        // Add warrior training if any
        if (warriors.training.length > 0) {
            html += `<h4>Warriors in Training</h4>`;
            
            warriors.training.forEach(trainee => {
                html += `
                    <div class="training-item">
                        <div class="training-header">
                            <span class="training-name">Warrior Training</span>
                        </div>
                        <div class="training-progress">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${trainee.progress.toFixed(1)}%"></div>
                            </div>
                            <div class="estimated-completion">
                                Est. completion: Day ${trainee.estimatedCompletion.day}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Check if there are any construction projects
        if (buildings.construction.length === 0) {
            if (html === '') {
                html = '<p>No active construction projects.</p>';
            }
            listElement.innerHTML = html;
            return;
        }
        
        // Add buildings in construction
        html += `<h4>Buildings in Construction</h4>`;
        
        buildings.construction.forEach(project => {
            const building = getBuildingTypeById(project.type);
            
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
                
                // Always include buildings from current tier or lower
                return building.tier <= currentTier;
            })
            .sort((a, b) => {
                // Sort by whether they can be built
                const canBuildA = canBuildType(a.id, gameState).success;
                const canBuildB = canBuildType(b.id, gameState).success;
                
                if (canBuildA && !canBuildB) return -1;
                if (!canBuildA && canBuildB) return 1;
                
                // Then by tier
                if (a.tier !== b.tier) return a.tier - b.tier;
                
                // Then by category
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                
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
                        <span class="tier-badge">Tier ${building.tier}</span>
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
                            <span class="capacity-label">Provides jobs for:</span>
                            <span class="capacity-value">${building.workerCapacity} workers</span>
                        </div>
                    </div>` : ''}
                    ${building.effects.warriorCapacity ? 
                    `<div class="building-warrior-info">
                        <div class="warrior-capacity">
                            <span class="capacity-label">Warrior capacity:</span>
                            <span class="capacity-value">+${building.effects.warriorCapacity}</span>
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
        
        // Warrior capacity
        if (building.effects.warriorCapacity) {
            html += `<li>Warriors: +${building.effects.warriorCapacity} capacity</li>`;
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
        
        // Defense bonus
        if (building.effects.defenseBonus) {
            const defensePercent = ((building.effects.defenseBonus - 1) * 100).toFixed(0);
            html += `<li>Defense: +${defensePercent}%</li>`;
        }
        
        // Other effects
        if (building.effects.shipBuildingEnabled) {
            html += `<li>Enables ship building</li>`;
        }
        
        if (building.effects.advancedShipBuildingEnabled) {
            html += `<li>Enables advanced ship building</li>`;
        }
        
        if (building.effects.tradingEnabled) {
            html += `<li>Enables trading</li>`;
        }
        
        if (building.effects.happiness) {
            html += `<li>Happiness: +${building.effects.happiness}</li>`;
        }
        
        if (building.effects.warriorTrainingSpeed) {
            const speedPercent = ((building.effects.warriorTrainingSpeed - 1) * 100).toFixed(0);
            html += `<li>Warrior training: +${speedPercent}% speed</li>`;
        }
        
        if (building.effects.diplomaticBonus) {
            const dipPercent = ((building.effects.diplomaticBonus - 1) * 100).toFixed(0);
            html += `<li>Diplomacy: +${dipPercent}%</li>`;
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
        
        const building = getBuildingTypeById(project.type);
        if (!building) return;
        
        // Check if we already have max workers
        if (project.workersAssigned >= building.workersRequired * 2) {
            Utils.log("Maximum workers already assigned to this project.", "important");
            return;
        }
        
        // Check if we have available workers
        const unassignedWorkers = PopulationManager.getUnassignedWorkers();
        if (unassignedWorkers <= 0) {
            Utils.log("No unassigned workers available to assign to construction. Assign workers in the Workers tab.", "important");
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
        
        const building = getBuildingTypeById(project.type);
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
     * Get the worker capacity for each job type based on built buildings
     * @returns {Object} - Object with worker capacities by type
     */
    function getAvailableCapacity() {
        const builtBuildings = buildings.built;
        const capacity = {
            farmers: 0,
            woodcutters: 0,
            miners: 0,
            hunters: 0,
            crafters: 0,
            gatherers: 0,
            thralls: 0,
            fishermen: 0
        };
        
        // Categorize buildings by worker type
        const buildingTypeMap = {
            farm: "farmers",
            large_farm: "farmers",
            woodcutter_lodge: "woodcutters",
            sawmill: "woodcutters",
            quarry: "miners",
            mine: "miners",
            smithy: "miners",
            forge: "miners",
            hunting_lodge: "hunters",
            fishing_hut: "fishermen"
        };
        
        // Calculate capacity for each building type
        for (const buildingId in builtBuildings) {
            const count = builtBuildings[buildingId];
            const building = getBuildingTypeById(buildingId);
            
            if (!building) continue;
            
            // Get worker type for this building
            const workerType = buildingTypeMap[buildingId];
            if (workerType && building.workerCapacity > 0) {
                capacity[workerType] += count * building.workerCapacity;
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
            console.log("Initializing Building System with Tier Progression...");
            
            // Set up initial data
            buildings = {
                built: {},
                construction: []
            };
            
            // Start with Karl's Hall (Tier 1)
            buildings.built.karls_hall = 1;
            
            // Add starter house
            buildings.built.house = 1;
            
            // Initialize current tier
            updateCurrentTier();
            
            // Initialize warrior capacity
            updateWarriorCapacity();
            
            // Create UI
            createBuildingUI();
            
            // Apply effects of starter buildings
            const starterHall = getBuildingTypeById("karls_hall");
            const starterHouse = getBuildingTypeById("house");
            
            applyBuildingEffects(starterHall);
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
            
            // Process warrior training
            processWarriorTraining(gameState, tickSize);
            
            // Process warrior upkeep
            processWarriorUpkeep(gameState, tickSize);
            
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
                tier: currentTier,
                warriors: {
                    total: warriors.total,
                    training: warriors.training.length,
                    capacity: warriors.capacity
                },
                available: Object.values(buildingTypes).map(type => ({
                    id: type.id,
                    name: type.name,
                    category: type.category,
                    tier: type.tier
                }))
            };
        },
        
        /**
         * Get information about a specific building type
         * @param {string} buildingId - ID of the building type
         * @returns {Object|null} - Building type definition or null if not found
         */
        getBuildingType: function(buildingId) {
            return getBuildingTypeById(buildingId);
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
        
        /**
         * Get current settlement tier
         * @returns {number} - Current tier
         */
        getCurrentTier: function() {
            return currentTier;
        },
        
        /**
         * Get warrior data
         * @returns {Object} - Warrior data
         */
        getWarriorData: function() {
            return { ...warriors };
        },
        
        /**
         * Train a new warrior
         * @returns {Object} - Result with success flag and reason
         */
        trainWarrior: function() {
            return startWarriorTraining(GameEngine.getGameState());
        },
        
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

