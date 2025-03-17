/**
 * Viking Legacy - Events and Narrative System
 * Handles random events, scheduled events, and narrative feedback
 */

const EventManager = (function() {
    // Private variables
    let activeEvents = [];
    let eventHistory = [];
    let eventPool = [];
    let seasonalEvents = {
        Spring: [],
        Summer: [],
        Fall: [],
        Winter: []
    };
    
    // Track events that have been triggered this year/season
    let triggeredEvents = {
        seasonal: {}, // Keyed by season and year: "Spring_1", "Summer_1", etc.
        random: {},   // Keyed by event ID with timestamp
    };
    
    // Track if the game was running before an event was displayed
    let gameWasRunningBeforeEvent = false;
    
    // Event template
    const eventTemplate = {
        id: "",
        title: "",
        description: "",
        options: [],
        conditions: null,
        effects: null,
        isPersistent: false,
        duration: 0,  // In days
        timeRemaining: 0,
        season: null,  // Specific season or null for any season
        cooldown: 30,  // Default cooldown in days between occurrences of the same event
        weight: 1,     // Default weight for random selection
        uniquePerSeason: false, // If true, can only trigger once per season
        uniquePerYear: false,   // If true, can only trigger once per year
    };
    
    // Private methods
    
    /**
     * Check if event conditions are met
     * @param {Object} event - Event object
     * @param {Object} gameState - Current game state
     * @returns {boolean} - Whether conditions are met
     */
    function checkEventConditions(event, gameState) {
        // Check if event is on cooldown
        if (isEventOnCooldown(event.id, gameState.date)) {
            return false;
        }
        
        // Check if unique-per-season event has already triggered this season
        if (event.uniquePerSeason && 
            hasEventTriggeredThisSeason(event.id, gameState.date)) {
            return false;
        }
        
        // Check if unique-per-year event has already triggered this year
        if (event.uniquePerYear && 
            hasEventTriggeredThisYear(event.id, gameState.date)) {
            return false;
        }
        
        // Season-specific check
        if (event.season && event.season !== gameState.date.season) {
            return false;
        }
        
        // Custom conditions if defined
        if (!event.conditions) return true;
        return event.conditions(gameState);
    }
    
    /**
     * Check if an event is on cooldown
     * @param {string} eventId - Event ID
     * @param {Object} currentDate - Current game date
     * @returns {boolean} - Whether the event is on cooldown
     */
    function isEventOnCooldown(eventId, currentDate) {
        const lastTriggered = triggeredEvents.random[eventId];
        if (!lastTriggered) return false;
        
        // Find the event object to get its cooldown
        const event = findEventById(eventId);
        if (!event) return false;
        
        // Calculate days since last trigger
        const daysSinceLastTrigger = currentDate.day - lastTriggered.day;
        const yearDifference = currentDate.year - lastTriggered.year;
        const totalDaysSince = daysSinceLastTrigger + (yearDifference * 360); // Simplified year calculation
        
        return totalDaysSince < event.cooldown;
    }
    
    /**
     * Find an event by ID across all event pools
     * @param {string} eventId - Event ID to find
     * @returns {Object|null} - The event object or null if not found
     */
    function findEventById(eventId) {
        // Check main event pool
        let event = eventPool.find(e => e.id === eventId);
        if (event) return event;
        
        // Check seasonal events
        for (const season in seasonalEvents) {
            event = seasonalEvents[season].find(e => e.id === eventId);
            if (event) return event;
        }
        
        return null;
    }
    
    /**
     * Check if an event has triggered this season
     * @param {string} eventId - Event ID
     * @param {Object} currentDate - Current game date
     * @returns {boolean} - Whether the event has triggered this season
     */
    function hasEventTriggeredThisSeason(eventId, currentDate) {
        const seasonKey = `${currentDate.season}_${currentDate.year}`;
        return triggeredEvents.seasonal[seasonKey] && 
               triggeredEvents.seasonal[seasonKey].includes(eventId);
    }
    
    /**
     * Check if an event has triggered this year
     * @param {string} eventId - Event ID
     * @param {Object} currentDate - Current game date
     * @returns {boolean} - Whether the event has triggered this year
     */
    function hasEventTriggeredThisYear(eventId, currentDate) {
        // Check all seasons in the current year
        for (const season of ["Spring", "Summer", "Fall", "Winter"]) {
            const seasonKey = `${season}_${currentDate.year}`;
            if (triggeredEvents.seasonal[seasonKey] && 
                triggeredEvents.seasonal[seasonKey].includes(eventId)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Record that an event has triggered
     * @param {Object} event - The event object
     * @param {Object} currentDate - Current game date
     */
    function recordEventTrigger(event, currentDate) {
        // Record in random event tracking
        triggeredEvents.random[event.id] = { 
            day: currentDate.day,
            year: currentDate.year,
            timestamp: Date.now()
        };
        
        // For seasonal tracking
        const seasonKey = `${currentDate.season}_${currentDate.year}`;
        if (!triggeredEvents.seasonal[seasonKey]) {
            triggeredEvents.seasonal[seasonKey] = [];
        }
        
        // Add to seasonal triggers if not already there
        if (!triggeredEvents.seasonal[seasonKey].includes(event.id)) {
            triggeredEvents.seasonal[seasonKey].push(event.id);
        }
    }
    
    /**
     * Apply event effects
     * @param {Object} event - Event object
     * @param {number} optionIndex - Selected option index
     * @param {Object} gameState - Current game state
     */
    function applyEventEffects(event, optionIndex, gameState) {
        if (!event.effects) return;
        
        // If option-specific effects exist, use those
        if (event.options && 
            event.options[optionIndex] && 
            event.options[optionIndex].effects) {
            event.options[optionIndex].effects(gameState);
        } else {
            // Otherwise use general effects
            event.effects(gameState);
        }
        
        // Add to history
        eventHistory.push({
            id: event.id,
            title: event.title,
            timestamp: { ...gameState.date }, // Clone to avoid reference issues
            option: optionIndex !== undefined ? event.options[optionIndex].text : null
        });
    }
    
    /**
     * Select a random event from eligible events, weighted by their weight property
     * @param {Array} eligibleEvents - Array of eligible events
     * @returns {Object} - Selected event
     */
    function selectWeightedRandomEvent(eligibleEvents) {
        // If only one event, return it
        if (eligibleEvents.length === 1) {
            return eligibleEvents[0];
        }
        
        // Calculate total weight
        const totalWeight = eligibleEvents.reduce((sum, event) => sum + (event.weight || 1), 0);
        
        // Random value between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Find the event that corresponds to this random value
        for (const event of eligibleEvents) {
            const weight = event.weight || 1; // Default weight of 1
            if (random < weight) {
                return event;
            }
            random -= weight;
        }
        
        // Fallback - return the last event
        return eligibleEvents[eligibleEvents.length - 1];
    }
    
    /**
     * Create a basic event object
     * @param {Object} eventData - Event data to merge with template
     * @returns {Object} - Complete event object
     */
    function createEvent(eventData) {
        // Set default importance if not provided
        if (!eventData.importance) {
            eventData.importance = 'minor';
        }
        
        return Object.assign({}, eventTemplate, eventData, {
            id: eventData.id || `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        });
    }
    
    /**
     * Reset seasonal triggers when a new season begins
     * @param {string} currentSeason - Current season
     * @param {number} currentYear - Current year
     */
    function resetSeasonalTriggers(currentSeason, currentYear) {
        // We don't reset previous seasons to maintain uniquePerYear functionality
        // But we can do cleanup of old years data here
        
        // Remove any seasonal data older than current year
        for (const key in triggeredEvents.seasonal) {
            const [season, year] = key.split('_');
            if (parseInt(year) < currentYear - 1) {
                delete triggeredEvents.seasonal[key];
            }
        }
        
        // Optional: clear very old random event data
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        for (const eventId in triggeredEvents.random) {
            if (triggeredEvents.random[eventId].timestamp < oneYearAgo) {
                delete triggeredEvents.random[eventId];
            }
        }
    }
    
    // Initialize basic events
    function initializeEvents() {
        // General random events
        eventPool.push(
            createEvent({
                id: "wanderer",
                title: "Wandering Traveler",
                description: "A lone traveler has arrived at your settlement seeking shelter. They seem to have skills that could be useful.",
                options: [
                    {
                        text: "Welcome them",
                        effects: function(gameState) {
                            const newCharacter = PopulationManager.addCharacter({
                                age: Utils.randomBetween(16, 40),
                                role: 'worker'
                            });
                            
                            if (newCharacter) {
                                Utils.log(`${newCharacter.name} has joined your settlement.`, "success");
                            } else {
                                Utils.log("The traveler moved on after seeing you don't have enough housing.", "important");
                            }
                        }
                    },
                    {
                        text: "Turn them away",
                        effects: function(gameState) {
                            Utils.log("The traveler continues on their journey.");
                        }
                    }
                ],
                conditions: function(gameState) {
                    // Only trigger if we have room
                    const pop = PopulationManager.getPopulation();
                    const capacity = PopulationManager.getHousingCapacity();
                    return pop.total < capacity && Utils.chanceOf(3);
                },
                cooldown: 45, // Won't appear again for 45 days
                weight: 2    // Higher chance of appearing compared to others
            })
        );
        
        eventPool.push(
            createEvent({
                id: "wild_hunt",
                title: "Bountiful Hunt",
                description: "Your hunters have found abundant game in the nearby forest.",
                options: [
                    {
                        text: "Gather a hunting party",
                        effects: function(gameState) {
                            const foodGain = Utils.randomBetween(10, 25);
                            ResourceManager.addResources({ food: foodGain });
                            Utils.log(`Your hunting party returns with ${foodGain} units of food.`, "success");
                        }
                    }
                ],
                conditions: function(gameState) {
                    // More likely in summer and fall
                    const season = gameState.date.season;
                    const chance = (season === "Summer" || season === "Fall") ? 8 : 3;
                    return Utils.chanceOf(chance);
                },
                cooldown: 20,
                weight: 1.5
            })
        );
        
        eventPool.push(
            createEvent({
                id: "minor_illness",
                title: "Illness Spreads",
                description: "A minor illness has begun to spread through your settlement, reducing worker efficiency.",
                options: [
                    {
                        text: "Provide extra rations to the sick",
                        effects: function(gameState) {
                            ResourceManager.subtractResources({ food: 5 });
                            Utils.log("The extra food helps people recover more quickly.", "success");
                        }
                    },
                    {
                        text: "Let it run its course",
                        effects: function(gameState) {
                            // Reduce production for a while
                            ResourceManager.applyProductionModifier("food", 0.8);
                            ResourceManager.applyProductionModifier("wood", 0.8);
                            ResourceManager.applyProductionModifier("stone", 0.8);
                            
                            // Add persistent effect
                            activeEvents.push(
                                createEvent({
                                    id: "ongoing_illness",
                                    title: "Ongoing Illness",
                                    description: "Your people are still recovering from illness.",
                                    isPersistent: true,
                                    duration: 7, // 7 days
                                    timeRemaining: 7,
                                    effects: function(gameState) {
                                        // Reset modifiers when complete
                                        ResourceManager.resetProductionModifiers();
                                        Utils.log("Your people have recovered from the illness.", "success");
                                    }
                                })
                            );
                            
                            Utils.log("The illness spreads, reducing productivity for the next week.", "important");
                        }
                    }
                ],
                conditions: function(gameState) {
                    return gameState.date.season === "Winter" && Utils.chanceOf(5);
                },
                cooldown: 60, // Illness is rare, long cooldown
                weight: 1
            })
        );
        
        // Seasonal events
        
        // Spring events
        seasonalEvents.Spring.push(
            createEvent({
                id: "spring_planting",
                title: "Spring Planting",
                description: "The ground has thawed and it's time for spring planting. With careful planning, you might increase your food production.",
                options: [
                    {
                        text: "Focus on traditional crops",
                        effects: function(gameState) {
                            ResourceManager.applyProductionModifier("food", 1.2);
                            Utils.log("Your farmers work diligently to plant this year's crops.", "success");
                        }
                    },
                    {
                        text: "Try new farming techniques",
                        effects: function(gameState) {
                            // Higher risk, higher reward
                            if (Utils.chanceOf(70)) {
                                ResourceManager.applyProductionModifier("food", 1.4);
                                Utils.log("The new techniques prove successful, significantly boosting food production!", "success");
                            } else {
                                ResourceManager.applyProductionModifier("food", 0.9);
                                Utils.log("The new techniques don't work as well as hoped, slightly reducing your yields.", "important");
                            }
                        }
                    }
                ],
                season: "Spring",
                conditions: function(gameState) {
                    return gameState.date.day < 10 && PopulationManager.getWorkerAssignments().farmers > 0;
                },
                uniquePerSeason: true, // Only happens once per spring
                weight: 5 // High weight to appear early in spring
            })
        );
        
        // Summer events
        seasonalEvents.Summer.push(
            createEvent({
                id: "summer_drought",
                title: "Summer Drought",
                description: "A dry spell has come upon the land. Your crops are starting to wither in the heat.",
                options: [
                    {
                        text: "Ration water carefully",
                        effects: function(gameState) {
                            ResourceManager.applyProductionModifier("food", 0.8);
                            Utils.log("You make do with the limited water, but crop yields suffer.", "important");
                        }
                    },
                    {
                        text: "Dig a new well (Costs 15 wood, 10 stone)",
                        effects: function(gameState) {
                            if (ResourceManager.subtractResources({ wood: 15, stone: 10 })) {
                                ResourceManager.applyProductionModifier("food", 0.9);
                                Utils.log("The new well provides some relief, minimizing crop damage.", "success");
                            } else {
                                // Not enough resources
                                ResourceManager.applyProductionModifier("food", 0.7);
                                Utils.log("Without resources for a new well, your crops suffer severely.", "danger");
                            }
                        }
                    }
                ],
                season: "Summer",
                conditions: function(gameState) {
                    return Utils.chanceOf(20);
                },
                uniquePerSeason: true,
                weight: 3
            })
        );
        
        // Fall events
        seasonalEvents.Fall.push(
            createEvent({
                id: "fall_harvest",
                title: "Fall Harvest",
                description: "The time has come to harvest the crops before winter sets in.",
                options: [
                    {
                        text: "Work long hours to harvest everything",
                        effects: function(gameState) {
                            const foodBonus = PopulationManager.getWorkerAssignments().farmers * 10;
                            ResourceManager.addResources({ food: foodBonus });
                            Utils.log(`Your farmers work tirelessly, securing ${foodBonus} extra food for winter.`, "success");
                        }
                    },
                    {
                        text: "Take a balanced approach",
                        effects: function(gameState) {
                            const foodBonus = PopulationManager.getWorkerAssignments().farmers * 5;
                            ResourceManager.addResources({ food: foodBonus });
                            Utils.log(`Your farmers complete the harvest at a steady pace, gaining ${foodBonus} extra food.`, "success");
                        }
                    }
                ],
                season: "Fall",
                conditions: function(gameState) {
                    return gameState.date.day > 15 && PopulationManager.getWorkerAssignments().farmers > 0;
                },
                uniquePerSeason: true,
                weight: 5
            })
        );
        
        // Winter events
        seasonalEvents.Winter.push(
            createEvent({
                id: "winter_storm",
                title: "Winter Storm",
                description: "A fierce blizzard has descended upon your settlement. The snow piles high and the wind howls.",
                options: [
                    {
                        text: "Burn extra wood to stay warm (Costs 10 wood)",
                        effects: function(gameState) {
                            if (ResourceManager.subtractResources({ wood: 10 })) {
                                Utils.log("Your people huddle around roaring fires, staying warm through the storm.", "success");
                            } else {
                                // Not enough wood
                                const character = PopulationManager.processTick(gameState.date, 1, { foodDeficit: true, food: 0 });
                                Utils.log("Without enough wood, your people struggle to stay warm in the bitter cold.", "danger");
                            }
                        }
                    },
                    {
                        text: "Conserve resources and endure",
                        effects: function(gameState) {
                            // Risk someone getting sick or dying
                            if (Utils.chanceOf(30)) {
                                const character = PopulationManager.processTick(gameState.date, 1, { foodDeficit: true, food: 0 });
                                Utils.log("The bitter cold takes its toll on your people.", "danger");
                            } else {
                                Utils.log("Your people huddle together, enduring the storm with grim determination.", "important");
                            }
                        }
                    }
                ],
                season: "Winter",
                conditions: function(gameState) {
                    return Utils.chanceOf(25);
                },
                cooldown: 15, // Multiple storms can happen per winter
                weight: 2
            })
        );
    }
    
    // Public API
    return {
        /**
         * Initialize the event manager
         */
        init: function() {
            initializeEvents();
            console.log("Event Manager initialized");
        },
        
        /**
         * Process events for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Process active (persistent) events
            for (let i = activeEvents.length - 1; i >= 0; i--) {
                const event = activeEvents[i];
                
                // Update event duration
                if (event.isPersistent && event.timeRemaining > 0) {
                    event.timeRemaining -= tickSize;
                    
                    // Check if event has ended
                    if (event.timeRemaining <= 0) {
                        // Apply completion effects if any
                        if (event.effects) {
                            event.effects(gameState);
                        }
                        
                        // Remove from active events
                        activeEvents.splice(i, 1);
                    }
                }
            }
            
            // When new season starts, reset seasonal triggers
            const currentSeason = gameState.date.season;
            const currentYear = gameState.date.year;
            const seasonKey = `${currentSeason}_${currentYear}`;
            
            // Initialize season tracking if needed
            if (!triggeredEvents.seasonal[seasonKey]) {
                triggeredEvents.seasonal[seasonKey] = [];
                resetSeasonalTriggers(currentSeason, currentYear);
            }
            
            // Determine if we should check for an event this tick
            // Use a probability based on tickSize to avoid too many events
            const shouldCheckForEvent = Utils.chanceOf(5 * tickSize);
            
            if (!shouldCheckForEvent) return;
            
            // First check for seasonal events
            const seasonEvents = seasonalEvents[currentSeason];
            
            if (seasonEvents && seasonEvents.length > 0) {
                // Filter events by conditions
                const eligibleSeasonalEvents = seasonEvents.filter(event => 
                    checkEventConditions(event, gameState)
                );
                
                if (eligibleSeasonalEvents.length > 0) {
                    // Select weighted random event
                    const selectedEvent = selectWeightedRandomEvent(eligibleSeasonalEvents);
                    
                    // Record the event trigger
                    recordEventTrigger(selectedEvent, gameState.date);
                    
                    // Trigger the event
                    this.triggerEvent(selectedEvent, gameState);
                    return; // Only trigger one event per tick
                }
            }
            
            // If no seasonal event, check for random events
            if (eventPool.length > 0) {
                // Filter events by conditions
                const eligibleRandomEvents = eventPool.filter(event => 
                    checkEventConditions(event, gameState)
                );
                
                if (eligibleRandomEvents.length > 0) {
                    // Select weighted random event
                    const selectedEvent = selectWeightedRandomEvent(eligibleRandomEvents);
                    
                    // Record the event trigger
                    recordEventTrigger(selectedEvent, gameState.date);
                    
                    // Trigger the event
                    this.triggerEvent(selectedEvent, gameState);
                }
            }
        },
        
        /**
         * Trigger a specific event
         * @param {Object} event - Event to trigger
         * @param {Object} gameState - Current game state
         */
        triggerEvent: function(event, gameState) {
            // Display event in UI
            this.displayEvent(event);
            
            // If event has no options, apply effects immediately
            if (!event.options || event.options.length === 0) {
                applyEventEffects(event, undefined, gameState);
                return;
            }
            
            // Otherwise, wait for player to select an option
            // (This is handled by the game loop / UI)
            
            // If persistent, add to active events
            if (event.isPersistent) {
                activeEvents.push(event);
            }
        },
        
        /**
         * Display event in the UI with interactive choices
         * @param {Object} event - Event to display
         */
        displayEvent: function(event) {
            // Store whether the game is running before pausing
            gameWasRunningBeforeEvent = GameEngine.isGameRunning();
            
            // Pause the game when showing an event
            if (gameWasRunningBeforeEvent) {
                GameEngine.pauseGame();
            }
            
            // Log the event in the game log
            Utils.log(`[EVENT] ${event.title}: ${event.description}`, "important");
            
            // Create a modal dialog for the event
            const eventModal = document.createElement('div');
            eventModal.className = 'event-modal';
            eventModal.innerHTML = `
                <div class="event-content">
                    <h2>${event.title}</h2>
                    <p>${event.description}</p>
                    <div class="event-options"></div>
                </div>
            `;
            
            // Add options if available
            if (event.options && event.options.length > 0) {
                const optionsContainer = eventModal.querySelector('.event-options');
                
                event.options.forEach((option, index) => {
                    const optionButton = document.createElement('button');
                    optionButton.textContent = option.text;
                    optionButton.className = 'event-option';
                    optionButton.dataset.optionIndex = index;
                    
                    // Add event listener
                    optionButton.addEventListener('click', () => {
                        // Close modal
                        document.body.removeChild(eventModal);
                        
                        // Handle option selection
                        this.handleEventOption(event, index, GameEngine.getGameState());
                    });
                    
                    optionsContainer.appendChild(optionButton);
                });
            } else {
                // If no options, add a "Continue" button
                const optionsContainer = eventModal.querySelector('.event-options');
                const continueButton = document.createElement('button');
                continueButton.textContent = "Continue";
                continueButton.className = 'event-option';
                
                // Add event listener
                continueButton.addEventListener('click', () => {
                    // Close modal
                    document.body.removeChild(eventModal);
                    
                    // Apply effects
                    if (event.effects) {
                        event.effects(GameEngine.getGameState());
                    }
                    
                    // Resume game if it was running before
                    if (gameWasRunningBeforeEvent) {
                        GameEngine.startGame();
                    }
                });
                
                optionsContainer.appendChild(continueButton);
            }
            
            // Add modal to the DOM
            document.body.appendChild(eventModal);
            
            // Debug info - can be removed in production
            console.group("Event Details");
            console.log("Title:", event.title);
            console.log("Description:", event.description);
            console.log("Options:", event.options);
            console.log("Is Persistent:", event.isPersistent);
            console.log("Duration:", event.duration);
            console.groupEnd();
        },
        
        /**
         * Handle player selecting an event option
         * @param {Object} event - Event object
         * @param {number} optionIndex - Selected option index
         * @param {Object} gameState - Current game state
         */
        handleEventOption: function(event, optionIndex, gameState) {
            Utils.log(`Selected: ${event.options[optionIndex].text}`);
            
            // Apply effects
            applyEventEffects(event, optionIndex, gameState);
            
            // Award fame based on event importance
            if (event.importance) {
                RankManager.processEvent(event.importance);
            } else {
                // Default to minor importance
                RankManager.processEvent('minor');
            }
            
            // If not persistent, remove from active events
            if (!event.isPersistent) {
                const index = activeEvents.indexOf(event);
                if (index !== -1) {
                    activeEvents.splice(index, 1);
                }
            }
            
            // Resume game if it was running before
            if (gameWasRunningBeforeEvent) {
                GameEngine.startGame();
            }
        },
        
        /**
         * Add a custom event to the event pool
         * @param {Object} eventData - Event data
         * @param {string} [season] - Specific season for the event
         */
        addEvent: function(eventData, season) {
            const event = createEvent(eventData);
            
            if (season && seasonalEvents[season]) {
                seasonalEvents[season].push(event);
            } else {
                eventPool.push(event);
            }
        },
        
        /**
         * Get active events
         * @returns {Array} - Array of active events
         */
        getActiveEvents: function() {
            return [...activeEvents];
        },
        
        /**
         * Get event history
         * @returns {Array} - Array of historical events
         */
        getEventHistory: function() {
            return [...eventHistory];
        },
        
        /**
         * DEBUG: Clear event cooldowns
         * For testing, resets all event tracking
         */
        debugResetAllCooldowns: function() {
            triggeredEvents.random = {};
            triggeredEvents.seasonal = {};
            console.log("All event cooldowns have been reset");
        }
    };
})();