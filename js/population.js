/**
 * Viking Legacy - Population and Dynasty Management Module
 * Handles population growth, worker assignments, aging, traits, and dynasty mechanics
 * 
 * REVISED VERSION - Fixed character creation and dynasty management
 */

const PopulationManager = (function() {
    // Private variables
    
    // Population data
    let population = {
        total: 9,         // Total population count
        workers: 5,       // Available adult workers
        warriors: 15,      // Warriors (specialized workers)
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
    
    // Dynasty and characters - ONLY for important characters (dynasty members, leaders, etc.)
    let characters = [];
    let dynastyLeader = null;
    
    // Buildings that affect housing capacity
    let buildings = {
        houses: 3 // Start with three houses
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
        isLeader: false,
        isDynastyMember: false // New flag to explicitly mark dynasty members
    };
    
    // Possible traits
    const possibleTraits = {
        positive: ["Strong", "Quick", "Wise", "Charismatic", "Brave", "Cunning", "Patient", "Healthy"],
        negative: ["Weak", "Slow", "Foolish", "Craven", "Sickly", "Greedy", "Cruel", "Impatient"]
    };

    // Skill affinities to create more variation in character skills
    const skillAffinities = {
        male: {
            farming: 0.8,
            woodcutting: 1.2,
            mining: 1.2,
            combat: 1.3,
            crafting: 0.9,
            leadership: 1.0
        },
        female: {
            farming: 1.2,
            woodcutting: 0.8,
            mining: 0.7,
            combat: 0.8,
            crafting: 1.3,
            leadership: 1.0
        }
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

        // Update warriors
        const warriorCount = typeof PopulationManager.getWarriors === 'function' ? 
            PopulationManager.getWarriors() : 0;
        Utils.updateElement('population-warriors', warriorCount);
        
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
     * Create a new character - ONLY used for important characters
     * @param {Object} [options={}] - Options for character creation
     * @returns {Object} - The newly created character
     */
    function createCharacter(options = {}) {
        const gender = options.gender || (Math.random() > 0.5 ? 'male' : 'female');
        const age = options.age !== undefined ? options.age : 0;
        const role = options.role || (age < ADULT_AGE ? 'child' : (age >= ELDER_AGE ? 'elder' : 'worker'));
        const isDynastyMember = options.isDynastyMember !== undefined ? options.isDynastyMember : false;
        
        // Generate a unique ID with better uniqueness (combining timestamp with random values)
        const uniqueId = Date.now() + Math.floor(Math.random() * 10000000);
        
        // Create the character with a unique ID and basic properties
        const character = {
            id: uniqueId,
            name: options.name || Utils.generateVikingName(gender),
            gender: gender,
            age: age,
            role: role,
            traits: [],
            skills: {
                farming: 0,
                woodcutting: 0,
                mining: 0,
                combat: 0,
                crafting: 0,
                leadership: 0
            },
            relations: [],
            health: 100,
            happiness: 100,
            isLeader: false,
            isDynastyMember: isDynastyMember
        };
        
        // Log character creation for debugging
        console.log(`Creating new character: ${character.name} (${gender}, ${role}, age ${age})`);

        // Add random traits - more traits for dynasty members
        const traitCount = isDynastyMember ? Utils.randomBetween(2, 4) : Utils.randomBetween(1, 3);
        
        // Make trait selection more random by shuffling
        const shuffledPositive = [...possibleTraits.positive].sort(() => Math.random() - 0.5);
        const shuffledNegative = [...possibleTraits.negative].sort(() => Math.random() - 0.5);
        
        // Add traits
        for (let i = 0; i < traitCount; i++) {
            // Dynasty members have better chances for positive traits
            const traitType = (Math.random() > (isDynastyMember ? 0.3 : 0.7)) ? 'negative' : 'positive';
            const availableTraits = traitType === 'positive' ? shuffledPositive : shuffledNegative;
            
            // Select from shuffled traits to ensure more randomization
            const traitIndex = i % availableTraits.length;
            const randomTrait = availableTraits[traitIndex];
            
            if (!character.traits.includes(randomTrait)) {
                character.traits.push(randomTrait);
            }
        }
        
        // Generate truly random skills based on various factors
        if (age >= ADULT_AGE) {
            const affinities = skillAffinities[gender];
            
            for (const skill in character.skills) {
                // Start with truly random base skill level
                // Use multiple random factors to ensure variation
                let seed = Math.random() * Math.random(); // Compound randomness
                let randomFactor = seed * 3.5 + 0.8; // Scale to roughly 0.8-4.3 range
                let skillLevel = Math.round(randomFactor);
                
                // Apply gender-based affinity
                skillLevel = Math.round(skillLevel * (affinities[skill] || 1.0));
                
                // Apply age bonuses (older = more skilled, up to a point)
                const ageBonus = Math.min(2, Math.floor((age - ADULT_AGE) / 10));
                skillLevel += ageBonus;
                
                // Apply trait-based modifications
                if (character.traits.includes("Strong") && (skill === "woodcutting" || skill === "mining" || skill === "combat")) {
                    skillLevel += 2;
                } else if (character.traits.includes("Wise") && (skill === "farming" || skill === "crafting" || skill === "leadership")) {
                    skillLevel += 2;
                } else if (character.traits.includes("Weak") && (skill === "woodcutting" || skill === "mining" || skill === "combat")) {
                    skillLevel -= 1;
                }
                
                // Dynasty members get slightly better skills
                if (isDynastyMember) {
                    skillLevel += 1;
                }
                
                // Ensure skill level is within bounds (1-10)
                character.skills[skill] = Math.max(1, Math.min(10, skillLevel));
            }
            
            // Log skill distribution for debugging
            console.log(`${character.name}'s skills:`, Object.entries(character.skills)
                .map(([skill, value]) => `${skill}: ${value}`)
                .join(', '));
        }
        
        // Add to characters array
        characters.push(character);
        
        return character;
    }
    
    /**
     * Initialize dynasty with starting characters
     * This creates the player's family and closest followers
     */
    function initializeDynasty() {
        console.log("Initializing player dynasty...");
        
        // Create dynasty leader (25-35 years old)
        const leaderAge = Utils.randomBetween(25, 35);
        dynastyLeader = createCharacter({
            age: leaderAge,
            role: 'worker',
            isDynastyMember: true // Mark as dynasty member
        });
        dynastyLeader.isLeader = true;
        dynastyLeader.skills.leadership += 3; // Bonus leadership for the starting leader
        
        // Create spouse (similar age to leader)
        const spouseGender = dynastyLeader.gender === 'male' ? 'female' : 'male';
        const spouseAge = leaderAge + Utils.randomBetween(-5, 5);
        const spouse = createCharacter({
            gender: spouseGender,
            age: spouseAge,
            role: 'worker',
            isDynastyMember: true // Mark as dynasty member
        });
        
        // Create child
        const child = createCharacter({
            age: Utils.randomBetween(5, 14),
            role: 'child',
            isDynastyMember: true // Mark as dynasty member
        });
        
        // Create a couple of followers (workers) - not dynasty members
        for (let i = 0; i < 2; i++) {
            createCharacter({
                age: Utils.randomBetween(18, 40),
                role: 'worker',
                isDynastyMember: false // Not dynasty members
            });
        }
        
        // Set up relations
        dynastyLeader.relations.push(spouse.id);
        spouse.relations.push(dynastyLeader.id);
        
        child.relations.push(dynastyLeader.id);
        child.relations.push(spouse.id);
        dynastyLeader.relations.push(child.id);
        spouse.relations.push(child.id);
        
        console.log(`Dynasty initialized with leader: ${dynastyLeader.name}, spouse: ${spouse.name}, and child: ${child.name}`);
        console.log(`Total characters created: ${characters.length}`);
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
    
    /**
     * Get all dynasty members
     * @returns {Array} - Array of dynasty members
     */
    function getDynastyMembers() {
        return characters.filter(char => char.isDynastyMember);
    }
    
    // Public API
    return {
        /**
         * Initialize the population manager
         */
        init: function() {
            console.log("Initializing Population Manager...");
            
            // Initialize dynasty with starting characters
            initializeDynasty();
            
            // Initialize worker assignments
            workerAssignments.unassigned = population.workers;
            workerAssignments.farmers = 0;
            workerAssignments.woodcutters = 0;
            workerAssignments.miners = 0;
            
            // Update UI
            updatePopulationUI();
            
            // Reconcile population to ensure everything matches
            this.reconcilePopulation();
            
            console.log("Population Manager initialized successfully");
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
         * Get all important characters
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
         * Get all dynasty members
         * @returns {Array} - Array of dynasty member characters
         */
        getDynastyMembers: function() {
            return getDynastyMembers();
        },
        
        /**
         * Get current warrior count
         * @returns {number} - Current warrior count
         */
        getWarriors: function() {
            // Safe check if BuildingSystem exists and has the getWarriorData function
            if (typeof BuildingSystem !== 'undefined' && 
                typeof BuildingSystem.getWarriorData === 'function') {
                return BuildingSystem.getWarriorData().total || 0;
            }
            return 0;
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
                newElders: 0,
                starvationDeaths: 0
            };
            
            // Process thralls if any (handled separately)
            if (population.thralls > 0) {
                const thrallChanges = processThrallsInTick(gameDate, tickSize, resources);
                // Apply thrall changes to overall changes
                changes.deaths += thrallChanges.died;
            }
            
            // Process aging and life events for important characters
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
                        if (character.isDynastyMember || Math.random() < 0.3) { // Always show for dynasty members
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
                        
                        if (character.isDynastyMember) {
                            Utils.log(`${character.name} has become an elder.`, "important");
                        } else {
                            Utils.log(`${character.name} has become an elder.`);
                        }
                    }
                    
                    // Check for natural death (simplified)
                    const deathChance = Math.pow(character.age / MAX_AGE, 2) * 5 * (tickSize / 365);
                    if (Utils.chanceOf(deathChance)) {
                        // Character dies
                        if (character.isLeader) {
                            this.handleLeaderDeath(character);
                        } else if (character.isDynastyMember) {
                            Utils.log(`${character.name}, a member of your dynasty, has passed away at the age of ${Math.floor(character.age)}.`, "important");
                        } else {
                            Utils.log(`${character.name} has passed away at the age of ${Math.floor(character.age)}.`);
                        }
                        
                        // Update population counts
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
            
            // Process general population changes (abstract, not tied to specific characters)
            // This handles anonymous population members
            
            // Population growth for general population
            if (population.total < this.getHousingCapacity()) {
                // Calculate chance for birth based on population
                const birthChance = 2 * (population.total / 10) * (tickSize / 270);
                
                // Check for new births
                if (Utils.chanceOf(birthChance)) {
                    // Note: We don't create a character for every birth now
                    // Only for dynasty members or important NPCs
                    population.children++;
                    population.total++;
                    changes.births++;
                    
                    // Dynasty births are handled separately for important characters
                    // Here we just update the abstract population counts
                    Utils.log("A child has been born in your settlement.", "success");
                }
            }
            
            // Handle dynasty births separately (only for tracked characters)
            this.processDynastyBirths(gameDate, tickSize, changes);
            
            // Handle food shortage - NEW IMPROVED SYSTEM
            if (resources && resources.foodDeficit) {
                const starvationSeverity = resources.starvationSeverity || 0;
                
                if (starvationSeverity > 0) {
                    // Calculate how many people should die this tick based on severity
                    let deathCount = 0;
                    
                    // Determine death count based on severity
                    if (starvationSeverity >= 9) {
                        // Catastrophic - up to 20% of population can die per tick
                        deathCount = Math.ceil(population.total * (0.1 + (Math.random() * 0.1)) * tickSize);
                        Utils.log("CATASTROPHIC FAMINE! Your people are dying en masse!", "danger");
                    } else if (starvationSeverity >= 6) {
                        // Severe - up to 10% of population can die per tick
                        deathCount = Math.ceil(population.total * (0.05 + (Math.random() * 0.05)) * tickSize);
                        Utils.log("SEVERE FAMINE! Multiple deaths from starvation!", "danger");
                    } else if (starvationSeverity >= 3) {
                        // Moderate - a few deaths per tick
                        deathCount = Math.ceil(Math.random() * 3 * tickSize);
                        Utils.log("Your people continue to starve. More deaths reported.", "danger");
                    } else {
                        // Mild - occasional deaths
                        if (Utils.chanceOf(30 * tickSize)) {
                            deathCount = 1;
                            Utils.log("A villager has died from starvation!", "danger");
                        }
                    }
                    
                    // Process deaths from starvation
                    for (let i = 0; i < deathCount; i++) {
                        this.handleStarvationDeath();
                        changes.starvationDeaths++;
                    }
                    
                    changes.deaths += changes.starvationDeaths;
                }
            } else if (window.starvationDays) {
                // Reset starvation counter if food deficit is resolved
                window.starvationDays = 0;
            }
            
            // Update UI
            updatePopulationUI();
            
            // Return changes for other systems to use
            return changes;
        },
        
        /**
         * Process births specifically for dynasty members
         * @param {Object} gameDate - Current game date
         * @param {number} tickSize - Size of the game tick in days
         * @param {Object} changes - Population changes object to update
         */
        processDynastyBirths: function(gameDate, tickSize, changes) {
            if (population.total >= this.getHousingCapacity()) return; // No space
            
            // Find potential mothers (adult dynasty women)
            const adultWomen = characters.filter(char => 
                char.isDynastyMember && 
                char.gender === 'female' && 
                char.age >= ADULT_AGE && 
                char.age <= ELDER_AGE
            );
            
            for (const woman of adultWomen) {
                // Only process potential births occasionally to avoid too many births
                // Lower chance for smaller tick sizes
                if (Utils.chanceOf(1 * (tickSize / 270))) {
                    // Find potential father (for inheritance, relations)
                    const potentialFathers = characters.filter(char => 
                        char.gender === 'male' && 
                        char.age >= ADULT_AGE && 
                        char.relations.includes(woman.id)
                    );
                    
                    let father = null;
                    if (potentialFathers.length > 0) {
                        father = potentialFathers[0];
                    }
                    
                    // Create child as a tracked character
                    const child = createCharacter({
                        age: 0,
                        role: 'child',
                        isDynastyMember: true // This is a dynasty child
                    });
                    
                    // Setup relations
                    child.relations.push(woman.id);
                    woman.relations.push(child.id);
                    
                    if (father) {
                        child.relations.push(father.id);
                        father.relations.push(child.id);
                    }
                    
                    // Update population counts
                    population.children++;
                    population.total++;
                    changes.births++;
                    
                    // Log the birth
                    Utils.log(`A child named ${child.name} was born to ${woman.name}${father ? ' and ' + father.name : ''} of your dynasty.`, "success");
                }
            }
        },
        
        /**
         * Handle a death from starvation
         * More systematic approach that prioritizes vulnerable characters
         */
        handleStarvationDeath: function() {
            // If we have tracked characters, check them first
            if (characters.length > 0) {
                // Weight characters by vulnerability to starvation
                const weightedCharacters = characters.map(char => {
                    let weight = 1.0; // Base weight
                    
                    // Dynasty members are slightly protected
                    if (char.isDynastyMember) weight *= 0.8;
                    
                    // Children and elders are more vulnerable
                    if (char.role === 'child') weight *= 2.0;
                    if (char.role === 'elder') weight *= 2.5;
                    
                    // Certain traits increase vulnerability
                    if (char.traits.includes('Weak')) weight *= 1.5;
                    if (char.traits.includes('Sickly')) weight *= 2.0;
                    
                    // Leaders and strong characters have better chances
                    if (char.isLeader) weight *= 0.5;
                    if (char.traits.includes('Strong')) weight *= 0.7;
                    if (char.traits.includes('Healthy')) weight *= 0.6;
                    
                    return { character: char, weight: weight };
                });
                
                // Sort by decreasing weight (most vulnerable first)
                weightedCharacters.sort((a, b) => b.weight - a.weight);
                
                // Add some randomness - use the first 25% of the list with some randomness
                const candidateCount = Math.max(1, Math.ceil(weightedCharacters.length * 0.25));
                const selectedIndex = Math.floor(Math.random() * candidateCount);
                const victim = weightedCharacters[selectedIndex].character;
                
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
                    
                    // Generate appropriate message
                    if (victim.isDynastyMember) {
                        Utils.log(`${victim.name}, a member of your dynasty, has died from starvation.`, "danger");
                    } else {
                        Utils.log(`${victim.name} has died from starvation.`, "danger");
                    }
                    
                    // If leader died, handle succession
                    if (victim.isLeader) {
                        this.handleLeaderDeath(victim);
                    }
                    
                    return; // We've handled a character death
                }
            }
            
            // If we get here, we're killing anonymous population members
            // Decide which demographic to remove from
            const dieRoll = Math.random();
            
            if (dieRoll < 0.4 && population.children > 0) {
                // Children are vulnerable (40% chance if available)
                population.children--;
                Utils.log("A child has died from starvation.", "danger");
            } else if (dieRoll < 0.7 && population.elders > 0) {
                // Elders are vulnerable too (30% chance if available)
                population.elders--;
                Utils.log("An elder has died from starvation.", "danger");
            } else if (population.workers > 0) {
                // Workers die last (30% chance or fallback)
                population.workers--;
                
                // Reduce unassigned workers or reassign if needed
                if (workerAssignments.unassigned > 0) {
                    workerAssignments.unassigned--;
                } else {
                    // We need to remove an assigned worker
                    // Find a role with workers assigned
                    let removed = false;
                    for (const role in workerAssignments) {
                        if (role !== 'unassigned' && workerAssignments[role] > 0) {
                            workerAssignments[role]--;
                            removed = true;
                            break;
                        }
                    }
                    
                    if (!removed) {
                        console.error("Worker died but couldn't remove from assignments");
                    }
                }
                
                Utils.log("A worker has died from starvation.", "danger");
            } else {
                // Fallback - shouldn't happen if we have population > 0
                population.total--;
                Utils.log("Someone has died from starvation.", "danger");
            }
            
            // Update total
            population.total--;
        },
        
        /**
         * Handle the death of a leader
         * @param {Object} leader - The leader character who died
         */
        handleLeaderDeath: function(leader) {
            Utils.log(`${leader.name}, your leader, has died at the age of ${Math.floor(leader.age)}.`, "important");
            
            // Find potential heirs (adult relations)
            const potentialHeirs = characters.filter(char => 
                char.isDynastyMember && 
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
                    // Make them dynasty members if they weren't already
                    newLeader.isDynastyMember = true;
                } else {
                    // Game over condition - no adults left
                    Utils.log("With no suitable successor, your settlement falls into disarray. Your saga ends here.", "danger");
                    // Here you would trigger game over mechanics
                    if (typeof GameOver !== 'undefined' && typeof GameOver.endGame === 'function') {
                        GameOver.endGame('succession_failure', 'Your dynasty has come to an end with no suitable heir.');
                    }
                    return;
                }
            }
            
            // Set new leader
            newLeader.isLeader = true;
            dynastyLeader = newLeader;
            
            Utils.log(`${newLeader.name} has become the new leader of your settlement.`, "important");
            
            // Update UI with new leader
            Utils.updateElement('leader-name', dynastyLeader.name);
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
         * Add a new character to the settlement
         * Use this only for important characters (leaders, special NPCs, etc.)
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
            
            // Default to non-dynasty member unless specified
            if (options.isDynastyMember === undefined) {
                options.isDynastyMember = false;
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
            console.log(`Character added: ${character.name} (${character.role}, Dynasty: ${character.isDynastyMember})`);
            console.log("Updated population:", {...population});
            
            // Update UI
            updatePopulationUI();
            
            return character;
        },
        
        /**
         * Add multiple anonymous population members
         * Does not create character objects for them
         * @param {string} role - Role ('child', 'worker', 'elder')
         * @param {number} amount - Number to add
         * @returns {boolean} - Success flag
         */
        addAnonymousPopulation: function(role, amount) {
            if (amount <= 0) return false;
            
            // Check housing capacity
            const housingCapacity = this.getHousingCapacity();
            if (population.total + amount > housingCapacity) {
                console.warn(`Cannot add population: At capacity (${population.total}/${housingCapacity})`);
                return false;
            }
            
            // Update population based on role
            switch (role) {
                case 'child':
                    population.children += amount;
                    break;
                case 'worker':
                    population.workers += amount;
                    workerAssignments.unassigned += amount; // Add to unassigned workers
                    break;
                case 'elder':
                    population.elders += amount;
                    break;
                case 'thrall':
                    population.thralls += amount;
                    break;
                default:
                    console.warn(`Unknown role: ${role}, defaulting to worker`);
                    population.workers += amount;
                    workerAssignments.unassigned += amount;
                    break;
            }
            
            population.total += amount;
            
            // Log the operation
            console.log(`Added ${amount} anonymous population members as ${role}`);
            console.log("Updated population:", {...population});
            
            // Update UI
            updatePopulationUI();
            
            return true;
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
         * Debug function to fix any inconsistencies
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
            
            console.log("Character counts:", characterCounts);
            console.log("Population counts:", {...population});
            
            // Check dynasty members
            const dynastyMembers = getDynastyMembers();
            console.log(`Dynasty members: ${dynastyMembers.length}`);
            
            // Verify dynasty leader
            if (!dynastyLeader) {
                console.error("No dynasty leader found! This needs to be fixed.");
                // Try to find a suitable leader among characters
                const adultDynastyMembers = dynastyMembers.filter(char => char.age >= ADULT_AGE);
                
                if (adultDynastyMembers.length > 0) {
                    // Sort by leadership skill
                    adultDynastyMembers.sort((a, b) => b.skills.leadership - a.skills.leadership);
                    dynastyLeader = adultDynastyMembers[0];
                    dynastyLeader.isLeader = true;
                    console.log(`Fixed: Set ${dynastyLeader.name} as dynasty leader`);
                } else {
                    // Create a new leader
                    dynastyLeader = createCharacter({
                        age: Utils.randomBetween(25, 35),
                        role: 'worker',
                        isDynastyMember: true
                    });
                    dynastyLeader.isLeader = true;
                    dynastyLeader.skills.leadership += 3;
                    population.workers++;
                    population.total++;
                    console.log(`Created new dynasty leader: ${dynastyLeader.name}`);
                }
                
                // Update UI
                Utils.updateElement('leader-name', dynastyLeader.name);
            }
            
            // No need to create characters for every population member
            // That was the old approach we're moving away from
            
            // Update UI
            updatePopulationUI();
            
            console.log("Population reconciliation complete");
        },
        
        /**
         * Get skill affinities
         * Useful for external systems to know skill tendencies
         * @returns {Object} - Skill affinities by gender
         */
        getSkillAffinities: function() {
            return { ...skillAffinities };
        },
        
        /**
         * Create a new character with specific traits
         * For use by other systems like events
         * @param {Object} options - Options for character creation
         * @returns {Object} - The newly created character
         */
        createSpecificCharacter: function(options) {
            // Add to population but create a specific character
            return createCharacter(options);
        }
    };
})();
