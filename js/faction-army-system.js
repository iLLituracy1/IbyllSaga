/**
 * Viking Legacy - Faction Army System
 * Enables AI factions to muster armies to defend their territories
 * and engage player expeditions in battle
 * 
 * Features:
 * - Factions detect player expeditions in their territories
 * - Factions can muster armies from multiple settlements
 * - Faction armies can intercept player expeditions
 * - Faction armies can engage in battle with player forces
 * - Faction armies can break player sieges
 */

const FactionArmySystem = (function() {
    // Private variables
    let factionArmies = [];
    let nextArmyCheck = 0;
    const ARMY_CHECK_INTERVAL = 5; // Days between checking for creating new armies
    
    // Faction army template
    const factionArmyTemplate = {
        id: "",
        name: "",
        factionId: "",      // The faction this army belongs to
        status: "mustering", // mustering, marching, battling, defending, disbanding
        warriors: 0,        // Total warriors in the army
        strength: 0,        // Combat strength
        originRegionId: "", // Where the army was mustered
        currentRegionId: "", // Current location
        targetRegionId: "", // Where the army is heading
        targetExpeditionId: "", // If targeting a specific player expedition
        settlements: [],    // List of settlement IDs contributing to this army
        path: [],           // Path of regions to follow
        movementProgress: 0, // Progress on current movement (0-100)
        daysActive: 0,      // How long the army has been active
        expirationDays: 30  // Max days before the army disbands automatically
    };
    
    // Probability settings
    const RESPONSE_CHANCE_SETTINGS = {
        EXPEDITION_IN_TERRITORY: 0.7,   // Chance to respond to player expedition in territory
        EXPEDITION_NEAR_TERRITORY: 0.4, // Chance to respond to player expedition near territory
        SIEGE_RESPONSE: 0.9,            // Chance to respond to a player siege
        MAX_ACTIVE_ARMIES_PER_FACTION: 3 // Maximum armies a faction can have active at once
    };
    
    // Movement speed modifiers (same as ExpeditionSystem for consistency)
    const MOVEMENT_MODIFIERS = {
        FOREST: 0.7,     // Slower in forests
        PLAINS: 1.2,     // Faster on plains
        MOUNTAINS: 0.5,  // Much slower in mountains
        COASTAL: 0.9,    // Slightly slower on coasts
        FJORD: 0.8       // Slower in fjords
    };
    
    // Base days to move between regions (same as ExpeditionSystem for consistency)
    const BASE_MOVEMENT_DAYS = 5;
    
    /**
     * Calculate movement days between regions
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
        const adjacentRegions = WorldMap.getAdjacentRegions(fromRegionId);
        if (!adjacentRegions.includes(toRegionId)) {
            // Non-adjacent movement is much slower
            movementDays *= 3;
        }
        
        // Return the calculated days (min 1 day)
        return Math.max(1, Math.round(movementDays));
    }
    
    /**
     * Find the best path between two regions using a simple breadth-first search
     * @param {string} startRegionId - Starting region ID
     * @param {string} targetRegionId - Target region ID 
     * @returns {Array} - Array of region IDs forming the path, or empty if no path
     */
    function findPath(startRegionId, targetRegionId) {
        // If already in target region, return empty path
        if (startRegionId === targetRegionId) return [];
        
        // Initialize queue with start region
        const queue = [{regionId: startRegionId, path: []}];
        const visited = new Set([startRegionId]);
        
        // BFS to find shortest path
        while (queue.length > 0) {
            const {regionId, path} = queue.shift();
            
            // Get adjacent regions
            const adjacentRegions = WorldMap.getAdjacentRegions(regionId);
            
            for (const adjRegionId of adjacentRegions) {
                // If already visited, skip
                if (visited.has(adjRegionId)) continue;
                
                // Create new path with this region
                const newPath = [...path, adjRegionId];
                
                // If this is the target, return the path
                if (adjRegionId === targetRegionId) {
                    return newPath;
                }
                
                // Mark as visited and add to queue
                visited.add(adjRegionId);
                queue.push({regionId: adjRegionId, path: newPath});
            }
        }
        
        // No path found
        return [];
    }
    
    /**
     * Generate a name for a faction army
     * @param {Object} faction - The faction object
     * @returns {string} - Generated army name
     */
    function generateArmyName(faction) {
        const prefixes = ["Warband", "Host", "Army", "Guard", "Levy", "Force"];
        const factionNames = {
            "NORSE": ["Northmen", "Vikings", "Norsemen", "Raiders"],
            "ANGLO_SAXON": ["Anglo", "Saxon", "Britannic", "Wessex"],
            "FRANKISH": ["Frankish", "Royal", "Noble", "Imperial"]
        };
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const factionName = faction.type && factionNames[faction.type] ? 
            factionNames[faction.type][Math.floor(Math.random() * factionNames[faction.type].length)] : 
            "Allied";
        
        return `${factionName} ${prefix}`;
    }
    
    /**
     * Check if a faction should respond to player activity
     * @param {Object} faction - The faction object
     * @param {string} triggerType - Type of trigger (EXPEDITION_IN_TERRITORY, EXPEDITION_NEAR_TERRITORY, SIEGE_RESPONSE)
     * @returns {boolean} - Whether the faction should respond
     */
    function shouldFactionRespond(faction, triggerType) {
        // Check if faction already has maximum armies
        const factionActiveArmies = factionArmies.filter(
            army => army.factionId === faction.id && army.status !== "disbanding"
        );
        
        if (factionActiveArmies.length >= RESPONSE_CHANCE_SETTINGS.MAX_ACTIVE_ARMIES_PER_FACTION) {
            return false;
        }
        
        // Get response chance based on trigger type
        const responseChance = RESPONSE_CHANCE_SETTINGS[triggerType] || 0.5;
        
        // Modify based on faction type
        let factionModifier = 1.0;
        if (faction.type === "ANGLO_SAXON") {
            factionModifier = 1.2; // Anglo-Saxons more likely to defend territory
        } else if (faction.type === "FRANKISH") {
            factionModifier = 1.5; // Franks even more likely to defend
        }
        
        // Random check
        return Math.random() < (responseChance * factionModifier);
    }
    
    /**
     * Get all settlement IDs controlled by a faction in a specific region
     * @param {string} factionId - ID of the faction
     * @param {string} regionId - ID of the region
     * @returns {Array} - Array of settlement IDs
     */
    function getFactionSettlementsInRegion(factionId, regionId) {
        const worldData = WorldMap.getWorldMap();
        return worldData.settlements
            .filter(s => s.factionId === factionId && s.region === regionId)
            .map(s => s.id);
    }
    
    /**
     * Get a faction's territories (regions it controls settlements in)
     * @param {string} factionId - ID of the faction
     * @returns {Array} - Array of region IDs
     */
    function getFactionTerritories(factionId) {
        const worldData = WorldMap.getWorldMap();
        
        // Get all settlements controlled by this faction
        const factionSettlements = worldData.settlements.filter(s => s.factionId === factionId);
        
        // Return unique region IDs
        return [...new Set(factionSettlements.map(s => s.region))];
    }
    
    /**
     * Get territories adjacent to faction territories
     * @param {string} factionId - ID of the faction
     * @returns {Array} - Array of region IDs
     */
    function getAdjacentTerritories(factionId) {
        const ownedTerritories = getFactionTerritories(factionId);
        const adjacentTerritories = new Set();
        
        // For each territory, find adjacent ones
        ownedTerritories.forEach(regionId => {
            const adjacent = WorldMap.getAdjacentRegions(regionId);
            adjacent.forEach(adjRegionId => {
                // Only add if not already owned
                if (!ownedTerritories.includes(adjRegionId)) {
                    adjacentTerritories.add(adjRegionId);
                }
            });
        });
        
        return Array.from(adjacentTerritories);
    }
    
    /**
     * Muster a faction army to respond to a threat
     * @param {Object} faction - The faction object
     * @param {string} targetRegionId - Region to defend
     * @param {string} targetExpeditionId - Optional ID of player expedition to target
     * @returns {Object} - The created army or null if creation failed
     */
    function musterFactionArmy(faction, targetRegionId, targetExpeditionId = null) {
        console.log(`Faction ${faction.name} mustering army to defend region ${targetRegionId}`);
        
        // Determine where to muster from (closest region with faction settlements)
        const factionTerritories = getFactionTerritories(faction.id);
        
        if (factionTerritories.length === 0) {
            console.warn(`Faction ${faction.name} has no territories to muster from`);
            return null;
        }
        
        // If target is a faction territory, muster there
        // Otherwise find closest territory
        let musterRegionId;
        if (factionTerritories.includes(targetRegionId)) {
            musterRegionId = targetRegionId;
        } else {
            // Find closest territory (simplified - just take the first one for now)
            // In a full implementation, we would calculate distances between regions
            musterRegionId = factionTerritories[0];
        }
        
        // Get settlements in the muster region
        const settlementIds = getFactionSettlementsInRegion(faction.id, musterRegionId);
        
        if (settlementIds.length === 0) {
            console.warn(`No settlements found for faction ${faction.name} in region ${musterRegionId}`);
            return null;
        }
        
        // Calculate total warriors and strength
        let totalWarriors = 0;
        const settlements = settlementIds.map(id => WorldMap.getSettlement(id)).filter(Boolean);
        
        settlements.forEach(settlement => {
            // Each settlement contributes a portion of its warriors
            const contributionRatio = Math.random() * 0.3 + 0.4; // 40-70% of warriors
            const warriors = Math.floor((settlement.military?.warriors || 0) * contributionRatio);
            
            totalWarriors += warriors;
            
            // Reduce the settlement's warrior count
            if (settlement.military) {
                settlement.military.warriors -= warriors;
                if (settlement.military.warriors < 0) settlement.military.warriors = 0;
            }
        });
        
        // If no warriors available, can't create army
        if (totalWarriors <= 0) {
            console.warn(`Faction ${faction.name} couldn't muster any warriors`);
            return null;
        }
        
        // Create the army
        const armyId = `faction_army_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const armyName = generateArmyName(faction);
        
        const army = Object.assign({}, factionArmyTemplate, {
            id: armyId,
            name: armyName,
            factionId: faction.id,
            warriors: totalWarriors,
            strength: totalWarriors, // Simple 1:1 strength calculation
            originRegionId: musterRegionId,
            currentRegionId: musterRegionId,
            targetRegionId: targetRegionId,
            targetExpeditionId: targetExpeditionId,
            settlements: settlementIds
        });
        
        // If target is the same as current region, set status to defending
        if (musterRegionId === targetRegionId) {
            army.status = "defending";
        } else {
            // Find path to target region
            army.path = findPath(musterRegionId, targetRegionId);
            
            if (army.path.length > 0) {
                army.status = "marching";
            } else {
                // No path found, stay on defense
                army.status = "defending";
            }
        }
        
        // Add army to the list
        factionArmies.push(army);
        
        // Log army creation
        if (army.status === "defending") {
            Utils.log(`A force from ${faction.name} has mobilized to defend their territory.`, "important");
        } else {
            Utils.log(`A force from ${faction.name} has begun marching toward your expedition.`, "important");
        }
        
        return army;
    }
    
    /**
     * Process movement for a faction army
     * @param {Object} army - The faction army
     * @param {number} tickSize - Size of game tick in days
     */
    function processArmyMovement(army, tickSize) {
        if (army.status !== "marching" || army.path.length === 0) return;
        
        // The next region in the path is the target
        const nextRegionId = army.path[0];
        
        // Calculate total days needed for this movement
        const totalDays = calculateMovementDays(army.currentRegionId, nextRegionId);
        
        // Progress as percentage
        const progressIncrement = (tickSize / totalDays) * 100;
        army.movementProgress += progressIncrement;
        
        // If movement complete
        if (army.movementProgress >= 100) {
            // Update current region
            army.currentRegionId = nextRegionId;
            army.movementProgress = 0;
            
            // Remove the reached region from path
            army.path.shift();
            
            // Check if we've reached the target region
            if (army.currentRegionId === army.targetRegionId) {
                // We've reached the target region, now defending/searching
                army.status = "defending";
            } else if (army.path.length === 0) {
                // No more path but not at target, something's wrong
                // Default to defending current region
                army.status = "defending";
                army.targetRegionId = army.currentRegionId;
            }
        }
    }
    
    /**
     * Check for and initiate battles between faction armies and player expeditions
     * @param {Object} army - Faction army
     */
    function checkForBattles(army) {
        // Only active armies can engage in battle
        if (army.status === "disbanding" || army.status === "battling") return;
        
        // Get player expeditions in the same region
        const playerExpeditions = ExpeditionSystem.getExpeditions('player')
            .filter(exp => 
                exp.currentRegion === army.currentRegionId && 
                exp.status !== 'mustering' && 
                exp.status !== 'returning' &&
                exp.status !== 'disbanded'
            );
        
        // If no player expeditions, nothing to do
        if (playerExpeditions.length === 0) return;
        
        // Get region info
        const region = WorldMap.getRegion(army.currentRegionId);
        const regionName = region ? region.name : "Unknown Region";
        const faction = FactionIntegration.getFactionById(army.factionId);
        const factionName = faction ? faction.name : "Enemy";
        
        // Check if there's already a battle in this region
        const activeBattles = ConflictSystem.getActiveBattles();
        const existingBattle = activeBattles.find(battle => 
            battle.regionId === army.currentRegionId && battle.phase !== "concluded"
        );
        
        if (existingBattle) {
            // If battle exists and we're not part of it, join it
            if (!existingBattle.attackers.includes(army.id) && !existingBattle.defenders.includes(army.id)) {
                console.log(`Faction army ${army.id} joining existing battle in ${regionName}`);
                
                // In a full implementation, we would add ourselves to the battle
                // But since ConflictSystem doesn't have a joinBattle method, we'll have to wait
                // for the next battle to trigger
                return;
            }
            return; // Already in battle
        }
        
        // Determine if expedition is sieging (defender) or raiding (attacker)
        // If expedition is sieging, faction army should be attackers
        // If expedition is raiding, faction army should be defenders
        let factionIsAttacker = true;
        
        // Check if any player expedition is sieging
        const isSieging = playerExpeditions.some(exp => exp.status === 'sieging');
        if (isSieging) {
            // Player is sieging, faction is attacking to break the siege
            factionIsAttacker = true;
            Utils.log(`A ${factionName} army has arrived to break your siege!`, "danger");
        } else {
            // Player is raiding/etc, faction is defending
            factionIsAttacker = false;
            Utils.log(`Your expedition has encountered a ${factionName} army in ${regionName}!`, "danger");
        }
        
        // We found player expeditions in this region - engage in battle
        const battleData = {
            regionId: army.currentRegionId,
            regionName: regionName
        };
        
        // Create faction army format compatible with ConflictSystem
        const factionArmy = {
            id: army.id,
            ownerType: 'ai',
            warriors: army.warriors,
            strength: army.strength,
            factionId: army.factionId,
            name: army.name
        };
        
        // Set up attackers and defenders based on scenario
        if (factionIsAttacker) {
            battleData.attackers = [army.id];
            battleData.aiExpeditions = [factionArmy];
            battleData.defenders = playerExpeditions.map(exp => exp.id);
            battleData.playerExpeditions = playerExpeditions;
        } else {
            battleData.attackers = playerExpeditions.map(exp => exp.id);
            battleData.playerExpeditions = playerExpeditions;
            battleData.defenders = [army.id];
            battleData.aiExpeditions = [factionArmy];
        }
        
        // Initiate battle using conflict system
        if (window.ConflictSystem && typeof ConflictSystem.initiateBattle === 'function') {
            const battle = ConflictSystem.initiateBattle(battleData);
            
            // Update army status
            if (battle) {
                army.status = "battling";
            }
        }
    }
    
    /**
     * Update army status if it was in battle
     * @param {Object} army - Faction army
     */
    function updateArmyBattleStatus(army) {
        if (army.status !== "battling") return;
        
        // Check if still in active battle
        const activeBattles = ConflictSystem.getActiveBattles();
        const inBattle = activeBattles.some(battle => 
            battle.phase !== "concluded" && 
            (battle.attackers.includes(army.id) || battle.defenders.includes(army.id))
        );
        
        if (!inBattle) {
            // Battle is over, check the outcome
            const recentBattles = ConflictSystem.getActiveBattles(true); // Include completed
            const battle = recentBattles.find(battle => 
                (battle.attackers.includes(army.id) || battle.defenders.includes(army.id)) &&
                battle.phase === "concluded"
            );
            
            if (battle) {
                // Determine if army won or lost
                const isAttacker = battle.attackers.includes(army.id);
                const outcome = battle.outcome;
                
                // Attackers win with DECISIVE_VICTORY or VICTORY
                // Defenders win with DEFEAT or DEVASTATING_DEFEAT
                const armyWon = (isAttacker && (outcome === "decisive_victory" || outcome === "victory")) ||
                               (!isAttacker && (outcome === "defeat" || outcome === "devastating_defeat"));
                
                if (armyWon) {
                    // Army won, continue defending/pursuing
                    army.status = "defending";
                } else {
                    // Army lost, retreat or disband
                    // For simplicity, just disband
                    army.status = "disbanding";
                }
            } else {
                // No battle found, resume defending
                army.status = "defending";
            }
        }
    }
    
    /**
     * Process all faction armies for a game tick
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of the game tick in days
     */
    function processArmies(gameState, tickSize) {
        // Process each army
        for (let i = factionArmies.length - 1; i >= 0; i--) {
            const army = factionArmies[i];
            
            // Update days active
            army.daysActive += tickSize;
            
            // Process by status
            switch (army.status) {
                case "marching":
                    processArmyMovement(army, tickSize);
                    break;
                    
                case "defending":
                    // Check for battles with player expeditions
                    checkForBattles(army);
                    break;
                    
                case "battling":
                    // Update battle status
                    updateArmyBattleStatus(army);
                    break;
                    
                case "disbanding":
                    // Remove from list after some time
                    if (army.daysActive > army.expirationDays) {
                        // Return any remaining warriors to home settlements
                        returnWarriorsToSettlements(army);
                        factionArmies.splice(i, 1);
                    }
                    break;
            }
            
            // Check for automatic disbanding after expiration days
            if (army.daysActive > army.expirationDays && army.status !== "disbanding") {
                army.status = "disbanding";
            }
        }
    }
    
    /**
     * Return warriors to their home settlements when an army disbands
     * @param {Object} army - The faction army
     */
    function returnWarriorsToSettlements(army) {
        if (army.warriors <= 0) return;
        
        // Get the settlements
        const settlements = army.settlements
            .map(id => WorldMap.getSettlement(id))
            .filter(Boolean);
        
        if (settlements.length === 0) return;
        
        // Distribute warriors evenly
        const warriorsPerSettlement = Math.floor(army.warriors / settlements.length);
        const remainder = army.warriors % settlements.length;
        
        settlements.forEach((settlement, index) => {
            let returnedWarriors = warriorsPerSettlement;
            if (index === 0) returnedWarriors += remainder; // Add remainder to first settlement
            
            if (settlement.military) {
                settlement.military.warriors = (settlement.military.warriors || 0) + returnedWarriors;
            }
        });
        
        // Clear army warriors
        army.warriors = 0;
    }
    
    /**
     * Check for player expeditions and create faction responses
     * @param {Object} gameState - Current game state
     */
    function checkPlayerExpeditions(gameState) {
        // Process only every ARMY_CHECK_INTERVAL days
        if (gameState.date.day < nextArmyCheck) return;
        
        // Set next check time
        nextArmyCheck = gameState.date.day + ARMY_CHECK_INTERVAL;
        
        // Get all active player expeditions
        const playerExpeditions = ExpeditionSystem.getExpeditions('player');
        
        // No player expeditions, nothing to do
        if (playerExpeditions.length === 0) return;
        
        // Get all factions
        const factions = FactionIntegration.getFactionData().factions;
        
        // Process each player expedition
        playerExpeditions.forEach(expedition => {
            // Skip if not in an active state
            if (expedition.status === 'mustering' || 
                expedition.status === 'returning' ||
                expedition.status === 'disbanded') {
                return;
            }
            
            // Get the region the expedition is in
            const regionId = expedition.currentRegion;
            if (!regionId) return;
            
            // Check each faction
            factions.forEach(faction => {
                // Skip if faction already has an army targeting this expedition
                const hasArmyTargeting = factionArmies.some(army => 
                    army.factionId === faction.id && 
                    (army.targetExpeditionId === expedition.id || army.targetRegionId === regionId) &&
                    army.status !== "disbanding"
                );
                
                if (hasArmyTargeting) return;
                
                // Get faction territories
                const territories = getFactionTerritories(faction.id);
                const adjacentTerritories = getAdjacentTerritories(faction.id);
                
                // Check if expedition is in faction territory
                if (territories.includes(regionId)) {
                    // Expedition is in faction territory - high chance to respond
                    if (shouldFactionRespond(faction, "EXPEDITION_IN_TERRITORY")) {
                        musterFactionArmy(faction, regionId, expedition.id);
                    }
                } 
                // Check if expedition is adjacent to faction territory
                else if (adjacentTerritories.includes(regionId)) {
                    // Expedition is near faction territory - medium chance to respond
                    if (shouldFactionRespond(faction, "EXPEDITION_NEAR_TERRITORY")) {
                        musterFactionArmy(faction, regionId, expedition.id);
                    }
                }
            });
        });
        
        // Also check for player sieges
        const activeSieges = ConflictSystem.getActiveSieges();
        
        activeSieges.forEach(siege => {
            // Skip concluded sieges
            if (siege.phase === "concluded") return;
            
            // Get the settlement being sieged
            const settlement = WorldMap.getSettlement(siege.settlementId);
            if (!settlement) return;
            
            // Get the faction that owns this settlement
            const faction = FactionIntegration.getFactionById(settlement.factionId);
            if (!faction) return;
            
            // Skip if faction already has an army defending this region
            const hasDefendingArmy = factionArmies.some(army => 
                army.factionId === faction.id && 
                army.targetRegionId === siege.regionId &&
                army.status !== "disbanding"
            );
            
            if (hasDefendingArmy) return;
            
            // High chance to respond to siege
            if (shouldFactionRespond(faction, "SIEGE_RESPONSE")) {
                musterFactionArmy(faction, siege.regionId);
            }
        });
    }
    
    // Public API
    return {
        /**
         * Initialize the faction army system
         */
        init: function() {
            console.log("Initializing Faction Army System...");
            
            // Register with game engine if available
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(this.processTick);
            }
            
            console.log("Faction Army System initialized");
        },
        
        /**
         * Process a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Skip processing if systems aren't ready
            if (!window.FactionIntegration || !window.ExpeditionSystem || !window.ConflictSystem) {
                return;
            }
            
            // Check for player expeditions and create faction responses
            checkPlayerExpeditions(gameState);
            
            // Process faction armies
            processArmies(gameState, tickSize);
        },
        
        /**
         * Get all faction armies
         * @param {string} [factionId] - Optional faction ID to filter by
         * @returns {Array} - Array of faction armies
         */
        getFactionArmies: function(factionId) {
            if (factionId) {
                return factionArmies.filter(army => army.factionId === factionId);
            }
            return [...factionArmies];
        },
        
        /**
         * Get a specific faction army by ID
         * @param {string} armyId - ID of the army
         * @returns {Object|undefined} - The faction army or undefined if not found
         */
        getFactionArmy: function(armyId) {
            return factionArmies.find(army => army.id === armyId);
        },
        
        /**
         * Manually create a faction army (for testing or scripted events)
         * @param {string} factionId - ID of the faction
         * @param {string} regionId - ID of the region to defend
         * @param {string} [targetExpeditionId] - Optional ID of player expedition to target
         * @returns {Object|null} - The created army or null if creation failed
         */
        createFactionArmy: function(factionId, regionId, targetExpeditionId) {
            const faction = FactionIntegration.getFactionById(factionId);
            if (!faction) return null;
            
            return musterFactionArmy(faction, regionId, targetExpeditionId);
        },
        
        /**
         * Get all faction armies in a specific region
         * @param {string} regionId - ID of the region
         * @returns {Array} - Array of faction armies in the region
         */
        getArmiesInRegion: function(regionId) {
            return factionArmies.filter(army => army.currentRegionId === regionId);
        },
        
        /**
         * Disband a faction army
         * @param {string} armyId - ID of the army to disband
         * @returns {boolean} - Whether the army was successfully disbanded
         */
        disbandArmy: function(armyId) {
            const army = factionArmies.find(a => a.id === armyId);
            if (!army) return false;
            
            army.status = "disbanding";
            return true;
        }
    };
})();

// Expose FactionArmySystem to the window object for global access
window.FactionArmySystem = FactionArmySystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game engine to be ready
    const waitForGameEngine = setInterval(function() {
        if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning && 
            typeof FactionIntegration !== 'undefined' && 
            typeof ExpeditionSystem !== 'undefined' &&
            typeof ConflictSystem !== 'undefined') {
            clearInterval(waitForGameEngine);
            
            // Initialize the faction army system
            FactionArmySystem.init();
            
            console.log("Faction Army System ready - factions can now respond to player expeditions");
        }
    }, 500);
});
