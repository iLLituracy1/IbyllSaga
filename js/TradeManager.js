/**
 * Viking Legacy - Trade and Merchant System
 * Handles trade routes, merchants, markets, and commerce
 */

const TradeManager = (function() {
    // Constants
    const TRADE_GOODS = {
        FOOD: {
            id: "food",
            name: "Food",
            description: "Staple goods including grain, meat, and preserved foods.",
            baseValue: 1,
            weight: 1,
            isBasic: true,
            maxSupply: 500,
            valueFluctuation: 0.2, // How much price can fluctuate
            seasonalEffect: {
                Spring: 0.8, // More available in spring
                Summer: 0.7, // Most available in summer
                Fall: 0.9,  // Less available in fall
                Winter: 1.5  // Scarce in winter
            }
        },
        WOOD: {
            id: "wood",
            name: "Wood",
            description: "Lumber for construction and crafting.",
            baseValue: 1.5,
            weight: 2,
            isBasic: true,
            maxSupply: 400,
            valueFluctuation: 0.1,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 0.9,
                Fall: 1.0,
                Winter: 1.2
            }
        },
        STONE: {
            id: "stone",
            name: "Stone",
            description: "Quarried stone for building and fortification.",
            baseValue: 2,
            weight: 3,
            isBasic: true,
            maxSupply: 300,
            valueFluctuation: 0.1,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 0.9,
                Fall: 1.0,
                Winter: 1.3
            }
        },
        METAL: {
            id: "metal",
            name: "Metal",
            description: "Iron and other metals for tools and weapons.",
            baseValue: 3,
            weight: 2,
            isBasic: true,
            maxSupply: 200,
            valueFluctuation: 0.15,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.1
            }
        },
        SALT: {
            id: "salt",
            name: "Salt",
            description: "Essential for preserving food and valuable for trade.",
            baseValue: 4,
            weight: 1,
            isBasic: false,
            maxSupply: 150,
            valueFluctuation: 0.2,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 0.9,
                Fall: 1.0,
                Winter: 1.2
            }
        },
        SPICES: {
            id: "spices",
            name: "Spices",
            description: "Exotic spices from distant lands, highly valued.",
            baseValue: 8,
            weight: 0.5,
            isBasic: false,
            maxSupply: 50,
            valueFluctuation: 0.3,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.2
            }
        },
        FURS: {
            id: "furs",
            name: "Furs",
            description: "Valuable pelts and furs from northern animals.",
            baseValue: 6,
            weight: 1,
            isBasic: false,
            maxSupply: 100,
            valueFluctuation: 0.25,
            seasonalEffect: {
                Spring: 1.2,
                Summer: 1.4,
                Fall: 1.0,
                Winter: 0.7 // More available in winter
            }
        },
        TEXTILES: {
            id: "textiles",
            name: "Textiles",
            description: "Woven fabrics including wool, linen, and silk.",
            baseValue: 5,
            weight: 0.8,
            isBasic: false,
            maxSupply: 120,
            valueFluctuation: 0.2,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 0.9,
                Fall: 1.0,
                Winter: 1.1
            }
        },
        SLAVES: {
            id: "slaves",
            name: "Thralls",
            description: "Captured people sold into servitude, a valuable Viking trade.",
            baseValue: 25,
            weight: 2,
            isBasic: false,
            maxSupply: 30,
            valueFluctuation: 0.2,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.1
            }
        },
        AMBER: {
            id: "amber",
            name: "Amber",
            description: "Fossilized tree resin prized for jewelry and decoration.",
            baseValue: 15,
            weight: 0.2,
            isBasic: false,
            maxSupply: 40,
            valueFluctuation: 0.3,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.0
            }
        },
        WINE: {
            id: "wine",
            name: "Wine",
            description: "Alcoholic beverage primarily from the southern lands.",
            baseValue: 10,
            weight: 1.2,
            isBasic: false,
            maxSupply: 80,
            valueFluctuation: 0.2,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 0.9,
                Fall: 1.1,
                Winter: 1.2
            }
        },
        HONEY: {
            id: "honey",
            name: "Honey",
            description: "Sweet substance used for mead and medicine.",
            baseValue: 7,
            weight: 0.8,
            isBasic: false,
            maxSupply: 90,
            valueFluctuation: 0.15,
            seasonalEffect: {
                Spring: 0.9,
                Summer: 0.8,
                Fall: 1.0,
                Winter: 1.3
            }
        },
        WEAPONS: {
            id: "weapons",
            name: "Weapons",
            description: "Crafted weapons including swords, axes and spears.",
            baseValue: 12,
            weight: 1.5,
            isBasic: false,
            maxSupply: 60,
            valueFluctuation: 0.1,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.0
            }
        },
        JEWELRY: {
            id: "jewelry",
            name: "Jewelry",
            description: "Precious ornaments made of silver, gold, and gemstones.",
            baseValue: 20,
            weight: 0.3,
            isBasic: false,
            maxSupply: 30,
            valueFluctuation: 0.25,
            seasonalEffect: {
                Spring: 1.0,
                Summer: 1.0,
                Fall: 1.0,
                Winter: 1.0
            }
        }
    };
    
    const MARKET_TYPES = {
        VILLAGE_MARKET: {
            id: "village_market",
            name: "Village Market",
            description: "A small local market with basic goods.",
            size: 1,
            wealthFactor: 0.5,
            goodsAvailability: {
                basic: 1.0,
                luxury: 0.2
            },
            priceModifier: 1.2, // Higher prices in small markets
            refreshRate: 14 // Days to refresh inventory
        },
        TOWN_MARKET: {
            id: "town_market",
            name: "Town Market",
            description: "A moderately sized market with a good selection of goods.",
            size: 2,
            wealthFactor: 1.0,
            goodsAvailability: {
                basic: 1.0,
                luxury: 0.5
            },
            priceModifier: 1.0,
            refreshRate: 7
        },
        TRADE_HUB: {
            id: "trade_hub",
            name: "Trade Hub",
            description: "A large market center with extensive trade networks.",
            size: 3,
            wealthFactor: 2.0,
            goodsAvailability: {
                basic: 1.0,
                luxury: 0.8
            },
            priceModifier: 0.9, // Lower prices in larger markets
            refreshRate: 3
        },
        PORT_MARKET: {
            id: "port_market",
            name: "Port Market",
            description: "A coastal market with access to sea trade routes.",
            size: 3,
            wealthFactor: 1.5,
            goodsAvailability: {
                basic: 1.0,
                luxury: 0.7
            },
            priceModifier: 0.8,
            refreshRate: 5,
            specialties: ["salt", "spices", "textiles", "wine"]
        }
    };
    
    // Private variables
    let markets = [];
    let tradeRoutes = [];
    let merchantShips = [];
    let playerInventory = {
        cargo: {},
        capacity: 100, // Starting cargo capacity
        tradingSkill: 1
    };
    
    // Private methods
    
    /**
     * Generate market price for a good based on various factors
     * @param {Object} market - Market information
     * @param {string} goodId - Trade good ID
     * @param {string} season - Current season
     * @param {boolean} isBuying - Whether player is buying (true) or selling (false)
     * @returns {number} - Calculated price
     */
    function calculateGoodPrice(market, goodId, season, isBuying) {
        const good = TRADE_GOODS[goodId.toUpperCase()];
        if (!good) return 0;
        
        // Base price
        let price = good.baseValue;
        
        // Apply market type modifier
        price *= market.priceModifier;
        
        // Apply seasonal effect
        if (good.seasonalEffect && good.seasonalEffect[season]) {
            price *= good.seasonalEffect[season];
        }
        
        // Apply supply/demand - more supply = lower prices, higher demand = higher prices
        const supplyRatio = market.inventory[goodId] / (good.maxSupply * market.size);
        price *= (1 - (supplyRatio * 0.3)); // Adjust price down as supply increases
        
        // Apply regional modifiers
        if (market.region && market.region.regionalModifiers && market.region.regionalModifiers[goodId]) {
            price *= market.region.regionalModifiers[goodId];
        }
        
        // Apply buying/selling spread
        if (isBuying) {
            price *= 1.2; // 20% markup when buying
        } else {
            price *= 0.8; // 20% markdown when selling
        }
        
        // Apply random fluctuation (market conditions, etc.)
        const fluctuation = 1 + ((Math.random() * 2 - 1) * good.valueFluctuation);
        price *= fluctuation;
        
        // Round to nearest 0.1
        return Math.round(price * 10) / 10;
    }
    
    /**
     * Create a market for a region
     * @param {Object} region - Region information
     * @returns {Object} - Created market
     */
    function createMarketForRegion(region) {
        // Determine market type based on region
        let marketTypeId = "village_market"; // Default
        
        if (region.type === "coastline") {
            marketTypeId = "port_market";
        } else if (region.settlementSize && region.settlementSize > 2) {
            marketTypeId = "trade_hub";
        } else if (region.settlementSize && region.settlementSize > 1) {
            marketTypeId = "town_market";
        }
        
        const marketType = MARKET_TYPES[marketTypeId.toUpperCase()];
        
        // Generate inventory based on market type
        const inventory = {};
        const prices = {
            buy: {},
            sell: {}
        };
        
        for (const goodId in TRADE_GOODS) {
            const good = TRADE_GOODS[goodId];
            
            // Determine quantity based on market size and good type
            let quantity = 0;
            
            if (good.isBasic) {
                // Basic goods always available
                quantity = Math.floor(good.maxSupply * marketType.goodsAvailability.basic * marketType.size * Math.random());
            } else {
                // Luxury goods less available
                quantity = Math.floor(good.maxSupply * marketType.goodsAvailability.luxury * marketType.size * Math.random());
                
                // Some markets specialize in certain goods
                if (marketType.specialties && marketType.specialties.includes(good.id)) {
                    quantity *= 2; // Double quantity for specialty goods
                }
            }
            
            // Add to inventory
            inventory[good.id] = quantity;
            
            // Pre-calculate prices for UI
            prices.buy[good.id] = calculateGoodPrice(
                { priceModifier: marketType.priceModifier, inventory, region, size: marketType.size },
                good.id,
                "Spring", // Will be updated with actual season later
                true
            );
            
            prices.sell[good.id] = calculateGoodPrice(
                { priceModifier: marketType.priceModifier, inventory, region, size: marketType.size },
                good.id,
                "Spring",
                false
            );
        }
        
        // Create market
        const market = {
            id: `market_${region.id}`,
            name: `${region.name} ${marketType.name}`,
            type: marketTypeId,
            regionId: region.id,
            faction: region.ownerId,
            inventory: inventory,
            prices: prices,
            wealth: Math.floor(1000 * marketType.wealthFactor * (Math.random() + 0.5)),
            lastRefresh: 0,
            refreshRate: marketType.refreshRate,
            size: marketType.size,
            priceModifier: marketType.priceModifier,
            region: region
        };
        
        return market;
    }
    
    /**
     * Create a trade route between two markets
     * @param {Object} market1 - First market
     * @param {Object} market2 - Second market
     * @returns {Object} - Created trade route
     */
    function createTradeRoute(market1, market2) {
        // Calculate route properties
        const region1 = WorldGenerator.getRegionById(market1.regionId);
        const region2 = WorldGenerator.getRegionById(market2.regionId);
        
        if (!region1 || !region2) return null;
        
        // Determine if sea route or land route
        const isSea = region1.type === "coastline" && region2.type === "coastline";
        
        // Calculate distance and travel time
        let distance = 1; // Default
        let travelTime = 1; // Default in days
        
        // In a full implementation, this would do proper pathfinding
        // For now, use a simplified approach
        if (isSea) {
            // Sea routes are faster but more dangerous
            distance = Utils.randomBetween(3, 10);
            travelTime = distance;
        } else {
            // Land routes depend on terrain and distance
            distance = Utils.randomBetween(2, 8);
            travelTime = distance * 1.5;
        }
        
        // Calculate danger level (1-5)
        let dangerLevel = 1;
        
        // Adjust for route type
        if (isSea) {
            dangerLevel += 1; // Sea routes more dangerous
        }
        
        // Adjust for distance
        dangerLevel += Math.floor(distance / 3);
        
        // Adjust for faction relations
        const faction1 = FactionManager.getFactionById(region1.ownerId);
        const faction2 = FactionManager.getFactionById(region2.ownerId);
        
        if (faction1 && faction2 && faction1.id !== faction2.id) {
            const relation = FactionManager.getRelation(faction1.id, faction2.id);
            
            if (relation < -50) {
                dangerLevel += 2; // Very hostile
            } else if (relation < 0) {
                dangerLevel += 1; // Somewhat hostile
            }
        }
        
        // Clamp danger level
        dangerLevel = Math.max(1, Math.min(5, dangerLevel));
        
        // Create route
        const route = {
            id: `route_${market1.id}_${market2.id}`,
            markets: [market1.id, market2.id],
            isSea: isSea,
            distance: distance,
            travelTime: travelTime,
            dangerLevel: dangerLevel,
            profitPotential: calculateRouteProfitPotential(market1, market2)
        };
        
        return route;
    }
    
    /**
     * Calculate profit potential between two markets
     * @param {Object} market1 - First market
     * @param {Object} market2 - Second market
     * @returns {number} - Profit potential score (higher is better)
     */
    function calculateRouteProfitPotential(market1, market2) {
        let potentialScore = 0;
        
        // Compare prices for each good
        for (const goodId in TRADE_GOODS) {
            const good = TRADE_GOODS[goodId];
            
            // Check if both markets have this good
            if (market1.prices.buy[good.id] && market2.prices.sell[good.id]) {
                // Calculate price differential
                const buyPrice = market1.prices.buy[good.id];
                const sellPrice = market2.prices.sell[good.id];
                
                // If selling price is higher than buying price, there's profit potential
                const priceDiff = sellPrice - buyPrice;
                if (priceDiff > 0) {
                    // Add to score, weighted by good's base value
                    potentialScore += priceDiff * good.baseValue;
                }
            }
            
            // Do the same in reverse direction
            if (market2.prices.buy[good.id] && market1.prices.sell[good.id]) {
                const buyPrice = market2.prices.buy[good.id];
                const sellPrice = market1.prices.sell[good.id];
                
                const priceDiff = sellPrice - buyPrice;
                if (priceDiff > 0) {
                    potentialScore += priceDiff * good.baseValue;
                }
            }
        }
        
        return potentialScore;
    }
    
    /**
     * Refresh market inventory and prices
     * @param {Object} market - Market to refresh
     * @param {string} season - Current season
     */
    function refreshMarket(market, season) {
        const marketType = MARKET_TYPES[market.type.toUpperCase()];
        if (!marketType) return;
        
        // Generate new inventory
        for (const goodId in TRADE_GOODS) {
            const good = TRADE_GOODS[goodId];
            
            // Determine base quantity
            let baseQuantity = 0;
            
            if (good.isBasic) {
                baseQuantity = Math.floor(good.maxSupply * marketType.goodsAvailability.basic * market.size);
            } else {
                baseQuantity = Math.floor(good.maxSupply * marketType.goodsAvailability.luxury * market.size);
                
                // Special goods for market type
                if (marketType.specialties && marketType.specialties.includes(good.id)) {
                    baseQuantity *= 2;
                }
            }
            
            // Add random variation
            const variation = 0.5 + Math.random();
            let newQuantity = Math.floor(baseQuantity * variation);
            
            // Ensure basic goods are always available
            if (good.isBasic && newQuantity < 5) {
                newQuantity = 5;
            }
            
            // Update inventory
            market.inventory[good.id] = newQuantity;
            
            // Update prices
            market.prices.buy[good.id] = calculateGoodPrice(market, good.id, season, true);
            market.prices.sell[good.id] = calculateGoodPrice(market, good.id, season, false);
        }
        
        // Update last refresh time
        market.lastRefresh = GameEngine.getGameState().date.day;
    }
    
    // Public API
    return {
        /**
         * Initialize the trade manager
         */
        init: function() {
            console.log("Trade Manager initialized");
            
            // Reset variables
            markets = [];
            tradeRoutes = [];
            merchantShips = [];
            playerInventory = {
                cargo: {},
                capacity: 100,
                tradingSkill: 1
            };
        },
        
        /**
         * Generate markets and trade routes for the world
         * @param {Object} worldData - World data from WorldGenerator
         */
        generateWorldTrade: function(worldData) {
            console.log("Generating markets and trade routes...");
            
            // Create markets for discovered regions
            worldData.regions.forEach(region => {
                // Only create markets for regions with settlements
                // In a full implementation, would check if region has a settlement
                if (region.discoveredByPlayer || Math.random() > 0.7) {
                    const market = createMarketForRegion(region);
                    markets.push(market);
                }
            });
            
            // Create trade routes between markets
            for (let i = 0; i < markets.length; i++) {
                for (let j = i + 1; j < markets.length; j++) {
                    const route = createTradeRoute(markets[i], markets[j]);
                    if (route) {
                        tradeRoutes.push(route);
                    }
                }
            }
            
            console.log(`Generated ${markets.length} markets and ${tradeRoutes.length} trade routes.`);
        },
        
        /**
         * Get trade goods information
         * @returns {Object} - Trade goods information
         */
        getTradeGoods: function() {
            return { ...TRADE_GOODS };
        },
        
        /**
         * Get markets
         * @returns {Array} - Array of markets
         */
        getMarkets: function() {
            return [...markets];
        },
        
        /**
         * Get market by ID
         * @param {string} marketId - Market ID
         * @returns {Object|null} - Market object or null if not found
         */
        getMarketById: function(marketId) {
            return markets.find(m => m.id === marketId) || null;
        },
        
        /**
         * Get market by region ID
         * @param {string} regionId - Region ID
         * @returns {Object|null} - Market object or null if not found
         */
        getMarketByRegion: function(regionId) {
            return markets.find(m => m.regionId === regionId) || null;
        },
        
        /**
         * Get trade routes
         * @returns {Array} - Array of trade routes
         */
        getTradeRoutes: function() {
            return [...tradeRoutes];
        },
        
        /**
         * Get trade routes for a market
         * @param {string} marketId - Market ID
         * @returns {Array} - Array of trade routes
         */
        getRoutesForMarket: function(marketId) {
            return tradeRoutes.filter(r => r.markets.includes(marketId));
        },
        
        /**
         * Get player inventory
         * @returns {Object} - Player inventory
         */
        getPlayerInventory: function() {
            return { ...playerInventory };
        },
        
        /**
         * Get player cargo value
         * @returns {number} - Total value of cargo
         */
        getCargoValue: function() {
            let totalValue = 0;
            
            for (const goodId in playerInventory.cargo) {
                const quantity = playerInventory.cargo[goodId];
                const good = TRADE_GOODS[goodId.toUpperCase()];
                
                if (good) {
                    totalValue += good.baseValue * quantity;
                }
            }
            
            return totalValue;
        },
        
        /**
         * Buy goods from a market
         * @param {string} marketId - Market ID
         * @param {string} goodId - Good ID
         * @param {number} quantity - Quantity to buy
         * @returns {boolean} - Whether purchase was successful
         */
        buyGoods: function(marketId, goodId, quantity) {
            const market = this.getMarketById(marketId);
            if (!market) return false;
            
            const good = TRADE_GOODS[goodId.toUpperCase()];
            if (!good) return false;
            
            // Check if market has enough
            if (market.inventory[goodId] < quantity) {
                Utils.log(`The market doesn't have ${quantity} ${good.name} available.`, "important");
                return false;
            }
            
            // Check if player has enough cargo space
            const currentCargo = this.getCurrentCargoWeight();
            const neededSpace = good.weight * quantity;
            
            if (currentCargo + neededSpace > playerInventory.capacity) {
                Utils.log(`You don't have enough cargo space for ${quantity} ${good.name}.`, "important");
                return false;
            }
            
            // Calculate price
            const unitPrice = market.prices.buy[goodId];
            const totalPrice = unitPrice * quantity;
            
            // Check if player has enough wealth
            if (!ResourceManager.canAffordWealth(totalPrice)) {
                Utils.log(`You don't have enough wealth to buy ${quantity} ${good.name}.`, "important");
                return false;
            }
            
            // Perform transaction
            ResourceManager.subtractWealth(totalPrice);
            
            // Update market inventory
            market.inventory[goodId] -= quantity;
            market.wealth += totalPrice;
            
            // Update player inventory
            if (!playerInventory.cargo[goodId]) {
                playerInventory.cargo[goodId] = 0;
            }
            playerInventory.cargo[goodId] += quantity;
            
            Utils.log(`Purchased ${quantity} ${good.name} for ${totalPrice} wealth.`, "success");
            return true;
        },
        
        /**
         * Sell goods to a market
         * @param {string} marketId - Market ID
         * @param {string} goodId - Good ID
         * @param {number} quantity - Quantity to sell
         * @returns {boolean} - Whether sale was successful
         */
        sellGoods: function(marketId, goodId, quantity) {
            const market = this.getMarketById(marketId);
            if (!market) return false;
            
            const good = TRADE_GOODS[goodId.toUpperCase()];
            if (!good) return false;
            
            // Check if player has enough
            if (!playerInventory.cargo[goodId] || playerInventory.cargo[goodId] < quantity) {
                Utils.log(`You don't have ${quantity} ${good.name} to sell.`, "important");
                return false;
            }
            
            // Calculate price
            const unitPrice = market.prices.sell[goodId];
            const totalPrice = unitPrice * quantity;
            
            // Check if market has enough wealth
            if (market.wealth < totalPrice) {
                Utils.log(`The market doesn't have enough wealth to buy ${quantity} ${good.name}.`, "important");
                return false;
            }
            
            // Perform transaction
            ResourceManager.addWealth(totalPrice);
            
            // Update market inventory
            market.inventory[goodId] += quantity;
            market.wealth -= totalPrice;
            
            // Update player inventory
            playerInventory.cargo[goodId] -= quantity;
            
            // Remove entry if quantity is 0
            if (playerInventory.cargo[goodId] <= 0) {
                delete playerInventory.cargo[goodId];
            }
            
            Utils.log(`Sold ${quantity} ${good.name} for ${totalPrice} wealth.`, "success");
            return true;
        },
        
        /**
         * Calculate current cargo weight
         * @returns {number} - Current cargo weight
         */
        getCurrentCargoWeight: function() {
            let totalWeight = 0;
            
            for (const goodId in playerInventory.cargo) {
                const quantity = playerInventory.cargo[goodId];
                const good = TRADE_GOODS[goodId.toUpperCase()];
                
                if (good) {
                    totalWeight += good.weight * quantity;
                }
            }
            
            return totalWeight;
        },
        
        /**
         * Increase player cargo capacity
         * @param {number} amount - Amount to increase
         */
        increaseCargoCapacity: function(amount) {
            playerInventory.capacity += amount;
            Utils.log(`Increased cargo capacity by ${amount}. New capacity: ${playerInventory.capacity}`, "success");
        },
        
        /**
         * Process trade for a game tick
         * @param {number} daysPassed - Number of days passed
         * @param {string} season - Current season
         */
        processTick: function(daysPassed, season) {
            // Refresh markets that are due for refresh
            markets.forEach(market => {
                const daysSinceRefresh = GameEngine.getGameState().date.day - market.lastRefresh;
                
                if (daysSinceRefresh >= market.refreshRate) {
                    refreshMarket(market, season);
                }
            });
            
            // Process merchant ships
            // In a full implementation, would update merchant ship positions
        },
        
        /**
         * Travel to a market
         * @param {string} marketId - Market ID
         * @returns {Object} - Travel result
         */
        travelToMarket: function(marketId) {
            const market = this.getMarketById(marketId);
            if (!market) return { success: false, message: "Market not found." };
            
            const playerRegion = WorldGenerator.getRegionById(GameEngine.getGameState().playerRegionId);
            if (!playerRegion) return { success: false, message: "Player region not found." };
            
            const marketRegion = WorldGenerator.getRegionById(market.regionId);
            if (!marketRegion) return { success: false, message: "Market region not found." };
            
            // Check if player is already at this market
            if (playerRegion.id === marketRegion.id) {
                return { success: true, message: "You are already at this market.", travelDays: 0 };
            }
            
            // Find trade route
            const route = tradeRoutes.find(r => 
                r.markets.includes(`market_${playerRegion.id}`) && 
                r.markets.includes(marketId)
            );
            
            let travelDays = 0;
            let dangerLevel = 1;
            
            if (route) {
                // Use existing route
                travelDays = route.travelTime;
                dangerLevel = route.dangerLevel;
            } else {
                // Calculate ad-hoc route
                // In a full implementation, would do proper pathfinding
                // For now, use a simplified approach
                const isSea = playerRegion.type === "coastline" && marketRegion.type === "coastline";
                
                if (isSea) {
                    // Sea route
                    travelDays = Utils.randomBetween(3, 10);
                    dangerLevel = 3;
                } else {
                    // Land route
                    travelDays = Utils.randomBetween(5, 15);
                    dangerLevel = 2;
                }
            }
            
            // Process travel time
            GameEngine.advanceTime(travelDays);
            
            // Handle travel events based on danger level
            if (Math.random() < dangerLevel * 0.1) {
                // Travel incident
                const incidentType = Math.random() > 0.5 ? "attack" : "natural";
                
                if (incidentType === "attack") {
                    // Bandit/pirate attack
                    Utils.log(`Your caravan was attacked by ${isSea ? "pirates" : "bandits"} during the journey!`, "danger");
                    
                    // In a full implementation, would handle combat
                    // For now, just lose some cargo
                    const cargoLossPercentage = Math.min(0.3, dangerLevel * 0.1);
                    this.loseRandomCargo(cargoLossPercentage);
                } else {
                    // Natural disaster
                    Utils.log(`Your caravan encountered ${isSea ? "a storm at sea" : "terrible weather"} during the journey!`, "danger");
                    
                    // Delay journey
                    const extraDays = Math.ceil(dangerLevel / 2);
                    GameEngine.advanceTime(extraDays);
                    travelDays += extraDays;
                    
                    Utils.log(`The journey took ${extraDays} additional days.`, "important");
                }
            }
            
            // Update player location
            GameEngine.setPlayerRegion(marketRegion.id);
            
            return { 
                success: true, 
                message: `Traveled to ${market.name} in ${travelDays} days.`, 
                travelDays: travelDays 
            };
        },
        
        /**
         * Lose random cargo (due to attack, etc.)
         * @param {number} percentage - Percentage of cargo to lose (0-1)
         */
        loseRandomCargo: function(percentage) {
            // Get total cargo value
            const totalValue = this.getCargoValue();
            
            if (totalValue <= 0) return; // No cargo to lose
            
            const valueToLose = totalValue * percentage;
            let valueLost = 0;
            
            // Copy cargo for modification
            const newCargo = { ...playerInventory.cargo };
            
            // Randomly lose cargo until target value is reached
            while (valueLost < valueToLose && Object.keys(newCargo).length > 0) {
                // Pick random good
                const goodIds = Object.keys(newCargo);
                const randomGoodId = goodIds[Math.floor(Math.random() * goodIds.length)];
                
                const good = TRADE_GOODS[randomGoodId.toUpperCase()];
                if (!good) continue;
                
                // Determine quantity to lose
                const maxLoss = newCargo[randomGoodId];
                const lossQuantity = Math.min(maxLoss, Math.ceil(maxLoss * percentage));
                
                // Calculate value lost
                const lossValue = lossQuantity * good.baseValue;
                
                // Update tracking
                valueLost += lossValue;
                newCargo[randomGoodId] -= lossQuantity;
                
                // Log the loss
                Utils.log(`Lost ${lossQuantity} ${good.name} worth ${lossValue} wealth.`, "danger");
                
                // Remove entry if quantity is 0
                if (newCargo[randomGoodId] <= 0) {
                    delete newCargo[randomGoodId];
                }
            }
            
            // Update player inventory
            playerInventory.cargo = newCargo;
        },
        
        /**
         * Find profitable trade opportunities between two markets
         * @param {string} sourceMarketId - Source market ID
         * @param {string} targetMarketId - Target market ID
         * @returns {Array} - Array of trade opportunities
         */
        findTradeOpportunities: function(sourceMarketId, targetMarketId) {
            const sourceMarket = this.getMarketById(sourceMarketId);
            const targetMarket = this.getMarketById(targetMarketId);
            
            if (!sourceMarket || !targetMarket) return [];
            
            const opportunities = [];
            
            // Check each good
            for (const goodId in TRADE_GOODS) {
                const good = TRADE_GOODS[goodId];
                
                // Check if both markets have this good
                if (sourceMarket.inventory[good.id] > 0 && 
                    targetMarket.prices.sell[good.id] > sourceMarket.prices.buy[good.id]) {
                    
                    // Calculate profit
                    const buyPrice = sourceMarket.prices.buy[good.id];
                    const sellPrice = targetMarket.prices.sell[good.id];
                    const profit = sellPrice - buyPrice;
                    
                    // Calculate max quantity that can be traded
                    const availableQuantity = sourceMarket.inventory[good.id];
                    const maxAffordable = Math.floor(ResourceManager.getWealth() / buyPrice);
                    const maxCargoSpace = Math.floor((playerInventory.capacity - this.getCurrentCargoWeight()) / good.weight);
                    
                    const maxQuantity = Math.min(availableQuantity, maxAffordable, maxCargoSpace);
                    
                    if (maxQuantity > 0 && profit > 0) {
                        opportunities.push({
                            good: good.id,
                            goodName: good.name,
                            buyPrice: buyPrice,
                            sellPrice: sellPrice,
                            profit: profit,
                            profitPercentage: (profit / buyPrice) * 100,
                            maxQuantity: maxQuantity,
                            totalProfit: profit * maxQuantity
                        });
                    }
                }
            }
            
            // Sort by profit percentage
            opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
            
            return opportunities;
        }
    };
})();