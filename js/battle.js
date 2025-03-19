/**
 * Viking Legacy - Battle System
 * Handles combat mechanics for raiding and sieging settlements
 * 
 * Fixed version with simplified UI flow and better integration
 * with explorer panel
 */

const BattleSystem = (function() {
    // Private variables
    let battleHistory = [];
    
    // Battle outcome types
    const BATTLE_OUTCOMES = {
        DECISIVE_VICTORY: "Decisive Victory",
        VICTORY: "Victory",
        PYRRHIC_VICTORY: "Pyrrhic Victory",
        DEFEAT: "Defeat",
        DISASTER: "Disaster",
        RETREAT: "Tactical Retreat"
    };
    
    // Battle types
    const BATTLE_TYPES = {
        RAID: "raid",
        SIEGE: "siege"
    };
    
    // Unit strength multipliers
    const STRENGTH_MULTIPLIERS = {
        // Basic units
        warrior: 1.0,
        veteran: 1.5,
        berserker: 2.0,
        
        // Defenders
        fortification: 1.5,  // Defender bonus from fortifications
        home_ground: 1.2     // Defender bonus for fighting on home ground
    };
    
    // Resource loot percentages by battle outcome
    const RAID_LOOT_PERCENTAGE = {
        [BATTLE_OUTCOMES.DECISIVE_VICTORY]: 0.35, // Can take 35% of resources
        [BATTLE_OUTCOMES.VICTORY]: 0.25,
        [BATTLE_OUTCOMES.PYRRHIC_VICTORY]: 0.15,
        [BATTLE_OUTCOMES.DEFEAT]: 0.05,
        [BATTLE_OUTCOMES.DISASTER]: 0.0
    };
    
    // Casualties percentages by battle outcome (percent of involved troops lost)
    const CASUALTIES_PERCENTAGE = {
        [BATTLE_OUTCOMES.DECISIVE_VICTORY]: { attacker: 0.05, defender: 0.25 },
        [BATTLE_OUTCOMES.VICTORY]: { attacker: 0.1, defender: 0.2 },
        [BATTLE_OUTCOMES.PYRRHIC_VICTORY]: { attacker: 0.25, defender: 0.15 },
        [BATTLE_OUTCOMES.DEFEAT]: { attacker: 0.3, defender: 0.1 },
        [BATTLE_OUTCOMES.DISASTER]: { attacker: 0.5, defender: 0.05 },
        [BATTLE_OUTCOMES.RETREAT]: { attacker: 0.15, defender: 0.0 }
    };
    
    // Fame rewards by battle outcome
    const FAME_REWARDS = {
        [BATTLE_OUTCOMES.DECISIVE_VICTORY]: 100,
        [BATTLE_OUTCOMES.VICTORY]: 75,
        [BATTLE_OUTCOMES.PYRRHIC_VICTORY]: 50,
        [BATTLE_OUTCOMES.DEFEAT]: 10,
        [BATTLE_OUTCOMES.DISASTER]: 0,
        [BATTLE_OUTCOMES.RETREAT]: 5
    };
    
    // Relation impacts by battle type and outcome
    const RELATION_IMPACTS = {
        raid: {
            [BATTLE_OUTCOMES.DECISIVE_VICTORY]: -15,
            [BATTLE_OUTCOMES.VICTORY]: -10,
            [BATTLE_OUTCOMES.PYRRHIC_VICTORY]: -5,
            [BATTLE_OUTCOMES.DEFEAT]: -2,
            [BATTLE_OUTCOMES.DISASTER]: 0,
            [BATTLE_OUTCOMES.RETREAT]: 0
        },
        siege: {
            [BATTLE_OUTCOMES.DECISIVE_VICTORY]: -30,
            [BATTLE_OUTCOMES.VICTORY]: -25,
            [BATTLE_OUTCOMES.PYRRHIC_VICTORY]: -20,
            [BATTLE_OUTCOMES.DEFEAT]: -5,
            [BATTLE_OUTCOMES.DISASTER]: 0,
            [BATTLE_OUTCOMES.RETREAT]: -3
        }
    };
    
    // Private methods
    
    /**
     * Calculate combat strength for a given party
     * @param {Object} party - Party details including warriors, type, etc.
     * @param {boolean} isDefender - Whether this is the defending party
     * @returns {number} - Total combat strength
     */
    function calculateCombatStrength(party, isDefender = false) {
        if (!party) return 0;
        
        // Base strength from warriors
        let strength = party.strength || party.warriors || 0;
        
        // Apply defender bonuses if applicable
        if (isDefender) {
            // Apply fortification bonus
            if (party.defenses > 0) {
                strength += party.defenses * STRENGTH_MULTIPLIERS.fortification;
            }
            
            // Home ground advantage
            strength *= STRENGTH_MULTIPLIERS.home_ground;
        }
        
        // Apply morale modifier (explorer parties have morale)
        if (party.morale) {
            strength *= (party.morale / 100);
        }
        
        return strength;
    }
    
    /**
     * Create a battle history panel
     */
    function createBattleHistoryPanel() {
        // Check if the panel already exists
        if (document.getElementById('battle-history-panel')) {
            console.log("Battle history panel already exists, skipping creation");
            return;
        }
        
        // Create panel
        const historyPanel = document.createElement('div');
        historyPanel.id = 'battle-history-panel';
        historyPanel.className = 'battle-history-panel panel-container';
        
        // Add panel content
        historyPanel.innerHTML = `
            <h2>Battle History</h2>
            <div class="battle-content">
                <div id="battle-history-section" class="battle-section">
                    <div id="history-list" class="history-list">
                        <p>No battles recorded yet. Your great deeds await!</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(historyPanel);
            
            // Add styles
            addBattleHistoryStyles();
            
            // Register with NavigationSystem
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('battle-history-panel', 'explore');
            }
        }
    }
    
    /**
     * Add styles for battle history panel
     */
    function addBattleHistoryStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .battle-history-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #c9ba9b;
                margin-top: 20px;
            }
            
            .battle-history-panel h2 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-bottom: 15px;
                letter-spacing: 1px;
                font-weight: 700;
            }
            
            .battle-section {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .history-list {
                max-height: 400px;
                overflow-y: auto;
                background-color: #fff;
                border-radius: 4px;
                margin: 10px 0;
                padding: 10px;
            }
            
            .history-item {
                padding: 12px;
                margin-bottom: 10px;
                background-color: #f8f5f0;
                border-radius: 4px;
                border-left: 3px solid #8b7355;
            }
            
            .history-victory {
                border-left-color: #2e7d32;
            }
            
            .history-defeat {
                border-left-color: #c62828;
            }
            
            .history-retreat {
                border-left-color: #ff8f00;
            }
            
            .history-header {
                font-weight: bold;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .history-date {
                font-size: 0.9rem;
                color: #8b7355;
                margin-bottom: 5px;
            }
            
            .history-result {
                font-size: 0.9rem;
                color: #5d4037;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Update the battle history panel
     */
    function updateBattleHistoryUI() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        if (battleHistory.length === 0) {
            historyList.innerHTML = '<p>No battles recorded yet. Your great deeds await!</p>';
            return;
        }
        
        let historyHTML = '';
        
        // Show most recent battles first
        const recentBattles = battleHistory.slice().reverse();
        
        recentBattles.forEach(battle => {
            const outcomeClass = battle.outcome.includes('Victory') ? 
                'history-victory' : (battle.outcome === BATTLE_OUTCOMES.RETREAT ? 
                    'history-retreat' : 'history-defeat');
                    
            historyHTML += `
                <div class="history-item ${outcomeClass}">
                    <div class="history-header">
                        <strong>${battle.type.charAt(0).toUpperCase() + battle.type.slice(1)}</strong> - 
                        ${battle.outcome} at ${battle.defender.name}
                    </div>
                    <div class="history-date">
                        Year ${battle.date.year}, ${battle.date.season}
                    </div>
                    <div class="history-result">
                        <span>Casualties: ${battle.casualties.attacker}</span> • 
                        <span>Fame: +${battle.fameReward}</span>
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = historyHTML;
    }
    
    // Public API
    return {
        /**
         * Initialize the battle system
         */
        init: function() {
            console.log("Initializing Battle System...");
            
            // Create the battle history panel
            createBattleHistoryPanel();
            
            // Register with game engine for tick processing
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(this.processTick.bind(this));
            }
            
            console.log("Battle System initialized");

            // Register battle integration system
if (typeof window !== 'undefined' && !window.battleIntegrationRegistered) {
    // Ensure ExplorerSystem has correct warrior adjustment
    const originalAdjustWarriorCount = ExplorerSystem.adjustWarriorCount;
    ExplorerSystem.adjustWarriorCount = function(count) {
        // Call original function
        originalAdjustWarriorCount.call(ExplorerSystem, count);
        
        // Double-check that party data was updated
        const state = ExplorerSystem.getExplorerState();
        if (state.warriors !== count) {
            console.warn(`Warrior count mismatch detected! UI: ${count}, Data: ${state.warriors}`);
            // Force the update
            partyData.warriors = count;
            partyData.strength = calculatePartyStrength(count, partyData.type);
        }
    };
    
    window.battleIntegrationRegistered = true;
    console.log("Battle integration system registered successfully");
}
        },
        
        /**
         * Add a battle to history
         * @param {Object} battleReport - Battle report to add
         */
        addBattleToHistory: function(battleReport) {
            battleHistory.push(battleReport);
            updateBattleHistoryUI();
        },
        
        /**
         * Get battle history
         * @returns {Array} - Array of battle reports
         */
        getBattleHistory: function() {
            return [...battleHistory];
        },
        
        /**
         * Process game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Process AI settlement recovery
            if (tickSize > 0 && gameState.date.day % 10 === 0) {
                // Every 10 days, AI settlements recover some military power
                const settlements = WorldMap.getWorldMap().settlements;
                
                settlements.forEach(settlement => {
                    if (settlement.isPlayer) return;
                    
                    // Natural growth of warriors
                    if (settlement.resources && settlement.military) {
                        if (settlement.resources.food > settlement.population * 5 && 
                            settlement.military.warriors < settlement.population * 0.2) {
                            
                            const newWarriors = Math.floor(Math.random() * 2) + 1;
                            settlement.military.warriors += newWarriors;
                            settlement.resources.food -= newWarriors * 5;
                        }
                        
                        // Rebuild defenses if they were damaged
                        if (settlement.resources.wood > 10 && settlement.resources.stone > 5 && 
                            settlement.military.defenses < 5) {
                            
                            settlement.military.defenses += 1;
                            settlement.resources.wood -= 10;
                            settlement.resources.stone -= 5;
                        }
                    }
                });
            }
        }
    };
})();
