/**
 * Viking Legacy - Military Panel
 * UI for managing warriors, expeditions, raids and warfare
 */

const MilitaryPanel = (function() {
    // Private variables
    let isInitialized = false;
    let currentView = 'overview'; // 'overview', 'expeditions', 'raids', 'battles'
    
    /**
     * Create the military panel
     */
    function createMilitaryPanel() {
        console.log("Creating military panel...");
        
        // Check if panel already exists in DOM
        const existingPanel = document.getElementById('military-panel');
        if (existingPanel) {
            console.log("Military panel already exists in DOM, skipping creation");
            return;
        }
        
        // Create panel container
        const militaryPanel = document.createElement('div');
        militaryPanel.id = 'military-panel';
        militaryPanel.className = 'panel';
        
        // Add panel content
        militaryPanel.innerHTML = `
            <h2>Military & Warfare</h2>
            
            <div class="panel-tabs">
                <button id="btn-military-overview" class="panel-tab active">Overview</button>
                <button id="btn-military-expeditions" class="panel-tab">Expeditions</button>
                <button id="btn-military-raids" class="panel-tab">Raids</button>
                <button id="btn-military-battles" class="panel-tab">Battles</button>
            </div>
            
            <div class="panel-content">
                <div id="military-overview" class="panel-section active">
                    <h3>Military Forces</h3>
                    <div class="military-stats">
                        <div class="stat-row">
                            <div class="stat-label">Available Warriors:</div>
                            <div id="available-warriors" class="stat-value">0</div>
                        </div>
                        <div class="stat-row">
                            <div class="stat-label">Military Strength:</div>
                            <div id="military-strength" class="stat-value">0</div>
                        </div>
                        <div class="stat-row">
                            <div class="stat-label">Active Expeditions:</div>
                            <div id="active-expeditions-count" class="stat-value">0</div>
                        </div>
                    </div>
                    
                    <div class="actions-container">
                        <button id="btn-create-expedition" class="action-button">Create Expedition</button>
                        <button id="btn-plan-raid" class="action-button">Plan Raid</button>
                    </div>
                    
                    <div class="recent-events">
                        <h4>Recent Military Events</h4>
                        <div id="military-events-list">
                            <div class="empty-list">No recent military events.</div>
                        </div>
                    </div>
                </div>
                
                <div id="military-expeditions" class="panel-section">
                    <h3>Active Expeditions</h3>
                    <div id="expeditions-list">
                        <div class="empty-list">No active expeditions.</div>
                    </div>
                    
                    <div id="expedition-create" class="creation-form" style="display: none;">
                        <h4>Create New Expedition</h4>
                        <div class="form-row">
                            <label for="expedition-name">Expedition Name:</label>
                            <input type="text" id="expedition-name" placeholder="Enter name...">
                        </div>
                        <div class="form-row">
                            <label for="expedition-warriors">Warriors:</label>
                            <input type="number" id="expedition-warriors" min="1" max="5000" value="10" class="warrior-input">
                            <span class="warrior-input-hint">Enter number of warriors (1-5000)</span>
                        </div>
                        <div class="form-row">
                            <label for="expedition-target">Target:</label>
                            <select id="expedition-target">
                                <option value="">Select target region...</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button id="btn-launch-expedition">Launch Expedition</button>
                            <button id="btn-cancel-expedition">Cancel</button>
                        </div>
                    </div>
                </div>
                
                <div id="military-raids" class="panel-section">
                    <h3>Raids & Conquests</h3>
                    <div id="raids-list">
                        <div class="empty-list">No active raids.</div>
                    </div>
                    
                    <div id="raid-planner" class="creation-form" style="display: none;">
                        <h4>Plan New Raid</h4>
                        <div class="form-row">
                            <label for="raid-target">Target Settlement:</label>
                            <select id="raid-target">
                                <option value="">Select target settlement...</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label for="raid-warriors">Warriors:</label>
                            <input type="number" id="raid-warriors" min="5" max="5000" value="15" class="warrior-input">
                            <span class="warrior-input-hint">Enter number of warriors (5-5000)</span>
                        </div>
                        <div class="form-actions">
                            <button id="btn-launch-raid">Launch Raid</button>
                            <button id="btn-cancel-raid">Cancel</button>
                        </div>
                    </div>
                </div>
                
                <div id="military-battles" class="panel-section">
                    <h3>Battles & Sieges</h3>
                    <div id="battles-list">
                        <div class="empty-list">No active battles.</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(militaryPanel);
            
            // Add event listeners
            setupEventListeners();
            
            // Update tabs content initially
            updateMilitaryOverview();
            
            console.log("Military panel created successfully");
        } else {
            console.error("Could not find .game-content element to add military panel");
        }
    }
    
    /**
     * Set up event listeners for the military panel
     */
    function setupEventListeners() {
        // Tab navigation
        document.getElementById('btn-military-overview').addEventListener('click', () => switchView('overview'));
        document.getElementById('btn-military-expeditions').addEventListener('click', () => switchView('expeditions'));
        document.getElementById('btn-military-raids').addEventListener('click', () => switchView('raids'));
        document.getElementById('btn-military-battles').addEventListener('click', () => switchView('battles'));
        
        // Action buttons
        document.getElementById('btn-create-expedition').addEventListener('click', showExpeditionCreation);
        document.getElementById('btn-plan-raid').addEventListener('click', showRaidPlanner);
        
        // Form actions
        document.getElementById('btn-launch-expedition').addEventListener('click', launchExpedition);
        document.getElementById('btn-cancel-expedition').addEventListener('click', hideExpeditionCreation);
        document.getElementById('btn-launch-raid').addEventListener('click', launchRaid);
        document.getElementById('btn-cancel-raid').addEventListener('click', hideRaidPlanner);
        
        // No slider listeners needed anymore - using direct number inputs
    }
    
    /**
     * Switch between different views in the military panel
     * @param {string} view - The view to switch to
     */
    function switchView(view) {
        // First hide any open creation forms to prevent UI locking
        hideExpeditionCreation();
        hideRaidPlanner();
        
        // Update current view
        currentView = view;
        
        // Hide all panel sections
        document.querySelectorAll('.panel-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const sectionElement = document.getElementById(`military-${view}`);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // Update tab buttons
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tabButton = document.getElementById(`btn-military-${view}`);
        if (tabButton) {
            tabButton.classList.add('active');
        }
        
        // Update content for the selected view
        if (view === 'overview') {
            updateMilitaryOverview();
        } else if (view === 'expeditions') {
            updateExpeditionsList();
        } else if (view === 'raids') {
            updateRaidsList();
        } else if (view === 'battles') {
            updateBattlesList();
        }
        
        // Check if we should show the raid planner
        if (view === 'raids') {
            // Check if there's an active siege
            const hasActiveSiege = hasPlayerSiege();
            
            if (hasActiveSiege) {
                // Don't show the raid planner, show a message instead
                showSiegeActiveMessage();
            }
        }
    }
    
    /**
     * Check if player has an active siege
     * @returns {boolean} - Whether player has an active siege
     */
    function hasPlayerSiege() {
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpeditions) {
            return false;
        }
        
        const playerExpeditions = ExpeditionSystem.getExpeditions('player');
        return playerExpeditions.some(exp => exp.status === 'sieging');
    }
    
    /**
     * Show a message about active siege in raids panel
     */
    function showSiegeActiveMessage() {
        const raidsList = document.getElementById('raids-list');
        if (!raidsList) return;
        
        // Remove any existing message
        const existingMessage = raidsList.querySelector('.siege-active-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Add new message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'siege-active-message';
        messageDiv.innerHTML = `
            <div class="notification warning">
                <p>You have an active siege in progress. New raids cannot be planned until the siege is concluded.</p>
                <p>You can switch to the Battles tab to view siege progress.</p>
            </div>
        `;
        
        raidsList.appendChild(messageDiv);
    }
    
    /**
     * Update the military overview with current information
     */
    function updateMilitaryOverview() {
        // Update available warriors count
        let availableWarriors = 0;
        if (typeof PopulationManager !== 'undefined' && PopulationManager.getWarriors) {
            availableWarriors = PopulationManager.getWarriors();
        }
        document.getElementById('available-warriors').textContent = availableWarriors;
        
        // Calculate military strength (simplified)
        document.getElementById('military-strength').textContent = availableWarriors;
        
        // Update active expeditions count
        let expeditionsCount = 0;
        if (window.ExpeditionSystem && ExpeditionSystem.getExpeditions) {
            expeditionsCount = ExpeditionSystem.getExpeditions('player').length;
        }
        document.getElementById('active-expeditions-count').textContent = expeditionsCount;
        
        // Update recent events (placeholder)
        updateMilitaryEventsList();
    }
    
    /**
     * Update the list of military events
     */
    function updateMilitaryEventsList() {
        const eventsList = document.getElementById('military-events-list');
        if (!eventsList) return;
        
        // For now, just use placeholder content
        // In a full implementation, this would fetch recent battles, raids, etc.
        eventsList.innerHTML = `
        
        `;
    }
    
    /**
     * Show the expedition creation form
     */
    function showExpeditionCreation() {
        // Switch to expeditions view
        switchView('expeditions');
        
        // Show creation form
        document.getElementById('expedition-create').style.display = 'block';
        
        // Populate target options
        populateTargetRegions();
    }
    
    /**
     * Hide the expedition creation form
     */
    function hideExpeditionCreation() {
        const form = document.getElementById('expedition-create');
        if (form) {
            form.style.display = 'none';
        }
    }
    
    /**
 * Populate the target regions dropdown with discovered regions
 */
    function populateTargetRegions() {
        const targetSelect = document.getElementById('expedition-target');
        
        // IMPORTANT: Completely clear the dropdown first
        targetSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select target region...";
        targetSelect.appendChild(defaultOption);
        
        // Get player region
        const playerRegion = WorldMap.getPlayerRegion();
        if (!playerRegion) return;
        
        // Get all discovered regions and ensure no duplicates
        const discoveredRegions = WorldMap.getDiscoveredRegions();
        const processedRegionIds = new Set(); // Track which regions we've already added
        
        // Create a single optgroup for player's home region to avoid duplication
        const homeGroup = document.createElement('optgroup');
        homeGroup.label = "Your Territory";
        
        // Add player's region with enhanced info
        const playerOption = document.createElement('option');
        playerOption.value = playerRegion.id;
        playerOption.textContent = `${playerRegion.name} (Your Region) [${playerRegion.typeName || playerRegion.type}]`;
        playerOption.style.backgroundColor = '#e8f5e9';
        homeGroup.appendChild(playerOption);
        targetSelect.appendChild(homeGroup);
        
        // Mark player region as processed
        processedRegionIds.add(playerRegion.id);
        
        // Group other regions by landmass
        const regionsByLandmass = {};
        
        discoveredRegions.forEach(region => {
            // Skip regions we've already processed
            if (processedRegionIds.has(region.id)) return;
            
            const landmass = WorldMap.getLandmass(region.landmass);
            if (!landmass) return;
            
            const landmassId = landmass.id;
            
            if (!regionsByLandmass[landmassId]) {
                regionsByLandmass[landmassId] = {
                    name: landmass.name,
                    type: landmass.type,
                    regions: []
                };
            }
            
            regionsByLandmass[landmassId].regions.push(region);
            processedRegionIds.add(region.id); // Mark as processed
        });
        
        // Add each landmass group to the dropdown
        Object.keys(regionsByLandmass).forEach(landmassId => {
            const landmassInfo = regionsByLandmass[landmassId];
            
            // Skip if no regions to add
            if (landmassInfo.regions.length === 0) return;
            
            // Create optgroup for this landmass
            const optgroup = document.createElement('optgroup');
            optgroup.label = landmassInfo.name;
            
            // Set background color based on landmass type
            if (landmassInfo.type === "Viking Homeland") {
                optgroup.style.backgroundColor = '#ffebee';
            } else if (landmassInfo.type === "Britannia") {
                optgroup.style.backgroundColor = '#e3f2fd';
            } else if (landmassInfo.type === "Frankia") {
                optgroup.style.backgroundColor = '#f3e5f5';
            }
            
            // Add regions for this landmass
            landmassInfo.regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                
                // Get region type and format
                const regionType = region.typeName || region.type;
                const coastalIndicator = (region.type === 'COASTAL' || region.type === 'FJORD') ? " ⚓" : "";
                
                option.textContent = `${region.name} [${regionType}${coastalIndicator}]`;
                
                // Set background color based on region type
                if (region.type === 'COASTAL' || region.type === 'FJORD') {
                    option.style.backgroundColor = '#e1f5fe';
                } else if (region.type === 'FOREST') {
                    option.style.backgroundColor = '#e8f5e9';
                } else if (region.type === 'MOUNTAINS') {
                    option.style.backgroundColor = '#f5f5f5';
                } else if (region.type === 'PLAINS') {
                    option.style.backgroundColor = '#fffde7';
                }
                
                optgroup.appendChild(option);
            });
            
            targetSelect.appendChild(optgroup);
        });
    }
    
    /**
     * Launch a new expedition
     */
    function launchExpedition() {
        // Get form values
        const name = document.getElementById('expedition-name').value.trim();
        const warriors = parseInt(document.getElementById('expedition-warriors').value);
        const targetRegionId = document.getElementById('expedition-target').value;
        
        if (!name || warriors <= 0 || !targetRegionId) {
            // Display error
            Utils.log("Invalid expedition parameters. Please provide a name, warriors, and target.", "danger");
            return;
        }
        
        // Check if ExpeditionSystem exists
        if (!window.ExpeditionSystem || !ExpeditionSystem.createPlayerExpedition) {
            // Mock expedition for testing
            console.log(`Creating mock expedition: ${name} with ${warriors} warriors to region ${targetRegionId}`);
            Utils.log(`Created mock expedition: ${name} with ${warriors} warriors`, "important");
            
            // Hide form
            hideExpeditionCreation();
            
            // Update UI
            updateExpeditionsList();
            return;
        }
        
        try {
            // Create the expedition
            const expedition = ExpeditionSystem.createPlayerExpedition({
                name: name,
                warriors: warriors,
                regionId: WorldMap.getPlayerRegion()?.id
            });
            
            if (!expedition) {
                Utils.log("Failed to create expedition. Not enough warriors?", "danger");
                return;
            }
            
            // Launch expedition
            const result = ExpeditionSystem.startExpedition(expedition.id, {
                targetRegionId: targetRegionId
            });
            
            if (result) {
                Utils.log(`Your expedition ${name} has begun the journey!`, "important");
            } else {
                Utils.log("The expedition could not be launched. Path blocked?", "danger");
            }
            
            // Hide form
            hideExpeditionCreation();
            
            // Update UI
            updateExpeditionsList();
        } catch (error) {
            console.error("Error launching expedition:", error);
            Utils.log("An error occurred while trying to launch the expedition.", "danger");
        }
    }
    
    /**
     * Update the list of expeditions
     */
    function updateExpeditionsList() {
        const expeditionsList = document.getElementById('expeditions-list');
        if (!expeditionsList) return;
        
        // Check if ExpeditionSystem exists
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpeditions) {
            expeditionsList.innerHTML = '<div class="empty-list">Expedition system not available.</div>';
            return;
        }
        
        try {
            // Get player expeditions
            const expeditions = ExpeditionSystem.getExpeditions('player');
            
            if (expeditions.length === 0) {
                expeditionsList.innerHTML = '<div class="empty-list">No active expeditions.</div>';
                return;
            }
            
            // Create HTML for each expedition
            let expeditionsHTML = '';
            
            expeditions.forEach(expedition => {
                // Get current region name
                let regionName = 'Unknown';
                if (expedition.currentRegion) {
                    const region = WorldMap.getRegion(expedition.currentRegion);
                    if (region) regionName = region.name;
                }
                
                // Get status text
                const statusText = expedition.status.charAt(0).toUpperCase() + expedition.status.slice(1);
                
                expeditionsHTML += `
                    <div class="expedition-item status-${expedition.status}">
                        <div class="expedition-header">
                            <div class="expedition-name">${expedition.name}</div>
                            <div class="expedition-status">${statusText}</div>
                        </div>
                        <div class="expedition-details">
                            <div class="detail-row">
                                <div class="detail-label">Warriors:</div>
                                <div class="detail-value">${expedition.warriors}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Location:</div>
                                <div class="detail-value">${regionName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Days Active:</div>
                                <div class="detail-value">${Math.floor(expedition.daysActive || 0)}</div>
                            </div>
                        </div>
                        <div class="expedition-actions">
                            <button class="btn-recall" data-expedition-id="${expedition.id}">Recall</button>
                        </div>
                    </div>
                `;
            });
            
            expeditionsList.innerHTML = expeditionsHTML;
            
            // Add event listeners to recall buttons
            expeditionsList.querySelectorAll('.btn-recall').forEach(button => {
                button.addEventListener('click', function() {
                    const expeditionId = this.dataset.expeditionId;
                    if (window.ExpeditionSystem && ExpeditionSystem.recallExpedition) {
                        ExpeditionSystem.recallExpedition(expeditionId);
                        Utils.log("You've recalled your expedition. It will return to your settlement.", "important");
                        updateExpeditionsList();
                    }
                });
            });
        } catch (error) {
            console.error("Error updating expeditions list:", error);
            expeditionsList.innerHTML = '<div class="empty-list">Error loading expeditions.</div>';
        }
    }
    
    /**
     * Show the raid planner
     */
    function showRaidPlanner() {
        // Check for active sieges first
        if (hasPlayerSiege()) {
            // Switch to raids view to show the message
            switchView('raids');
            // Show message about active siege
            showSiegeActiveMessage();
            return;
        }
        
        // Switch to raids view
        switchView('raids');
        
        // Show planner
        document.getElementById('raid-planner').style.display = 'block';
        
        // Populate target options
        populateTargetSettlements();
    }
    
    /**
     * Hide the raid planner
     */
    function hideRaidPlanner() {
        const planner = document.getElementById('raid-planner');
        if (planner) {
            planner.style.display = 'none';
        }
    }
    
    /**
     * Populate the target settlements dropdown
     */
    function populateTargetSettlements() {
        const targetSelect = document.getElementById('raid-target');
        
        // IMPORTANT: Completely clear the dropdown 
        targetSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select target settlement...";
        targetSelect.appendChild(defaultOption);
        
        // Get all discovered settlements, ensuring no duplicates
        const raidableSettlements = WorldMap.getDiscoveredSettlements ? 
            WorldMap.getDiscoveredSettlements().filter(s => !s.isPlayer) :
            (WorldMap.getPlayerSettlement() && WorldMap.getNearbySettlements ? 
                WorldMap.getNearbySettlements(WorldMap.getPlayerSettlement().id).filter(s => !s.isPlayer) : 
                []);
        
        const processedSettlementIds = new Set(); // Track processed settlements
        
        // Group settlements by landmass
        const settlementsByLandmass = {};
        
        raidableSettlements.forEach(settlement => {
            // Skip if already processed
            if (processedSettlementIds.has(settlement.id)) return;
            
            if (!settlement.region) return;
            
            const region = WorldMap.getRegion(settlement.region);
            if (!region) return;
            
            const landmass = WorldMap.getLandmass(region.landmass);
            if (!landmass) return;
            
            const landmassId = landmass.id;
            
            if (!settlementsByLandmass[landmassId]) {
                settlementsByLandmass[landmassId] = {
                    name: landmass.name,
                    type: landmass.type,
                    settlements: []
                };
            }
            
            // Add region info to settlement for display
            settlement.regionInfo = region;
            settlementsByLandmass[landmassId].settlements.push(settlement);
            processedSettlementIds.add(settlement.id); // Mark as processed
        });
        
        // Add each landmass group to the dropdown
        Object.keys(settlementsByLandmass).forEach(landmassId => {
            const landmassInfo = settlementsByLandmass[landmassId];
            
            // Skip if no settlements
            if (landmassInfo.settlements.length === 0) return;
            
            // Create optgroup for this landmass
            const optgroup = document.createElement('optgroup');
            optgroup.label = landmassInfo.name;
            
            // Set background color based on landmass type
            if (landmassInfo.type === "Viking Homeland") {
                optgroup.style.backgroundColor = '#ffebee';
            } else if (landmassInfo.type === "Britannia") {
                optgroup.style.backgroundColor = '#e3f2fd';
            } else if (landmassInfo.type === "Frankia") {
                optgroup.style.backgroundColor = '#f3e5f5';
            }
            
            // Add settlements for this landmass
            landmassInfo.settlements.forEach(settlement => {
                const option = document.createElement('option');
                option.value = settlement.id;
                
                // Try to get faction information if available
                let factionInfo = settlement.type;
                
                option.textContent = `${settlement.name} (${settlement.type}) - ${settlement.regionInfo.name}`;
                
                // Set background color based on settlement type
                if (settlement.type === 'Viking') {
                    option.style.backgroundColor = '#ffebee';
                } else if (settlement.type === 'Anglo') {
                    option.style.backgroundColor = '#e3f2fd';
                } else if (settlement.type === 'Frankish') {
                    option.style.backgroundColor = '#f3e5f5';
                } else {
                    option.style.backgroundColor = '#f5f5f5'; // Neutral
                }
                
                optgroup.appendChild(option);
            });
            
            targetSelect.appendChild(optgroup);
        });
    }

    function addDropdownStyles() {
        // Check if styles are already added
        if (document.getElementById('dropdown-style-enhancements')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'dropdown-style-enhancements';
        styleElement.textContent = `
            /* Dropdown styling */
            #expedition-target, #raid-target {
                max-width: 100%;
                font-family: sans-serif;
            }
            
            /* Category styling */
            optgroup {
                font-weight: bold;
                padding: 5px;
            }
            
            /* Landmass colors */
            optgroup.viking-lands {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            optgroup.anglo-lands {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            optgroup.frankish-lands {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            /* Option styling */
            option {
                padding: 5px 3px;
            }
            
            option.player-region {
                font-weight: bold;
                background-color: #e8f5e9;
            }
            
            /* Region types */
            option.region-coastal, option.region-fjord {
                background-color: #e1f5fe;
            }
            
            option.region-forest {
                background-color: #e8f5e9;
            }
            
            option.region-mountains {
                background-color: #f5f5f5;
            }
            
            option.region-plains {
                background-color: #fffde7;
            }
            
            /* Settlement types */
            option.settlement-viking {
                background-color: #ffebee;
            }
            
            option.settlement-anglo {
                background-color: #e3f2fd;
            }
            
            option.settlement-frankish {
                background-color: #f3e5f5;
            }
            
            option.settlement-neutral {
                background-color: #f5f5f5;
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    
    
    /**
     * Launch a new raid
     */
    function launchRaid() {
        // Check for active sieges first
        if (hasPlayerSiege()) {
            Utils.log("You cannot start a new raid while you have an active siege.", "danger");
            hideRaidPlanner();
            return;
        }
        
        // Get form values
        const warriors = parseInt(document.getElementById('raid-warriors').value);
        const targetSettlementId = document.getElementById('raid-target').value;
        
        if (warriors <= 0 || !targetSettlementId) {
            Utils.log("Invalid raid parameters. Please select a target and number of warriors.", "danger");
            return;
        }
        
        // Check if ExpeditionSystem exists
        if (!window.ExpeditionSystem || !ExpeditionSystem.createPlayerExpedition) {
            // Mock raid for testing
            console.log(`Creating mock raid with ${warriors} warriors to settlement ${targetSettlementId}`);
            Utils.log(`Sending ${warriors} warriors to raid the target settlement.`, "important");
            
            // Hide form
            hideRaidPlanner();
            
            // Update UI
            updateRaidsList();
            return;
        }
        
        // Get settlement for name
        const settlement = WorldMap.getSettlement(targetSettlementId);
        const settlementName = settlement ? settlement.name : 'Enemy Settlement';
        
        try {
            // Create the expedition
            const expedition = ExpeditionSystem.createPlayerExpedition({
                name: `Raid on ${settlementName}`,
                type: 'raid',
                warriors: warriors,
                regionId: WorldMap.getPlayerRegion()?.id
            });
            
            if (!expedition) {
                Utils.log("Failed to create raid expedition. Not enough warriors?", "danger");
                return;
            }
            
            // Launch expedition targeting the settlement
            const result = ExpeditionSystem.startExpedition(expedition.id, {
                targetSettlementId: targetSettlementId
            });
            
            if (result) {
                Utils.log(`Your raid expedition with ${warriors} warriors has set out toward ${settlementName}!`, "important");
            } else {
                Utils.log("The raid could not be launched. Path blocked?", "danger");
            }
            
            // Hide form
            hideRaidPlanner();
            
            // Update UI
            updateRaidsList();
        } catch (error) {
            console.error("Error launching raid:", error);
            Utils.log("An error occurred while trying to launch the raid.", "danger");
        }
    }
    
    /**
     * Update the list of raids
     */
    function updateRaidsList() {
        const raidsList = document.getElementById('raids-list');
        if (!raidsList) return;
        
        // For now, just display expeditions that are raiding or sieging
        if (!window.ExpeditionSystem || !ExpeditionSystem.getExpeditions) {
            raidsList.innerHTML = '<div class="empty-list">Raid system not available.</div>';
            return;
        }
        
        try {
            // Get player expeditions
            const allExpeditions = ExpeditionSystem.getExpeditions('player');
            const raids = allExpeditions.filter(exp => 
                exp.status === 'raiding' || exp.status === 'sieging'
            );
            
            if (raids.length === 0) {
                raidsList.innerHTML = '<div class="empty-list">No active raids.</div>';
                
                // Check if there's an active siege to show a message
                if (hasPlayerSiege()) {
                    showSiegeActiveMessage();
                }
                
                return;
            }
            
            // Create HTML for each raid
            let raidsHTML = '';
            
            raids.forEach(raid => {
                // Get status text
                const statusText = raid.status === 'raiding' ? 'Raiding' : 'Sieging';
                
                // Get target info
                let targetName = 'Unknown';
                if (raid.targetSettlement) {
                    const settlement = WorldMap.getSettlement(raid.targetSettlement);
                    if (settlement) targetName = settlement.name;
                } else if (raid.currentRegion) {
                    const region = WorldMap.getRegion(raid.currentRegion);
                    if (region) targetName = region.name + ' Region';
                }
                
                // Get progress
                let progressHTML = '';
                if (raid.status === 'sieging' && raid.siegeProgress !== undefined) {
                    progressHTML = `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${raid.siegeProgress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(raid.siegeProgress)}%</div>
                    `;
                }
                
                raidsHTML += `
                    <div class="raid-item status-${raid.status}">
                        <div class="raid-header">
                            <div class="raid-name">${raid.name}</div>
                            <div class="raid-status">${statusText}</div>
                        </div>
                        <div class="raid-details">
                            <div class="detail-row">
                                <div class="detail-label">Target:</div>
                                <div class="detail-value">${targetName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Warriors:</div>
                                <div class="detail-value">${raid.warriors}</div>
                            </div>
                            ${progressHTML ? `
                            <div class="detail-row">
                                <div class="detail-label">Progress:</div>
                                <div class="detail-value">${progressHTML}</div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            raidsList.innerHTML = raidsHTML;
            
            // If there's an active siege, show warning about not being able to start new raids
            if (raids.some(raid => raid.status === 'sieging')) {
                showSiegeActiveMessage();
            }
            
        } catch (error) {
            console.error("Error updating raids list:", error);
            raidsList.innerHTML = '<div class="empty-list">Error loading raids.</div>';
        }
    }
    
    /**
     * Update the list of battles
     */
    function updateBattlesList() {
        const battlesList = document.getElementById('battles-list');
        if (!battlesList) return;
        
        // Check if ConflictSystem exists
        if (!window.ConflictSystem || !ConflictSystem.getActiveBattles) {
            battlesList.innerHTML = '<div class="empty-list">Battle system not available.</div>';
            return;
        }
        
        try {
            // Get active battles and sieges
            const battles = ConflictSystem.getActiveBattles();
            const sieges = ConflictSystem.getActiveSieges();
            
            if (battles.length === 0 && sieges.length === 0) {
                battlesList.innerHTML = '<div class="empty-list">No active battles or sieges.</div>';
                return;
            }
            
            // Create HTML for battles and sieges
            let battlesHTML = '';
            
            // Add battles
            battles.forEach(battle => {
                // Get phase text
                const phaseText = battle.phase.charAt(0).toUpperCase() + battle.phase.slice(1);
                
                // Determine advantage
                let advantageText = 'Even';
                let advantageClass = 'neutral';
                
                if (battle.advantage > 30) {
                    advantageText = 'Advantage';
                    advantageClass = 'advantage';
                } else if (battle.advantage < -30) {
                    advantageText = 'Disadvantage';
                    advantageClass = 'disadvantage';
                }
                
                battlesHTML += `
                    <div class="battle-item phase-${battle.phase}">
                        <div class="battle-header">
                            <div class="battle-name">Battle of ${battle.regionName || 'Unknown Region'}</div>
                            <div class="battle-phase">${phaseText}</div>
                        </div>
                        <div class="battle-details">
                            <div class="detail-row">
                                <div class="detail-label">Your Forces:</div>
                                <div class="detail-value">${battle.attackerStrength}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Enemy Forces:</div>
                                <div class="detail-value">${battle.defenderStrength}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Status:</div>
                                <div class="detail-value advantage-${advantageClass}">${advantageText}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Add sieges that aren't already represented in raids list
            sieges.forEach(siege => {
                battlesHTML += `
                    <div class="siege-item phase-${siege.phase}">
                        <div class="siege-header">
                            <div class="siege-name">Siege of ${siege.settlementName || 'Unknown Settlement'}</div>
                            <div class="siege-phase">${siege.phase.charAt(0).toUpperCase() + siege.phase.slice(1)}</div>
                        </div>
                        <div class="siege-details">
                            <div class="detail-row">
                                <div class="detail-label">Progress:</div>
                                <div class="detail-value">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${siege.progress}%"></div>
                                    </div>
                                    <div class="progress-text">${Math.round(siege.progress)}%</div>
                                </div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Days Active:</div>
                                <div class="detail-value">${Math.floor(siege.daysActive || 0)}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            battlesList.innerHTML = battlesHTML;
        } catch (error) {
            console.error("Error updating battles list:", error);
            battlesList.innerHTML = '<div class="empty-list">Error loading battles.</div>';
        }
    }
    
    /**
     * Add CSS styles for the military panel
     */
    function addMilitaryPanelStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'military-panel-styles';
        styleElement.textContent = `
            /* Military Panel Styles */
            #military-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                height: 100%;
                overflow-y: auto;
            }
            
            #military-panel h2 {
                color: #5d4037;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-top: 0;
                margin-bottom: 15px;
            }
            
            #military-panel h3 {
                color: #8b5d33;
                margin-top: 0;
                margin-bottom: 12px;
            }
            
            #military-panel h4 {
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 10px;
                border-bottom: 1px solid #d7cbb9;
                padding-bottom: 5px;
            }
            
            .panel-tabs {
                display: flex;
                border-bottom: 1px solid #c9ba9b;
                margin-bottom: 15px;
            }
            
            .panel-tab {
                padding: 8px 12px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                margin-right: 10px;
                color: #5d4037;
                cursor: pointer;
            }
            
            .panel-tab:hover {
                background-color: #f0e6d2;
            }
            
            .panel-tab.active {
                border-bottom-color: #8b5d33;
                color: #8b5d33;
                font-weight: 500;
            }
            
            .panel-section {
                display: none;
            }
            
            .panel-section.active {
                display: block;
            }
            
            .military-stats {
                background-color: #f7f0e3;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .stat-row:last-child {
                margin-bottom: 0;
            }
            
            .stat-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            .stat-value {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .actions-container {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .action-button {
                padding: 8px 12px;
                background-color: #8b5d33;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .action-button:hover {
                background-color: #a97c50;
            }
            
            .recent-events {
                background-color: #f7f0e3;
                padding: 12px;
                border-radius: 6px;
            }
            
            .event-item {
                padding: 8px;
                border-bottom: 1px solid #e6d8c3;
            }
            
            .event-item:last-child {
                border-bottom: none;
            }
            
            .empty-list {
                padding: 12px;
                text-align: center;
                color: #8b7355;
                font-style: italic;
            }
            
            .creation-form {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                margin-top: 15px;
            }
            
            .form-row {
                margin-bottom: 12px;
            }
            
            .form-row label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .form-row input[type="text"],
            .form-row select {
                width: 100%;
                padding: 8px;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
            }
            
            .warrior-input {
                width: 100px;
                text-align: center;
                padding: 8px;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                font-size: 1rem;
            }
            
            .warrior-input-hint {
                margin-left: 10px;
                font-size: 0.9rem;
                color: #8b7355;
                font-style: italic;
            }
            
            .form-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
            }
            
            .expedition-item,
            .raid-item,
            .battle-item,
            .siege-item {
                background-color: #fff;
                border-radius: 6px;
                margin-bottom: 10px;
                padding: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .expedition-header,
            .raid-header,
            .battle-header,
            .siege-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                border-bottom: 1px solid #e6d8c3;
                padding-bottom: 8px;
            }
            
            .expedition-name,
            .raid-name,
            .battle-name,
            .siege-name {
                font-weight: 600;
                color: #5d4037;
            }
            
            .expedition-status,
            .raid-status,
            .battle-phase,
            .siege-phase {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.9rem;
                background-color: #e6d8c3;
            }
            
            .expedition-details,
            .raid-details,
            .battle-details,
            .siege-details {
                margin-bottom: 12px;
            }
            
            .detail-row {
                display: flex;
                margin-bottom: 6px;
            }
            
            .detail-label {
                width: 100px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .detail-value {
                color: #8b5d33;
            }
            
            .progress-bar {
                height: 8px;
                background-color: #e6d8c3;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 3px;
                width: 150px;
            }
            
            .progress-fill {
                height: 100%;
                background-color: #8b5d33;
                width: 0%;
            }
            
            .progress-text {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .expedition-actions {
                text-align: right;
            }
            
            .btn-recall {
                padding: 5px 10px;
                background-color: #d7cbb9;
                color: #5d4037;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .btn-recall:hover {
                background-color: #c9ba9b;
            }
            
            /* Status colors */
            .status-mustering .expedition-status {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .status-marching .expedition-status {
                background-color: #e8f5e9;
                color: #2e7d32;
            }
            
            .status-raiding .expedition-status,
            .status-raiding {
                background-color: #ffebee;
                color: #c62828;
            }
            
            .status-sieging .expedition-status,
            .status-sieging {
                background-color: #ede7f6;
                color: #6a1b9a;
            }
            
            .status-battling .expedition-status {
                background-color: #fff3e0;
                color: #e65100;
            }
            
            .status-returning .expedition-status {
                background-color: #fff8e1;
                color: #ff8f00;
            }
            
            .advantage-advantage {
                color: #2e7d32;
                font-weight: 500;
            }
            
            .advantage-disadvantage {
                color: #c62828;
                font-weight: 500;
            }
            
            .advantage-neutral {
                color: #8b7355;
            }
            
            /* Notification for active siege */
            .notification {
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
            }
            
            .notification.warning {
                background-color: #fff3e0;
                border-left: 4px solid #ff8f00;
                color: #e65100;
            }
            
            .notification p {
                margin: 5px 0;
            }
            
            .siege-active-message {
                margin-top: 15px;
            }
            
            /* Make sure all panel sections are interactive */
            .panel-section {
                pointer-events: auto;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Public API
    return {
        /**
         * Initialize the military panel
         */
        init: function() {
            console.log("Initializing Military Panel...");
            
            // Debug check if systems are available
            console.log("DEBUG: MilitaryPanel initialization check");
            console.log("ExpeditionSystem available:", window.ExpeditionSystem !== undefined);
            console.log("ConflictSystem available:", window.ConflictSystem !== undefined);
            
            if (window.ExpeditionSystem) {
                console.log("ExpeditionSystem methods:", Object.keys(window.ExpeditionSystem));
            }
            
            if (window.ConflictSystem) {
                console.log("ConflictSystem methods:", Object.keys(window.ConflictSystem));
            }
            
            // Check if already initialized
            if (isInitialized) {
                console.log("Military panel already initialized");
                return;
            }
            
            // Add CSS styles
            addMilitaryPanelStyles();
            
            // Create the panel
            createMilitaryPanel();
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined' && NavigationSystem.registerPanel) {
                // We must register the panel ID exactly as 'military-panel' since that's what NavigationSystem expects
                NavigationSystem.registerPanel('military-panel', 'military');
                console.log("Military panel registered with navigation system");
            } else {
                console.warn("NavigationSystem not available, panel may not be accessible");
            }
            
            // Set up periodic updates
            setInterval(() => {
                const panel = document.getElementById('military-panel');
                if (panel && !panel.classList.contains('hidden-panel')) {
                    this.update();
                }
            }, 2000);
            
            isInitialized = true;
            console.log("Military Panel initialized successfully");
        },

                /**
         * Debug function to check region discovery status
         */
        debugCheckDiscovery: function() {
            console.group("Region Discovery Debug");
            
            const allRegions = WorldMap.getWorldMap().regions;
            console.log(`Total regions: ${allRegions.length}`);
            
            const discoveredRegions = WorldMap.getDiscoveredRegions();
            console.log(`Discovered regions: ${discoveredRegions.length}`);
            
            discoveredRegions.forEach(region => {
                console.log(`- ${region.name} (${region.id})`);
            });
            
            console.groupEnd();
        },
        
        /**
         * Update panel content
         */
        update: function() {
            // Update based on current view
            if (currentView === 'overview') {
                updateMilitaryOverview();
            } else if (currentView === 'expeditions') {
                updateExpeditionsList();
            } else if (currentView === 'raids') {
                updateRaidsList();
            } else if (currentView === 'battles') {
                updateBattlesList();
            }
        },
        
        /**
         * Get the current view
         * @returns {string} - Current view
         */
        getCurrentView: function() {
            return currentView;
        },
        
        /**
         * Switch to a specific view
         * @param {string} view - View to switch to
         */
        switchToView: function(view) {
            switchView(view);
        }
    };
})();

// Expose MilitaryPanel to the window object for global access
window.MilitaryPanel = MilitaryPanel;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game engine to be ready
    const waitForGameEngine = setInterval(function() {
        if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning) {
            clearInterval(waitForGameEngine);
            
            // Initialize the military panel
            MilitaryPanel.init();
            
            // Log for debugging
            console.log("Military Panel initialization triggered from DOMContentLoaded");
        }
    }, 500);
});

