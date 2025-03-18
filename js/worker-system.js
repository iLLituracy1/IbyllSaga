/**
 * Viking Legacy - Building-Based Worker System Integration
 * Provides job capacities from buildings without automatic assignment
 */

(function() {
    /**
     * Update the worker UI to show building job capacities
     */
    function updateWorkerCapacityUI() {
        // Get the actions panel where old worker controls exist
        const actionsPanel = document.querySelector('.actions-panel');
        if (!actionsPanel) return;
        
        // Find the assign actions section
        const assignActions = actionsPanel.querySelector('.assign-actions');
        if (!assignActions) return;
        
        // Get current worker assignments and capacity
        const assignments = PopulationManager.getWorkerAssignments();
        const capacity = BuildingSystem.getAvailableCapacity();
        const unassigned = PopulationManager.getUnassignedWorkers();
        
        // Update content with building capacity display (but not sliders - those are in worker-utilization.js)
        assignActions.innerHTML = `
            <h3>Workers (Building Jobs)</h3>
            <div class="worker-info">
                <p>Buildings provide jobs that need workers to function. Assign workers in the Workers tab.</p>
            </div>
            <div class="worker-stats">
                <div class="worker-stat">
                    <span class="worker-label">Farmer Jobs:</span>
                    <span id="farmers-capacity">${capacity.farmers || 0}</span>
                    <span class="employment-text">(${assignments.farmers || 0} filled)</span>
                </div>
                <div class="worker-stat">
                    <span class="worker-label">Woodcutter Jobs:</span>
                    <span id="woodcutters-capacity">${capacity.woodcutters || 0}</span>
                    <span class="employment-text">(${assignments.woodcutters || 0} filled)</span>
                </div>
                <div class="worker-stat">
                    <span class="worker-label">Miner Jobs:</span>
                    <span id="miners-capacity">${capacity.miners || 0}</span>
                    <span class="employment-text">(${assignments.miners || 0} filled)</span>
                </div>
                <div class="worker-stat unassigned">
                    <span class="worker-label">Unassigned Workers:</span>
                    <span id="unassigned-count">${unassigned}</span>
                </div>
            </div>
            <div class="open-workers-tab">
                <button id="go-to-workers-tab" class="worker-tab-btn">Go to Workers Tab</button>
            </div>
        `;
        
        // Add event listener for the go to workers tab button
        const goToWorkersTabBtn = document.getElementById('go-to-workers-tab');
        if (goToWorkersTabBtn && typeof NavigationSystem !== 'undefined') {
            goToWorkersTabBtn.addEventListener('click', function() {
                NavigationSystem.switchToTab('workers');
            });
        }
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
                    <span class="capacity-label">Provides jobs for:</span>
                    <span class="capacity-value">${building.workerCapacity} ${workerType}</span>
                </div>
                <div class="worker-note">
                    <span class="note-text">Assign workers in the Workers tab</span>
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
                width: 140px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .employment-text {
                margin-left: 10px;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .unassigned {
                border-left-color: #c62828;
                margin-top: 20px;
            }
            
            .worker-info {
                margin-top: 5px;
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
            
            .worker-note {
                margin-top: 4px;
                font-style: italic;
                font-size: 0.85rem;
                color: #8b7355;
            }
            
            .capacity-label {
                font-weight: 500;
                margin-right: 5px;
            }
            
            .open-workers-tab {
                margin-top: 15px;
                text-align: center;
            }
            
            .worker-tab-btn {
                background: linear-gradient(to bottom, #8b5d33, #6d4c2a);
                color: #f7f0e3;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border: 1px solid #5d4027;
            }
            
            .worker-tab-btn:hover {
                background: linear-gradient(to bottom, #a97c50, #8b5d33);
                transform: translateY(-1px);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
            }
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Initialize the worker system
     */
    function initWorkerSystem() {
        console.log("Initializing building-based worker system with manual allocation...");
        
        // Add CSS styles
        addWorkerSystemStyles();
        
        // Initial UI update
        updateWorkerCapacityUI();
        
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
            setInterval(updateWorkerCapacityUI, 2000);
        }
        
        // Update initial production rates
        if (typeof ResourceManager !== 'undefined' && typeof ResourceManager.updateProductionRates === 'function') {
            const workerAssignments = typeof PopulationManager !== 'undefined' && 
                                     typeof PopulationManager.getWorkerAssignments === 'function' ?
                                     PopulationManager.getWorkerAssignments() : 
                                     null;
                                     
            if (workerAssignments) {
                ResourceManager.updateProductionRates(workerAssignments);
            }
        }
        
        console.log("Building-based worker system initialized with manual allocation!");
    }

    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkerSystem);
    } else {
        // DOM already loaded, run immediately
        initWorkerSystem();
    }
})();