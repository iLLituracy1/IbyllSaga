/**
 * Viking Legacy - Trading System
 * Handles all aspects of trading with other settlements,
 * including pricing, negotiations, resource exchange, and trade routes
 */

const TradeManager = (function() {
    // Private variables
    
    // Active trade missions
    let activeTradeMissions = [];
    
    // Completed trade histories for statistics
    let tradeHistory = [];
    
    // Trade mission types
    const tradeMissionTypes = {
        LOCAL_TRADE: {
            id: "local_trade",
            name: "Local Trade",
            description: "A simple trade mission to a nearby settlement with low risk and modest profits.",
            minSize: 2,
            maxSize: 5,
            preparationTime: 1,
            travelSpeedModifier: 1.2,
            profitModifier: 0.8,
            riskModifier: 0.5,
            diplomaticGainModifier: 1.0,
            shipRequired: false
        },
        MERCHANT_CARAVAN: {
            id: "merchant_caravan",
            name: "Merchant Caravan",
            description: "A well-equipped trading caravan capable of handling larger volumes of goods.",
            minSize: 5,
            maxSize: 15,
            preparationTime: 3,
            travelSpeedModifier: 0.8,
            profitModifier: 1.0,
            riskModifier: 0.8,
            diplomaticGainModifier: 1.2,
            shipRequired: false
        },
        TRADE_EXPEDITION: {
            id: "trade_expedition",
            name: "Trade Expedition",
            description: "A major trading journey to distant settlements seeking rare and valuable goods.",
            minSize: 10,
            maxSize: 30,
            preparationTime: 5,
            travelSpeedModifier: 0.7,
            profitModifier: 1.5,
            riskModifier: 1.2,
            diplomaticGainModifier: 1.5,
            shipRequired: false
        },
        SEA_TRADE: {
            id: "sea_trade",
            name: "Sea Trade",
            description: "A maritime trading voyage capable of carrying large cargoes to distant coastal settlements.",
            minSize: 8,
            maxSize: 20,
            preparationTime: 3,
            travelSpeedModifier: 1.5,
            profitModifier: 1.3,
            riskModifier: 1.0,
            diplomaticGainModifier: 1.3,
            shipRequired: true
        }
    };
    
    // Trade mission template
    const tradeMissionTemplate = {
        id: "",
        name: "",
        missionType: "", // From tradeMissionTypes
        status: "preparing", // preparing, traveling, trading, returning, completed, failed
        targetSettlement: null, // ID of target settlement
        size: 0, // Number of traders
        escorts: 0, // Number of warrior escorts
        ships: 0, // Number of ships (for sea trade)
        leader: null, // Character leading the mission
        startDate: null, // Game date when mission started preparations
        departureDate: null, // When traders actually leave
        estimatedReturnDate: null, // Estimated return date
        daysRemaining: 0, // Days until next phase
        supplies: 0, // Food supplies
        goods: {}, // Outbound trade goods
        returns: {}, // Resources brought back from trade
        tradingPower: 0, // Calculated trading effectiveness
        profit: 0, // Calculated profit in silver value
        casualties: 0, // Traders or escorts lost
        diplomaticGain: 0, // Relationship improvement with target
        events: [] // Log of events that occurred during the mission
    };
    
    // Base trade prices and demand/supply modifiers by settlement type
    const tradePrices = {
        // Base values of resources in silver
        baseValues: {
            food: 1,
            wood: 1,
            stone: 2,
            metal: 3,
            leather: 2,
            fur: 3,
            cloth: 3,
            clay: 1,
            pitch: 2,
            salt: 4,
            honey: 5,
            herbs: 4,
            silver: 1, // For reference
            gold: 20,
            amber: 8,
            ivory: 10,
            jewels: 15,
            peat: 1,
            whale_oil: 6,
            ice: 3,
            exotic: 10
        },
        
        // Demand multipliers by settlement type (higher means they pay more for it)
        demandModifiers: {
            VIKING: {
                food: 1.0,
                wood: 1.0,
                stone: 1.0,
                metal: 1.5,
                leather: 1.1,
                fur: 0.9,
                cloth: 1.2,
                clay: 1.0,
                pitch: 1.2,
                salt: 1.3,
                honey: 1.5,
                herbs: 1.1,
                gold: 1.0,
                amber: 1.2,
                ivory: 1.4,
                jewels: 1.3,
                peat: 1.0,
                whale_oil: 0.8,
                exotic: 1.5
            },
            ANGLO: {
                food: 1.1,
                wood: 1.2,
                stone: 1.1,
                metal: 1.3,
                leather: 1.0,
                fur: 1.3,
                cloth: 0.9,
                clay: 1.1,
                pitch: 1.1,
                salt: 1.2,
                honey: 1.1,
                herbs: 1.2,
                gold: 1.0,
                amber: 1.5,
                ivory: 1.3,
                jewels: 1.2,
                peat: 1.1,
                whale_oil: 1.3,
                exotic: 1.4
            },
            FRANKISH: {
                food: 1.0,
                wood: 1.1,
                stone: 1.0,
                metal: 1.2,
                leather: 1.2,
                fur: 1.4,
                cloth: 0.8,
                clay: 1.0,
                pitch: 1.0,
                salt: 1.1,
                honey: 1.2,
                herbs: 1.3,
                gold: 0.9,
                amber: 1.3,
                ivory: 1.5,
                jewels: 1.1,
                peat: 1.0,
                whale_oil: 1.2,
                exotic: 1.3
            },
            NEUTRAL: {
                food: 1.2,
                wood: 1.1,
                stone: 1.2,
                metal: 1.4,
                leather: 1.1,
                fur: 1.2,
                cloth: 1.1,
                clay: 1.0,
                pitch: 1.1,
                salt: 1.3,
                honey: 1.4,
                herbs: 1.2,
                gold: 1.1,
                amber: 1.3,
                ivory: 1.4,
                jewels: 1.3,
                peat: 1.1,
                whale_oil: 1.3,
                exotic: 1.5
            }
        },
        
        // Supply multipliers by settlement type (lower means they sell it cheaper)
        supplyModifiers: {
            VIKING: {
                food: 1.0,
                wood: 0.9,
                stone: 1.0,
                metal: 1.1,
                leather: 0.9,
                fur: 0.8,
                cloth: 1.1,
                clay: 0.9,
                pitch: 0.9,
                salt: 1.0,
                honey: 1.1,
                herbs: 1.0,
                gold: 1.2,
                amber: 0.9,
                ivory: 1.2,
                jewels: 1.1,
                peat: 0.9,
                whale_oil: 0.7,
                exotic: 1.3
            },
            ANGLO: {
                food: 0.9,
                wood: 0.8,
                stone: 0.9,
                metal: 1.0,
                leather: 1.0,
                fur: 1.1,
                cloth: 0.8,
                clay: 0.9,
                pitch: 1.0,
                salt: 1.0,
                honey: 1.0,
                herbs: 1.1,
                gold: 1.1,
                amber: 1.2,
                ivory: 1.1,
                jewels: 1.0,
                peat: 1.0,
                whale_oil: 1.2,
                exotic: 1.2
            },
            FRANKISH: {
                food: 0.8,
                wood: 0.9,
                stone: 0.8,
                metal: 0.9,
                leather: 1.0,
                fur: 1.2,
                cloth: 0.7,
                clay: 0.8,
                pitch: 0.9,
                salt: 0.9,
                honey: 1.0,
                herbs: 1.0,
                gold: 1.0,
                amber: 1.1,
                ivory: 1.2,
                jewels: 1.0,
                peat: 0.9,
                whale_oil: 1.1,
                exotic: 1.1
            },
            NEUTRAL: {
                food: 1.0,
                wood: 1.0,
                stone: 1.0,
                metal: 1.1,
                leather: 1.0,
                fur: 1.0,
                cloth: 1.0,
                clay: 0.9,
                pitch: 1.0,
                salt: 1.1,
                honey: 1.2,
                herbs: 1.0,
                gold: 1.2,
                amber: 1.1,
                ivory: 1.3,
                jewels: 1.2,
                peat: 1.0,
                whale_oil: 1.1,
                exotic: 1.3
            }
        },
        
        // Region-based availability - regions where resources are more available
        regionalAvailability: {
            FOREST: ["wood", "herbs", "honey", "fur", "pitch"],
            PLAINS: ["food", "clay", "cloth"],
            MOUNTAINS: ["stone", "metal", "salt"],
            COASTAL: ["food", "salt", "clay", "whale_oil"],
            FJORD: ["food", "wood", "whale_oil", "ice", "fur"]
        }
    };
    
    // Trade risk events that can occur during missions
    const tradeRiskEvents = [
        {
            id: "bandit_attack",
            title: "Bandit Attack",
            description: "Your trading party was ambushed by bandits on the road!",
            riskFactor: 1.0,
            escortBenefit: true,
            outcomes: {
                success: {
                    description: "Your escorts successfully defended the trading party.",
                    casualtiesRange: [0, 2],
                    goodsLostRange: [0, 10]
                },
                failure: {
                    description: "The bandits overwhelmed your traders and stole some goods.",
                    casualtiesRange: [1, 5],
                    goodsLostRange: [20, 50]
                }
            }
        },
        {
            id: "bad_weather",
            title: "Adverse Weather",
            description: "Your trading party encountered severe weather conditions.",
            riskFactor: 0.7,
            escortBenefit: false,
            outcomes: {
                success: {
                    description: "Your traders navigated through the bad weather safely.",
                    casualtiesRange: [0, 0],
                    goodsLostRange: [0, 5]
                },
                failure: {
                    description: "The weather caused delays and damaged some goods.",
                    casualtiesRange: [0, 1],
                    goodsLostRange: [10, 30]
                }
            }
        },
        {
            id: "hostile_locals",
            title: "Hostile Locals",
            description: "Locals along the trade route showed hostility to your traders.",
            riskFactor: 0.8,
            escortBenefit: true,
            outcomes: {
                success: {
                    description: "Your party managed to defuse the situation peacefully.",
                    casualtiesRange: [0, 0],
                    goodsLostRange: [0, 5]
                },
                failure: {
                    description: "Conflict erupted with the locals, causing casualties and lost goods.",
                    casualtiesRange: [1, 3],
                    goodsLostRange: [10, 30]
                }
            }
        },
        {
            id: "thieves",
            title: "Thieves in the Night",
            description: "Thieves attempted to steal from your trading party during the night.",
            riskFactor: 0.6,
            escortBenefit: true,
            outcomes: {
                success: {
                    description: "Your vigilant guards caught the thieves before they could steal anything significant.",
                    casualtiesRange: [0, 0],
                    goodsLostRange: [0, 5]
                },
                failure: {
                    description: "The thieves made off with some valuable goods.",
                    casualtiesRange: [0, 1],
                    goodsLostRange: [10, 25]
                }
            }
        },
        {
            id: "sea_storm",
            title: "Sea Storm",
            description: "Your trading ships encountered a fierce storm at sea.",
            riskFactor: 1.2,
            escortBenefit: false,
            maritimeOnly: true,
            outcomes: {
                success: {
                    description: "Your skilled sailors navigated through the storm with minimal damage.",
                    casualtiesRange: [0, 1],
                    goodsLostRange: [5, 15]
                },
                failure: {
                    description: "The storm badly damaged your ships, and much cargo was lost overboard.",
                    casualtiesRange: [1, 5],
                    goodsLostRange: [30, 60]
                }
            }
        },
        {
            id: "pirates",
            title: "Pirate Attack",
            description: "Pirates attacked your trading ships!",
            riskFactor: 1.3,
            escortBenefit: true,
            maritimeOnly: true,
            outcomes: {
                success: {
                    description: "Your ships outmaneuvered or fought off the pirates successfully.",
                    casualtiesRange: [0, 2],
                    goodsLostRange: [0, 10]
                },
                failure: {
                    description: "The pirates boarded your ships and seized a significant portion of your cargo.",
                    casualtiesRange: [2, 7],
                    goodsLostRange: [30, 70]
                }
            }
        }
    ];
    
    // Private methods
    
    /**
     * Generate a unique ID for a trade mission
     * @returns {string} - Unique ID
     */
    function generateTradeMissionId() {
        return `trade_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Generate a name for a trade mission
     * @param {string} targetName - Name of the target settlement
     * @param {string} missionTypeId - Type of mission
     * @returns {string} - Generated mission name
     */
    function generateTradeMissionName(targetName, missionTypeId) {
        const prefixes = [
            "The Journey to", "The Venture to", "The Exchange with",
            "The Trading Convoy to", "The Merchants of"
        ];
        
        let prefix;
        
        // Choose prefix based on mission type
        switch (missionTypeId) {
            case "local_trade":
                prefix = "The Local Trade with";
                break;
            case "merchant_caravan":
                prefix = "The Merchant Caravan to";
                break;
            case "trade_expedition":
                prefix = "The Grand Trading Expedition to";
                break;
            case "sea_trade":
                prefix = "The Maritime Commerce with";
                break;
            default:
                prefix = prefixes[Utils.randomBetween(0, prefixes.length - 1)];
        }
        
        return `${prefix} ${targetName}`;
    }
    
    /**
     * Calculate travel time to a settlement
     * @param {Object} playerSettlement - Player's settlement
     * @param {Object} targetSettlement - Target settlement
     * @param {Object} missionType - Type of trade mission
     * @returns {number} - Travel time in days
     */
    function calculateTravelTime(playerSettlement, targetSettlement, missionType) {
        if (!playerSettlement || !targetSettlement || !missionType) return 10; // Default fallback
        
        // Calculate distance
        const dx = targetSettlement.position.x - playerSettlement.position.x;
        const dy = targetSettlement.position.y - playerSettlement.position.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Base travel time (1 day per 10 units of distance)
        let travelTime = distance / 10;
        
        // Adjust for mission type speed modifier
        travelTime /= missionType.travelSpeedModifier;
        
        // Minimum travel time
        travelTime = Math.max(1, Math.ceil(travelTime));
        
        return travelTime;
    }
    
    /**
     * Calculate supplies needed for a trade mission
     * @param {number} size - Number of traders
     * @param {number} escorts - Number of escorts
     * @param {number} duration - Total mission duration in days
     * @returns {number} - Supplies needed
     */
    function calculateSuppliesNeeded(size, escorts, duration) {
        // Each person consumes 1 food per day
        return (size + escorts) * duration;
    }
    
    /**
     * Calculate the trading power of a mission
     * @param {Object} mission - Trade mission object
     * @returns {number} - Calculated trading power
     */
    function calculateTradingPower(mission) {
        const missionType = tradeMissionTypes[mission.missionType];
        if (!missionType) return 0;
        
        // Base trading power from traders (each trader contributes trading power)
        let tradingPower = mission.size * 1.0;
        
        // Leader bonus if present
        if (mission.leader) {
            const leaderTradeSkill = mission.leader.skills?.trading || mission.leader.skills?.leadership || 1;
            const leaderBonus = 1 + (leaderTradeSkill / 10); // 10% bonus per skill point
            tradingPower *= leaderBonus;
        }
        
        // Escorts provide a smaller bonus to trading power (negotiation leverage)
        tradingPower += mission.escorts * 0.2;
        
        // Mission type modifier
        tradingPower *= missionType.profitModifier;
        
        // Ship bonus for sea trade
        if (mission.missionType === "sea_trade" && mission.ships > 0) {
            // Each ship adds a small bonus (more cargo capacity)
            const shipBonus = 1 + (mission.ships * 0.1); // 10% bonus per ship
            tradingPower *= shipBonus;
        }
        
        return tradingPower;
    }
    
    /**
     * Calculate the risk level of a trade mission
     * @param {Object} mission - Trade mission object
     * @param {Object} targetSettlement - Target settlement
     * @returns {number} - Risk level (0-1)
     */
    function calculateRiskLevel(mission, targetSettlement) {
        const missionType = tradeMissionTypes[mission.missionType];
        if (!missionType) return 0.5;
        
        // Base risk from mission type
        let risk = missionType.riskModifier * 0.5; // Base 0.5 risk
        
        // Distance increases risk
        const playerSettlement = WorldMap.getPlayerSettlement();
        if (playerSettlement && targetSettlement) {
            const dx = targetSettlement.position.x - playerSettlement.position.x;
            const dy = targetSettlement.position.y - playerSettlement.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Distance increases risk (up to 0.2 additional risk)
            risk += Math.min(0.2, distance / 500);
        }
        
        // Relationship with target decreases risk
        const relationship = targetSettlement.relations?.[playerSettlement?.id] || 50;
        risk -= (relationship - 50) / 250; // +/- 0.2 based on relationship
        
        // Escorts decrease risk
        const escortRatio = mission.escorts / Math.max(1, mission.size);
        risk -= Math.min(0.3, escortRatio * 0.5); // Up to 0.3 reduction from escorts
        
        // Region type affects risk
        const region = targetSettlement.region ? WorldMap.getRegion(targetSettlement.region) : null;
        if (region) {
            // Some regions are more dangerous
            if (region.type === "MOUNTAINS") {
                risk += 0.1; // Mountains are more dangerous
            } else if (region.type === "FOREST") {
                risk += 0.05; // Forests have ambush spots
            } else if (region.type === "COASTAL" && mission.missionType === "sea_trade") {
                risk += 0.05; // Coastal areas have pirate risk for sea trade
            }
        }
        
        // Clamp risk to 0.1-0.9 range
        return Math.max(0.1, Math.min(0.9, risk));
    }
    
    /**
     * Calculate buying price for a resource at a settlement
     * @param {string} resource - Resource type
     * @param {Object} settlement - Settlement object
     * @returns {number} - Price in silver
     */
    function calculateBuyingPrice(resource, settlement) {
        // Get base value
        const baseValue = tradePrices.baseValues[resource] || 1;
        
        // Get settlement type supply modifier
        const supplyModifier = tradePrices.supplyModifiers[settlement.type]?.[resource] || 1.0;
        
        // Check if region affects availability
        let regionalModifier = 1.0;
        const region = settlement.region ? WorldMap.getRegion(settlement.region) : null;
        
        if (region && tradePrices.regionalAvailability[region.type]) {
            // If resource is commonly available in this region, it's cheaper
            if (tradePrices.regionalAvailability[region.type].includes(resource)) {
                regionalModifier = 0.8; // 20% discount
            }
        }
        
        // Calculate price with modifiers
        return baseValue * supplyModifier * regionalModifier;
    }
    
    /**
     * Calculate selling price for a resource at a settlement
     * @param {string} resource - Resource type
     * @param {Object} settlement - Settlement object
     * @returns {number} - Price in silver
     */
    function calculateSellingPrice(resource, settlement) {
        // Get base value
        const baseValue = tradePrices.baseValues[resource] || 1;
        
        // Get settlement type demand modifier
        const demandModifier = tradePrices.demandModifiers[settlement.type]?.[resource] || 1.0;
        
        // Check if region affects demand
        let regionalModifier = 1.0;
        const region = settlement.region ? WorldMap.getRegion(settlement.region) : null;
        
        if (region && tradePrices.regionalAvailability[region.type]) {
            // If resource is commonly available in this region, they pay less for it
            if (tradePrices.regionalAvailability[region.type].includes(resource)) {
                regionalModifier = 0.9; // 10% lower selling price
            } else {
                // If resource is not common in this region, they pay more
                regionalModifier = 1.1; // 10% higher selling price
            }
        }
        
        // Calculate price with modifiers
        return baseValue * demandModifier * regionalModifier;
    }
    
    /**
     * Evaluate potential trade targets
     * @param {Array} settlements - Array of potential target settlements
     * @param {Object} playerSettlement - Player's settlement
     * @param {string} missionTypeId - Type of trade mission
     * @returns {Array} - Sorted array of targets with scores
     */
    function evaluateTradeTargets(settlements, playerSettlement, missionTypeId) {
        if (!settlements || !playerSettlement) return [];
        
        const missionType = tradeMissionTypes[missionTypeId];
        if (!missionType) return [];
        
        // Calculate scores for each settlement
        const evaluatedTargets = settlements.map(settlement => {
            // Skip player's own settlement
            if (settlement.isPlayer) return { settlement, score: -1000 };
            
            let score = 0;
            
            // Distance factor (closer settlements get a bonus, but not too much)
            const dx = settlement.position.x - playerSettlement.position.x;
            const dy = settlement.position.y - playerSettlement.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Medium distance is ideal for trading (maximum difference in goods)
            const distanceScore = distance < 50 ? 10 : // Very close (less diversity but safe)
                                 distance < 150 ? 20 : // Medium distance (good diversity, reasonable safety)
                                 distance < 300 ? 15 : // Longer distance (good diversity but more risky)
                                 10; // Very distant (potentially great diversity but very risky)
            score += distanceScore;
            
            // Relationship factor (better relations mean better trade deals)
            let relationship = 50; // Default neutral
            if (settlement.relations && settlement.relations[playerSettlement.id]) {
                relationship = settlement.relations[playerSettlement.id];
            }
            score += (relationship - 50) / 2; // -25 to +25 points based on relationship
            
            // Settlement type factor (different types have different goods)
            if (settlement.type !== playerSettlement.type) {
                score += 15; // Different settlement types have more diverse goods
            }
            
            // Region factor (different regions have different resources)
            const playerRegion = WorldMap.getPlayerRegion();
            const targetRegion = settlement.region ? WorldMap.getRegion(settlement.region) : null;
            
            if (playerRegion && targetRegion && playerRegion.type !== targetRegion.type) {
                score += 20; // Different region types have more diverse resources
            }
            
            // Size factor (larger settlements have more goods)
            if (settlement.population) {
                score += Math.min(15, settlement.population / 10);
            }
            
            // Mission type specific modifiers
            if (missionType.id === "sea_trade") {
                // Sea trade favors coastal settlements
                const isCoastal = targetRegion && 
                                 (targetRegion.type === "COASTAL" || targetRegion.type === "FJORD");
                                 
                if (isCoastal) {
                    score += 30; // Big bonus for coastal targets on sea trade
                } else {
                    score -= 50; // Big penalty for non-coastal targets on sea trade
                }
            } else if (missionType.id === "local_trade") {
                // Local trade favors closer settlements
                score += 50 - Math.min(50, distance / 3); // Bonus for closer settlements
            } else if (missionType.id === "trade_expedition") {
                // Trade expeditions favor distant settlements with different goods
                if (distance > 200) {
                    score += 25; // Bonus for distant settlements
                }
                
                if (playerRegion && targetRegion && playerRegion.type !== targetRegion.type) {
                    score += 15; // Additional bonus for different region types
                }
            }
            
            // Calculate potential profit factor
            const profitPotential = estimateTradeProfitPotential(playerSettlement, settlement);
            score += profitPotential * 0.5; // Scale profit potential to reasonable score value
            
            return {
                settlement,
                score,
                distance,
                relationship,
                profitPotential
            };
        });
        
        // Filter out invalid targets (like player's own settlement)
        const validTargets = evaluatedTargets.filter(target => target.score > -100);
        
        // Sort by score (highest first)
        validTargets.sort((a, b) => b.score - a.score);
        
        return validTargets;
    }
    
    /**
     * Estimate trade profit potential between two settlements
     * @param {Object} playerSettlement - Player's settlement
     * @param {Object} targetSettlement - Target settlement
     * @returns {number} - Estimated profit potential
     */
    function estimateTradeProfitPotential(playerSettlement, targetSettlement) {
        let profitPotential = 0;
        
        // Get player and target regions
        const playerRegion = WorldMap.getPlayerRegion();
        const targetRegion = targetSettlement.region ? WorldMap.getRegion(targetSettlement.region) : null;
        
        if (!playerRegion || !targetRegion) return 20; // Default value if regions unknown
        
        // Resources the player can potentially sell for good profit
        const playerResources = [];
        if (playerRegion.type && tradePrices.regionalAvailability[playerRegion.type]) {
            playerResources.push(...tradePrices.regionalAvailability[playerRegion.type]);
        }
        
        // Resources the target settlement likely has in abundance
        const targetResources = [];
        if (targetRegion.type && tradePrices.regionalAvailability[targetRegion.type]) {
            targetResources.push(...tradePrices.regionalAvailability[targetRegion.type]);
        }
        
        // Calculate profit potential from player's resources
        for (const resource of playerResources) {
            // If target doesn't have this resource naturally, they'll pay more
            if (!targetResources.includes(resource)) {
                const sellingPrice = calculateSellingPrice(resource, targetSettlement);
                const baseValue = tradePrices.baseValues[resource] || 1;
                const profit = sellingPrice - baseValue;
                profitPotential += profit * 5; // Scale up to make it significant
            }
        }
        
        // Calculate profit potential from target's resources
        for (const resource of targetResources) {
            // If player doesn't have this resource naturally, it's valuable to get
            if (!playerResources.includes(resource)) {
                const buyingPrice = calculateBuyingPrice(resource, targetSettlement);
                const baseValue = tradePrices.baseValues[resource] || 1;
                const profit = baseValue - buyingPrice;
                profitPotential += Math.max(0, profit * 3); // Scale up to make it significant
            }
        }
        
        // Add base profit potential
        profitPotential += 20;
        
        // Adjust for settlement type difference (more diverse goods)
        if (playerSettlement.type !== targetSettlement.type) {
            profitPotential *= 1.2;
        }
        
        return Math.max(10, Math.min(100, profitPotential));
    }
    
    /**
     * Process a trade risk event during a mission
     * @param {Object} mission - Trade mission object
     * @param {number} riskLevel - Risk level of the mission (0-1)
     * @returns {Object|null} - Risk event outcome or null if no event occurred
     */
    function processTradeRiskEvent(mission, riskLevel) {
        // Base chance of an event happening
        const eventChance = riskLevel * 100;
        
        // Check if an event happens
        if (!Utils.chanceOf(eventChance)) {
            return null;
        }
        
        // Filter eligible events
        const eligibleEvents = tradeRiskEvents.filter(event => {
            // Skip maritime events for land missions and vice versa
            if (event.maritimeOnly && mission.missionType !== "sea_trade") {
                return false;
            }
            
            return true;
        });
        
        if (eligibleEvents.length === 0) {
            return null;
        }
        
        // Select a random event, weighted by risk factor
        // First, calculate total weight
        const totalWeight = eligibleEvents.reduce((sum, event) => sum + event.riskFactor, 0);
        
        // Select an event using weighted random
        let randomValue = Math.random() * totalWeight;
        let selectedEvent = null;
        
        for (const event of eligibleEvents) {
            randomValue -= event.riskFactor;
            if (randomValue <= 0) {
                selectedEvent = event;
                break;
            }
        }
        
        // Fallback if somehow no event was selected
        if (!selectedEvent) {
            selectedEvent = eligibleEvents[0];
        }
        
        // Calculate success chance
        let successChance = 50; // Base 50% success chance
        
        // Escort benefit
        if (selectedEvent.escortBenefit) {
            // Calculate escort ratio
            const escortRatio = mission.escorts / Math.max(1, mission.size);
            successChance += Math.min(30, escortRatio * 60); // Up to +30% with strong escort
        }
        
        // Mission type affects success chance
        if (mission.missionType === "local_trade") {
            successChance += 10; // Local trade is safer
        } else if (mission.missionType === "trade_expedition") {
            successChance -= 10; // Trade expeditions are more risky
        }
        
        // Leader can help
        if (mission.leader && mission.leader.skills) {
            const relevantSkill = Math.max(
                mission.leader.skills.leadership || 0,
                mission.leader.skills.combat || 0
            );
            successChance += relevantSkill * 2; // Up to +20% with skilled leader
        }
        
        // Determine outcome
        const success = Utils.chanceOf(successChance);
        const outcome = success ? selectedEvent.outcomes.success : selectedEvent.outcomes.failure;
        
        // Calculate casualties
        const casualties = Utils.randomBetween(outcome.casualtiesRange[0], outcome.casualtiesRange[1]);
        
        // Calculate goods lost (percentage of total goods value)
        const goodsLostPercent = Utils.randomBetween(outcome.goodsLostRange[0], outcome.goodsLostRange[1]);
        
        return {
            event: selectedEvent,
            success,
            outcomeDescription: outcome.description,
            casualties,
            goodsLostPercent,
            fullDescription: `${selectedEvent.description} ${outcome.description}`
        };
    }
    
    /**
     * Process the trading phase of a mission
     * @param {Object} mission - Trade mission object
     * @returns {Object} - Trading result object
     */
    function processTradingPhase(mission) {
        // Get target settlement
        const targetSettlement = WorldMap.getSettlement(mission.targetSettlement);
        if (!targetSettlement) {
            return {
                success: false,
                message: "Target settlement could not be found.",
                diplomaticChange: 0,
                returns: {}
            };
        }
        
        // Get player settlement
        const playerSettlement = WorldMap.getPlayerSettlement();
        if (!playerSettlement) {
            return {
                success: false,
                message: "Player settlement could not be found.",
                diplomaticChange: 0,
                returns: {}
            };
        }
        
        // Calculate trading power
        const tradingPower = mission.tradingPower;
        
        // Calculate relationship bonus
        const relationship = targetSettlement.relations?.[playerSettlement.id] || 50;
        const relationshipBonus = (relationship - 50) / 100; // -0.5 to +0.5
        
        // Calculate risk level
        const riskLevel = calculateRiskLevel(mission, targetSettlement);
        
        // Process potential risk event
        const riskEvent = processTradeRiskEvent(mission, riskLevel);
        
        // If there was a catastrophic risk event, it might end trading prematurely
        if (riskEvent && !riskEvent.success && riskEvent.goodsLostPercent > 70) {
            return {
                success: false,
                message: "Trading was unsuccessful due to a major incident: " + riskEvent.fullDescription,
                diplomaticChange: -5,
                casualties: riskEvent.casualties,
                goodsLostPercent: riskEvent.goodsLostPercent,
                riskEvent: riskEvent,
                returns: {}
            };
        }
        
        // Calculate trading efficiency
        let tradingEfficiency = 0.5 + (tradingPower / 20); // Base + bonus from trading power
        tradingEfficiency += relationshipBonus; // Bonus/penalty from relationship
        
        // Mission type affects trading efficiency
        const missionType = tradeMissionTypes[mission.missionType];
        if (missionType) {
            tradingEfficiency *= missionType.profitModifier;
        }
        
        // Risk event might reduce trading efficiency
        if (riskEvent && !riskEvent.success) {
            tradingEfficiency *= (1 - (riskEvent.goodsLostPercent / 100));
        }
        
        // Clamp trading efficiency
        tradingEfficiency = Math.max(0.1, Math.min(1.5, tradingEfficiency));
        
        // Calculate goods to buy from target settlement
        const targetRegion = targetSettlement.region ? WorldMap.getRegion(targetSettlement.region) : null;
        const playerRegion = WorldMap.getPlayerRegion();
        
        // Start with empty returns
        const returns = {};
        
        // Calculate total value of outbound goods
        const outboundValue = calculateTotalGoodsValue(mission.goods);
        
        // Get resources available at target settlement
        const availableResources = [];
        
        // First, add regionally available resources
        if (targetRegion && targetRegion.type && tradePrices.regionalAvailability[targetRegion.type]) {
            availableResources.push(...tradePrices.regionalAvailability[targetRegion.type]);
        }
        
        // Add some common resources
        availableResources.push("food", "wood");
        
        // Add some random resources that might be available
        const allResources = Object.keys(tradePrices.baseValues);
        for (let i = 0; i < 3; i++) { // Add up to 3 random resources
            const randomResource = allResources[Utils.randomBetween(0, allResources.length - 1)];
            if (!availableResources.includes(randomResource)) {
                availableResources.push(randomResource);
            }
        }
        
        // Calculate which resources would be profitable to bring back
        const profitableResources = availableResources.filter(resource => {
            // If resource is not common in player's region, it's more valuable
            if (playerRegion && playerRegion.type && 
                tradePrices.regionalAvailability[playerRegion.type] &&
                !tradePrices.regionalAvailability[playerRegion.type].includes(resource)) {
                return true;
            }
            
            // Check if buying price is favorable
            const buyingPrice = calculateBuyingPrice(resource, targetSettlement);
            const baseValue = tradePrices.baseValues[resource] || 1;
            
            return buyingPrice <= baseValue; // If we can buy it for less than base value, it's profitable
        });
        
        // Calculate return value based on outbound value and trading efficiency
        const returnValue = outboundValue * (1 + tradingEfficiency);
        let remainingValue = returnValue;
        
        // Distribute returned value across profitable resources
        if (profitableResources.length > 0) {
            while (remainingValue > 0 && profitableResources.length > 0) {
                // Select a random resource from profitable ones
                const resourceIndex = Utils.randomBetween(0, profitableResources.length - 1);
                const resource = profitableResources[resourceIndex];
                
                // Calculate buying price
                const buyingPrice = calculateBuyingPrice(resource, targetSettlement);
                
                // Calculate amount to buy (in silver value)
                const valueForThisResource = Math.min(remainingValue, returnValue / 3); // Max 1/3 of total in one resource
                const amount = Math.floor(valueForThisResource / buyingPrice);
                
                if (amount > 0) {
                    // Add to returns
                    if (!returns[resource]) returns[resource] = 0;
                    returns[resource] += amount;
                    
                    // Subtract from remaining value
                    remainingValue -= amount * buyingPrice;
                }
                
                // Remove resource from list if we've allocated a significant amount
                if (valueForThisResource > returnValue / 10) {
                    profitableResources.splice(resourceIndex, 1);
                }
            }
        }
        
        // If there's still value left, convert to silver
        if (remainingValue > 1) {
            if (!returns.silver) returns.silver = 0;
            returns.silver += Math.floor(remainingValue);
        }
        
        // Calculate profit (in silver value)
        const returnedValue = calculateTotalGoodsValue(returns);
        const profit = returnedValue - outboundValue;
        
        // Calculate diplomatic change
        let diplomaticChange = 5; // Base diplomatic improvement
        diplomaticChange *= missionType.diplomaticGainModifier; // Adjust for mission type
        
        // Risk events might reduce diplomatic gain
        if (riskEvent && !riskEvent.success) {
            diplomaticChange = Math.max(0, diplomaticChange - 3);
        }
        
        // Higher profit trades improve relations more
        if (profit > outboundValue * 0.5) {
            diplomaticChange += 2; // Additional bonus for very profitable trade
        }
        
        return {
            success: true,
            message: "Trading completed successfully.",
            diplomaticChange: diplomaticChange,
            casualties: riskEvent ? riskEvent.casualties : 0,
            goodsLostPercent: riskEvent ? riskEvent.goodsLostPercent : 0,
            riskEvent: riskEvent,
            returns: returns,
            profit: profit
        };
    }
    
    /**
     * Calculate the total value of goods in silver
     * @param {Object} goods - Object with resource amounts
     * @returns {number} - Total value in silver
     */
    function calculateTotalGoodsValue(goods) {
        let totalValue = 0;
        
        for (const resource in goods) {
            const amount = goods[resource];
            const baseValue = tradePrices.baseValues[resource] || 1;
            totalValue += amount * baseValue;
        }
        
        return totalValue;
    }
    
    /**
     * Create the trading UI
     */
    function createTradingUI() {
        // Check if trade panel already exists
        if (document.getElementById('trade-panel')) {
            return;
        }
        
        console.log("Creating trade panel");
        
        // Create trade panel
        const tradePanel = document.createElement('div');
        tradePanel.id = 'trade-panel';
        tradePanel.className = 'trade-panel hidden-panel';
        
        tradePanel.innerHTML = `
            <h2>Trading</h2>
            <div class="trade-content">
                <div class="active-missions-section">
                    <h3>Active Trade Missions</h3>
                    <div id="active-missions-list" class="active-missions-list">
                        <p class="no-missions-message">No active trade missions. Organize a new trade mission to exchange goods with other settlements.</p>
                    </div>
                </div>
                
                <div class="trade-form-section">
                    <h3>Organize Trade Mission</h3>
                    <div class="trade-form">
                        <div class="form-group">
                            <label for="trade-mission-type">Mission Type:</label>
                            <select id="trade-mission-type">
                                <option value="local_trade">Local Trade (2-5 traders)</option>
                                <option value="merchant_caravan">Merchant Caravan (5-15 traders)</option>
                                <option value="trade_expedition">Trade Expedition (10-30 traders)</option>
                                <option value="sea_trade">Sea Trade (8-20 traders, requires ships)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="trade-size">Traders:</label>
                            <input type="number" id="trade-size" min="2" value="5">
                            <div class="size-range" id="size-range">2-5 traders</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="trade-escorts">Warrior Escorts:</label>
                            <input type="number" id="trade-escorts" min="0" value="2">
                            <div class="escort-info">Escorts protect traders from bandits and pirates</div>
                        </div>
                        
                        <div class="form-group" id="ships-group" style="display: none;">
                            <label for="trade-ships">Ships:</label>
                            <input type="number" id="trade-ships" min="1" value="1">
                            <div class="ships-info">Each ship can transport ~20 people (traders + escorts)</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="trade-target">Target Settlement:</label>
                            <select id="trade-target">
                                <option value="">Loading targets...</option>
                            </select>
                        </div>
                        
                        <div class="target-info" id="target-info">
                            <p>Select a target to view information</p>
                        </div>
                        
                        <div class="form-group">
                            <label>Preparation:</label>
                            <div id="trade-preparation-info">3 days</div>
                        </div>
                        
                        <div class="form-group">
                            <label>Supplies Needed:</label>
                            <div id="trade-supplies-needed">35 food</div>
                        </div>
                        
                        <div class="trade-goods-section">
                            <h4>Trade Goods</h4>
                            <p class="trade-goods-info">Select goods to trade with the target settlement:</p>
                            
                            <div class="trade-goods-grid" id="trade-goods-grid">
                                <!-- Trade goods selection will be populated here -->
                            </div>
                            
                            <div class="trade-goods-value">
                                <span>Total Value: </span>
                                <span id="trade-goods-total-value">0</span>
                                <span> silver</span>
                            </div>
                        </div>
                        
                        <button id="start-trade-mission" class="start-mission-btn">Organize Trade Mission</button>
                    </div>
                </div>
                
                <div class="mission-details-section" id="mission-details-section" style="display: none;">
                    <h3>Mission Details</h3>
                    <div id="mission-details-content"></div>
                    <button id="back-to-missions" class="back-btn">Back to Missions</button>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(tradePanel);
            
            // Add event listeners
            document.getElementById('trade-mission-type').addEventListener('change', updateTradeForm);
            document.getElementById('trade-size').addEventListener('input', updateTradeForm);
            document.getElementById('trade-escorts').addEventListener('input', updateTradeForm);
            document.getElementById('trade-ships').addEventListener('input', updateTradeForm);
            document.getElementById('trade-target').addEventListener('change', updateTargetInfo);
            document.getElementById('start-trade-mission').addEventListener('click', startTradeMission);
            document.getElementById('back-to-missions').addEventListener('click', () => {
                document.getElementById('mission-details-section').style.display = 'none';
                document.querySelector('.active-missions-section').style.display = 'block';
                document.querySelector('.trade-form-section').style.display = 'block';
            });
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('trade-panel', 'world');
            }
            
            // Add CSS styles
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .trade-panel {
                    background-color: #f7f0e3;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .trade-panel h2 {
                    color: #5d4037;
                    border-bottom: 2px solid #a99275;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                
                .trade-panel h3 {
                    color: #5d4037;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                
                .trade-panel h4 {
                    color: #5d4037;
                    margin-top: 15px;
                    margin-bottom: 5px;
                }
                
                .active-missions-list {
                    margin-bottom: 20px;
                }
                
                .mission-card {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-left: 4px solid #1565C0;
                    border-radius: 4px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .mission-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .mission-title {
                    font-weight: bold;
                    font-size: 1.1em;
                    color: #5d4037;
                }
                
                .mission-status {
                    font-size: 0.9em;
                    padding: 2px 8px;
                    border-radius: 10px;
                    background-color: #f0f0f0;
                }
                
                .status-preparing { background-color: #fff9c4; }
                .status-traveling { background-color: #bbdefb; }
                .status-trading { background-color: #c8e6c9; }
                .status-returning { background-color: #d1c4e9; }
                .status-completed { background-color: #d7ccc8; }
                .status-failed { background-color: #ffcdd2; }
                
                .mission-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 10px;
                    font-size: 0.9em;
                }
                
                .mission-progress {
                    margin-top: 10px;
                }
                
                .progress-bar-container {
                    height: 10px;
                    background-color: #e0e0e0;
                    border-radius: 5px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background-color: #1565C0;
                    width: 0%;
                }
                
                .mission-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .trade-form {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #5d4037;
                }
                
                .form-group select,
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                }
                
                .size-range,
                .escort-info,
                .ships-info {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 5px;
                }
                
                .target-info {
                    background-color: #f9f9f9;
                    padding: 10px;
                    border-radius: 4px;
                    margin: 15px 0;
                }
                
                .trade-goods-section {
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px dashed #d7cbb9;
                }
                
                .trade-goods-info {
                    margin-bottom: 10px;
                    font-size: 0.9em;
                    color: #666;
                }
                
                .trade-goods-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .trade-good-item {
                    display: flex;
                    align-items: center;
                    background-color: #f9f9f9;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #e0e0e0;
                }
                
                .trade-good-item input {
                    width: 60px;
                    margin-right: 10px;
                }
                
                .trade-good-label {
                    flex-grow: 1;
                }
                
                .trade-good-value {
                    color: #666;
                    font-size: 0.9em;
                }
                
                .trade-goods-value {
                    font-weight: bold;
                    text-align: right;
                    margin-top: 10px;
                    color: #5d4037;
                }
                
                .start-mission-btn {
                    background-color: #1565C0;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .start-mission-btn:hover {
                    background-color: #0D47A1;
                }
                
                .start-mission-btn:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                
                .back-btn {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 8px 15px;
                    cursor: pointer;
                    margin-top: 15px;
                }
                
                .mission-details-content {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .mission-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .metric-card {
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    padding: 10px;
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #5d4037;
                }
                
                .metric-label {
                    font-size: 0.9em;
                    color: #777;
                }
                
                .goods-list {
                    margin-top: 15px;
                }
                
                .goods-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #5d4037;
                }
                
                .good-item {
                    background-color: #f9f9f9;
                    border-left: 3px solid #1565C0;
                    padding: 10px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                }
                
                .returns-item {
                    border-left-color: #4CAF50;
                }
                
                .good-name {
                    font-weight: bold;
                }
                
                .good-amount {
                    color: #5d4037;
                }
                
                .risk-event {
                    background-color: #FFF8E1;
                    border-left: 3px solid #FFC107;
                    padding: 12px;
                    margin: 15px 0;
                }
                
                .risk-event-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #5d4037;
                }
                
                .risk-event-description {
                    color: #5d4037;
                }
                
                .target-stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                
                .target-bar {
                    height: 8px;
                    background-color: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 2px;
                }
                
                .target-bar-fill {
                    height: 100%;
                    background-color: #5d4037;
                }
                
                .target-stat-profit .target-bar-fill { background-color: #4CAF50; }
                .target-stat-risk .target-bar-fill { background-color: #F44336; }
                .target-stat-distance .target-bar-fill { background-color: #2196F3; }
                .target-stat-relations .target-bar-fill { background-color: #FFC107; }
                
                .no-missions-message {
                    font-style: italic;
                    color: #777;
                }
                
                @media (max-width: 768px) {
                    .mission-info {
                        grid-template-columns: 1fr;
                    }
                    
                    .mission-metrics {
                        grid-template-columns: 1fr;
                    }
                    
                    .trade-goods-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            
            document.head.appendChild(styleElement);
            
            // Initialize form
            updateTradeForm();
            
            // Load available targets
            loadTradeTargets();
        }
    }
    
    /**
     * Update the trade form based on selected options
     */
    function updateTradeForm() {
        const typeSelect = document.getElementById('trade-mission-type');
        const sizeInput = document.getElementById('trade-size');
        const escortsInput = document.getElementById('trade-escorts');
        const shipsInput = document.getElementById('trade-ships');
        const shipsGroup = document.getElementById('ships-group');
        const sizeRangeDisplay = document.getElementById('size-range');
        const preparationInfo = document.getElementById('trade-preparation-info');
        const suppliesNeededDisplay = document.getElementById('trade-supplies-needed');
        const startButton = document.getElementById('start-trade-mission');
        
        // Get selected mission type
        const selectedType = typeSelect.value;
        const missionType = tradeMissionTypes[selectedType];
        
        if (!missionType) return;
        
        // Update size range display
        sizeRangeDisplay.textContent = `${missionType.minSize}-${missionType.maxSize} traders`;
        
        // Enforce min/max size for the selected mission type
        sizeInput.min = missionType.minSize;
        sizeInput.max = missionType.maxSize;
        
        // Adjust size if out of range
        let size = parseInt(sizeInput.value);
        if (size < missionType.minSize) {
            sizeInput.value = missionType.minSize;
            size = missionType.minSize;
        } else if (size > missionType.maxSize) {
            sizeInput.value = missionType.maxSize;
            size = missionType.maxSize;
        }
        
        // Show/hide ships input for sea trade
        if (missionType.shipRequired) {
            shipsGroup.style.display = 'block';
            
            // Calculate min ships based on traders and escorts (1 ship per 20 people)
            const escorts = parseInt(escortsInput.value) || 0;
            const totalPeople = size + escorts;
            const minShips = Math.ceil(totalPeople / 20);
            shipsInput.min = minShips;
            
            if (parseInt(shipsInput.value) < minShips) {
                shipsInput.value = minShips;
            }
        } else {
            shipsGroup.style.display = 'none';
        }
        
        // Update preparation time
        preparationInfo.textContent = `${missionType.preparationTime} days`;
        
        // Update target selection
        loadTradeTargets();
        
        // Calculate estimated mission duration
        const targetSelect = document.getElementById('trade-target');
        let totalDuration = missionType.preparationTime;
        
        if (targetSelect.value) {
            const targetSettlement = WorldMap.getSettlement(targetSelect.value);
            const playerSettlement = WorldMap.getPlayerSettlement();
            
            if (targetSettlement && playerSettlement) {
                const travelTime = calculateTravelTime(playerSettlement, targetSettlement, missionType);
                totalDuration += travelTime * 2; // Round trip
                totalDuration += 1; // Trading time
            }
        } else {
            // Estimate if no target selected
            totalDuration += 10; // Arbitrary estimate
        }
        
        // Calculate supplies needed
        const escorts = parseInt(escortsInput.value) || 0;
        const suppliesNeeded = calculateSuppliesNeeded(size, escorts, totalDuration);
        suppliesNeededDisplay.textContent = `${Math.ceil(suppliesNeeded)} food`;
        
        // Update trade goods grid
        updateTradeGoodsGrid();
        
        // Check if trade mission can be created
        validateTradeMission();
    }
    
    /**
     * Update the trade goods selection grid
     */
    function updateTradeGoodsGrid() {
        const goodsGrid = document.getElementById('trade-goods-grid');
        if (!goodsGrid) return;
        
        // Get available resource types from the player
        const playerResources = ResourceManager.getResources();
        
        // Filter to only include resources that actually exist
        const availableResources = Object.keys(playerResources).filter(resource => {
            return playerResources[resource] > 0 && resource !== 'exotic'; // Exclude exotic for now
        });
        
        if (availableResources.length === 0) {
            goodsGrid.innerHTML = '<p>No resources available for trade.</p>';
            return;
        }
        
        let html = '';
        
        // Create input for each available resource
        for (const resource of availableResources) {
            const displayName = resource.charAt(0).toUpperCase() + resource.slice(1);
            const baseValue = tradePrices.baseValues[resource] || 1;
            
            html += `
                <div class="trade-good-item">
                    <input 
                        type="number" 
                        id="trade-good-${resource}" 
                        class="trade-good-input" 
                        min="0" 
                        max="${Math.floor(playerResources[resource])}" 
                        value="0" 
                        data-resource="${resource}" 
                        data-value="${baseValue}"
                    >
                    <span class="trade-good-label">${displayName}</span>
                    <span class="trade-good-value">(${baseValue} silver each)</span>
                </div>
            `;
        }
        
        goodsGrid.innerHTML = html;
        
        // Add event listeners to inputs
        const goodInputs = document.querySelectorAll('.trade-good-input');
        goodInputs.forEach(input => {
            input.addEventListener('input', updateTotalTradeValue);
        });
        
        // Initial update
        updateTotalTradeValue();
    }
    
    /**
     * Update the total trade value display
     */
    function updateTotalTradeValue() {
        const goodInputs = document.querySelectorAll('.trade-good-input');
        let totalValue = 0;
        
        goodInputs.forEach(input => {
            const amount = parseInt(input.value) || 0;
            const value = parseFloat(input.dataset.value) || 1;
            totalValue += amount * value;
        });
        
        const totalValueDisplay = document.getElementById('trade-goods-total-value');
        if (totalValueDisplay) {
            totalValueDisplay.textContent = Math.floor(totalValue);
        }
        
        // Validate overall mission
        validateTradeMission();
    }
    
    /**
     * Validate if a trade mission can be created
     */
    function validateTradeMission() {
        const typeSelect = document.getElementById('trade-mission-type');
        const sizeInput = document.getElementById('trade-size');
        const escortsInput = document.getElementById('trade-escorts');
        const shipsInput = document.getElementById('trade-ships');
        const targetSelect = document.getElementById('trade-target');
        const startButton = document.getElementById('start-trade-mission');
        const totalValueDisplay = document.getElementById('trade-goods-total-value');
        
        if (!startButton) return;
        
        // Check for valid mission type
        const missionType = tradeMissionTypes[typeSelect.value];
        if (!missionType) {
            startButton.disabled = true;
            return;
        }
        
        // Check for valid target
        if (!targetSelect.value) {
            startButton.disabled = true;
            return;
        }
        
        // Check for valid size
        const size = parseInt(sizeInput.value) || 0;
        if (size < missionType.minSize || size > missionType.maxSize) {
            startButton.disabled = true;
            return;
        }
        
        // Check for valid escorts
        const escorts = parseInt(escortsInput.value) || 0;
        if (escorts < 0) {
            startButton.disabled = true;
            return;
        }
        
        // Check for valid ships if required
        if (missionType.shipRequired) {
            const ships = parseInt(shipsInput.value) || 0;
            const totalPeople = size + escorts;
            const minShips = Math.ceil(totalPeople / 20);
            
            if (ships < minShips) {
                startButton.disabled = true;
                return;
            }
        }
        
        // Check if trade goods have been selected
        const totalValue = parseInt(totalValueDisplay.textContent) || 0;
        if (totalValue <= 0) {
            startButton.disabled = true;
            return;
        }
        
        // Check for available population
        const population = typeof PopulationManager !== 'undefined' ? 
            PopulationManager.getPopulation() : null;
            
        const availableWorkers = population ? population.workers - 
            (typeof PopulationManager.getUnassignedWorkers === 'function' ? 
             population.workers - PopulationManager.getUnassignedWorkers() : 0) : 0;
             
        if (size > availableWorkers) {
            startButton.disabled = true;
            return;
        }
        
        // Check for available warriors
        const warriorData = typeof BuildingSystem !== 'undefined' && 
                           typeof BuildingSystem.getWarriorData === 'function' ? 
                           BuildingSystem.getWarriorData() : null;
                           
        const availableWarriors = warriorData ? warriorData.available : 0;
        
        if (escorts > availableWarriors) {
            startButton.disabled = true;
            return;
        }
        
        // Everything checks out
        startButton.disabled = false;
    }
    
    /**
     * Load available trade targets into the select element
     */
    function loadTradeTargets() {
        const targetSelect = document.getElementById('trade-target');
        const missionTypeSelect = document.getElementById('trade-mission-type');
        
        if (!targetSelect || !missionTypeSelect) return;
        
        // Get selected mission type
        const missionTypeId = missionTypeSelect.value;
        
        // Get player settlement
        const playerSettlement = WorldMap.getPlayerSettlement();
        if (!playerSettlement) {
            targetSelect.innerHTML = '<option value="">No targets available</option>';
            return;
        }
        
        // Get all settlements
        const allSettlements = WorldMap.getWorldMap().settlements;
        if (!allSettlements || allSettlements.length === 0) {
            targetSelect.innerHTML = '<option value="">No targets available</option>';
            return;
        }
        
        // Filter out player's own settlement
        const otherSettlements = allSettlements.filter(s => !s.isPlayer);
        
        // Evaluate targets
        const evaluatedTargets = evaluateTradeTargets(otherSettlements, playerSettlement, missionTypeId);
        
        // Create options
        let optionsHtml = '<option value="">Select a target...</option>';
        
        evaluatedTargets.forEach(target => {
            const settlement = target.settlement;
            const relationshipText = getRelationshipText(target.relationship);
            
            optionsHtml += `<option value="${settlement.id}" data-score="${target.score.toFixed(2)}" data-distance="${target.distance.toFixed(0)}" data-profit="${target.profitPotential.toFixed(0)}" data-relationship="${target.relationship}">${settlement.name} (${settlement.type}) - ${relationshipText}</option>`;
        });
        
        targetSelect.innerHTML = optionsHtml;
        
        // Update target info if target already selected
        if (targetSelect.value) {
            updateTargetInfo();
        }
    }
    
    /**
     * Get text representation of relationship value
     * @param {number} value - Relationship value (0-100)
     * @returns {string} - Text representation
     */
    function getRelationshipText(value) {
        if (value >= 80) return "Friendly";
        if (value >= 60) return "Cordial";
        if (value >= 40) return "Neutral";
        if (value >= 20) return "Wary";
        return "Hostile";
    }
    
    /**
     * Update target information display
     */
    function updateTargetInfo() {
        const targetSelect = document.getElementById('trade-target');
        const targetInfo = document.getElementById('target-info');
        
        if (!targetSelect || !targetInfo) return;
        
        const selectedOption = targetSelect.options[targetSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            targetInfo.innerHTML = '<p>Select a target to view information</p>';
            return;
        }
        
        // Get target data from option attributes
        const settlementId = selectedOption.value;
        const score = parseFloat(selectedOption.dataset.score) || 0;
        const distance = parseInt(selectedOption.dataset.distance) || 0;
        const profitPotential = parseInt(selectedOption.dataset.profit) || 0;
        const relationship = parseInt(selectedOption.dataset.relationship) || 50;
        
        // Get settlement object
        const settlement = WorldMap.getSettlement(settlementId);
        
        if (!settlement) {
            targetInfo.innerHTML = '<p>Error: Settlement not found</p>';
            return;
        }
        
        // Get region information
        const region = settlement.region ? WorldMap.getRegion(settlement.region) : null;
        const regionName = region ? region.name : "Unknown Region";
        const regionType = region ? region.typeName : "";
        
        // Calculate risk level
        const missionTypeId = document.getElementById('trade-mission-type').value;
        const missionType = tradeMissionTypes[missionTypeId];
        const riskLevel = Math.round(calculateRiskLevel({ missionType: missionTypeId }, settlement) * 100);
        
        // Calculate normalized values for visual bars (0-100)
        const profitNormalized = Math.min(100, profitPotential);
        const riskNormalized = Math.min(100, riskLevel);
        const distanceNormalized = Math.min(100, Math.max(0, 100 - (distance / 3)));
        const relationshipNormalized = Math.min(100, relationship);
        
        // Get available resources at target
        let availableResources = [];
        
        if (region && region.type && tradePrices.regionalAvailability[region.type]) {
            availableResources = tradePrices.regionalAvailability[region.type];
        }
        
        // Format resources
        const resourcesText = availableResources.length > 0 ? 
            availableResources.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ') : 
            "Unknown";
        
        // Generate HTML
        const html = `
            <div class="target-header">
                <h4>${settlement.name}</h4>
                <div class="target-type">${settlement.type} Settlement</div>
            </div>
            <div class="target-region">Located in ${regionName} (${regionType})</div>
            <div class="target-population">Population: ~${settlement.population || "Unknown"}</div>
            <div class="target-resources">Common Resources: ${resourcesText}</div>
            
            <div class="target-stats">
                <div class="target-stat target-stat-profit">
                    <div class="stat-label">Profit Potential:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${profitPotential}/100</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${profitNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-risk">
                    <div class="stat-label">Risk Level:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${riskLevel}%</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${riskNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-distance">
                    <div class="stat-label">Travel Distance:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${distance.toFixed(0)} units</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${distanceNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-relations">
                    <div class="stat-label">Relations:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${getRelationshipText(relationship)}</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${relationshipNormalized}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="trade-evaluation">
                <div class="evaluation-score">Trade Score: ${score.toFixed(1)}</div>
                <div class="evaluation-text">${getTradeEvaluationText(score)}</div>
            </div>
        `;
        
        targetInfo.innerHTML = html;
        
        // Update trade form (for supplies calculation)
        updateTradeForm();
    }
    
    /**
     * Get evaluation text based on trade score
     * @param {number} score - Trade score
     * @returns {string} - Evaluation text
     */
    function getTradeEvaluationText(score) {
        if (score >= 80) return "Excellent trade partner! High profit potential with minimal risk.";
        if (score >= 60) return "Very good trade opportunity with favorable conditions.";
        if (score >= 40) return "Good trade partner with decent profit potential.";
        if (score >= 20) return "Average trade opportunity. Exercise normal caution.";
        if (score >= 0) return "Below average trade partner. Limited profit potential.";
        return "Poor trade option. Consider alternatives.";
    }
    
    /**
     * Start a new trade mission
     */
    function startTradeMission() {
        // Get form values
        const typeSelect = document.getElementById('trade-mission-type');
        const sizeInput = document.getElementById('trade-size');
        const escortsInput = document.getElementById('trade-escorts');
        const shipsInput = document.getElementById('trade-ships');
        const targetSelect = document.getElementById('trade-target');
        
        const missionTypeId = typeSelect.value;
        const size = parseInt(sizeInput.value);
        const escorts = parseInt(escortsInput.value) || 0;
        const ships = parseInt(shipsInput.value) || 0;
        const targetId = targetSelect.value;
        
        // Validate inputs
        if (!missionTypeId || !size || !targetId) {
            Utils.log("Invalid trade mission parameters.", "important");
            return;
        }
        
        const missionType = tradeMissionTypes[missionTypeId];
        if (!missionType) {
            Utils.log("Invalid mission type.", "important");
            return;
        }
        
        // Get target settlement
        const targetSettlement = WorldMap.getSettlement(targetId);
        if (!targetSettlement) {
            Utils.log("Target settlement not found.", "important");
            return;
        }
        
        // Get player settlement
        const playerSettlement = WorldMap.getPlayerSettlement();
        if (!playerSettlement) {
            Utils.log("Player settlement not found.", "important");
            return;
        }
        
        // Calculate travel time
        const travelTime = calculateTravelTime(playerSettlement, targetSettlement, missionType);
        
        // Calculate total mission duration
        const totalDuration = missionType.preparationTime + (travelTime * 2) + 1; // Prep + travel there + trade + travel back
        
        // Calculate supplies needed
        const suppliesNeeded = calculateSuppliesNeeded(size, escorts, totalDuration);
        
        // Gather trade goods
        const goodInputs = document.querySelectorAll('.trade-good-input');
        const tradeGoods = {};
        let totalValue = 0;
        
        goodInputs.forEach(input => {
            const resource = input.dataset.resource;
            const amount = parseInt(input.value) || 0;
            const value = parseFloat(input.dataset.value) || 1;
            
            if (amount > 0) {
                tradeGoods[resource] = amount;
                totalValue += amount * value;
            }
        });
        
        // Verify we have enough resources
        for (const resource in tradeGoods) {
            const available = ResourceManager.getResources()[resource] || 0;
            if (tradeGoods[resource] > available) {
                Utils.log(`Not enough ${resource} available. Need ${tradeGoods[resource]}, have ${available}.`, "important");
                return;
            }
        }
        
        // Subtract resources
        const resourcesUsed = {
            ...tradeGoods,
            food: suppliesNeeded
        };
        
        const resourcesSubtracted = ResourceManager.subtractResources(resourcesUsed);
        
        if (!resourcesSubtracted) {
            Utils.log("Failed to allocate resources for trade mission.", "important");
            return;
        }
        
        // Remove traders and escorts from available pools
        if (typeof PopulationManager !== 'undefined') {
            // Subtract traders from workers
            if (typeof PopulationManager.assignWorkers === 'function' && size > 0) {
                // For now, simply reduce unassigned workers
                PopulationManager.assignWorkers('traders', size);
            }
        }
        
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.assignWarriors === 'function' && escorts > 0) {
            const warriorsAssigned = BuildingSystem.assignWarriors(escorts);
            
            if (!warriorsAssigned) {
                // Return resources and traders if warrior assignment fails
                ResourceManager.addResources(resourcesUsed);
                
                if (typeof PopulationManager !== 'undefined' && 
                    typeof PopulationManager.assignWorkers === 'function') {
                    PopulationManager.assignWorkers('traders', -size);
                }
                
                Utils.log("Failed to assign escorts to trade mission. Resources refunded.", "important");
                return;
            }
        }
        
        // Get current game date
        const gameDate = GameEngine.getGameState().date;
        
        // Get leader if available
        let leader = PopulationManager.getDynastyLeader();
        
        // Calculate trading power
        const tradingPower = size * (1 + (escorts * 0.1));
        
        // Create trade mission
        const mission = Object.assign({}, tradeMissionTemplate, {
            id: generateTradeMissionId(),
            name: generateTradeMissionName(targetSettlement.name, missionTypeId),
            missionType: missionTypeId,
            status: "preparing",
            targetSettlement: targetId,
            size: size,
            escorts: escorts,
            ships: ships,
            leader: leader,
            startDate: { ...gameDate },
            departureDate: { 
                // Add preparation time to current date
                day: gameDate.day + missionType.preparationTime,
                month: gameDate.month,
                season: gameDate.season,
                year: gameDate.year
            },
            estimatedReturnDate: {
                // Add total duration to current date
                day: gameDate.day + totalDuration,
                month: gameDate.month,
                season: gameDate.season,
                year: gameDate.year
            },
            daysRemaining: missionType.preparationTime,
            supplies: suppliesNeeded,
            goods: tradeGoods,
            tradingPower: tradingPower
        });
        
        // Add to active missions
        activeTradeMissions.push(mission);
        
        // Log mission start
        Utils.log(`A ${missionType.name} mission of ${size} traders with ${escorts} escorts has begun preparations to trade with ${targetSettlement.name}.`, "important");
        
        // Update UI
        updateMissionsList();
        
        // Reset form
        resetTradeForm();
    }
    
    /**
     * Reset the trade form
     */
    function resetTradeForm() {
        // Reset inputs to defaults
        document.getElementById('trade-mission-type').value = 'merchant_caravan';
        document.getElementById('trade-size').value = '5';
        document.getElementById('trade-escorts').value = '2';
        document.getElementById('trade-ships').value = '1';
        document.getElementById('trade-target').value = '';
        
        // Update form displays
        updateTradeForm();
        
        // Clear target info
        document.getElementById('target-info').innerHTML = '<p>Select a target to view information</p>';
    }
    
    /**
     * Update the active missions list
     */
    function updateMissionsList() {
        const missionsList = document.getElementById('active-missions-list');
        if (!missionsList) return;
        
        if (activeTradeMissions.length === 0) {
            missionsList.innerHTML = `
                <p class="no-missions-message">No active trade missions. Organize a new trade mission to exchange goods with other settlements.</p>
            `;
            return;
        }
        
        let html = '';
        
        activeTradeMissions.forEach(mission => {
            // Calculate progress percentage
            let progressPercent = 0;
            let phaseDuration = 0;
            let phaseElapsed = 0;
            
            const missionType = tradeMissionTypes[mission.missionType];
            
            if (mission.status === "preparing") {
                phaseDuration = missionType.preparationTime;
                phaseElapsed = phaseDuration - mission.daysRemaining;
                progressPercent = (phaseElapsed / phaseDuration) * 100;
            } else if (mission.status === "traveling" || mission.status === "returning") {
                // Get travel time based on settlements
                const playerSettlement = WorldMap.getPlayerSettlement();
                const targetSettlement = WorldMap.getSettlement(mission.targetSettlement);
                
                if (playerSettlement && targetSettlement) {
                    phaseDuration = calculateTravelTime(playerSettlement, targetSettlement, missionType);
                    phaseElapsed = phaseDuration - mission.daysRemaining;
                    progressPercent = (phaseElapsed / phaseDuration) * 100;
                }
            } else if (mission.status === "trading") {
                // Trading phase is typically 1 day
                phaseDuration = 1;
                phaseElapsed = 1 - mission.daysRemaining;
                progressPercent = (phaseElapsed / phaseDuration) * 100;
            } else if (mission.status === "completed" || mission.status === "failed") {
                progressPercent = 100;
            }
            
            // Format progress percentage
            progressPercent = Math.min(100, Math.max(0, progressPercent));
            
            // Get target settlement name
            let targetName = "Unknown Settlement";
            if (mission.targetSettlement) {
                const target = WorldMap.getSettlement(mission.targetSettlement);
                if (target) {
                    targetName = target.name;
                }
            }
            
            // Format status for display
            let statusText = mission.status.charAt(0).toUpperCase() + mission.status.slice(1);
            
            // Calculate remaining days based on status
            let remainingText = "";
            
            if (mission.status === "preparing") {
                remainingText = `Departing in ${mission.daysRemaining} days`;
            } else if (mission.status === "traveling") {
                remainingText = `Arriving in ${mission.daysRemaining} days`;
            } else if (mission.status === "trading") {
                remainingText = `Trading in progress`;
            } else if (mission.status === "returning") {
                remainingText = `Returning in ${mission.daysRemaining} days`;
            }
            
            html += `
                <div class="mission-card">
                    <div class="mission-header">
                        <div class="mission-title">${mission.name}</div>
                        <div class="mission-status status-${mission.status}">${statusText}</div>
                    </div>
                    <div class="mission-info">
                        <div><strong>Type:</strong> ${tradeMissionTypes[mission.missionType].name}</div>
                        <div><strong>Size:</strong> ${mission.size} traders, ${mission.escorts} escorts</div>
                        <div><strong>Target:</strong> ${targetName}</div>
                        <div><strong>Resources:</strong> ${Object.keys(mission.goods).length} types</div>
                        <div><strong>Supplies:</strong> ${Math.ceil(mission.supplies)}</div>
                        <div><strong>${remainingText}</strong></div>
                    </div>
                    <div class="mission-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="mission-actions">
                        <button class="mission-details-btn" data-mission-id="${mission.id}">Details</button>
                        ${mission.status === "completed" || mission.status === "failed" ? 
                            `<button class="mission-dismiss-btn" data-mission-id="${mission.id}">Dismiss</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        missionsList.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.mission-details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const missionId = this.dataset.missionId;
                showMissionDetails(missionId);
            });
        });
        
        document.querySelectorAll('.mission-dismiss-btn').forEach(button => {
            button.addEventListener('click', function() {
                const missionId = this.dataset.missionId;
                dismissMission(missionId);
            });
        });
    }
    
    /**
     * Show detailed information about a trade mission
     * @param {string} missionId - ID of the mission
     */
    function showMissionDetails(missionId) {
        const mission = activeTradeMissions.find(m => m.id === missionId);
        if (!mission) return;
        
        // Hide mission list and form, show details section
        document.querySelector('.active-missions-section').style.display = 'none';
        document.querySelector('.trade-form-section').style.display = 'none';
        document.getElementById('mission-details-section').style.display = 'block';
        
        // Get target settlement
        let targetName = "Unknown Settlement";
        let targetType = "";
        let targetRegion = "";
        
        if (mission.targetSettlement) {
            const target = WorldMap.getSettlement(mission.targetSettlement);
            if (target) {
                targetName = target.name;
                targetType = target.type;
                
                // Get region information
                const region = target.region ? WorldMap.getRegion(target.region) : null;
                if (region) {
                    targetRegion = region.name;
                }
            }
        }
        
        let statusClass = `status-${mission.status}`;
        let statusText = mission.status.charAt(0).toUpperCase() + mission.status.slice(1);
        
        // Calculate profit if mission is completed
        let profit = 0;
        let profitText = "N/A";
        
        if (mission.status === "completed" || mission.status === "returning") {
            // Calculate value of goods sent
            const outboundValue = calculateTotalGoodsValue(mission.goods);
            
            // Calculate value of goods returned
            const returnedValue = calculateTotalGoodsValue(mission.returns);
            
            profit = returnedValue - outboundValue;
            profitText = `${profit >= 0 ? '+' : ''}${profit} silver`;
        }
        
        // Build HTML
        let html = `
            <div class="mission-details-content">
                <div class="mission-header">
                    <h2>${mission.name}</h2>
                    <div class="mission-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="mission-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${mission.size}</div>
                        <div class="metric-label">Traders</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${mission.escorts}</div>
                        <div class="metric-label">Escorts</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${mission.casualties}</div>
                        <div class="metric-label">Casualties</div>
                    </div>
                </div>
                
                <div class="mission-summary">
                    <h3>Mission Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item"><strong>Type:</strong> ${tradeMissionTypes[mission.missionType].name}</div>
                        <div class="summary-item"><strong>Target:</strong> ${targetName} (${targetType})</div>
                        <div class="summary-item"><strong>Region:</strong> ${targetRegion}</div>
                        <div class="summary-item"><strong>Started:</strong> Year ${mission.startDate?.year}, Day ${mission.startDate?.day}</div>
                        <div class="summary-item"><strong>Current Phase:</strong> ${statusText}</div>
                        <div class="summary-item"><strong>Supplies:</strong> ${Math.ceil(mission.supplies)}</div>
                        <div class="summary-item"><strong>Days Remaining:</strong> ${mission.daysRemaining}</div>
                        <div class="summary-item"><strong>Profit:</strong> ${profitText}</div>
                    </div>
                </div>
                
                <!-- Show outbound goods -->
                <div class="goods-section">
                    <h3>Outbound Goods</h3>
                    <div class="goods-list">
                        ${Object.keys(mission.goods).length > 0 ? 
                            Object.entries(mission.goods).map(([resource, amount]) => `
                                <div class="good-item">
                                    <span class="good-name">${resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                                    <span class="good-amount">${amount}</span>
                                </div>
                            `).join('') : 
                            '<p>No outbound goods.</p>'
                        }
                    </div>
                </div>
                
                <!-- Show returned goods if any -->
                ${mission.status === "completed" || mission.status === "returning" ? `
                <div class="goods-section">
                    <h3>Returned Goods</h3>
                    <div class="goods-list">
                        ${Object.keys(mission.returns).length > 0 ? 
                            Object.entries(mission.returns).map(([resource, amount]) => `
                                <div class="good-item returns-item">
                                    <span class="good-name">${resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                                    <span class="good-amount">${amount}</span>
                                </div>
                            `).join('') : 
                            '<p>No goods returned yet.</p>'
                        }
                    </div>
                </div>
                ` : ''}
                
                <!-- Show leader if present -->
                ${mission.leader ? `
                <div class="leader-section">
                    <h3>Mission Leader</h3>
                    <div class="leader-card">
                        <div class="leader-name">${mission.leader.name}</div>
                        <div class="leader-details">
                            <div><strong>Age:</strong> ${Math.floor(mission.leader.age)}</div>
                            <div><strong>Trading:</strong> ${mission.leader.skills?.trading || mission.leader.skills?.leadership || 0}</div>
                            <div><strong>Leadership:</strong> ${mission.leader.skills?.leadership || 0}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Show risk events if any occurred -->
                ${mission.events && mission.events.length > 0 ? `
                <div class="events-section">
                    <h3>Mission Events</h3>
                    ${mission.events.map(event => `
                        <div class="risk-event">
                            <div class="risk-event-title">${event.title}</div>
                            <div class="risk-event-description">${event.description}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        
        // Update details content
        document.getElementById('mission-details-content').innerHTML = html;
    }
    
    /**
     * Dismiss a trade mission from the list
     * @param {string} missionId - ID of the mission
     */
    function dismissMission(missionId) {
        const missionIndex = activeTradeMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1) return;
        
        // Only completed or failed missions can be dismissed
        const mission = activeTradeMissions[missionIndex];
        if (mission.status !== "completed" && mission.status !== "failed") {
            Utils.log("Cannot dismiss an active trade mission.", "important");
            return;
        }
        
        // Add to trade history before removing
        tradeHistory.push({
            ...mission,
            dismissedAt: GameEngine.getGameState().date
        });
        
        // Remove from active missions
        activeTradeMissions.splice(missionIndex, 1);
        
        // Update UI
        updateMissionsList();
        
        // Log dismissal
        Utils.log(`The ${mission.name} trade mission has been disbanded.`);
    }
    
    /**
     * Process active trade missions for a game tick
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of the game tick in days
     */
    function processTick(gameState, tickSize) {
        // Skip if no active missions or tick size is 0
        if (activeTradeMissions.length === 0 || tickSize <= 0) return;
        
        let uiNeedsUpdate = false;
        
        // Process each mission
        for (let i = activeTradeMissions.length - 1; i >= 0; i--) {
            const mission = activeTradeMissions[i];
            
            // Skip completed or failed missions
            if (mission.status === "completed" || mission.status === "failed") {
                continue;
            }
            
            // Update days remaining
            mission.daysRemaining -= tickSize;
            
            // Consume supplies (for all people in the mission)
            const dailyConsumption = (mission.size + mission.escorts) * tickSize;
            mission.supplies -= dailyConsumption;
            
            // Check for supply depletion
            if (mission.supplies <= 0) {
                // Add event
                mission.events = mission.events || [];
                mission.events.push({
                    title: "Supplies Exhausted",
                    description: "The trading party has run out of supplies. They must hurry to complete their mission or face starvation."
                });
                
                // Chance of casualties from starvation
                if (Utils.chanceOf(10 * tickSize)) {
                    const casualties = Math.max(1, Math.ceil((mission.size + mission.escorts) * 0.1));
                    
                    // Determine who dies (traders or escorts)
                    let traderCasualties = 0;
                    let escortCasualties = 0;
                    
                    if (mission.size > 0 && mission.escorts > 0) {
                        // Distribute casualties proportionally
                        traderCasualties = Math.min(mission.size, Math.ceil(casualties * (mission.size / (mission.size + mission.escorts))));
                        escortCasualties = Math.min(mission.escorts, casualties - traderCasualties);
                    } else if (mission.size > 0) {
                        traderCasualties = Math.min(mission.size, casualties);
                    } else if (mission.escorts > 0) {
                        escortCasualties = Math.min(mission.escorts, casualties);
                    }
                    
                    // Apply casualties
                    mission.size -= traderCasualties;
                    mission.escorts -= escortCasualties;
                    mission.casualties += traderCasualties + escortCasualties;
                    
                    // Add event
                    mission.events.push({
                        title: "Starvation",
                        description: `${traderCasualties + escortCasualties} members of the trading party have died from starvation.`
                    });
                    
                    // Log starvation
                    Utils.log(`The ${mission.name} trade mission is suffering from starvation. ${traderCasualties + escortCasualties} people have died.`, "danger");
                }
                
                // If entire party is lost, mission fails
                if (mission.size <= 0 && mission.escorts <= 0) {
                    mission.status = "failed";
                    mission.daysRemaining = 0;
                    
                    // Add event
                    mission.events.push({
                        title: "Mission Failed",
                        description: "The entire trading party has perished. None will return to tell the tale."
                    });
                    
                    // Log failure
                    Utils.log(`The ${mission.name} trade mission has been lost. No survivors will return.`, "danger");
                    
                    uiNeedsUpdate = true;
                    continue;
                }
            }
            
            // Check if current phase is complete
            if (mission.daysRemaining <= 0) {
                // Transition to next phase based on current status
                switch (mission.status) {
                    case "preparing":
                        // Move to traveling phase
                        mission.status = "traveling";
                        
                        // Calculate travel time
                        const playerSettlement = WorldMap.getPlayerSettlement();
                        const targetSettlement = WorldMap.getSettlement(mission.targetSettlement);
                        const missionType = tradeMissionTypes[mission.missionType];
                        
                        if (playerSettlement && targetSettlement && missionType) {
                            const travelTime = calculateTravelTime(playerSettlement, targetSettlement, missionType);
                            mission.daysRemaining = travelTime;
                            
                            // Add event
                            mission.events = mission.events || [];
                            mission.events.push({
                                title: "Trade Mission Departs",
                                description: `The trading party has left your settlement, heading towards ${targetSettlement.name}.`
                            });
                            
                            // Log status
                            Utils.log(`The ${mission.name} trade mission has departed and is now traveling to ${targetSettlement.name}.`, "important");
                        } else {
                            // Fallback if something is missing
                            mission.daysRemaining = 5;
                        }
                        
                        // Check for risk events during travel
                        const riskLevel = calculateRiskLevel(mission, targetSettlement);
                        const riskEvent = processTradeRiskEvent(mission, riskLevel);
                        
                        if (riskEvent) {
                            // Add event
                            mission.events.push({
                                title: riskEvent.event.title,
                                description: riskEvent.fullDescription
                            });
                            
                            // Apply casualties
                            if (riskEvent.casualties > 0) {
                                // Determine who gets casualties (priority to escorts)
                                let escortCasualties = Math.min(mission.escorts, riskEvent.casualties);
                                let traderCasualties = riskEvent.casualties - escortCasualties;
                                
                                mission.escorts -= escortCasualties;
                                mission.size -= traderCasualties;
                                mission.casualties += riskEvent.casualties;
                                
                                // Log casualties
                                if (riskEvent.casualties > 0) {
                                    Utils.log(`The ${mission.name} trade mission was attacked! ${riskEvent.casualties} casualties sustained.`, "danger");
                                }
                            }
                            
                            // Apply goods loss if failure
                            if (!riskEvent.success && riskEvent.goodsLostPercent > 0) {
                                const lossPercentage = riskEvent.goodsLostPercent / 100;
                                
                                // Reduce outbound goods
                                for (const resource in mission.goods) {
                                    const amountLost = Math.ceil(mission.goods[resource] * lossPercentage);
                                    mission.goods[resource] -= amountLost;
                                    
                                    // Remove if reduced to 0
                                    if (mission.goods[resource] <= 0) {
                                        delete mission.goods[resource];
                                    }
                                }
                                
                                // Log goods loss
                                Utils.log(`The ${mission.name} trade mission lost ${riskEvent.goodsLostPercent}% of their trade goods in the incident.`, "danger");
                            }
                            
                            // If entire party is lost, mission fails
                            if (mission.size <= 0 && mission.escorts <= 0) {
                                mission.status = "failed";
                                mission.daysRemaining = 0;
                                
                                // Log failure
                                Utils.log(`The ${mission.name} trade mission has been lost. No survivors will return.`, "danger");
                                
                                uiNeedsUpdate = true;
                                continue;
                            }
                        }
                        break;
                        
                    case "traveling":
                        // Move to trading phase
                        mission.status = "trading";
                        mission.daysRemaining = 1; // Trading typically takes 1 day
                        
                        // Add event
                        mission.events = mission.events || [];
                        mission.events.push({
                            title: "Arrived at Target",
                            description: `The trading party has reached ${targetSettlement?.name || "the target"} and is now trading.`
                        });
                        
                        // Process the actual trading
                        const tradingResult = processTradingPhase(mission);
                        
                        // Apply trading results
                        if (tradingResult.success) {
                            // Set returns
                            mission.returns = tradingResult.returns;
                            mission.profit = tradingResult.profit;
                            
                            // Update diplomatic relations
                            const playerSettlement = WorldMap.getPlayerSettlement();
                            const targetSettlement = WorldMap.getSettlement(mission.targetSettlement);
                            
                            if (playerSettlement && targetSettlement && targetSettlement.relations) {
                                // Current relation
                                const currentRelation = targetSettlement.relations[playerSettlement.id] || 50;
                                
                                // Apply diplomatic change
                                const newRelation = Math.max(0, Math.min(100, currentRelation + tradingResult.diplomaticChange));
                                targetSettlement.relations[playerSettlement.id] = newRelation;
                                
                                mission.diplomaticGain = tradingResult.diplomaticChange;
                                
                                // Log significant diplomatic change
                                if (tradingResult.diplomaticChange >= 5) {
                                    Utils.log(`Relations with ${targetSettlement.name} have improved significantly.`, "success");
                                }
                            }
                            
                            // Log success
                            Utils.log(`The ${mission.name} trade mission has successfully traded goods.`, "success");
                        } else {
                            // Trading failed
                            mission.events.push({
                                title: "Trading Failed",
                                description: tradingResult.message
                            });
                            
                            // Log failure
                            Utils.log(`The ${mission.name} trade mission was unsuccessful: ${tradingResult.message}`, "danger");
                        }
                        
                        // Add risk event if any
                        if (tradingResult.riskEvent) {
                            mission.events.push({
                                title: tradingResult.riskEvent.event.title,
                                description: tradingResult.riskEvent.fullDescription
                            });
                            
                            // Apply casualties
                            if (tradingResult.casualties > 0) {
                                mission.casualties += tradingResult.casualties;
                                mission.size = Math.max(0, mission.size - tradingResult.casualties);
                            }
                        }
                        break;
                        
                    case "trading":
                        // Move to returning phase
                        mission.status = "returning";
                        
                        // Calculate return travel time
                        const pSettlement = WorldMap.getPlayerSettlement();
                        const tSettlement = WorldMap.getSettlement(mission.targetSettlement);
                        const mType = tradeMissionTypes[mission.missionType];
                        
                        if (pSettlement && tSettlement && mType) {
                            const travelTime = calculateTravelTime(pSettlement, tSettlement, mType);
                            mission.daysRemaining = travelTime;
                            
                            // Add event
                            mission.events.push({
                                title: "Returning Home",
                                description: `The trading party is now returning to your settlement.`
                            });
                            
                            // Log status
                            Utils.log(`The ${mission.name} trade mission has completed trading and is now returning home.`, "important");
                        } else {
                            // Fallback
                            mission.daysRemaining = 5;
                        }
                        
                        // Check for risk events during return journey
                        const returnRiskLevel = calculateRiskLevel(mission, tSettlement);
                        const returnRiskEvent = processTradeRiskEvent(mission, returnRiskLevel);
                        
                        if (returnRiskEvent) {
                            // Add event
                            mission.events.push({
                                title: returnRiskEvent.event.title,
                                description: returnRiskEvent.fullDescription
                            });
                            
                            // Apply casualties
                            if (returnRiskEvent.casualties > 0) {
                                // Determine who gets casualties (priority to escorts)
                                let escortCasualties = Math.min(mission.escorts, returnRiskEvent.casualties);
                                let traderCasualties = returnRiskEvent.casualties - escortCasualties;
                                
                                mission.escorts -= escortCasualties;
                                mission.size -= traderCasualties;
                                mission.casualties += returnRiskEvent.casualties;
                                
                                // Log casualties
                                if (returnRiskEvent.casualties > 0) {
                                    Utils.log(`The returning ${mission.name} trade mission was attacked! ${returnRiskEvent.casualties} casualties sustained.`, "danger");
                                }
                            }
                            
                            // Apply goods loss if failure
                            if (!returnRiskEvent.success && returnRiskEvent.goodsLostPercent > 0) {
                                const lossPercentage = returnRiskEvent.goodsLostPercent / 100;
                                
                                // Reduce returned goods
                                for (const resource in mission.returns) {
                                    const amountLost = Math.ceil(mission.returns[resource] * lossPercentage);
                                    mission.returns[resource] -= amountLost;
                                    
                                    // Remove if reduced to 0
                                    if (mission.returns[resource] <= 0) {
                                        delete mission.returns[resource];
                                    }
                                }
                                
                                // Log goods loss
                                Utils.log(`The ${mission.name} trade mission lost ${returnRiskEvent.goodsLostPercent}% of their traded goods in the incident.`, "danger");
                            }
                            
                            // If entire party is lost, mission fails
                            if (mission.size <= 0 && mission.escorts <= 0) {
                                mission.status = "failed";
                                mission.daysRemaining = 0;
                                
                                // Log failure
                                Utils.log(`The ${mission.name} trade mission has been lost on the return journey. No survivors will return.`, "danger");
                                
                                uiNeedsUpdate = true;
                                continue;
                            }
                        }
                        break;
                        
                    case "returning":
                        // Mission completed
                        mission.status = "completed";
                        mission.daysRemaining = 0;
                        
                        // Add event
                        mission.events.push({
                            title: "Mission Completed",
                            description: `The trading party has returned to your settlement.`
                        });
                        
                        // Process mission completion
                        processMissionCompletion(mission);
                        break;
                }
                
                uiNeedsUpdate = true;
            }
        }
        
        // Update UI if needed
        if (uiNeedsUpdate) {
            updateMissionsList();
        }
    }
    
    /**
     * Process the completion of a trade mission
     * @param {Object} mission - Trade mission object
     */
    function processMissionCompletion(mission) {
        // Log mission completion
        Utils.log(`The ${mission.name} trade mission has returned to your settlement.`, "success");
        
        // Award resources from trading
        if (typeof ResourceManager !== 'undefined' && ResourceManager.addResources && Object.keys(mission.returns).length > 0) {
            ResourceManager.addResources(mission.returns);
            
            // Format resources for log message
            const resourcesString = Object.entries(mission.returns)
                .map(([resource, amount]) => `${Math.floor(amount)} ${resource}`)
                .join(', ');
            
            Utils.log(`The traders have brought back: ${resourcesString}.`, "success");
        }
        
        // Return traders and escorts to available pools
        if (typeof PopulationManager !== 'undefined') {
            // Return traders to workers
            if (typeof PopulationManager.assignWorkers === 'function' && mission.size > 0) {
                // For now, simply add to unassigned workers
                PopulationManager.assignWorkers('traders', -mission.size);
            }
        }
        
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.returnWarriors === 'function' && mission.escorts > 0) {
            BuildingSystem.returnWarriors(mission.escorts);
        }
        
        // Award fame based on profit
        if (typeof RankManager !== 'undefined' && typeof RankManager.addFame === 'function') {
            // Calculate fame based on profit
            const profit = mission.profit || 0;
            
            if (profit > 0) {
                const fame = Math.min(20, Math.ceil(profit / 10));
                RankManager.addFame(fame, `Successful trade mission with ${profit} profit`);
            } else {
                // Small fame for completing mission even without profit
                RankManager.addFame(1, `Completed trade mission`);
            }
        }
        
        // Add completed mission to history
        tradeHistory.push({
            ...mission,
            completedAt: GameEngine.getGameState().date
        });
    }
    
    // Public API
    return {
        /**
         * Initialize the trade manager
         */
        init: function() {
            console.log("Initializing Trade Manager...");
            
            // Create UI
            createTradingUI();
            
            // Register world action button
            const tradeButton = document.getElementById('btn-trade');
            if (tradeButton) {
                tradeButton.disabled = false;
                tradeButton.addEventListener('click', () => {
                    NavigationSystem.registerPanel('trade-panel', 'world');
                    NavigationSystem.switchToTab('world');
                });
            }
            
            console.log("Trade Manager initialized");
        },
        
        /**
         * Process active trade missions for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            processTick(gameState, tickSize);
        },
        
        /**
         * Get active trade missions
         * @returns {Array} - Array of active trade missions
         */
        getActiveMissions: function() {
            return [...activeTradeMissions];
        },
        
        /**
         * Get trade mission types
         * @returns {Object} - Object containing mission type definitions
         */
        getMissionTypes: function() {
            return { ...tradeMissionTypes };
        },
        
        /**
         * Get trade history
         * @returns {Array} - Array of completed trade missions
         */
        getTradeHistory: function() {
            return [...tradeHistory];
        },
        
        /**
         * Calculate buying price for a resource at a settlement
         * @param {string} resource - Resource type
         * @param {Object} settlement - Settlement object
         * @returns {number} - Price in silver
         */
        calculateBuyingPrice: calculateBuyingPrice,
        
        /**
         * Calculate selling price for a resource at a settlement
         * @param {string} resource - Resource type
         * @param {Object} settlement - Settlement object
         * @returns {number} - Price in silver
         */
        calculateSellingPrice: calculateSellingPrice,
        
        /**
         * Evaluate targets for trading
         * @param {Array} settlements - Settlements to evaluate
         * @param {Object} playerSettlement - Player's settlement
         * @param {string} missionTypeId - Type of trade mission
         * @returns {Array} - Sorted array of targets with scores
         */
        evaluateTradeTargets: evaluateTradeTargets,
        
        /**
         * Update the missions UI
         */
        updateUI: function() {
            updateMissionsList();
        },
        
        /**
         * Get a mission by its ID
         * @param {string} missionId - ID of the mission
         * @returns {Object|undefined} - Mission object or undefined if not found
         */
        getMission: function(missionId) {
            return activeTradeMissions.find(m => m.id === missionId);
        },
        
        /**
         * Get base trade prices
         * @returns {Object} - Object containing base trade prices
         */
        getBaseTradePrices: function() {
            return { ...tradePrices.baseValues };
        }
    };
})();

/**
 * Integration with GameEngine
 * Register the processTick method to be called each game tick
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when DOM is loaded
    if (typeof GameEngine !== 'undefined') {
        GameEngine.registerTickProcessor(TradeManager.processTick);
    }
    
    // Initialize TradeManager when game is ready
    if (typeof GameEngine !== 'undefined' && typeof GameEngine.init === 'function') {
        // Wait for GameEngine to initialize first
        const originalInit = GameEngine.init;
        GameEngine.init = function() {
            originalInit.apply(GameEngine);
            TradeManager.init();
        };
    } else {
        // Fallback: Initialize directly
        TradeManager.init();
    }
});