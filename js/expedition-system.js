/**
 * Viking Legacy - Expedition System
 * Manages creating armies, moving them between regions, and coordinating warfare
 */

const ExpeditionSystem = (function() {
    // Private variables
    
    // Track all expeditions (player and AI)
    let expeditions = [];
    
    // Expedition statuses
    const EXPEDITION_STATUS = {
        MUSTERING: 'mustering',    // Gathering forces
        MARCHING: 'marching',      // Moving to destination
        RAIDING: 'raiding',        // Raiding a region
        SIEGING: 'sieging',        // Besieging a settlement
        BATTLING: 'battling',      // Engaged in battle
        RETURNING: 'returning',    // Returning home
        DISBANDED: 'disbanded'     // Disbanded (no longer active)
    };
    
    // Movement speed modifiers by region type
    const MOVEMENT_MODIFIERS = {
        FOREST: 0.7,     // Slower in forests
        PLAINS: 1.2,     // Faster on plains
        MOUNTAINS: 0.5,  // Much slower in mountains
        COASTAL: 0.9,    // Slightly slower on coasts
        FJORD: 0.8       // Slower in fjords
    };
    
    // Base days to move between adjacent regions
    const BASE_MOVEMENT_DAYS = 5;
    
    // Expedition template
    const expeditionTemplate = {
        id: "",
        name: "",
        ownerId: "",          // Settlement ID that owns this expedition
        ownerType: "",        // 'player' or 'ai'
        status: EXPEDITION_STATUS.MUSTERING,
        warriors: 0,          // Number of warriors
        strength: 0,          // Total fighting strength
        casualties: 0,        // Warriors lost
        loot: {},             // Accumulated loot
        originRegion: "",     // Region ID where expedition started
        currentRegion: "",    // Current region ID
        targetRegion: "",     // Target region ID
        targetSettlement: "", // Target settlement ID (for sieges)
        path: [],             // List of region IDs in planned path
        siegeProgress: 0,     // Progress on current siege (0-100)
        movementProgress: 0,  // Progress on current movement (0-100)
        daysActive: 0,        // Total days active
        fame: 0               // Fame earned from this expedition
    };
    
    /**
     * Calculate base expedition strength
     * @param {number} warriors - Number of warriors
     * @param {Object} bonuses - Optional strength bonuses
     * @returns {number} - Calculated strength
     */
    function calculateStrength(warriors, bonuses = {}) {
        // Base strength is 1 per warrior
        let strength = warriors;
        
        // Apply bonuses (e.g., from buildings, leader skills, etc.)
        if (bonuses.leaderBonus) strength *= bonuses.leaderBonus;
        if (bonuses.equipmentBonus) strength *= bonuses.equipmentBonus;
        if (bonuses.buildingBonus) strength *= bonuses.buildingBonus;
        
        return Math.floor(strength);
    }
    
    /**
     * Generate a name for an expedition
     * @param {string} prefix - Prefix for the name (e.g., "Raiding")
     * @returns {string} - Generated name
     */
    function generateExpeditionName(prefix = "Raiding") {
        const adjectives = ["Bold", "Fierce", "Swift", "Mighty", "Great", "Dread", "Savage", "Battle-Ready"];
        const nouns = ["Wolves", "Ravens", "Warriors", "Axes", "Serpents", "Dragons", "Vanguard", "Force"];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${prefix} ${adjective} ${noun}`;
    }
    
    /**
     * Find adjacent regions to a given region
     * @param {string} regionId - ID of the region
     * @returns {Array} - Array of adjacent region IDs
     */
    function findAdjacentRegions(regionId) {
        const worldData = WorldMap.getWorldMap();
        const region = worldData.regions.find(r => r.id === regionId);
        
        if (!region) return [];
        
        // Get all regions in same landmass
        const regionsInLandmass = worldData.regions.filter(r => r.landmass === region.landmass);
        
        // Find adjacent regions (simplified using distance)
        const adjacentRegions = regionsInLandmass.filter(r => {
            if (r.id === regionId) return false; // Skip self
            
            // Calculate distance
            const dx = r.position.x - region.position.x;
            const dy = r.position.y - region.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Consider adjacent if within certain range 
            // (this is a simplification - ideally would use proper adjacency mapping)
            const adjacencyThreshold = (r.size.width + region.size.width) / 1.5;
            return distance <= adjacencyThreshold;
        });
        
        return adjacentRegions.map(r => r.id);
    }
    
    /**
     * Calculate the movement cost between two regions
     * @param {string} fromRegionId - Origin region ID
     * @param {string} toRegionId - Destination region ID
     * @returns {number} - Days required for movement
     */
    function calculateMovementDays(fromRegionId, toRegionId) {
        const worldData = WorldMap.getWorldMap();
        const fromRegion = worldData.regions.find(r => r.id === fromRegionId);
        const toRegion = worldData.regions.find(r => r.id === toRegionId);
        
        if (!fromRegion || !toRegion) return BASE_MOVEMENT_DAYS;
        
        // Apply region type modifier
        let movementDays = BASE_MOVEMENT_DAYS;
        
        // Apply destination region type modifier
        if (MOVEMENT_MODIFIERS[toRegion.type]) {
            movementDays /= MOVEMENT_MODIFIERS[toRegion.type];
        }
        
        // Check if regions are adjacent
        const adjacentRegions = findAdjacentRegions(fromRegionId);
        if (!adjacentRegions.includes(toRegionId)) {
            // Non-adjacent movement is much slower
            movementDays *= 3;
        }
        
        // Return the calculated days (min 1 day)
        return Math.max(1, Math.round(movementDays));
    }
    
    /**
     * Create a new expedition
     * @param {Object} options - Configuration options
     * @returns {Object} - The created expedition
     */
    function createExpedition(options) {
        const id = `expedition_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const expedition = Object.assign({}, expeditionTemplate, {
            id: id,
            name: options.name || generateExpeditionName(),
            ownerId: options.ownerId,
            ownerType: options.ownerType || 'player',
            warriors: options.warriors || 0,
            strength: calculateStrength(options.warriors, options.bonuses),
            originRegion: options.regionId,
            currentRegion: options.regionId
        });
        
        // Add to expeditions list
        expeditions.push(expedition);
        
        // Log expedition creation
        console.log(`Created expedition ${expedition.name} with ${expedition.warriors} warriors`);
        
        return expedition;
    }
    
    /**
     * Update an expedition's status
     * @param {string} expeditionId - ID of the expedition
     * @param {string} status - New status
     * @param {Object} statusData - Additional status data
     */
    function updateExpeditionStatus(expeditionId, status, statusData = {}) {
        const expedition = expeditions.find(e => e.id === expeditionId);
        if (!expedition) return;
        
        const oldStatus = expedition.status;
        expedition.status = status;
        
        // Update any additional status data
        Object.assign(expedition, statusData);
        
        // Log status change
        console.log(`Expedition ${expedition.name} status changed from ${oldStatus} to ${status}`);
        
        // Handle status-specific logic
        switch (status) {
            case EXPEDITION_STATUS.MARCHING:
                // Reset movement progress when starting to march
                expedition.movementProgress = 0;
                break;
                
            case EXPEDITION_STATUS.SIEGING:
                // Reset siege progress when starting a siege
                expedition.siegeProgress = 0;
                break;
                
            case EXPEDITION_STATUS.DISBANDED:
                // Handle expedition disbanding (return warriors, etc.)
                handleExpeditionDisbanding(expedition);
                break;
        }
    }
    
    /**
     * Handle expedition disbanding logic
     * @param {Object} expedition - The disbanding expedition
     */
    function handleExpeditionDisbanding(expedition) {
        // If this is the player's expedition, return warriors to the settlement
        if (expedition.ownerType === 'player') {
            const playerSettlement = WorldMap.getPlayerSettlement();
            
            if (playerSettlement && typeof PopulationManager !== 'undefined') {
                // Calculate warriors returning (total minus casualties)
                const returningWarriors = Math.max(0, expedition.warriors - expedition.casualties);
                
                // Add warriors back to population
                if (typeof PopulationManager.addAnonymousPopulation === 'function') {
                    PopulationManager.addAnonymousPopulation('worker', returningWarriors);
                    Utils.log(`${returningWarriors} warriors have returned from ${expedition.name}.`);
                }
                
                // Add any loot to resources
                if (Object.keys(expedition.loot).length > 0 && typeof ResourceManager !== 'undefined') {
                    ResourceManager.addResources(expedition.loot);
                    
                    const lootSummary = Object.entries(expedition.loot)
                        .map(([resource, amount]) => `${amount} ${resource}`)
                        .join(', ');
                    
                    Utils.log(`Expedition returned with: ${lootSummary}`, 'success');
                }
                
                // Award fame for the expedition
                if (expedition.fame > 0 && typeof RankManager !== 'undefined') {
                    RankManager.addFame(expedition.fame, `Successful expedition`);
                }
            }
        }
        
        // Eventually remove the expedition from the list
        // (we keep it for a while for record-keeping)
        setTimeout(() => {
            const index = expeditions.findIndex(e => e.id === expedition.id);
            if (index !== -1) {
                expeditions.splice(index, 1);
            }
        }, 5000); // Remove after 5 seconds
    }
    
    /**
     * Process expedition movement
     * @param {Object} expedition - The expedition
     * @param {number} tickSize - Size of the game tick in days
     */
    function processMovement(expedition, tickSize) {
        if (expedition.status !== EXPEDITION_STATUS.MARCHING) return;
        
        // If no target region, can't move
        if (!expedition.targetRegion) {
            updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.MUSTERING);
            return;
        }
        
        // Calculate total days needed for this movement
        const totalDays = calculateMovementDays(expedition.currentRegion, expedition.targetRegion);
        
        // Progress as percentage
        const progressIncrement = (tickSize / totalDays) * 100;
        expedition.movementProgress += progressIncrement;
        
        // If movement complete
        if (expedition.movementProgress >= 100) {
            // Update current region
            expedition.currentRegion = expedition.targetRegion;
            
            // Check if we've reached the end of the path
            if (expedition.path && expedition.path.length > 0) {
                // Remove the reached region from path
                expedition.path.shift();
                
                // Set next region as target if available
                if (expedition.path.length > 0) {
                    expedition.targetRegion = expedition.path[0];
                    expedition.movementProgress = 0;
                    return; // Continue marching
                }
            }
            
            // If we have a target settlement and we're in its region
            if (expedition.targetSettlement) {
                const settlement = WorldMap.getSettlement(expedition.targetSettlement);
                if (settlement && settlement.region === expedition.currentRegion) {
                    // Begin siege
                    updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.SIEGING, {
                        siegeProgress: 0
                    });
                    
                    if (expedition.ownerType === 'player') {
                        Utils.log(`Your expedition has reached ${settlement.name} and begun a siege.`, 'important');
                    }
                    return;
                }
            }
            
            // If we're just raiding the region
            updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RAIDING);
            
            if (expedition.ownerType === 'player') {
                const region = WorldMap.getRegion(expedition.currentRegion);
                Utils.log(`Your expedition has reached ${region?.name || 'the target region'} and begun raiding.`, 'important');
            }
        }
    }
    
    /**
     * Process raiding activities
     * @param {Object} expedition - The expedition
     * @param {number} tickSize - Size of the game tick in days
     */
    function processRaiding(expedition, tickSize) {
        if (expedition.status !== EXPEDITION_STATUS.RAIDING) return;
        
        // Chance to gather loot based on expedition strength and tick size
        const lootChance = (expedition.strength / 100) * tickSize * 10;
        
        if (Utils.chanceOf(lootChance)) {
            // Get region data
            const region = WorldMap.getRegion(expedition.currentRegion);
            if (!region) return;
            
            // Determine loot based on region type
            const regionType = region.type;
            const resourceModifiers = region.resourceModifiers;
            
            // Base loot amounts
            const lootAmounts = {
                food: Utils.randomBetween(5, 15) * tickSize,
                wood: Utils.randomBetween(3, 10) * tickSize,
                stone: Utils.randomBetween(2, 8) * tickSize,
                metal: Utils.randomBetween(1, 5) * tickSize
            };
            
            // Apply regional modifiers
            for (const resource in lootAmounts) {
                if (resourceModifiers[resource]) {
                    lootAmounts[resource] = Math.round(lootAmounts[resource] * resourceModifiers[resource]);
                }
            }
            
            // Add special resources based on region
            for (const resource in resourceModifiers) {
                // Skip basic resources (already handled)
                if (['food', 'wood', 'stone', 'metal'].includes(resource)) continue;
                
                // Add special resources if they exist in this region
                if (resourceModifiers[resource] > 0.5) {
                    // Amount based on modifier and expedition strength
                    const amount = Math.round(
                        expedition.strength / 20 * 
                        resourceModifiers[resource] * 
                        Utils.randomBetween(1, 3)
                    );
                    
                    if (amount > 0) {
                        lootAmounts[resource] = (lootAmounts[resource] || 0) + amount;
                    }
                }
            }
            
            // Add to expedition's loot
            for (const resource in lootAmounts) {
                if (!expedition.loot[resource]) expedition.loot[resource] = 0;
                expedition.loot[resource] += lootAmounts[resource];
            }
            
            // Calculate fame gained
            const fameGained = Math.ceil(
                Object.values(lootAmounts).reduce((sum, val) => sum + val, 0) / 20
            );
            expedition.fame += fameGained;
            
            // Log for player expeditions
            if (expedition.ownerType === 'player') {
                // Create loot message
                let lootMessage = "Your raiders have gathered: ";
                lootMessage += Object.entries(lootAmounts)
                    .filter(([_, amount]) => amount > 0)
                    .map(([resource, amount]) => `${amount} ${resource}`)
                    .join(', ');
                
                Utils.log(lootMessage, 'success');
            }
            
            // Chance of negative events during raiding
            if (Utils.chanceOf(5 * tickSize)) {
                // Defenders fight back - casualties
                const casualtyCount = Math.ceil(expedition.warriors * 0.05 * Utils.randomBetween(1, 3));
                
                if (casualtyCount > 0) {
                    expedition.casualties += casualtyCount;
                    expedition.warriors -= casualtyCount;
                    expedition.strength = calculateStrength(expedition.warriors);
                    
                    if (expedition.ownerType === 'player') {
                        Utils.log(`The locals fought back! You lost ${casualtyCount} warriors in a skirmish.`, 'danger');
                    }
                    
                    // If too many casualties, expedition might return home
                    if (expedition.casualties > expedition.warriors / 2) {
                        if (expedition.ownerType === 'player') {
                            Utils.log(`Having suffered heavy losses, your expedition is returning home.`, 'important');
                        }
                        
                        updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RETURNING, {
                            targetRegion: expedition.originRegion
                        });
                    }
                }
            }
            
            // Chance to end raiding if we've gathered plenty of loot
            const totalLoot = Object.values(expedition.loot).reduce((sum, val) => sum + val, 0);
            if (totalLoot > expedition.warriors * 20) {
                if (Utils.chanceOf(20 * tickSize)) {
                    if (expedition.ownerType === 'player') {
                        Utils.log(`Having gathered significant plunder, your expedition is returning home.`, 'important');
                    }
                    
                    updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RETURNING, {
                        targetRegion: expedition.originRegion
                    });
                }
            }
        }
    }
    
    /**
     * Process siege activities
     * @param {Object} expedition - The expedition
     * @param {number} tickSize - Size of the game tick in days
     */
    function processSiege(expedition, tickSize) {
        if (expedition.status !== EXPEDITION_STATUS.SIEGING) return;
        
        // Get target settlement
        const settlement = WorldMap.getSettlement(expedition.targetSettlement);
        if (!settlement) {
            // Target settlement no longer exists - return to raiding
            updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RAIDING);
            return;
        }
        
        // Calculate siege progress increment based on strength ratio
        const defenseStrength = settlement.military?.defenses || 0;
        const defenderStrength = (settlement.military?.warriors || 0) + defenseStrength * 3;
        
        // Calculate strength ratio (how much stronger the attacker is)
        const strengthRatio = defenderStrength > 0 ? 
            expedition.strength / defenderStrength : 
            1000; // If no defenders, very fast siege
        
        // Base siege progress
        let siegeProgressIncrement = (strengthRatio * 5) * tickSize;
        
        // Cap progress increment
        siegeProgressIncrement = Math.min(siegeProgressIncrement, 20 * tickSize);
        siegeProgressIncrement = Math.max(siegeProgressIncrement, 1 * tickSize);
        
        // Update siege progress
        expedition.siegeProgress += siegeProgressIncrement;
        
        // Log progress for player expeditions
        if (expedition.ownerType === 'player' && Math.floor(expedition.siegeProgress / 20) > Math.floor((expedition.siegeProgress - siegeProgressIncrement) / 20)) {
            const progressPhase = Math.floor(expedition.siegeProgress / 20);
            
            const siegeMessages = [
                `Your forces have surrounded ${settlement.name} and are establishing a siege camp.`,
                `Your siege engines are being constructed to assault ${settlement.name}.`,
                `The defenders of ${settlement.name} are showing signs of dwindling supplies.`,
                `Parts of ${settlement.name}'s defenses have been breached.`,
                `${settlement.name} is on the verge of falling to your warriors.`
            ];
            
            if (progressPhase < siegeMessages.length) {
                Utils.log(siegeMessages[progressPhase], 'important');
            }
        }
        
        // Siege complete when progress reaches 100
        if (expedition.siegeProgress >= 100) {
            // Settlement captured!
            settlement.isCaptured = true;
            
            // Calculate loot based on settlement size and type
            const lootMultiplier = settlement.population * (
                1 + (settlement.rank || 0) * 0.5
            );
            
            // Generate loot
            const loot = {
                food: Math.round(lootMultiplier * Utils.randomBetween(3, 8)),
                wood: Math.round(lootMultiplier * Utils.randomBetween(2, 6)),
                stone: Math.round(lootMultiplier * Utils.randomBetween(1, 4)),
                metal: Math.round(lootMultiplier * Utils.randomBetween(1, 3))
            };
            
            // Add silver/gold for higher rank settlements
            if (settlement.rank >= 2) {
                loot.silver = Math.round(lootMultiplier * Utils.randomBetween(1, 3));
            }
            
            if (settlement.rank >= 4) {
                loot.gold = Math.round(lootMultiplier * 0.3 * Utils.randomBetween(1, 3));
            }
            
            // Add special resources if available
            for (const resource in settlement.resources) {
                if (!['food', 'wood', 'stone', 'metal'].includes(resource) && 
                    settlement.resources[resource] > 0) {
                    loot[resource] = Math.round(
                        Math.min(settlement.resources[resource], 
                            lootMultiplier * 0.5 * Utils.randomBetween(1, 3))
                    );
                }
            }
            
            // Add to expedition's loot
            for (const resource in loot) {
                if (!expedition.loot[resource]) expedition.loot[resource] = 0;
                expedition.loot[resource] += loot[resource];
            }
            
            // Calculate fame gained (more for higher rank settlements)
            const fameGained = 20 + (settlement.rank || 0) * 15;
            expedition.fame += fameGained;
            
            if (expedition.ownerType === 'player') {
                Utils.log(`Your forces have successfully captured ${settlement.name}!`, 'success');
                
                // Create loot message
                let lootMessage = "You've plundered: ";
                lootMessage += Object.entries(loot)
                    .filter(([_, amount]) => amount > 0)
                    .map(([resource, amount]) => `${amount} ${resource}`)
                    .join(', ');
                
                Utils.log(lootMessage, 'success');
            }
            
            // After successful siege, start returning home
            updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RETURNING, {
                targetRegion: expedition.originRegion
            });
            
            // Notify conflict system if it exists
            if (window.ConflictSystem && typeof ConflictSystem.onSettlementCaptured === 'function') {
                ConflictSystem.onSettlementCaptured(settlement.id, expedition.id);
            }
        }
        
        // Chance for casualties during siege
        if (Utils.chanceOf(10 * tickSize)) {
            // Defenders sortie - casualties
            const casualtyCount = Math.ceil(expedition.warriors * 0.03 * Utils.randomBetween(1, 4));
            
            if (casualtyCount > 0) {
                expedition.casualties += casualtyCount;
                expedition.warriors -= casualtyCount;
                expedition.strength = calculateStrength(expedition.warriors);
                
                if (expedition.ownerType === 'player') {
                    Utils.log(`The defenders launched a sortie! You lost ${casualtyCount} warriors in the fighting.`, 'danger');
                }
                
                // If too many casualties or not enough strength, might abandon siege
                if (expedition.casualties > expedition.warriors / 2 || expedition.strength < defenderStrength * 0.7) {
                    if (expedition.ownerType === 'player') {
                        Utils.log(`With mounting losses, your forces have abandoned the siege of ${settlement.name}.`, 'danger');
                    }
                    
                    updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.RETURNING, {
                        targetRegion: expedition.originRegion
                    });
                }
            }
        }
    }
    
    /**
     * Process returning expeditions
     * @param {Object} expedition - The expedition
     * @param {number} tickSize - Size of the game tick in days
     */
    function processReturning(expedition, tickSize) {
        if (expedition.status !== EXPEDITION_STATUS.RETURNING) return;
        
        // If already in origin region, disband
        if (expedition.currentRegion === expedition.originRegion) {
            if (expedition.ownerType === 'player') {
                Utils.log(`Your expedition has returned home.`, 'important');
            }
            
            updateExpeditionStatus(expedition.id, EXPEDITION_STATUS.DISBANDED);
            return;
        }
        
        // If no path established yet
        if (!expedition.targetRegion) {
            // Set path back to origin
            expedition.targetRegion = expedition.originRegion;
        }
        
        // Process movement like normal
        processMovement(expedition, tickSize);
    }
    
    /**
     * Process battles between expeditions
     * @param {number} tickSize - Size of the game tick in days
     */
    function processBattles(tickSize) {
        // Group expeditions by region
        const expeditionsByRegion = {};
        
        expeditions.forEach(expedition => {
            if (expedition.status === EXPEDITION_STATUS.DISBANDED) return;
            
            if (!expeditionsByRegion[expedition.currentRegion]) {
                expeditionsByRegion[expedition.currentRegion] = [];
            }
            
            expeditionsByRegion[expedition.currentRegion].push(expedition);
        });
        
        // Check each region for potential battles
        for (const regionId in expeditionsByRegion) {
            const expeditionsInRegion = expeditionsByRegion[regionId];
            
            // Skip if only one or zero expeditions
            if (expeditionsInRegion.length <= 1) continue;
            
            // Group expeditions by owner type
            const playerExpeditions = expeditionsInRegion.filter(e => e.ownerType === 'player');
            const aiExpeditions = expeditionsInRegion.filter(e => e.ownerType !== 'player');
            
            // Skip if all expeditions are friendly (all player or all AI)
            if (playerExpeditions.length === 0 || aiExpeditions.length === 0) continue;
            
            // We have potential battles - notify conflict system
            if (window.ConflictSystem && typeof ConflictSystem.initiateBattle === 'function') {
                // Get region info
                const region = WorldMap.getRegion(regionId);
                
                if (region) {
                    ConflictSystem.initiateBattle({
                        regionId: regionId,
                        regionName: region.name,
                        playerExpeditions: playerExpeditions,
                        aiExpeditions: aiExpeditions
                    });
                }
            }
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the expedition system
         */
        init: function() {
            console.log("Initializing Expedition System...");
            
            // Register with game engine if available
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(this.processTick);
            }
            
            console.log("Expedition System initialized");
        },
        
        /**
         * Process a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Process each expedition
            for (const expedition of expeditions) {
                // Skip disbanded expeditions
                if (expedition.status === EXPEDITION_STATUS.DISBANDED) continue;
                
                // Update days active
                expedition.daysActive += tickSize;
                
                // Process based on status
                switch (expedition.status) {
                    case EXPEDITION_STATUS.MARCHING:
                        processMovement(expedition, tickSize);
                        break;
                        
                    case EXPEDITION_STATUS.RAIDING:
                        processRaiding(expedition, tickSize);
                        break;
                        
                    case EXPEDITION_STATUS.SIEGING:
                        processSiege(expedition, tickSize);
                        break;
                        
                    case EXPEDITION_STATUS.RETURNING:
                        processReturning(expedition, tickSize);
                        break;
                }
            }
            
            // Process potential battles
            processBattles(tickSize);
        },
        
        /**
         * Create a new player expedition
         * @param {Object} options - Configuration options
         * @returns {Object|null} - Created expedition or null if failed
         */
        createPlayerExpedition: function(options) {
            console.log("Creating player expedition with options:", options);
            
            // Validate required options
            if (!options.warriors || options.warriors <= 0) {
                console.error("Cannot create expedition: No warriors assigned");
                return null;
            }
            
            if (!options.regionId) {
                console.error("Cannot create expedition: No region specified");
                return null;
            }
            
            // Get player settlement
            const playerSettlement = WorldMap.getPlayerSettlement();
            if (!playerSettlement) {
                console.error("Cannot create expedition: Player settlement not found");
                return null;
            }
            
            // Take warriors from population if we're using PopulationManager
            if (typeof PopulationManager !== 'undefined') {
                // Check if enough warriors are available
                const availableWarriors = PopulationManager.getWarriors();
                
                if (availableWarriors < options.warriors) {
                    console.error(`Cannot create expedition: Not enough warriors (${availableWarriors} available, ${options.warriors} requested)`);
                    return null;
                }
                
                // Remove warriors from population
                if (typeof PopulationManager.addAnonymousPopulation === 'function') {
                    // Use negative value to remove
                    PopulationManager.addAnonymousPopulation('worker', -options.warriors);
                }
            }
            
            // Create the expedition
            const expedition = createExpedition({
                name: options.name || generateExpeditionName(options.type === 'raid' ? "Raiding" : "Expedition"),
                ownerId: playerSettlement.id,
                ownerType: 'player',
                warriors: options.warriors,
                regionId: playerSettlement.region,
                bonuses: options.bonuses || {}
            });
            
            // Log expedition creation
            Utils.log(`Your ${expedition.name} has been assembled with ${expedition.warriors} warriors.`, "important");
            
            return expedition;
        },
        
        /**
         * Start an expedition's journey
         * @param {string} expeditionId - ID of the expedition
         * @param {Object} movementOptions - Movement configuration
         * @returns {boolean} - Success status
         */
        startExpedition: function(expeditionId, movementOptions) {
            const expedition = expeditions.find(e => e.id === expeditionId);
            if (!expedition) return false;
            
            // Validate options
            if (!movementOptions.targetRegionId && !movementOptions.targetSettlementId) {
                console.error("Cannot start expedition: No target region or settlement specified");
                return false;
            }
            
            // Set target settlement if specified
            if (movementOptions.targetSettlementId) {
                const settlement = WorldMap.getSettlement(movementOptions.targetSettlementId);
                if (!settlement) {
                    console.error(`Cannot start expedition: Settlement ${movementOptions.targetSettlementId} not found`);
                    return false;
                }
                
                expedition.targetSettlement = movementOptions.targetSettlementId;
                
                // Set target region to settlement's region
                movementOptions.targetRegionId = settlement.region;
            }
            
            // Set target region
            expedition.targetRegion = movementOptions.targetRegionId;
            
            // Set path if provided
            if (movementOptions.path && movementOptions.path.length > 0) {
                expedition.path = [...movementOptions.path];
                expedition.targetRegion = expedition.path[0];
            }
            
            // Update status to marching
            updateExpeditionStatus(expeditionId, EXPEDITION_STATUS.MARCHING);
            
            // Log for player expeditions
            if (expedition.ownerType === 'player') {
                const targetRegion = WorldMap.getRegion(expedition.targetRegion);
                Utils.log(`Your expedition has begun marching toward ${targetRegion?.name || 'the target region'}.`, "important");
            }
            
            return true;
        },
        
        /**
         * Get all active expeditions
         * @param {string} [ownerType] - Filter by owner type ('player' or 'ai')
         * @returns {Array} - Array of expedition objects
         */
        getExpeditions: function(ownerType) {
            if (ownerType) {
                return expeditions.filter(e => e.ownerType === ownerType && e.status !== EXPEDITION_STATUS.DISBANDED);
            }
            
            return expeditions.filter(e => e.status !== EXPEDITION_STATUS.DISBANDED);
        },
        
        /**
         * Get an expedition by ID
         * @param {string} expeditionId - ID of the expedition
         * @returns {Object|undefined} - Expedition object
         */
        getExpedition: function(expeditionId) {
            return expeditions.find(e => e.id === expeditionId);
        },
        
        /**
         * Get adjacent regions to a region
         * @param {string} regionId - ID of the region
         * @returns {Array} - Array of adjacent region IDs
         */
        getAdjacentRegions: function(regionId) {
            return findAdjacentRegions(regionId);
        },
        
        /**
         * Calculate movement days between regions
         * @param {string} fromRegionId - Origin region ID
         * @param {string} toRegionId - Destination region ID
         * @returns {number} - Days required for movement
         */
        calculateMovementDays: calculateMovementDays,
        
        /**
         * Get expedition status constants
         * @returns {Object} - Status constants
         */
        getStatusConstants: function() {
            return { ...EXPEDITION_STATUS };
        },
        
        /**
         * Force an expedition to return home
         * @param {string} expeditionId - ID of the expedition
         * @returns {boolean} - Success status
         */
        recallExpedition: function(expeditionId) {
            const expedition = expeditions.find(e => e.id === expeditionId);
            if (!expedition) return false;
            
            // Update status to returning
            updateExpeditionStatus(expeditionId, EXPEDITION_STATUS.RETURNING, {
                targetRegion: expedition.originRegion,
                path: [] // Clear any existing path
            });
            
            // Log for player expeditions
            if (expedition.ownerType === 'player') {
                Utils.log(`Your expedition has been ordered to return home.`, "important");
            }
            
            return true;
        },
        
        /**
         * Disband an expedition immediately
         * @param {string} expeditionId - ID of the expedition
         * @returns {boolean} - Success status
         */
        disbandExpedition: function(expeditionId) {
            const expedition = expeditions.find(e => e.id === expeditionId);
            if (!expedition) return false;
            
            // Update status to disbanded
            updateExpeditionStatus(expeditionId, EXPEDITION_STATUS.DISBANDED);
            
            return true;
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game engine to be ready
    const waitForGameEngine = setInterval(function() {
        if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning) {
            clearInterval(waitForGameEngine);
            
            // Initialize the expedition system
            ExpeditionSystem.init();
        }
    }, 500);
});
