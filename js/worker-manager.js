/**
 * Viking Legacy - Improved Worker Management System
 * Prevents worker over-allocation and adds UI controls for building-based assignments
 */

const WorkerManager = (function() {
    // Track worker assignments by building ID
    let buildingWorkers = {};
    
    // Track total workers assigned
    let totalAssigned = 0;
    
    // Track building capacity data
    let buildingCapacity = {};
    
    // Track UI state
    let uiInitialized = false;
    
    /**
     * Initialize the building worker assignments
     */
    function initializeWorkerAssignments() {
        // Reset current assignments
        buildingWorkers = {};
        totalAssigned = 0;
        
        // Get all buildings from BuildingSystem
        const buildingData = BuildingSystem.getBuildingData();
        
        if (!buildingData || !buildingData.built) {
            console.warn("No building data available for worker initialization");
            return;
        }
        
        // Initialize capacity tracking
        buildingCapacity = {};
        
        // Process each building type
        for (const buildingId in buildingData.built) {
            const count = buildingData.built[buildingId];
            if (count <= 0) continue;
            
            // Get building type details
            const buildingType = BuildingSystem.getBuildingType(buildingId);
            if (!buildingType) continue;
            
            // Skip buildings with no worker capacity
            if (!buildingType.workerCapacity) continue;
            
            // Calculate total capacity for this building type
            const maxCapacity = buildingType.workerCapacity * count;
            
            // Track capacity
            buildingCapacity[buildingId] = {
                maxWorkers: maxCapacity,
                currentWorkers: 0,
                perBuilding: buildingType.workerCapacity,
                count: count,
                name: buildingType.name,
                workerType: getWorkerTypeForBuilding(buildingId)
            };
            
            // Initialize with zero workers
            buildingWorkers[buildingId] = 0;
        }
    }
    
    /**
     * Get the worker type (farmers, woodcutters, etc.) for a building
     * @param {string} buildingId - Building ID
     * @returns {string} - Worker type
     */
    function getWorkerTypeForBuilding(buildingId) {
        // Map building types to worker categories
        if (buildingId.includes('farm') || buildingId.includes('fishing') || buildingId.includes('hunting')) {
            return "farmers";
        } else if (buildingId.includes('woodcutter') || buildingId.includes('sawmill')) {
            return "woodcutters";
        } else if (buildingId.includes('quarry') || buildingId.includes('mine') || 
                   buildingId.includes('smithy') || buildingId.includes('forge')) {
            return "miners";
        } else if (buildingId.includes('hunter')) {
            return "hunters";
        } else if (buildingId.includes('craft')) {
            return "crafters";
        } else if (buildingId.includes('gather')) {
            return "gatherers";
        }
        
        // Default to general workers
        return "general";
    }
    
    /**
     * Calculate worker assignments by type (farmers, woodcutters, etc.)
     * @returns {Object} - Worker assignments by type
     */
    function calculateWorkerAssignmentsByType() {
        const assignments = {
            farmers: 0,
            woodcutters: 0,
            miners: 0,
            hunters: 0,
            crafters: 0,
            gatherers: 0,
            thralls: 0,
            general: 0
        };
        
        // Count workers by assignment type
        for (const buildingId in buildingWorkers) {
            const workerCount = buildingWorkers[buildingId];
            const workerType = buildingCapacity[buildingId]?.workerType || "general";
            
            if (assignments.hasOwnProperty(workerType)) {
                assignments[workerType] += workerCount;
            } else {
                assignments.general += workerCount;
            }
        }
        
        // Add unassigned count
        assignments.unassigned = getTotalAvailableWorkers() - totalAssigned;
        
        return assignments;
    }
    
    /**
     * Get total available workers from population
     * @returns {number} - Available workers
     */
    function getTotalAvailableWorkers() {
        const population = PopulationManager.getPopulation();
        return population.workers;
    }
    
    /**
     * Create or update the worker management UI
     */
    function createWorkerManagementUI() {
        // Find worker panel or create if needed
        let workerPanel = document.getElementById('worker-panel');
        
        if (!workerPanel) {
            // If no panel exists, wait for it to be created
            console.log("No worker panel found, deferring UI creation");
            return;
        }
        
        // Find or create worker allocation section
        let allocationSection = document.getElementById('building-allocation-section');
        
        if (!allocationSection) {
            // Create new section
            allocationSection = document.createElement('div');
            allocationSection.id = 'building-allocation-section';
            allocationSection.className = 'stats-section';
            
            // Add to worker panel content
            const panelContent = workerPanel.querySelector('.worker-panel-content');
            if (panelContent) {
                // Insert the allocation section after the worker distribution section
                const distributionSection = document.getElementById('worker-distribution')?.parentElement;
                if (distributionSection && distributionSection.nextElementSibling) {
                    panelContent.insertBefore(allocationSection, distributionSection.nextElementSibling);
                } else {
                    panelContent.appendChild(allocationSection);
                }
            } else {
                console.warn("Couldn't find panel content to add worker allocation section");
                return;
            }
        }
        
        // Update section content
        allocationSection.innerHTML = `
            <h3>Worker Allocation</h3>
            <div class="worker-allocation-info">
                <div class="allocation-stat">
                    <span class="allocation-label">Available Workers:</span>
                    <span id="available-workers-count">${getTotalAvailableWorkers()}</span>
                </div>
                <div class="allocation-stat">
                    <span class="allocation-label">Assigned Workers:</span>
                    <span id="assigned-workers-count">${totalAssigned}</span>
                </div>
                <div class="allocation-stat">
                    <span class="allocation-label">Unassigned Workers:</span>
                    <span id="unassigned-workers-count">${getTotalAvailableWorkers() - totalAssigned}</span>
                </div>
            </div>
            <div id="building-allocation-controls"></div>
        `;
        
        // Add allocations for each building type
        const controlsContainer = document.getElementById('building-allocation-controls');
        if (!controlsContainer) return;
        
        let controlsHTML = '';
        
        // Sort buildings by worker type for better organization
        const sortedBuildings = Object.entries(buildingCapacity)
            .sort((a, b) => {
                // Sort by worker type first
                if (a[1].workerType !== b[1].workerType) {
                    return a[1].workerType.localeCompare(b[1].workerType);
                }
                // Then by name
                return a[1].name.localeCompare(b[1].name);
            });
        
        for (const [buildingId, capacityData] of sortedBuildings) {
            const currentWorkers = buildingWorkers[buildingId] || 0;
            const maxWorkers = capacityData.maxWorkers;
            
            // Skip buildings with no capacity
            if (maxWorkers <= 0) continue;
            
            // Create allocation control
            controlsHTML += `
                <div class="building-allocation-control" data-building-id="${buildingId}" data-worker-type="${capacityData.workerType}">
                    <div class="building-allocation-header">
                        <span class="building-name">${capacityData.name} (${capacityData.count}x)</span>
                        <span class="worker-type-badge ${capacityData.workerType}">${capacityData.workerType}</span>
                    </div>
                    <div class="allocation-slider-container">
                        <input 
                            type="range" 
                            min="0" 
                            max="${maxWorkers}" 
                            value="${currentWorkers}" 
                            class="worker-allocation-slider" 
                            id="slider-${buildingId}"
                            data-building-id="${buildingId}"
                        >
                        <div class="allocation-values">
                            <span class="allocation-value-min">0</span>
                            <span class="allocation-value-current" id="value-${buildingId}">${currentWorkers}/${maxWorkers}</span>
                            <span class="allocation-value-max">${maxWorkers}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // If no buildings with worker capacity, show a message
        if (controlsHTML === '') {
            controlsHTML = '<p>No buildings with worker capacity available yet. Build production buildings to assign workers.</p>';
        }
        
        controlsContainer.innerHTML = controlsHTML;
        
        // Add event listeners to sliders
        const sliders = document.querySelectorAll('.worker-allocation-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', handleSliderChange);
        });
        
        // Add CSS styles if they don't exist
        addWorkerAllocationStyles();
        
        uiInitialized = true;
    }
    
    /**
     * Handle slider input changes
     * @param {Event} event - Input event
     */
    function handleSliderChange(event) {
        const buildingId = event.target.dataset.buildingId;
        const newValue = parseInt(event.target.value);
        const oldValue = buildingWorkers[buildingId] || 0;
        
        // Calculate the difference in workers
        const workerDifference = newValue - oldValue;
        
        // Check if we have enough available workers
        const availableWorkers = getTotalAvailableWorkers() - totalAssigned;
        
        if (workerDifference > availableWorkers) {
            // We don't have enough workers - revert to maximum possible
            const possibleValue = oldValue + availableWorkers;
            event.target.value = possibleValue;
            
            // Update the display
            document.getElementById(`value-${buildingId}`).textContent = 
                `${possibleValue}/${buildingCapacity[buildingId].maxWorkers}`;
            
            // Update worker assignment
            setWorkersForBuilding(buildingId, possibleValue);
            
            // Show message about worker shortage
            showWorkerShortageNotification();
            return;
        }
        
        // Update worker assignment
        setWorkersForBuilding(buildingId, newValue);
        
        // Update the display
        document.getElementById(`value-${buildingId}`).textContent = 
            `${newValue}/${buildingCapacity[buildingId].maxWorkers}`;
        
        // Update overall worker counts
        document.getElementById('assigned-workers-count').textContent = totalAssigned;
        document.getElementById('unassigned-workers-count').textContent = 
            getTotalAvailableWorkers() - totalAssigned;
    }
    
    /**
     * Show a notification about worker shortage
     */
    function showWorkerShortageNotification() {
        // Check if notification already exists
        if (document.getElementById('worker-shortage-notification')) return;
        
        const notification = document.createElement('div');
        notification.id = 'worker-shortage-notification';
        notification.className = 'worker-shortage-notification';
        notification.textContent = 'Not enough available workers!';
        
        // Add to the worker panel
        const workerPanel = document.getElementById('worker-panel');
        if (workerPanel) {
            workerPanel.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                const notificationElement = document.getElementById('worker-shortage-notification');
                if (notificationElement) {
                    notificationElement.remove();
                }
            }, 3000);
        }
    }
    
    /**
     * Set workers for a specific building
     * @param {string} buildingId - Building ID
     * @param {number} workerCount - Number of workers to assign
     */
    function setWorkersForBuilding(buildingId, workerCount) {
        // Ensure buildingId exists in our tracking
        if (!buildingCapacity[buildingId]) {
            console.warn(`No capacity data for building ${buildingId}`);
            return false;
        }
        
        // Get current assignment
        const currentWorkers = buildingWorkers[buildingId] || 0;
        
        // Calculate difference
        const workerDifference = workerCount - currentWorkers;
        
        // Check if we have enough unassigned workers
        const availableWorkers = getTotalAvailableWorkers() - totalAssigned;
        if (workerDifference > availableWorkers) {
            console.warn(`Not enough workers available. Need ${workerDifference}, have ${availableWorkers}`);
            return false;
        }
        
        // Update assignment
        buildingWorkers[buildingId] = workerCount;
        
        // Update total assigned count
        totalAssigned += workerDifference;
        
        // Update capacity tracking
        buildingCapacity[buildingId].currentWorkers = workerCount;
        
        // Recalculate worker assignments by type and update resource production
        updateProductionRates();
        
        return true;
    }
    
    /**
     * Update resource production rates based on worker assignments
     */
    function updateProductionRates() {
        // Calculate assignments by worker type
        const assignments = calculateWorkerAssignmentsByType();
        
        // Update in ResourceManager
        if (typeof ResourceManager !== 'undefined' && ResourceManager.updateProductionRates) {
            ResourceManager.updateProductionRates(assignments);
        }
    }
    
    /**
     * Add CSS styles for worker allocation UI
     */
    function addWorkerAllocationStyles() {
        // Check if styles already exist
        if (document.getElementById('worker-allocation-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'worker-allocation-styles';
        styleEl.textContent = `
            /* Worker Allocation Styles */
            .worker-allocation-info {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }
            
            .allocation-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 3px 0;
            }
            
            .allocation-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            .building-allocation-control {
                background-color: #f7f0e3;
                padding: 12px 15px;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid #8b5d33;
            }
            
            .building-allocation-control[data-worker-type="farmers"] {
                border-left-color: #c62828; /* Red for farmers */
            }
            
            .building-allocation-control[data-worker-type="woodcutters"] {
                border-left-color: #2e7d32; /* Green for woodcutters */
            }
            
            .building-allocation-control[data-worker-type="miners"] {
                border-left-color: #5d4037; /* Brown for miners */
            }
            
            .building-allocation-control[data-worker-type="hunters"] {
                border-left-color: #795548; /* Brown for hunters */
            }
            
            .building-allocation-control[data-worker-type="crafters"] {
                border-left-color: #6a1b9a; /* Purple for crafters */
            }
            
            .building-allocation-control[data-worker-type="gatherers"] {
                border-left-color: #00695c; /* Teal for gatherers */
            }
            
            .building-allocation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .building-name {
                font-weight: 500;
                color: #5d4037;
            }
            
            .worker-type-badge {
                font-size: 0.8rem;
                padding: 2px 6px;
                border-radius: 3px;
                color: white;
                text-transform: capitalize;
            }
            
            .worker-type-badge.farmers {
                background-color: #c62828;
            }
            
            .worker-type-badge.woodcutters {
                background-color: #2e7d32;
            }
            
            .worker-type-badge.miners {
                background-color: #5d4037;
            }
            
            .worker-type-badge.hunters {
                background-color: #795548;
            }
            
            .worker-type-badge.crafters {
                background-color: #6a1b9a;
            }
            
            .worker-type-badge.gatherers {
                background-color: #00695c;
            }
            
            .worker-type-badge.general {
                background-color: #607d8b;
            }
            
            .allocation-slider-container {
                width: 100%;
            }
            
            .worker-allocation-slider {
                width: 100%;
                height: 8px;
                -webkit-appearance: none;
                appearance: none;
                background: #d7cbb9;
                border-radius: 4px;
                outline: none;
            }
            
            .worker-allocation-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #8b5d33;
                cursor: pointer;
            }
            
            .worker-allocation-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #8b5d33;
                cursor: pointer;
            }
            
            .allocation-values {
                display: flex;
                justify-content: space-between;
                margin-top: 4px;
                font-size: 0.8rem;
                color: #5d4037;
            }
            
            .allocation-value-current {
                font-weight: 600;
            }
            
            .worker-shortage-notification {
                position: fixed;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #f44336;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: fade-in-out 3s forwards;
            }
            
            @keyframes fade-in-out {
                0% { opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .building-allocation-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .worker-type-badge {
                    margin-top: 4px;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Distribute workers optimally across buildings
     * Useful for auto-assignment when buildings are first created
     */
    function distributeWorkersOptimally() {
        // Reset current assignments
        for (const buildingId in buildingWorkers) {
            buildingWorkers[buildingId] = 0;
        }
        totalAssigned = 0;
        
        // Get total available workers
        const availableWorkers = getTotalAvailableWorkers();
        
        // Get total capacity across all buildings
        let totalCapacity = 0;
        for (const buildingId in buildingCapacity) {
            totalCapacity += buildingCapacity[buildingId].maxWorkers;
        }
        
        // If we have enough workers for all buildings, fill them all
        if (availableWorkers >= totalCapacity) {
            for (const buildingId in buildingCapacity) {
                buildingWorkers[buildingId] = buildingCapacity[buildingId].maxWorkers;
                buildingCapacity[buildingId].currentWorkers = buildingCapacity[buildingId].maxWorkers;
                totalAssigned += buildingCapacity[buildingId].maxWorkers;
            }
            return;
        }
        
        // Not enough workers - distribute proportionally based on capacity
        let remainingWorkers = availableWorkers;
        
        // First, prioritize essential buildings (farms for food, etc.)
        const priorities = [
            "farm", // Food is most important
            "woodcutter", // Wood next
            "mine", "quarry", // Then mining
            // Other buildings get remainder
        ];
        
        // Assign to priority buildings first
        for (const priorityKey of priorities) {
            for (const buildingId in buildingCapacity) {
                if (buildingId.includes(priorityKey)) {
                    const maxForBuilding = buildingCapacity[buildingId].maxWorkers;
                    // Assign all needed workers if possible
                    const toAssign = Math.min(maxForBuilding, remainingWorkers);
                    
                    buildingWorkers[buildingId] = toAssign;
                    buildingCapacity[buildingId].currentWorkers = toAssign;
                    totalAssigned += toAssign;
                    remainingWorkers -= toAssign;
                    
                    if (remainingWorkers <= 0) break;
                }
            }
            if (remainingWorkers <= 0) break;
        }
        
        // If we still have workers, distribute among remaining buildings
        if (remainingWorkers > 0) {
            // Calculate remaining capacity
            let remainingCapacity = 0;
            for (const buildingId in buildingCapacity) {
                if (buildingWorkers[buildingId] < buildingCapacity[buildingId].maxWorkers) {
                    remainingCapacity += (buildingCapacity[buildingId].maxWorkers - buildingWorkers[buildingId]);
                }
            }
            
            // Distribute proportionally
            for (const buildingId in buildingCapacity) {
                const currentAssigned = buildingWorkers[buildingId];
                const maxForBuilding = buildingCapacity[buildingId].maxWorkers;
                
                if (currentAssigned < maxForBuilding) {
                    const availableForBuilding = maxForBuilding - currentAssigned;
                    const proportion = availableForBuilding / remainingCapacity;
                    
                    // Calculate workers to add, rounding down
                    const workersToAdd = Math.floor(remainingWorkers * proportion);
                    
                    // Update assignments
                    buildingWorkers[buildingId] += workersToAdd;
                    buildingCapacity[buildingId].currentWorkers += workersToAdd;
                    totalAssigned += workersToAdd;
                    remainingWorkers -= workersToAdd;
                    
                    // If we're down to the last few workers, just assign them
                    // to avoid losing workers due to rounding
                    if (remainingWorkers < 3 && remainingWorkers > 0 && 
                        buildingWorkers[buildingId] < maxForBuilding) {
                        const finalAdd = Math.min(remainingWorkers, maxForBuilding - buildingWorkers[buildingId]);
                        buildingWorkers[buildingId] += finalAdd;
                        buildingCapacity[buildingId].currentWorkers += finalAdd;
                        totalAssigned += finalAdd;
                        remainingWorkers -= finalAdd;
                    }
                }
            }
        }
        
        // Update production rates with new worker distribution
        updateProductionRates();
    }
    
    // Public API
    return {
        /**
         * Initialize the worker management system
         */
        init: function() {
            console.log("Initializing improved Worker Management system...");
            
            // Initialize worker assignments
            initializeWorkerAssignments();
            
            // Auto-distribute workers to available jobs
            distributeWorkersOptimally();
            
            // Update UI if needed
            if (document.getElementById('worker-panel')) {
                createWorkerManagementUI();
            }
            
            console.log("Worker Management system initialized with", totalAssigned, "assigned workers");
            
            // Set up periodic UI updates
            setInterval(() => {
                if (document.getElementById('worker-panel')) {
                    if (!uiInitialized) {
                        createWorkerManagementUI();
                    } else {
                        // Update worker counts
                        document.getElementById('available-workers-count').textContent = getTotalAvailableWorkers();
                        document.getElementById('assigned-workers-count').textContent = totalAssigned;
                        document.getElementById('unassigned-workers-count').textContent = 
                            getTotalAvailableWorkers() - totalAssigned;
                    }
                }
            }, 2000);
        },
        
        /**
         * Update worker assignments when buildings change
         */
        refreshWorkerAssignments: function() {
            // Store old assignments to try to preserve them
            const oldAssignments = {...buildingWorkers};
            const oldTotalAssigned = totalAssigned;
            
            // Reinitialize building data
            initializeWorkerAssignments();
            
            // Try to restore previous assignments where possible
            let restoredWorkers = 0;
            
            for (const buildingId in oldAssignments) {
                if (buildingCapacity[buildingId]) {
                    const previousWorkers = oldAssignments[buildingId];
                    const maxWorkers = buildingCapacity[buildingId].maxWorkers;
                    
                    // Assign the minimum of previous workers or current capacity
                    const workersToAssign = Math.min(previousWorkers, maxWorkers);
                    
                    buildingWorkers[buildingId] = workersToAssign;
                    buildingCapacity[buildingId].currentWorkers = workersToAssign;
                    restoredWorkers += workersToAssign;
                }
            }
            
            totalAssigned = restoredWorkers;
            
            // If we lost workers in the transition, try to redistribute
            const availableWorkers = getTotalAvailableWorkers();
            if (restoredWorkers < oldTotalAssigned && restoredWorkers < availableWorkers) {
                // Try to assign the rest of the workers
                const remainingToAssign = Math.min(oldTotalAssigned - restoredWorkers, availableWorkers - restoredWorkers);
                
                if (remainingToAssign > 0) {
                    for (const buildingId in buildingCapacity) {
                        const currentWorkers = buildingWorkers[buildingId];
                        const maxWorkers = buildingCapacity[buildingId].maxWorkers;
                        
                        if (currentWorkers < maxWorkers) {
                            const canAdd = Math.min(maxWorkers - currentWorkers, remainingToAssign);
                            buildingWorkers[buildingId] += canAdd;
                            buildingCapacity[buildingId].currentWorkers += canAdd;
                            totalAssigned += canAdd;
                            
                            if (totalAssigned >= oldTotalAssigned || totalAssigned >= availableWorkers) {
                                break;
                            }
                        }
                    }
                }
            }
            
            // Update resource production rates
            updateProductionRates();
            
            // Update UI if it exists
            if (uiInitialized) {
                createWorkerManagementUI();
            }
        },
        
        /**
         * Get current worker assignments by building
         * @returns {Object} - Building worker assignments
         */
        getWorkerAssignmentsByBuilding: function() {
            return {...buildingWorkers};
        },
        
        /**
         * Get worker assignments by type (farmers, woodcutters, etc.)
         * @returns {Object} - Worker assignments by type
         */
        getWorkerAssignmentsByType: function() {
            return calculateWorkerAssignmentsByType();
        },
        
        /**
         * Set workers for a specific building
         * @param {string} buildingId - Building ID
         * @param {number} workerCount - Number of workers to assign
         * @returns {boolean} - Whether assignment was successful
         */
        setWorkersForBuilding: setWorkersForBuilding,
        
        /**
         * Process building changes
         * Call this when buildings are constructed or demolished
         */
        processBuildingChanges: function() {
            console.log("Processing building changes in worker system");
            this.refreshWorkerAssignments();
        },
        
        /**
         * Handle population changes
         * @param {number} workerDifference - Change in worker count (positive or negative)
         */
        handlePopulationChange: function(workerDifference) {
            if (workerDifference === 0) return;
            
            // If we gained workers, no need to adjust assignments
            if (workerDifference > 0) return;
            
            // If we lost workers, we may need to adjust assignments
            const availableWorkers = getTotalAvailableWorkers();
            
            if (totalAssigned <= availableWorkers) {
                // We still have enough workers, no need to adjust
                return;
            }
            
            // We have more assigned than available, need to reduce
            const excessWorkers = totalAssigned - availableWorkers;
            
            // Reduce workers proportionally across buildings
            const reductionProportion = excessWorkers / totalAssigned;
            let workersToRemove = excessWorkers;
            
            for (const buildingId in buildingWorkers) {
                if (workersToRemove <= 0) break;
                
                const currentWorkers = buildingWorkers[buildingId];
                // Calculate workers to remove, at least 1 if current > 0
                let removeFromBuilding = Math.min(
                    currentWorkers, 
                    Math.max(1, Math.floor(currentWorkers * reductionProportion))
                );
                
                // Don't remove more than we need to
                removeFromBuilding = Math.min(removeFromBuilding, workersToRemove);
                
                // Update assignments
                buildingWorkers[buildingId] -= removeFromBuilding;
                buildingCapacity[buildingId].currentWorkers -= removeFromBuilding;
                totalAssigned -= removeFromBuilding;
                workersToRemove -= removeFromBuilding;
            }
            
            // Update production rates
            updateProductionRates();
            
            // Update UI if needed
            if (uiInitialized) {
                createWorkerManagementUI();
            }
        },
        
        /**
         * Set up automatic distribution of new workers
         * @param {boolean} [enabled=true] - Whether to enable auto-distribution
         */
        enableAutoDistribution: function(enabled = true) {
            // Hook into population changes
            if (typeof PopulationManager !== 'undefined') {
                // This would ideally be implemented using a proper event system
                // For now, we could periodically check for population changes
                
                // We'll implement this in a future update
            }
        }
    };
})();

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization to ensure other systems are loaded
    setTimeout(function() {
        WorkerManager.init();
        
        // Register with BuildingSystem to handle building changes
        if (typeof BuildingSystem !== 'undefined') {
            // Hook into the BuildingSystem's updateBuildingUI method
            const originalUpdateUI = BuildingSystem.updateBuildingUI;
            if (typeof originalUpdateUI === 'function') {
                BuildingSystem.updateBuildingUI = function() {
                    originalUpdateUI.apply(this, arguments);
                    WorkerManager.processBuildingChanges();
                };
            }
        }
    }, 1000);
});
