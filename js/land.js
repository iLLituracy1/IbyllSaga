/**
 * Viking Legacy - Land Management System
 * Handles homestead acreage, land usage allocation, and persistent orders
 */

const LandManager = (function() {
    // Private variables
    
    // Land data
    let landData = {
        totalAcreage: 10, // Starting with a small homestead
        landTypes: {
            farmland: 5,     // Land for food production
            woodland: 3,     // Land for wood production
            settlement: 2,    // Land for buildings and population
            mining: 0,        // Land for mining resources
            wilderness: 0     // Undeveloped land
        },
        maxExpansionRate: 0.5, // Maximum acres that can be claimed per day
        expansionDifficulty: 1.0 // Scales the cost and time for expansion
    };
    
    // Orders system
    let activeOrders = [];
    
    // Order templates
    const orderTypes = {
        EXPAND_LAND: {
            id: "expand_land",
            name: "Expand Homestead",
            description: "Claim additional unclaimed land to expand your homestead.",
            targetType: "value", // Target is a specific value
            baseRate: 0.05, // Acres per day
            baseCost: {
                food: 5, // Food per acre
                wood: 3  // Wood per acre
            },
            manpowerRequired: 5, // Workers required per acre
            fameReward: .10,
            completionEvent: true // Generate an event when completed
        },
        CONVERT_FARMLAND: {
            id: "convert_farmland",
            name: "Develop Farmland",
            description: "Convert land to farmland to increase food production.",
            targetType: "percentage", // Target is a percentage of total land
            baseRate: 0.03, // Acres per day
            baseCost: {
                food: 2,
                wood: 2
            },
            manpowerRequired: 5,
            resourceModifier: {
                food: 0.07 // Each acre increases food production by 5%
            },
            completionEvent: false
        },
        CONVERT_WOODLAND: {
            id: "convert_woodland",
            name: "Develop Woodland",
            description: "Convert land to managed woodland to increase wood production.",
            targetType: "percentage",
            baseRate: 0.03,
            baseCost: {
                food: 1,
                wood: 1
            },
            manpowerRequired: 5,
            resourceModifier: {
                wood: 0.05 // Each acre increases wood production by 5%
            },
            completionEvent: false
        },
        CONVERT_MINING: {
            id: "convert_mining",
            name: "Develop Mining Area",
            description: "Convert land to mining area to increase stone and metal production.",
            targetType: "percentage",
            baseRate: 0.02, // Slower than other conversions
            baseCost: {
                food: 3,
                wood: 3,
                stone: 1
            },
            manpowerRequired: 5, // Requires more workers
            resourceModifier: {
                stone: 0.04,
                metal: 0.03
            },
            completionEvent: false
        },
        CONVERT_SETTLEMENT: {
            id: "convert_settlement",
            name: "Expand Settlement",
            description: "Develop land for settlement to increase housing capacity.",
            targetType: "percentage",
            baseRate: 0.2,
            baseCost: {
                food: 5,
                wood: 8,
                stone: 3
            },
            manpowerRequired: 5,
            housingCapacityIncrease: 2, // Each acre increases housing capacity
            completionEvent: true
        }
    };
    
    // Order template
    const orderTemplate = {
        id: "",
        type: "",
        name: "",
        description: "",
        target: 0, // Target value or percentage
        progress: 0, // Current progress towards target
        currentRate: 0, // Current rate of progress per day
        active: true,
        created: null, // Timestamp
        completed: null, // Timestamp when completed
        manpowerAssigned: 0 // Workers assigned to this order
    };
    
    // Private methods
    
    /**
     * Update the land management UI
     */
    function updateLandUI() {
        // Update land overview
        Utils.updateElement('total-acreage', landData.totalAcreage.toFixed(1));
        
        // Update land type distribution
        for (const landType in landData.landTypes) {
            Utils.updateElement(`${landType}-acres`, landData.landTypes[landType].toFixed(1));
            
            // Calculate and update percentage
            const percentage = (landData.landTypes[landType] / landData.totalAcreage * 100).toFixed(1);
            Utils.updateElement(`${landType}-percentage`, percentage);
        }
        
        // Update active orders list
        updateOrdersUI();
        
        // Update land usage chart if it exists
        updateLandChart();
    }
    
    /**
     * Update the orders UI
     */
    function updateOrdersUI() {
        const ordersContainer = document.getElementById('active-orders');
        if (!ordersContainer) return;
        
        // Clear current orders display
        ordersContainer.innerHTML = '';
        
        if (activeOrders.length === 0) {
            ordersContainer.innerHTML = '<p>No active orders. Issue an order to develop your homestead.</p>';
            return;
        }
        
        // Add each active order
        activeOrders.forEach(order => {
            if (!order.active) return; // Skip inactive orders
            
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            // Calculate progress percentage
            let progressPercent = 0;
            if (order.type === orderTypes.EXPAND_LAND.id) {
                progressPercent = (order.progress / order.target * 100).toFixed(1);
            } else {
                // For percentage-based targets
                const currentTypeAcres = landData.landTypes[getOrderLandType(order.type)];
                const targetAcres = landData.totalAcreage * (order.target / 100);
                progressPercent = (currentTypeAcres / targetAcres * 100).toFixed(1);
                if (progressPercent > 100) progressPercent = 100;
            }
            
            // Format display of target
            let targetDisplay = '';
            if (order.type === orderTypes.EXPAND_LAND.id) {
                targetDisplay = `${order.target.toFixed(1)} acres`;
            } else {
                targetDisplay = `${order.target}% of land`;
            }
            
            orderElement.innerHTML = `
                <div class="order-header">
                    <h4>${order.name}</h4>
                    <button class="btn-cancel-order" data-order-id="${order.id}">Cancel</button>
                </div>
                <div class="order-info">
                    <p>${order.description}</p>
                    <div class="order-progress">
                        <div class="progress-label">Progress: ${progressPercent}%</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="order-details">
                        <span>Target: ${targetDisplay}</span>
                        <span>Rate: ${order.currentRate.toFixed(2)} acres/day</span>
                        <span>Workers: ${order.manpowerAssigned}</span>
                    </div>
                </div>
            `;
            
            ordersContainer.appendChild(orderElement);
            
            // Add event listener to cancel button
            const cancelButton = orderElement.querySelector(`.btn-cancel-order[data-order-id="${order.id}"]`);
            if (cancelButton) {
                cancelButton.addEventListener('click', function() {
                    LandManager.cancelOrder(order.id);
                });
            }
        });
    }
    
    /**
     * Update the land usage chart if available
     */
    function updateLandChart() {
        const chartCanvas = document.getElementById('land-usage-chart');
        if (!chartCanvas || typeof Chart === 'undefined') return;
        
        // Check if we already have a chart
        let landChart = Chart.getChart(chartCanvas);
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        const colors = [
            '#8eb056', // Farmland - Green
            '#6d4c2a', // Woodland - Brown
            '#8b5d33', // Settlement - Light Brown
            '#5d4037', // Mining - Dark Brown
            '#a99c8a'  // Wilderness - Gray
        ];
        
        let i = 0;
        for (const landType in landData.landTypes) {
            if (landData.landTypes[landType] > 0) {
                // Format land type name
                const formattedName = landType.charAt(0).toUpperCase() + landType.slice(1);
                labels.push(formattedName);
                data.push(landData.landTypes[landType]);
                i++;
            }
        }
        
        // Create or update chart
        if (landChart) {
            // Update existing chart
            landChart.data.labels = labels;
            landChart.data.datasets[0].data = data;
            landChart.update();
        } else {
            // Create new chart
            landChart = new Chart(chartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Land Usage Distribution'
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Check if there are enough workers available
     * @param {number} workersNeeded - Number of workers needed
     * @returns {boolean} - Whether there are enough workers
     */
    function hasEnoughWorkers(workersNeeded) {
        const population = PopulationManager.getPopulation();
        const assignments = PopulationManager.getWorkerAssignments();
        const availableWorkers = population.workers - LandManager.getTotalAssignedWorkers();
        
        return availableWorkers >= workersNeeded;
    }
    
    /**
     * Get the land type associated with an order type
     * @param {string} orderTypeId - Order type ID
     * @returns {string} - Land type
     */
    function getOrderLandType(orderTypeId) {
        switch (orderTypeId) {
            case orderTypes.CONVERT_FARMLAND.id:
                return "farmland";
            case orderTypes.CONVERT_WOODLAND.id:
                return "woodland";
            case orderTypes.CONVERT_MINING.id:
                return "mining";
            case orderTypes.CONVERT_SETTLEMENT.id:
                return "settlement";
            default:
                return "wilderness";
        }
    }
    
    /**
     * Generate a unique ID for an order
     * @returns {string} - Unique ID
     */
    function generateOrderId() {
        return `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Apply resource modifiers from land types
     */
    function applyLandResourceModifiers() {
        // Reset modifiers
        ResourceManager.resetProductionModifiers();
        
        // Apply modifiers for each land type
        for (const orderTypeId in orderTypes) {
            const orderType = orderTypes[orderTypeId];
            
            // Skip expansion order as it doesn't have resource modifiers
            if (orderTypeId === "EXPAND_LAND") continue;
            
            // Get corresponding land type
            const landType = getOrderLandType(orderType.id);
            
            // Skip if no modifier defined
            if (!orderType.resourceModifier) continue;
            
            // Apply modifiers based on acres
            const acres = landData.landTypes[landType];
            for (const resource in orderType.resourceModifier) {
                const modifier = 1 + (acres * orderType.resourceModifier[resource]);
                ResourceManager.applyProductionModifier(resource, modifier);
            }
        }
    }
    
    // Public API
    return {
        /**
         * Initialize the land manager
         */
        init: function() {
            // Initialize land data if not already set
            if (!landData.totalAcreage) {
                landData.totalAcreage = 10;
                landData.landTypes = {
                    farmland: 5,
                    woodland: 3,
                    settlement: 2,
                    mining: 0,
                    wilderness: 0
                };
            }
            
            // Apply initial resource modifiers
            applyLandResourceModifiers();
            
            // Create UI elements if they don't exist
            this.createLandUI();
            
            console.log("Land Manager initialized");
        },
        
        /**
         * Create the land management UI if it doesn't exist
         */
        createLandUI: function() {
            // Check if land panel already exists
            if (document.getElementById('land-panel')) {
                console.log("Land panel already exists, skipping creation");
                return;
            }
            
            // Create land management panel
            const landPanel = document.createElement('div');
            landPanel.className = 'land-panel';
            landPanel.id = 'land-panel';
            landPanel.innerHTML = `
                <h2>Homestead Land</h2>
                <div class="land-overview">
                    <div class="land-total">
                        <span class="label">Total Acreage:</span>
                        <span id="total-acreage">${landData.totalAcreage.toFixed(1)}</span> acres
                    </div>
                    <div class="land-distribution">
                        <div class="land-type">
                            <span class="label">Farmland:</span>
                            <span id="farmland-acres">${landData.landTypes.farmland.toFixed(1)}</span> acres
                            (<span id="farmland-percentage">${(landData.landTypes.farmland / landData.totalAcreage * 100).toFixed(1)}</span>%)
                        </div>
                        <div class="land-type">
                            <span class="label">Woodland:</span>
                            <span id="woodland-acres">${landData.landTypes.woodland.toFixed(1)}</span> acres
                            (<span id="woodland-percentage">${(landData.landTypes.woodland / landData.totalAcreage * 100).toFixed(1)}</span>%)
                        </div>
                        <div class="land-type">
                            <span class="label">Settlement:</span>
                            <span id="settlement-acres">${landData.landTypes.settlement.toFixed(1)}</span> acres
                            (<span id="settlement-percentage">${(landData.landTypes.settlement / landData.totalAcreage * 100).toFixed(1)}</span>%)
                        </div>
                        <div class="land-type">
                            <span class="label">Mining:</span>
                            <span id="mining-acres">${landData.landTypes.mining.toFixed(1)}</span> acres
                            (<span id="mining-percentage">${(landData.landTypes.mining / landData.totalAcreage * 100).toFixed(1)}</span>%)
                        </div>
                        <div class="land-type">
                            <span class="label">Wilderness:</span>
                            <span id="wilderness-acres">${landData.landTypes.wilderness.toFixed(1)}</span> acres
                            (<span id="wilderness-percentage">${(landData.landTypes.wilderness / landData.totalAcreage * 100).toFixed(1)}</span>%)
                        </div>
                    </div>
                    <div class="land-chart-container">
                        <canvas id="land-usage-chart"></canvas>
                    </div>
                </div>
                
                <div class="land-orders">
                    <h3>Development Orders</h3>
                    <div class="orders-controls">
                        <button id="btn-issue-order">Issue New Order</button>
                        <div id="order-type-selector" class="order-selector" style="display: none;">
                            <h4>Select Order Type</h4>
                            <button class="order-type-btn" data-order-type="expand_land">Expand Homestead</button>
                            <button class="order-type-btn" data-order-type="convert_farmland">Develop Farmland</button>
                            <button class="order-type-btn" data-order-type="convert_woodland">Develop Woodland</button>
                            <button class="order-type-btn" data-order-type="convert_mining">Develop Mining Area</button>
                            <button class="order-type-btn" data-order-type="convert_settlement">Expand Settlement</button>
                        </div>
                    </div>
                    <div id="active-orders">
                        <p>No active orders. Issue an order to develop your homestead.</p>
                    </div>
                </div>
            `;
        
            
            // Add to game content
            const gameContent = document.querySelector('.game-content');
            if (gameContent) {
                gameContent.appendChild(landPanel);
                
                // Add event listeners
                const issueOrderBtn = document.getElementById('btn-issue-order');
                const orderTypeSelector = document.getElementById('order-type-selector');
                
                if (issueOrderBtn && orderTypeSelector) {
                    issueOrderBtn.addEventListener('click', function() {
                        orderTypeSelector.style.display = orderTypeSelector.style.display === 'none' ? 'block' : 'none';
                    });
                    
                    // Add listeners for order type buttons
                    const orderTypeBtns = document.querySelectorAll('.order-type-btn');
                    orderTypeBtns.forEach(btn => {
                        btn.addEventListener('click', function() {
                            const orderType = this.dataset.orderType;
                            LandManager.showOrderConfigurationModal(orderType);
                            orderTypeSelector.style.display = 'none';
                        });
                    });
                }
                
                // Update the land usage chart
                updateLandChart();
                
                // Update CSS for game layout
                document.querySelector('head').insertAdjacentHTML('beforeend', `
                    <style>
                        .land-panel {
                            background-color: #e6d8c3;
                            border-radius: 8px;
                            padding: 20px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                            border: 1px solid #c9ba9b;
                            grid-column: 1 / 3;
                            margin-top: 20px;
                        }
                        
                        .land-panel h2 {
                            font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                            color: #5d4037;
                            border-bottom: 2px solid #a99275;
                            padding-bottom: 8px;
                            margin-bottom: 15px;
                            letter-spacing: 1px;
                            font-weight: 700;
                        }
                        
                        .land-panel h3 {
                            font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                            color: #5d4037;
                            margin-top: 20px;
                            margin-bottom: 12px;
                            border-bottom: 1px solid #c9ba9b;
                            padding-bottom: 5px;
                            letter-spacing: 1px;
                            font-weight: 700;
                        }
                        
                        .land-overview {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 20px;
                        }
                        
                        .land-total {
                            font-size: 1.1rem;
                            font-weight: 500;
                            color: #5d4037;
                            flex-basis: 100%;
                        }
                        
                        .land-distribution {
                            flex-basis: 50%;
                            flex-grow: 1;
                        }
                        
                        .land-chart-container {
                            flex-basis: 40%;
                            min-width: 250px;
                            max-width: 300px;
                            flex-grow: 1;
                        }
                        
                        .land-type {
                            margin-bottom: 10px;
                            padding: 8px 12px;
                            background-color: #f7f0e3;
                            border-radius: 4px;
                            border-left: 4px solid #8b5d33;
                        }
                        
                        .land-type .label {
                            font-weight: bold;
                            margin-right: 5px;
                            color: #5d4037;
                        }
                        
                        .land-orders {
                            margin-top: 20px;
                        }
                        
                        .orders-controls {
                            margin-bottom: 15px;
                        }
                        
                        .order-selector {
                            background-color: #f7f0e3;
                            padding: 15px;
                            border-radius: 6px;
                            margin-top: 10px;
                            border: 1px solid #d7cbb9;
                        }
                        
                        .order-selector h4 {
                            margin-top: 0;
                            margin-bottom: 10px;
                            color: #5d4037;
                        }
                        
                        .order-type-btn {
                            margin-right: 8px;
                            margin-bottom: 8px;
                        }
                        
                        .order-item {
                            background-color: #f7f0e3;
                            padding: 15px;
                            border-radius: 6px;
                            margin-bottom: 15px;
                            border-left: 4px solid #8b5d33;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        }
                        
                        .order-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        
                        .order-header h4 {
                            margin: 0;
                            color: #5d4037;
                            font-weight: 600;
                        }
                        
                        .order-progress {
                            margin: 10px 0;
                        }
                        
                        .progress-bar-container {
                            height: 10px;
                            background-color: #d7cbb9;
                            border-radius: 5px;
                            margin-top: 5px;
                            overflow: hidden;
                        }
                        
                        .progress-bar {
                            height: 100%;
                            background: linear-gradient(to right, #8b5d33, #a97c50);
                            width: 0%;
                            transition: width 0.3s ease;
                        }
                        
                        .order-details {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            margin-top: 10px;
                            font-size: 0.9rem;
                            color: #5d4037;
                        }
                        
                        .btn-cancel-order {
                            padding: 5px 10px;
                            font-size: 0.9rem;
                        }
                        
                        .order-config-modal {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.7);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 1000;
                        }
                        
                        .order-config-content {
                            background-color: #f7f0e3;
                            border-radius: 8px;
                            padding: 25px;
                            max-width: 500px;
                            width: 90%;
                            box-shadow: 0 0 30px rgba(0, 0, 0, 0.4);
                            border: 2px solid #8b5d33;
                        }
                        
                        .order-config-content h3 {
                            margin-top: 0;
                            border-bottom: 2px solid #8b5d33;
                            padding-bottom: 10px;
                        }
                        
                        .config-field {
                            margin-bottom: 15px;
                        }
                        
                        .config-field label {
                            display: block;
                            margin-bottom: 5px;
                            font-weight: 500;
                            color: #5d4037;
                        }
                        
                        .config-field input {
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #c9ba9b;
                            border-radius: 4px;
                            background-color: #fff;
                            color: #3a2e21;
                        }
                        
                        .config-field input[type="range"] {
                            width: 100%;
                        }
                        
                        .config-buttons {
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            margin-top: 20px;
                        }
                        
                        /* Land type specific colors */
                        .land-type:nth-child(1) {
                            border-left-color: #8eb056; /* Farmland - Green */
                        }
                        
                        .land-type:nth-child(2) {
                            border-left-color: #6d4c2a; /* Woodland - Brown */
                        }
                        
                        .land-type:nth-child(3) {
                            border-left-color: #8b5d33; /* Settlement - Light Brown */
                        }
                        
                        .land-type:nth-child(4) {
                            border-left-color: #5d4037; /* Mining - Dark Brown */
                        }
                        
                        .land-type:nth-child(5) {
                            border-left-color: #a99c8a; /* Wilderness - Gray */
                        }
                        
                        /* Responsive adjustments */
                        @media (max-width: 768px) {
                            .land-overview {
                                flex-direction: column;
                            }
                            
                            .land-chart-container {
                                max-width: 100%;
                            }
                        }
                    </style>
                `);

                            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('land-panel', 'land');
            }
            }
        },
        
        /**
         * Show modal to configure an order
         * @param {string} orderTypeId - ID of the order type
         */
        showOrderConfigurationModal: function(orderTypeId) {
            const orderType = Object.values(orderTypes).find(type => type.id === orderTypeId);
            
            if (!orderType) {
                console.error(`Unknown order type: ${orderTypeId}`);
                return;
            }
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'order-config-modal';
            
            // Determine max workers available
            const population = PopulationManager.getPopulation();
            const totalAssigned = this.getTotalAssignedWorkers();
            const availableWorkers = Math.max(0, population.workers - totalAssigned);
            
            // Create content based on order type
            let targetInput = '';
            let targetLabel = '';
            let targetMax = 0;
            let targetDefault = 0;
            
            if (orderType.id === orderTypes.EXPAND_LAND.id) {
                // Expansion order
                targetMax = 20; // Limit expansion to reasonable amount
                targetDefault = 5;
                targetLabel = 'Target Acreage to Claim';
                targetInput = `
                    <div class="config-field">
                        <label for="order-target">${targetLabel}: <span id="target-value">${targetDefault}</span> acres</label>
                        <input type="range" id="order-target" min="1" max="${targetMax}" value="${targetDefault}" step="1">
                    </div>
                `;
            } else {
                // Land conversion order
                const landType = getOrderLandType(orderType.id);
                const currentPercentage = (landData.landTypes[landType] / landData.totalAcreage * 100).toFixed(1);
                targetMax = 90; // Max percentage to allow
                targetDefault = Math.min(Math.max(Math.round(currentPercentage) + 10, 10), targetMax);
                targetLabel = 'Target Percentage of Total Land';
                targetInput = `
                    <div class="config-field">
                        <label for="order-target">${targetLabel}: <span id="target-value">${targetDefault}</span>%</label>
                        <input type="range" id="order-target" min="0" max="${targetMax}" value="${targetDefault}" step="5">
                        <p>Current: ${currentPercentage}%</p>
                    </div>
                `;
            }
            
            // Build the modal content
            modal.innerHTML = `
                <div class="order-config-content">
                    <h3>${orderType.name}</h3>
                    <p>${orderType.description}</p>
                    
                    ${targetInput}
                    
                    <div class="config-field">
                        <label for="order-manpower">Assign Workers: <span id="manpower-value">1</span> worker${orderType.manpowerRequired > 1 ? 's' : ''}</label>
                        <input type="range" id="order-manpower" min="${orderType.manpowerRequired}" max="${Math.max(orderType.manpowerRequired, availableWorkers + orderType.manpowerRequired - 1)}" value="${orderType.manpowerRequired}" step="1">
                        <p>Available workers: ${availableWorkers} (Minimum required: ${orderType.manpowerRequired})</p>
                    </div>
                    
                    <div class="order-cost">
                        <h4>Cost per Acre:</h4>
                        <ul>
                            ${orderType.baseCost.food ? `<li>Food: ${orderType.baseCost.food}</li>` : ''}
                            ${orderType.baseCost.wood ? `<li>Wood: ${orderType.baseCost.wood}</li>` : ''}
                            ${orderType.baseCost.stone ? `<li>Stone: ${orderType.baseCost.stone}</li>` : ''}
                            ${orderType.baseCost.metal ? `<li>Metal: ${orderType.baseCost.metal}</li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="config-buttons">
                        <button id="btn-cancel-config">Cancel</button>
                        <button id="btn-confirm-order">Issue Order</button>
                    </div>
                </div>
            `;
            
            // Add to document
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('btn-cancel-config').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Update target value display
            const targetRangeInput = document.getElementById('order-target');
            const targetValueDisplay = document.getElementById('target-value');
            
            if (targetRangeInput && targetValueDisplay) {
                targetRangeInput.addEventListener('input', function() {
                    targetValueDisplay.textContent = this.value;
                });
            }
            
            // Update manpower value display
            const manpowerRangeInput = document.getElementById('order-manpower');
            const manpowerValueDisplay = document.getElementById('manpower-value');
            
            if (manpowerRangeInput && manpowerValueDisplay) {
                manpowerRangeInput.addEventListener('input', function() {
                    manpowerValueDisplay.textContent = this.value;
                    const plural = this.value > 1 ? 's' : '';
                    manpowerValueDisplay.nextSibling.textContent = ` worker${plural}`;
                });
            }
            
            // Confirm order button
            document.getElementById('btn-confirm-order').addEventListener('click', () => {
                const target = parseFloat(document.getElementById('order-target').value);
                const manpower = parseInt(document.getElementById('order-manpower').value);
                
                // Create the order
                this.createOrder(orderType.id, target, manpower);
                
                // Close modal
                document.body.removeChild(modal);
            });
        },
        
        /**
         * Create a new order
         * @param {string} orderTypeId - ID of the order type
         * @param {number} target - Target value or percentage
         * @param {number} manpower - Workers assigned to this order
         * @returns {Object|null} - Created order or null if failed
         */
        createOrder: function(orderTypeId, target, manpower) {
            const orderType = Object.values(orderTypes).find(type => type.id === orderTypeId);
            
            if (!orderType) {
                console.error(`Unknown order type: ${orderTypeId}`);
                return null;
            }
            
            // Check if we have enough workers
            if (!hasEnoughWorkers(manpower)) {
                Utils.log("Not enough workers available for this order.", "important");
                return null;
            }
            
            // For conversion orders, check if target is higher than current percentage
            if (orderTypeId !== orderTypes.EXPAND_LAND.id) {
                const landType = getOrderLandType(orderTypeId);
                const currentPercentage = (landData.landTypes[landType] / landData.totalAcreage * 100);
                
                if (target <= currentPercentage) {
                    Utils.log("Target percentage must be higher than current percentage.", "important");
                    return null;
                }
            }
            
            // Check if similar order already exists
            const similarOrderExists = activeOrders.some(order => 
                order.type === orderTypeId && order.active
            );
            
            if (similarOrderExists) {
                Utils.log("A similar order is already active. Cancel it first.", "important");
                return null;
            }
            
            // Create the order
            const order = Object.assign({}, orderTemplate, {
                id: generateOrderId(),
                type: orderTypeId,
                name: orderType.name,
                description: orderType.description,
                target: target,
                progress: 0,
                currentRate: (orderType.baseRate * manpower) / orderType.manpowerRequired,
                active: true,
                created: Date.now(),
                manpowerAssigned: manpower
            });
            
            // Add to active orders
            activeOrders.push(order);
            
            // Log order creation
            Utils.log(`New order issued: ${orderType.name} with target of ${target}${orderTypeId !== orderTypes.EXPAND_LAND.id ? '%' : ' acres'}.`, "success");
            
            // Update UI
            updateOrdersUI();
            
            return order;
        },
        
        /**
         * Cancel an active order
         * @param {string} orderId - ID of the order to cancel
         * @returns {boolean} - Whether the cancellation was successful
         */
        cancelOrder: function(orderId) {
            const orderIndex = activeOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex === -1) {
                console.error(`Order with ID ${orderId} not found.`);
                return false;
            }
            
            const order = activeOrders[orderIndex];
            
            // Mark as inactive rather than removing
            order.active = false;
            order.completed = Date.now();
            
            // Log cancellation
            Utils.log(`Order canceled: ${order.name}`, "important");
            
            // Update UI
            updateOrdersUI();
            
            return true;
        },
        
        /**
         * Process orders for a game tick
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Skip if no active orders
            if (activeOrders.length === 0) return;
            
            let resourcesGained = {
                food: 0,
                wood: 0,
                stone: 0,
                metal: 0
            };
            
            // Process each active order
            for (let i = activeOrders.length - 1; i >= 0; i--) {
                const order = activeOrders[i];
                
                // Skip inactive orders
                if (!order.active) continue;
                
                const orderType = Object.values(orderTypes).find(type => type.id === order.type);
                if (!orderType) continue;
                
                // Calculate resources needed for this tick
                const progressThisTick = order.currentRate * tickSize;
                const resourcesNeeded = {};
                
                for (const resource in orderType.baseCost) {
                    resourcesNeeded[resource] = orderType.baseCost[resource] * progressThisTick;
                }
                
                // Check if we can afford the resources
                const canAfford = ResourceManager.subtractResources(resourcesNeeded);
                
                if (!canAfford) {
                    // Not enough resources to progress this tick
                    Utils.log(`Order "${order.name}" paused: Not enough resources to continue.`, "important");
                    continue;
                }
                
                // Update progress
                order.progress += progressThisTick;
                
                // Process order effects
                if (order.type === orderTypes.EXPAND_LAND.id) {
                    // Expanding total acreage
                    landData.totalAcreage += progressThisTick;
                    landData.landTypes.wilderness += progressThisTick;
                    
                    // Add fame for expansion
                    if (RankManager && typeof RankManager.addFame === 'function') {
                        RankManager.addFame(orderType.fameReward * progressThisTick, `Expanded homestead by ${progressThisTick.toFixed(2)} acres`);
                    }
                    
                    // Check if order is complete
                    if (order.progress >= order.target) {
                        Utils.log(`Order complete: ${order.name} - Your homestead now spans ${landData.totalAcreage.toFixed(1)} acres.`, "success");
                        order.active = false;
                        order.completed = Date.now();
                        
                        // Create completion event if specified
                        if (orderType.completionEvent && EventManager) {
                            const eventData = {
                                id: `land_expansion_complete_${Date.now()}`,
                                title: "Homestead Expanded",
                                description: `Your people have successfully claimed an additional ${order.target} acres of land, expanding your homestead to ${landData.totalAcreage.toFixed(1)} acres total.`,
                                options: [
                                    {
                                        text: "Excellent!",
                                        effects: function(gameState) {
                                            // Additional fame bonus
                                            if (RankManager && typeof RankManager.addFame === 'function') {
                                                RankManager.addFame(10, "Completed land expansion");
                                            }
                                        }
                                    }
                                ],
                                importance: "moderate"
                            };
                            
                            EventManager.addEvent(eventData);
                            EventManager.triggerEvent(eventData, gameState);
                        }
                    }
                } else {
                    // Converting land types
                    const targetLandType = getOrderLandType(order.type);
                    const targetPercentage = order.target;
                    const targetAcres = landData.totalAcreage * (targetPercentage / 100);
                    const currentAcres = landData.landTypes[targetLandType];
                    
                    // Calculate how much we can convert this tick
                    const remainingToTarget = targetAcres - currentAcres;
                    const conversionThisTick = Math.min(progressThisTick, remainingToTarget);
                    
                    if (conversionThisTick > 0) {
                        // Take from wilderness first, then proportionally from other types
                        let toConvert = conversionThisTick;
                        
                        // Try to take from wilderness first
                        if (landData.landTypes.wilderness > 0) {
                            const fromWilderness = Math.min(landData.landTypes.wilderness, toConvert);
                            landData.landTypes.wilderness -= fromWilderness;
                            toConvert -= fromWilderness;
                        }
                        
                        // If we still need more, take proportionally from other types except the target type
                        if (toConvert > 0) {
                            const otherTypes = Object.keys(landData.landTypes).filter(type => 
                                type !== targetLandType && type !== 'wilderness'
                            );
                            
                            const totalOtherAcres = otherTypes.reduce((sum, type) => 
                                sum + landData.landTypes[type], 0
                            );
                            
                            // Distribute proportionally
                            otherTypes.forEach(type => {
                                const proportion = landData.landTypes[type] / totalOtherAcres;
                                const fromThisType = toConvert * proportion;
                                landData.landTypes[type] = Math.max(0, landData.landTypes[type] - fromThisType);
                            });
                        }
                        
                        // Add to target land type
                        landData.landTypes[targetLandType] += conversionThisTick;
                        
                        // Apply special effects based on land type
                        if (targetLandType === 'settlement' && orderType.housingCapacityIncrease) {
                            // Increase housing capacity
                            // This assumes PopulationManager has a way to increase capacity beyond buildings
                            if (PopulationManager && typeof PopulationManager.addBuilding === 'function') {
                                // For now, we'll approximate by adding houses
                                const housesEquivalent = Math.floor(conversionThisTick * orderType.housingCapacityIncrease / 5);
                                for (let j = 0; j < housesEquivalent; j++) {
                                    PopulationManager.addBuilding('house');
                                }
                            }
                        }
                    }
                    
                    // Check if order is complete (target percentage reached)
                    const currentPercentage = (landData.landTypes[targetLandType] / landData.totalAcreage * 100);
                    if (currentPercentage >= targetPercentage) {
                        Utils.log(`Order complete: ${order.name} - ${targetLandType} now covers ${currentPercentage.toFixed(1)}% of your homestead.`, "success");
                        order.active = false;
                        order.completed = Date.now();
                        
                        // Create completion event if specified
                        if (orderType.completionEvent && EventManager) {
                            const eventData = {
                                id: `land_conversion_complete_${Date.now()}`,
                                title: `${orderType.name} Complete`,
                                description: `Your people have successfully developed ${targetLandType} to cover ${currentPercentage.toFixed(1)}% of your homestead.`,
                                options: [
                                    {
                                        text: "Excellent!",
                                        effects: function(gameState) {
                                            // Additional fame bonus
                                            if (RankManager && typeof RankManager.addFame === 'function') {
                                                RankManager.addFame(10, `Completed ${targetLandType} development`);
                                            }
                                        }
                                    }
                                ],
                                importance: "moderate"
                            };
                            
                            EventManager.addEvent(eventData);
                            EventManager.triggerEvent(eventData, gameState);
                        }
                    }
                }
            }
            
            // Apply land resource modifiers
            applyLandResourceModifiers();
            
            // Update UI
            updateLandUI();
        },
        
        /**
         * Get total workers assigned to all active orders
         * @returns {number} - Total workers assigned
         */
        getTotalAssignedWorkers: function() {
            return activeOrders
                .filter(order => order.active)
                .reduce((total, order) => total + order.manpowerAssigned, 0);
        },
        
        /**
         * Get current land data
         * @returns {Object} - Current land data
         */
        getLandData: function() {
            return { ...landData };
        },
        
        /**
         * Get active orders
         * @returns {Array} - Array of active orders
         */
        getActiveOrders: function() {
            return activeOrders.filter(order => order.active);
        },
        
        /**
         * Get order types
         * @returns {Object} - Object containing order type definitions
         */
        getOrderTypes: function() {
            return { ...orderTypes };
        }
    };
})();