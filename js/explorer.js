/**
 * Viking Legacy - Explorer System
 * Handles party organization, exploration, and travel mechanics
 */

const ExplorerSystem = (function() {
    // Private variables
    let partyData = {
        // Current party configuration
        active: false,
        type: null, // 'adventurer', 'raider', 'army'
        warriors: 0,
        morale: 100,
        strength: 0,
        currentRegion: null,
        homeRegion: null,
        travelStatus: {
            traveling: false,
            daysRemaining: 0,
            destination: null,
            travelType: null // 'land' or 'sea'
        }
    };
    
    // Party type definitions
    const partyTypes = {
        ADVENTURER: {
            id: 'adventurer',
            name: 'Adventurer Band',
            minWarriors: 1,
            maxWarriors: 5,
            description: 'A small band focused on exploration and discovery.',
            movementSpeed: 2, // Regions per day
            foodConsumption: 0.5, // Per warrior per day
            strengthMultiplier: 0.8 // Each warrior counts as 0.8 strength
        },
        RAIDER: {
            id: 'raider',
            name: 'Raider Warband',
            minWarriors: 3,
            maxWarriors: 15,
            description: 'A medium-sized warband suited for raiding settlements.',
            movementSpeed: 1.5,
            foodConsumption: 0.8,
            strengthMultiplier: 1.2
        },
        ARMY: {
            id: 'army',
            name: 'Army',
            minWarriors: 10,
            maxWarriors: 100,
            description: 'A large army for sieges and major battles.',
            movementSpeed: 0.8,
            foodConsumption: 1.2,
            strengthMultiplier: 1.5
        }
    };
    
    // Travel time between region types (in days)
    const travelTimes = {
        // [source region type][destination region type] = base days
        FOREST: {
            FOREST: 2,
            PLAINS: 1.5,
            MOUNTAINS: 3,
            COASTAL: 2,
            FJORD: 2.5
        },
        PLAINS: {
            FOREST: 1.5,
            PLAINS: 1,
            MOUNTAINS: 2.5,
            COASTAL: 1.5,
            FJORD: 2
        },
        MOUNTAINS: {
            FOREST: 3,
            PLAINS: 2.5,
            MOUNTAINS: 3.5,
            COASTAL: 3,
            FJORD: 3.5
        },
        COASTAL: {
            FOREST: 2,
            PLAINS: 1.5,
            MOUNTAINS: 3,
            COASTAL: 1.5,
            FJORD: 2
        },
        FJORD: {
            FOREST: 2.5,
            PLAINS: 2,
            MOUNTAINS: 3.5,
            COASTAL: 2,
            FJORD: 2.5
        }
    };
    
    const seaTravelTime = 3; // Base days for sea travel
    
    // Encounter chance for different party types (percentage per day)
    const encounterChance = {
        adventurer: 30,
        raider: 20,
        army: 10
    };
    
    // Private methods
    
    /**
     * Calculate party strength based on warriors and party type
     * @param {number} warriors - Number of warriors
     * @param {string} partyTypeId - Party type ID
     * @returns {number} - Party strength
     */
    function calculatePartyStrength(warriors, partyTypeId) {
        const partyType = partyTypes[partyTypeId.toUpperCase()];
        if (!partyType) return warriors; // Fallback
        
        return Math.floor(warriors * partyType.strengthMultiplier);
    }
    
    /**
     * Calculate travel time between two regions
     * @param {Object} sourceRegion - Source region
     * @param {Object} destRegion - Destination region
     * @param {string} partyTypeId - Party type ID
     * @returns {number} - Travel time in days
     */
    function calculateTravelTime(sourceRegion, destRegion, partyTypeId) {
        if (!WorldMap.areRegionsNeighbors(sourceRegion.id, destRegion.id)) {
            console.error("Cannot travel to non-neighboring region");
            return -1;
        }
        
        const travelType = WorldMap.getTravelType(sourceRegion.id, destRegion.id);
        let baseDays;
        
        if (travelType === 'sea') {
            baseDays = seaTravelTime;
        } else {
            baseDays = travelTimes[sourceRegion.type]?.[destRegion.type] || 2;
        }
        
        if (!partyTypeId) {
            return baseDays;
        }
        
        const partyType = partyTypes[partyTypeId.toUpperCase()];
        if (!partyType) {
            console.warn(`Invalid party type: ${partyTypeId}`);
            return baseDays;
        }
        
        return Math.max(1, Math.round(baseDays / partyType.movementSpeed));
    }
    
    /**
     * Calculate food needed for journey
     * @param {number} warriors - Number of warriors
     * @param {number} days - Journey length in days
     * @param {string} partyTypeId - Party type ID
     * @returns {number} - Food needed
     */
    function calculateFoodNeeded(warriors, days, partyTypeId) {
        // Handle null partyTypeId
        if (!partyTypeId) {
            return warriors * days; // Default food consumption
        }
        
        const partyType = partyTypes[partyTypeId.toUpperCase()];
        if (!partyType) return warriors * days; // Fallback
        
        return Math.ceil(warriors * days * partyType.foodConsumption);
    }
    
    /**
     * Check if the player has enough resources for a journey
     * @param {number} foodNeeded - Food needed for journey
     * @returns {boolean} - Whether player has enough resources
     */
    function hasEnoughResources(foodNeeded) {
        const resources = ResourceManager.getResources();
        return resources.food >= foodNeeded;
    }
    
    /**
     * Create the Explorer UI panel
     */
    function createExplorerUI() {
        if (document.getElementById('explorer-panel')) {
            console.log("Explorer panel already exists, skipping creation");
            return;
        }
        
        // Create panel container
        const explorerPanel = document.createElement('div');
        explorerPanel.id = 'explorer-panel';
        explorerPanel.className = 'explorer-panel panel-container';
        
        // Add panel content
        explorerPanel.innerHTML = `
            <h2>Exploration</h2>
            <div class="explorer-content">
                <div class="party-organization">
                    <h3>Party Organization</h3>
                    <div id="party-status">
                        <p>Organize a party to explore the world beyond your settlement.</p>
                    </div>
                    
                    <div id="party-config" class="${partyData.active ? 'hidden' : ''}">
                        <div class="party-types">
                            <h4>Select Party Type</h4>
                            <div class="party-types-grid">
                                <div class="party-type-card" data-party-type="adventurer">
                                    <div class="party-type-header">Adventurer Band</div>
                                    <div class="party-type-desc">Small, fast-moving party focused on exploration.</div>
                                    <div class="party-type-stats">
                                        <div>Warriors: 1-5</div>
                                        <div>Speed: Fast</div>
                                    </div>
                                </div>
                                <div class="party-type-card" data-party-type="raider">
                                    <div class="party-type-header">Raider Warband</div>
                                    <div class="party-type-desc">Medium-sized band for raiding and combat.</div>
                                    <div class="party-type-stats">
                                        <div>Warriors: 3-15</div>
                                        <div>Speed: Medium</div>
                                    </div>
                                </div>
                                <div class="party-type-card" data-party-type="army">
                                    <div class="party-type-header">Army</div>
                                    <div class="party-type-desc">Large force for major battles and conquest.</div>
                                    <div class="party-type-stats">
                                        <div>Warriors: 10-100</div>
                                        <div>Speed: Slow</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="party-details" class="hidden">
                            <h4>Configure Party</h4>
                            <div class="party-config-form">
                                <div class="config-row">
                                    <label for="warriors-input">Warriors:</label>
                                    <div class="counter-control">
                                        <button class="btn-decrement" data-target="warriors">-</button>
                                        <span id="warriors-count">0</span>
                                        <button class="btn-increment" data-target="warriors">+</button>
                                    </div>
                                    <div>Available: <span id="available-warriors">0</span></div>
                                </div>
                                
                                <div class="config-row">
                                    <div>Party Strength: <span id="party-strength">0</span></div>
                                </div>
                                
                                <div class="config-buttons">
                                    <button id="btn-cancel-party">Cancel</button>
                                    <button id="btn-muster-party">Muster Party</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="active-party" class="${partyData.active ? '' : 'hidden'}">
                        <h4>Active Party</h4>
                        <div class="active-party-details">
                            <div class="party-info">
                                <div>Type: <span id="active-party-type">None</span></div>
                                <div>Warriors: <span id="active-party-warriors">0</span></div>
                                <div>Strength: <span id="active-party-strength">0</span></div>
                                <div>Morale: <span id="active-party-morale">100</span>%</div>
                            </div>
                            
                            <div class="party-location">
                                <div>Location: <span id="party-current-region">Home</span></div>
                                <div id="travel-status" class="hidden">
                                    <div>Traveling to: <span id="destination-name"></span></div>
                                    <div>Time remaining: <span id="travel-days">0</span> days</div>
                                </div>
                            </div>
                            
                            <div class="party-actions">
                                <button id="btn-disband-party">Disband Party</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="exploration-section">
                    <h3>Exploration</h3>
                    <div id="region-exploration">
                        <div id="neighboring-regions">
                            <h4>Neighboring Regions</h4>
                            <div id="regions-list">
                                <p>No neighboring regions available.</p>
                            </div>
                        </div>
                        
                        <div id="exploration-actions" class="${partyData.active ? '' : 'hidden'}">
                            <button id="btn-explore-region" disabled>Explore Selected Region</button>
                            <button id="btn-return-home" class="${partyData.currentRegion === partyData.homeRegion ? 'hidden' : ''}">Return Home</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(explorerPanel);
            
            // Add event listeners
            setupEventListeners();
            
            // Register with NavigationSystem correctly
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('explorer-panel', 'explore');
                console.log("Explorer panel registered with 'explore' tab");
            }
        }
        
        // Add CSS for explorer panel
        addExplorerStyles();
    }
    
    /**
     * Set up event listeners for explorer UI
     */
    function setupEventListeners() {
        // Party type selection
        const partyTypeCards = document.querySelectorAll('.party-type-card');
        partyTypeCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove active class from all cards
                partyTypeCards.forEach(c => c.classList.remove('active'));
                // Add active class to selected card
                this.classList.add('active');
                
                // Show party details form
                const partyDetails = document.getElementById('party-details');
                if (partyDetails) {
                    partyDetails.classList.remove('hidden');
                }
                
                // Update warrior limits based on party type
                const partyType = this.dataset.partyType;
                ExplorerSystem.setPartyType(partyType);
            });
        });
        
        // Warrior counter controls
        document.querySelectorAll('.btn-increment, .btn-decrement').forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.dataset.target;
                const increment = this.classList.contains('btn-increment') ? 1 : -1;
                
                if (target === 'warriors') {
                    const currentValue = parseInt(document.getElementById('warriors-count').textContent);
                    ExplorerSystem.adjustWarriorCount(currentValue + increment);
                }
            });
        });
        
        // Muster party button
        const musterButton = document.getElementById('btn-muster-party');
        if (musterButton) {
            musterButton.addEventListener('click', function() {
                ExplorerSystem.musterParty();
            });
        }
        
        // Cancel party configuration
        const cancelButton = document.getElementById('btn-cancel-party');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                // Reset and hide party details
                document.getElementById('party-details').classList.add('hidden');
                document.querySelectorAll('.party-type-card').forEach(c => c.classList.remove('active'));
                document.getElementById('warriors-count').textContent = '0';
            });
        }
        
        // Disband party button
        const disbandButton = document.getElementById('btn-disband-party');
        if (disbandButton) {
            disbandButton.addEventListener('click', function() {
                ExplorerSystem.disbandParty();
            });
        }
        
        // Explore region button
        const exploreButton = document.getElementById('btn-explore-region');
        if (exploreButton) {
            exploreButton.addEventListener('click', function() {
                const selectedRegion = document.querySelector('.region-item.selected');
                if (selectedRegion) {
                    const regionId = selectedRegion.dataset.regionId;
                    ExplorerSystem.exploreRegion(regionId);
                }
            });
        }
        
        // Return home button
        const returnButton = document.getElementById('btn-return-home');
        if (returnButton) {
            returnButton.addEventListener('click', function() {
                ExplorerSystem.returnHome();
            });
        }
        
        // Set up region selection listener - will be added dynamically when regions are loaded
    }
    
    /**
     * Add CSS styles for the explorer panel
     */
    function addExplorerStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .explorer-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #c9ba9b;
                margin-top: 20px;
            }
            
            .explorer-panel h2 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-bottom: 15px;
                letter-spacing: 1px;
                font-weight: 700;
            }
            
            .explorer-panel h3 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                margin-top: 15px;
                margin-bottom: 10px;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .explorer-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            @media (max-width: 768px) {
                .explorer-content {
                    grid-template-columns: 1fr;
                }
            }
            
            .party-organization, .exploration-section {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .party-types-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }
            
            .party-type-card {
                background-color: #fff;
                border: 2px solid #d7cbb9;
                border-radius: 6px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .party-type-card:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
            
            .party-type-card.active {
                border-color: #8b5d33;
                background-color: #fff5e6;
            }
            
            .party-type-header {
                font-weight: bold;
                color: #5d4037;
                font-size: 1.1rem;
                margin-bottom: 8px;
            }
            
            .party-type-desc {
                color: #6d4c2a;
                font-size: 0.9rem;
                margin-bottom: 10px;
            }
            
            .party-type-stats {
                font-size: 0.85rem;
                color: #8b7355;
            }
            
            .party-config-form {
                background-color: #fff;
                padding: 15px;
                border-radius: 4px;
                margin-top: 10px;
            }
            
            .config-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                gap: 15px;
            }
            
            .counter-control {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .btn-increment, .btn-decrement {
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                padding: 0;
            }
            
            .config-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 15px;
            }
            
            .active-party-details {
                background-color: #fff;
                padding: 15px;
                border-radius: 4px;
                margin-top: 10px;
                border-left: 4px solid #8b5d33;
            }
            
            .party-info, .party-location {
                margin-bottom: 15px;
            }
            
            .party-actions {
                margin-top: 15px;
            }
            
            #regions-list {
                max-height: 300px;
                overflow-y: auto;
                background-color: #fff;
                border-radius: 4px;
                margin: 10px 0;
                padding: 10px;
            }
            
            .region-item {
                padding: 10px;
                margin-bottom: 8px;
                background-color: #f8f5f0;
                border-radius: 4px;
                border-left: 3px solid #8b7355;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .region-item:hover {
                background-color: #f0e6d2;
            }
            
            .region-item.selected {
                border-left-color: #8b5d33;
                background-color: #fff5e6;
            }
            
            .region-name {
                font-weight: bold;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .region-type {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .region-distance {
                font-size: 0.85rem;
                color: #6d4c2a;
                margin-top: 5px;
            }
            
            .travel-type-land {
                color: #2e7d32;
            }
            
            .travel-type-sea {
                color: #1565c0;
            }
            
            .exploration-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }
            
            .hidden {
                display: none;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Update the UI display of available warriors
     */
    function updateAvailableWarriors() {
        const availableWarriors = ExplorerSystem.getAvailableWarriors();
        Utils.updateElement('available-warriors', availableWarriors);
    }
    
    /**
     * Update party strength display
     * @param {number} warriors - Number of warriors
     * @param {string} partyType - Party type ID
     */
    function updatePartyStrength(warriors, partyType) {
        const strength = calculatePartyStrength(warriors, partyType);
        Utils.updateElement('party-strength', strength);
    }
    
    /**
     * Update neighboring regions list
     */
    function updateNeighboringRegions() {
        const regionsListElement = document.getElementById('regions-list');
        if (!regionsListElement) return;
        
        const currentRegionId = partyData.currentRegion;
        if (!currentRegionId) {
            regionsListElement.innerHTML = '<p>No current region selected.</p>';
            return;
        }
        
        const neighborRegions = WorldMap.getNeighborRegions(currentRegionId);
        
        if (neighborRegions.length === 0) {
            regionsListElement.innerHTML = '<p>No neighboring regions available.</p>';
            return;
        }
        
        let regionsHTML = '';
        
        neighborRegions.forEach(region => {
            const currentRegion = WorldMap.getRegion(currentRegionId);
            const travelType = WorldMap.getTravelType(currentRegionId, region.id);
            const travelDays = calculateTravelTime(currentRegion, region, partyData.type);
            
            const foodNeeded = calculateFoodNeeded(partyData.warriors, travelDays, partyData.type);
            const canTravel = hasEnoughResources(foodNeeded);
            
            regionsHTML += `
                <div class="region-item ${canTravel ? '' : 'disabled'}" data-region-id="${region.id}">
                    <div class="region-name">${region.name}</div>
                    <div class="region-type">${region.typeName}</div>
                    <div class="region-distance">
                        <span class="travel-type-${travelType}">${travelType.toUpperCase()} ROUTE</span> - 
                        ${travelDays} days travel - Needs ${foodNeeded} food
                    </div>
                </div>
            `;
        });
        
        regionsListElement.innerHTML = regionsHTML;
        
        // Add click handlers to region items
        const regionItems = document.querySelectorAll('.region-item:not(.disabled)');
        regionItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove selected class from all items
                document.querySelectorAll('.region-item').forEach(i => i.classList.remove('selected'));
                // Add selected class to clicked item
                this.classList.add('selected');
                
                // Enable explore button
                const exploreButton = document.getElementById('btn-explore-region');
                if (exploreButton) {
                    exploreButton.disabled = false;
                }
            });
        });
    }
    
    // Public API
    return {
        /**
         * Initialize the explorer system
         */
        init: function() {
            console.log("Initializing Explorer System...");
            
            // Set home region as current region
            const playerRegion = WorldMap.getPlayerRegion();
            console.log("Player region:", playerRegion);
            
            // Fix: Set currentRegion and homeRegion to player's region
            if (playerRegion) {
                partyData.currentRegion = playerRegion.id;
                partyData.homeRegion = playerRegion.id;
                console.log(`Set currentRegion and homeRegion to: ${playerRegion.id}`);
            }
            
            // Check if player region has neighbors
            if (playerRegion && playerRegion.neighbors) {
                console.log("Player region has " + playerRegion.neighbors.length + " neighbors");
                // Force update neighboring regions display
                updateNeighboringRegions();
            } else {
                console.log("Player region has no neighbors defined");
                
                // Try to fix by manually connecting to nearest regions
                if (typeof WorldMap.getRegion === 'function') {
                    // Get all regions and find the closest ones
                    const allRegions = WorldMap.getRegions ? WorldMap.getRegions() : [];
                    if (allRegions && allRegions.length > 0) {
                        console.log("Found " + allRegions.length + " total regions");
                        
                        // Force the player region to have neighbors
                        if (playerRegion && !playerRegion.neighbors) {
                            playerRegion.neighbors = [];
                        }
                        
                        // Connect to a few random regions for now
                        const randomRegions = allRegions
                            .filter(r => r.id !== playerRegion.id)
                            .slice(0, 3);
                            
                        if (randomRegions.length > 0) {
                            randomRegions.forEach(region => {
                                playerRegion.neighbors.push(region.id);
                                if (!region.neighbors) region.neighbors = [];
                                region.neighbors.push(playerRegion.id);
                            });
                            
                            console.log("Manually connected player region to " + randomRegions.length + " regions");
                            
                            // Force update
                            updateNeighboringRegions();
                        }
                    }
                }
            }
            
            // Create UI
            createExplorerUI();
            
            // Update available warriors display
            updateAvailableWarriors();
            
            // Force another update of neighboring regions after UI is created
            updateNeighboringRegions();
            
            console.log("Explorer System initialized");
        },
        
        /**
         * Get available warriors for exploration
         * @returns {number} - Number of available warriors
         */
        getAvailableWarriors: function() {
            // Get total warriors from settlement
            let totalWarriors = 0;
            
            // Check if BuildingSystem is available
            if (typeof BuildingSystem !== 'undefined' && typeof BuildingSystem.getWarriorData === 'function') {
                const warriorData = BuildingSystem.getWarriorData();
                totalWarriors = warriorData.total || 0;
            }
            
            // Subtract warriors already in party
            return Math.max(0, totalWarriors - partyData.warriors);
        },
        
        /**
         * Set the party type
         * @param {string} partyTypeId - Party type to set
         */
        setPartyType: function(partyTypeId) {
            const partyType = partyTypes[partyTypeId.toUpperCase()];
            if (!partyType) {
                console.error(`Invalid party type: ${partyTypeId}`);
                return;
            }
            
            partyData.type = partyTypeId;
            
            // Update warrior count constraints
            const warriorCount = document.getElementById('warriors-count');
            if (warriorCount) {
                warriorCount.textContent = partyType.minWarriors;
                updatePartyStrength(partyType.minWarriors, partyTypeId);
            }
        },
        
        /**
         * Adjust warrior count for party
         * @param {number} count - New warrior count
         */
        adjustWarriorCount: function(count) {
            if (!partyData.type) {
                console.error("No party type selected");
                return;
            }
            
            const partyType = partyTypes[partyData.type.toUpperCase()];
            if (!partyType) return;
            
            // Constrain within min/max range
            count = Math.max(partyType.minWarriors, Math.min(partyType.maxWarriors, count));
            
            // Also constrain within available warriors
            const availableWarriors = this.getAvailableWarriors();
            count = Math.min(count, availableWarriors + partyData.warriors);
            
            // Update display
            Utils.updateElement('warriors-count', count);
            
            // Update party strength
            updatePartyStrength(count, partyData.type);
        },
        
        /**
         * Muster a party with the configured settings
         */
        musterParty: function() {
            if (!partyData.type) {
                Utils.log("No party type selected", "important");
                return;
            }
            
            const partyType = partyTypes[partyData.type.toUpperCase()];
            const warriorCount = parseInt(document.getElementById('warriors-count').textContent);
            
            if (warriorCount < partyType.minWarriors) {
                Utils.log(`Need at least ${partyType.minWarriors} warriors for ${partyType.name}`, "important");
                return;
            }
            
            // Check if enough warriors are available
            const availableWarriors = this.getAvailableWarriors();
            if (warriorCount > availableWarriors + partyData.warriors) {
                Utils.log(`Not enough warriors available`, "important");
                return;
            }
            
            // Set party data
            partyData.active = true;
            partyData.warriors = warriorCount;
            partyData.morale = 100;
            partyData.strength = calculatePartyStrength(warriorCount, partyData.type);
            
            // Update UI
            document.getElementById('party-config').classList.add('hidden');
            document.getElementById('active-party').classList.remove('hidden');
            document.getElementById('exploration-actions').classList.remove('hidden');
            
            // Update active party display
            Utils.updateElement('active-party-type', partyType.name);
            Utils.updateElement('active-party-warriors', partyData.warriors);
            Utils.updateElement('active-party-strength', partyData.strength);
            Utils.updateElement('active-party-morale', partyData.morale);
            
            // Get current region name
            const currentRegion = WorldMap.getRegion(partyData.currentRegion);
            if (currentRegion) {
                Utils.updateElement('party-current-region', currentRegion.name);
            }
            
            // Update neighboring regions
            updateNeighboringRegions();
            
            // Log to game console
            Utils.log(`Mustered a ${partyType.name} with ${warriorCount} warriors.`, "success");
        },
        
        /**
         * Disband the current party and return warriors to settlement
         */
        disbandParty: function() {
            if (!partyData.active) return;
            
            // Check if currently traveling
            if (partyData.travelStatus.traveling) {
                Utils.log("Cannot disband party while traveling", "important");
                return;
            }
            
            // Reset party data
            const oldWarriors = partyData.warriors;
            partyData.active = false;
            partyData.warriors = 0;
            partyData.morale = 100;
            partyData.strength = 0;
            
            // Update UI
            document.getElementById('party-config').classList.remove('hidden');
            document.getElementById('active-party').classList.add('hidden');
            document.getElementById('exploration-actions').classList.add('hidden');
            
            // Reset party config
            document.getElementById('party-details').classList.add('hidden');
            document.querySelectorAll('.party-type-card').forEach(c => c.classList.remove('active'));
            document.getElementById('warriors-count').textContent = '0';
            
            // Update available warriors
            updateAvailableWarriors();
            
            // Log to game console
            Utils.log(`Disbanded party and returned ${oldWarriors} warriors to settlement.`, "success");
        },
        
        /**
         * Explore a selected region
         * @param {string} regionId - ID of the region to explore
         */
        exploreRegion: function(regionId) {
            if (!partyData.active || partyData.travelStatus.traveling) {
                Utils.log("No active party available for exploration", "important");
                return;
            }
            
            const sourceRegion = WorldMap.getRegion(partyData.currentRegion);
            const destRegion = WorldMap.getRegion(regionId);
            
            if (!sourceRegion || !destRegion) {
                Utils.log("Invalid region selected", "important");
                return;
            }
            
            // Check if regions are neighbors
            if (!WorldMap.areRegionsNeighbors(sourceRegion.id, destRegion.id)) {
                Utils.log("Cannot travel to non-neighboring region", "important");
                return;
            }
            
            // Calculate travel time
            const travelTime = calculateTravelTime(sourceRegion, destRegion, partyData.type);
            if (travelTime <= 0) {
                Utils.log("Cannot determine travel time", "important");
                return;
            }
            
            // Calculate food needed
            const foodNeeded = calculateFoodNeeded(partyData.warriors, travelTime, partyData.type);
            
            // Check if enough resources
            if (!hasEnoughResources(foodNeeded)) {
                Utils.log(`Not enough food for journey. Need ${foodNeeded} food.`, "important");
                return;
            }
            
            // Deduct resources
            ResourceManager.subtractResources({ food: foodNeeded });
            
            // Set travel status
            partyData.travelStatus.traveling = true;
            partyData.travelStatus.daysRemaining = travelTime;
            partyData.travelStatus.destination = regionId;
            partyData.travelStatus.travelType = WorldMap.getTravelType(sourceRegion.id, destRegion.id);
            
            // Update UI
            document.getElementById('travel-status').classList.remove('hidden');
            Utils.updateElement('destination-name', destRegion.name);
            Utils.updateElement('travel-days', travelTime);
            
            // Disable explore button
            document.getElementById('btn-explore-region').disabled = true;
            
            // Remove selection from regions
            document.querySelectorAll('.region-item').forEach(i => i.classList.remove('selected'));
            
            // Log to game console
            Utils.log(`Your party is traveling to ${destRegion.name}. The journey will take ${travelTime} days.`, "important");
        },
        
        /**
         * Return to home region
         */
        returnHome: function() {
            if (!partyData.active || partyData.travelStatus.traveling) {
                Utils.log("Cannot return home while traveling", "important");
                return;
            }
            
            // If already home
            if (partyData.currentRegion === partyData.homeRegion) {
                Utils.log("Already at home region", "important");
                return;
            }
            
            const currentRegion = WorldMap.getRegion(partyData.currentRegion);
            const homeRegion = WorldMap.getRegion(partyData.homeRegion);
            
            if (!currentRegion || !homeRegion) {
                Utils.log("Cannot find home region", "important");
                return;
            }
            
            // Check if direct path exists
            let canTravelDirectly = WorldMap.areRegionsNeighbors(partyData.currentRegion, partyData.homeRegion);
            
            if (canTravelDirectly) {
                // Calculate travel time
                const travelTime = calculateTravelTime(currentRegion, homeRegion, partyData.type);
                if (travelTime <= 0) {
                    Utils.log("Cannot determine travel time", "important");
                    return;
                }
                
                // Calculate food needed
                const foodNeeded = calculateFoodNeeded(partyData.warriors, travelTime, partyData.type);
                
                // Check if enough resources
                if (!hasEnoughResources(foodNeeded)) {
                    Utils.log(`Not enough food for journey. Need ${foodNeeded} food.`, "important");
                    return;
                }
                
                // Deduct resources
                ResourceManager.subtractResources({ food: foodNeeded });
                
                // Set travel status
                partyData.travelStatus.traveling = true;
                partyData.travelStatus.daysRemaining = travelTime;
                partyData.travelStatus.destination = partyData.homeRegion;
                partyData.travelStatus.travelType = WorldMap.getTravelType(currentRegion.id, homeRegion.id);
                
                // Update UI
                document.getElementById('travel-status').classList.remove('hidden');
                Utils.updateElement('destination-name', homeRegion.name);
                Utils.updateElement('travel-days', travelTime);
                
                // Disable return button
                document.getElementById('btn-return-home').disabled = true;
                
                // Log to game console
                Utils.log(`Your party is returning to ${homeRegion.name}. The journey will take ${travelTime} days.`, "important");
            } else {
                // Need to find path - this will be implemented in a future version
                Utils.log("Cannot find direct path to home region. More complex path finding will be available in future update.", "important");
            }
        },
        
        /**
         * Process a game tick for exploration
         * @param {Object} gameState - Current game state
         * @param {number} tickSize - Size of the game tick in days
         */
        processTick: function(gameState, tickSize) {
            // Skip if no active party or not traveling
            if (!partyData.active || !partyData.travelStatus.traveling) return;
            
            // Progress travel
            partyData.travelStatus.daysRemaining -= tickSize;
            
            // Update UI
            Utils.updateElement('travel-days', Math.max(0, Math.ceil(partyData.travelStatus.daysRemaining)));
            
            // Check for travel completion
            if (partyData.travelStatus.daysRemaining <= 0) {
                // Travel completed
                partyData.currentRegion = partyData.travelStatus.destination;
                partyData.travelStatus.traveling = false;
                partyData.travelStatus.daysRemaining = 0;
                partyData.travelStatus.destination = null;
                
                // Get destination region
                const newRegion = WorldMap.getRegion(partyData.currentRegion);
                
                // Update UI
                document.getElementById('travel-status').classList.add('hidden');
                Utils.updateElement('party-current-region', newRegion.name);
                
                // Show/hide return home button
                const returnButton = document.getElementById('btn-return-home');
                if (returnButton) {
                    if (partyData.currentRegion === partyData.homeRegion) {
                        returnButton.classList.add('hidden');
                    } else {
                        returnButton.classList.remove('hidden');
                        returnButton.disabled = false;
                    }
                }
                
                // Update neighboring regions
                updateNeighboringRegions();
                
                // Log to game console
                Utils.log(`Your party has arrived in ${newRegion.name}.`, "success");
                
                // Apply region resource modifiers if in home region (as if we moved the settlement)
                if (partyData.currentRegion === partyData.homeRegion && typeof WorldMap.updateRegionResourceModifiers === 'function') {
                    WorldMap.updateRegionResourceModifiers(newRegion);
                }
                
                // TODO: Handle random events on arrival
                
                // Apply resource discovery if in a new region
                this.discoverRegionalResources(newRegion);
            }
            
            // Check for random encounters during travel
            if (partyData.travelStatus.traveling && tickSize > 0) {
                const encounterChancePerDay = encounterChance[partyData.type] || 20;
                const encounterRoll = Math.random() * 100;
                
                // Adjust encounter chance based on tick size
                const adjustedChance = encounterChancePerDay * tickSize;
                
                if (encounterRoll < adjustedChance) {
                    // Random encounter - this will be implemented more fully in future
                    const encounterType = this.generateRandomEncounter();
                    
                    // Log encounter
                    Utils.log(`Your party encountered ${encounterType.description} while traveling.`, "important");
                    
                    // TODO: Handle encounter effects
                }
            }
        },
        
        /**
         * Generate a random encounter
         * @returns {Object} - Encounter details
         */
        generateRandomEncounter: function() {
            // Basic encounter types - will be expanded in future
            const encounterTypes = [
                { type: 'resource', description: 'a valuable resource cache', positive: true },
                { type: 'traders', description: 'a group of traders', positive: true },
                { type: 'bandits', description: 'a band of bandits', positive: false },
                { type: 'wildlife', description: 'hostile wildlife', positive: false },
                { type: 'weather', description: 'harsh weather conditions', positive: false }
            ];
            
            // Select random encounter
            return encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
        },
        
        /**
         * Discover resources based on region type
         * @param {Object} region - Region object
         */
        discoverRegionalResources: function(region) {
            if (!region || !region.resourceModifiers) return;
            
            // Check if ResourceManager exists
            if (typeof ResourceManager === 'undefined' || !ResourceManager.addResources) return;
            
            // 50% chance to discover resource
            if (Math.random() < 0.5) {
                // Create list of potential resources based on modifiers
                const potentialResources = [];
                
                for (const resource in region.resourceModifiers) {
                    if (region.resourceModifiers[resource] > 1.2) {
                        potentialResources.push({
                            name: resource,
                            modifier: region.resourceModifiers[resource]
                        });
                    }
                }
                
                if (potentialResources.length > 0) {
                    // Sort by modifier (highest first)
                    potentialResources.sort((a, b) => b.modifier - a.modifier);
                    
                    // Take top 2 resources (or all if less than 2)
                    const discoveries = potentialResources.slice(0, Math.min(2, potentialResources.length));
                    
                    // Create resource object
                    const resources = {};
                    discoveries.forEach(d => {
                        // Random amount based on modifier
                        resources[d.name] = Math.round(d.modifier * (5 + Math.random() * 10));
                    });
                    
                    // Add resources
                    ResourceManager.addResources(resources);
                    
                    // Log to game console
                    const resourceNames = Object.keys(resources).map(r => `${resources[r]} ${r}`).join(', ');
                    Utils.log(`Your party discovered resources while exploring: ${resourceNames}`, "success");
                }
            }
        },
        
        /**
         * Get current explorer state
         * @returns {Object} - Current explorer state
         */
        getExplorerState: function() {
            return { ...partyData };
        }
    };
})();