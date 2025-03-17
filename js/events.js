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
        season: null  // Specific season or null for any season
    };
    
    // Private methods
    
    /**
     * Check if event conditions are met
     * @param {Object} event - Event object
     * @param {Object} gameState - Current game state
     * @returns {boolean} - Whether conditions are met
     */
    function checkEventConditions(event, gameState) {
        if (!event.conditions) return true;
        
        // Season-specific check
        if (event.season && event.season !== gameState.date.season) {
            return false;
        }
        
        return event.conditions(gameState);
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
            timestamp: gameState.date,
            option: optionIndex !== undefined ? event.options[optionIndex].text : null
        });
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
                }
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
                }
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
                }
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
                }
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
                }
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
                }
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
                }
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
            
            // Check for seasonal events
            const currentSeason = gameState.date.season;
            const seasonEvents = seasonalEvents[currentSeason];
            
            if (seasonEvents && seasonEvents.length > 0) {
                for (const event of seasonEvents) {
                    if (checkEventConditions(event, gameState)) {
                        this.triggerEvent(event, gameState);
                        break; // Only trigger one event per tick
                    }
                }
            }
            
            // Check for random events
            if (eventPool.length > 0 && Utils.chanceOf(5 * tickSize)) {
                // Filter events by conditions
                const eligibleEvents = eventPool.filter(event => 
                    checkEventConditions(event, gameState)
                );
                
                if (eligibleEvents.length > 0) {
                    // Select random event from eligible events
                    const randomIndex = Utils.randomBetween(0, eligibleEvents.length - 1);
                    this.triggerEvent(eligibleEvents[randomIndex], gameState);
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
        }
    };
})();
