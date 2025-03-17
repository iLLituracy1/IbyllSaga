/**
 * Viking Legacy - Population and Dynasty Management Module
 * Handles population growth, worker assignments, aging, traits, and dynasty mechanics
 */

const PopulationManager = (function() {
    // Private variables
    
    // Population data
    let population = {
        total: 5,         // Total population count
        workers: 3,       // Available adult workers
        warriors: 1,      // Warriors (specialized workers)
        children: 1,      // Children who will grow into workers
        elders: 0         // Elders (non-working)
    };
    
    // Worker assignments
    let workerAssignments = {
        farmers: 1,
        woodcutters: 1,
        miners: 1,
        unassigned: 0
    };
    
    // Dynasty and characters
    let characters = [];
    let dynastyLeader = null;
    
    // Buildings that affect housing capacity
    let buildings = {
        houses: 1 // Start with one house
    };
    
    // Constants
    const MAX_AGE = 60;  // Maximum age in years
    const ADULT_AGE = 15; // Age to become adult worker
    const ELDER_AGE = 45; // Age to become elder
    const HOUSING_CAPACITY = 5; // People per house
    
    // Template for character creation
    const characterTemplate = {
        id: 0,
        name: "",
        gender: "male",
        age: 0,
        role: "child", // child, worker, warrior, elder
        traits: [],
        skills: {
            farming: 0,
            woodcutting: 0,
            mining: 0,
            combat: 0,
            crafting: 0,
            leadership: 0
        },
        relations: [], // IDs of related characters
        health: 100,
        happiness: 100,
        isLeader: false
    };
    
    // Possible traits
    const possibleTraits = {
        positive: ["Strong", "Quick", "Wise", "Charismatic", "Brave", "Cunning", "Patient", "Healthy"],
        negative: ["Weak", "Slow", "Foolish", "Craven", "Sickly", "Greedy", "Cruel", "Impatient"]
    };
    
    // Private methods
    
    /**
     * Update the population UI
     */
    function updatePopulationUI() {
        Utils.updateElement('population-total', population.total);
        Utils.updateElement('population-workers', population.workers);
        Utils.updateElement('population-warriors', population.warriors);
        Utils.updateElement('population-children', population.children);
        
        // Update worker assignments
        Utils.updateElement('farmers-count', workerAssignments.farmers);
        Utils.updateElement('woodcutters-count', workerAssignments.woodcutters);
        Utils.updateElement('miners-count', workerAssignments.miners);
        
        // Update dynasty info
        if (dynastyLeader) {
            Utils.updateElement('leader-name', dynastyLeader.name);
        }
    }
    
    /**
     * Calculate total assigned workers
     * @returns {number} - Total number of assigned workers
     */
    function getTotalAssignedWorkers() {
        return workerAssignments.farmers + 
               workerAssignments.woodcutters + 
               workerAssignments.miners;
    }
    
    /**
     * Create a new character
     * @param {Object} [options={}] - Options for character creation
     * @returns {Object} - The newly created character
     */
    function createCharacter(options = {}) {
        const gender = options.gender || (Math.random() > 0.5 ? 'male' : 'female');
        const age = options.age !== undefined ? options.age : 0;
        const role = options.role || (age < ADULT_AGE ? 'child' : (age >= ELDER_AGE ? 'elder' : 'worker'));
        
        const character = Object.assign({}, characterTemplate, {
            id: Date.now() + Math.floor(Math.random() * 1000), // Unique ID
            name: options.name || Utils.generateVikingName(gender),
            gender: gender,
            age: age,
            role: role,
            traits: []
        });
        
        // Add random traits
        const traitCount = Utils.randomBetween(1, 3);
        for (let i = 0; i < traitCount; i++) {
            const traitType = Math.random() > 0.7 ? 'negative' : 'positive';
            const availableTraits = possibleTraits[traitType].filter(
                trait => !character.traits.includes(trait)
            );
            
            if (availableTraits.length > 0) {
                const randomTrait = availableTraits[Utils.randomBetween(0, availableTraits.length - 1)];
                character.traits.push(randomTrait);
            }
        }
        
        // Random skills based on age and traits
        if (age >= ADULT_AGE) {
            for (const skill in character.skills) {
                // Base skill level
                let skillLevel = Utils.randomBetween(1, 5);
                
                // Adjust based on traits
                if (character.traits.includes("Strong") && (skill === "woodcutting" || skill === "mining" || skill === "combat")) {
                    skillLevel += 2;
                } else if (character.traits.includes("Wise") && (skill === "farming" || skill === "crafting" || skill === "leadership")) {
                    skillLevel += 2;
                } else if (character.traits.includes("Weak") && (skill === "woodcutting" || skill === "mining" || skill === "combat")) {
                    skillLevel -= 1;
                }
                
                // Ensure skill level is within bounds
                character.skills[skill] = Math.max(1, Math.min(10, skillLevel));
            }
        }
        
        characters.push(character);
        return character;
    }
    
    /**
     * Initialize dynasty with starting characters
     */
    function initializeDynasty() {
        // Create dynasty leader (25-35 years old)
        const leaderAge = Utils.randomBetween(25, 35);
        dynastyLeader = createCharacter({
            age: leaderAge,
            role: 'worker'
        });
        dynastyLeader.isLeader = true;
        dynastyLeader.skills.leadership += 3; // Bonus leadership for the starting leader
        
        // Create spouse (similar age to leader)
        const spouseGender = dynastyLeader.gender === 'male' ? 'female' : 'male';
        const spouseAge = leaderAge + Utils.randomBetween(-5, 5);
        const spouse = createCharacter({
            gender: spouseGender,
            age: spouseAge,
            role: 'worker'
        });
        
        // Create child
        const child = createCharacter({
            age: Utils.randomBetween(5, 14),
            role: 'child'
        });
        
        // Create a couple of followers (workers)
        for (let i = 0; i < 2; i++) {
            createCharacter({
                age: Utils.randomBetween(18, 40),
                role: 'worker'
            });
        }
        
        // Set up relations
        dynastyLeader.relations.push(spouse.id);
        spouse.relations.push(dynastyLeader.id);
        
        child.relations.push(dynastyLeader.id);
        child.relations.push(spouse.id);
        dynastyLeader.relations.push(child.id);
        spouse.relations.push(child.id);
    }
    
    // Public API
    return {
        /**
         * Initialize the population manager
         */
        init: function() {
            // Initialize dynasty with starting characters
            initializeDynasty();
            
            // Calculate initial worker assignments
            workerAssignments.unassigned = population.workers - getTotalAssignedWorkers();
            
            // Update UI
            updatePopulationUI();
            
            console.log("Population Manager initialized");
        },
        
        /**
         * Get current population data
         * @returns {Object} - Current population data
         */
        getPopulation: function() {
            return { ...population };
        },
        
        /**
         * Get current worker assignments
         * @returns {Object} - Current worker assignments
         */
        getWorkerAssignments: function() {
            return { ...workerAssignments };
        },
        
        /**
         * Get all characters
         * @returns {Array} - Array of character objects
         */
        getCharacters: function() {
            return [...characters];
        },
        
        /**
         * Get dynasty leader
         * @returns {Object} - Dynasty leader character
         */
        getDynastyLeader: function() {
            return dynastyLeader;
        },
        
        /**
         * Assign workers to different roles
         * @param {string} role - Role to assign workers to (farmers, woodcutters, miners)
         * @param {number} change - Number of workers to add or remove
         * @returns {boolean} - Whether the assignment was successful
         */
        assignWorkers: function(role, change) {
            // Check if role exists
            if (!workerAssignments.hasOwnProperty(role)) {
                console.warn(`Unknown worker role: ${role}`);
                return false;
            }
            
            // Calculate totals
            const currentAssigned = getTotalAssignedWorkers();
            const maxAssignable = population.workers;
            
            // Check if we're trying to add too many workers
            if (currentAssigned + change > maxAssignable) {
                console.warn("Not enough workers available.");
                return false;
            }
            
            // Check if we're trying to remove too many workers
            if (workerAssignments[role] + change < 0) {
                console.warn(`Cannot reduce ${role} below 0.`);
                return false;
            }
            
            // Update assignment
            workerAssignments[role] += change;
            workerAssignments.unassigned = maxAssignable - (currentAssigned + change);
            
            // Update resource production rates
            ResourceManager.updateProductionRates(workerAssignments);
            
            // Update UI
            updatePopulationUI();
            
            return true;
        },
        
        /**
         * Process population changes for a game tick
         * @param {Object} gameDate - Current game date
         * @param {number} tickSize - Size of the game tick in days
         * @param {Object} resources - Current resources status
         * @returns {Object} - Population changes for the tick
         */
        processTick: function(gameDate, tickSize, resources) {
            let changes = {
                births: 0,
                deaths: 0,
                childrenGrown: 0,
                newElders: 0
            };
            
            // Process aging and life events
            for (let i = characters.length - 1; i >= 0; i--) {
                const character = characters[i];
                
                // Age character (simplified - in a full game, you'd age based on days/seasons)
                if (gameDate.season === "Winter" && tickSize > 0) {
                    character.age += tickSize / 365; // Rough approximation
                    
                    // Check for role changes based on age
                    if (character.role === 'child' && character.age >= ADULT_AGE) {
                        character.role = 'worker';
                        population.children--;
                        population.workers++;
                        changes.childrenGrown++;
                        Utils.log(`${character.name} has become an adult and joined the workforce.`);
                    } else if (character.role === 'worker' && character.age >= ELDER_AGE) {
                        character.role = 'elder';
                        population.workers--;
                        population.elders++;
                        changes.newElders++;
                        Utils.log(`${character.name} has become an elder.`);
                    }
                    
                    // Check for natural death (simplified)
                    const deathChance = Math.pow(character.age / MAX_AGE, 2) * 5 * (tickSize / 365);
                    if (Utils.chanceOf(deathChance)) {
                        // Character dies
                        if (character.isLeader) {
                            this.handleLeaderDeath(character);
                        } else {
                            Utils.log(`${character.name} has passed away at the age of ${Math.floor(character.age)}.`, "important");
                        }
                        
                        // Update population counts
                        switch (character.role) {
                            case 'child':
                                population.children--;
                                break;
                            case 'worker':
                                population.workers--;
                                break;
                            case 'warrior':
                                population.warriors--;
                                break;
                            case 'elder':
                                population.elders--;
                                break;
                        }
                        
                        changes.deaths++;
                        population.total--;
                        
                        // Remove character
                        characters.splice(i, 1);
                    }
                }
            }
            
            // Check for births (simplified)
            if (population.total < this.getHousingCapacity()) {
                const adultWomen = characters.filter(char => 
                    char.gender === 'female' && char.age >= ADULT_AGE && char.age <= ELDER_AGE
                );
                
                for (const woman of adultWomen) {
                    // Only process potential births occasionally to avoid too many births
                    if (Utils.chanceOf(2 * (tickSize / 365))) {
                        // Find potential father (for inheritance, relations)
                        const potentialFathers = characters.filter(char => 
                            char.gender === 'male' && char.age >= ADULT_AGE && char.relations.includes(woman.id)
                        );
                        
                        let father = null;
                        if (potentialFathers.length > 0) {
                            father = potentialFathers[0];
                        }
                        
                        // Create child
                        const child = createCharacter({
                            age: 0,
                            role: 'child'
                        });
                        
                        // Setup relations
                        child.relations.push(woman.id);
                        woman.relations.push(child.id);
                        
                        if (father) {
                            child.relations.push(father.id);
                            father.relations.push(child.id);
                        }
                        
                        population.children++;
                        population.total++;
                        changes.births++;
                        
                        Utils.log(`A child named ${child.name} was born to ${woman.name}.`, "success");
                    }
                }
            }
            
            // Handle food shortage
            if (resources && resources.foodDeficit) {
                // If severe shortage, people might die
                if (resources.food <= 0 && Utils.chanceOf(5 * (tickSize / 30))) {
                    this.handleFoodShortage();
                    changes.deaths++;
                }
            }
            
            // Update UI
            updatePopulationUI();
            
            return changes;
        },
        
        /**
         * Handle the death of a leader
         * @param {Object} leader - The leader character who died
         */
        handleLeaderDeath: function(leader) {
            Utils.log(`${leader.name}, your leader, has died at the age of ${Math.floor(leader.age)}.`, "important");
            
            // Find potential heirs (adult relations)
            const potentialHeirs = characters.filter(char => 
                char.age >= ADULT_AGE && 
                (char.relations.includes(leader.id) || leader.relations.includes(char.id))
            );
            
            // If no heirs, find highest leadership skill
            let newLeader;
            if (potentialHeirs.length > 0) {
                // Sort by leadership skill
                potentialHeirs.sort((a, b) => b.skills.leadership - a.skills.leadership);
                newLeader = potentialHeirs[0];
            } else {
                // No heirs, find highest leadership skill among all adults
                const adultsRemaining = characters.filter(char => char.age >= ADULT_AGE);
                adultsRemaining.sort((a, b) => b.skills.leadership - a.skills.leadership);
                
                if (adultsRemaining.length > 0) {
                    newLeader = adultsRemaining[0];
                } else {
                    // Game over condition - no adults left
                    Utils.log("With no suitable successor, your settlement falls into disarray. Your saga ends here.", "danger");
                    // Here you would trigger game over mechanics
                    return;
                }
            }
            
            // Set new leader
            newLeader.isLeader = true;
            dynastyLeader = newLeader;
            
            Utils.log(`${newLeader.name} has become the new leader of your settlement.`, "important");
        },
        
        /**
         * Handle food shortage consequences
         */
        handleFoodShortage: function() {
            if (characters.length === 0) return;
            
            // Find vulnerable characters (children, elders, or weak)
            let vulnerableChars = characters.filter(char => 
                char.role === 'child' || 
                char.role === 'elder' || 
                char.traits.includes('Weak') || 
                char.traits.includes('Sickly')
            );
            
            // If no vulnerable characters, select any character
            if (vulnerableChars.length === 0) {
                vulnerableChars = [...characters];
            }
            
            // Select random victim
            const victimIndex = Utils.randomBetween(0, vulnerableChars.length - 1);
            const victim = vulnerableChars[victimIndex];
            
            // Remove from population
            const charIndex = characters.indexOf(victim);
            if (charIndex !== -1) {
                characters.splice(charIndex, 1);
                
                // Update population counts
                switch (victim.role) {
                    case 'child':
                        population.children--;
                        break;
                    case 'worker':
                        population.workers--;
                        break;
                    case 'warrior':
                        population.warriors--;
                        break;
                    case 'elder':
                        population.elders--;
                        break;
                }
                
                population.total--;
                
                Utils.log(`${victim.name} has died from starvation.`, "danger");
                
                // If leader died, handle succession
                if (victim.isLeader) {
                    this.handleLeaderDeath(victim);
                }
            }
        },
        
        /**
         * Get maximum housing capacity
         * @returns {number} - Total housing capacity
         */
        getHousingCapacity: function() {
            return buildings.houses * HOUSING_CAPACITY;
        },
        
        /**
         * Add a building (house only for now)
         * @param {string} buildingType - Type of building to add
         * @returns {boolean} - Whether building was successfully added
         */
        addBuilding: function(buildingType) {
            if (buildingType === 'house') {
                buildings.houses++;
                Utils.log("A new house has been built, increasing your settlement's capacity.");
                return true;
            }
            return false;
        },
        
        /**
         * Add a new character to the settlement (e.g., for immigration events)
         * @param {Object} options - Character options
         * @returns {Object|null} - The new character or null if at capacity
         */
        addCharacter: function(options = {}) {
            // Check housing capacity
            if (population.total >= this.getHousingCapacity()) {
                return null;
            }
            
            // Create character
            const character = createCharacter(options);
            
            // Update population
            switch (character.role) {
                case 'child':
                    population.children++;
                    break;
                case 'worker':
                    population.workers++;
                    break;
                case 'warrior':
                    population.warriors++;
                    break;
                case 'elder':
                    population.elders++;
                    break;
            }
            
            population.total++;
            
            // Update UI
            updatePopulationUI();
            
            return character;
        },
        
        /**
         * Get character by ID
         * @param {number} id - Character ID
         * @returns {Object|null} - Character object or null if not found
         */
        getCharacterById: function(id) {
            return characters.find(char => char.id === id) || null;
        }
    };
})();
