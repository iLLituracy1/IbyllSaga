/**
 * Viking Legacy - Settlement Statistics Panel
 * Provides detailed information about settlement demographics, buildings, and resources
 */

const StatisticsPanel = (function() {
    // Track if panel exists
    let isPanelCreated = false;
    
    // Update frequency (in ms)
    const UPDATE_INTERVAL = 2000;
    
    // Update timer reference
    let updateTimer = null;
    
    // Private methods
    
    /**
     * Create the statistics panel DOM elements
     */
    function createPanel() {
        // Check if panel already exists
        if (document.getElementById('statistics-panel')) {
            console.log("Statistics panel already exists");
            return;
        }
        
        // Create panel container
        const statsPanel = document.createElement('div');
        statsPanel.className = 'statistics-panel';
        statsPanel.id = 'statistics-panel';
        
        // Create panel toggle button (for mobile)
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-stats-panel';
        toggleButton.className = 'toggle-panel-button';
        toggleButton.innerHTML = 'Settlement Stats <span class="toggle-icon">▼</span>';
        toggleButton.addEventListener('click', function() {
            const panel = document.getElementById('stats-panel-content');
            if (panel) {
                panel.classList.toggle('collapsed');
                this.querySelector('.toggle-icon').textContent = 
                    panel.classList.contains('collapsed') ? '▼' : '▲';
            }
        });
        
        // Create content container (can be collapsed on mobile)
        const contentDiv = document.createElement('div');
        contentDiv.id = 'stats-panel-content';
        contentDiv.className = 'stats-panel-content';
        
        // Populate with initial sections
        contentDiv.innerHTML = `
            <div class="stats-section">
                <h3>Housing</h3>
                <div class="stat-row">
                    <div class="stat-label">Capacity:</div>
                    <div class="stat-value" id="housing-capacity">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Occupancy:</div>
                    <div class="stat-value" id="housing-occupancy">0/0</div>
                </div>
                <div class="stat-progress">
                    <div class="progress-label">Occupancy Rate:</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="housing-bar"></div>
                        <div class="progress-text" id="housing-percentage">0%</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Buildings</h3>
                <div id="buildings-list">
                    <p>No buildings constructed yet.</p>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Population</h3>
                <div class="stat-row">
                    <div class="stat-label">Total:</div>
                    <div class="stat-value" id="pop-total">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Growth Rate:</div>
                    <div class="stat-value" id="pop-growth">0/year</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Gender:</div>
                    <div class="stat-value" id="pop-gender">0♂ / 0♀</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Adults:</div>
                    <div class="stat-value" id="pop-adults">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Children:</div>
                    <div class="stat-value" id="pop-children">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Elders:</div>
                    <div class="stat-value" id="pop-elders">0</div>
                </div>
                <div class="stat-breakdown" id="pop-age-breakdown">
                    <!-- Age breakdown chart will go here -->
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Resource Production</h3>
                <div class="stat-row">
                    <div class="stat-label">Food per Worker:</div>
                    <div class="stat-value" id="prod-food">0.0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Wood per Worker:</div>
                    <div class="stat-value" id="prod-wood">0.0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Stone per Worker:</div>
                    <div class="stat-value" id="prod-stone">0.0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Metal per Worker:</div>
                    <div class="stat-value" id="prod-metal">0.0</div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Settlement Characters</h3>
                <div class="character-filter">
                    <button class="character-filter-btn active" data-filter="all">All</button>
                    <button class="character-filter-btn" data-filter="worker">Workers</button>
                    <button class="character-filter-btn" data-filter="child">Children</button>
                    <button class="character-filter-btn" data-filter="elder">Elders</button>
                </div>
                <div id="characters-list" class="characters-list">
                    <!-- Character cards will be inserted here -->
                </div>
            </div>
        `;
        
        // Assemble the panel
        statsPanel.appendChild(toggleButton);
        statsPanel.appendChild(contentDiv);
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(statsPanel);
            
            // Setup event handlers for character filtering
            setupCharacterFilters();
            
            // Add CSS to document
            addStyles();

                    // Register with NavigationSystem if it exists
        if (typeof NavigationSystem !== 'undefined') {
            NavigationSystem.registerPanel('statistics-panel', 'stats');
        }
            
            isPanelCreated = true;
        } else {
            console.error("Could not find .game-content to add statistics panel");
        }
    }
    
    /**
     * Set up event handlers for character filter buttons
     */
    function setupCharacterFilters() {
        const filterButtons = document.querySelectorAll('.character-filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Apply filter
                const filterType = this.dataset.filter;
                filterCharacters(filterType);
            });
        });
    }
    
    /**
     * Filter character list by type
     * @param {string} filterType - Type to filter by ('all', 'worker', 'child', 'elder')
     */
    function filterCharacters(filterType) {
        const characterCards = document.querySelectorAll('.character-card');
        
        characterCards.forEach(card => {
            if (filterType === 'all' || card.dataset.role === filterType) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    /**
     * Add CSS styles for the statistics panel
     */
    function addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Statistics Panel */
            .statistics-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #c9ba9b;
                margin-top: 20px;
                grid-column: 1 / 3;
            }
            
            .toggle-panel-button {
                width: 100%;
                text-align: left;
                margin-bottom: 15px;
                display: none; /* Hidden on desktop */
            }
            
            .toggle-icon {
                float: right;
            }
            
            .stats-panel-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .stats-section {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .stats-section h3 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 15px;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
                letter-spacing: 1px;
                font-weight: 700;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 3px 0;
            }
            
            .stat-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            .stat-value {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .stat-progress {
                margin-top: 10px;
            }
            
            .progress-label {
                margin-bottom: 5px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .progress-bar-container {
                height: 20px;
                background-color: #d7cbb9;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
                border: 1px solid #c9ba9b;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(to right, #8b5d33, #a97c50);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-weight: 600;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
            }
            
            #buildings-list {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .building-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 8px;
                margin-bottom: 5px;
                background-color: #fbf7f0;
                border-radius: 4px;
                border-left: 3px solid #8b5d33;
            }
            
            .building-name {
                font-weight: 500;
            }
            
            .building-count {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .character-filter {
                display: flex;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .character-filter-btn {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .character-filter-btn:hover {
                background-color: #c9ba9b;
            }
            
            .character-filter-btn.active {
                background-color: #8b5d33;
                color: #fff;
                border: 1px solid #5d4037;
            }
            
            .characters-list {
                max-height: 400px;
                overflow-y: auto;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px;
            }
            
            .character-card {
                background-color: #fbf7f0;
                border-radius: 4px;
                padding: 10px;
                border-left: 3px solid #8b5d33;
                transition: transform 0.2s;
            }
            
            .character-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .character-card h4 {
                margin-top: 0;
                margin-bottom: 5px;
                color: #5d4037;
                display: flex;
                justify-content: space-between;
            }
            
            .character-card p {
                margin: 3px 0;
                font-size: 0.9rem;
            }
            
            .character-gender {
                font-weight: bold;
            }
            
            .male {
                color: #1565c0;
            }
            
            .female {
                color: #c62828;
            }
            
            .character-traits {
                margin-top: 5px;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .character-trait {
                font-size: 0.8rem;
                padding: 2px 5px;
                border-radius: 3px;
                background-color: #e6d8c3;
            }
            
            .trait-positive {
                background-color: #c8e6c9;
                color: #2e7d32;
            }
            
            .trait-negative {
                background-color: #ffcdd2;
                color: #c62828;
            }
            
            /* Colors for different roles */
            .role-worker {
                border-left-color: #1565c0;
            }
            
            .role-child {
                border-left-color: #2e7d32;
            }
            
            .role-elder {
                border-left-color: #8b5d33;
            }
            
            .role-leader {
                border-left-color: #c62828;
                background-color: #fff5e6;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .toggle-panel-button {
                    display: block;
                }
                
                .stats-panel-content.collapsed {
                    display: none;
                }
                
                .stats-panel-content {
                    grid-template-columns: 1fr;
                }
                
                .characters-list {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Update the statistics panel with current game data
     */
    function updatePanel() {
        if (!isPanelCreated) return;
        
        // Get current game data
        const population = PopulationManager.getPopulation();
        const characters = PopulationManager.getCharacters();
        const housingCapacity = PopulationManager.getHousingCapacity();
        const buildings = getBuildingsList();
        const productionRates = ResourceManager.getProductionRates();
        const workerAssignments = PopulationManager.getWorkerAssignments();
        
        // Update housing section
        updateHousingSection(population, housingCapacity);
        
        // Update buildings section
        updateBuildingsSection(buildings);
        
        // Update population section
        updatePopulationSection(population, characters);
        
        // Update production section
        updateProductionSection(productionRates, workerAssignments);
        
        // Update characters list
        updateCharactersList(characters);
    }
    
    /**
     * Update housing statistics
     * @param {Object} population - Population data
     * @param {number} housingCapacity - Maximum housing capacity
     */
    function updateHousingSection(population, housingCapacity) {
        Utils.updateElement('housing-capacity', housingCapacity);
        Utils.updateElement('housing-occupancy', `${population.total}/${housingCapacity}`);
        
        // Update progress bar
        const occupancyRate = Math.min(100, (population.total / housingCapacity * 100));
        const housingBar = document.getElementById('housing-bar');
        if (housingBar) {
            housingBar.style.width = `${occupancyRate}%`;
            
            // Change color based on occupancy
            if (occupancyRate > 90) {
                housingBar.style.background = 'linear-gradient(to right, #c62828, #e53935)';
            } else if (occupancyRate > 75) {
                housingBar.style.background = 'linear-gradient(to right, #ef6c00, #ff9800)';
            } else {
                housingBar.style.background = 'linear-gradient(to right, #2e7d32, #4caf50)';
            }
        }
        
        Utils.updateElement('housing-percentage', `${Math.round(occupancyRate)}%`);
    }
    
    /**
     * Get a list of all buildings in the settlement
     * @returns {Object} - Buildings count by type
     */
    function getBuildingsList() {
        // This is a placeholder implementation, as the game doesn't
        // currently have a central buildings registry.
        // Currently, we only know about houses from PopulationManager
        const buildings = {
            houses: 0, 
            farms: 0,
            smithies: 0,
            // Add more building types here as they are implemented
        };
        
        // Get house count from PopulationManager
        if (PopulationManager) {
            const housingCapacity = PopulationManager.getHousingCapacity();
            buildings.houses = Math.floor(housingCapacity / 5); // Assuming 5 capacity per house
        }
        
        // Get farms and smithies count from game events
        // This is a rough estimate based on resource modifiers
        // (not accurate, but an approximation)
        const foodModifier = ResourceManager.getProductionRates().food;
        const metalModifier = ResourceManager.getProductionRates().metal;
        
        buildings.farms = Math.max(0, Math.floor((foodModifier / 2) - 1));
        buildings.smithies = Math.max(0, Math.floor((metalModifier / 0.5) - 1));
        
        return buildings;
    }
    
    /**
     * Update buildings section
     * @param {Object} buildings - Buildings by type
     */
    function updateBuildingsSection(buildings) {
        const buildingsList = document.getElementById('buildings-list');
        if (!buildingsList) return;
        
        // Clear current list
        buildingsList.innerHTML = '';
        
        // Check if we have any buildings
        let hasBuildingsF = false;
        for (const type in buildings) {
            if (buildings[type] > 0) {
                hasBuildingsF = true;
                break;
            }
        }
        
        if (!hasBuildingsF) {
            buildingsList.innerHTML = '<p>No buildings constructed yet.</p>';
            return;
        }
        
        // Add each building type
        const buildingTypes = {
            houses: 'Houses',
            farms: 'Farms',
            smithies: 'Smithies',
            // Add any other building types here
        };
        
        for (const type in buildings) {
            if (buildings[type] > 0) {
                const buildingItem = document.createElement('div');
                buildingItem.className = 'building-item';
                buildingItem.innerHTML = `
                    <span class="building-name">${buildingTypes[type] || type}</span>
                    <span class="building-count">${buildings[type]}</span>
                `;
                buildingsList.appendChild(buildingItem);
            }
        }
    }
    
    /**
     * Update population section
     * @param {Object} population - Population summary
     * @param {Array} characters - Array of character objects
     */
    function updatePopulationSection(population, characters) {
        Utils.updateElement('pop-total', population.total);
        Utils.updateElement('pop-children', population.children);
        Utils.updateElement('pop-adults', population.workers + population.warriors);
        Utils.updateElement('pop-elders', population.elders || 0);
        
        // Calculate gender distribution
        const males = characters.filter(char => char.gender === 'male').length;
        const females = characters.filter(char => char.gender === 'female').length;
        Utils.updateElement('pop-gender', `${males}♂ / ${females}♀`);
        
        // Estimate growth rate
        // This is a very rough approximation based on the number of adult women and birth chance
        const adultWomen = characters.filter(char => 
            char.gender === 'female' && char.age >= 15 && char.age <= 45
        ).length;
        
        // Current implementation gives ~2% chance per year per adult woman
        const estimatedBirthsPerYear = adultWomen * 0.02;
        const growthRateDisplay = estimatedBirthsPerYear.toFixed(2) + '/year';
        Utils.updateElement('pop-growth', growthRateDisplay);
        
        // Age breakdown chart (could be added in the future)
    }
    
    /**
     * Update production section
     * @param {Object} productionRates - Current production rates
     * @param {Object} workerAssignments - Worker assignments
     */
    function updateProductionSection(productionRates, workerAssignments) {
        // Calculate per-worker production
        const foodPerWorker = workerAssignments.farmers > 0 ? 
            (productionRates.food / workerAssignments.farmers).toFixed(1) : '0.0';
        
        const woodPerWorker = workerAssignments.woodcutters > 0 ? 
            (productionRates.wood / workerAssignments.woodcutters).toFixed(1) : '0.0';
        
        const stonePerWorker = workerAssignments.miners > 0 ? 
            (productionRates.stone / workerAssignments.miners).toFixed(1) : '0.0';
        
        const metalPerWorker = workerAssignments.miners > 0 ? 
            (productionRates.metal / workerAssignments.miners).toFixed(1) : '0.0';
        
        // Update UI
        Utils.updateElement('prod-food', foodPerWorker);
        Utils.updateElement('prod-wood', woodPerWorker);
        Utils.updateElement('prod-stone', stonePerWorker);
        Utils.updateElement('prod-metal', metalPerWorker);
    }
    
    /**
     * Update the characters list
     * @param {Array} characters - Array of character objects
     */
    function updateCharactersList(characters) {
        const charactersList = document.getElementById('characters-list');
        if (!charactersList) return;
        
        // Clear current list
        charactersList.innerHTML = '';
        
        // Add each character
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = `character-card role-${character.role}`;
            if (character.isLeader) card.classList.add('role-leader');
            card.dataset.role = character.role;
            
            // Calculate skill level description
            let skillDesc = '';
            let bestSkill = '';
            let bestSkillValue = 0;
            
            for (const skill in character.skills) {
                if (character.skills[skill] > bestSkillValue) {
                    bestSkillValue = character.skills[skill];
                    bestSkill = skill;
                }
            }
            
            if (bestSkill) {
                // Format the skill name
                bestSkill = bestSkill.charAt(0).toUpperCase() + bestSkill.slice(1);
                skillDesc = `Best skill: ${bestSkill} (${bestSkillValue})`;
            }
            
            // Create card content
            card.innerHTML = `
                <h4>
                    ${character.name}
                    <span class="character-gender ${character.gender}">${character.gender === 'male' ? '♂' : '♀'}</span>
                </h4>
                <p>Age: ${Math.floor(character.age)} years</p>
                <p>Role: ${character.role.charAt(0).toUpperCase() + character.role.slice(1)}${character.isLeader ? ' (Leader)' : ''}</p>
                ${skillDesc ? `<p>${skillDesc}</p>` : ''}
                <div class="character-traits">
                    ${character.traits.map(trait => {
                        const isPositive = [
                            'Strong', 'Quick', 'Wise', 'Charismatic', 'Brave', 
                            'Cunning', 'Patient', 'Healthy'
                        ].includes(trait);
                        
                        return `<span class="character-trait ${isPositive ? 'trait-positive' : 'trait-negative'}">${trait}</span>`;
                    }).join('')}
                </div>
            `;
            
            charactersList.appendChild(card);
        });
        
        // Reapply active filter
        const activeFilter = document.querySelector('.character-filter-btn.active');
        if (activeFilter) {
            filterCharacters(activeFilter.dataset.filter);
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the statistics panel
         */
        init: function() {
            // Create panel
            createPanel();
            
            // Set up update interval
            updateTimer = setInterval(updatePanel, UPDATE_INTERVAL);
            
            // Do first update
            updatePanel();
            
            console.log("Statistics Panel initialized");
        },
        
        /**
         * Manually update the panel
         */
        update: function() {
            updatePanel();
        }
    };
})();
