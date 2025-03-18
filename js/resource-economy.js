/**
 * Viking Legacy - Resource Production & Consumption Panel
 * Provides detailed information about resource rates and projected changes
 */

const ResourceEconomyPanel = (function() {
    // Private variables
    let isPanelCreated = false;
    
    // Update frequency (in ms)
    const UPDATE_INTERVAL = 2000;
    
    // Update timer reference
    let updateTimer = null;
    
    // Track historical data for trends
    let resourceHistory = {
        timestamps: [],
        food: [],
        wood: [],
        stone: [],
        metal: []
    };
    
    // Max history entries to keep
    const MAX_HISTORY = 20;
    
    /**
     * Create the economy panel
     */
    function createPanel() {
        // Check if panel already exists
        if (document.getElementById('economy-panel')) {
            console.log("Economy panel already exists");
            return;
        }
        
        // Create panel container
        const economyPanel = document.createElement('div');
        economyPanel.className = 'economy-panel';
        economyPanel.id = 'economy-panel';
        
        // Create panel toggle button (for mobile)
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-economy-panel';
        toggleButton.className = 'toggle-panel-button';
        toggleButton.innerHTML = 'Resource Economy <span class="toggle-icon">▼</span>';
        toggleButton.addEventListener('click', function() {
            const panel = document.getElementById('economy-panel-content');
            if (panel) {
                panel.classList.toggle('collapsed');
                this.querySelector('.toggle-icon').textContent = 
                    panel.classList.contains('collapsed') ? '▼' : '▲';
            }
        });
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.id = 'economy-panel-content';
        contentDiv.className = 'economy-panel-content';
        
        // Populate with initial sections
        contentDiv.innerHTML = `
            <div class="stats-section">
                <h3>Resource Production & Consumption</h3>
                <div class="economy-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>Current</th>
                                <th>Production</th>
                                <th>Consumption</th>
                                <th>Net Change</th>
                                <th>Storage</th>
                            </tr>
                        </thead>
                        <tbody id="economy-table-body">
                            <!-- Data will be filled via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Production Breakdown</h3>
                <div class="breakdown-container">
                    <div class="breakdown-section">
                        <h4>Food Production</h4>
                        <div id="food-breakdown" class="production-breakdown"></div>
                    </div>
                    <div class="breakdown-section">
                        <h4>Wood Production</h4>
                        <div id="wood-breakdown" class="production-breakdown"></div>
                    </div>
                    <div class="breakdown-section">
                        <h4>Stone Production</h4>
                        <div id="stone-breakdown" class="production-breakdown"></div>
                    </div>
                    <div class="breakdown-section">
                        <h4>Metal Production</h4>
                        <div id="metal-breakdown" class="production-breakdown"></div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Resource Forecasts</h3>
                <div class="forecast-tabs">
                    <button class="forecast-tab active" data-days="7">7 Days</button>
                    <button class="forecast-tab" data-days="30">30 Days</button>
                    <button class="forecast-tab" data-days="90">Season (90 Days)</button>
                </div>
                <div id="resource-forecast-chart" class="forecast-chart">
                    <canvas id="forecast-chart-canvas" height="200"></canvas>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Resource Efficiency</h3>
                <div id="resource-efficiency">
                    <div class="efficiency-metric">
                        <div class="efficiency-label">Food per Worker</div>
                        <div class="efficiency-bar-container">
                            <div id="food-efficiency-bar" class="efficiency-bar"></div>
                            <div id="food-efficiency-value" class="efficiency-value">0</div>
                        </div>
                    </div>
                    <div class="efficiency-metric">
                        <div class="efficiency-label">Wood per Worker</div>
                        <div class="efficiency-bar-container">
                            <div id="wood-efficiency-bar" class="efficiency-bar"></div>
                            <div id="wood-efficiency-value" class="efficiency-value">0</div>
                        </div>
                    </div>
                    <div class="efficiency-metric">
                        <div class="efficiency-label">Stone per Worker</div>
                        <div class="efficiency-bar-container">
                            <div id="stone-efficiency-bar" class="efficiency-bar"></div>
                            <div id="stone-efficiency-value" class="efficiency-value">0</div>
                        </div>
                    </div>
                    <div class="efficiency-metric">
                        <div class="efficiency-label">Metal per Worker</div>
                        <div class="efficiency-bar-container">
                            <div id="metal-efficiency-bar" class="efficiency-bar"></div>
                            <div id="metal-efficiency-value" class="efficiency-value">0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Assemble the panel
        economyPanel.appendChild(toggleButton);
        economyPanel.appendChild(contentDiv);
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(economyPanel);
            
            // Setup event handlers
            setupForecastTabs();
            
            // Add CSS to document
            addStyles();
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('economy-panel', 'economy');
                
                // Add the new Economy tab to the navigation
                addEconomyTab();
            }
            
            isPanelCreated = true;
        } else {
            console.error("Could not find .game-content to add economy panel");
        }
    }
    
    /**
     * Add the Economy tab to the navigation
     */
    function addEconomyTab() {
        // Check if NavigationSystem exists
        if (typeof NavigationSystem === 'undefined') return;
        
        // First, check if the tab already exists
        const existingTab = document.querySelector('.nav-tab[data-tab="economy"]');
        if (existingTab) return; // Already exists
        
        // Get the navigation container
        const navContainer = document.getElementById('game-navigation');
        if (!navContainer) return;
        
        // Create the new tab
        const economyTab = document.createElement('div');
        economyTab.className = 'nav-tab';
        economyTab.dataset.tab = 'economy';
        economyTab.id = 'economy-tab';
        economyTab.innerHTML = `
            <span class="tab-icon">📊</span>
            <span class="tab-text">Economy</span>
        `;
        
        // Add click event listener
        economyTab.addEventListener('click', function() {
            NavigationSystem.switchToTab('economy');
        });
        
        // Append to navigation
        navContainer.appendChild(economyTab);
    }
    
    /**
     * Setup forecast tab event handlers
     */
    function setupForecastTabs() {
        const tabs = document.querySelectorAll('.forecast-tab');
        if (!tabs.length) return;
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Update forecast chart
                const days = parseInt(this.dataset.days, 10);
                updateForecastChart(days);
            });
        });
    }
    
    /**
     * Add CSS styles for the economy panel
     */
    function addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Economy Panel Styles */
            .economy-panel {
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
            
            .economy-panel-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            /* Resource Table Styles */
            .economy-table {
                width: 100%;
                overflow-x: auto;
            }
            
            .economy-table table {
                width: 100%;
                border-collapse: collapse;
                border-spacing: 0;
            }
            
            .economy-table th,
            .economy-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid #d7cbb9;
            }
            
            .economy-table th {
                background-color: #d7cbb9;
                font-weight: 600;
                color: #5d4037;
            }
            
            .economy-table tr:nth-child(even) {
                background-color: rgba(255, 255, 255, 0.3);
            }
            
            .economy-table tr:hover {
                background-color: rgba(255, 255, 255, 0.5);
            }
            
            .positive-value {
                color: #2e7d32;
                font-weight: 500;
            }
            
            .negative-value {
                color: #c62828;
                font-weight: 500;
            }
            
            /* Breakdown Section */
            .breakdown-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .breakdown-section h4 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #5d4037;
                border-bottom: 1px solid #d7cbb9;
                padding-bottom: 3px;
            }
            
            .production-breakdown {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 8px;
                background-color: #f7f0e3;
                border-radius: 4px;
                border-left: 3px solid #8b5d33;
            }
            
            .breakdown-item.farmers {
                border-left-color: #c62828;
            }
            
            .breakdown-item.woodcutters {
                border-left-color: #2e7d32;
            }
            
            .breakdown-item.miners {
                border-left-color: #5d4037;
            }
            
            .breakdown-item-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            .breakdown-item-value {
                font-weight: 600;
                color: #8b5d33;
            }
            
            /* Forecast Chart */
            .forecast-tabs {
                display: flex;
                margin-bottom: 10px;
                gap: 5px;
            }
            
            .forecast-tab {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .forecast-tab:hover {
                background-color: #c9ba9b;
            }
            
            .forecast-tab.active {
                background-color: #8b5d33;
                color: #fff;
                border: 1px solid #5d4037;
            }
            
            .forecast-chart {
                height: 200px;
                position: relative;
            }
            
            /* Efficiency Section */
            .efficiency-metric {
                margin-bottom: 12px;
            }
            
            .efficiency-label {
                font-weight: 500;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .efficiency-bar-container {
                height: 20px;
                background-color: #d7cbb9;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
                border: 1px solid #c9ba9b;
            }
            
            .efficiency-bar {
                height: 100%;
                background: linear-gradient(to right, #8b5d33, #a97c50);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .efficiency-bar.food {
                background: linear-gradient(to right, #c62828, #e53935);
            }
            
            .efficiency-bar.wood {
                background: linear-gradient(to right, #2e7d32, #4caf50);
            }
            
            .efficiency-bar.stone {
                background: linear-gradient(to right, #5d4037, #8d6e63);
            }
            
            .efficiency-bar.metal {
                background: linear-gradient(to right, #1565c0, #42a5f5);
            }
            
            .efficiency-value {
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
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .toggle-panel-button {
                    display: block;
                }
                
                .economy-panel-content.collapsed {
                    display: none;
                }
                
                .economy-panel-content {
                    grid-template-columns: 1fr;
                }
                
                .breakdown-container {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Update the economy panel with current data
     */
    function updatePanel() {
        if (!isPanelCreated) return;
        
        try {
            // Get current data
            const resources = ResourceManager.getResources();
            const productionRates = ResourceManager.getProductionRates();
            const storageCapacity = ResourceManager.getStorageCapacity();
            const population = PopulationManager.getPopulation();
            const workerAssignments = PopulationManager.getWorkerAssignments();
            
            // Calculate consumption rates
            const consumptionRates = {
                food: population.total * 1.0, // 1 food per person per day
                wood: 0,
                stone: 0,
                metal: 0
            };
            
            // Add maintenance costs from buildings
            if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getMonthlyMaintenance === 'function') {
                const maintenance = BuildingSystem.getMonthlyMaintenance();
                
                // Convert monthly costs to daily
                for (const resource in maintenance) {
                    if (consumptionRates.hasOwnProperty(resource)) {
                        consumptionRates[resource] += maintenance[resource] / 30;
                    }
                }
            }
            
            // Update economy table
            updateEconomyTable(resources, productionRates, consumptionRates, storageCapacity);
            
            // Update production breakdowns
            updateProductionBreakdowns(productionRates, workerAssignments);
            
            // Update resource efficiency
            updateResourceEfficiency(productionRates, workerAssignments);
            
            // Update historical data for forecast
            updateHistoricalData(resources, productionRates, consumptionRates);
            
            // Update forecast chart based on active tab
            const activeTab = document.querySelector('.forecast-tab.active');
            const forecastDays = activeTab ? parseInt(activeTab.dataset.days, 10) : 7;
            updateForecastChart(forecastDays);
            
        } catch (error) {
            console.error("Error updating economy panel:", error);
        }
    }
    
    /**
     * Update the economy table with current resource data
     */
    function updateEconomyTable(resources, productionRates, consumptionRates, storageCapacity) {
        const tableBody = document.getElementById('economy-table-body');
        if (!tableBody) return;
        
        // Calculate net change for each resource
        const netChange = {};
        for (const resource in productionRates) {
            netChange[resource] = productionRates[resource] - (consumptionRates[resource] || 0);
        }
        
        let html = '';
        
        // Add row for each main resource
        const mainResources = ['food', 'wood', 'stone', 'metal'];
        
        mainResources.forEach(resource => {
            const current = Math.floor(resources[resource] || 0);
            const production = productionRates[resource]?.toFixed(1) || '0.0';
            const consumption = consumptionRates[resource]?.toFixed(1) || '0.0';
            const net = netChange[resource]?.toFixed(1) || '0.0';
            const storage = storageCapacity[resource] || 'unlimited';
            const storagePercentage = storageCapacity[resource] ? 
                Math.min(100, (current / storageCapacity[resource] * 100)).toFixed(0) + '%' : 
                'N/A';
            
            html += `
                <tr class="resource-row ${resource}">
                    <td class="resource-name">${resource.charAt(0).toUpperCase() + resource.slice(1)}</td>
                    <td class="resource-current">${current}</td>
                    <td class="resource-production">${production}/day</td>
                    <td class="resource-consumption">${consumption}/day</td>
                    <td class="resource-net ${parseFloat(net) >= 0 ? 'positive-value' : 'negative-value'}">
                        ${net}/day
                    </td>
                    <td class="resource-storage">${current}/${storage} (${storagePercentage})</td>
                </tr>
            `;
        });
        
        // Add other resources if discovered
        for (const resource in resources) {
            if (mainResources.includes(resource) || resources[resource] <= 0) continue;
            
            const current = Math.floor(resources[resource]);
            const production = productionRates[resource]?.toFixed(1) || '0.0';
            const consumption = consumptionRates[resource]?.toFixed(1) || '0.0';
            const net = netChange[resource]?.toFixed(1) || '0.0';
            const storage = storageCapacity[resource] || 'unlimited';
            const storagePercentage = storageCapacity[resource] ? 
                Math.min(100, (current / storageCapacity[resource] * 100)).toFixed(0) + '%' : 
                'N/A';
            
            html += `
                <tr class="resource-row ${resource}">
                    <td class="resource-name">${resource.charAt(0).toUpperCase() + resource.slice(1)}</td>
                    <td class="resource-current">${current}</td>
                    <td class="resource-production">${production}/day</td>
                    <td class="resource-consumption">${consumption}/day</td>
                    <td class="resource-net ${parseFloat(net) >= 0 ? 'positive-value' : 'negative-value'}">
                        ${net}/day
                    </td>
                    <td class="resource-storage">${current}/${storage} (${storagePercentage})</td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    }
    
    /**
     * Update production breakdowns for each resource
     */
    function updateProductionBreakdowns(productionRates, workerAssignments) {
        // Update food breakdown
        const foodBreakdown = document.getElementById('food-breakdown');
        if (foodBreakdown) {
            let html = '';
            
            // Calculate per-worker production
            const foodPerFarmer = workerAssignments.farmers > 0 ? 
                productionRates.food / workerAssignments.farmers : 0;
            
            html += `
                <div class="breakdown-item farmers">
                    <span class="breakdown-item-label">Farmers (${workerAssignments.farmers})</span>
                    <span class="breakdown-item-value">${productionRates.food.toFixed(1)}/day</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-item-label">Per Farmer</span>
                    <span class="breakdown-item-value">${foodPerFarmer.toFixed(1)}/day</span>
                </div>
            `;
            
            foodBreakdown.innerHTML = html;
        }
        
        // Update wood breakdown
        const woodBreakdown = document.getElementById('wood-breakdown');
        if (woodBreakdown) {
            let html = '';
            
            // Calculate per-worker production
            const woodPerCutter = workerAssignments.woodcutters > 0 ? 
                productionRates.wood / workerAssignments.woodcutters : 0;
            
            html += `
                <div class="breakdown-item woodcutters">
                    <span class="breakdown-item-label">Woodcutters (${workerAssignments.woodcutters})</span>
                    <span class="breakdown-item-value">${productionRates.wood.toFixed(1)}/day</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-item-label">Per Woodcutter</span>
                    <span class="breakdown-item-value">${woodPerCutter.toFixed(1)}/day</span>
                </div>
            `;
            
            woodBreakdown.innerHTML = html;
        }
        
        // Update stone breakdown
        const stoneBreakdown = document.getElementById('stone-breakdown');
        if (stoneBreakdown) {
            let html = '';
            
            // Calculate per-worker production
            const stonePerMiner = workerAssignments.miners > 0 ? 
                productionRates.stone / workerAssignments.miners : 0;
            
            html += `
                <div class="breakdown-item miners">
                    <span class="breakdown-item-label">Miners (${workerAssignments.miners})</span>
                    <span class="breakdown-item-value">${productionRates.stone.toFixed(1)}/day</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-item-label">Per Miner</span>
                    <span class="breakdown-item-value">${stonePerMiner.toFixed(1)}/day</span>
                </div>
            `;
            
            stoneBreakdown.innerHTML = html;
        }
        
        // Update metal breakdown
        const metalBreakdown = document.getElementById('metal-breakdown');
        if (metalBreakdown) {
            let html = '';
            
            // Calculate per-worker production
            const metalPerMiner = workerAssignments.miners > 0 ? 
                productionRates.metal / workerAssignments.miners : 0;
            
            html += `
                <div class="breakdown-item miners">
                    <span class="breakdown-item-label">Miners (${workerAssignments.miners})</span>
                    <span class="breakdown-item-value">${productionRates.metal.toFixed(1)}/day</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-item-label">Per Miner</span>
                    <span class="breakdown-item-value">${metalPerMiner.toFixed(1)}/day</span>
                </div>
            `;
            
            metalBreakdown.innerHTML = html;
        }
    }
    
    /**
     * Update resource efficiency metrics
     */
    function updateResourceEfficiency(productionRates, workerAssignments) {
        // Calculate max theoretical values (used for scaling bars)
        const maxFoodPerFarmer = 30; // Based on farm building
        const maxWoodPerCutter = 10; // Based on sawmill
        const maxStonePerMiner = 5;  // Based on improved quarry
        const maxMetalPerMiner = 5;  // Based on improved mine
        
        // Calculate actual values
        const foodPerFarmer = workerAssignments.farmers > 0 ? 
            productionRates.food / workerAssignments.farmers : 0;
            
        const woodPerCutter = workerAssignments.woodcutters > 0 ? 
            productionRates.wood / workerAssignments.woodcutters : 0;
            
        const stonePerMiner = workerAssignments.miners > 0 ? 
            productionRates.stone / workerAssignments.miners : 0;
            
        const metalPerMiner = workerAssignments.miners > 0 ? 
            productionRates.metal / workerAssignments.miners : 0;
        
        // Update food efficiency
        const foodBar = document.getElementById('food-efficiency-bar');
        const foodValue = document.getElementById('food-efficiency-value');
        if (foodBar && foodValue) {
            foodBar.className = 'efficiency-bar food';
            foodBar.style.width = `${Math.min(100, (foodPerFarmer / maxFoodPerFarmer * 100))}%`;
            foodValue.textContent = `${foodPerFarmer.toFixed(1)}/day`;
        }
        
        // Update wood efficiency
        const woodBar = document.getElementById('wood-efficiency-bar');
        const woodValue = document.getElementById('wood-efficiency-value');
        if (woodBar && woodValue) {
            woodBar.className = 'efficiency-bar wood';
            woodBar.style.width = `${Math.min(100, (woodPerCutter / maxWoodPerCutter * 100))}%`;
            woodValue.textContent = `${woodPerCutter.toFixed(1)}/day`;
        }
        
        // Update stone efficiency
        const stoneBar = document.getElementById('stone-efficiency-bar');
        const stoneValue = document.getElementById('stone-efficiency-value');
        if (stoneBar && stoneValue) {
            stoneBar.className = 'efficiency-bar stone';
            stoneBar.style.width = `${Math.min(100, (stonePerMiner / maxStonePerMiner * 100))}%`;
            stoneValue.textContent = `${stonePerMiner.toFixed(1)}/day`;
        }
        
        // Update metal efficiency
        const metalBar = document.getElementById('metal-efficiency-bar');
        const metalValue = document.getElementById('metal-efficiency-value');
        if (metalBar && metalValue) {
            metalBar.className = 'efficiency-bar metal';
            metalBar.style.width = `${Math.min(100, (metalPerMiner / maxMetalPerMiner * 100))}%`;
            metalValue.textContent = `${metalPerMiner.toFixed(1)}/day`;
        }
    }
    
    /**
     * Update historical data for resource forecasting
     */
    function updateHistoricalData(resources, productionRates, consumptionRates) {
        // Add current timestamp
        resourceHistory.timestamps.push(Date.now());
        
        // Add resource values
        resourceHistory.food.push(resources.food || 0);
        resourceHistory.wood.push(resources.wood || 0);
        resourceHistory.stone.push(resources.stone || 0);
        resourceHistory.metal.push(resources.metal || 0);
        
        // Trim history if too long
        if (resourceHistory.timestamps.length > MAX_HISTORY) {
            resourceHistory.timestamps.shift();
            resourceHistory.food.shift();
            resourceHistory.wood.shift();
            resourceHistory.stone.shift();
            resourceHistory.metal.shift();
        }
    }
    
    /**
     * Update the forecast chart
     * @param {number} days - Number of days to forecast
     */
    function updateForecastChart(days) {
        const chartCanvas = document.getElementById('forecast-chart-canvas');
        if (!chartCanvas || typeof Chart === 'undefined') return;
        
        // Get current resources and rates
        const resources = ResourceManager.getResources();
        const productionRates = ResourceManager.getProductionRates();
        const storageCapacity = ResourceManager.getStorageCapacity();
        
        // Calculate consumption rates
        const population = PopulationManager.getPopulation();
        const consumptionRates = {
            food: population.total * 1.0, // 1 food per person per day
            wood: 0,
            stone: 0,
            metal: 0
        };
        
        // Add maintenance costs
        if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getMonthlyMaintenance === 'function') {
            const maintenance = BuildingSystem.getMonthlyMaintenance();
            
            // Convert monthly costs to daily
            for (const resource in maintenance) {
                if (consumptionRates.hasOwnProperty(resource)) {
                    consumptionRates[resource] += maintenance[resource] / 30;
                }
            }
        }
        
        // Calculate net change
        const netChange = {
            food: productionRates.food - consumptionRates.food,
            wood: productionRates.wood - consumptionRates.wood,
            stone: productionRates.stone - consumptionRates.stone,
            metal: productionRates.metal - consumptionRates.metal
        };
        
        // Generate forecast data
        const forecastDays = Array.from({ length: days }, (_, i) => i + 1);
        const forecastFood = [];
        const forecastWood = [];
        const forecastStone = [];
        const forecastMetal = [];
        
        // Start with current values
        let foodValue = resources.food || 0;
        let woodValue = resources.wood || 0;
        let stoneValue = resources.stone || 0;
        let metalValue = resources.metal || 0;
        
        // Project future values
        for (let i = 0; i < days; i++) {
            // Add daily net change
            foodValue += netChange.food;
            woodValue += netChange.wood;
            stoneValue += netChange.stone;
            metalValue += netChange.metal;
            
            // Apply storage limits
            if (storageCapacity.food) foodValue = Math.min(foodValue, storageCapacity.food);
            if (storageCapacity.wood) woodValue = Math.min(woodValue, storageCapacity.wood);
            if (storageCapacity.stone) stoneValue = Math.min(stoneValue, storageCapacity.stone);
            if (storageCapacity.metal) metalValue = Math.min(metalValue, storageCapacity.metal);
            
            // Ensure values don't go below zero
            foodValue = Math.max(0, foodValue);
            woodValue = Math.max(0, woodValue);
            stoneValue = Math.max(0, stoneValue);
            metalValue = Math.max(0, metalValue);
            
            // Add to forecast
            forecastFood.push(foodValue);
            forecastWood.push(woodValue);
            forecastStone.push(stoneValue);
            forecastMetal.push(metalValue);
        }
        
        // Destroy existing chart if any
        let forecastChart = Chart.getChart(chartCanvas);
        if (forecastChart) {
            forecastChart.destroy();
        }
        
        // Create new chart
        forecastChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: forecastDays.map(day => `Day ${day}`),
                datasets: [
                    {
                        label: 'Food',
                        data: forecastFood,
                        borderColor: '#c62828',
                        backgroundColor: 'rgba(198, 40, 40, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Wood',
                        data: forecastWood,
                        borderColor: '#2e7d32',
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Stone',
                        data: forecastStone,
                        borderColor: '#5d4037',
                        backgroundColor: 'rgba(93, 64, 55, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Metal',
                        data: forecastMetal,
                        borderColor: '#1565c0',
                        backgroundColor: 'rgba(21, 101, 192, 0.1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: `${days}-Day Resource Forecast`,
                        color: '#5d4037'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Resources'
                        },
                        min: 0
                    }
                }
            }
        });
    }
    
    // Public API
    return {
        /**
         * Initialize the economy panel
         */
        init: function() {
            // Create panel
            createPanel();
            
            // Set up update interval
            updateTimer = setInterval(updatePanel, UPDATE_INTERVAL);
            
            // Do first update
            updatePanel();
            
            console.log("Resource Economy Panel initialized");
        },
        
        /**
         * Manually update the panel
         */
        update: function() {
            updatePanel();
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Wait for other systems to initialize first
        ResourceEconomyPanel.init();
    }, 1000);
});