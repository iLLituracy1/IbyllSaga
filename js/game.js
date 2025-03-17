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
        slow: 3000,
        normal: 2000,
        fast: 1000
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
            } else {
                Utils.log(`The season changes to ${gameState.date.season}`, "important");
            }
            
            // Process season change for fame
            if (RankManager && typeof RankManager.processSeason === 'function') {
                RankManager.processSeason(gameState.date, previousSeason);
            }
        }
        
        updateDateDisplay();
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
        
        // Process population for fame
        RankManager.processPopulation(PopulationManager.getPopulation());
        
        // Process events
        EventManager.processTick(
            gameState, 
            tickSize
        );
        
        // Update resource production rates based on current worker assignments
        ResourceManager.updateProductionRates(
            PopulationManager.getWorkerAssignments()
        );
    }
    
    /**
     * Set up event listeners for UI controls
     */
    function setupEventListeners() {
        // Game speed controls
        document.getElementById('btn-speed-slow').addEventListener('click', function() {
            GameEngine.setGameSpeed('slow');
        });
        
        document.getElementById('btn-speed-normal').addEventListener('click', function() {
            GameEngine.setGameSpeed('normal');
        });
        
        document.getElementById('btn-speed-fast').addEventListener('click', function() {
            GameEngine.setGameSpeed('fast');
        });
        
        document.getElementById('btn-pause').addEventListener('click', function() {
            GameEngine.togglePause();
        });
        
        // Building buttons
        document.getElementById('btn-build-house').addEventListener('click', function() {
            if (ResourceManager.canAffordBuilding('house')) {
                if (ResourceManager.payForBuilding('house')) {
                    PopulationManager.addBuilding('house');
                    RankManager.processBuildingConstruction('house');
                    Utils.log("A new house has been built, increasing your settlement's capacity.");
                }
            } else {
                Utils.log("You don't have enough resources to build a house.", "important");
            }
        });
        
        document.getElementById('btn-build-farm').addEventListener('click', function() {
            if (ResourceManager.canAffordBuilding('farm')) {
                if (ResourceManager.payForBuilding('farm')) {
                    ResourceManager.applyProductionModifier("food", 1.2);
                    RankManager.processBuildingConstruction('farm');
                    Utils.log("A new farm has been built, increasing food production.");
                }
            } else {
                Utils.log("You don't have enough resources to build a farm.", "important");
            }
        });
        
        document.getElementById('btn-build-smith').addEventListener('click', function() {
            if (ResourceManager.canAffordBuilding('smithy')) {
                if (ResourceManager.payForBuilding('smithy')) {
                    ResourceManager.applyProductionModifier("metal", 1.5);
                    RankManager.processBuildingConstruction('smithy');
                    Utils.log("A new smithy has been built, increasing metal production.");
                }
            } else {
                Utils.log("You don't have enough resources to build a smithy.", "important");
            }
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
    }
    
    // Public API
    return {
        /**
         * Initialize the game engine and all modules
         */
        init: function() {
            console.log("Initializing Viking Legacy game...");
            
            // Initialize modules
            ResourceManager.init();
            PopulationManager.init();
            EventManager.init();
            RankManager.init();
            
            // Set up event listeners
            setupEventListeners();
            
            // Update UI
            updateDateDisplay();
            
            // Start game loop
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
                document.getElementById('btn-pause').textContent = "Pause";
                
                console.log("Game started");
            }
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
                document.getElementById('btn-pause').textContent = "Resume";
                
                console.log("Game paused");
            }
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
            
            // Update UI
            document.getElementById('btn-speed-slow').classList.remove('active');
            document.getElementById('btn-speed-normal').classList.remove('active');
            document.getElementById('btn-speed-fast').classList.remove('active');
            document.getElementById(`btn-speed-${speed}`).classList.add('active');
            
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
                activeEvents: EventManager.getActiveEvents()
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
