/**
 * Viking Legacy - Building-Based Worker System Integration
 * Replaces manual worker assignment with automatic building-based allocation
 */

(function() {
    /**
     * Update the worker assignment UI
     */
    function updateWorkerAssignmentUI() {
        // Get the actions panel where worker controls currently exist
        const actionsPanel = document.querySelector('.actions-panel');
        if (!actionsPanel) return;
        
        // Find the assign actions section
        const assignActions = actionsPanel.querySelector('.assign-actions');
        if (!assignActions) return;
        
        // Get current worker assignments and capacity
        const assignments = BuildingSystem.getWorkerAssignments();
        const capacity = BuildingSystem.getAvailableCapacity();
        const unassigned = PopulationManager.getUnassignedWorkers();
        
        // Replace content with new building-based assignment display
        assignActions.innerHTML = `
            <h3>Workers (Building-Based)</h3>
            <div class="worker-stats">
                <div class="worker-stat">
                    <span class="worker-label">Farmers:</span>
                    <span id="farmers-count">${assignments.farmers}</span>
                    <span class="capacity-text">/ ${capacity.farmers} capacity</span>
                </div>
                <div class="worker-stat">
                    <span class="worker-label">Woodcutters:</span>
                    <span id="woodcutters-count">${assignments.woodcutters}</span>
                    <span class="capacity-text">/ ${capacity.woodcutters} capacity</span>
                </div>
                <div class="worker-stat">
                    <span class="worker-label">Miners:</span>
                    <span id="miners-count">${assignments.miners}</span>
                    <span class="capacity-text">/ ${capacity.miners} capacity</span>
                </div>
                <div class="worker-stat unassigned">
                    <span class="worker-label">Unassigned Workers:</span>
                    <span id="unassigned-count">${unassigned}</span>
                </div>
            </div>
            <div class="worker-info">
                <p>Workers automatically fill jobs from buildings you construct.</p>
                <p>Build more production buildings to put your people to work!</p>
            </div>
        `;
    }

    /**
     * Update building UI to show worker information
     */
    function updateBuildingWorkerInfo() {
        const listElement = document.getElementById('available-buildings-list');
        if (!listElement) return;
        
        // Add worker capacity information to each building
        const buildingCards = listElement.querySelectorAll('.available-building');
        buildingCards.forEach(card => {
            const buildingButton = card.querySelector('.build-btn');
            if (!buildingButton) return;
            
            const buildingId = buildingButton.dataset.building;
            const building = BuildingSystem.getBuildingType(buildingId);
            
            if (!building || !building.workerCapacity) return;
            
            // Find or create worker info element
            let workerInfo = card.querySelector('.building-workers-info');
            if (!workerInfo) {
                workerInfo = document.createElement('div');
                workerInfo.className = 'building-workers-info';
                
                // Insert after building requirements
                const reqsElement = card.querySelector('.building-requirements');
                if (reqsElement) {
                    reqsElement.insertAdjacentElement('afterend', workerInfo);
                } else {
                    card.appendChild(workerInfo);
                }
            }
            
            // Worker info based on building type
            let workerType = "workers";
            if (buildingId.includes('farm') || buildingId.includes('fishing') || buildingId.includes('hunting')) {
                workerType = "farmers";
            } else if (buildingId.includes('woodcutter') || buildingId.includes('sawmill')) {
                workerType = "woodcutters";
            } else if (buildingId.includes('quarry') || buildingId.includes('mine') || 
                       buildingId.includes('smithy') || buildingId.includes('forge')) {
                workerType = "miners";
            }
            
            workerInfo.innerHTML = `
                <div class="worker-capacity">
                    <span class="capacity-label">Employs:</span>
                    <span class="capacity-value">${building.workerCapacity} ${workerType}</span>
                </div>
            `;
        });
    }

    /**
     * Add CSS styles for worker system
     */
    function addWorkerSystemStyles() {
        // Check if styles are already added
        if (document.getElementById('worker-system-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'worker-system-styles';
        styleEl.textContent = `
            .worker-stats {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                margin-top: 10px;
            }
            
            .worker-stat {
                display: flex;
                align-items: center;
                margin: 12px 0;
                padding: 8px 12px;
                background-color: #ffffff;
                border-radius: 4px;
                border-left: 4px solid #8b5d33;
            }
            
            .worker-label {
                width: 120px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .capacity-text {
                margin-left: 10px;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .unassigned {
                border-left-color: #c62828;
                margin-top: 20px;
            }
            
            .worker-info {
                margin-top: 15px;
                font-size: 0.9rem;
                color: #5d4037;
                font-style: italic;
            }
            
            .building-workers-info {
                margin: 8px 0;
                padding: 5px 8px;
                background-color: #f1e8d8;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .capacity-label {
                font-weight: 500;
                margin-right: 5px;
            }
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Initialize the worker system
     */
    function initWorkerSystem() {
        console.log("Initializing building-based worker system...");
        
        // Add CSS styles
        addWorkerSystemStyles();
        
        // Initial UI update
        updateWorkerAssignmentUI();
        
        // Hook into BuildingSystem to update worker info
        if (typeof BuildingSystem !== 'undefined') {
            const originalUpdateUI = BuildingSystem.updateBuildingUI;
            if (typeof originalUpdateUI === 'function') {
                BuildingSystem.updateBuildingUI = function() {
                    originalUpdateUI.apply(this, arguments);
                    updateBuildingWorkerInfo();
                };
            }
        }
        
        // Hook into game tick to update worker UI
        if (typeof GameEngine !== 'undefined') {
            // Setup a timer to update the UI periodically
            setInterval(updateWorkerAssignmentUI, 2000);
        }
        
        // Disable old worker control buttons
        const incrementButtons = document.querySelectorAll('.increment');
        const decrementButtons = document.querySelectorAll('.decrement');
        
        [...incrementButtons, ...decrementButtons].forEach(button => {
            button.disabled = true;
            button.style.opacity = 0.5;
            button.style.cursor = 'not-allowed';
            
            // Remove event listeners by cloning
            const clone = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(clone, button);
            }
        });
        
        // Update initial production rates
        if (typeof ResourceManager !== 'undefined' && typeof ResourceManager.updateProductionRates === 'function') {
            const workerAssignments = typeof BuildingSystem !== 'undefined' && 
                                     typeof BuildingSystem.getWorkerAssignments === 'function' ?
                                     BuildingSystem.getWorkerAssignments() : 
                                     null;
                                     
            if (workerAssignments) {
                ResourceManager.updateProductionRates(workerAssignments);
            }
        }
        
        console.log("Building-based worker system initialized successfully!");
    }

    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkerSystem);
    } else {
        // DOM already loaded, run immediately
        initWorkerSystem();
    }
})();