/**
 * Viking Legacy - Worker Utilization Panel
 * Visualizes population allocation across different buildings and jobs
 * Now with manual worker allocation via sliders
 */

const WorkerUtilizationPanel = (function() {
    // Private variables
    let isPanelCreated = false;
    
    // Update frequency (in ms)
    const UPDATE_INTERVAL = 2000;
    
    // Update timer reference
    let updateTimer = null;
    
    // Track historical data for trends
    let workerHistory = {
        timestamps: [],
        farmers: [],
        woodcutters: [],
        miners: [],
        hunters: [],
        crafters: [],
        gatherers: [],
        thralls: [],
        fishermen: [],
        unassigned: []

    };
    
    // Track building counts by type for detailed breakdown
    let buildingCounts = {};
    
    // Max history entries to keep (for trends)
    const MAX_HISTORY = 20;
    
    // Track current worker assignments for slider initialization
    let currentAssignments = {};
    
    // Private methods
    
    /**
     * Create the worker utilization panel
     */
    function createPanel() {
        // Check if panel already exists
        if (document.getElementById('worker-panel')) {
            console.log("Worker utilization panel already exists");
            return;
        }
        
        // Create panel container
        const workerPanel = document.createElement('div');
        workerPanel.className = 'worker-panel';
        workerPanel.id = 'worker-panel';
        
        // Create panel toggle button (for mobile)
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-worker-panel';
        toggleButton.className = 'toggle-panel-button';
        toggleButton.innerHTML = 'Worker Utilization <span class="toggle-icon">▼</span>';
        toggleButton.addEventListener('click', function() {
            const panel = document.getElementById('worker-panel-content');
            if (panel) {
                panel.classList.toggle('collapsed');
                this.querySelector('.toggle-icon').textContent = 
                    panel.classList.contains('collapsed') ? '▼' : '▲';
            }
        });
        
        // Create content container (can be collapsed on mobile)
        const contentDiv = document.createElement('div');
        contentDiv.id = 'worker-panel-content';
        contentDiv.className = 'worker-panel-content';
        
        // Populate with initial sections
        contentDiv.innerHTML = `
            <div class="stats-section">
                <h3>Population Overview</h3>
                <div class="stat-row">
                    <div class="stat-label">Total Population:</div>
                    <div class="stat-value" id="wu-population-total">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Available Workers:</div>
                    <div class="stat-value" id="wu-population-workers">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Employed Workers:</div>
                    <div class="stat-value" id="wu-employed-workers">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Unemployed Workers:</div>
                    <div class="stat-value" id="wu-unemployed-workers">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Children (Future Workers):</div>
                    <div class="stat-value" id="wu-population-children">0</div>
                </div>
                <div class="stat-progress">
                    <div class="progress-label">Worker Utilization:</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="wu-utilization-bar"></div>
                        <div class="progress-text" id="wu-utilization-percentage">0%</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Manual Worker Assignment</h3>
                <div class="worker-assignment-info">
                    <p>Drag the sliders to allocate workers to different jobs.</p>
                    <div class="stat-row highlight-row">
                        <div class="stat-label">Unassigned Workers:</div>
                        <div class="stat-value" id="slider-unassigned-workers">0</div>
                    </div>
                </div>
                <div id="worker-sliders">
                    <!-- Worker sliders will be added here -->
                </div>
                <div class="worker-buttons">
                    <button id="reset-workers-btn" class="worker-control-btn">Reset Assignments</button>
                    <button id="optimize-workers-btn" class="worker-control-btn">Auto-Optimize</button>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Building Capacity</h3>
                <div id="building-capacity"></div>
            </div>
            
            <div class="stats-section">
                <h3>Worker Productivity</h3>
                <div id="worker-productivity"></div>
            </div>
            
            <div class="stats-section">
                <h3>Recent Trends</h3>
                <div class="worker-trends-controls">
                    <button class="trend-view-btn active" data-view="absolute">Absolute Numbers</button>
                    <button class="trend-view-btn" data-view="percentage">Percentage</button>
                </div>
                <div id="worker-trends">
                    <canvas id="worker-trends-chart" height="200"></canvas>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Detailed Breakdown</h3>
                <div id="building-breakdown"></div>
            </div>
        `;
        
        // Assemble the panel
        workerPanel.appendChild(toggleButton);
        workerPanel.appendChild(contentDiv);
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(workerPanel);
            
            // Setup event handlers for trend view toggling
            setupTrendViewToggle();
            
            // Add CSS to document
            addStyles();
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('worker-panel', 'workers');
            }
            
            // Setup worker control buttons
            setupWorkerControlButtons();
            
            isPanelCreated = true;
        } else {
            console.error("Could not find .game-content to add worker utilization panel");
        }
    }
    
    /**
     * Set up event handlers for trend view toggle buttons
     */
    function setupTrendViewToggle() {
        const viewButtons = document.querySelectorAll('.trend-view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                viewButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update trend chart
                const viewType = this.dataset.view;
                updateTrendChart(viewType);
            });
        });
    }
    
    /**
     * Setup worker control buttons
     */
    function setupWorkerControlButtons() {
        const resetButton = document.getElementById('reset-workers-btn');
        if (resetButton) {
            resetButton.addEventListener('click', resetWorkerAssignments);
        }
        
        const optimizeButton = document.getElementById('optimize-workers-btn');
        if (optimizeButton) {
            optimizeButton.addEventListener('click', optimizeWorkerAssignments);
        }
    }
    
    /**
     * Reset all worker assignments to zero
     */
    function resetWorkerAssignments() {
        // Get all worker sliders
        const sliders = document.querySelectorAll('.worker-slider');
        
        // Reset each slider to zero
        sliders.forEach(slider => {
            slider.value = 0;
            
            // Trigger change event to update assignments
            const event = new Event('input');
            slider.dispatchEvent(event);
        });
        
        Utils.log("All workers have been unassigned.", "important");
    }
    
    /**
     * Auto-optimize worker assignments based on available jobs and priorities
     */
    function optimizeWorkerAssignments() {
        // Get building capacities for each worker type
        const capacity = BuildingSystem.getAvailableCapacity();
        
        // Get total available workers
        const population = PopulationManager.getPopulation();
        const totalWorkers = population.workers;
        
        // Simple priority: Farmers > Woodcutters > Miners > Others
        // This is a basic algorithm and can be improved
        
        // Reset all assignments first
        resetWorkerAssignments();
        
        // Calculate optimal assignments
        let remainingWorkers = totalWorkers;
        const assignments = {};
        
        // Assign farmers first (for food)
        const farmerSlider = document.getElementById('slider-farmers');
        if (farmerSlider && capacity.farmers > 0) {
            const optimalFarmers = Math.min(capacity.farmers, Math.ceil(remainingWorkers * 0.4)); // 40% of workforce
            assignments.farmers = optimalFarmers;
            remainingWorkers -= optimalFarmers;
            farmerSlider.value = optimalFarmers;
            
            // Trigger change event
            const event = new Event('input');
            farmerSlider.dispatchEvent(event);
        }
        
        // Assign woodcutters next
        const woodcutterSlider = document.getElementById('slider-woodcutters');
        if (woodcutterSlider && capacity.woodcutters > 0 && remainingWorkers > 0) {
            const optimalWoodcutters = Math.min(capacity.woodcutters, Math.ceil(remainingWorkers * 0.4)); // 40% of remaining
            assignments.woodcutters = optimalWoodcutters;
            remainingWorkers -= optimalWoodcutters;
            woodcutterSlider.value = optimalWoodcutters;
            
            // Trigger change event
            const event = new Event('input');
            woodcutterSlider.dispatchEvent(event);
        }
        
        // Assign miners next
        const minerSlider = document.getElementById('slider-miners');
        if (minerSlider && capacity.miners > 0 && remainingWorkers > 0) {
            const optimalMiners = Math.min(capacity.miners, remainingWorkers);
            assignments.miners = optimalMiners;
            remainingWorkers -= optimalMiners;
            minerSlider.value = optimalMiners;
            
            // Trigger change event
            const event = new Event('input');
            minerSlider.dispatchEvent(event);
        }
        
        // Assign specialized workers if there are any left
        const specializedTypes = ['hunters', 'crafters', 'gatherers', "fishermen"];
        for (const type of specializedTypes) {
            const slider = document.getElementById(`slider-${type}`);
            if (slider && capacity[type] > 0 && remainingWorkers > 0) {
                const optimalWorkers = Math.min(capacity[type], Math.floor(remainingWorkers / specializedTypes.length));
                assignments[type] = optimalWorkers;
                remainingWorkers -= optimalWorkers;
                slider.value = optimalWorkers;
                
                // Trigger change event
                const event = new Event('input');
                slider.dispatchEvent(event);
            }
        }
        
        Utils.log("Workers have been automatically assigned based on priorities.", "success");
    }
    
    /**
     * Add CSS styles for the worker utilization panel
     */
    function addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Worker Utilization Panel */
            .worker-panel {
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
            
            .worker-panel-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            /* Worker Assignment Sliders */
            .worker-assignment-info {
                margin-bottom: 15px;
            }
            
            .highlight-row {
                background-color: #f7f0e3;
                padding: 8px;
                border-radius: 4px;
                border-left: 4px solid #ffc107;
            }
            
            .worker-slider-container {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f7f0e3;
                border-radius: 6px;
                border-left: 4px solid #8b5d33;
            }
            
            .worker-slider-container.farmers {
                border-left-color: #c62828; /* Red for farmers */
            }
            
            .worker-slider-container.woodcutters {
                border-left-color: #2e7d32; /* Green for woodcutters */
            }
            
            .worker-slider-container.miners {
                border-left-color: #5d4037; /* Brown for miners */
            }
            
            .worker-slider-container.hunters {
                border-left-color: #795548; /* Brown for hunters */
            }
            
            .worker-slider-container.crafters {
                border-left-color: #6a1b9a; /* Purple for crafters */
            }
            
            .worker-slider-container.gatherers {
                border-left-color: #00695c; /* Teal for gatherers */
            }
            
            .worker-slider-container.thralls {
                border-left-color: #c62828; /* Red for thralls */
            }
            
            .worker-slider-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .worker-type-label {
                font-weight: 600;
                color: #5d4037;
            }
            
            .worker-count-display {
                color: #8b5d33;
                font-weight: 500;
            }
            
            .worker-slider {
                width: 100%;
                margin: 10px 0;
                height: 10px;
                -webkit-appearance: none;
                appearance: none;
                background: #d7cbb9;
                border-radius: 5px;
                outline: none;
            }
            
            .worker-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #8b5d33;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .worker-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #8b5d33;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .worker-slider::-webkit-slider-thumb:hover {
                background: #a97c50;
            }
            
            .worker-slider.farmers::-webkit-slider-thumb {
                background: #c62828;
            }
            
            .worker-slider.woodcutters::-webkit-slider-thumb {
                background: #2e7d32;
            }
            
            .worker-slider.miners::-webkit-slider-thumb {
                background: #5d4037;
            }
            
            .worker-slider.hunters::-webkit-slider-thumb {
                background: #795548;
            }
            
            .worker-slider.crafters::-webkit-slider-thumb {
                background: #6a1b9a;
            }
            
            .worker-slider.gatherers::-webkit-slider-thumb {
                background: #00695c;
            }

            .worker-slider.fishermen::-webkit-slider-thumb {
                background:rgb(22, 0, 150);
            }
            
            .worker-slider.thralls::-webkit-slider-thumb {
                background: #c62828;
            }
            
            .worker-slider-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
                font-size: 0.8rem;
                color: #8b7355;
            }
            
            .capacity-label {
                display: block;
                margin-top: 5px;
                font-size: 0.85rem;
                color: #8b7355;
            }
            
            .worker-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .worker-control-btn {
                flex: 1;
                padding: 8px 12px;
                background: linear-gradient(to bottom, #8b5d33, #6d4c2a);
                color: #f7f0e3;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border: 1px solid #5d4027;
            }
            
            .worker-control-btn:hover {
                background: linear-gradient(to bottom, #a97c50, #8b5d33);
                transform: translateY(-1px);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
            }
            
            .worker-distribution-item {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 8px 12px;
                background-color: #fbf7f0;
                border-radius: 4px;
                border-left: 4px solid #8b5d33;
            }
            
            .worker-distribution-item.farmers {
                border-left-color: #c62828; /* Red for farmers */
            }
            
            .worker-distribution-item.woodcutters {
                border-left-color: #2e7d32; /* Green for woodcutters */
            }
            
            .worker-distribution-item.miners {
                border-left-color: #5d4037; /* Brown for miners */
            }
            
            .worker-distribution-item.hunters {
                border-left-color: #795548; /* Brown for hunters */
            }
            
            .worker-distribution-item.crafters {
                border-left-color: #6a1b9a; /* Purple for crafters */
            }
            
            .worker-distribution-item.gatherers {
                border-left-color: #00695c; /* Teal for gatherers */
            }
            
            .worker-distribution-item.thralls {
                border-left-color: #c62828; /* Red for thralls */
            }
            
            .worker-distribution-item.unassigned {
                border-left-color: #ffc107; /* Yellow for unassigned */
                background-color: #fff8e1;
            }
            
            .worker-type {
                width: 120px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .worker-count {
                margin-left: auto;
                font-weight: 600;
                color: #8b5d33;
            }
            
            .worker-capacity {
                margin-left: 15px;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .building-capacity-item {
                margin-bottom: 10px;
            }
            
            .building-capacity-item h4 {
                margin: 0 0 5px 0;
                font-size: 1rem;
                color: #5d4037;
            }
            
            .capacity-bar-container {
                height: 10px;
                background-color: #d7cbb9;
                border-radius: 5px;
                position: relative;
                overflow: hidden;
                margin-bottom: 2px;
            }
            
            .capacity-bar {
                height: 100%;
                background: linear-gradient(to right, #8b5d33, #a97c50);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .capacity-bar.farmers {
                background: linear-gradient(to right, #c62828, #e53935);
            }
            
            .capacity-bar.woodcutters {
                background: linear-gradient(to right, #2e7d32, #4caf50);
            }
            
            .capacity-bar.miners {
                background: linear-gradient(to right, #5d4037, #8d6e63);
            }
            
            .capacity-bar.hunters {
                background: linear-gradient(to right, #795548, #a1887f);
            }
            
            .capacity-bar.crafters {
                background: linear-gradient(to right, #6a1b9a, #9c27b0);
            }
            
            .capacity-bar.gatherers {
                background: linear-gradient(to right, #00695c, #009688);
            }
            
            .capacity-bar.thralls {
                background: linear-gradient(to right, #c62828, #e53935);
            }
            
            .capacity-text {
                font-size: 0.8rem;
                color: #5d4037;
            }
            
            .productivity-item {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 8px 12px;
                background-color: #fbf7f0;
                border-radius: 4px;
                border-left: 4px solid #8b5d33;
            }
            
            .productivity-item.farmers {
                border-left-color: #c62828;
            }
            
            .productivity-item.woodcutters {
                border-left-color: #2e7d32;
            }
            
            .productivity-item.miners {
                border-left-color: #5d4037;
            }
            
            .productivity-item.hunters {
                border-left-color: #795548;
            }
            
            .productivity-item.crafters {
                border-left-color: #6a1b9a;
            }
            
            .productivity-item.gatherers {
                border-left-color: #00695c;
            }
            
            .productivity-label {
                width: 120px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .productivity-value {
                margin-left: auto;
                font-weight: 600;
                color: #8b5d33;
            }
            
            .worker-trends-controls {
                display: flex;
                margin-bottom: 10px;
                gap: 5px;
            }
            
            .trend-view-btn {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .trend-view-btn:hover {
                background-color: #c9ba9b;
            }
            
            .trend-view-btn.active {
                background-color: #8b5d33;
                color: #fff;
                border: 1px solid #5d4037;
            }
            
            #worker-trends {
                height: 200px;
                position: relative;
            }
            
            .building-breakdown-item {
                margin-bottom: 15px;
            }
            
            .building-breakdown-item h4 {
                margin: 0 0 5px 0;
                font-size: 1rem;
                color: #5d4037;
                border-bottom: 1px solid #d7cbb9;
                padding-bottom: 3px;
            }
            
            .building-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px;
            }
            
            .building-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 8px;
                background-color: #fbf7f0;
                border-radius: 4px;
                border-left: 3px solid #8b5d33;
            }
            
            .building-name {
                font-weight: 500;
            }
            
            .building-worker-count {
                font-weight: 600;
                color: #8b5d33;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .toggle-panel-button {
                    display: block;
                }
                
                .worker-panel-content.collapsed {
                    display: none;
                }
                
                .worker-panel-content {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Create worker assignment sliders for each job type
     */
    function createWorkerSliders() {
        const slidersContainer = document.getElementById('worker-sliders');
        if (!slidersContainer) return;
        
        // Clear existing sliders
        slidersContainer.innerHTML = '';
        
        // Get capacity for each worker type
        const capacity = BuildingSystem.getAvailableCapacity();
        
        // Get current assignments
        const assignments = PopulationManager.getWorkerAssignments();
        
        // Get total available workers
        const population = PopulationManager.getPopulation();
        const totalWorkers = population.workers;
        
        // Track currently assigned workers for slider limits
        currentAssignments = {...assignments};
        let totalAssigned = 0;
        for (const type in currentAssignments) {
            if (type !== 'unassigned') {
                totalAssigned += currentAssignments[type] || 0;
            }
        }
        currentAssignments.unassigned = totalWorkers - totalAssigned;
        
        // Update unassigned count display
        Utils.updateElement('slider-unassigned-workers', currentAssignments.unassigned);
        
        // Worker types to create sliders for
        const workerTypes = [
            { key: 'farmers', label: 'Farmers', description: 'Work farms to produce food' },
            { key: 'woodcutters', label: 'Woodcutters', description: 'Harvest wood from forests' },
            { key: 'miners', label: 'Miners', description: 'Extract stone and metal from mines' },
            { key: 'hunters', label: 'Hunters', description: 'Hunt for food and animal products' },
            { key: 'crafters', label: 'Crafters', description: 'Create goods and tools' },
            { key: 'gatherers', label: 'Gatherers', description: 'Collect herbs and resources' },
            { key: 'fishermen', label: 'Fishermen', description: 'Fish the local water locations for food.'},
            { key: 'thralls', label: 'Thralls', description: 'Forced laborers (captured in raids)' }
        ];
        
        // Create slider for each worker type (if capacity exists)
        workerTypes.forEach(type => {
            // Skip types with no capacity
            if ((capacity[type.key] || 0) === 0) return;
            
            // Create slider container
            const sliderContainer = document.createElement('div');
            sliderContainer.className = `worker-slider-container ${type.key}`;
            
            // Create slider header with label and count
            const sliderHeader = document.createElement('div');
            sliderHeader.className = 'worker-slider-header';
            sliderHeader.innerHTML = `
                <div class="worker-type-label">${type.label}</div>
                <div class="worker-count-display">
                    <span id="slider-${type.key}-count">${assignments[type.key] || 0}</span>
                    <span class="count-sep">/</span>
                    <span id="slider-${type.key}-capacity">${capacity[type.key] || 0}</span>
                </div>
            `;
            
            // Create slider element
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = `worker-slider ${type.key}`;
            slider.id = `slider-${type.key}`;
            slider.min = 0;
            slider.max = Math.min(capacity[type.key] || 0, totalWorkers);
            slider.value = assignments[type.key] || 0;
            
            // Create slider labels
            const sliderLabels = document.createElement('div');
            sliderLabels.className = 'worker-slider-labels';
            sliderLabels.innerHTML = `
                <span>0</span>
                <span>${slider.max}</span>
            `;
            
            // Create capacity label
            const capacityLabel = document.createElement('div');
            capacityLabel.className = 'capacity-label';
            capacityLabel.innerHTML = `${type.description}`;
            
            // Add event listener to update worker assignments
            slider.addEventListener('input', function() {
                const newValue = parseInt(this.value);
                const oldValue = currentAssignments[type.key] || 0;
                const change = newValue - oldValue;
                
                // Check if we have enough unassigned workers
                if (change > 0 && currentAssignments.unassigned < change) {
                    // Not enough unassigned workers, revert to previous value
                    this.value = oldValue;
                    return;
                }
                
                // Update current assignments
                currentAssignments[type.key] = newValue;
                currentAssignments.unassigned -= change;
                
                // Update displays
                Utils.updateElement(`slider-${type.key}-count`, newValue);
                Utils.updateElement('slider-unassigned-workers', currentAssignments.unassigned);
                
                // Update worker assignments in game
                PopulationManager.assignWorkers(type.key, change);
                
                // Update resource production rates
                ResourceManager.updateProductionRates(PopulationManager.getWorkerAssignments());
            });
            
            // Assemble slider container
            sliderContainer.appendChild(sliderHeader);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(sliderLabels);
            sliderContainer.appendChild(capacityLabel);
            
            // Add to sliders container
            slidersContainer.appendChild(sliderContainer);
        });
    }
    
    /**
     * Update the panel with current worker data
     */
    function updatePanel() {
        if (!isPanelCreated) return;
        
        try {
            // Get current data
            const population = PopulationManager.getPopulation();
            const assignments = PopulationManager.getWorkerAssignments();
            const capacity = typeof BuildingSystem !== 'undefined' && BuildingSystem.getAvailableCapacity ? 
                             BuildingSystem.getAvailableCapacity() : {};
            const unassigned = PopulationManager.getUnassignedWorkers();
            const productionRates = ResourceManager.getProductionRates();
            const buildings = typeof BuildingSystem !== 'undefined' && BuildingSystem.getBuildingData ? 
                              BuildingSystem.getBuildingData() : { built: {} };
            
            // Calculate total employed workers
            const employedWorkers = calculateEmployedWorkers(assignments);
            
            // Update population overview
            updatePopulationOverview(population, employedWorkers, unassigned);
            
            // Update or create worker sliders if needed
            createWorkerSliders();
            
            // Update building capacity
            updateBuildingCapacity(assignments, capacity);
            
            // Update worker productivity
            updateWorkerProductivity(assignments, productionRates);
            
            // Update historical data for trends
            updateHistoricalData(assignments, unassigned);
            
            // Update trend chart
            const activeView = document.querySelector('.trend-view-btn.active');
            const viewType = activeView ? activeView.dataset.view : 'absolute';
            updateTrendChart(viewType);
            
            // Update building breakdown
            updateBuildingBreakdown(buildings);
        } catch (error) {
            console.error("Error updating worker utilization panel:", error);
        }
    }
    
    /**
     * Calculate total employed workers
     * @param {Object} assignments - Worker assignments by type
     * @returns {number} - Total employed workers
     */
    function calculateEmployedWorkers(assignments) {
        return (
            assignments.farmers +
            assignments.woodcutters + 
            assignments.miners +
            (assignments.hunters || 0) + 
            (assignments.crafters || 0) + 
            (assignments.gatherers || 0) +
            (assignments.fishermen || 0) +
            (assignments.thralls || 0)
        );
    }
    
    /**
     * Update population overview section
     * @param {Object} population - Population data
     * @param {number} employedWorkers - Number of employed workers
     * @param {number} unassigned - Number of unassigned workers
     */
    function updatePopulationOverview(population, employedWorkers, unassigned) {
        Utils.updateElement('wu-population-total', population.total);
        Utils.updateElement('wu-population-workers', population.workers);
        Utils.updateElement('wu-employed-workers', employedWorkers);
        Utils.updateElement('wu-unemployed-workers', unassigned);
        Utils.updateElement('wu-population-children', population.children);
        
        // Update worker utilization bar
        const utilizationRate = population.workers > 0 ? 
            (employedWorkers / population.workers * 100) : 0;
        
        const utilizationBar = document.getElementById('wu-utilization-bar');
        if (utilizationBar) {
            utilizationBar.style.width = `${utilizationRate}%`;
            
            // Change color based on utilization
            if (utilizationRate < 50) {
                utilizationBar.style.background = 'linear-gradient(to right, #c62828, #e53935)'; // Red - low utilization
            } else if (utilizationRate < 80) {
                utilizationBar.style.background = 'linear-gradient(to right, #ef6c00, #ff9800)'; // Orange - medium utilization
            } else {
                utilizationBar.style.background = 'linear-gradient(to right, #2e7d32, #4caf50)'; // Green - high utilization
            }
        }
        
        Utils.updateElement('wu-utilization-percentage', `${Math.round(utilizationRate)}%`);
    }
    
    /**
     * Update building capacity section
     * @param {Object} assignments - Worker assignments by type
     * @param {Object} capacity - Building capacity by worker type
     */
    function updateBuildingCapacity(assignments, capacity) {
        const capacityElement = document.getElementById('building-capacity');
        if (!capacityElement) return;
        
        // Create capacity bars
        let capacityHTML = '';
        
        // Add each worker type
        const workerTypes = [
            { key: 'farmers', label: 'Farming Capacity' },
            { key: 'woodcutters', label: 'Woodcutting Capacity' },
            { key: 'miners', label: 'Mining Capacity' },
            { key: 'hunters', label: 'Hunting Capacity' },
            { key: 'crafters', label: 'Crafting Capacity' },
            { key: 'gatherers', label: 'Gathering Capacity' },
            { key: 'fishermen', label: 'Fishing Capacity' },
            { key: 'thralls', label: 'Thrall Capacity' }
        ];
        
        workerTypes.forEach(type => {
            // Skip types with no capacity
            if ((capacity[type.key] || 0) === 0) return;
            
            const currentWorkers = assignments[type.key] || 0;
            const maxWorkers = capacity[type.key] || 0;
            const percentage = maxWorkers > 0 ? (currentWorkers / maxWorkers * 100) : 0;
            
            capacityHTML += `
                <div class="building-capacity-item">
                    <h4>${type.label}</h4>
                    <div class="capacity-bar-container">
                        <div class="capacity-bar ${type.key}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="capacity-text">${currentWorkers} / ${maxWorkers} workers (${Math.round(percentage)}%)</div>
                </div>
            `;
        });
        
        capacityElement.innerHTML = capacityHTML;
    }
    
    /**
     * Update worker productivity section
     * @param {Object} assignments - Worker assignments by type
     * @param {Object} productionRates - Production rates by resource
     */
    function updateWorkerProductivity(assignments, productionRates) {
        const productivityElement = document.getElementById('worker-productivity');
        if (!productivityElement) return;
        
        // Create productivity items
        let productivityHTML = '';
        
        // Calculate per-worker productivity
        const foodPerFarmer = assignments.farmers > 0 ? 
            (productionRates.food / assignments.farmers).toFixed(1) : '0.0';
            
        const woodPerWoodcutter = assignments.woodcutters > 0 ? 
            (productionRates.wood / assignments.woodcutters).toFixed(1) : '0.0';
            
        const stonePerMiner = assignments.miners > 0 ? 
            (productionRates.stone / assignments.miners).toFixed(1) : '0.0';
            
        const metalPerMiner = assignments.miners > 0 ? 
            (productionRates.metal / assignments.miners).toFixed(1) : '0.0';
        
        // Add productivity items
        productivityHTML += `
            <div class="productivity-item farmers">
                <div class="productivity-label">Food per Farmer:</div>
                <div class="productivity-value">${foodPerFarmer}</div>
            </div>
            <div class="productivity-item woodcutters">
                <div class="productivity-label">Wood per Cutter:</div>
                <div class="productivity-value">${woodPerWoodcutter}</div>
            </div>
            <div class="productivity-item miners">
                <div class="productivity-label">Stone per Miner:</div>
                <div class="productivity-value">${stonePerMiner}</div>
            </div>
            <div class="productivity-item miners">
                <div class="productivity-label">Metal per Miner:</div>
                <div class="productivity-value">${metalPerMiner}</div>
            </div>
        `;
        
        // Add specialized productivity if available
        if (assignments.hunters > 0 && productionRates.leather) {
            const leatherPerHunter = (productionRates.leather / assignments.hunters).toFixed(1);
            productivityHTML += `
                <div class="productivity-item hunters">
                    <div class="productivity-label">Leather per Hunter:</div>
                    <div class="productivity-value">${leatherPerHunter}</div>
                </div>
            `;
        }
        
        if (assignments.crafters > 0 && productionRates.cloth) {
            const clothPerCrafter = (productionRates.cloth / assignments.crafters).toFixed(1);
            productivityHTML += `
                <div class="productivity-item crafters">
                    <div class="productivity-label">Cloth per Crafter:</div>
                    <div class="productivity-value">${clothPerCrafter}</div>
                </div>
            `;
        }
        
        productivityElement.innerHTML = productivityHTML;
    }
    
    /**
     * Update historical data for worker trends
     * @param {Object} assignments - Worker assignments by type
     * @param {number} unassigned - Number of unassigned workers
     */
    function updateHistoricalData(assignments, unassigned) {
        // Add current timestamp (simplified - just use entry count)
        workerHistory.timestamps.push(workerHistory.timestamps.length);
        
        // Add worker counts
        workerHistory.farmers.push(assignments.farmers || 0);
        workerHistory.woodcutters.push(assignments.woodcutters || 0);
        workerHistory.miners.push(assignments.miners || 0);
        workerHistory.hunters.push(assignments.hunters || 0);
        workerHistory.crafters.push(assignments.crafters || 0);
        workerHistory.gatherers.push(assignments.gatherers || 0);
        workerHistory.thralls.push(assignments.thralls || 0);
        workerHistory.fishermen.push(assignments.fishermen || 0);
        workerHistory.unassigned.push(unassigned || 0);
        
        // Trim history if too long
        if (workerHistory.timestamps.length > MAX_HISTORY) {
            workerHistory.timestamps.shift();
            workerHistory.farmers.shift();
            workerHistory.woodcutters.shift();
            workerHistory.miners.shift();
            workerHistory.hunters.shift();
            workerHistory.crafters.shift();
            workerHistory.gatherers.shift();
            workerHistory.fishermen.shift();
            workerHistory.thralls.shift();
            workerHistory.unassigned.shift();
        }
    }
    
    /**
     * Update trend chart with historical data
     * @param {string} viewType - Chart view type ('absolute' or 'percentage')
     */
    function updateTrendChart(viewType) {
        const chartCanvas = document.getElementById('worker-trends-chart');
        if (!chartCanvas || typeof Chart === 'undefined') return;
        
        // Check if we have enough data
        if (workerHistory.timestamps.length < 2) return;
        
        // Destroy existing chart if any
        let trendChart = Chart.getChart(chartCanvas);
        if (trendChart) {
            trendChart.destroy();
        }
        
        // Prepare data based on view type
        let datasets = [];
        
        if (viewType === 'absolute') {
            // Show absolute numbers
            datasets = [
                {
                    label: 'Farmers',
                    data: workerHistory.farmers,
                    borderColor: '#c62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Woodcutters',
                    data: workerHistory.woodcutters,
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Miners',
                    data: workerHistory.miners,
                    borderColor: '#5d4037',
                    backgroundColor: 'rgba(93, 64, 55, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Unassigned',
                    data: workerHistory.unassigned,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.1,
                    fill: true
                }
            ];
            
            // Add specialized workers if they exist
            if (Math.max(...workerHistory.hunters) > 0) {
                datasets.push({
                    label: 'Hunters',
                    data: workerHistory.hunters,
                    borderColor: '#795548',
                    backgroundColor: 'rgba(121, 85, 72, 0.1)',
                    tension: 0.1,
                    fill: true
                });
            }

            if (Math.max(...workerHistory.fishermen) > 0) {
                datasets.push({
                    label: 'Fishermen',
                    data: workerHistory.fishermen,
                    borderColor: '#795548',
                    backgroundColor: 'rgba(27, 7, 206, 0.83)',
                    tension: 0.1,
                    fill: true
                });
            }
            
            if (Math.max(...workerHistory.crafters) > 0) {
                datasets.push({
                    label: 'Crafters',
                    data: workerHistory.crafters,
                    borderColor: '#6a1b9a',
                    backgroundColor: 'rgba(106, 27, 154, 0.1)',
                    tension: 0.1,
                    fill: true
                });
            }
            
            if (Math.max(...workerHistory.gatherers) > 0) {
                datasets.push({
                    label: 'Gatherers',
                    data: workerHistory.gatherers,
                    borderColor: '#00695c',
                    backgroundColor: 'rgba(0, 105, 92, 0.1)',
                    tension: 0.1,
                    fill: true
                });
            }
            
            if (Math.max(...workerHistory.thralls) > 0) {
                datasets.push({
                    label: 'Thralls',
                    data: workerHistory.thralls,
                    borderColor: '#c62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.1)',
                    tension: 0.1,
                    fill: true
                });
            }
        } else {
            // Show percentages
            // Calculate totals for each time point
            const totalWorkers = workerHistory.timestamps.map((_, i) => {
                return (
                    workerHistory.farmers[i] + 
                    workerHistory.woodcutters[i] + 
                    workerHistory.miners[i] + 
                    workerHistory.hunters[i] + 
                    workerHistory.crafters[i] + 
                    workerHistory.gatherers[i] +
                    workerHistory.fishermen[i] + 
                    workerHistory.thralls[i] + 
                    workerHistory.unassigned[i]
                );
            });
            
            // Convert to percentages
            const farmerPercentages = workerHistory.farmers.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const woodcutterPercentages = workerHistory.woodcutters.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const minerPercentages = workerHistory.miners.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const hunterPercentages = workerHistory.hunters.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const crafterPercentages = workerHistory.crafters.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const gathererPercentages = workerHistory.gatherers.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);

            const fishermenPercentages = workerHistory.fishermen.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const thrallPercentages = workerHistory.thralls.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
                
            const unassignedPercentages = workerHistory.unassigned.map((val, i) => 
                totalWorkers[i] > 0 ? (val / totalWorkers[i] * 100) : 0);
            
            // Create datasets for percentage view
            datasets = [
                {
                    label: 'Farmers',
                    data: farmerPercentages,
                    borderColor: '#c62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                },
                {
                    label: 'Woodcutters',
                    data: woodcutterPercentages,
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                },
                {
                    label: 'Miners',
                    data: minerPercentages,
                    borderColor: '#5d4037',
                    backgroundColor: 'rgba(93, 64, 55, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                },
                {
                    label: 'Unassigned',
                    data: unassignedPercentages,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                }
            ];
            
            // Add specialized workers if they exist
            if (Math.max(...hunterPercentages) > 0) {
                datasets.push({
                    label: 'Hunters',
                    data: hunterPercentages,
                    borderColor: '#795548',
                    backgroundColor: 'rgba(121, 85, 72, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                });
            }

            if (Math.max(...fishermenPercentages) > 0) {
                datasets.push({
                    label: 'Fishermen',
                    data: fishermenPercentages,
                    borderColor: '#795548',
                    backgroundColor: 'rgba(40, 8, 226, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                });
            }
            
            if (Math.max(...crafterPercentages) > 0) {
                datasets.push({
                    label: 'Crafters',
                    data: crafterPercentages,
                    borderColor: '#6a1b9a',
                    backgroundColor: 'rgba(106, 27, 154, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                });
            }
            
            if (Math.max(...gathererPercentages) > 0) {
                datasets.push({
                    label: 'Gatherers',
                    data: gathererPercentages,
                    borderColor: '#00695c',
                    backgroundColor: 'rgba(0, 105, 92, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                });
            }
            
            if (Math.max(...thrallPercentages) > 0) {
                datasets.push({
                    label: 'Thralls',
                    data: thrallPercentages,
                    borderColor: '#c62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.7)',
                    tension: 0.1,
                    fill: true,
                    stack: 'stack1'
                });
            }
        }
        
        // Create the chart
        trendChart = new Chart(chartCanvas, {
            type: viewType === 'percentage' ? 'bar' : 'line',
            data: {
                labels: workerHistory.timestamps.map(t => `Update ${t}`),
                datasets: datasets
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
                        text: viewType === 'percentage' ? 'Worker Distribution (%)' : 'Worker Count (Absolute)',
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
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: viewType === 'percentage' ? 'Percentage' : 'Workers'
                        },
                        min: 0,
                        max: viewType === 'percentage' ? 100 : undefined,
                        stacked: viewType === 'percentage'
                    }
                }
            }
        });
    }
    
    /**
     * Update building breakdown section
     * @param {Object} buildingData - Building data from BuildingSystem
     */
    /**/

function updateBuildingBreakdown(buildingData) {
    const breakdownElement = document.getElementById('building-breakdown');
    if (!breakdownElement || !buildingData || !buildingData.built) return;
    
    // Create building breakdown
    let breakdownHTML = '';
    
    // Get building types from BuildingSystem
    const buildings = buildingData.built;
    
    // Update building counts
    buildingCounts = {};
    
    // Group buildings by category
    const buildingCategories = {
        housing: [],
        production: [],
        infrastructure: [],
        military: [],
        main: []
    };
    
    // Group buildings
    for (const buildingId in buildings) {
        const count = buildings[buildingId];
        if (count <= 0) continue;
        
        // Get building type information - THIS IS THE FIX
        // Use the BuildingSystem.getBuildingType method to get proper building info
        const buildingType = typeof BuildingSystem !== 'undefined' && 
                            typeof BuildingSystem.getBuildingType === 'function' ?
                            BuildingSystem.getBuildingType(buildingId) : null;
                            
        if (!buildingType) {
            // If we can't get proper building info, use a minimal default object
            console.log(`Could not get building info for ${buildingId}`);
            buildingCategories.infrastructure.push({
                id: buildingId,
                name: buildingId.charAt(0).toUpperCase() + buildingId.slice(1).replace('_', ' '),
                count: count,
                workers: 0
            });
            continue;
        }
        
        // Add to appropriate category
        const category = buildingType.category || 'infrastructure';
        
        // Make sure the category exists
        if (!buildingCategories[category]) {
            buildingCategories[category] = [];
        }
        
        buildingCategories[category].push({
            id: buildingId,
            name: buildingType.name,
            count: count,
            workers: buildingType.workerCapacity * count
        });
        
        // Track total workers by building type
        buildingCounts[buildingId] = {
            name: buildingType.name,
            count: count,
            workers: buildingType.workerCapacity * count,
            category: category
        };
    }
    
    // Create section for each building category
    for (const category in buildingCategories) {
        if (buildingCategories[category].length === 0) continue;
        
        let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        breakdownHTML += `
            <div class="building-breakdown-item">
                <h4>${categoryName} Buildings</h4>
                <div class="building-list">
        `;
        
        // Add each building in this category
        buildingCategories[category].forEach(building => {
            breakdownHTML += `
                <div class="building-item">
                    <div class="building-name">${building.name} x${building.count}</div>
                    <div class="building-worker-count">${building.workers} capacity</div>
                </div>
            `;
        });
        
        // Close this category section
        breakdownHTML += `
                </div>
            </div>
        `;
    }
    
    // If no buildings
    if (breakdownHTML === '') {
        breakdownHTML = '<p>No buildings constructed yet.</p>';
    }
    
    breakdownElement.innerHTML = breakdownHTML;
}
    
    // Public API
    return {
        /**
         * Initialize the worker utilization panel
         */
        init: function() {
            // Create panel
            createPanel();
            
            // Set up update interval
            updateTimer = setInterval(updatePanel, UPDATE_INTERVAL);
            
            // Do first update
            updatePanel();
            
            console.log("Worker Utilization Panel initialized with manual assignment controls");
        },
        
        /**
         * Manually update the panel
         */
        update: function() {
            updatePanel();
        },
        
        /**
         * Get worker distribution data
         * @returns {Object} - Worker distribution data
         */
        getWorkerDistribution: function() {
            const assignments = PopulationManager.getWorkerAssignments();
            const unassigned = PopulationManager.getUnassignedWorkers();
            
            return {
                ...assignments,
                unassigned: unassigned,
                total: PopulationManager.getPopulation().workers
            };
        },
        
        /**
         * Get historical worker data
         * @returns {Object} - Historical worker data
         */
        getWorkerHistory: function() {
            return { ...workerHistory };
        },
        
        /**
         * Get detailed building worker counts
         * @returns {Object} - Building worker counts
         */
        getBuildingWorkerCounts: function() {
            return { ...buildingCounts };
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Wait for other systems to initialize first
        WorkerUtilizationPanel.init();
    }, 1000);
});