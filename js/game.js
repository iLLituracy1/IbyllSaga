/**
 * Viking Legacy - Main Game Engine
 * Handles game initialization, the simulation loop, and coordinates between modules
 */

const GameEngine = (function() {
    // Constants
    const DAYS_PER_SEASON = 90;
    const DAYS_PER_MONTH = 30;
    const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
    
    // Game speed settings (days per tick)
    const gameSpeeds = {
        slow: 1,
        normal: 1,
        fast: 1
    };
    
    // Game tick interval (in milliseconds)
    const tickIntervals = {
        slow: 10000,
        normal: 5000,
        fast: 100
    };
    
    // Day progress update intervals (ms)
    const dayProgressIntervals = {
        slow: 300,
        normal: 200,
        fast: 100
    };
    
    // Viking month names
    const MONTH_NAMES = [
        "Þorri", // Thorri - Mid-January to Mid-February
        "Góa", // Goa - Mid-February to Mid-March
        "Einmánuður", // One Month - Mid-March to Mid-April
        "Harpa", // Mid-April to Mid-May
        "Skerpla", // Mid-May to Mid-June
        "Sólmánuður", // Sun Month - Mid-June to Mid-July
        "Heyannir", // Hay-Making - Mid-July to Mid-August
        "Tvímánuður", // Two Month - Mid-August to Mid-September
        "Haustmánuður", // Autumn Month - Mid-September to Mid-October
        "Gormánuður", // Slaughter Month - Mid-October to Mid-November
        "Ýlir", // Yule Month - Mid-November to Mid-December
        "Mörsugur" // Fat-Sucking Month - Mid-December to Mid-January
    ];
    
    // Private variables
    let gameState = {
        date: {
            day: 1,
            dayOfSeason: 1,
            dayOfMonth: 1,
            month: 0, // Index into MONTH_NAMES array
            monthName: MONTH_NAMES[0],
            season: "Spring",
            year: 1
        },
        isRunning: false,
        gameSpeed: 'normal', // 'slow', 'normal', 'fast'
        tickInterval: null,
        dayProgressTimer: null,
        dayProgressValue: 0
    };
    
    // Private methods
    
    /**
     * Update the game date display
     */
    function updateDateDisplay() {
        const dateStr = `Year ${gameState.date.year}, Day ${gameState.date.day} - <span class="month-name">${gameState.date.monthName}</span> (${gameState.date.season})`;
        document.getElementById('game-date').innerHTML = dateStr;
    }
    
    /**
     * Update the day progress bar
     * @param {number} progress - Progress value from 0 to 100
     */
    function updateDayProgressBar(progress) {
        const progressBar = document.getElementById('day-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    /**
     * Advance the game date by a number of days
     * @param {number} days - Number of days to advance
     */
    function advanceDate(days) {
        // Increment all day counters
        gameState.date.day += days;
        gameState.date.dayOfSeason += days;
        gameState.date.dayOfMonth += days;
        
        // Check for month change
        if (gameState.date.dayOfMonth > DAYS_PER_MONTH) {
            gameState.date.dayOfMonth = gameState.date.dayOfMonth - DAYS_PER_MONTH;
            
            // Advance to next month
            gameState.date.month = (gameState.date.month + 1) % MONTH_NAMES.length;
            gameState.date.monthName = MONTH_NAMES[gameState.date.month];
            
            Utils.log(`The month changes to ${gameState.date.monthName}`);
        }
        
        // Check for season change
        if (gameState.date.dayOfSeason > DAYS_PER_SEASON) {
            gameState.date.dayOfSeason = gameState.date.dayOfSeason - DAYS_PER_SEASON;
            
            // Find current season index
            const currentSeasonIndex = SEASONS.indexOf(gameState.date.season);
            
            // Move to next season
            const nextSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
            const previousSeason = gameState.date.season;
            gameState.date.season = SEASONS[nextSeasonIndex];
            
            // If we've gone through all seasons, advance year
            if (nextSeasonIndex === 0) {
                gameState.date.year++;
                Utils.log(`A new year begins: Year ${gameState.date.year}`, "important");
            }
           
            // Process season change for fame
            if (RankManager && typeof RankManager.processSeason === 'function') {
                RankManager.processSeason(gameState.date, previousSeason);
            }
        }
        
        updateDateDisplay();
    }
    
    /**
     * Update world map UI with current information
     */
        // Use WorldMap's updateUI method if available
        if (WorldMap && typeof WorldMap.updateUI === 'function') {
            WorldMap.updateUI();
        }
    
        
        // Update region name and description
        const regionNameEl = document.getElementById('current-region-name');
        const regionDescEl = document.getElementById('region-description');
        if (regionNameEl) regionNameEl.textContent = playerRegion.name;
        if (regionDescEl) regionDescEl.textContent = playerRegion.description;
        
        // Update resource modifiers
        const foodModEl = document.getElementById('food-modifier');
        const woodModEl = document.getElementById('wood-modifier');
        const stoneModEl = document.getElementById('stone-modifier');
        const metalModEl = document.getElementById('metal-modifier');
        
        if (foodModEl) foodModEl.textContent = playerRegion.resourceModifiers.food.toFixed(1);
        if (woodModEl) woodModEl.textContent = playerRegion.resourceModifiers.wood.toFixed(1);
        if (stoneModEl) stoneModEl.textContent = playerRegion.resourceModifiers.stone.toFixed(1);
        if (metalModEl) metalModEl.textContent = playerRegion.resourceModifiers.metal.toFixed(1);
        
        // Update nearby settlements
        const playerSettlement = WorldMap.getPlayerSettlement();
        const settlementsListElement = document.getElementById('settlements-list');
        
        if (playerSettlement && settlementsListElement) {
            const nearbySettlements = WorldMap.getNearbySettlements(playerSettlement.id);
            
            if (nearbySettlements.length > 0) {
                let settlementsHTML = '';
                
                nearbySettlements.forEach(settlement => {
                    settlementsHTML += `
                        <div class="settlement-item settlement-${settlement.type.toLowerCase()}">
                            <div class="settlement-name">${settlement.name}</div>
                            <div class="settlement-type">${settlement.type}</div>
                        </div>
                    `;
                });
                
                settlementsListElement.innerHTML = settlementsHTML;
            } else {
                settlementsListElement.textContent = 'No settlements nearby.';
            }
        }
    
    
    /**
     * Process a single game tick
     */
    function processTick() {
        // Get tick size based on current game speed
        const tickSize = gameSpeeds[gameState.gameSpeed];
        
        // Reset day progress animation
        gameState.dayProgressValue = 0;
        updateDayProgressBar(0);
        
        // Advance game date
        advanceDate(tickSize);
        
        // Process resources
        const resourceStatus = ResourceManager.processTick(
            PopulationManager.getPopulation(), 
            tickSize
        );
        
        // Process resource production for fame
        if (resourceStatus && resourceStatus.resourcesGained) {
            RankManager.processResourceProduction(resourceStatus.resourcesGained);
        }
        
        // Process population changes
        const populationChanges = PopulationManager.processTick(
            gameState.date, 
            tickSize, 
            resourceStatus
        );
        
        // Process buildings and construction
        BuildingSystem.processTick(gameState, tickSize); 
        
        // Process population for fame
        RankManager.processPopulation(PopulationManager.getPopulation());
        
        // Process events
        EventManager.processTick(
            gameState, 
            tickSize
        );
        
        // Process world map (AI settlements, etc.)
        WorldMap.processTick(gameState, tickSize);
    
        // Process land management orders
        LandManager.processTick(gameState, tickSize);
        
        // Update resource production rates based on current worker assignments
        ResourceManager.updateProductionRates(
            PopulationManager.getWorkerAssignments()
        );
        
        // Update World Map UI
        WorldMap.updateUI();
        
        // Update statistics panel if needed
        if (typeof StatisticsPanel !== 'undefined' && typeof StatisticsPanel.update === 'function') {
            StatisticsPanel.update();
        }
    }
    
    /**
     * Safely add event listener to an element if it exists
     * @param {string} elementId - ID of the element
     * @param {string} eventType - Type of event (e.g., 'click')
     * @param {Function} handler - Event handler function
     */
    function safeAddEventListener(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
        } else {
            console.warn(`Element with ID '${elementId}' not found for event listener.`);
        }
    }
    
    /**
     * Set up event listeners for UI controls
     */
    function setupEventListeners() {
        // Game speed controls
        safeAddEventListener('btn-speed-slow', 'click', function() {
            GameEngine.setGameSpeed('slow');
        });
        
        safeAddEventListener('btn-speed-normal', 'click', function() {
            GameEngine.setGameSpeed('normal');
        });
        
        safeAddEventListener('btn-speed-fast', 'click', function() {
            GameEngine.setGameSpeed('fast');
        });
        
        safeAddEventListener('btn-pause', 'click', function() {
            GameEngine.togglePause();
        });

     
        
    
        
        // Worker assignment controls
        const incrementButtons = document.querySelectorAll('.increment');
        const decrementButtons = document.querySelectorAll('.decrement');
        
        incrementButtons.forEach(button => {
            button.addEventListener('click', function() {
                const role = this.dataset.target;
                PopulationManager.assignWorkers(role, 1);
            });
        });
        
        decrementButtons.forEach(button => {
            button.addEventListener('click', function() {
                const role = this.dataset.target;
                PopulationManager.assignWorkers(role, -1);
            });
        });
        
        // World action buttons (coming soon)
        safeAddEventListener('btn-explore', 'click', function() {
            Utils.log("Exploration feature coming soon!", "important");
        });
        
        safeAddEventListener('btn-raid', 'click', function() {
            Utils.log("Raiding feature coming soon!", "important");
        });
        
        safeAddEventListener('btn-trade', 'click', function() {
            Utils.log("Trading feature coming soon!", "important");
        });
    }

    
    // Public API
    return {
        /**
         * Initialize the game engine and all modules
         */
        // Replace the init function in GameEngine
    init: function() {
    console.log("Initializing Viking Legacy game...");
    
    // Step 1: Initialize NavigationSystem first
    NavigationSystem.init();
    
    // Step 2: Initialize core systems
    ResourceManager.init();
    ResourceManager.refreshResourceUI(); 
    
    // Step 3: Initialize population and rank systems
    PopulationManager.init();
    PopulationManager.initializeSpecializedWorkers();
    RankManager.init();
    
    // Step 4: Initialize world and event systems
    WorldMap.init();
    const playerRegion = WorldMap.getPlayerRegion();
    if (playerRegion) {
        WorldMap.updateRegionResourceModifiers(playerRegion);
    }
    EventManager.init();
    
    // Step 5: Register core panels that exist in HTML
    NavigationSystem.registerPanel('resources-panel', 'settlement');
    NavigationSystem.registerPanel('population-panel', 'settlement');
    NavigationSystem.registerPanel('actions-panel', 'settlement');
    NavigationSystem.registerPanel('log-panel', 'saga');
    NavigationSystem.registerPanel('world-panel', 'world');
    
    // Step 6: Initialize feature modules that create their own panels
    LandManager.init();
    StatisticsPanel.init();
    BuildingSystem.init();
    
    // Step 7: Perform a final panels refresh
    NavigationSystem.refreshPanels();
    
    // Step 8: Set up event listeners after all panels are ready
    setupEventListeners();
    
    // Step 9: Update initial UI state
    updateDateDisplay();
    WorldMap.updateUI();
 
    
    // Step 10: Start game loop
    this.startGame();
    
    console.log("Game initialized successfully");
},
        
        /**
         * Start the game simulation
         */
        startGame: function() {
            if (!gameState.isRunning) {
                gameState.isRunning = true;
                
                // Set initial tick interval based on game speed
                const tickInterval = tickIntervals[gameState.gameSpeed];
                gameState.tickInterval = setInterval(processTick, tickInterval);
                
                // Set up day progress animation
                const progressInterval = dayProgressIntervals[gameState.gameSpeed];
                gameState.dayProgressValue = 0;
                updateDayProgressBar(0);
                
                gameState.dayProgressTimer = setInterval(() => {
                    // Increment progress
                    gameState.dayProgressValue += 100 / (tickInterval / progressInterval);
                    
                    // Cap at 100%
                    if (gameState.dayProgressValue > 100) {
                        gameState.dayProgressValue = 100;
                    }
                    
                    // Update progress bar
                    updateDayProgressBar(gameState.dayProgressValue);
                }, progressInterval);
                
                // Update UI
                const pauseButton = document.getElementById('btn-pause');
                if (pauseButton) {
                    pauseButton.textContent = "Pause";
                }
                
                console.log("Game started");
            }
        },

        registerTickProcessor: function(processorFunction) {
            const originalProcessTick = this.processTick;
            this.processTick = function() {
                const result = originalProcessTick.apply(this, arguments);
                processorFunction(this.getGameState(), arguments[0]);
                return result;
            };
        },
        
        /**
         * Pause the game simulation
         */
        pauseGame: function() {
            if (gameState.isRunning) {
                gameState.isRunning = false;
                
                // Clear tick interval
                clearInterval(gameState.tickInterval);
                gameState.tickInterval = null;
                
                // Clear day progress timer
                clearInterval(gameState.dayProgressTimer);
                gameState.dayProgressTimer = null;
                
                // Update UI
                const pauseButton = document.getElementById('btn-pause');
                if (pauseButton) {
                    pauseButton.textContent = "Resume";
                }
                
                console.log("Game paused");
            }
        },

                /**
         * Check if the game is currently running
         * @returns {boolean} - Whether the game is running or paused
         */
        isGameRunning: function() {
            return gameState.isRunning;
        },
        
        /**
         * Toggle game pause state
         */
        togglePause: function() {
            if (gameState.isRunning) {
                this.pauseGame();
            } else {
                this.startGame();
            }
        },
        
        /**
         * Set game speed
         * @param {string} speed - Game speed ('slow', 'normal', 'fast')
         */
        setGameSpeed: function(speed) {
            if (!gameSpeeds.hasOwnProperty(speed)) {
                console.warn(`Invalid game speed: ${speed}`);
                return;
            }
            
            // Update game speed
            gameState.gameSpeed = speed;
            
            // If game is running, update intervals
            if (gameState.isRunning) {
                // Update tick interval
                clearInterval(gameState.tickInterval);
                gameState.tickInterval = setInterval(processTick, tickIntervals[speed]);
                
                // Update day progress animation
                clearInterval(gameState.dayProgressTimer);
                const progressInterval = dayProgressIntervals[speed];
                const tickInterval = tickIntervals[speed];
                
                // Reset progress
                gameState.dayProgressValue = 0;
                updateDayProgressBar(0);
                
                // Set new progress timer
                gameState.dayProgressTimer = setInterval(() => {
                    // Increment progress
                    gameState.dayProgressValue += 100 / (tickInterval / progressInterval);
                    
                    // Cap at 100%
                    if (gameState.dayProgressValue > 100) {
                        gameState.dayProgressValue = 100;
                    }
                    
                    // Update progress bar
                    updateDayProgressBar(gameState.dayProgressValue);
                }, progressInterval);
            }
            
            // Update UI - safely
            document.querySelectorAll('#btn-speed-slow, #btn-speed-normal, #btn-speed-fast').forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
            
            const activeButton = document.getElementById(`btn-speed-${speed}`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            console.log(`Game speed set to ${speed}`);
        },
        
        /**
         * Get current game state
         * @returns {Object} - Current game state
         */
        getGameState: function() {
            return {
                date: { ...gameState.date },
                resources: ResourceManager.getResources(),
                population: PopulationManager.getPopulation(),
                workerAssignments: PopulationManager.getWorkerAssignments(),
                productionRates: ResourceManager.getProductionRates(),
                characters: PopulationManager.getCharacters(),
                leader: PopulationManager.getDynastyLeader(),
                activeEvents: EventManager.getActiveEvents(),
                playerRegion: WorldMap.getPlayerRegion(),
                playerSettlement: WorldMap.getPlayerSettlement(),
                worldOverview: WorldMap.getWorldOverview(),
                landData: LandManager.getLandData(),
                activeOrders: LandManager.getActiveOrders(),
                buildings: BuildingSystem.getBuildingData(),
            };
        },

        /**
         * Manual tick for debugging
         */
        manualTick: function() {
            processTick();
        }
    };
})();

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    GameEngine.init();
});
