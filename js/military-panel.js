/**
 * Viking Legacy - Military Panel
 * UI for managing warriors, expeditions, raids and warfare
 * Enhanced with improved visual navigation and additional information
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
                            <label for="expedition-target">Target Region:</label>
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
        
        // Update recent events
        updateMilitaryEventsList();
    }
    
    /**
     * Update the list of military events
     */
    function updateMilitaryEventsList() {
        const eventsList = document.getElementById('military-events-list');
        if (!eventsList) return;
        
        // Get recent military-related log entries if available
        let recentEvents = [];
        
        // If we have access to the game log, filter for military events
        if (window.Utils && Utils.getRecentLogs) {
            recentEvents = Utils.getRecentLogs(5).filter(log => 
                log.message.toLowerCase().includes('warrior') || 
                log.message.toLowerCase().includes('expedition') ||
                log.message.toLowerCase().includes('raid') ||
                log.message.toLowerCase().includes('battle') ||
                log.message.toLowerCase().includes('siege')
            );
        }
        
        // If we have military events, display them
        if (recentEvents.length > 0) {
            let eventsHTML = '';
            recentEvents.forEach(event => {
                eventsHTML += `
                    <div class="event-item event-${event.type || 'normal'}">
                        <div class="event-message">${event.message}</div>
                    </div>
                `;
            });
            eventsList.innerHTML = eventsHTML;
        } else {
            // Otherwise show empty message
            eventsList.innerHTML = '<div class="empty-list">No recent military events.</div>';
        }
    }
    
    /**
     * Show the expedition creation form
     */
    function showExpeditionCreation() {
        // Switch to expeditions view
        switchView('expeditions');
        
        // Show creation form
        document.getElementById('expedition-create').style.display = 'block';
        
        // Populate target options with enhanced information
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
     * Populate the target regions dropdown with discovered regions and enhanced info
     */
    function populateTargetRegions() {
        const targetSelect = document.getElementById('expedition-target');
        
        // Clear existing options
        while (targetSelect.options.length > 1) {
            targetSelect.remove(1);
        }
        
        // Get player region
        const playerRegion = WorldMap.getPlayerRegion();
        if (!playerRegion) return;
        
        // Get player landmass
        const playerLandmass = WorldMap.getLandmass(playerRegion.landmass);
        const playerLandmassName = playerLandmass ? playerLandmass.name : 'Unknown Landmass';
        
        // Add player's own region with landmass info
        const ownRegionOption = document.createElement('option');
        ownRegionOption.value = playerRegion.id;
        ownRegionOption.textContent = `${playerRegion.name} (Your Region - ${playerLandmassName})`;
        ownRegionOption.className = 'option-player-region';
        targetSelect.appendChild(ownRegionOption);
        
        // Get all discovered regions
        const discoveredRegions = WorldMap.getDiscoveredRegions()
            .filter(region => region.id !== playerRegion.id); // Exclude player's region
        
        console.log(`Found ${discoveredRegions.length} discovered regions to add to dropdown`);
        
        // Group regions by landmass for better organization
        const regionsByLandmass = {};
        
        discoveredRegions.forEach(region => {
            const landmass = WorldMap.getLandmass(region.landmass);
            const landmassName = landmass ? landmass.name : 'Unknown Landmass';
            const landmassType = landmass ? landmass.type : 'Unknown';
            
            if (!regionsByLandmass[landmassName]) {
                regionsByLandmass[landmassName] = {
                    name: landmassName,
                    type: landmassType,
                    regions: []
                };
            }
            
            regionsByLandmass[landmassName].regions.push(region);
        });
        
        // Create optgroups for each landmass
        for (const landmassName in regionsByLandmass) {
            const landmassData = regionsByLandmass[landmassName];
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${landmassName} (${formatLandmassType(landmassData.type)})`;
            
            // Add regions to this optgroup
            landmassData.regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                
                // Determine region faction if possible
                let factionInfo = '';
                const settlementsInRegion = WorldMap.getSettlementsByRegion(region.id);
                if (settlementsInRegion && settlementsInRegion.length > 0) {
                    // Look for dominant faction
                    const factionCounts = {};
                    settlementsInRegion.forEach(settlement => {
                        if (settlement.faction) {
                            factionCounts[settlement.faction] = (factionCounts[settlement.faction] || 0) + 1;
                        }
                    });
                    
                    let dominantFaction = null;
                    let maxCount = 0;
                    for (const faction in factionCounts) {
                        if (factionCounts[faction] > maxCount) {
                            dominantFaction = faction;
                            maxCount = factionCounts[faction];
                        }
                    }
                    
                    if (dominantFaction) {
                        factionInfo = ` - ${dominantFaction}`;
                    }
                }
                
                // Add region info to option text
                option.textContent = `${region.name} (${region.typeName}${factionInfo})`;
                
                // Add class based on region type for potential styling
                option.className = `option-region-${region.type.toLowerCase()}`;
                
                optgroup.appendChild(option);
            });
            
            targetSelect.appendChild(optgroup);
        }
    }
    
    /**
     * Format landmass type for display
     * @param {string} type - Landmass type
     * @returns {string} - Formatted landmass type
     */
    function formatLandmassType(type) {
        if (type === 'Viking Homeland') return 'Norse Lands';
        if (type === 'VIKING_HOMELAND') return 'Norse Lands';
        return type.replace(/_/g, ' ');
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
     * Update the list of expeditions with enhanced information
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
                // Get current region name and info
                let regionName = 'Unknown';
                let landmassName = '';
                let factionInfo = '';
                
                if (expedition.currentRegion) {
                    const region = WorldMap.getRegion(expedition.currentRegion);
                    if (region) {
                        regionName = region.name;
                        
                        // Add landmass info
                        const landmass = WorldMap.getLandmass(region.landmass);
                        if (landmass) {
                            landmassName = ` (${landmass.name})`;
                        }
                        
                        // Add faction info if available
                        const settlementsInRegion = WorldMap.getSettlementsByRegion(region.id);
                        if (settlementsInRegion && settlementsInRegion.length > 0) {
                            // Look for dominant faction
                            const factionCounts = {};
                            settlementsInRegion.forEach(settlement => {
                                if (settlement.faction) {
                                    factionCounts[settlement.faction] = (factionCounts[settlement.faction] || 0) + 1;
                                }
                            });
                            
                            let dominantFaction = null;
                            let maxCount = 0;
                            for (const faction in factionCounts) {
                                if (factionCounts[faction] > maxCount) {
                                    dominantFaction = faction;
                                    maxCount = factionCounts[faction];
                                }
                            }
                            
                            if (dominantFaction) {
                                factionInfo = `<div class="faction-tag ${dominantFaction.toLowerCase()}">${dominantFaction}</div>`;
                            }
                        }
                    }
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
                                <div class="detail-value">${regionName}${landmassName} ${factionInfo}</div>
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
        
        // Populate target options with enhanced information
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
     * Populate the target settlements dropdown with enhanced faction information
     */
    function populateTargetSettlements() {
        const targetSelect = document.getElementById('raid-target');
        
        // Clear existing options
        while (targetSelect.options.length > 1) {
            targetSelect.remove(1);
        }
        
        // Get all discovered settlements
        let raidableSettlements = [];
        
        if (WorldMap.getDiscoveredSettlements) {
            raidableSettlements = WorldMap.getDiscoveredSettlements()
                .filter(s => !s.isPlayer);
        } else {
            // Fallback to old behavior if function not available
            const playerSettlement = WorldMap.getPlayerSettlement();
            if (playerSettlement && WorldMap.getNearbySettlements) {
                raidableSettlements = WorldMap.getNearbySettlements(playerSettlement.id)
                    .filter(s => !s.isPlayer);
            }
        }
        
        // Group settlements by landmass and faction for better organization
        const settlementsByLandmass = {};
        
        raidableSettlements.forEach(settlement => {
            // Get region and landmass info
            let regionName = "Unknown Region";
            let landmassName = "Unknown Landmass";
            let landmassType = "";
            
            if (settlement.region) {
                const region = WorldMap.getRegion(settlement.region);
                if (region) {
                    regionName = region.name;
                    
                    // Get landmass info
                    const landmass = WorldMap.getLandmass(region.landmass);
                    if (landmass) {
                        landmassName = landmass.name;
                        landmassType = landmass.type;
                    }
                }
            }
            
            // Create landmass group if doesn't exist
            if (!settlementsByLandmass[landmassName]) {
                settlementsByLandmass[landmassName] = {
                    name: landmassName,
                    type: landmassType,
                    factions: {}
                };
            }
            
            // Get faction info
            const factionName = settlement.faction || "Unknown Faction";
            
            // Create faction group if doesn't exist
            if (!settlementsByLandmass[landmassName].factions[factionName]) {
                settlementsByLandmass[landmassName].factions[factionName] = [];
            }
            
            // Add settlement to its faction group
            settlementsByLandmass[landmassName].factions[factionName].push({
                settlement: settlement,
                regionName: regionName
            });
        });
        
        // Create optgroups for each landmass and nested options for factions
        for (const landmassName in settlementsByLandmass) {
            const landmassData = settlementsByLandmass[landmassName];
            const landmassOptgroup = document.createElement('optgroup');
            landmassOptgroup.label = `${landmassName} (${formatLandmassType(landmassData.type)})`;
            
            // For each faction in this landmass
            for (const factionName in landmassData.factions) {
                const factionSettlements = landmassData.factions[factionName];
                
                // If there are multiple settlements in this faction, create a faction subgroup
                if (factionSettlements.length > 1) {
                    const factionOptgroup = document.createElement('optgroup');
                    factionOptgroup.label = `  ${factionName}`;
                    factionOptgroup.className = 'faction-subgroup';
                    
                    // Add settlements to faction group
                    factionSettlements.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.settlement.id;
                        option.textContent = `${item.settlement.name} (${item.regionName})`;
                        option.className = `option-faction-${factionName.toLowerCase().replace(/\s+/g, '-')}`;
                        factionOptgroup.appendChild(option);
                    });
                    
                    landmassOptgroup.appendChild(factionOptgroup);
                } else if (factionSettlements.length === 1) {
                    // Just one settlement, add directly to landmass group with faction info
                    const item = factionSettlements[0];
                    const option = document.createElement('option');
                    option.value = item.settlement.id;
                    option.textContent = `${item.settlement.name} (${factionName} - ${item.regionName})`;
                    option.className = `option-faction-${factionName.toLowerCase().replace(/\s+/g, '-')}`;
                    landmassOptgroup.appendChild(option);
                }
            }
            
            targetSelect.appendChild(landmassOptgroup);
        }
        
        // Add some styling to improve the visual hierarchy
        const style = document.createElement('style');
        style.textContent = `
            .faction-subgroup {
                margin-left: 15px;
                font-style: italic;
            }
            
            .option-faction-viking {
                color: #b71c1c; /* Viking red */
            }
            
            .option-faction-anglo {
                color: #1565c0; /* Anglo blue */
            }
            
            .option-faction-frankish {
                color: #6a1b9a; /* Frankish purple */
            }
            
            .faction-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8rem;
                margin-left: 5px;
                color: white;
            }
            
            .faction-tag.viking {
                background-color: #b71c1c;
            }
            
            .faction-tag.anglo {
                background-color: #1565c0;
            }
            
            .faction-tag.frankish {
                background-color: #6a1b9a;
            }
        `;
        
        // Only add the style once
        if (!document.getElementById('military-panel-faction-styles')) {
            style.id = 'military-panel-faction-styles';
            document.head.appendChild(style);
        }
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
     * Update the list of raids with enhanced information
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
            
            // Create HTML for each raid with enhanced information
            let raidsHTML = '';
            
            raids.forEach(raid => {
                // Get status text
                const statusText = raid.status === 'raiding' ? 'Raiding' : 'Sieging';
                
                // Get target info with enhanced details
                let targetName = 'Unknown';
                let factionInfo = '';
                let regionInfo = '';
                
                if (raid.targetSettlement) {
                    const settlement = WorldMap.getSettlement(raid.targetSettlement);
                    if (settlement) {
                        targetName = settlement.name;
                        
                        // Add faction info
                        if (settlement.faction) {
                            factionInfo = `<div class="faction-tag ${settlement.faction.toLowerCase()}">${settlement.faction}</div>`;
                        }
                        
                        // Add region info
                        if (settlement.region) {
                            const region = WorldMap.getRegion(settlement.region);
                            if (region) {
                                regionInfo = ` (${region.name})`;
                            }
                        }
                    }
                } else if (raid.currentRegion) {
                    const region = WorldMap.getRegion(raid.currentRegion);
                    if (region) {
                        targetName = region.name + ' Region';
                        
                        // Add landmass info
                        const landmass = WorldMap.getLandmass(region.landmass);
                        if (landmass) {
                            regionInfo = ` (${landmass.name})`;
                        }
                    }
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
                                <div class="detail-value">${targetName}${regionInfo} ${factionInfo}</div>
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
     * Update the list of battles with enhanced information
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
            
            // Add battles with enhanced information
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
                
                // Get region info
                let regionInfo = '';
                const region = WorldMap.getRegion(battle.regionId);
                if (region) {
                    // Add landmass info
                    const landmass = WorldMap.getLandmass(region.landmass);
                    if (landmass) {
                        regionInfo = ` (${landmass.name})`;
                    }
                }
                
                // Get faction info if available
                let factionInfo = '';
                if (battle.defenders && battle.defenders.length > 0) {
                    // Try to determine defender faction from the first defender
                    const defenderExpId = battle.defenders[0];
                    const defenderExp = window.ExpeditionSystem && 
                                       ExpeditionSystem.getExpedition && 
                                       ExpeditionSystem.getExpedition(defenderExpId);
                    
                    if (defenderExp) {
                        // If this is an AI expedition with faction ID
                        if (defenderExp.ownerType === 'ai' && defenderExp.factionId) {
                            const faction = window.FactionIntegration && 
                                          FactionIntegration.getFactionById && 
                                          FactionIntegration.getFactionById(defenderExp.factionId);
                            
                            if (faction) {
                                factionInfo = `<div class="faction-tag ${faction.type.toLowerCase()}">${faction.type.replace('_', ' ')}</div>`;
                            }
                        }
                    }
                }
                
                battlesHTML += `
                    <div class="battle-item phase-${battle.phase}">
                        <div class="battle-header">
                            <div class="battle-name">Battle of ${battle.regionName || 'Unknown Region'}${regionInfo}</div>
                            <div class="battle-phase">${phaseText}</div>
                        </div>
                        <div class="battle-details">
                            <div class="detail-row">
                                <div class="detail-label">Your Forces:</div>
                                <div class="detail-value">${battle.attackerStrength}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Enemy Forces:</div>
                                <div class="detail-value">${battle.defenderStrength} ${factionInfo}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Status:</div>
                                <div class="detail-value advantage-${advantageClass}">${advantageText}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Add sieges with enhanced information
            sieges.forEach(siege => {
                // Get region and settlement info
                let regionInfo = '';
                let factionInfo = '';
                
                const region = WorldMap.getRegion(siege.regionId);
                if (region) {
                    // Add landmass info
                    const landmass = WorldMap.getLandmass(region.landmass);
                    if (landmass) {
                        regionInfo = ` (${landmass.name})`;
                    }
                }
                
                // Get settlement faction info if available
                const settlement = WorldMap.getSettlement(siege.settlementId);
                if (settlement && settlement.faction) {
                    factionInfo = `<div class="faction-tag ${settlement.faction.toLowerCase()}">${settlement.faction}</div>`;
                }
                
                battlesHTML += `
                    <div class="siege-item phase-${siege.phase}">
                        <div class="siege-header">
                            <div class="siege-name">Siege of ${siege.settlementName || 'Unknown Settlement'}${regionInfo}</div>
                            <div class="siege-phase">${siege.phase.charAt(0).toUpperCase() + siege.phase.slice(1)}</div>
                        </div>
                        <div class="siege-details">
                            <div class="detail-row">
                                <div class="detail-label">Target:</div>
                                <div class="detail-value">${siege.settlementName || 'Unknown Settlement'} ${factionInfo}</div>
                            </div>
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
     * Add CSS styles for the military panel with enhanced visuals
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
            
            .event-item.event-danger {
                border-left: 3px solid #c62828;
                background-color: #ffebee;
            }
            
            .event-item.event-success {
                border-left: 3px solid #2e7d32;
                background-color: #e8f5e9;
            }
            
            .event-item.event-important {
                border-left: 3px solid #f57c00;
                background-color: #fff3e0;
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
                border: 1px solid #e6d8c3;
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
                background-color: #fff;
            }
            
            .warrior-input {
                width: 100px;
                text-align: center;
                padding: 8px;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                font-size: 1rem;
                background-color: #fff;
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
                border-left: 4px solid #8b5d33;
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
                display: flex;
                align-items: center;
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
            
            /* Enhanced status colors */
            .status-mustering .expedition-status,
            .status-mustering {
                background-color: #e3f2fd;
                color: #1565c0;
                border-color: #1565c0;
            }
            
            .status-marching .expedition-status,
            .status-marching {
                background-color: #e8f5e9;
                color: #2e7d32;
                border-color: #2e7d32;
            }
            
            .status-raiding .expedition-status,
            .status-raiding {
                background-color: #ffebee;
                color: #c62828;
                border-color: #c62828;
            }
            
            .status-sieging .expedition-status,
            .status-sieging {
                background-color: #ede7f6;
                color: #6a1b9a;
                border-color: #6a1b9a;
            }
            
            .status-battling .expedition-status,
            .status-battling {
                background-color: #fff3e0;
                color: #e65100;
                border-color: #e65100;
            }
            
            .status-returning .expedition-status,
            .status-returning {
                background-color: #fff8e1;
                color: #ff8f00;
                border-color: #ff8f00;
            }
            
            /* Battle phase-specific styling */
            .phase-deployment {
                border-left-color: #1565c0;
            }
            
            .phase-skirmish {
                border-left-color: #f57c00;
            }
            
            .phase-melee {
                border-left-color: #c62828;
            }
            
            .phase-pursuit {
                border-left-color: #6a1b9a;
            }
            
            .phase-concluded {
                border-left-color: #424242;
                opacity: 0.8;
            }
            
            /* Enhanced siege phase styling */
            .phase-encirclement {
                border-left-color: #1565c0;
            }
            
            .phase-bombardment {
                border-left-color: #f57c00;
            }
            
            .phase-assault {
                border-left-color: #c62828;
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
            
            /* Enhanced notification styling */
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
            
            /* Enhanced dropdown styling */
            select#expedition-target,
            select#raid-target {
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .option-player-region {
                font-weight: bold;
                color: #5d4037;
            }
            
            .option-region-forest {
                color: #33691e;
            }
            
            .option-region-plains {
                color: #558b2f;
            }
            
            .option-region-mountains {
                color: #5d4037;
            }
            
            .option-region-coastal,
            .option-region-fjord {
                color: #0277bd;
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
        },
        
        /**
         * Show faction armies information (used by military-panel-update.js)
         */
        showFactionArmies: function() {
            // This function is defined in the military-panel-update.js enhancement
            // We're just providing a stub here for compatibility
            if (typeof updateFactionArmiesInfo === 'function') {
                updateFactionArmiesInfo();
            } else {
                console.log("Faction armies update function not available");
            }
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