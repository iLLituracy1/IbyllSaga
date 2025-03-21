/**
 * Viking Legacy - Conflict System
 * Handles battles, sieges, and combat resolution
 */

const ConflictSystem = (function() {
    // Private variables
    
    // Track active battles and sieges
    let activeBattles = [];
    let activeSieges = [];
    
    // Battle phases
    const BATTLE_PHASES = {
        DEPLOYMENT: 'deployment',  // Initial positioning
        SKIRMISH: 'skirmish',      // Initial skirmishing
        MELEE: 'melee',            // Main battle
        PURSUIT: 'pursuit',        // Chasing fleeing enemies
        CONCLUDED: 'concluded'     // Battle is over
    };
    
    // Siege phases
    const SIEGE_PHASES = {
        ENCIRCLEMENT: 'encirclement',  // Surrounding the settlement
        BOMBARDMENT: 'bombardment',    // Attacking defenses
        ASSAULT: 'assault',            // Direct assault on walls
        CONCLUDED: 'concluded'         // Siege is over
    };
    
    // Battle outcome types
    const BATTLE_OUTCOMES = {
        DECISIVE_VICTORY: 'decisive_victory',     // Completely defeated enemy
        VICTORY: 'victory',                     // Won the battle
        DRAW: 'draw',                           // Indecisive result
        DEFEAT: 'defeat',                       // Lost the battle
        DEVASTATING_DEFEAT: 'devastating_defeat'  // Completely routed
    };
    
    // Battle template
    const battleTemplate = {
        id: "",
        regionId: "",
        regionName: "",
        phase: BATTLE_PHASES.DEPLOYMENT,
        turn: 1,
        attackers: [],        // Expedition IDs of attackers
        defenders: [],        // Expedition IDs of defenders
        attackerStrength: 0,  // Total attacker strength
        defenderStrength: 0,  // Total defender strength
        attackerLosses: 0,    // Attacker casualties
        defenderLosses: 0,    // Defender casualties
        advantage: 0,         // Current battle advantage (-100 to 100)
        outcome: null,        // Battle outcome
        loot: {},             // Resources looted
        date: null,           // Game date when battle started
        log: []               // Battle event log
    };
    
    // Siege template
    const siegeTemplate = {
        id: "",
        settlementId: "",
        settlementName: "",
        regionId: "",
        regionName: "",
        phase: SIEGE_PHASES.ENCIRCLEMENT,
        expeditionId: "",     // Besieging expedition ID
        defenseStrength: 0,   // Settlement defense strength
        progress: 0,          // Progress (0-100)
        daysActive: 0,        // Days siege has been active
        outcome: null,        // Siege outcome
        date: null,           // Game date when siege started
        log: []               // Siege event log
    };
    
    /**
     * Generate a battle event message
     * @param {string} phase - Battle phase
     * @param {Object} battle - Battle data
     * @returns {string} - Event message
     */
    function generateBattleMessage(phase, battle) {
        const attackerStrength = battle.attackerStrength;
        const defenderStrength = battle.defenderStrength;
        const advantage = battle.advantage;
        
        // Different messages based on phase and advantage
        const messages = {
            [BATTLE_PHASES.DEPLOYMENT]: [
                "The forces have arrayed for battle.",
                "Warriors take their positions as the armies face each other.",
                "Battle lines are drawn as tension mounts."
            ],
            [BATTLE_PHASES.SKIRMISH]: [
                "Arrows fly as the skirmish begins.",
                "The battle opens with exchanges of missile fire.",
                "Warriors test each other with initial skirmishing."
            ],
            [BATTLE_PHASES.MELEE]: {
                attackerAdvantage: [
                    "Your warriors push forward, gaining ground!",
                    "The enemy line begins to waver under your assault!",
                    "Your forces are breaking through their formations!"
                ],
                defenderAdvantage: [
                    "The enemy pushes your warriors back!",
                    "Your line is being pressed hard by the enemy!",
                    "Your warriors struggle to hold formation!"
                ],
                neutral: [
                    "The battle rages fiercely with neither side gaining advantage.",
                    "Warriors clash in a desperate struggle.",
                    "The lines surge back and forth in fierce combat."
                ]
            },
            [BATTLE_PHASES.PURSUIT]: {
                attackerVictory: [
                    "The enemy breaks and flees! Your warriors give chase!",
                    "Victory! Your forces pursue the routing enemy!",
                    "The enemy formation collapses as your warriors pursue the fleeing survivors!"
                ],
                defenderVictory: [
                    "Your warriors break and scatter as the enemy pursues!",
                    "Defeat! Your forces flee as the enemy gives chase!",
                    "Your formation collapses and warriors flee for their lives!"
                ]
            },
            [BATTLE_PHASES.CONCLUDED]: {
                [BATTLE_OUTCOMES.DECISIVE_VICTORY]: "A decisive victory! The enemy has been utterly defeated!",
                [BATTLE_OUTCOMES.VICTORY]: "Victory! The enemy has been defeated!",
                [BATTLE_OUTCOMES.DRAW]: "The battle ends in a draw, both sides withdrawing exhausted.",
                [BATTLE_OUTCOMES.DEFEAT]: "Defeat. Your forces have been beaten back by the enemy.",
                [BATTLE_OUTCOMES.DEVASTATING_DEFEAT]: "A devastating defeat! Your forces have been routed!"
            }
        };
        
        // Select appropriate message based on phase
        if (phase === BATTLE_PHASES.MELEE) {
            let category = 'neutral';
            if (advantage > 30) category = 'attackerAdvantage';
            else if (advantage < -30) category = 'defenderAdvantage';
            
            const messageArray = messages[phase][category];
            return messageArray[Math.floor(Math.random() * messageArray.length)];
        } 
        else if (phase === BATTLE_PHASES.PURSUIT) {
            let category = advantage > 0 ? 'attackerVictory' : 'defenderVictory';
            const messageArray = messages[phase][category];
            return messageArray[Math.floor(Math.random() * messageArray.length)];
        }
        else if (phase === BATTLE_PHASES.CONCLUDED) {
            return messages[phase][battle.outcome] || "The battle has concluded.";
        }
        else {
            const messageArray = messages[phase];
            return messageArray[Math.floor(Math.random() * messageArray.length)];
        }
    }
    
    /**
     * Generate a siege event message
     * @param {string} phase - Siege phase
     * @param {Object} siege - Siege data
     * @returns {string} - Event message
     */
    function generateSiegeMessage(phase, siege) {
        const messages = {
            [SIEGE_PHASES.ENCIRCLEMENT]: [
                `Your forces surround ${siege.settlementName}, cutting off escape.`,
                `${siege.settlementName} is encircled as your forces establish a siege camp.`,
                `The siege of ${siege.settlementName} begins as your warriors take position.`
            ],
            [SIEGE_PHASES.BOMBARDMENT]: [
                `Your siege engines batter the walls of ${siege.settlementName}.`,
                `Stones and flaming projectiles rain down on ${siege.settlementName}.`,
                `The defenders of ${siege.settlementName} take cover as your bombardment continues.`
            ],
            [SIEGE_PHASES.ASSAULT]: [
                `Your warriors charge the breached walls of ${siege.settlementName}!`,
                `Battle rages at the walls as your forces assault ${siege.settlementName}!`,
                `The final assault on ${siege.settlementName} has begun!`
            ],
            [SIEGE_PHASES.CONCLUDED]: {
                'victory': `${siege.settlementName} has fallen to your forces!`,
                'defeat': `Your forces have been repelled from ${siege.settlementName}!`,
                'abandoned': `You have abandoned the siege of ${siege.settlementName}.`
            }
        };
        
        if (phase === SIEGE_PHASES.CONCLUDED) {
            return messages[phase][siege.outcome] || `The siege of ${siege.settlementName} has ended.`;
        } else {
            const messageArray = messages[phase];
            return messageArray[Math.floor(Math.random() * messageArray.length)];
        }
    }
    
    /**
     * Calculate casualties for a battle
     * @param {Object} battle - Battle object
     * @param {number} tickSize - Size of the game tick in days
     * @returns {Object} - Casualties for both sides
     */
    function calculateBattleCasualties(battle, tickSize) {
        // Base casualty rate depends on battle phase
        let baseCasualtyRate;
        switch (battle.phase) {
            case BATTLE_PHASES.DEPLOYMENT:
                baseCasualtyRate = 0.01; // 1% per day
                break;
            case BATTLE_PHASES.SKIRMISH:
                baseCasualtyRate = 0.03; // 3% per day
                break;
            case BATTLE_PHASES.MELEE:
                baseCasualtyRate = 0.08; // 8% per day
                break;
            case BATTLE_PHASES.PURSUIT:
                baseCasualtyRate = 0.06; // 6% per day (mostly for the losing side)
                break;
            default:
                baseCasualtyRate = 0.02;
        }
        
        // Adjust for battle advantage
        const advantage = battle.advantage / 100; // Convert to -1 to 1 range
        
        // Attacker casualties (reduced by positive advantage)
        const attackerCasualtyRate = baseCasualtyRate * (1 - advantage * 0.5) * tickSize;
        
        // Defender casualties (reduced by negative advantage)
        const defenderCasualtyRate = baseCasualtyRate * (1 + advantage * 0.5) * tickSize;
        
        // Apply randomization
        const attackerRandomizer = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        const defenderRandomizer = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        
        // Calculate actual casualties
        const totalAttackerWarriors = getExpeditionTotalWarriors(battle.attackers);
        const totalDefenderWarriors = getExpeditionTotalWarriors(battle.defenders);
        
        const attackerCasualties = Math.round(totalAttackerWarriors * attackerCasualtyRate * attackerRandomizer);
        const defenderCasualties = Math.round(totalDefenderWarriors * defenderCasualtyRate * defenderRandomizer);
        
        return {
            attackerCasualties,
            defenderCasualties
        };
    }
    
    /**
     * Get total warriors from a list of expedition IDs
     * @param {Array} expeditionIds - List of expedition IDs
     * @returns {number} - Total warriors
     */
    function getExpeditionTotalWarriors(expeditionIds) {
        let total = 0;
        
        if (window.ExpeditionSystem && typeof ExpeditionSystem.getExpedition === 'function') {
            expeditionIds.forEach(id => {
                const expedition = ExpeditionSystem.getExpedition(id);
                if (expedition) {
                    total += expedition.warriors || 0;
                }
            });
        }
        
        return total;
    }
    
    /**
     * Apply casualties to expeditions
     * @param {Array} expeditionIds - List of expedition IDs
     * @param {number} casualties - Number of casualties to distribute
     */
    function applyExpeditionCasualties(expeditionIds, casualties) {
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpedition) return;
        
        // Get all expeditions
        const expeditions = expeditionIds.map(id => ExpeditionSystem.getExpedition(id))
            .filter(exp => exp !== undefined);
        
        if (expeditions.length === 0) return;
        
        // Calculate total warriors
        const totalWarriors = expeditions.reduce((sum, exp) => sum + exp.warriors, 0);
        
        // Distribute casualties proportionally
        expeditions.forEach(expedition => {
            const proportion = expedition.warriors / totalWarriors;
            const expeditionCasualties = Math.round(casualties * proportion);
            
            // Apply casualties
            expedition.casualties = (expedition.casualties || 0) + expeditionCasualties;
            expedition.warriors = Math.max(0, expedition.warriors - expeditionCasualties);
            
            // Update strength
            if (typeof expedition.strength === 'number') {
                // Simplified recalculation of strength
                expedition.strength = expedition.warriors;
            }
        });
    }
    
    /**
     * Determine battle advantage based on strength ratio and random factors
     * @param {Object} battle - Battle object
     * @returns {number} - Battle advantage (-100 to 100)
     */
    function determineBattleAdvantage(battle) {
        // Start with current advantage
        let advantage = battle.advantage || 0;
        
        // Strength ratio component
        const strengthRatio = battle.attackerStrength / (battle.defenderStrength || 1);
        const strengthAdvantage = (strengthRatio - 1) * 50; // Scale to roughly -50 to 50
        
        // Random component (battlefield fortune)
        const randomAdvantage = (Math.random() * 40) - 20; // -20 to 20
        
        // Combine with existing advantage (with some decay of previous advantage)
        advantage = (advantage * 0.7) + strengthAdvantage + randomAdvantage;
        
        // Clamp to -100 to 100 range
        return Math.max(-100, Math.min(100, advantage));
    }
    
    /**
     * Update battle phase based on current state
     * @param {Object} battle - Battle object
     */
    function updateBattlePhase(battle) {
        // Progress through battle phases based on turns and advantage
        switch (battle.phase) {
            case BATTLE_PHASES.DEPLOYMENT:
                // After 1-2 turns of deployment, move to skirmish
                if (battle.turn >= Utils.randomBetween(1, 2)) {
                    battle.phase = BATTLE_PHASES.SKIRMISH;
                    battle.log.push(generateBattleMessage(BATTLE_PHASES.SKIRMISH, battle));
                }
                break;
                
            case BATTLE_PHASES.SKIRMISH:
                // After 2-3 turns of skirmishing, move to melee
                if (battle.turn >= Utils.randomBetween(3, 5)) {
                    battle.phase = BATTLE_PHASES.MELEE;
                    battle.log.push(generateBattleMessage(BATTLE_PHASES.MELEE, battle));
                }
                break;
                
            case BATTLE_PHASES.MELEE:
                // Move to pursuit when one side gains significant advantage
                if (Math.abs(battle.advantage) >= 70) {
                    battle.phase = BATTLE_PHASES.PURSUIT;
                    battle.log.push(generateBattleMessage(BATTLE_PHASES.PURSUIT, battle));
                } else if (battle.turn >= 10) {
                    // Extended battle with no clear advantage leads to conclusion
                    battle.phase = BATTLE_PHASES.CONCLUDED;
                    
                    // Determine outcome based on final advantage
                    if (battle.advantage > 30) battle.outcome = BATTLE_OUTCOMES.VICTORY;
                    else if (battle.advantage > -30) battle.outcome = BATTLE_OUTCOMES.DRAW;
                    else battle.outcome = BATTLE_OUTCOMES.DEFEAT;
                    
                    battle.log.push(generateBattleMessage(BATTLE_PHASES.CONCLUDED, battle));
                }
                break;
                
            case BATTLE_PHASES.PURSUIT:
                // After 1-2 turns of pursuit, battle concludes
                if (battle.turn >= Utils.randomBetween(12, 14)) {
                    battle.phase = BATTLE_PHASES.CONCLUDED;
                    
                    // Determine outcome based on final advantage
                    if (battle.advantage >= 80) battle.outcome = BATTLE_OUTCOMES.DECISIVE_VICTORY;
                    else if (battle.advantage > 0) battle.outcome = BATTLE_OUTCOMES.VICTORY;
                    else if (battle.advantage > -80) battle.outcome = BATTLE_OUTCOMES.DEFEAT;
                    else battle.outcome = BATTLE_OUTCOMES.DEVASTATING_DEFEAT;
                    
                    battle.log.push(generateBattleMessage(BATTLE_PHASES.CONCLUDED, battle));
                }
                break;
        }
    }
    
    /**
     * Process a battle for one tick
     * @param {Object} battle - Battle object
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of the game tick in days
     */
    function processBattle(battle, gameState, tickSize) {
        // Skip concluded battles
        if (battle.phase === BATTLE_PHASES.CONCLUDED) return;
        
        // Update battle turn based on tick size
        battle.turn += tickSize;
        
        // Update strength values
        battle.attackerStrength = getExpeditionsTotalStrength(battle.attackers);
        battle.defenderStrength = getExpeditionsTotalStrength(battle.defenders);
        
        // Determine current battle advantage
        battle.advantage = determineBattleAdvantage(battle);
        
        // Calculate casualties
        const { attackerCasualties, defenderCasualties } = calculateBattleCasualties(battle, tickSize);
        
        // Apply casualties
        battle.attackerLosses += attackerCasualties;
        battle.defenderLosses += defenderCasualties;
        
        // Apply casualties to expeditions
        applyExpeditionCasualties(battle.attackers, attackerCasualties);
        applyExpeditionCasualties(battle.defenders, defenderCasualties);
        
        // Update battle phase
        updateBattlePhase(battle);
        
        // Check for battle end conditions
        if (battle.phase === BATTLE_PHASES.CONCLUDED) {
            handleBattleConclusion(battle);
        }
    }
    
    /**
     * Get total strength from a list of expedition IDs
     * @param {Array} expeditionIds - List of expedition IDs
     * @returns {number} - Total strength
     */
    function getExpeditionsTotalStrength(expeditionIds) {
        let total = 0;
        
        if (window.ExpeditionSystem && typeof ExpeditionSystem.getExpedition === 'function') {
            expeditionIds.forEach(id => {
                const expedition = ExpeditionSystem.getExpedition(id);
                if (expedition) {
                    total += expedition.strength || 0;
                }
            });
        }
        
        return total;
    }
    
    /**
     * Handle the conclusion of a battle
     * @param {Object} battle - Battle object
     */
    function handleBattleConclusion(battle) {
        // Get all involved expeditions
        const attackerExpeditions = battle.attackers.map(id => 
            ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(id)).filter(Boolean);
        
        const defenderExpeditions = battle.defenders.map(id => 
            ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(id)).filter(Boolean);
        
        // Determine if player was involved
        const playerAttacker = attackerExpeditions.some(exp => exp.ownerType === 'player');
        const playerDefender = defenderExpeditions.some(exp => exp.ownerType === 'player');
        
        // Handle battle outcome
        if (battle.outcome === BATTLE_OUTCOMES.DECISIVE_VICTORY || 
            battle.outcome === BATTLE_OUTCOMES.VICTORY) {
            // Attackers won
            
            // If player was attacker, award fame and loot
            if (playerAttacker) {
                // Award fame based on battle size and outcome
                const fameBase = battle.outcome === BATTLE_OUTCOMES.DECISIVE_VICTORY ? 50 : 30;
                const fameFactor = Math.sqrt(battle.defenderStrength) / 5;
                const fameAwarded = Math.round(fameBase * fameFactor);
                
                // Add fame to player expeditions
                attackerExpeditions.forEach(exp => {
                    if (exp.ownerType === 'player') {
                        exp.fame += fameAwarded;
                    }
                });
                
                // Generate loot
                const lootAmount = Math.round(battle.defenderLosses * Utils.randomBetween(1, 3));
                const loot = {
                    food: Math.round(lootAmount * 0.5),
                    wood: Math.round(lootAmount * 0.3),
                    metal: Math.round(lootAmount * 0.2)
                };
                
                // Add loot to player expeditions (distributed evenly)
                const playerExps = attackerExpeditions.filter(exp => exp.ownerType === 'player');
                if (playerExps.length > 0) {
                    const lootPerExp = {};
                    for (const resource in loot) {
                        lootPerExp[resource] = Math.floor(loot[resource] / playerExps.length);
                    }
                    
                    playerExps.forEach(exp => {
                        for (const resource in lootPerExp) {
                            if (!exp.loot[resource]) exp.loot[resource] = 0;
                            exp.loot[resource] += lootPerExp[resource];
                        }
                    });
                }
                
                // Log the victory and rewards
                Utils.log(`Victory! Your forces have defeated the enemy in ${battle.regionName}!`, 'success');
                Utils.log(`Your warriors have earned ${fameAwarded} fame from this victory.`, 'success');
                
                if (lootAmount > 0) {
                    Utils.log(`Your warriors have gathered ${lootAmount} resources from the battlefield.`, 'success');
                }
            }
            
            // If player was defender, log defeat
            if (playerDefender) {
                Utils.log(`Defeat! Your forces have been beaten by the enemy in ${battle.regionName}.`, 'danger');
                Utils.log(`You lost ${battle.defenderLosses} warriors in the battle.`, 'danger');
            }
            
            // Order defeated expeditions to flee
            defenderExpeditions.forEach(exp => {
                if (exp && ExpeditionSystem && ExpeditionSystem.recallExpedition) {
                    ExpeditionSystem.recallExpedition(exp.id);
                }
            });
        }
        else if (battle.outcome === BATTLE_OUTCOMES.DRAW) {
            // Draw - both sides withdraw
            
            // Log for player expeditions
            if (playerAttacker || playerDefender) {
                Utils.log(`The battle in ${battle.regionName} has ended in a stalemate.`, 'important');
                Utils.log(`Both sides have withdrawn to lick their wounds.`, 'important');
            }
            
            // Award small amount of fame for surviving
            const fameSurvival = 10;
            
            // Add fame to player expeditions on both sides
            [...attackerExpeditions, ...defenderExpeditions].forEach(exp => {
                if (exp && exp.ownerType === 'player') {
                    exp.fame += fameSurvival;
                }
            });
        }
        else {
            // Attackers lost
            
            // If player was defender, award fame
            if (playerDefender) {
                // Award fame based on battle size and outcome
                const fameBase = battle.outcome === BATTLE_OUTCOMES.DEVASTATING_DEFEAT ? 50 : 30;
                const fameFactor = Math.sqrt(battle.attackerStrength) / 5;
                const fameAwarded = Math.round(fameBase * fameFactor);
                
                // Add fame to player expeditions
                defenderExpeditions.forEach(exp => {
                    if (exp.ownerType === 'player') {
                        exp.fame += fameAwarded;
                    }
                });
                
                // Log the victory
                Utils.log(`Victory! Your forces have repelled the enemy in ${battle.regionName}!`, 'success');
                Utils.log(`Your warriors have earned ${fameAwarded} fame from this victory.`, 'success');
            }
            
            // If player was attacker, log defeat
            if (playerAttacker) {
                Utils.log(`Defeat! Your forces have been beaten by the enemy in ${battle.regionName}.`, 'danger');
                Utils.log(`You lost ${battle.attackerLosses} warriors in the battle.`, 'danger');
            }
            
            // Order defeated expeditions to flee
            attackerExpeditions.forEach(exp => {
                if (exp && ExpeditionSystem && ExpeditionSystem.recallExpedition) {
                    ExpeditionSystem.recallExpedition(exp.id);
                }
            });
        }
    }
    
    /**
     * Initiate a new battle
     * @param {Object} battleData - Battle configuration
     * @returns {Object} - Created battle
     */
    function createBattle(battleData) {
        const battleId = `battle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Create battle object
        const battle = Object.assign({}, battleTemplate, {
            id: battleId,
            regionId: battleData.regionId,
            regionName: battleData.regionName,
            attackers: battleData.playerExpeditions.map(exp => exp.id),
            defenders: battleData.aiExpeditions.map(exp => exp.id),
            date: new Date(),
            log: []
        });
        
        // Calculate initial strength
        battle.attackerStrength = getExpeditionsTotalStrength(battle.attackers);
        battle.defenderStrength = getExpeditionsTotalStrength(battle.defenders);
        
        // Initial battle message
        battle.log.push(generateBattleMessage(BATTLE_PHASES.DEPLOYMENT, battle));
        
        // Add to active battles
        activeBattles.push(battle);
        
        // Log battle start for player
        if (battleData.playerExpeditions.length > 0) {
            const attackerTotal = battleData.playerExpeditions.reduce((sum, exp) => sum + exp.warriors, 0);
            const defenderTotal = battleData.aiExpeditions.reduce((sum, exp) => sum + exp.warriors, 0);
            
            Utils.log(`Battle! Your expedition has encountered enemy forces in ${battleData.regionName}!`, 'important');
            Utils.log(`Your forces: ${attackerTotal} warriors vs Enemy forces: ${defenderTotal} warriors`, 'important');
        }
        
        return battle;
    }
    
    /**
     * Initiate a new siege
     * @param {Object} siegeData - Siege configuration
     * @returns {Object} - Created siege
     */
    function createSiege(siegeData) {
        const siegeId = `siege_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Get settlement data
        const settlement = WorldMap.getSettlement(siegeData.settlementId);
        if (!settlement) return null;
        
        // Calculate defense strength
        const defenseStrength = (settlement.military?.defenses || 0) * 3 + 
                               (settlement.military?.warriors || 0);
        
        // Create siege object
        const siege = Object.assign({}, siegeTemplate, {
            id: siegeId,
            settlementId: siegeData.settlementId,
            settlementName: settlement.name,
            regionId: settlement.region,
            regionName: WorldMap.getRegion(settlement.region)?.name || 'Unknown Region',
            expeditionId: siegeData.expeditionId,
            defenseStrength: defenseStrength,
            date: new Date(),
            log: []
        });
        
        // Initial siege message
        siege.log.push(generateSiegeMessage(SIEGE_PHASES.ENCIRCLEMENT, siege));
        
        // Add to active sieges
        activeSieges.push(siege);
        
        // Log siege start for player
        const expedition = ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(siegeData.expeditionId);
        if (expedition && expedition.ownerType === 'player') {
            Utils.log(`Your forces have begun a siege of ${settlement.name}!`, 'important');
        }
        
        return siege;
    }
    
    /**
     * Process a siege for one tick
     * @param {Object} siege - Siege object
     * @param {Object} gameState - Current game state
     * @param {number} tickSize - Size of the game tick in days
     */
    function processSiege(siege, gameState, tickSize) {
        // Skip concluded sieges
        if (siege.phase === SIEGE_PHASES.CONCLUDED) return;
        
        // Update days active
        siege.daysActive += tickSize;
        
        // Get expedition and settlement
        const expedition = ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(siege.expeditionId);
        const settlement = WorldMap.getSettlement(siege.settlementId);
        
        // If expedition or settlement no longer exists, end siege
        if (!expedition || !settlement) {
            endSiege(siege, 'abandoned');
            return;
        }
        
        // Update siege progress based on strength ratio
        const strengthRatio = expedition.strength / (siege.defenseStrength || 1);
        let progressRate = strengthRatio * 5 * tickSize;
        
        // Ensure minimal progress, max capped
        progressRate = Math.min(progressRate, 10 * tickSize);
        progressRate = Math.max(progressRate, 1 * tickSize);
        
        siege.progress += progressRate;
        
        // Update siege phase based on progress
        if (siege.progress >= 25 && siege.phase === SIEGE_PHASES.ENCIRCLEMENT) {
            siege.phase = SIEGE_PHASES.BOMBARDMENT;
            siege.log.push(generateSiegeMessage(SIEGE_PHASES.BOMBARDMENT, siege));
            
            // Log phase change for player
            if (expedition.ownerType === 'player') {
                Utils.log(generateSiegeMessage(SIEGE_PHASES.BOMBARDMENT, siege), 'important');
            }
        }
        else if (siege.progress >= 75 && siege.phase === SIEGE_PHASES.BOMBARDMENT) {
            siege.phase = SIEGE_PHASES.ASSAULT;
            siege.log.push(generateSiegeMessage(SIEGE_PHASES.ASSAULT, siege));
            
            // Log phase change for player
            if (expedition.ownerType === 'player') {
                Utils.log(generateSiegeMessage(SIEGE_PHASES.ASSAULT, siege), 'important');
            }
        }
        
        // Chance for casualties
        if (Utils.chanceOf(15 * tickSize)) {
            // Calculate casualties based on defense strength and phase
            let casualtyFactor;
            
            switch (siege.phase) {
                case SIEGE_PHASES.ENCIRCLEMENT: casualtyFactor = 0.01; break;
                case SIEGE_PHASES.BOMBARDMENT: casualtyFactor = 0.03; break;
                case SIEGE_PHASES.ASSAULT: casualtyFactor = 0.08; break;
                default: casualtyFactor = 0.02;
            }
            
            // Adjust by defense strength (stronger defenses = more casualties)
            casualtyFactor *= (1 + (siege.defenseStrength / 100));
            
            // Calculate and apply casualties
            const casualties = Math.ceil(expedition.warriors * casualtyFactor * Utils.randomBetween(0.7, 1.3));
            
            expedition.casualties = (expedition.casualties || 0) + casualties;
            expedition.warriors = Math.max(0, expedition.warriors - casualties);
            expedition.strength = expedition.warriors; // Simplified strength calculation
            
            // Log casualties for player
            if (expedition.ownerType === 'player') {
                Utils.log(`Your forces suffered ${casualties} casualties during the siege.`, 'danger');
            }
            
            // Check if expedition has too many losses to continue
            if (expedition.casualties > expedition.warriors * 1.5) {
                // Too many losses, abandon siege
                
                if (expedition.ownerType === 'player') {
                    Utils.log(`Having suffered heavy losses, your forces abandon the siege of ${settlement.name}.`, 'danger');
                }
                
                endSiege(siege, 'abandoned');
                
                // Order expedition to return home
                if (ExpeditionSystem && ExpeditionSystem.recallExpedition) {
                    ExpeditionSystem.recallExpedition(expedition.id);
                }
                
                return;
            }
        }
        
        // Siege concludes when progress reaches 100
        if (siege.progress >= 100) {
            endSiege(siege, 'victory');
            
            // Settlement captured - apply effects
            settlement.isCaptured = true;
            
            // Award fame for successful siege
            if (expedition.ownerType === 'player') {
                expedition.fame += 50 + (settlement.rank || 0) * 20;
            }
            
            // Order expedition to return home with loot
            if (ExpeditionSystem && ExpeditionSystem.recallExpedition) {
                ExpeditionSystem.recallExpedition(expedition.id);
            }
        }
    }
    
    /**
     * End a siege with specified outcome
     * @param {Object} siege - Siege object
     * @param {string} outcome - Siege outcome ('victory', 'defeat', 'abandoned')
     */
    function endSiege(siege, outcome) {
        siege.phase = SIEGE_PHASES.CONCLUDED;
        siege.outcome = outcome;
        siege.log.push(generateSiegeMessage(SIEGE_PHASES.CONCLUDED, siege));
        
        // Log conclusion for player
        const expedition = ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(siege.expeditionId);
        if (expedition && expedition.ownerType === 'player') {
            Utils.log(generateSiegeMessage(SIEGE_PHASES.CONCLUDED, siege), 
                outcome === 'victory' ? 'success' : 'important');
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the conflict system
         */
        init: function() {
            console.log("Initializing Conflict System...");
            
            // Register with game engine if available
            if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
                GameEngine.registerTickProcessor(this.processTick);
            }
            
            console.log("Conflict System initialized");
        },
        
        /**
         * Process a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Process active battles
            activeBattles.forEach(battle => {
                if (battle.phase !== BATTLE_PHASES.CONCLUDED) {
                    processBattle(battle, gameState, tickSize);
                }
            });
            
            // Process active sieges
            activeSieges.forEach(siege => {
                if (siege.phase !== SIEGE_PHASES.CONCLUDED) {
                    processSiege(siege, gameState, tickSize);
                }
            });
            
            // Remove concluded battles/sieges that are older than a certain threshold
            const currentTime = Date.now();
            const threshold = 1000 * 60 * 5; // 5 minutes
            
            activeBattles = activeBattles.filter(battle => {
                return battle.phase !== BATTLE_PHASES.CONCLUDED || 
                       currentTime - battle.date.getTime() < threshold;
            });
            
            activeSieges = activeSieges.filter(siege => {
                return siege.phase !== SIEGE_PHASES.CONCLUDED || 
                       currentTime - siege.date.getTime() < threshold;
            });
        },
        
        /**
         * Initiate a battle between expeditions
         * @param {Object} battleData - Battle configuration
         * @returns {Object} - Created battle
         */
        initiateBattle: function(battleData) {
            return createBattle(battleData);
        },
        
        /**
         * Initiate a siege on a settlement
         * @param {Object} siegeData - Siege configuration
         * @returns {Object} - Created siege
         */
        initiateSiege: function(siegeData) {
            return createSiege(siegeData);
        },
        
        /**
         * Get active battles
         * @param {boolean} [includeCompleted=false] - Whether to include completed battles
         * @returns {Array} - Array of battle objects
         */
        getActiveBattles: function(includeCompleted = false) {
            if (includeCompleted) {
                return [...activeBattles];
            }
            
            return activeBattles.filter(battle => battle.phase !== BATTLE_PHASES.CONCLUDED);
        },
        
        /**
         * Get active sieges
         * @param {boolean} [includeCompleted=false] - Whether to include completed sieges
         * @returns {Array} - Array of siege objects
         */
        getActiveSieges: function(includeCompleted = false) {
            if (includeCompleted) {
                return [...activeSieges];
            }
            
            return activeSieges.filter(siege => siege.phase !== SIEGE_PHASES.CONCLUDED);
        },
        
        /**
         * Get battle phase constants
         * @returns {Object} - Battle phase constants
         */
        getBattlePhases: function() {
            return { ...BATTLE_PHASES };
        },
        
        /**
         * Get siege phase constants
         * @returns {Object} - Siege phase constants
         */
        getSiegePhases: function() {
            return { ...SIEGE_PHASES };
        },
        
        /**
         * Get battle outcome constants
         * @returns {Object} - Battle outcome constants
         */
        getBattleOutcomes: function() {
            return { ...BATTLE_OUTCOMES };
        },
        
        /**
         * Handle settlement captured event
         * @param {string} settlementId - ID of the captured settlement
         * @param {string} expeditionId - ID of the capturing expedition
         */
        onSettlementCaptured: function(settlementId, expeditionId) {
            // This is a callback function that can be used by ExpeditionSystem
            // to notify the conflict system about captured settlements
            
            const settlement = WorldMap.getSettlement(settlementId);
            const expedition = ExpeditionSystem && ExpeditionSystem.getExpedition && ExpeditionSystem.getExpedition(expeditionId);
            
            if (!settlement || !expedition) return;
            
            console.log(`Settlement ${settlement.name} captured by expedition ${expedition.id}`);
            
            // Handle captured settlement logic
            // (e.g., change ownership, modify relationships, etc.)
            
            // For player expeditions, add log entry
            if (expedition.ownerType === 'player') {
                Utils.log(`Your forces have captured ${settlement.name}!`, 'success');
            }
        }
    };
})();

// Expose ConflictSystem to the window object for global access
window.ConflictSystem = ConflictSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game engine to be ready
    const waitForGameEngine = setInterval(function() {
        if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning) {
            clearInterval(waitForGameEngine);
            
            // Initialize the conflict system
            ConflictSystem.init();
        }
    }, 500);
});