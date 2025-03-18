/**
 * Viking Legacy - Raiding System
 * Handles all aspects of raiding mechanics, including target selection,
 * raid execution, combat resolution, and loot allocation
 */

const RaidManager = (function() {
    // Private variables
    
    // Active raids
    let activeRaids = [];
    
    // Raid types based on size and purpose
    const raidTypes = {
        QUICK_RAID: {
            id: "quick_raid",
            name: "Quick Raid",
            description: "A swift raid focused on grabbing easy loot with minimal resistance.",
            minSize: 15,
            maxSize: 50,
            preparationTime: 3,  // Days needed to prepare
            travelSpeedModifier: 1.3,  // 30% faster travel
            combatStrength: 0.8,  // Lower combat strength
            lootModifier: 0.7,  // Less loot
            stealthModifier: 1.5,  // Better stealth
            fameModifier: 0.5,  // Less fame gained
            infamyModifier: 0.5,  // Less reputation loss
            shipRequired: false
        },
        STANDARD_RAID: {
            id: "standard_raid",
            name: "Standard Raid",
            description: "A balanced raiding party capable of both fighting and plundering effectively.",
            minSize: 50,
            maxSize: 300,
            preparationTime: 5,
            travelSpeedModifier: 1.0,
            combatStrength: 1.0,
            lootModifier: 1.0,
            stealthModifier: 1.0,
            fameModifier: 1.0,
            infamyModifier: 1.0,
            shipRequired: false
        },
        GREAT_RAID: {
            id: "great_raid",
            name: "Great Raid",
            description: "A massive raid focused on overwhelming defenses and maximum plunder.",
            minSize: 300,
            maxSize: 1000,
            preparationTime: 10,
            travelSpeedModifier: 0.7,  // 30% slower travel
            combatStrength: 1.5,  // Stronger in combat
            lootModifier: 1.5,  // More loot
            stealthModifier: 0.6,  // Less stealthy
            fameModifier: 1.5,  // More fame
            infamyModifier: 2.0,  // Much more reputation loss
            shipRequired: false
        },
        SEA_RAID: {
            id: "sea_raid",
            name: "Sea Raid",
            description: "A coastal raid launched from ships, allowing attacks on distant settlements.",
            minSize: 20,
            maxSize: 50,
            preparationTime: 7,
            travelSpeedModifier: 2.0,  // Much faster over water
            combatStrength: 1.2,
            lootModifier: 1.2,
            stealthModifier: 1.2,
            fameModifier: 1.3,
            infamyModifier: 1.5,
            shipRequired: true
        }
    };
    
    // Raid template
    const raidTemplate = {
        id: "",
        name: "",
        raidType: "",  // From raidTypes
        status: "preparing",  // preparing, traveling, raiding, returning, completed, failed
        targetSettlement: null,  // ID of target settlement
        size: 0,  // Number of warriors
        ships: 0,  // Number of ships (for sea raids)
        leader: null,  // Character leading the raid
        strength: 0,  // Calculated raid strength
        startDate: null,  // Game date when raid started preparations
        departureDate: null,  // When raiders actually leave
        estimatedReturnDate: null,  // Estimated return date
        daysRemaining: 0,  // Days until next phase
        supplies: 0,  // Food supplies
        morale: 100,  // Raider morale
        loot: {  // Resources being carried back
            food: 0,
            wood: 0,
            stone: 0,
            metal: 0,
            silver: 0,
            gold: 0,
            thralls: 0,
            special: []  // Special items found
        },
        casualties: 0,  // Warriors lost
        targetWeakened: false,  // Whether target defenses were weakened
        relationshipChanges: {},  // Changes to relations with settlements/factions
        events: []  // Log of events that occurred during the raid
    };
    
    // Target settlement evaluation criteria
    const targetEvaluationFactors = {
        defenseStrength: -2.0,  // Higher defense = less desirable (negative weight)
        distancePenalty: -1.0,  // Greater distance = less desirable
        wealthBonus: 2.0,  // Greater wealth = more desirable
        relationshipPenalty: -1.5,  // Better relationships = less desirable to raid
        previousSuccessBonus: 1.0  // Previously successful raids = more desirable
    };
    
    // Loot tables by settlement type
    const lootTables = {
        VIKING: {
            common: {
                food: { min: 50, max: 150, chance: 90 },
                wood: { min: 30, max: 100, chance: 70 },
                metal: { min: 5, max: 20, chance: 50 },
                silver: { min: 10, max: 30, chance: 60 }
            },
            rare: {
                gold: { min: 1, max: 10, chance: 20 },
                thralls: { min: 1, max: 5, chance: 40 }
            },
            special: [
                { name: "Viking Axe", description: "Finely crafted battle axe", chance: 10 },
                { name: "Carved Rune Stone", description: "A stone with ancient runes", chance: 5 }
            ]
        },
        ANGLO: {
            common: {
                food: { min: 80, max: 200, chance: 90 },
                wood: { min: 20, max: 80, chance: 60 },
                stone: { min: 10, max: 50, chance: 50 },
                silver: { min: 30, max: 80, chance: 70 }
            },
            rare: {
                gold: { min: 5, max: 20, chance: 30 },
                thralls: { min: 2, max: 10, chance: 60 }
            },
            special: [
                { name: "Christian Relic", description: "A valuable religious item", chance: 15 },
                { name: "Noble's Gold Ring", description: "Ring bearing a noble's seal", chance: 10 }
            ]
        },
        FRANKISH: {
            common: {
                food: { min: 100, max: 250, chance: 90 },
                wood: { min: 20, max: 70, chance: 60 },
                stone: { min: 20, max: 60, chance: 60 },
                silver: { min: 50, max: 100, chance: 80 }
            },
            rare: {
                gold: { min: 10, max: 30, chance: 40 },
                thralls: { min: 3, max: 12, chance: 70 }
            },
            special: [
                { name: "Frankish Wine", description: "Barrels of expensive wine", chance: 20 },
                { name: "Royal Jewelry", description: "Fine jewelry from the nobility", chance: 15 }
            ]
        },
        NEUTRAL: {
            common: {
                food: { min: 30, max: 100, chance: 90 },
                wood: { min: 20, max: 60, chance: 70 },
                stone: { min: 5, max: 20, chance: 40 },
                silver: { min: 5, max: 20, chance: 50 }
            },
            rare: {
                gold: { min: 0, max: 5, chance: 10 },
                thralls: { min: 1, max: 3, chance: 30 }
            },
            special: [
                { name: "Trade Goods", description: "Miscellaneous valuable goods", chance: 8 }
            ]
        }
    };
    
    // Combat resolution factors
    const combatFactors = {
        raiderStrengthWeight: 1.5,  // Higher = raider strength matters more
        defenseStrengthWeight: 1.0,  // Higher = settlement defense matters more
        moraleFactor: 0.5,  // How much morale affects combat
        leadershipBonus: 0.3,  // How much a good leader helps
        randomnessFactor: 0.4  // How much random chance plays a role (0-1)
    };
    
    // Private methods
    
    /**
     * Generate a unique ID for a raid
     * @returns {string} - Unique ID
     */
    function generateRaidId() {
        return `raid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Generate a thematic name for a raid
     * @param {string} targetName - Name of the target settlement
     * @param {string} raidTypeId - Type of raid
     * @returns {string} - Generated raid name
     */
    function generateRaidName(targetName, raidTypeId) {
        const prefixes = [
            "The Ravaging of", "The Assault on", "The Sacking of", 
            "The Plunder of", "The Storm of", "The Conquest of"
        ];
        
        let prefix;
        
        // Choose prefix based on raid type
        switch (raidTypeId) {
            case "quick_raid":
                prefix = "The Swift Strike on";
                break;
            case "great_raid":
                prefix = "The Great Ravaging of";
                break;
            case "sea_raid":
                prefix = "The Sea-borne Assault on";
                break;
            default:
                prefix = prefixes[Utils.randomBetween(0, prefixes.length - 1)];
        }
        
        return `${prefix} ${targetName}`;
    }
    
    /**
     * Calculate the strength of a raid
     * @param {Object} raid - Raid object
     * @returns {number} - Calculated strength
     */
    function calculateRaidStrength(raid) {
        const raidType = raidTypes[raid.raidType];
        if (!raidType) return 0;
        
        // Base strength from warriors
        let strength = raid.size * raidType.combatStrength;
        
        // Add bonus from leader if present
        if (raid.leader) {
            const leaderCombatSkill = raid.leader.skills?.combat || 1;
            const leaderBonus = 1 + (leaderCombatSkill / 10); // 10% bonus per combat skill point
            strength *= leaderBonus;
        }
        
        // Morale effects
        strength *= (raid.morale / 100);
        
        // Ship bonus for sea raids
        if (raid.raidType === "sea_raid" && raid.ships > 0) {
            // Each ship adds a small bonus
            const shipBonus = 1 + (raid.ships * 0.05); // 5% bonus per ship
            strength *= shipBonus;
        }
        
        return strength;
    }
    
    /**
     * Calculate travel time to a settlement
     * @param {Object} playerSettlement - Player's settlement
     * @param {Object} targetSettlement - Target settlement
     * @param {Object} raidType - Type of raid
     * @returns {number} - Travel time in days
     */
    function calculateTravelTime(playerSettlement, targetSettlement, raidType) {
        if (!playerSettlement || !targetSettlement || !raidType) return 10; // Default fallback
        
        // Calculate distance
        const dx = targetSettlement.position.x - playerSettlement.position.x;
        const dy = targetSettlement.position.y - playerSettlement.position.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Base travel time (1 day per 10 units of distance)
        let travelTime = distance / 10;
        
        // Adjust for raid type speed modifier
        travelTime /= raidType.travelSpeedModifier;
        
        // Minimum travel time
        travelTime = Math.max(1, Math.ceil(travelTime));
        
        return travelTime;
    }
    
    /**
     * Calculate supplies needed for a raid
     * @param {number} warriors - Number of warriors
     * @param {number} duration - Total raid duration in days
     * @returns {number} - Supplies needed
     */
    function calculateSuppliesNeeded(warriors, duration) {
        // Each warrior consumes 1 food per day
        return warriors * duration;
    }
    
    /**
     * Evaluate potential raid targets
     * @param {Array} settlements - Array of potential target settlements
     * @param {Object} playerSettlement - Player's settlement
     * @param {string} raidTypeId - Type of raid
     * @returns {Array} - Sorted array of targets with scores
     */
    function evaluateRaidTargets(settlements, playerSettlement, raidTypeId) {
        if (!settlements || !playerSettlement) return [];
        
        const raidType = raidTypes[raidTypeId];
        if (!raidType) return [];
        
        // Calculate scores for each settlement
        const evaluatedTargets = settlements.map(settlement => {
            // Skip player's own settlement
            if (settlement.isPlayer) return { settlement, score: -1000 };
            
            let score = 0;
            
            // Distance factor (closer is better)
            const dx = settlement.position.x - playerSettlement.position.x;
            const dy = settlement.position.y - playerSettlement.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            score += targetEvaluationFactors.distancePenalty * (distance / 100);
            
            // Defense factor (weaker is better)
            const defenseStrength = settlement.military?.defenses || 0;
            score += targetEvaluationFactors.defenseStrength * defenseStrength;
            
            // Wealth factor (richer is better)
            let wealth = 0;
            if (settlement.resources) {
                wealth += (settlement.resources.silver || 0) * 2;
                wealth += (settlement.resources.gold || 0) * 5;
                wealth += (settlement.resources.food || 0) * 0.1;
                wealth += (settlement.resources.metal || 0) * 0.5;
            }
            score += targetEvaluationFactors.wealthBonus * (wealth / 100);
            
            // Relationship factor (hostile is better to raid)
            let relationship = 50; // Default neutral
            if (settlement.relations && settlement.relations[playerSettlement.id]) {
                relationship = settlement.relations[playerSettlement.id];
            }
            score += targetEvaluationFactors.relationshipPenalty * (relationship / 100);
            
            // Adjustment for raid type
            if (raidType.id === "sea_raid") {
                // Sea raids favor coastal settlements
                const isCoastal = settlement.region && WorldMap.getRegion(settlement.region)?.type === "COASTAL";
                if (isCoastal) {
                    score += 30; // Big bonus for coastal targets on sea raids
                } else {
                    score -= 50; // Big penalty for non-coastal targets on sea raids
                }
            } else if (raidType.id === "quick_raid") {
                // Quick raids favor closer targets
                score -= distance / 50; // Additional distance penalty
            } else if (raidType.id === "great_raid") {
                // Great raids favor wealthier targets
                score += wealth / 50; // Additional wealth bonus
            }
            
            return {
                settlement,
                score,
                distance,
                defenseStrength,
                wealth,
                relationship
            };
        });
        
        // Filter out invalid targets (like player's own settlement)
        const validTargets = evaluatedTargets.filter(target => target.score > -100);
        
        // Sort by score (highest first)
        validTargets.sort((a, b) => b.score - a.score);
        
        return validTargets;
    }
    
    /**
     * Resolve the combat phase of a raid
     * @param {Object} raid - Raid object
     * @param {Object} targetSettlement - Target settlement object
     * @returns {Object} - Combat result
     */
    function resolveCombat(raid, targetSettlement) {
        // Calculate raider strength
        const raiderStrength = calculateRaidStrength(raid);
        
        // Calculate defender strength
        let defenderStrength = 0;
        
        if (targetSettlement.military) {
            // Warriors provide main defense
            defenderStrength += (targetSettlement.military.warriors || 0) * 1.0;
            
            // Defenses (walls, fortifications) add strength
            defenderStrength += (targetSettlement.military.defenses || 0) * 2.0;
            
            // Ships can help defend coastal settlements
            if (targetSettlement.military.ships && targetSettlement.region) {
                const region = WorldMap.getRegion(targetSettlement.region);
                if (region && (region.type === "COASTAL" || region.type === "FJORD")) {
                    defenderStrength += targetSettlement.military.ships * 1.5;
                }
            }
        }
        
        // Civilians can provide some defense if defenders are few
        if (targetSettlement.population && targetSettlement.military?.warriors < 5) {
            defenderStrength += targetSettlement.population * 0.1; // 10 civilians = 1 warrior
        }
        
        // Apply weights to attacker and defender strengths
        const weightedRaiderStrength = raiderStrength * combatFactors.raiderStrengthWeight;
        const weightedDefenderStrength = defenderStrength * combatFactors.defenseStrengthWeight;
        
        // Calculate strength ratio
        const strengthRatio = weightedRaiderStrength / Math.max(1, weightedDefenderStrength);
        
        // Base success chance
        let successChance = 50; // 50% base chance
        
        // Adjust for strength ratio
        if (strengthRatio > 1) {
            // Raiders are stronger
            successChance += Math.min(45, (strengthRatio - 1) * 30); // Up to +45%
        } else {
            // Defenders are stronger
            successChance -= Math.min(40, (1 - strengthRatio) * 40); // Up to -40%
        }
        
        // Adjust for morale
        successChance += (raid.morale - 50) * combatFactors.moraleFactor;
        
        // Adjust for leadership
        if (raid.leader && raid.leader.skills?.combat) {
            successChance += raid.leader.skills.combat * combatFactors.leadershipBonus;
        }
        
        // Add random factor
        const randomFactor = (Math.random() - 0.5) * 2 * combatFactors.randomnessFactor * 100;
        successChance += randomFactor;
        
        // Clamp success chance
        successChance = Math.max(5, Math.min(95, successChance));
        
        // Determine outcome
        const success = Math.random() * 100 < successChance;
        
        // Calculate casualties
        let raiderCasualties = 0;
        let defenderCasualties = 0;
        
        if (success) {
            // Raiders won, fewer casualties for them, more for defenders
            raiderCasualties = Math.max(0, Math.floor(raid.size * (0.05 + (1 / strengthRatio) * 0.1)));
            defenderCasualties = Math.max(1, Math.floor(targetSettlement.military?.warriors * (0.3 + strengthRatio * 0.2)));
        } else {
            // Raiders lost, more casualties for them, fewer for defenders
            raiderCasualties = Math.max(1, Math.floor(raid.size * (0.15 + (1 / strengthRatio) * 0.2)));
            defenderCasualties = Math.max(0, Math.floor(targetSettlement.military?.warriors * 0.1));
        }
        
        // Limit casualties to available warriors
        raiderCasualties = Math.min(raiderCasualties, raid.size - 1); // Ensure at least 1 raider survives
        defenderCasualties = Math.min(defenderCasualties, targetSettlement.military?.warriors || 0);
        
        // Determine if settlement defenses were weakened
        const defensesWeakened = success && strengthRatio > 1.5;
        
        return {
            success,
            raiderStrength,
            defenderStrength,
            strengthRatio,
            successChance,
            raiderCasualties,
            defenderCasualties,
            defensesWeakened
        };
    }
    
    /**
     * Determine loot from a successful raid
     * @param {Object} raid - Raid object
     * @param {Object} targetSettlement - Target settlement object
     * @param {Object} combatResult - Result of combat
     * @returns {Object} - Loot obtained
     */
    function determineLoot(raid, targetSettlement, combatResult) {
        const raidType = raidTypes[raid.raidType];
        if (!raidType || !targetSettlement || !combatResult.success) {
            return {
                food: 0,
                wood: 0,
                stone: 0,
                metal: 0,
                silver: 0,
                gold: 0,
                thralls: 0,
                special: []
            };
        }
        
        // Get loot table based on settlement type
        const lootTable = lootTables[targetSettlement.type] || lootTables.NEUTRAL;
        
        // Initialize loot object
        const loot = {
            food: 0,
            wood: 0,
            stone: 0,
            metal: 0,
            silver: 0,
            gold: 0,
            thralls: 0,
            special: []
        };
        
        // Calculate loot effectiveness based on combat result
        const lootEffectiveness = combatResult.strengthRatio * raidType.lootModifier;
        
        // Process common resources
        for (const resource in lootTable.common) {
            const lootDef = lootTable.common[resource];
            
            // Check if we get this resource
            if (Utils.chanceOf(lootDef.chance)) {
                // Calculate amount
                const baseAmount = Utils.randomBetween(lootDef.min, lootDef.max);
                const amount = Math.ceil(baseAmount * lootEffectiveness);
                
                // Add to loot
                loot[resource] = amount;
            }
        }
        
        // Process rare resources
        for (const resource in lootTable.rare) {
            const lootDef = lootTable.rare[resource];
            
            // Higher threshold for rare resources
            if (Utils.chanceOf(lootDef.chance * lootEffectiveness)) {
                // Calculate amount
                const baseAmount = Utils.randomBetween(lootDef.min, lootDef.max);
                const amount = Math.ceil(baseAmount * lootEffectiveness);
                
                // Add to loot
                loot[resource] = amount;
            }
        }
        
        // Process special items
        if (lootTable.special && lootTable.special.length > 0) {
            for (const specialItem of lootTable.special) {
                // Higher threshold for special items
                if (Utils.chanceOf(specialItem.chance * lootEffectiveness)) {
                    loot.special.push({
                        name: specialItem.name,
                        description: specialItem.description
                    });
                }
            }
        }
        
        // Adjust loot based on how much the settlement actually has
        if (targetSettlement.resources) {
            // Cap loot to what's available
            for (const resource in loot) {
                if (resource !== 'special' && resource !== 'thralls' && targetSettlement.resources[resource]) {
                    // Take up to 80% of what they have
                    const maxLoot = Math.floor(targetSettlement.resources[resource] * 0.8);
                    loot[resource] = Math.min(loot[resource], maxLoot);
                }
            }
        }
        
        return loot;
    }
    
    /**
     * Calculate relationship changes from a raid
     * @param {Object} raid - Raid object
     * @param {Object} targetSettlement - Target settlement object
     * @param {Object} combatResult - Result of combat
     * @returns {Object} - Relationship changes
     */
    function calculateRelationshipChanges(raid, targetSettlement, combatResult) {
        if (!targetSettlement) return {};
        
        const changes = {};
        const raidType = raidTypes[raid.raidType];
        
        // Base relationship change with target
        let change = -30; // Base negative impact
        
        // Adjust based on raid type
        change *= raidType.infamyModifier;
        
        // Adjust based on success and casualties
        if (combatResult.success) {
            change -= 10; // Additional penalty for successful raid
            
            // Larger penalty for high casualties
            if (combatResult.defenderCasualties > 5) {
                change -= 10;
            }
            
            // Larger penalty if defenses were weakened
            if (combatResult.defensesWeakened) {
                change -= 15;
            }
        } else {
            // Failed raids have less impact
            change = Math.ceil(change / 2);
        }
        
        // Record change for target settlement
        changes[targetSettlement.id] = change;
        
        // Also affect relations with other settlements of the same faction
        const targetFaction = targetSettlement.faction || targetSettlement.type;
        
        // Get all settlements
        const allSettlements = WorldMap.getWorldMap().settlements;
        
        for (const settlement of allSettlements) {
            // Skip target (already processed) and player settlement
            if (settlement.id === targetSettlement.id || settlement.isPlayer) continue;
            
            // If same faction, apply a smaller relationship penalty
            if (settlement.faction === targetFaction || settlement.type === targetFaction) {
                // Smaller impact on other faction settlements
                const factionChange = Math.ceil(change / 3);
                changes[settlement.id] = factionChange;
            }
        }
        
        return changes;
    }
    
    /**
     * Create the raiding UI
     */
    function createRaidingUI() {
        // Check if raid panel already exists
        if (document.getElementById('raid-panel')) {
            return;
        }
        
        console.log("Creating raid panel");
        
        // Create raid panel
        const raidPanel = document.createElement('div');
        raidPanel.id = 'raid-panel';
        raidPanel.className = 'raid-panel hidden-panel';
        
        raidPanel.innerHTML = `
            <h2>Raiding</h2>
            <div class="raid-content">
                <div class="active-raids-section">
                    <h3>Active Raids</h3>
                    <div id="active-raids-list" class="active-raids-list">
                        <p class="no-raids-message">No active raids. Organize a new raid to plunder wealth and resources.</p>
                    </div>
                </div>
                
                <!-- Show leader if present -->
                ${raid.leader ? `
                <div class="leader-section">
                    <h3>Raid Leader</h3>
                    <div class="leader-card">
                        <div class="leader-name">${raid.leader.name}</div>
                        <div class="leader-details">
                            <div><strong>Age:</strong> ${Math.floor(raid.leader.age)}</div>
                            <div><strong>Combat:</strong> ${raid.leader.skills?.combat || 0}</div>
                            <div><strong>Leadership:</strong> ${raid.leader.skills?.leadership || 0}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Show loot if completed -->
                ${raid.status === "completed" || raid.status === "returning" ? `
                <div class="loot-section">
                    <h3>Raid Spoils</h3>
                    <div class="loot-list">
                        ${raid.loot.food > 0 ? `<div class="loot-item">Food: ${raid.loot.food}</div>` : ''}
                        ${raid.loot.wood > 0 ? `<div class="loot-item">Wood: ${raid.loot.wood}</div>` : ''}
                        ${raid.loot.stone > 0 ? `<div class="loot-item">Stone: ${raid.loot.stone}</div>` : ''}
                        ${raid.loot.metal > 0 ? `<div class="loot-item">Metal: ${raid.loot.metal}</div>` : ''}
                        ${raid.loot.silver > 0 ? `<div class="loot-item">Silver: ${raid.loot.silver}</div>` : ''}
                        ${raid.loot.gold > 0 ? `<div class="loot-item">Gold: ${raid.loot.gold}</div>` : ''}
                        ${raid.loot.thralls > 0 ? `<div class="loot-item">Captives: ${raid.loot.thralls}</div>` : ''}
                        ${raid.loot.special.map(item => `
                            <div class="loot-item special-item">${item.name}: ${item.description}</div>
                        `).join('')}
                        ${Object.values(raid.loot).every(v => (typeof v === 'number' ? v <= 0 : !v.length)) ? 
                            `<div class="no-loot-message">No loot acquired yet.</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <!-- Show event log if any events occurred -->
                ${raid.events && raid.events.length > 0 ? `
                <div class="events-section">
                    <h3>Raid Events</h3>
                    <div class="events-list">
                        ${raid.events.map(event => `
                            <div class="event-item">
                                <div class="event-title">${event.title}</div>
                                <div class="event-description">${event.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="raid-form-section">
                    <h3>Organize Raid</h3>
                    <div class="raid-form">
                        <div class="form-group">
                            <label for="raid-type">Raid Type:</label>
                            <select id="raid-type">
                                <option value="quick_raid">Quick Raid (5-15 warriors)</option>
                                <option value="standard_raid">Standard Raid (15-30 warriors)</option>
                                <option value="great_raid">Great Raid (30+ warriors)</option>
                                <option value="sea_raid">Sea Raid (20-50 warriors, requires ships)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="raid-size">Raiding Party Size:</label>
                            <input type="number" id="raid-size" min="5" value="15">
                            <div class="size-range" id="size-range">15-30 warriors</div>
                        </div>
                        
                        <div class="form-group" id="ships-group" style="display: none;">
                            <label for="raid-ships">Ships:</label>
                            <input type="number" id="raid-ships" min="1" value="1">
                            <div class="ships-info">Each ship can transport ~20 warriors</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="raid-target">Target Settlement:</label>
                            <select id="raid-target">
                                <option value="">Loading targets...</option>
                            </select>
                        </div>
                        
                        <div class="target-info" id="target-info">
                            <p>Select a target to view information</p>
                        </div>
                        
                        <div class="form-group">
                            <label>Preparation:</label>
                            <div id="raid-preparation-info">5 days</div>
                        </div>
                        
                        <div class="form-group">
                            <label>Supplies Needed:</label>
                            <div id="raid-supplies-needed">75 food</div>
                        </div>
                        
                        <button id="start-raid" class="start-raid-btn">Organize Raid</button>
                    </div>
                </div>
                
                <div class="raid-details-section" id="raid-details-section" style="display: none;">
                    <h3>Raid Details</h3>
                    <div id="raid-details-content"></div>
                    <button id="back-to-raids" class="back-btn">Back to Raids</button>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(raidPanel);
            
            // Add event listeners
            document.getElementById('raid-type').addEventListener('change', updateRaidForm);
            document.getElementById('raid-size').addEventListener('input', updateRaidForm);
            document.getElementById('raid-ships').addEventListener('input', updateRaidForm);
            document.getElementById('raid-target').addEventListener('change', updateTargetInfo);
            document.getElementById('start-raid').addEventListener('click', startRaid);
            document.getElementById('back-to-raids').addEventListener('click', () => {
                document.getElementById('raid-details-section').style.display = 'none';
                document.querySelector('.active-raids-section').style.display = 'block';
                document.querySelector('.raid-form-section').style.display = 'block';
            });
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('raid-panel', 'world');
            }
            
            // Add CSS styles
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .raid-panel {
                    background-color: #f7f0e3;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .raid-panel h2 {
                    color: #5d4037;
                    border-bottom: 2px solid #a99275;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                
                .raid-panel h3 {
                    color: #5d4037;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                
                .active-raids-list {
                    margin-bottom: 20px;
                }
                
                .raid-card {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-left: 4px solid #b71c1c;
                    border-radius: 4px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .raid-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .raid-title {
                    font-weight: bold;
                    font-size: 1.1em;
                    color: #5d4037;
                }
                
                .raid-status {
                    font-size: 0.9em;
                    padding: 2px 8px;
                    border-radius: 10px;
                    background-color: #f0f0f0;
                }
                
                .status-preparing { background-color: #fff9c4; }
                .status-traveling { background-color: #bbdefb; }
                .status-raiding { background-color: #ffcdd2; }
                .status-returning { background-color: #c8e6c9; }
                .status-completed { background-color: #d7ccc8; }
                .status-failed { background-color: #ffcdd2; }
                
                .raid-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 10px;
                    font-size: 0.9em;
                }
                
                .raid-progress {
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
                    background-color: #b71c1c;
                    width: 0%;
                }
                
                .raid-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .raid-form {
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
                
                .start-raid-btn {
                    background-color: #b71c1c;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .start-raid-btn:hover {
                    background-color: #8b0000;
                }
                
                .start-raid-btn:disabled {
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
                
                .raid-details-content {
                    background-color: #fff;
                    border: 1px solid #d7cbb9;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .raid-metrics {
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
                
                .loot-list {
                    margin-top: 15px;
                }
                
                .loot-item {
                    background-color: #f9f9f9;
                    border-left: 3px solid #b71c1c;
                    padding: 10px;
                    margin-bottom: 8px;
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
                
                .target-stat-wealth .target-bar-fill { background-color: #ffd700; }
                .target-stat-defense .target-bar-fill { background-color: #2196f3; }
                .target-stat-distance .target-bar-fill { background-color: #4caf50; }
                .target-stat-relations .target-bar-fill { background-color: #f44336; }
                
                .no-raids-message {
                    font-style: italic;
                    color: #777;
                }
                
                .special-item {
                    font-weight: bold;
                    color: #b71c1c;
                }
                
                @media (max-width: 768px) {
                    .raid-info {
                        grid-template-columns: 1fr;
                    }
                    
                    .raid-metrics {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            
            document.head.appendChild(styleElement);
            
            // Initialize form
            updateRaidForm();
            
            // Load available targets
            loadRaidTargets();
        }
    }
    
    /**
     * Update the raid form based on selected options
     */
    function updateRaidForm() {
        const typeSelect = document.getElementById('raid-type');
        const sizeInput = document.getElementById('raid-size');
        const shipsInput = document.getElementById('raid-ships');
        const shipsGroup = document.getElementById('ships-group');
        const sizeRangeDisplay = document.getElementById('size-range');
        const preparationInfo = document.getElementById('raid-preparation-info');
        const suppliesNeededDisplay = document.getElementById('raid-supplies-needed');
        const startButton = document.getElementById('start-raid');
        
        // Get selected raid type
        const selectedType = typeSelect.value;
        const raidType = raidTypes[selectedType];
        
        if (!raidType) return;
        
        // Update size range display
        sizeRangeDisplay.textContent = `${raidType.minSize}-${raidType.maxSize} warriors`;
        
        // Enforce min/max size for the selected raid type
        sizeInput.min = raidType.minSize;
        sizeInput.max = raidType.maxSize;
        
        // Adjust size if out of range
        let size = parseInt(sizeInput.value);
        if (size < raidType.minSize) {
            sizeInput.value = raidType.minSize;
            size = raidType.minSize;
        } else if (size > raidType.maxSize) {
            sizeInput.value = raidType.maxSize;
            size = raidType.maxSize;
        }
        
        // Show/hide ships input for sea raids
        if (raidType.shipRequired) {
            shipsGroup.style.display = 'block';
            
            // Calculate min ships based on warriors (1 ship per 20 warriors)
            const minShips = Math.ceil(size / 20);
            shipsInput.min = minShips;
            
            if (parseInt(shipsInput.value) < minShips) {
                shipsInput.value = minShips;
            }
        } else {
            shipsGroup.style.display = 'none';
        }
        
        // Update preparation time
        preparationInfo.textContent = `${raidType.preparationTime} days`;
        
        // Update target selection
        loadRaidTargets();
        
        // Calculate estimated raid duration
        const targetSelect = document.getElementById('raid-target');
        let totalDuration = raidType.preparationTime;
        
        if (targetSelect.value) {
            const targetSettlement = WorldMap.getSettlement(targetSelect.value);
            const playerSettlement = WorldMap.getPlayerSettlement();
            
            if (targetSettlement && playerSettlement) {
                const travelTime = calculateTravelTime(playerSettlement, targetSettlement, raidType);
                totalDuration += travelTime * 2; // Round trip
                totalDuration += 1; // Raiding time
            }
        } else {
            // Estimate if no target selected
            totalDuration += 10; // Arbitrary estimate
        }
        
        // Calculate supplies needed
        const suppliesNeeded = calculateSuppliesNeeded(size, totalDuration);
        suppliesNeededDisplay.textContent = `${Math.ceil(suppliesNeeded)} food`;
        
        // Check if raid can be created
        let canCreateRaid = true;
        let errorReason = "";
        
        // Check for warriors
        const population = typeof PopulationManager !== 'undefined' ? 
            PopulationManager.getPopulation() : null;
        
        // Use BuildingSystem's getWarriorData if available for more accurate warrior count
        const warriorData = typeof BuildingSystem !== 'undefined' && 
                           typeof BuildingSystem.getWarriorData === 'function' ? 
                           BuildingSystem.getWarriorData() : null;
                           
        const availableWarriors = warriorData ? warriorData.available : (population ? population.warriors : 0);
        
        if (size > availableWarriors) {
            canCreateRaid = false;
            errorReason = `Not enough warriors available (need ${size}, have ${availableWarriors})`;
        }
        
        // Check for ships if needed
        if (raidType.shipRequired) {
            const shipsNeeded = parseInt(shipsInput.value) || 0;
            const availableShips = 0; // In a real game, you'd check available ships
            
            if (shipsNeeded > availableShips) {
                canCreateRaid = false;
                errorReason = `Not enough ships available (need ${shipsNeeded}, have ${availableShips})`;
            }
        }
        
        // Check for supplies
        const resources = typeof ResourceManager !== 'undefined' ? 
            ResourceManager.getResources() : null;
            
        if (resources && resources.food < suppliesNeeded) {
            canCreateRaid = false;
            errorReason = `Not enough food supplies (need ${Math.ceil(suppliesNeeded)}, have ${Math.floor(resources.food)})`;
        }
        
        // Check for selected target
        if (!targetSelect.value) {
            canCreateRaid = false;
            errorReason = "No target settlement selected";
        }
        
        // Update button state
        startButton.disabled = !canCreateRaid;
        
        if (!canCreateRaid && errorReason) {
            // Display error in target info
            const targetInfo = document.getElementById('target-info');
            targetInfo.innerHTML = `<p class="error-message">${errorReason}</p>`;
        }
    }
    
    /**
     * Load available raid targets into the select element
     */
    function loadRaidTargets() {
        const targetSelect = document.getElementById('raid-target');
        const raidTypeSelect = document.getElementById('raid-type');
        
        if (!targetSelect || !raidTypeSelect) return;
        
        // Get selected raid type
        const raidTypeId = raidTypeSelect.value;
        
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
        const evaluatedTargets = evaluateRaidTargets(otherSettlements, playerSettlement, raidTypeId);
        
        // Create options
        let optionsHtml = '<option value="">Select a target...</option>';
        
        evaluatedTargets.forEach(target => {
            const settlement = target.settlement;
            const relationshipText = getRelationshipText(target.relationship);
            
            optionsHtml += `<option value="${settlement.id}" data-score="${target.score.toFixed(2)}" data-distance="${target.distance.toFixed(0)}" data-defense="${target.defenseStrength}" data-wealth="${target.wealth.toFixed(0)}" data-relationship="${target.relationship}">${settlement.name} (${settlement.type}) - ${relationshipText}</option>`;
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
        const targetSelect = document.getElementById('raid-target');
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
        const defense = parseInt(selectedOption.dataset.defense) || 0;
        const wealth = parseInt(selectedOption.dataset.wealth) || 0;
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
        
        // Calculate normalized values for visual bars (0-100)
        const wealthNormalized = Math.min(100, wealth / 3);
        const defenseNormalized = Math.min(100, defense * 10);
        const distanceNormalized = Math.min(100, Math.max(0, 100 - (distance / 3)));
        const relationshipNormalized = Math.min(100, Math.max(0, 100 - relationship));
        
        // Generate HTML
        const html = `
            <div class="target-header">
                <h4>${settlement.name}</h4>
                <div class="target-type">${settlement.type} Settlement</div>
            </div>
            <div class="target-region">Located in ${regionName} (${regionType})</div>
            <div class="target-population">Population: ~${settlement.population || "Unknown"}</div>
            
            <div class="target-stats">
                <div class="target-stat target-stat-wealth">
                    <div class="stat-label">Wealth:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${wealth.toFixed(0)}</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${wealthNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-defense">
                    <div class="stat-label">Defenses:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${defense}</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${defenseNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-distance">
                    <div class="stat-label">Proximity:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${distance.toFixed(0)} units</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${distanceNormalized}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="target-stat target-stat-relations">
                    <div class="stat-label">Hostility:</div>
                    <div class="stat-value-container">
                        <div class="stat-value">${getRelationshipText(relationship)}</div>
                        <div class="target-bar">
                            <div class="target-bar-fill" style="width: ${relationshipNormalized}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="raid-evaluation">
                <div class="evaluation-score">Raid Score: ${score.toFixed(1)}</div>
                <div class="evaluation-text">${getRaidEvaluationText(score)}</div>
            </div>
        `;
        
        targetInfo.innerHTML = html;
        
        // Update raid form (for supplies calculation)
        updateRaidForm();
    }
    
    /**
     * Get evaluation text based on raid score
     * @param {number} score - Raid score
     * @returns {string} - Evaluation text
     */
    function getRaidEvaluationText(score) {
        if (score >= 20) return "Excellent target! Rich and vulnerable.";
        if (score >= 10) return "Good target with favorable conditions.";
        if (score >= 0) return "Average target. Exercise caution.";
        if (score >= -10) return "Poor target. Consider alternatives.";
        return "Dangerous target. Not recommended.";
    }
    
    /**
     * Start a new raid
     */
    function startRaid() {
        // Get form values
        const typeSelect = document.getElementById('raid-type');
        const sizeInput = document.getElementById('raid-size');
        const shipsInput = document.getElementById('raid-ships');
        const targetSelect = document.getElementById('raid-target');
        
        const raidTypeId = typeSelect.value;
        const size = parseInt(sizeInput.value);
        const ships = parseInt(shipsInput.value) || 0;
        const targetId = targetSelect.value;
        
        // Validate inputs
        if (!raidTypeId || !size || !targetId) {
            Utils.log("Invalid raid parameters.", "important");
            return;
        }
        
        const raidType = raidTypes[raidTypeId];
        if (!raidType) {
            Utils.log("Invalid raid type.", "important");
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
        const travelTime = calculateTravelTime(playerSettlement, targetSettlement, raidType);
        
        // Calculate total raid duration
        const totalDuration = raidType.preparationTime + (travelTime * 2) + 1; // Prep + travel there + raid + travel back
        
        // Calculate supplies needed
        const suppliesNeeded = calculateSuppliesNeeded(size, totalDuration);
        
        // Subtract resources
        const resourcesUsed = {
            food: suppliesNeeded
        };
        
        const resourcesSubtracted = ResourceManager.subtractResources(resourcesUsed);
        
        if (!resourcesSubtracted) {
            Utils.log("Failed to allocate resources for raid.", "important");
            return;
        }
        
        // Remove warriors from available pool
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.assignWarriors === 'function') {
            const warriorsAssigned = BuildingSystem.assignWarriors(size);
            
            if (!warriorsAssigned) {
                // Return resources if warrior assignment fails
                ResourceManager.addResources(resourcesUsed);
                Utils.log("Failed to assign warriors to raid. Resources refunded.", "important");
                return;
            }
        }
        
        // Get current game date
        const gameDate = GameEngine.getGameState().date;
        
        // Get leader if available
        let leader = PopulationManager.getDynastyLeader();
        
        // Create raid
        const raid = Object.assign({}, raidTemplate, {
            id: generateRaidId(),
            name: generateRaidName(targetSettlement.name, raidTypeId),
            raidType: raidTypeId,
            status: "preparing",
            targetSettlement: targetId,
            size: size,
            ships: ships,
            leader: leader,
            startDate: { ...gameDate },
            departureDate: { 
                // Add preparation time to current date
                day: gameDate.day + raidType.preparationTime,
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
            daysRemaining: raidType.preparationTime,
            supplies: suppliesNeeded,
            morale: 100
        });
        
        // Calculate initial strength
        raid.strength = calculateRaidStrength(raid);
        
        // Add to active raids
        activeRaids.push(raid);
        
        // Log raid start
        Utils.log(`A ${raidType.name} raid of ${size} warriors has begun preparations to raid ${targetSettlement.name}.`, "important");
        
        // Update UI
        updateRaidsList();
        
        // Reset form
        resetRaidForm();
    }
    
    /**
     * Reset the raid form
     */
    function resetRaidForm() {
        // Reset inputs to defaults
        document.getElementById('raid-type').value = 'standard_raid';
        document.getElementById('raid-size').value = '15';
        document.getElementById('raid-ships').value = '1';
        document.getElementById('raid-target').value = '';
        
        // Update form displays
        updateRaidForm();
        
        // Clear target info
        document.getElementById('target-info').innerHTML = '<p>Select a target to view information</p>';
    }
    
    /**
     * Update the active raids list
     */
    function updateRaidsList() {
        const raidsList = document.getElementById('active-raids-list');
        if (!raidsList) return;
        
        if (activeRaids.length === 0) {
            raidsList.innerHTML = `
                <p class="no-raids-message">No active raids. Organize a new raid to plunder wealth and resources.</p>
            `;
            return;
        }
        
        let html = '';
        
        activeRaids.forEach(raid => {
            // Calculate progress percentage
            let progressPercent = 0;
            let phaseDuration = 0;
            let phaseElapsed = 0;
            
            const raidType = raidTypes[raid.raidType];
            
            if (raid.status === "preparing") {
                phaseDuration = raidType.preparationTime;
                phaseElapsed = phaseDuration - raid.daysRemaining;
                progressPercent = (phaseElapsed / phaseDuration) * 100;
            } else if (raid.status === "traveling" || raid.status === "returning") {
                // Get travel time based on settlements
                const playerSettlement = WorldMap.getPlayerSettlement();
                const targetSettlement = WorldMap.getSettlement(raid.targetSettlement);
                
                if (playerSettlement && targetSettlement) {
                    phaseDuration = calculateTravelTime(playerSettlement, targetSettlement, raidType);
                    phaseElapsed = phaseDuration - raid.daysRemaining;
                    progressPercent = (phaseElapsed / phaseDuration) * 100;
                }
            } else if (raid.status === "raiding") {
                // Raiding phase is typically 1 day
                phaseDuration = 1;
                phaseElapsed = 1 - raid.daysRemaining;
                progressPercent = (phaseElapsed / phaseDuration) * 100;
            } else if (raid.status === "completed" || raid.status === "failed") {
                progressPercent = 100;
            }
            
            // Format progress percentage
            progressPercent = Math.min(100, Math.max(0, progressPercent));
            
            // Get target settlement name
            let targetName = "Unknown Settlement";
            if (raid.targetSettlement) {
                const target = WorldMap.getSettlement(raid.targetSettlement);
                if (target) {
                    targetName = target.name;
                }
            }
            
            // Format status for display
            let statusText = raid.status.charAt(0).toUpperCase() + raid.status.slice(1);
            
            // Calculate remaining days based on status
            let remainingText = "";
            
            if (raid.status === "preparing") {
                remainingText = `Departing in ${raid.daysRemaining} days`;
            } else if (raid.status === "traveling") {
                remainingText = `Arriving in ${raid.daysRemaining} days`;
            } else if (raid.status === "raiding") {
                remainingText = `Raiding in progress`;
            } else if (raid.status === "returning") {
                remainingText = `Returning in ${raid.daysRemaining} days`;
            }
            
            html += `
                <div class="raid-card">
                    <div class="raid-header">
                        <div class="raid-title">${raid.name}</div>
                        <div class="raid-status status-${raid.status}">${statusText}</div>
                    </div>
                    <div class="raid-info">
                        <div><strong>Type:</strong> ${raidTypes[raid.raidType].name}</div>
                        <div><strong>Size:</strong> ${raid.size} warriors</div>
                        <div><strong>Target:</strong> ${targetName}</div>
                        <div><strong>Morale:</strong> ${raid.morale}%</div>
                        <div><strong>Supplies:</strong> ${Math.ceil(raid.supplies)}</div>
                        <div><strong>${remainingText}</strong></div>
                    </div>
                    <div class="raid-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="raid-actions">
                        <button class="raid-details-btn" data-raid-id="${raid.id}">Details</button>
                        ${raid.status === "completed" || raid.status === "failed" ? 
                            `<button class="raid-dismiss-btn" data-raid-id="${raid.id}">Dismiss</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        raidsList.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.raid-details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const raidId = this.dataset.raidId;
                showRaidDetails(raidId);
            });
        });
        
        document.querySelectorAll('.raid-dismiss-btn').forEach(button => {
            button.addEventListener('click', function() {
                const raidId = this.dataset.raidId;
                dismissRaid(raidId);
            });
        });
    }
    
    /**
     * Show detailed information about a raid
     * @param {string} raidId - ID of the raid
     */
    function showRaidDetails(raidId) {
        const raid = activeRaids.find(r => r.id === raidId);
        if (!raid) return;
        
        // Hide raid list and form, show details section
        document.querySelector('.active-raids-section').style.display = 'none';
        document.querySelector('.raid-form-section').style.display = 'none';
        document.getElementById('raid-details-section').style.display = 'block';
        
        // Get target settlement details
        let targetName = "Unknown Settlement";
        let targetType = "";
        let targetRegion = "";
        let targetDefense = 0;
        
        if (raid.targetSettlement) {
            const target = WorldMap.getSettlement(raid.targetSettlement);
            if (target) {
                targetName = target.name;
                targetType = target.type;
                targetDefense = target.military?.defenses || 0;
                const region = target.region ? WorldMap.getRegion(target.region) : null;
                if (region) {
                    targetRegion = region.name;
                }
            }
        }
        
        let statusClass = `status-${raid.status}`;
        let statusText = raid.status.charAt(0).toUpperCase() + raid.status.slice(1);
        
        // Build the HTML content with proper closures
        let html = `
            <div class="raid-details-content">
                <div class="raid-header">
                    <h2>${raid.name}</h2>
                    <div class="raid-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="raid-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${raid.size}</div>
                        <div class="metric-label">Warriors</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${raid.morale}%</div>
                        <div class="metric-label">Morale</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${raid.casualties}</div>
                        <div class="metric-label">Casualties</div>
                    </div>
                </div>
                
                <div class="raid-summary">
                    <h3>Raid Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item"><strong>Type:</strong> ${raidTypes[raid.raidType].name}</div>
                        <div class="summary-item"><strong>Target:</strong> ${targetName} (${targetType})</div>
                        <div class="summary-item"><strong>Region:</strong> ${targetRegion}</div>
                        <div class="summary-item"><strong>Defenses:</strong> ${targetDefense}</div>
                        <div class="summary-item"><strong>Started:</strong> Year ${raid.startDate?.year}, Day ${raid.startDate?.day}</div>
                        <div class="summary-item"><strong>Current Phase:</strong> ${statusText}</div>
                        <div class="summary-item"><strong>Supplies:</strong> ${Math.ceil(raid.supplies)}</div>
                        <div class="summary-item"><strong>Days Remaining:</strong> ${raid.daysRemaining}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Set the innerHTML
        document.getElementById('raid-details-content').innerHTML = html;
    }})