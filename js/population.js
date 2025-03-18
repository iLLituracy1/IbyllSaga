/**
 * Viking Legacy - Population and Dynasty Management Module
 * Handles population growth, worker assignments, aging, traits, and dynasty mechanics
 */

const PopulationManager = (function() {
    // Private variables
    
    // Population data
    let population = {
        total: 9,         // Total population count
        workers: 5,       // Available adult workers
        warriors: 0,      // Warriors (specialized workers)
        children: 3,      // Children who will grow into workers
        elders: 1         // Elders (non-working)
    };

    const populationExtension = {
        // New worker types
        hunters: 0,      // For leather and fur production
        crafters: 0,     // For cloth and crafted goods
        gatherers: 0,    // For herbs, clay gathering
        thralls: 0       // Forced laborers (captured in raids)
    };
    
    // Worker assignments (now used for manual assignment)
    let workerAssignments = {
        farmers: 0,
        woodcutters: 0,
        miners: 0,
        hunters: 0,
        crafters: 0,
        gatherers: 0,
        thralls: 0,
        unassigned: 5  // Start with all workers unassigned
    };
    
    // Dynasty and characters
    let characters = [];
    let dynastyLeader = null;
    
    // Buildings that affect housing capacity
    let buildings = {
        houses: 3 // Start with one house
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

    function initializeSpecializedWorkers() {
        // Add specialized worker properties to population
        if (typeof population !== 'undefined') {
            for (const prop in populationExtension) {
                population[prop] = populationExtension[prop];
            }
        }
        
        // Update workerAssignments to include specialized workers
        workerAssignments.hunters = 0;
        workerAssignments.crafters = 0;
        workerAssignments.gatherers = 0;
        workerAssignments.thralls = 0;
        
        // Make sure unassigned is set correctly
        workerAssignments.unassigned = population.workers;
    }

    /**
     * Create UI for specialized worker assignment
     * (Now handled in worker-utilization.js)
     */
    function createSpecializedWorkerUI() {
        // UI is now handled in the worker-utilization.js file
        console.log("Specialized worker UI is now handled in worker-utilization.js");
    }

    // Add thralls (typically from raiding)
    function addThralls(amount) {
        if (amount <= 0) return false;
        
        population.thralls += amount;
        population.total += amount;
        
        Utils.log(`${amount} thralls have been added to your settlement.`, "important");
        return true;
    }

    // Process thralls in population tick
    function processThrallsInTick(gameDate, tickSize, resources) {
        let thrallChanges = {
            escaped: 0,
            died: 0
        };
        
        // Small chance of thralls escaping
        if (population.thralls > 0 && Utils.chanceOf(2 * tickSize)) {
            const escaped = Math.ceil(population.thralls * 0.1); // 10% escape rate
            population.thralls -= escaped;
            population.total -= escaped;
            thrallChanges.escaped = escaped;
            
            Utils.log(`${escaped} thralls have escaped from your settlement!`, "important");
        }
        
        // Thralls have higher death rate with food shortage
        if (resources && resources.foodDeficit && population.thralls > 0) {
            if (Utils.chanceOf(8 * tickSize)) {
                const died = Math.ceil(population.thralls * 0.2); // 20% death rate during famine
                population.thralls -= died;
                population.total -= died;
                thrallChanges.died = died;
                
                Utils.log(`${died} thralls have died from starvation!`, "danger");
            }
        }
        
        // Update UI
        Utils.updateElement('thralls-count', population.thralls);
        Utils.updateElement('population-total', population.total);
        
        return thrallChanges;
    }
    
    // Private methods
    
    /**
     * Update the population UI
     */
    function updatePopulationUI() {
        Utils.updateElement('population-total', population.total);
        Utils.updateElement('population-workers', population.workers);
        Utils.updateElement('population-warriors', population.warriors);
        Utils.updateElement('population-children', population.children);
        
        // Update worker assignments display if elements exist
        for (const type in workerAssignments) {
            Utils.updateElement(`${type}-count`, workerAssignments[type]);
        }
        
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
        return population.workers - workerAssignments.unassigned;
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
    
    /**
     * Get worker assignments
     * @returns {Object} - Worker assignments by type
     */
    function getWorkerAssignments() {
        // Return the actual worker assignments
        return { ...workerAssignments };
    }
    
    /**
     * Calculate unassigned workers
     * @returns {number} - Number of unassigned workers
     */
    function getUnassignedWorkers() {
        return workerAssignments.unassigned;
    }
    
    /**
     * Validate worker assignments when workers are added/removed
     * @private
     */
    function validateWorkerAssignments() {
        // Calculate total assigned workers
        let totalAssigned = 0;
        for (const type in workerAssignments) {
            if (type !== 'unassigned') {
                totalAssigned += workerAssignments[type];
            }
        }
        
        // Ensure unassigned count is correct
        workerAssignments.unassigned = population.workers - totalAssigned;
        
        // Ensure unassigned isn't negative
        if (workerAssignments.unassigned < 0) {
            console.error("Negative unassigned workers detected, redistributing workers");
            
            // Adjust assignment to fix the error (remove workers proportionally)
            const excess = -workerAssignments.unassigned;
            let remaining = excess;
            
            // Calculate how many workers each type needs to contribute
            for (const type in workerAssignments) {
                if (type !== 'unassigned' && workerAssignments[type] > 0) {
                    const toRemove = Math.ceil((workerAssignments[type] / totalAssigned) * excess);
                    const actualRemove = Math.min(workerAssignments[type], Math.min(toRemove, remaining));
                    workerAssignments[type] -= actualRemove;
                    remaining -= actualRemove;
                    
                    if (remaining <= 0) break;
                }
            }
            
            // Recalculate unassigned
            totalAssigned = 0;
            for (const type in workerAssignments) {
                if (type !== 'unassigned') {
                    totalAssigned += workerAssignments[type];
                }
            }
            workerAssignments.unassigned = population.workers - totalAssigned;
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the population manager
         */
        init: function() {
            // Initialize dynasty with starting characters
            initializeDynasty();
            
            // Initialize worker assignments
            workerAssignments.unassigned = population.workers;
            workerAssignments.farmers = 0;
            workerAssignments.woodcutters = 0;
            workerAssignments.miners = 0;
            
            // Update UI
            updatePopulationUI();
            
            console.log("Population Manager initialized");

            this.reconcilePopulation();
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
        getWorkerAssignments: getWorkerAssignments,
        
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
         * Calculate unassigned workers
         * @returns {number} - Number of unassigned workers
         */
        getUnassignedWorkers: getUnassignedWorkers,
        
        /**
         * Manually assign workers to different jobs
         * @param {string} role - Role to assign workers to
         * @param {number} change - Number of workers to add or remove
         * @returns {boolean} - Whether assignment was successful
         */
        assignWorkers: function(role, change) {
            // Validate role
            if (!workerAssignments.hasOwnProperty(role) || role === 'unassigned') {
                console.warn(`Invalid role: ${role}`);
                return false;
            }
            
            // Check if we have enough unassigned workers for assignment
            if (change > 0 && workerAssignments.unassigned < change) {
                console.warn(`Not enough unassigned workers. Available: ${workerAssignments.unassigned}, Requested: ${change}`);
                return false;
            }
            
            // Check if we have enough assigned workers to remove
            if (change < 0 && workerAssignments[role] < Math.abs(change)) {
                console.warn(`Not enough ${role} to remove. Available: ${workerAssignments[role]}, Requested: ${Math.abs(change)}`);
                return false;
            }
            
            // Check building capacity if adding workers
            if (change > 0 && typeof BuildingSystem !== 'undefined' && BuildingSystem.getAvailableCapacity) {
                const capacity = BuildingSystem.getAvailableCapacity();
                
                if (capacity[role] !== undefined) {
                    // Check if there's enough capacity
                    const currentAssigned = workerAssignments[role];
                    if (currentAssigned + change > capacity[role]) {
                        console.warn(`Not enough ${role} capacity. Capacity: ${capacity[role]}, Current: ${currentAssigned}, Adding: ${change}`);
                        return false;
                    }
                }
            }
            
            // Update worker assignments
            workerAssignments[role] += change;
            workerAssignments.unassigned -= change;
            
            // Validate assignments to catch any errors
            validateWorkerAssignments();
            
            // Update UI elements
            Utils.updateElement(`${role}-count`, workerAssignments[role]);
            Utils.updateElement('unassigned-count', workerAssignments.unassigned);
            
            // Update resource production
            if (typeof ResourceManager !== 'undefined' && typeof ResourceManager.updateProductionRates === 'function') {
                ResourceManager.updateProductionRates(getWorkerAssignments());
            }
            
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
                        workerAssignments.unassigned++; // Add to unassigned workers
                        changes.childrenGrown++;
                        if (Math.random() < 0.3) { // Only show 30% of such messages
                            Utils.log(`${character.name} has become an adult and joined the workforce.`);
                        }
                    } else if (character.role === 'worker' && character.age >= ELDER_AGE) {
                        // Check what role they had before becoming an elder
                        for (const role in workerAssignments) {
                            if (role !== 'unassigned' && workerAssignments[role] > 0) {
                                // Remove them from that role (randomly chosen if multiple roles possible)
                                this.assignWorkers(role, -1);
                                break;
                            }
                        }
                        
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
                        
                        // Update population counts and remove from worker assignments if needed
                        switch (character.role) {
                            case 'child':
                                population.children--;
                                break;
                            case 'worker':
                                population.workers--;
                                // Just remove from unassigned for simplicity
                                workerAssignments.unassigned = Math.max(0, workerAssignments.unassigned - 1);
                                validateWorkerAssignments();
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
                    if (Utils.chanceOf(2 * (tickSize / 270))) {
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


        // Get thrall count
        getThralls: function() {
            return population.thralls || 0;
        },

        // Add thralls to the settlement
        addThralls: function(amount) {
            return addThralls(amount);
        },

        // Initialize specialized worker types
        initializeSpecializedWorkers: function() {
            initializeSpecializedWorkers();
        },

        // Reset all worker assignments
        resetWorkerAssignments: function() {
            // Move all assigned workers to unassigned
            let totalWorkers = population.workers;
            
            for (const role in workerAssignments) {
                if (role !== 'unassigned') {
                    workerAssignments[role] = 0;
                }
            }
            
            workerAssignments.unassigned = totalWorkers;
            
            // Update UI
            updatePopulationUI();
            
            // Update resource production
            if (typeof ResourceManager !== 'undefined' && typeof ResourceManager.updateProductionRates === 'function') {
                ResourceManager.updateProductionRates(getWorkerAssignments());
            }
            
            Utils.log("All workers have been unassigned.", "important");
        },

        // Initialize different worker type with a value
        initializeWorkerType: function(type, value) {
            if (!workerAssignments.hasOwnProperty(type)) {
                workerAssignments[type] = 0;
            }
            workerAssignments[type] = value;
            
            // Validate worker assignments
            validateWorkerAssignments();
            
            // Update UI if element exists
            Utils.updateElement(`${type}-count`, workerAssignments[type]);
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
                        // Adjust worker assignments
                        workerAssignments.unassigned = Math.max(0, workerAssignments.unassigned - 1);
                        validateWorkerAssignments();
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
            console.log("Adding character with options:", options);
            
            // Check housing capacity
            const housingCapacity = this.getHousingCapacity();
            if (population.total >= housingCapacity) {
                console.warn(`Cannot add character: At capacity (${population.total}/${housingCapacity})`);
                return null;
            }
            
            // Create character
            const character = createCharacter(options);
            console.log("Created character:", character);
            
            // Update population
            switch (character.role) {
                case 'child':
                    population.children++;
                    break;
                case 'worker':
                    population.workers++;
                    workerAssignments.unassigned++; // Add to unassigned workers
                    break;
                case 'warrior':
                    population.warriors++;
                    break;
                case 'elder':
                    population.elders++;
                    break;
                default:
                    console.warn(`Unknown role: ${character.role}, defaulting to worker`);
                    population.workers++;
                    character.role = 'worker';
                    workerAssignments.unassigned++;
                    break;
            }
            
            population.total++;
            
            // Log the operation
            console.log(`Character added: ${character.name} (${character.role})`);
            console.log("Updated population:", {...population});
            
            // Update UI
            updatePopulationUI();
            
            // Double-check that the character was actually added to the array
            if (!characters.includes(character)) {
                console.error("Character was not properly added to characters array!");
                characters.push(character);
            }
            
            return character;
        },
        
        /**
         * Get character by ID
         * @param {number} id - Character ID
         * @returns {Object|null} - Character object or null if not found
         */
        getCharacterById: function(id) {
            return characters.find(char => char.id === id) || null;
        },

        /**
         * Get possible traits
         * @returns {Object} - Object containing positive and negative traits
         */
        getPossibleTraits: function() {
            return { ...possibleTraits };
        },

        /**
         * Reconcile population counts with character objects
         */
        reconcilePopulation: function() {
            console.log("Reconciling population counts with character objects...");
            
            // Get current character counts by role
            const characterCounts = {
                child: 0,
                worker: 0,
                warrior: 0,
                elder: 0,
                total: characters.length
            };
            
            // Count characters by role
            characters.forEach(char => {
                if (char.role in characterCounts) {
                    characterCounts[char.role]++;
                }
            });
            
            console.log("Actual character counts:", characterCounts);
            console.log("Current population counts:", {...population});
            
            // If there's a mismatch, either create missing characters or adjust counts
            if (population.total !== characterCounts.total) {
                console.log("Population mismatch detected!");
                
                // Option 1: Adjust population counts to match actual characters
                if (characterCounts.total < 20) { // Only do this for reasonably small populations
                    // Create missing characters
                    const missingTotal = population.total - characterCounts.total;
                    console.log(`Creating ${missingTotal} missing characters...`);
                    
                    // Determine role distribution for missing characters
                    let missingWorkers = Math.max(0, population.workers - characterCounts.worker);
                    let missingWarriors = Math.max(0, population.warriors - characterCounts.warrior);
                    let missingChildren = Math.max(0, population.children - characterCounts.child);
                    let missingElders = Math.max(0, population.elders - characterCounts.elder);
                    
                    // Create missing workers
                    for (let i = 0; i < missingWorkers; i++) {
                        createCharacter({
                            age: Utils.randomBetween(18, 40),
                            role: 'worker'
                        });
                    }
                    
                    // Create missing warriors
                    for (let i = 0; i < missingWarriors; i++) {
                        createCharacter({
                            age: Utils.randomBetween(18, 40),
                            role: 'warrior'
                        });
                    }
                    
                    // Create missing children
                    for (let i = 0; i < missingChildren; i++) {
                        createCharacter({
                            age: Utils.randomBetween(5, 14),
                            role: 'child'
                        });
                    }
                    
                    // Create missing elders
                    for (let i = 0; i < missingElders; i++) {
                        createCharacter({
                            age: Utils.randomBetween(46, 60),
                            role: 'elder'
                        });
                    }
                    
                    console.log("Population reconciliation complete.");
                    console.log("New character count:", characters.length);
                } else {
                    // Option 2: For large populations, adjust the counters to match reality
                    console.log("Adjusting population counts to match character objects...");
                    population.workers = characterCounts.worker;
                    population.warriors = characterCounts.warrior;
                    population.children = characterCounts.child;
                    population.elders = characterCounts.elder;
                    population.total = characterCounts.total;
                    
                    // Update worker assignments
                    workerAssignments.unassigned = population.workers;
                    validateWorkerAssignments();
                }
            } else {
                console.log("Population counts match character objects. No action needed.");
            }
            
            // Update UI
            updatePopulationUI();
        },
    };
})();