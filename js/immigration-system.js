/**
 * Viking Legacy - Immigration System
 * Handles immigration events, population growth from outside sources, and related mechanics
 */

const ImmigrationSystem = (function() {
    // Private variables
    
    // Max population for immigration
    const MAX_IMMIGRATION_POPULATION = 2500;
    
    // Base chance of immigration per month (percentage)
    const BASE_MONTHLY_IMMIGRATION_CHANCE = 20;
    
    // Minimum days between immigration events
    const MIN_DAYS_BETWEEN_EVENTS = 30;
    
    // Maximum group size for early game
    const EARLY_GAME_MAX_GROUP_SIZE = 5;
    
    // Maximum group size for mid-to-late game
    const LATE_GAME_MAX_GROUP_SIZE = 12;
    
    // Population thresholds for immigration rate changes
    const POPULATION_THRESHOLDS = [
        { threshold: 50, multiplier: 1.0 },    // <50 people: full rate 
        { threshold: 200, multiplier: 0.8 },   // 50-200 people: 80% rate
        { threshold: 500, multiplier: 0.6 },   // 200-500 people: 60% rate
        { threshold: 1000, multiplier: 0.4 },  // 500-1000 people: 40% rate
        { threshold: 1500, multiplier: 0.3 },  // 1000-1500 people: 30% rate
        { threshold: 2000, multiplier: 0.2 },  // 1500-2000 people: 20% rate
        { threshold: 2500, multiplier: 0.1 }   // 2000-2500 people: 10% rate
        // Beyond 2500: no immigration
    ];
    
    // Impact of fame on immigration rates
    const FAME_IMPACT = {
        // Fame range -> additional multiplier to immigration chance
        0: 1.0,      // 0 fame: baseline
        100: 1.2,    // 1-100 fame: 20% increase
        500: 1.5,    // 101-500 fame: 50% increase
        1000: 1.8,   // 501-1000 fame: 80% increase
        5000: 2.0,   // 1001-5000 fame: 100% increase
        10000: 2.2,  // 5001-10000 fame: 120% increase
        Infinity: 2.5 // 10000+ fame: 150% increase
    };
    
    // Types of immigrant groups with their probabilities based on fame
    const IMMIGRANT_TYPES = [
        {
            id: "refugees",
            name: "Refugees",
            description: "Displaced people seeking a new home after their village was destroyed.",
            minFame: 0,  // Available from the start
            baseProbability: 40,
            skills: { // Skill levels are between 0-10
                farming: [1, 4],
                woodcutting: [1, 3],
                mining: [0, 2],
                combat: [0, 2],
                crafting: [1, 3]
            },
            traitProbabilities: {
                positive: 40, // 40% chance for positive traits
                negative: 40  // 40% chance for negative traits
            }
        },
        {
            id: "settlers",
            name: "Norse Settlers",
            description: "Fellow Norse people seeking to join your growing settlement.",
            minFame: 100,
            baseProbability: 30,
            skills: {
                farming: [2, 5],
                woodcutting: [2, 5],
                mining: [1, 4],
                combat: [1, 4],
                crafting: [2, 5]
            },
            traitProbabilities: {
                positive: 50,
                negative: 30
            }
        },
        {
            id: "workers",
            name: "Workers",
            description: "Laborers from the countryside, looking for work in a new home.",
            minFame: 250,
            baseProbability: 15,
            skills: {
                farming: [2, 4],
                woodcutting: [2, 4],
                mining: [2, 5],
                combat: [0, 2],
                crafting: [1, 3]
            },
            traitProbabilities: {
                positive: 20,
                negative: 60
            }
        },
        {
            id: "craftsmen",
            name: "Skilled Craftsmen",
            description: "Skilled workers attracted by stories of your prosperity.",
            minFame: 500,
            baseProbability: 20,
            skills: {
                farming: [1, 3],
                woodcutting: [1, 3],
                mining: [2, 4],
                combat: [0, 3],
                crafting: [5, 8]
            },
            guaranteedTraits: ["Patient", "Wise"],
            traitProbabilities: {
                positive: 70,
                negative: 20
            }
        },
        {
            id: "warriors",
            name: "Seasoned Warriors",
            description: "Warriors who have heard of your fame and seek glory in your service.",
            minFame: 1000,
            baseProbability: 15,
            skills: {
                farming: [0, 2],
                woodcutting: [1, 3],
                mining: [1, 3],
                combat: [5, 8],
                crafting: [1, 3]
            },
            guaranteedTraits: ["Strong", "Brave"],
            traitProbabilities: {
                positive: 60,
                negative: 30
            }
        }
    ];
    
    // Tracking
    let lastImmigrationEventDay = 0;
    let totalImmigrantsAccepted = 0;
    let immigrationEventHistory = [];
    
    // Private methods
    
    /**
     * Calculate the current chance of an immigration event
     * @param {Object} gameState - Current game state
     * @returns {number} - Percentage chance of immigration occurring
     */
    function calculateImmigrationChance(gameState) {
        const population = PopulationManager.getPopulation().total;
        
        // No immigration beyond the maximum population
        if (population >= MAX_IMMIGRATION_POPULATION) {
            return 0;
        }
        
        // Get population multiplier
        let populationMultiplier = 0;
        for (let i = POPULATION_THRESHOLDS.length - 1; i >= 0; i--) {
            if (population < POPULATION_THRESHOLDS[i].threshold) {
                populationMultiplier = POPULATION_THRESHOLDS[i].multiplier;
            }
        }
        
        // Get fame multiplier
        const fame = RankManager.getCurrentFame();
        let fameMultiplier = FAME_IMPACT[0]; // Default value
        
        for (const threshold in FAME_IMPACT) {
            if (fame <= parseInt(threshold)) {
                fameMultiplier = FAME_IMPACT[threshold];
                break;
            }
        }
        
        // Calculate base chance (monthly, adjusted to daily)
        const baseChance = BASE_MONTHLY_IMMIGRATION_CHANCE / 30; // convert to daily chance
        
        // Final immigration chance
        return baseChance * populationMultiplier * fameMultiplier;
    }
    
    /**
     * Generate a group of immigrants
     * @param {Object} gameState - Current game state
     * @returns {Object} - Immigrant group data
     */
    function generateImmigrantGroup(gameState) {
        const population = PopulationManager.getPopulation().total;
        const fame = RankManager.getCurrentFame();
        
        // Determine available immigrant types based on fame
        const availableTypes = IMMIGRANT_TYPES.filter(type => type.minFame <= fame);
        
        if (availableTypes.length === 0) {
            // Fallback to basic refugees if somehow no types are available
            availableTypes.push(IMMIGRANT_TYPES[0]);
        }
        
        // Calculate probabilities for each available type
        const totalProbability = availableTypes.reduce((sum, type) => sum + type.baseProbability, 0);
        let selectedType = null;
        let randomValue = Math.random() * totalProbability;
        
        for (const type of availableTypes) {
            if (randomValue <= type.baseProbability) {
                selectedType = type;
                break;
            }
            randomValue -= type.baseProbability;
        }
        
        // If we didn't select a type (shouldn't happen), use the first available
        if (!selectedType) {
            selectedType = availableTypes[0];
        }
        
        // Determine group size based on game progress
        const maxGroupSize = population < 100 ? 
            EARLY_GAME_MAX_GROUP_SIZE : 
            LATE_GAME_MAX_GROUP_SIZE;
            
        // Group size is influenced by settlement capacity and current population
        const housingCapacity = PopulationManager.getHousingCapacity();
        const availableHousing = Math.max(0, housingCapacity - population);
        
        // Random group size, but limited by available housing
        const minGroupSize = 1;
        const baseMaxSize = Math.min(
            maxGroupSize, 
            Math.ceil(availableHousing * 0.75) // Don't fill more than 75% of available housing at once
        );
        
        // Ensure at least 1 person
        const groupSize = baseMaxSize > 0 ? 
            Utils.randomBetween(minGroupSize, baseMaxSize) : 
            0;
            
        // If no housing or group size is 0, return null
        if (groupSize <= 0) {
            return null;
        }
        
        // Generate individual immigrants
        const immigrants = [];
        
        for (let i = 0; i < groupSize; i++) {
            // Generate age with bias toward working adults
            let age;
            const ageRoll = Math.random();
            
            if (ageRoll < 0.15) {
                // Child
                age = Utils.randomBetween(5, 14);
            } else if (ageRoll < 0.90) {
                // Working adult
                age = Utils.randomBetween(16, 40);
            } else {
                // Elder
                age = Utils.randomBetween(45, 60);
            }
            
            // Determine gender with slight bias based on immigrant type
            let gender;
            if (selectedType.id === "warriors") {
                // Warriors more likely to be male
                gender = Math.random() < 0.8 ? "male" : "female";
            } else if (selectedType.id === "craftsmen") {
                // Even split for craftsmen
                gender = Math.random() < 0.5 ? "male" : "female";
            } else {
                // Slight bias toward males for other groups in this time period
                gender = Math.random() < 0.6 ? "male" : "female";
            }
            
            // Generate traits
            const traits = [];
            
            // Add guaranteed traits if any
            if (selectedType.guaranteedTraits) {
                traits.push(...selectedType.guaranteedTraits);
            }
            
            // Add random traits based on probabilities
            const traitTypes = ["positive", "negative"];
            traitTypes.forEach(traitType => {
                if (Math.random() * 100 < selectedType.traitProbabilities[traitType]) {
                    // Get possible traits of this type
                    const possibleTraits = PopulationManager.getPossibleTraits()[traitType];
                    
                    // Filter out traits that are already assigned
                    const availableTraits = possibleTraits.filter(trait => !traits.includes(trait));
                    
                    if (availableTraits.length > 0) {
                        // Add a random trait from available ones
                        const randomTrait = availableTraits[Utils.randomBetween(0, availableTraits.length - 1)];
                        traits.push(randomTrait);
                    }
                }
            });
            
            // Generate skills based on immigrant type
            const skills = {};
            
            for (const skill in selectedType.skills) {
                const [min, max] = selectedType.skills[skill];
                skills[skill] = Utils.randomBetween(min, max);
                
                // Add small bonus for adults with certain traits
                if (age >= 16 && age < 45) {
                    if (skill === "farming" && traits.includes("Patient")) {
                        skills[skill] += 1;
                    } else if ((skill === "woodcutting" || skill === "mining") && traits.includes("Strong")) {
                        skills[skill] += 1;
                    } else if (skill === "crafting" && traits.includes("Wise")) {
                        skills[skill] += 1;
                    } else if (skill === "combat" && traits.includes("Brave")) {
                        skills[skill] += 1;
                    }
                }
                
                // Cap skills at 10
                skills[skill] = Math.min(skills[skill], 10);
            }
            
            // Create immigrant data
            const immigrant = {
                age: age,
                gender: gender,
                traits: traits,
                skills: skills
            };
            
            immigrants.push(immigrant);
        }
        
        // Return the complete immigrant group data
        return {
            type: selectedType,
            groupSize: groupSize,
            immigrants: immigrants,
            requiresPayment: selectedType.requiresPayment || false,
            cost: selectedType.requiresPayment ? 
                multiplyResourceCost(selectedType.costPerPerson, groupSize) : 
                null
        };
    }
    
    /**
     * Multiply a resource cost by a factor
     * @param {Object} costs - Base resource costs
     * @param {number} multiplier - Factor to multiply by
     * @returns {Object} - Multiplied costs
     */
    function multiplyResourceCost(costs, multiplier) {
        const result = {};
        
        for (const resource in costs) {
            result[resource] = costs[resource] * multiplier;
        }
        
        return result;
    }
    
    /**
     * Display an immigration event to the player
     * @param {Object} immigrantGroup - Generated immigrant group
     * @param {Object} gameState - Current game state
     */
    function showImmigrationEvent(immigrantGroup, gameState) {
        // Pause the game while showing the event
        if (GameEngine.isGameRunning()) {
            GameEngine.pauseGame();
        }
        
        // Create modal dialog for the event
        const eventModal = document.createElement('div');
        eventModal.className = 'event-modal immigration-event';
        
        // Generate immigrant descriptions
        const adultCount = immigrantGroup.immigrants.filter(i => i.age >= 16 && i.age < 45).length;
        const childCount = immigrantGroup.immigrants.filter(i => i.age < 16).length;
        const elderCount = immigrantGroup.immigrants.filter(i => i.age >= 45).length;
        
        // Identify notable skills in the group
        const groupSkills = analyzeGroupSkills(immigrantGroup.immigrants);
        let skillsDescription = "";
        
        if (groupSkills.length > 0) {
            skillsDescription = `<p>The group has notable skills in: ${groupSkills.join(', ')}.</p>`;
        }
        
        // Generate cost description if applicable
        let costDescription = "";
        if (immigrantGroup.requiresPayment && immigrantGroup.cost) {
            costDescription = `<div class="cost-notice">Cost to accept: `;
            
            for (const resource in immigrantGroup.cost) {
                costDescription += `${immigrantGroup.cost[resource]} ${resource}, `;
            }
            
            costDescription = costDescription.slice(0, -2); // Remove trailing comma and space
            costDescription += `</div>`;
        }
        
        // Generate immigrant type specific message
        let specialMessage = "";
        if (immigrantGroup.type.id === "refugees") {
            specialMessage = "<p>They look hungry and weary from their journey. Taking them in would be a kindness.</p>";
        } else if (immigrantGroup.type.id === "workers") {
            specialMessage = "<p>Some idle hands seeking any kind of work. Could be a useful addition to a growing settlement.</p>";
        } else if (immigrantGroup.type.id === "warriors") {
            specialMessage = "<p>These warriors have come to test their mettle and seek glory. They could be valuable defenders.</p>";
        } else if (immigrantGroup.type.id === "craftsmen") {
            specialMessage = "<p>Their skilled hands could produce valuable goods for your settlement.</p>";
        }
        
        // Build the modal content
        eventModal.innerHTML = `
            <div class="event-content">
                <h2>${immigrantGroup.type.name} Seek to Join Your Settlement</h2>
                <p>${immigrantGroup.type.description}</p>
                <p>A group of ${immigrantGroup.groupSize} people (${adultCount} adults, ${childCount} children, ${elderCount} elders) are asking to join your settlement.</p>
                ${specialMessage}
                ${skillsDescription}
                ${costDescription}
                <div class="housing-notice">
                    Available Housing: ${PopulationManager.getHousingCapacity() - PopulationManager.getPopulation().total} / ${PopulationManager.getHousingCapacity()}
                </div>
                <div class="event-options">
                    <button class="event-option" id="accept-all">Accept All (${immigrantGroup.groupSize})</button>
                    ${immigrantGroup.groupSize > 1 ? `<button class="event-option" id="accept-half">Accept Half (${Math.ceil(immigrantGroup.groupSize/2)})</button>` : ''}
                    <button class="event-option" id="reject-all">Reject All</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(eventModal);
        
        // Add event listeners to buttons
        document.getElementById('accept-all').addEventListener('click', function() {
            handleImmigrationDecision(immigrantGroup, 'all', gameState);
            document.body.removeChild(eventModal);
        });
        
        if (immigrantGroup.groupSize > 1) {
            document.getElementById('accept-half').addEventListener('click', function() {
                handleImmigrationDecision(immigrantGroup, 'half', gameState);
                document.body.removeChild(eventModal);
            });
        }
        
        document.getElementById('reject-all').addEventListener('click', function() {
            handleImmigrationDecision(immigrantGroup, 'none', gameState);
            document.body.removeChild(eventModal);
        });
    }
    
    /**
     * Analyze immigrant group to identify notable skills
     * @param {Array} immigrants - Array of immigrant data
     * @returns {Array} - Array of notable skill descriptions
     */
    function analyzeGroupSkills(immigrants) {
        // Calculate average skills across the group
        const skillTotals = {
            farming: 0,
            woodcutting: 0,
            mining: 0,
            combat: 0,
            crafting: 0
        };
        
        let adultCount = 0;
        
        // Sum up skills from adults only
        immigrants.forEach(immigrant => {
            if (immigrant.age >= 16 && immigrant.age < 45) {
                adultCount++;
                for (const skill in skillTotals) {
                    skillTotals[skill] += immigrant.skills[skill] || 0;
                }
            }
        });
        
        // If no adults, return empty array
        if (adultCount === 0) {
            return [];
        }
        
        // Calculate averages
        const skillAverages = {};
        for (const skill in skillTotals) {
            skillAverages[skill] = skillTotals[skill] / adultCount;
        }
        
        // Identify notable skills (above threshold)
        const notableSkills = [];
        
        if (skillAverages.farming >= 4) {
            notableSkills.push("Farming");
        }
        
        if (skillAverages.woodcutting >= 4) {
            notableSkills.push("Woodcutting");
        }
        
        if (skillAverages.mining >= 4) {
            notableSkills.push("Mining");
        }
        
        if (skillAverages.combat >= 4) {
            notableSkills.push("Combat");
        }
        
        if (skillAverages.crafting >= 4) {
            notableSkills.push("Crafting");
        }
        
        return notableSkills;
    }
    
    /**
     * Handle player's decision about immigrants
     * @param {Object} immigrantGroup - Immigrant group data
     * @param {string} decision - Player's decision ('all', 'half', 'none')
     * @param {Object} gameState - Current game state
     */
    function handleImmigrationDecision(immigrantGroup, decision, gameState) {
        let immigrantsToAccept = [];
        
        switch (decision) {
            case 'all':
                immigrantsToAccept = [...immigrantGroup.immigrants];
                break;
                
            case 'half':
                // Accept approximately half, prioritizing adults with good skills
                const sortedImmigrants = [...immigrantGroup.immigrants].sort((a, b) => {
                    // Prioritize adults
                    const aIsAdult = a.age >= 16 && a.age < 45;
                    const bIsAdult = b.age >= 16 && b.age < 45;
                    
                    if (aIsAdult && !bIsAdult) return -1;
                    if (!aIsAdult && bIsAdult) return 1;
                    
                    // If both are adults, compare skills
                    if (aIsAdult && bIsAdult) {
                        const aSkillSum = Object.values(a.skills).reduce((sum, val) => sum + val, 0);
                        const bSkillSum = Object.values(b.skills).reduce((sum, val) => sum + val, 0);
                        return bSkillSum - aSkillSum; // Higher skills first
                    }
                    
                    // Otherwise, prioritize children over elders
                    if (a.age < 16 && b.age >= 45) return -1;
                    if (a.age >= 45 && b.age < 16) return 1;
                    
                    return 0;
                });
                
                immigrantsToAccept = sortedImmigrants.slice(0, Math.ceil(immigrantGroup.groupSize / 2));
                break;
                
            case 'none':
                // No immigrants accepted
                Utils.log(`You turned away the ${immigrantGroup.type.name}.`, "important");
                
                // Resume game if it was running
                GameEngine.startGame();
                return;
        }
        
        // If we're accepting immigrants with a cost, check if we can afford it
        if (immigrantGroup.requiresPayment && immigrantsToAccept.length > 0) {
            // Calculate cost based on number accepted
            const adjustedCost = multiplyResourceCost(
                immigrantGroup.type.costPerPerson, 
                immigrantsToAccept.length
            );
            
            // Check if player can afford it
            if (!ResourceManager.subtractResources(adjustedCost)) {
                Utils.log(`You cannot afford to pay for the ${immigrantGroup.type.name}.`, "important");
                
                // Resume game if it was running
                GameEngine.startGame();
                return;
            }
        }
        
        // Add accepted immigrants to population
        let successfullyAdded = 0;
        
        for (const immigrant of immigrantsToAccept) {
            if (PopulationManager.addCharacter(immigrant)) {
                successfullyAdded++;
            } else {
                // Stop if we run out of housing
                break;
            }
        }
        
        // Update tracking
        totalImmigrantsAccepted += successfullyAdded;
        
        // Record event in history
        immigrationEventHistory.push({
            date: { ...gameState.date }, // Clone to avoid reference issues
            type: immigrantGroup.type.id,
            offered: immigrantGroup.groupSize,
            accepted: successfullyAdded,
            decision: decision
        });
        
        // Log results
        if (successfullyAdded > 0) {
            Utils.log(`${successfullyAdded} ${immigrantGroup.type.name} have joined your settlement.`, "success");
            
            // Add fame for accepting refugees (humanitarian action)
            if (immigrantGroup.type.id === "refugees" && successfullyAdded > 0) {
                RankManager.addFame(5, "Sheltering refugees");
            }
            
            // Force reconcile population counts with characters
            if (typeof PopulationManager.reconcilePopulation === 'function') {
                console.log("Reconciling population after immigration...");
                PopulationManager.reconcilePopulation();
            }
        } else {
            Utils.log(`None of the ${immigrantGroup.type.name} could join due to lack of housing.`, "important");
        }
        
        // Update UI
        if (typeof updatePopulationUI === 'function') {
            updatePopulationUI();
        }
        
        // Resume game if it was running
        GameEngine.startGame();
    }
    
    // Add CSS styles to document
    function addImmigrationStyles() {
        // Check if styles already exist
        if (document.getElementById('immigration-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'immigration-styles';
        styleEl.textContent = `
            .immigration-event .event-content {
                max-width: 600px;
            }
            
            .cost-notice {
                margin: 15px 0;
                padding: 10px;
                background-color: #fff3e0;
                border-left: 4px solid #ff9800;
                border-radius: 4px;
            }
            
            .housing-notice {
                margin: 15px 0;
                padding: 10px;
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                border-radius: 4px;
            }
            
            .immigration-event .event-option {
                min-width: 150px;
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    // Public API
    return {
        /**
         * Initialize the immigration system
         */
        init: function() {
            console.log("Initializing Immigration System...");
            
            // Add styles
            addImmigrationStyles();
            
            console.log("Immigration System initialized");
        },
        
        /**
         * Process immigration for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Only process on day boundaries
            if (tickSize < 1) return;
            
            // Check cooldown period
            const daysSinceLastEvent = gameState.date.day - lastImmigrationEventDay;
            if (daysSinceLastEvent < MIN_DAYS_BETWEEN_EVENTS) {
                return;
            }
            
            // Calculate chance of immigration
            const immigrationChance = calculateImmigrationChance(gameState);
            
            // Roll for immigration event
            if (Utils.chanceOf(immigrationChance * tickSize)) {
                // Generate immigrant group
                const immigrantGroup = generateImmigrantGroup(gameState);
                
                // If we have a valid group and available housing
                if (immigrantGroup && 
                    PopulationManager.getHousingCapacity() > PopulationManager.getPopulation().total) {
                    
                    // Show immigration event to player
                    showImmigrationEvent(immigrantGroup, gameState);
                    
                    // Update last event day
                    lastImmigrationEventDay = gameState.date.day;
                }
            }
        },
        
        /**
         * Get immigration statistics
         * @returns {Object} - Immigration statistics
         */
        getStatistics: function() {
            return {
                totalImmigrantsAccepted: totalImmigrantsAccepted,
                recentEvents: immigrationEventHistory.slice(-10), // Last 10 events
                lastEventDay: lastImmigrationEventDay
            };
        },
        
        /**
         * Get the calculated immigration chance for the current game state
         * @returns {number} - Current immigration chance (percentage)
         */
        getCurrentImmigrationChance: function() {
            return calculateImmigrationChance(GameEngine.getGameState());
        },
        
        /**
         * Force an immigration event (for testing or special game events)
         * @param {string} [groupType] - Optional specific group type ID to generate
         */
        forceImmigrationEvent: function(groupType) {
            const gameState = GameEngine.getGameState();
            
            // Generate immigrant group (either specific type or random)
            let immigrantGroup;
            
            if (groupType) {
                const specificType = IMMIGRANT_TYPES.find(type => type.id === groupType);
                if (specificType) {
                    // Create a modified state with this specific type
                    const clonedState = { ...gameState };
                    immigrantGroup = generateImmigrantGroup(clonedState);
                    immigrantGroup.type = specificType;
                } else {
                    // Fallback to random if type not found
                    immigrantGroup = generateImmigrantGroup(gameState);
                }
            } else {
                // Random group
                immigrantGroup = generateImmigrantGroup(gameState);
            }
            
            // Show event if valid
            if (immigrantGroup && 
                PopulationManager.getHousingCapacity() > PopulationManager.getPopulation().total) {
                
                showImmigrationEvent(immigrantGroup, gameState);
                lastImmigrationEventDay = gameState.date.day;
            } else {
                Utils.log("Cannot trigger immigration event - no housing available or population cap reached.", "important");
            }
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other systems to initialize first
    setTimeout(function() {
        ImmigrationSystem.init();
        
        // Register with GameEngine if it exists
        if (typeof GameEngine !== 'undefined' && 
            typeof GameEngine.registerTickProcessor === 'function') {
            
            console.log("Registering Immigration System with GameEngine");
            GameEngine.registerTickProcessor(ImmigrationSystem.processTick);
        } else {
            console.warn("GameEngine not available for registering Immigration System");
        }
    }, 1000);
});