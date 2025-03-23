/**
 * Viking Legacy - Simplified Faction Army System
 * 
 * This streamlined version focuses on the core functionality:
 * - Detect player expeditions in or near faction territories
 * - Create faction armies to respond
 * - Simulate army movement with simple timers
 * - Initiate battles when armies intercept player expeditions
 */

const FactionArmySystem = (function() {
    // Private variables
    let factionArmies = [];
    let lastCheckTime = 0;
    
    // Configuration
    const CONFIG = {
        CHECK_INTERVAL: 1, // Check twice per day (was 5 in original)
        RESPONSE_CHANCE: 0.9, // Very high chance (was 0.7 in original)
        NEAR_TERRITORY_RESPONSE_CHANCE: 0.7, // High chance (was 0.4 in original)
        SIEGE_RESPONSE_CHANCE: 0.98, // Almost guaranteed response (was 0.9 in original)
        MAX_ARMIES_PER_FACTION: 4, // Allow more armies
        MOVEMENT_DAYS: {
            SAME_REGION: 1, // Half a day if already in same region
            ADJACENT_REGION: 2, // 1.5 days if in adjacent region
            DISTANT_REGION: 3 // 3 days if further away
        },
        DEBUG: true, // Enable debug logging
        FORCE_RESPONSE: true // Set to true to force factions to always respond (for testing)
    };
    
    // Army template
    const armyTemplate = {
        id: "",
        name: "",
        factionId: "",
        status: "mustering", // mustering, marching, battling, defending, disbanding
        warriors: 0,
        strength: 0,
        originRegionId: "",
        currentRegionId: "",
        targetRegionId: "",
        targetExpeditionId: "",
        daysUntilArrival: 0, // Simplified movement
        daysActive: 0
    };

    // Debug logger
    function debugLog(message, data) {
        if (CONFIG.DEBUG) {
            console.log(`[FactionArmySystem] ${message}`, data || '');
        }
    }
    
    /**
     * Generate a name for a faction army
     */
    function generateArmyName(faction) {
        const prefixes = ["Warband", "Host", "Army", "Guard", "Levy", "Force"];
        const suffixes = ["Warriors", "Defenders", "Raiders", "Protectors", "Shieldwall"];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${faction.name} ${prefix} of ${suffix}`;
    }
    
    /**
     * Get a simplified list of regions controlled by a faction
     */
    function getFactionTerritories(factionId) {
        // Get all settlements controlled by this faction
        const worldData = WorldMap.getWorldMap();
        
        const factionSettlements = worldData.settlements.filter(s => 
            s.factionId === factionId || 
            (s.faction && factionId.includes(s.faction))
        );
        
        debugLog(`Found ${factionSettlements.length} settlements for faction ${factionId}`);
        
        // Return unique region IDs
        return [...new Set(factionSettlements.map(s => s.region))];
    }
    
    /**
     * Get territories adjacent to faction territories
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
     * Check if a faction should respond to player activity
     */
    function shouldFactionRespond(faction, triggerType) {
        // TESTING OVERRIDE: If force response is enabled, always respond
        if (CONFIG.FORCE_RESPONSE) {
            debugLog(`FORCE_RESPONSE enabled - ${faction.name} will respond to ${triggerType}`);
            return true;
        }
        
        // Check if faction already has maximum armies
        const factionActiveArmies = factionArmies.filter(
            army => army.factionId === faction.id && army.status !== "disbanding"
        );
        
        if (factionActiveArmies.length >= CONFIG.MAX_ARMIES_PER_FACTION) {
            debugLog(`${faction.name} already has ${factionActiveArmies.length} armies, won't respond`);
            return false;
        }
        
        // Get response chance based on trigger type
        let responseChance;
        switch (triggerType) {
            case "EXPEDITION_IN_TERRITORY":
                responseChance = CONFIG.RESPONSE_CHANCE;
                break;
            case "EXPEDITION_NEAR_TERRITORY":
                responseChance = CONFIG.NEAR_TERRITORY_RESPONSE_CHANCE;
                break;
            case "SIEGE_RESPONSE":
                responseChance = CONFIG.SIEGE_RESPONSE_CHANCE;
                break;
            default:
                responseChance = 0.5;

                        // Random check
            const roll = Math.random();
            const willRespond = roll < finalChance;
            
            debugLog(`${faction.name} response check for ${triggerType}: ${roll.toFixed(2)} vs ${finalChance.toFixed(2)} = ${willRespond ? 'WILL RESPOND' : 'WILL NOT RESPOND'}`);
            
            return willRespond;
        }
        
        // Modify based on faction type and available warriors
        let factionModifier = 1.0;
        
        // Get total faction warriors
        const factionSettlements = WorldMap.getWorldMap().settlements
            .filter(s => s.factionId === faction.id || 
                         (s.faction && faction.id.includes(s.faction)));
        
        const totalWarriors = factionSettlements.reduce((sum, s) => 
            sum + (s.military?.warriors || 0), 0);
        
        // IMPROVED: Check if faction has warriors to respond
        if (totalWarriors < 5) {
            debugLog(`${faction.name} has only ${totalWarriors} warriors, less likely to respond`);
            factionModifier *= 0.5; // Much less likely if few warriors
        } else if (totalWarriors > 20) {
            debugLog(`${faction.name} has ${totalWarriors} warriors, more likely to respond`);
            factionModifier *= 1.2; // More likely if many warriors
        }
        
        // Apply faction type modifiers
        if (faction.type === "ANGLO_SAXON") {
            factionModifier *= 1.2; // Anglo-Saxons more likely to defend territory
        } else if (faction.type === "FRANKISH") {
            factionModifier *= 1.5; // Franks even more likely to defend
        }
        
        // Apply final chance
        const finalChance = Math.min(responseChance * factionModifier, 0.98); // Cap at 98%
        
        // Random check
        const roll = Math.random();
        const willRespond = roll < finalChance;
        
        debugLog(`${faction.name} response check for ${triggerType}: ${roll.toFixed(2)} vs ${finalChance.toFixed(2)} = ${willRespond ? 'WILL RESPOND' : 'WILL NOT RESPOND'}`);
        
        return willRespond;
    }
    
    /**
     * Simplified function to muster a faction army
     */
    function musterFactionArmy(faction, targetRegionId, targetExpeditionId = null) {
        debugLog(`${faction.name} mustering army to ${targetRegionId}`, { targetExpeditionId });
        
        // Determine muster region (any faction territory)
        const factionTerritories = getFactionTerritories(faction.id);
        if (factionTerritories.length === 0) {
            debugLog(`${faction.name} has no territories to muster from`);
            return null;
        }
        
        // Find a suitable muster region
        let musterRegionId;
        
        // If target is a faction territory, muster there
        if (factionTerritories.includes(targetRegionId)) {
            musterRegionId = targetRegionId;
        } else {
            // Try to find an adjacent territory first for faster response
            const adjacentTerritories = factionTerritories.filter(territoryId => 
                WorldMap.getAdjacentRegions(territoryId).includes(targetRegionId)
            );
            
            if (adjacentTerritories.length > 0) {
                // Pick a random adjacent territory
                musterRegionId = adjacentTerritories[Math.floor(Math.random() * adjacentTerritories.length)];
                debugLog(`Selected adjacent territory ${musterRegionId} for faster response`);
            } else {
                // Pick closest territory (simplified to just the first one)
                musterRegionId = factionTerritories[0];
                debugLog(`No adjacent territories, using ${musterRegionId}`);
            }
        }
        
        // Get all faction settlements to contribute warriors - IMPORTANT FIX
        const factionSettlements = WorldMap.getWorldMap().settlements
            .filter(s => s.factionId === faction.id || 
                         (s.faction && faction.id.includes(s.faction)));
        
        if (factionSettlements.length === 0) {
            debugLog(`No settlements found for faction ${faction.name}`);
            return null;
        }
        
        debugLog(`Found ${factionSettlements.length} settlements for faction ${faction.name}`, 
                 factionSettlements.map(s => s.name));
        
        // Calculate total warriors and strength
        let totalWarriors = 0;
        
        factionSettlements.forEach(settlement => {
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
            debugLog(`${faction.name} couldn't muster any warriors`);
            return null;
        }
        
        // Create the army
        const armyId = `faction_army_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const armyName = generateArmyName(faction);
        
        // Simplified travel time calculation
        let daysUntilArrival;
        
        if (musterRegionId === targetRegionId) {
            // Already in the target region
            daysUntilArrival = CONFIG.MOVEMENT_DAYS.SAME_REGION;
        } else if (WorldMap.getAdjacentRegions(musterRegionId).includes(targetRegionId)) {
            // Adjacent region
            daysUntilArrival = CONFIG.MOVEMENT_DAYS.ADJACENT_REGION;
        } else {
            // Distant region
            daysUntilArrival = CONFIG.MOVEMENT_DAYS.DISTANT_REGION;
        }
        
        // Create the army object
        const army = {
            id: armyId,
            name: armyName,
            factionId: faction.id,
            status: musterRegionId === targetRegionId ? "defending" : "marching",
            warriors: totalWarriors,
            strength: totalWarriors, // Simple 1:1 strength
            originRegionId: musterRegionId,
            currentRegionId: musterRegionId,
            targetRegionId: targetRegionId,
            targetExpeditionId: targetExpeditionId,
            daysUntilArrival: daysUntilArrival,
            daysActive: 0
        };
        
        // Add army to the list
        factionArmies.push(army);
        
        // Log army creation
        if (army.status === "defending") {
            Utils.log(`A force from ${faction.name} has mobilized to defend their territory.`, "important");
        } else {
            Utils.log(`A force from ${faction.name} has begun marching toward your expedition.`, "important");
        }
        
        debugLog(`Created ${army.name} with ${army.warriors} warriors`, army);
        
        return army;
    }
    
    /**
     * Check for player expeditions and create faction responses
     */
    function checkPlayerExpeditions(gameState) {
        // Check if it's time to run this function
        if (gameState.date.day - lastCheckTime < CONFIG.CHECK_INTERVAL) {
            return;
        }
        
        // Update last check time
        lastCheckTime = gameState.date.day;
        
        debugLog("Checking for player expeditions...");
        
        // Get all active player expeditions
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpeditions) {
            debugLog("ExpeditionSystem not available");
            return;
        }
        
        // IMPROVED: Get ALL expeditions, even if in undiscovered regions
        const playerExpeditions = ExpeditionSystem.getExpeditions('player')
            .filter(exp => exp.status !== 'mustering' && exp.status !== 'disbanded');
        
        // No player expeditions, nothing to do
        if (playerExpeditions.length === 0) {
            debugLog("No player expeditions found");
            return;
        }
        
        // BETTER VISIBILITY: Log detailed info about each expedition
        playerExpeditions.forEach((exp, index) => {
            const region = WorldMap.getRegion(exp.currentRegion);
            const regionName = region ? region.name : 'Unknown Region';
            const discovered = region ? (region.discovered ? 'Discovered' : 'Undiscovered') : 'Unknown';
            
            debugLog(`Expedition ${index+1}: ${exp.name} in ${regionName} (${discovered})`, {
                id: exp.id,
                status: exp.status,
                regionId: exp.currentRegion,
                targetRegionId: exp.targetRegion,
                warriors: exp.warriors
            });
        });
        
        // Get all factions
        if (!window.FactionIntegration || !FactionIntegration.getFactionData) {
            debugLog("FactionIntegration not available");
            return;
        }
        
        const factions = FactionIntegration.getFactionData().factions;
        if (!factions || factions.length === 0) {
            debugLog("No factions found");
            return;
        }
        
        debugLog(`Found ${factions.length} factions`);
        
        // Process each player expedition
        playerExpeditions.forEach(expedition => {
            // Skip if not in an active state (mustering and disbanded already filtered)
            if (expedition.status === 'returning') {
                debugLog(`Skipping expedition ${expedition.name} - is returning`);
                return;
            }
            
            // Get the region the expedition is in
            const regionId = expedition.currentRegion;
            if (!regionId) {
                debugLog(`Expedition ${expedition.name} has no current region`);
                return;
            }
            
            debugLog(`Processing player expedition in region ${regionId}`, expedition);
            
            // IMPORTANT FIX: Force discover this region for faction detection
            // This ensures factions can respond even if player hasn't officially "discovered" the region
            // We're simulating that factions already know their own territory
            const region = WorldMap.getRegion(regionId);
            if (region && !region.discovered) {
                debugLog(`Auto-discovering region ${region.name} for faction detection`);
                // We're not calling the actual discovery function to avoid UI notifications
                // Just marking it as discovered internally
                region.discovered = true;
            }
            
            // Check each faction
            factions.forEach(faction => {
                debugLog(`Checking if ${faction.name} should respond to expedition in ${regionId}`);
                
                // Skip if faction already has an army targeting this expedition
                const hasArmyTargeting = factionArmies.some(army => 
                    army.factionId === faction.id && 
                    (army.targetExpeditionId === expedition.id || army.targetRegionId === regionId) &&
                    army.status !== "disbanding"
                );
                
                if (hasArmyTargeting) {
                    debugLog(`${faction.name} already has army targeting this expedition`);
                    return;
                }
                
                // Get faction territories
                const territories = getFactionTerritories(faction.id);
                const adjacentTerritories = getAdjacentTerritories(faction.id);
                
                debugLog(`${faction.name} controls ${territories.length} territories:`, territories);
                debugLog(`${faction.name} has ${adjacentTerritories.length} adjacent territories:`, adjacentTerritories);
                
                // Check if expedition is in faction territory
                if (territories.includes(regionId)) {
                    // Expedition is in faction territory - high chance to respond
                    debugLog(`ALERT! Player expedition found in ${faction.name} territory!`);
                    if (shouldFactionRespond(faction, "EXPEDITION_IN_TERRITORY")) {
                        const army = musterFactionArmy(faction, regionId, expedition.id);
                        if (army) {
                            debugLog(`Success: ${faction.name} mustered army ${army.name} to respond`);
                        } else {
                            debugLog(`Failed: ${faction.name} couldn't muster an army to respond`);
                        }
                    }
                } 
                // Check if expedition is adjacent to faction territory
                else if (adjacentTerritories.includes(regionId)) {
                    // Expedition is near faction territory - medium chance to respond
                    debugLog(`Player expedition found near ${faction.name} territory!`);
                    if (shouldFactionRespond(faction, "EXPEDITION_NEAR_TERRITORY")) {
                        const army = musterFactionArmy(faction, regionId, expedition.id);
                        if (army) {
                            debugLog(`Success: ${faction.name} mustered army ${army.name} to respond to nearby expedition`);
                        } else {
                            debugLog(`Failed: ${faction.name} couldn't muster an army to respond to nearby expedition`);
                        }
                    }
                } else {
                    debugLog(`Expedition not in or near ${faction.name} territory - no response`);
                }
            });
        });
        
        // Also check for player sieges
        if (window.ConflictSystem && ConflictSystem.getActiveSieges) {
            const activeSieges = ConflictSystem.getActiveSieges();
            debugLog(`Found ${activeSieges.length} active sieges`);
            
            activeSieges.forEach(siege => {
                // Skip concluded sieges
                if (siege.phase === "concluded") return;
                
                // Get the settlement being sieged
                const settlement = WorldMap.getSettlement(siege.settlementId);
                if (!settlement) return;
                
                debugLog(`Processing siege of ${settlement.name}`, siege);
                
                // Get the faction that owns this settlement
                const faction = FactionIntegration.getFactionById(settlement.factionId);
                if (!faction) return;
                
                // Skip if faction already has an army defending this region
                const hasDefendingArmy = factionArmies.some(army => 
                    army.factionId === faction.id && 
                    army.targetRegionId === siege.regionId &&
                    army.status !== "disbanding"
                );
                
                if (hasDefendingArmy) {
                    debugLog(`${faction.name} already has army defending against this siege`);
                    return;
                }
                
                // High chance to respond to siege
                debugLog(`Settlement owned by ${faction.name} is under siege!`);
                if (shouldFactionRespond(faction, "SIEGE_RESPONSE")) {
                    musterFactionArmy(faction, siege.regionId);
                }
            });
        }
    }
    
    /**
     * Process all faction armies for a game tick
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
                    // Simplified movement - just count down days until arrival
                    army.daysUntilArrival -= tickSize;
                    
                    // If arrived at destination
                    if (army.daysUntilArrival <= 0) {
                        // Update current region and status
                        army.currentRegionId = army.targetRegionId;
                        army.status = "defending";
                        
                        // Log arrival for player
                        const region = WorldMap.getRegion(army.currentRegionId);
                        const regionName = region ? region.name : "the region";
                        const faction = FactionIntegration.getFactionById(army.factionId);
                        const factionName = faction ? faction.name : "Enemy";
                        
                        Utils.log(`A ${factionName} army has arrived in ${regionName}!`, "danger");
                        
                        // Check for battles immediately
                        checkForBattles(army);
                    }
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
                    if (army.daysActive > 30) { // 30 days expiration
                        // Return any remaining warriors to home settlements
                        returnWarriorsToSettlements(army);
                        factionArmies.splice(i, 1);
                    }
                    break;
            }
            
            // Check for automatic disbanding after 30 days
            if (army.daysActive > 30 && army.status !== "disbanding") {
                debugLog(`${army.name} has been active for over 30 days, disbanding`);
                army.status = "disbanding";
            }
        }
    }
    
    /**
     * Check for and initiate battles between faction armies and player expeditions
     */
    function checkForBattles(army) {
        // Only active armies can engage in battle
        if (army.status === "disbanding" || army.status === "battling" || army.status === "marching") return;
        
        debugLog(`Checking for battles for ${army.name} in region ${army.currentRegionId}`);
        
        // Get player expeditions in the same region
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpeditions) {
            debugLog("ExpeditionSystem not available for battle check");
            return;
        }
        
        const playerExpeditions = ExpeditionSystem.getExpeditions('player')
            .filter(exp => 
                exp.currentRegion === army.currentRegionId && 
                exp.status !== 'mustering' && 
                exp.status !== 'returning' &&
                exp.status !== 'disbanded'
            );
        
        // If no player expeditions, nothing to do
        if (playerExpeditions.length === 0) {
            debugLog("No player expeditions found in region for battle");
            return;
        }
        
        debugLog(`Found ${playerExpeditions.length} player expeditions in region for potential battle`);
        
        // Get region info
        const region = WorldMap.getRegion(army.currentRegionId);
        const regionName = region ? region.name : "Unknown Region";
        const faction = FactionIntegration.getFactionById(army.factionId);
        const factionName = faction ? faction.name : "Enemy";
        
        // Check if conflict system exists
        if (!window.ConflictSystem || !ConflictSystem.initiateBattle) {
            debugLog("ConflictSystem not available for battle initiation");
            return;
        }
        
        // Check if there's already a battle in this region
        const activeBattles = ConflictSystem.getActiveBattles();
        const existingBattle = activeBattles.find(battle => 
            battle.regionId === army.currentRegionId && battle.phase !== "concluded"
        );
        
        if (existingBattle) {
            debugLog("Battle already in progress in this region");
            return; // Already in battle
        }
        
        // Determine if expedition is sieging (defender) or raiding (attacker)
        const isSieging = playerExpeditions.some(exp => exp.status === 'sieging');
        const factionIsAttacker = isSieging;
        
        if (isSieging) {
            // Player is sieging, faction is attacking to break the siege
            Utils.log(`A ${factionName} army has arrived to break your siege!`, "danger");
        } else {
            // Player is raiding/etc, faction is defending
            Utils.log(`Your expedition has encountered a ${factionName} army in ${regionName}!`, "danger");
        }
        
        // Create battle data
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
        
        debugLog("Initiating battle", battleData);
        
        // Initiate battle using conflict system
        const battle = ConflictSystem.initiateBattle(battleData);
        
        // Update army status
        if (battle) {
            army.status = "battling";
            debugLog("Battle initiated successfully");
        } else {
            debugLog("Failed to initiate battle");
        }
    }
    
    /**
     * Update army status after a battle
     */
    function updateArmyBattleStatus(army) {
        if (army.status !== "battling") return;
        
        if (!window.ConflictSystem || !ConflictSystem.getActiveBattles) {
            return;
        }
        
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
                    // Army won, continue defending
                    army.status = "defending";
                } else {
                    // Army lost, retreat or disband
                    army.status = "disbanding";
                }
            } else {
                // No battle found, resume defending
                army.status = "defending";
            }
        }
    }
    
    /**
     * Return warriors to their home settlements when an army disbands
     */
    function returnWarriorsToSettlements(army) {
        if (army.warriors <= 0) return;
        
        // Get faction's settlements
        const factionSettlements = WorldMap.getWorldMap().settlements
            .filter(s => s.factionId === army.factionId);
        
        if (factionSettlements.length === 0) return;
        
        // Distribute warriors evenly
        const warriorsPerSettlement = Math.floor(army.warriors / factionSettlements.length);
        const remainder = army.warriors % factionSettlements.length;
        
        factionSettlements.forEach((settlement, index) => {
            let returnedWarriors = warriorsPerSettlement;
            if (index === 0) returnedWarriors += remainder; // Add remainder to first settlement
            
            if (settlement.military) {
                settlement.military.warriors = (settlement.military.warriors || 0) + returnedWarriors;
            }
        });
        
        // Clear army warriors
        army.warriors = 0;
    }
    
    // Public API
    return {
        /**
         * Initialize the faction army system
         */
        init: function() {
            console.log("Initializing Simplified Faction Army System...");
            
            // Register with game engine if available
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(this.processTick);
                debugLog("Registered with GameEngine tick processor");
            } else {
                console.error("GameEngine not available, faction armies may not work properly");
            }
            
            debugLog("Simplified Faction Army System initialized");
        },
        
        /**
         * Process a game tick
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
         */
        getFactionArmies: function(factionId) {
            if (factionId) {
                return factionArmies.filter(army => army.factionId === factionId);
            }
            return [...factionArmies];
        },
        
        /**
         * Get a specific faction army by ID
         */
        getFactionArmy: function(armyId) {
            return factionArmies.find(army => army.id === armyId);
        },
        
        /**
         * Manually create a faction army (for testing or scripted events)
         */
        createFactionArmy: function(factionId, regionId, targetExpeditionId) {
            const faction = FactionIntegration.getFactionById(factionId);
            if (!faction) {
                debugLog(`Faction with ID ${factionId} not found`);
                return null;
            }
            
            return musterFactionArmy(faction, regionId, targetExpeditionId);
        },
        
        /**
         * Force check for player expeditions (for debugging)
         */
        forceCheckExpeditions: function() {
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.getGameState === 'function') {
                const gameState = GameEngine.getGameState();
                debugLog("Forcing expedition check", gameState);
                checkPlayerExpeditions(gameState);
                return true;
            }
            debugLog("GameEngine not available for forced check");
            return false;
        },
        
        /**
         * Force response mode (for testing)
         * @param {boolean} enable - Whether to force factions to always respond
         */
        setForceResponse: function(enable) {
            CONFIG.FORCE_RESPONSE = enable;
            debugLog(`Force response mode ${enable ? 'ENABLED' : 'DISABLED'}`);
            return CONFIG.FORCE_RESPONSE;
        },
        
        /**
         * Debug function to print faction territories
         */
        debugPrintTerritories: function() {
            console.group("Faction Territories Debug");
            
            if (!window.FactionIntegration || !FactionIntegration.getFactionData) {
                console.log("FactionIntegration not available");
                console.groupEnd();
                return;
            }
            
            const factions = FactionIntegration.getFactionData().factions;
            
            factions.forEach(faction => {
                const territories = getFactionTerritories(faction.id);
                console.log(`Faction: ${faction.name} (${faction.id})`);
                console.log(`Territories (${territories.length}):`, territories);
                
                // Check settlements
                const worldData = WorldMap.getWorldMap();
                const settlements = worldData.settlements.filter(s => 
                    s.factionId === faction.id || (s.faction && faction.id.includes(s.faction))
                );
                
                console.log(`Settlements (${settlements.length}):`, 
                    settlements.map(s => ({ name: s.name, region: s.region }))
                );
            });
            
            console.groupEnd();
        },
        
        /**
         * Get all faction armies in a specific region
         */
        getArmiesInRegion: function(regionId) {
            return factionArmies.filter(army => army.currentRegionId === regionId);
        },
        
        /**
         * Disband a faction army
         */
        disbandArmy: function(armyId) {
            const army = factionArmies.find(a => a.id === armyId);
            if (!army) return false;
            
            army.status = "disbanding";
            return true;
        }
    };
})();

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
            
            console.log("Simplified Faction Army System ready - factions can now respond to player expeditions");
            
            // IMPORTANT: Add a forced check after a short delay to ensure settlements have factionId set
            setTimeout(() => {
                console.log("Running initial faction system check and debugging...");
                FactionArmySystem.debugPrintTerritories();
                FactionArmySystem.forceCheckExpeditions();
            }, 5000);
        }
    }, 500);
});