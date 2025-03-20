/**
 * Viking Legacy - Battle System Integration (Complete Bugfix)
 * Handles integration of battle system with explorer panels
 */

(function() {
    // Simplest approach - wait for game to fully load, then enhance the Explorer system
    function init() {
        console.log("Initializing Battle System Integration...");
        
        // Wait for Explorer system to be available
        let checkInterval = setInterval(function() {
            if (typeof ExplorerSystem !== 'undefined' && 
                typeof ExplorerSystem.showSettlementDetails === 'function') {
                
                clearInterval(checkInterval);
                
                // Store the original function reference
                const originalShowSettlementDetails = ExplorerSystem.showSettlementDetails;
                
                // Safely override with an extended version
                ExplorerSystem.showSettlementDetails = function(settlement) {
                    // First, update settlement population if it's the player's settlement
                    if (settlement && settlement.isPlayer) {
                        updatePlayerSettlementData(settlement);
                    }
                
                    // Call the original function 
                    originalShowSettlementDetails.call(ExplorerSystem, settlement);
                    
                    // After a short delay, enhance the Raid buttons
                    setTimeout(function() {
                        // Find Raid buttons in the settlement detail panel
                        const detailPanel = document.getElementById('settlement-detail-panel');
                        if (detailPanel && detailPanel.classList.contains('visible')) {
                            // Don't add raid functionality for player's own settlement
                            if (settlement && settlement.isPlayer) {
                                // Find and hide any raid buttons for player's settlement
                                const raidButtons = Array.from(detailPanel.querySelectorAll('button'))
                                    .filter(btn => btn.textContent.includes('Raid') && !btn.textContent.includes('Coming'));
                                
                                raidButtons.forEach(btn => {
                                    btn.style.display = 'none';
                                });
                                return;
                            }
                            
                            // Find any buttons with "Raid" text that aren't marked as enhanced
                            const raidButtons = Array.from(detailPanel.querySelectorAll('button'))
                                .filter(btn => 
                                    btn.textContent.includes('Raid') && 
                                    !btn.textContent.includes('Coming') &&
                                    !btn.hasAttribute('data-battle-enhanced')
                                );
                            
                            // Enhance each button
                            raidButtons.forEach(function(btn) {
                                enhanceRaidButton(btn, settlement);
                                btn.setAttribute('data-battle-enhanced', 'true');
                            });
                        }
                    }, 300); // Wait a bit to ensure the panel is fully rendered
                };
                
                // Also fix the settlement population display
                updateAllSettlementData();
                
                // Set up a regular check to update settlement data
                setInterval(updateAllSettlementData, 30000); // Every 30 seconds
                
                console.log("Battle System Integration initialized successfully");
            }
        }, 1000);
    }
    
    /**
     * Update player settlement data with current game state
     * @param {Object} settlement - Player settlement
     */
    function updatePlayerSettlementData(settlement) {
        if (!settlement || !settlement.isPlayer) return;
        
        // Get current population data
        if (typeof PopulationManager !== 'undefined' && typeof PopulationManager.getPopulation === 'function') {
            const popData = PopulationManager.getPopulation();
            if (popData) {
                settlement.population = popData.total || 5; // Default to 5 if undefined
            }
        }
        
        // Get current military data
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getWarriorData === 'function') {
            const warriorData = BuildingSystem.getWarriorData();
            
            // Create military object if doesn't exist
            if (!settlement.military) {
                settlement.military = { warriors: 0, ships: 0, defenses: 0 };
            }
            
            // Update military data
            settlement.military.warriors = warriorData.total || 0;
            
            // Get defenses count if available
            if (typeof BuildingSystem.getBuildingCount === 'function') {
                // Estimate defenses based on walls, towers, etc.
                const walls = BuildingSystem.getBuildingCount('wall') || 0;
                const towers = BuildingSystem.getBuildingCount('tower') || 0;
                const fortresses = BuildingSystem.getBuildingCount('fortress') || 0;
                
                settlement.military.defenses = walls + (towers * 2) + (fortresses * 5);
            }
        }
    }
    
    /**
     * Update all settlement data to match current game state
     */
    function updateAllSettlementData() {
        // Update player settlement
        if (typeof WorldMap !== 'undefined' && typeof WorldMap.getPlayerSettlement === 'function') {
            const playerSettlement = WorldMap.getPlayerSettlement();
            if (playerSettlement) {
                updatePlayerSettlementData(playerSettlement);
            }
        }
        
        // Also verify that other settlements have appropriate data
        if (typeof WorldMap !== 'undefined' && typeof WorldMap.getWorldMap === 'function') {
            const worldData = WorldMap.getWorldMap();
            if (worldData && worldData.settlements) {
                worldData.settlements.forEach(settlement => {
                    // Ensure non-player settlements have military data
                    if (!settlement.isPlayer && (!settlement.military || !settlement.military.warriors)) {
                        if (!settlement.military) {
                            settlement.military = {};
                        }
                        
                        // Set default military based on population
                        const population = settlement.population || 5;
                        settlement.military.warriors = Math.max(1, Math.floor(population * 0.2));
                        settlement.military.defenses = Math.floor(Math.random() * 3); // 0-2 defenses
                    }
                });
            }
        }
    }
    
    /**
     * Enhance a raid button with battle functionality
     * @param {HTMLElement} button - The raid button element
     * @param {Object} settlement - Settlement data
     */
    function enhanceRaidButton(button, settlement) {
        // Create a new button with the same styling
        const newButton = document.createElement('button');
        newButton.textContent = 'Raid';
        newButton.className = button.className;
        newButton.style.cssText = button.style.cssText;
        
        // Add the direct raid event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Double-check this isn't the player's settlement
            if (settlement && settlement.isPlayer) {
                Utils.log("You cannot raid your own settlement!", "important");
                return;
            }
            
            // Check if explorer party is active
            const explorerState = ExplorerSystem.getExplorerState();
            if (!explorerState || !explorerState.active) {
                Utils.log("You need an active exploration party to raid settlements.", "important");
                return;
            }
            
            // Execute raid directly
            executeRaid(settlement, explorerState);
            
            // Close settlement panel
            const detailPanel = document.getElementById('settlement-detail-panel');
            if (detailPanel) {
                detailPanel.classList.remove('visible');
            }
        });
        
        // Replace the original button
        if (button.parentNode) {
            button.parentNode.replaceChild(newButton, button);
        }
    }
    
    /**
     * Execute a raid against a settlement
     * @param {Object} settlement - Target settlement
     * @param {Object} party - Explorer party
     */
    function executeRaid(settlement, party) {
        // Calculate attacker strength
        const attackerStrength = calculateCombatStrength(party);
        
        // Calculate defender strength
        const defenderStrength = calculateDefenderStrength(settlement);
        
        // Determine battle outcome
        const outcome = determineBattleOutcome(attackerStrength, defenderStrength);
        
        // Calculate casualties
        const attackerCasualties = calculateCasualties(party.warriors, outcome, 'attacker');
        const defenderCasualties = calculateCasualties(
            settlement.military ? settlement.military.warriors : 3, 
            outcome, 
            'defender'
        );
        
        // Calculate loot
        const loot = calculateLoot(settlement.resources || getDefaultResources(settlement), outcome);
        
        // Create a battle report
        const battleReport = {
            id: `battle_${Date.now()}`,
            type: 'raid',
            attacker: {
                type: 'player',
                name: 'Your Forces',
                warriors: party.warriors,
                strength: attackerStrength
            },
            defender: {
                type: settlement.type,
                name: settlement.name,
                warriors: settlement.military ? settlement.military.warriors : 3,
                strength: defenderStrength
            },
            location: settlement.region,
            date: GameEngine.getGameState().date,
            outcome: outcome,
            casualties: {
                attacker: attackerCasualties,
                defender: defenderCasualties
            },
            loot: loot,
            relationImpact: getRelationImpact('raid', outcome),
            fameReward: getFameReward(outcome)
        };
        
        // Apply battle effects
        applyBattleEffects(battleReport, settlement, party);
        
        // Show battle results
        showBattleResults(battleReport);
        
        // Add to battle history
        if (typeof BattleSystem !== 'undefined' && typeof BattleSystem.addBattleToHistory === 'function') {
            BattleSystem.addBattleToHistory(battleReport);
        }
    }
    
    /**
     * Calculate combat strength for a party
     * @param {Object} party - Party object
     * @returns {number} - Combat strength
     */
    function calculateCombatStrength(party) {
        if (!party) return 0;
        
        // Base strength from warriors
        let strength = party.strength || party.warriors || 0;
        
        // Apply morale modifier
        if (party.morale) {
            strength *= (party.morale / 100);
        }
        
        return strength;
    }
    
    /**
     * Calculate defender strength
     * @param {Object} settlement - Settlement object
     * @returns {number} - Defender strength
     */
    function calculateDefenderStrength(settlement) {
        if (!settlement || !settlement.military) {
            // Default values if military info not available
            return 3; // Default strength
        }
        
        // Base strength from warriors
        let strength = settlement.military.warriors || 0;
        
        // Apply fortification bonus
        if (settlement.military.defenses > 0) {
            strength += settlement.military.defenses * 1.5;
        }
        
        // Home ground advantage
        strength *= 1.2;
        
        return strength;
    }
    
    /**
     * Determine battle outcome
     * @param {number} attackerStrength - Attacker's strength
     * @param {number} defenderStrength - Defender's strength
     * @returns {string} - Battle outcome
     */
    function determineBattleOutcome(attackerStrength, defenderStrength) {
        // Calculate strength ratio
        const strengthRatio = attackerStrength / defenderStrength;
        
        // Add randomness
        const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const adjustedRatio = strengthRatio * randomFactor;
        
        // Determine outcome
        if (adjustedRatio >= 2.0) {
            return "Decisive Victory";
        } else if (adjustedRatio >= 1.3) {
            return "Victory";
        } else if (adjustedRatio >= 1.0) {
            return "Pyrrhic Victory";
        } else if (adjustedRatio >= 0.7) {
            return Math.random() < 0.4 ? "Tactical Retreat" : "Defeat";
        } else {
            return Math.random() < 0.7 ? "Tactical Retreat" : "Disaster";
        }
    }
    
    /**
     * Calculate casualties
     * @param {number} troopCount - Number of troops
     * @param {string} outcome - Battle outcome
     * @param {string} side - 'attacker' or 'defender'
     * @returns {number} - Number of casualties
     */
    function calculateCasualties(troopCount, outcome, side) {
        const casualtyRates = {
            "Decisive Victory": { attacker: 0.05, defender: 0.25 },
            "Victory": { attacker: 0.1, defender: 0.2 },
            "Pyrrhic Victory": { attacker: 0.25, defender: 0.15 },
            "Defeat": { attacker: 0.3, defender: 0.1 },
            "Disaster": { attacker: 0.5, defender: 0.05 },
            "Tactical Retreat": { attacker: 0.15, defender: 0.0 }
        };
        
        const rate = casualtyRates[outcome] ? casualtyRates[outcome][side] : 0.1;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        return Math.round(troopCount * rate * randomFactor);
    }
    
    /**
     * Calculate loot from a raid
     * @param {Object} resources - Target resources
     * @param {string} outcome - Battle outcome
     * @returns {Object} - Loot gained
     */
    function calculateLoot(resources, outcome) {
        const lootRates = {
            "Decisive Victory": 0.35,
            "Victory": 0.25,
            "Pyrrhic Victory": 0.15, 
            "Defeat": 0.05,
            "Disaster": 0.0,
            "Tactical Retreat": 0.03
        };
        
        const rate = lootRates[outcome] || 0;
        const loot = {};
        
        for (const resource in resources) {
            const amount = resources[resource] * rate;
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            loot[resource] = Math.round(amount * randomFactor);
        }
        
        return loot;
    }
    
    /**
     * Get default resources for settlements without defined resources
     * @param {Object} settlement - Settlement object
     * @returns {Object} - Default resources
     */
    function getDefaultResources(settlement) {
        // Generate resources based on settlement size and type
        const population = settlement ? settlement.population || 5 : 5;
        const multiplier = Math.max(1, Math.floor(population / 5));
        
        return {
            food: 50 * multiplier,
            wood: 30 * multiplier,
            stone: 20 * multiplier,
            metal: 10 * multiplier
        };
    }
    
    /**
     * Get relation impact based on battle type and outcome
     * @param {string} battleType - 'raid' or 'siege'
     * @param {string} outcome - Battle outcome
     * @returns {number} - Relation impact value
     */
    function getRelationImpact(battleType, outcome) {
        const impacts = {
            raid: {
                "Decisive Victory": -15,
                "Victory": -10,
                "Pyrrhic Victory": -5,
                "Defeat": -2,
                "Disaster": 0,
                "Tactical Retreat": 0
            },
            siege: {
                "Decisive Victory": -30,
                "Victory": -25,
                "Pyrrhic Victory": -20,
                "Defeat": -5,
                "Disaster": 0,
                "Tactical Retreat": -3
            }
        };
        
        return impacts[battleType]?.[outcome] || 0;
    }
    
    /**
     * Get fame reward based on battle outcome
     * @param {string} outcome - Battle outcome
     * @returns {number} - Fame reward
     */
    function getFameReward(outcome) {
        const rewards = {
            "Decisive Victory": 100,
            "Victory": 75,
            "Pyrrhic Victory": 50,
            "Defeat": 10,
            "Disaster": 0,
            "Tactical Retreat": 5
        };
        
        return rewards[outcome] || 0;
    }
    
    /**
     * Apply battle effects to game state
     * @param {Object} battleReport - Battle report
     * @param {Object} settlement - Target settlement
     * @param {Object} party - Explorer party
     */
    function applyBattleEffects(battleReport, settlement, party) {
        // Apply fame reward
        if (RankManager && typeof RankManager.addFame === 'function') {
            const battleDesc = `Raid on ${battleReport.defender.name}: ${battleReport.outcome}`;
            RankManager.addFame(battleReport.fameReward, battleDesc);
        }
        
        // Apply casualties to player party
        if (typeof ExplorerSystem.adjustWarriorCount === 'function') {
            const remainingWarriors = Math.max(0, party.warriors - battleReport.casualties.attacker);
            ExplorerSystem.adjustWarriorCount(remainingWarriors);
        }
        
        // Apply casualties and resource loss to target settlement
        if (settlement) {
            // Reduce military strength
            if (settlement.military) {
                settlement.military.warriors = Math.max(0, 
                    settlement.military.warriors - battleReport.casualties.defender);
            }
            
            // Reduce resources based on loot
            if (settlement.resources) {
                for (const resource in battleReport.loot) {
                    if (settlement.resources[resource]) {
                        settlement.resources[resource] = Math.max(0, 
                            settlement.resources[resource] - battleReport.loot[resource]);
                    }
                }
            }
        }
        
        // Add looted resources to player
        if (Object.keys(battleReport.loot).length > 0 && 
            ResourceManager && typeof ResourceManager.addResources === 'function') {
            ResourceManager.addResources(battleReport.loot);
        }
    }
    
    /**
     * Show battle results
     * @param {Object} battleReport - Battle report
     */
    function showBattleResults(battleReport) {
        // Create a simple modal to show battle results
        const modal = document.createElement('div');
        modal.className = 'battle-result-modal';
        
        // Determine outcome class
        const outcomeClass = battleReport.outcome.includes('Victory') ? 
            'victory' : (battleReport.outcome === "Tactical Retreat" ? 
                'retreat' : 'defeat');
        
        // Prepare loot list
        let lootHTML = '<p>No resources captured.</p>';
        if (Object.keys(battleReport.loot).some(key => battleReport.loot[key] > 0)) {
            lootHTML = '<ul>';
            for (const resource in battleReport.loot) {
                if (battleReport.loot[resource] > 0) {
                    lootHTML += `<li>${battleReport.loot[resource]} ${resource}</li>`;
                }
            }
            lootHTML += '</ul>';
        }
        
        // Create modal content
        modal.innerHTML = `
            <div class="battle-result-content">
                <h3>Battle Results</h3>
                <div class="battle-outcome ${outcomeClass}">
                    <div class="outcome-header">${battleReport.outcome}!</div>
                </div>
                
                <div class="battle-details">
                    <div>
                        <h4>Casualties</h4>
                        <p>Your forces: ${battleReport.casualties.attacker} warriors</p>
                        <p>Enemy forces: ${battleReport.casualties.defender} warriors</p>
                    </div>
                    
                    <div>
                        <h4>Spoils of War</h4>
                        ${lootHTML}
                    </div>
                    
                    <div>
                        <h4>Rewards</h4>
                        <p>Fame gained: ${battleReport.fameReward}</p>
                    </div>
                </div>
                
                <div class="battle-actions">
                    <button class="btn-close-battle">Close</button>
                </div>
            </div>
        `;
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .battle-result-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .battle-result-content {
                background-color: #f7f0e3;
                border-radius: 8px;
                padding: 20px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
                border: 2px solid #8b5d33;
            }
            
            .battle-result-content h3 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-top: 0;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .battle-outcome {
                background-color: #fff;
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
                text-align: center;
            }
            
            .outcome-header {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .victory {
                border-left: 4px solid #2e7d32;
            }
            
            .victory .outcome-header {
                color: #2e7d32;
            }
            
            .defeat {
                border-left: 4px solid #c62828;
            }
            
            .defeat .outcome-header {
                color: #c62828;
            }
            
            .retreat {
                border-left: 4px solid #ff8f00;
            }
            
            .retreat .outcome-header {
                color: #ff8f00;
            }
            
            .battle-details {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .battle-details h4 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 10px;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
            }
            
            .battle-actions {
                display: flex;
                justify-content: center;
                margin-top: 20px;
            }
            
            .btn-close-battle {
                padding: 8px 16px;
                background-color: #8b5d33;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s ease;
            }
            
            .btn-close-battle:hover {
                background-color: #a97c50;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Add event listener to close button
        const closeButton = modal.querySelector('.btn-close-battle');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Log to game console
        let battleMessage = `Raid on ${battleReport.defender.name} - ${battleReport.outcome}!`;
        let messageType = "important";
        
        if (battleReport.outcome.includes("Victory")) {
            messageType = "success";
            battleMessage += ` Resources looted.`;
        } else if (battleReport.outcome === "Tactical Retreat") {
            messageType = "important";
            battleMessage += ` Your forces retreated safely.`;
        } else {
            messageType = "danger";
            battleMessage += ` The attack failed.`;
        }
        
        Utils.log(battleMessage, messageType);
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
