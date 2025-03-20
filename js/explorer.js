/**
 * Viking Legacy - Explorer System (Modal Redesign)
 * Handles party organization, exploration, and travel mechanics
 * Implements exploration as a distinct modal experience
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

    // Flag to track if explorer modal is active
    let isExplorerModalActive = false;
    
    // Track current settlement being viewed
    let currentSettlement = null;
    
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
     * Create the Explorer Modal UI
     */
    function createExplorerModal() {
        // Check if modal already exists
        if (document.getElementById('explorer-modal')) {
            console.log("Explorer modal already exists, skipping creation");
            return;
        }
        
        // Create modal container
        const explorerModal = document.createElement('div');
        explorerModal.id = 'explorer-modal';
        explorerModal.className = 'explorer-modal';
        
        // Add modal content
        explorerModal.innerHTML = `
            <div class="explorer-modal-content">
                <div class="explorer-header">
                    <h2>Exploration</h2>
                    <button id="btn-end-exploration" class="end-exploration-btn">Return to Settlement</button>
                </div>
                
                <div class="explorer-main">
                    <div class="explorer-sidebar">
                        <div class="party-status">
                            <h3>Your Party</h3>
                            <div id="active-party" class="active-party-details">
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
                        </div>
                        
                        <div class="neighboring-regions">
                            <h3>Neighboring Regions</h3>
                            <div id="regions-list" class="regions-list">
                                <p>No neighboring regions available.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="explorer-content">
                        <div class="region-info-panel">
                            <h3>Current Region: <span id="current-region-name">Home</span></h3>
                            <p id="region-description">You are in your home region.</p>
                        </div>
                        
                        <div id="settlements-section">
                            <h3>Settlements in Region</h3>
                            <div id="settlements-list-explorer">
                                <p>No settlements discovered in this region.</p>
                            </div>
                        </div>
                        
                        <div id="settlement-detail-panel" class="settlement-detail-panel">
                            <!-- Settlement details will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div id="exploration-actions" class="exploration-actions">
                    <button id="btn-explore-region" disabled>Explore Selected Region</button>
                    <button id="btn-return-home" class="${partyData.currentRegion === partyData.homeRegion ? 'hidden' : ''}">Return Home</button>
                </div>
            </div>
        `;
        
        // Add to the body
        document.body.appendChild(explorerModal);
        
        // Hide initially
        explorerModal.style.display = 'none';
        
        // Add CSS for explorer modal
        addExplorerModalStyles();
        
        // Set up event listeners
        setupExplorerModalEvents();
    }
    
    /**
     * Add CSS styles for the explorer modal
     */
    function addExplorerModalStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .explorer-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .explorer-modal-content {
                background-color: #e6d8c3;
                width: 90%;
                max-width: 1200px;
                height: 90%;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .explorer-header {
                background-color: #8b5d33;
                color: #fff;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .explorer-header h2 {
                margin: 0;
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                letter-spacing: 1px;
            }
            
            .end-exploration-btn {
                background-color: #d7cbb9;
                color: #5d4037;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .end-exploration-btn:hover {
                background-color: #c9ba9b;
            }
            
            .explorer-main {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .explorer-sidebar {
                width: 300px;
                background-color: #f7f0e3;
                padding: 15px;
                overflow-y: auto;
                border-right: 1px solid #c9ba9b;
            }
            
            .explorer-content {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background-color: #f7f0e3;
            }
            
            .party-status h3,
            .neighboring-regions h3,
            .region-info-panel h3,
            #settlements-section h3 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 10px;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .active-party-details {
                background-color: #fff;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
                border-left: 4px solid #8b5d33;
            }
            
            .party-info, .party-location {
                margin-bottom: 10px;
            }
            
            .party-types-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin: 10px 0;
            }
            
            .party-type-card {
                background-color: #fff;
                border: 2px solid #d7cbb9;
                border-radius: 6px;
                padding: 10px;
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
            
            .regions-list {
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
            
            .region-info-panel {
                background-color: #fff;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
                border-left: 4px solid #8b5d33;
            }
            
            .settlement-explorer-item {
                padding: 10px;
                margin-bottom: 8px;
                background-color: #f8f5f0;
                border-radius: 4px;
                border-left: 3px solid #8b7355;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .settlement-explorer-item:hover {
                background-color: #f0e6d2;
            }
            
            .settlement-explorer-item .settlement-name {
                font-weight: bold;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .settlement-explorer-item .settlement-type {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .settlement-explorer-item .settlement-size {
                font-size: 0.85rem;
                color: #6d4c2a;
                margin-top: 5px;
            }
            
            .settlement-explorer-item .settlement-buttons {
                margin-top: 10px;
                display: flex;
                gap: 5px;
            }
            
            /* Relationship colors */
            .relationship-friendly {
                border-left-color: #2e7d32; /* Green */
            }
            
            .relationship-cautious {
                border-left-color: #ff8f00; /* Orange */
            }
            
            .relationship-neutral {
                border-left-color: #8b7355; /* Default brown */
            }
            
            .relationship-hostile {
                border-left-color: #c62828; /* Red */
            }
            
            /* Settlement type colors */
            .settlement-viking {
                background-color: #e3f2fd; /* Light blue */
            }
            
            .settlement-anglo {
                background-color: #f1f8e9; /* Light green */
            }
            
            .settlement-frankish {
                background-color: #fff3e0; /* Light orange */
            }
            
            .settlement-neutral {
                background-color: #f5f5f5; /* Light gray */
            }
            
            /* Settlement detail panel */
            .settlement-detail-panel {
                background-color: #fff;
                padding: 15px;
                border-radius: 6px;
                margin-top: 15px;
                border-left: 4px solid #8b5d33;
                display: none;
            }
            
            .settlement-detail-panel.visible {
                display: block;
            }
            
            .settlement-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .settlement-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .settlement-action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .btn-close-settlement {
                padding: 5px 10px;
                background-color: #f0e6d2;
                border: 1px solid #d7cbb9;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .exploration-actions {
                background-color: #d7cbb9;
                padding: 15px;
                display: flex;
                justify-content: center;
                gap: 15px;
            }
            
            #btn-explore-region, #btn-return-home {
                padding: 10px 20px;
                font-weight: bold;
            }
            
            .hidden {
                display: none;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Set up event listeners for explorer modal
     */
    function setupExplorerModalEvents() {
        // End exploration button
        const endExplorationBtn = document.getElementById('btn-end-exploration');
        if (endExplorationBtn) {
            endExplorationBtn.addEventListener('click', function() {
                if (partyData.travelStatus.traveling) {
                    if (!confirm("Are you sure you want to end exploration while traveling? Your party will continue the journey in the background.")) {
                        return;
                    }
                }
                closeExplorerModal();
            });
        }
        
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
    }
    
    /**
     * Update the neighboring regions list
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
    
    /**
     * Update the settlements list in the explorer UI
     */
    function updateSettlementsList() {
        const settlementsListElement = document.getElementById('settlements-list-explorer');
        if (!settlementsListElement) return;
        
        if (!partyData.currentRegion) {
            settlementsListElement.innerHTML = '<p>No current region selected.</p>';
            return;
        }
        
        const settlements = WorldMap.getSettlementsByRegion(partyData.currentRegion);
        
        if (settlements.length === 0) {
            settlementsListElement.innerHTML = '<p>No settlements discovered in this region.</p>';
            return;
        }
        
        let settlementsHTML = '';
        
        settlements.forEach(settlement => {
            // Determine relationship status - this can be expanded later
            let relationshipClass = 'neutral';
            if (settlement.isPlayer) {
                relationshipClass = 'friendly';
            } else if (settlement.type === 'VIKING') {
                relationshipClass = 'cautious'; // Fellow Vikings are cautious
            } else {
                relationshipClass = 'hostile'; // Others are initially hostile
            }
            
            settlementsHTML += `
                <div class="settlement-explorer-item settlement-${settlement.type.toLowerCase()} relationship-${relationshipClass}" 
                     data-settlement-id="${settlement.id}">
                    <div class="settlement-name">${settlement.name}</div>
                    <div class="settlement-type">${settlement.type}</div>
                    <div class="settlement-size">Population: ~${settlement.population}</div>
                    <div class="settlement-buttons">
                        <button class="btn-visit-settlement" data-settlement-id="${settlement.id}">Visit</button>
                    </div>
                </div>
            `;
        });
        
        settlementsListElement.innerHTML = settlementsHTML;
        
        // Add event listeners for settlement buttons
        document.querySelectorAll('.btn-visit-settlement').forEach(btn => {
            btn.addEventListener('click', function() {
                const settlementId = this.dataset.settlementId;
                ExplorerSystem.visitSettlement(settlementId);
            });
        });
    }
    
    /**
     * Update current region information in UI
     */
    function updateCurrentRegionInfo() {
        if (!partyData.currentRegion) return;
        
        const region = WorldMap.getRegion(partyData.currentRegion);
        if (!region) return;
        
        // Update region name and description
        const regionNameElement = document.getElementById('current-region-name');
        const regionDescriptionElement = document.getElementById('region-description');
        
        if (regionNameElement) regionNameElement.textContent = region.name;
        if (regionDescriptionElement) regionDescriptionElement.textContent = region.description;
    }
    
    /**
     * Open the explorer modal
     */
    function openExplorerModal() {
        const explorerModal = document.getElementById('explorer-modal');
        if (!explorerModal) {
            createExplorerModal();
            // Get the modal again after creation
            const newModal = document.getElementById('explorer-modal');
            if (newModal) {
                newModal.style.display = 'flex';
            }
        } else {
            explorerModal.style.display = 'flex';
        }
        
        isExplorerModalActive = true;
        
        // Update UI elements
        updateNeighboringRegions();
        updateSettlementsList();
        updateCurrentRegionInfo();
        
        // Get available warriors
        const availableWarriors = ExplorerSystem.getAvailableWarriors();
        Utils.updateElement('available-warriors', availableWarriors);
        
        // Update party info if active
        if (partyData.active) {
            // Show active party details
            document.getElementById('party-config').classList.add('hidden');
            document.getElementById('active-party').classList.remove('hidden');
            
            // Update UI elements
            Utils.updateElement('active-party-type', partyTypes[partyData.type.toUpperCase()].name);
            Utils.updateElement('active-party-warriors', partyData.warriors);
            Utils.updateElement('active-party-strength', partyData.strength);
            Utils.updateElement('active-party-morale', partyData.morale);
            
            // Show exploration actions
            document.getElementById('exploration-actions').classList.remove('hidden');
            
            // Get current region name and update display
            const currentRegion = WorldMap.getRegion(partyData.currentRegion);
            if (currentRegion) {
                Utils.updateElement('party-current-region', currentRegion.name);
            }
            
            // Show/hide travel status
            if (partyData.travelStatus.traveling) {
                document.getElementById('travel-status').classList.remove('hidden');
                Utils.updateElement('destination-name', 
                    WorldMap.getRegion(partyData.travelStatus.destination)?.name || 'Unknown');
                Utils.updateElement('travel-days', partyData.travelStatus.daysRemaining);
            } else {
                document.getElementById('travel-status').classList.add('hidden');
            }
            
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
        } else {
            // Show party configuration
            document.getElementById('party-config').classList.remove('hidden');
            document.getElementById('active-party').classList.add('hidden');
            
            // Hide exploration actions
            document.getElementById('exploration-actions').classList.add('hidden');
        }
    }
    
    /**
     * Close the explorer modal
     */
    function closeExplorerModal() {
        const explorerModal = document.getElementById('explorer-modal');
        if (explorerModal) {
            explorerModal.style.display = 'none';
        }
        
        isExplorerModalActive = false;
        
        // Hide settlement details if visible
        closeSettlementDetails();
    }
    
    /**
     * Show detailed information about a settlement
     * @param {Object} settlement - Settlement object
     */
    function showSettlementDetails(settlement) {
        // Store the current settlement
        currentSettlement = settlement;
        
        // Get the detail panel
        const detailPanel = document.getElementById('settlement-detail-panel');
        if (!detailPanel) return;
        
        // Populate with settlement details
        detailPanel.innerHTML = `
            <div class="settlement-header">
                <h4>${settlement.name}</h4>
                <button class="btn-close-settlement">×</button>
            </div>
            <div class="settlement-description">
                A ${settlement.type.toLowerCase()} settlement with approximately ${settlement.population} inhabitants.
            </div>
            <div class="settlement-stats">
                <div>
                    <strong>Type:</strong> ${settlement.type}
                </div>
                <div>
                    <strong>Population:</strong> ${settlement.population}
                </div>
                <div>
                    <strong>Military:</strong> ${settlement.military ? settlement.military.warriors : 'Unknown'} warriors
                </div>
                <div>
                    <strong>Defenses:</strong> ${settlement.military ? settlement.military.defenses : 'Unknown'}
                </div>
            </div>
            <div class="settlement-action-buttons">
                <button class="btn-trade" data-settlement-id="${settlement.id}" disabled>Trade (Coming Soon)</button>
                <button class="btn-negotiate" data-settlement-id="${settlement.id}" disabled>Negotiate (Coming Soon)</button>
                ${!settlement.isPlayer ? `<button class="btn-raid" data-settlement-id="${settlement.id}">Raid</button>` : ''}
            </div>
        `;
        
        // Make panel visible
        detailPanel.classList.add('visible');
        
        // Add event listener for close button
        const closeButton = detailPanel.querySelector('.btn-close-settlement');
        if (closeButton) {
            closeButton.addEventListener('click', closeSettlementDetails);
        }
        
        // Add event listener for raid button
        const raidButton = detailPanel.querySelector('.btn-raid');
        if (raidButton && !settlement.isPlayer) {
            raidButton.addEventListener('click', function() {
                executeRaid(settlement);
            });
        }
    }
    
    /**
     * Close the settlement details panel
     */
    function closeSettlementDetails() {
        const detailPanel = document.getElementById('settlement-detail-panel');
        if (detailPanel) {
            detailPanel.classList.remove('visible');
        }
        
        // Clear current settlement
        currentSettlement = null;
    }
    
    /**
     * Execute a raid against a settlement
     * @param {Object} settlement - Target settlement
     */
    function executeRaid(settlement) {
        // Call the battle-integration.js functionality
        if (settlement && partyData.active && !partyData.travelStatus.traveling) {
            // Get explorer state for battle
            const explorerState = {
                active: partyData.active,
                warriors: partyData.warriors,
                morale: partyData.morale,
                strength: partyData.strength
            };
            
            // Check if battle-integration.js has an executeRaid function
            if (typeof window.battleIntegration !== 'undefined' && 
                typeof window.battleIntegration.executeRaid === 'function') {
                window.battleIntegration.executeRaid(settlement, explorerState);
                
                // Close settlement panel
                closeSettlementDetails();
            } else {
                // Fallback to BattleSystem if available
                if (typeof BattleSystem !== 'undefined') {
                    const battleReport = {
                        id: `battle_${Date.now()}`,
                        type: 'raid',
                        attacker: {
                            type: 'player',
                            name: 'Your Forces',
                            warriors: partyData.warriors,
                            strength: partyData.strength
                        },
                        defender: {
                            type: settlement.type,
                            name: settlement.name,
                            warriors: settlement.military ? settlement.military.warriors : 3,
                            strength: settlement.military ? settlement.military.warriors * 1.2 : 4
                        },
                        location: settlement.region,
                        date: GameEngine.getGameState().date,
                        outcome: "Victory", // Simplified for now
                        casualties: {
                            attacker: Math.floor(partyData.warriors * 0.1),
                            defender: Math.floor((settlement.military ? settlement.military.warriors : 3) * 0.2)
                        },
                        loot: {
                            food: 20,
                            wood: 10,
                            stone: 5,
                            metal: 2
                        },
                        relationImpact: -10,
                        fameReward: 75
                    };
                    
                    // Add to battle history
                    BattleSystem.addBattleToHistory(battleReport);
                    
                    // Update player resources
                    ResourceManager.addResources(battleReport.loot);
                    
                    // Add fame
                    RankManager.addFame(battleReport.fameReward, `Raid on ${settlement.name}`);
                    
                    // Adjust party warriors
                    partyData.warriors -= battleReport.casualties.attacker;
                    
                    // Update UI
                    Utils.updateElement('active-party-warriors', partyData.warriors);
                    
                    // Log result
                    Utils.log(`Your forces raided ${settlement.name} and emerged victorious!`, "success");
                    
                    // Close settlement panel
                    closeSettlementDetails();
                } else {
                    Utils.log("Battle system not available. Cannot raid settlement.", "important");
                }
            }
        } else {
            Utils.log("Cannot raid while traveling or without an active party.", "important");
        }
    }
    
    /**
     * Update the explorer UI when arriving at a new region
     * @param {Object} region - The new region
     */
    function updateRegionArrival(region) {
        // Update current region info
        updateCurrentRegionInfo();
        
        // Update neighboring regions
        updateNeighboringRegions();
        
        // Update settlements in the region
        updateSettlementsList();
        
        // Log arrival
        Utils.log(`Your party has arrived in ${region.name}.`, "success");
        
        // Apply region resource modifiers if in home region
        if (partyData.currentRegion === partyData.homeRegion && 
            typeof WorldMap.updateRegionResourceModifiers === 'function') {
            WorldMap.updateRegionResourceModifiers(region);
        }
        
        // Discover regional resources
        discoverRegionalResources(region);
        
        // Update UI if modal is open
        if (isExplorerModalActive) {
            // Update travel status display
            document.getElementById('travel-status').classList.add('hidden');
            
            // Update current region name
            Utils.updateElement('party-current-region', region.name);
            
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
        }
    }
    
    /**
     * Discover resources based on region type
     * @param {Object} region - Region object
     */
    function discoverRegionalResources(region) {
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
    }
    
    /**
     * Generate a random encounter
     * @returns {Object} - Encounter details
     */
    function generateRandomEncounter() {
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
            
            // Set currentRegion and homeRegion to player's region
            if (playerRegion) {
                partyData.currentRegion = playerRegion.id;
                partyData.homeRegion = playerRegion.id;
                console.log(`Set currentRegion and homeRegion to: ${playerRegion.id}`);
            }
            
            // Create the explorer modal (but don't show it yet)
            createExplorerModal();
            
            // Register a button in the main UI to open the explorer
            const exploreButton = document.getElementById('btn-explore');
            if (exploreButton) {
                exploreButton.addEventListener('click', function() {
                    openExplorerModal();
                });
            }
            
            // Create global reference for battle integration
            if (typeof window.battleIntegration === 'undefined') {
                window.battleIntegration = {
                    executeRaid: null // Will be set by battle-integration.js
                };
            }
            
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
            updateSettlementsList();
            
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
            Utils.updateElement('available-warriors', this.getAvailableWarriors());
            
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
            
            // Close any open settlement details
            closeSettlementDetails();
        },
        
        /**
         * Visit a settlement in the current region
         * @param {string} settlementId - ID of the settlement to visit
         */
        visitSettlement: function(settlementId) {
            if (!partyData.active || partyData.travelStatus.traveling) {
                Utils.log("No active party available for travel", "important");
                return;
            }
            
            const settlement = WorldMap.getSettlement(settlementId);
            if (!settlement) {
                Utils.log("Settlement not found", "important");
                return;
            }
            
            // Check if the settlement is in the current region
            if (settlement.region !== partyData.currentRegion) {
                Utils.log("Settlement is not in the current region", "important");
                return;
            }
            
            // Log the visit
            Utils.log(`Your party approaches ${settlement.name}.`, "success");
            
            // Show settlement details panel
            showSettlementDetails(settlement);
        },
        
        /**
         * Show detailed information about a settlement
         * This method is exposed for integration with battle-integration.js
         * @param {Object} settlement - Settlement object
         */
        showSettlementDetails: showSettlementDetails,
        
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
                
                // Close any open settlement details
                closeSettlementDetails();
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
            
            // Update UI if explorer modal is open
            if (isExplorerModalActive) {
                Utils.updateElement('travel-days', Math.max(0, Math.ceil(partyData.travelStatus.daysRemaining)));
            }
            
            // Check for travel completion
            if (partyData.travelStatus.daysRemaining <= 0) {
                // Travel completed
                partyData.currentRegion = partyData.travelStatus.destination;
                partyData.travelStatus.traveling = false;
                partyData.travelStatus.daysRemaining = 0;
                partyData.travelStatus.destination = null;
                
                // Get destination region
                const newRegion = WorldMap.getRegion(partyData.currentRegion);
                
                // Update region arrival effects
                updateRegionArrival(newRegion);
                
                // Apply region resource modifiers if in home region (as if we moved the settlement)
                if (partyData.currentRegion === partyData.homeRegion && typeof WorldMap.updateRegionResourceModifiers === 'function') {
                    WorldMap.updateRegionResourceModifiers(newRegion);
                }
                
                // Update UI now that travel is complete
                if (isExplorerModalActive) {
                    updateCurrentRegionInfo();
                    updateNeighboringRegions();
                    updateSettlementsList();
                }
            }
            
            // Check for random encounters during travel
            if (partyData.travelStatus.traveling && tickSize > 0) {
                const encounterChancePerDay = encounterChance[partyData.type] || 20;
                const encounterRoll = Math.random() * 100;
                
                // Adjust encounter chance based on tick size
                const adjustedChance = encounterChancePerDay * tickSize;
                
                if (encounterRoll < adjustedChance) {
                    // Random encounter - this will be implemented more fully in future
                    const encounterType = generateRandomEncounter();
                    
                    // Log encounter
                    Utils.log(`Your party encountered ${encounterType.description} while traveling.`, "important");
                    
                    // TODO: Handle encounter effects
                }
            }
        },
        
        /**
         * Open the explorer UI
         * Public method that can be called from outside
         */
        openExplorer: function() {
            openExplorerModal();
        },
        
        /**
         * Get current explorer state
         * @returns {Object} - Current explorer state
         */
        getExplorerState: function() {
            return { ...partyData };
        },
        
        /**
         * Adjust warrior count directly (for battle results)
         * @param {number} newCount - New warrior count
         */
        adjustWarriorCount: function(newCount) {
            if (!partyData.active) return;
            
            // Ensure count is valid
            newCount = Math.max(0, Math.floor(newCount));
            
            // Update warrior count
            partyData.warriors = newCount;
            
            // Update party strength
            partyData.strength = calculatePartyStrength(newCount, partyData.type);
            
            // Update UI if explorer modal is open
            if (isExplorerModalActive) {
                Utils.updateElement('active-party-warriors', partyData.warriors);
                Utils.updateElement('active-party-strength', partyData.strength);
            }
            
            // If all warriors are dead, disband party
            if (newCount === 0) {
                partyData.active = false;
                Utils.log("Your party has been wiped out!", "danger");
                
                // Update UI
                if (isExplorerModalActive) {
                    document.getElementById('party-config').classList.remove('hidden');
                    document.getElementById('active-party').classList.add('hidden');
                    document.getElementById('exploration-actions').classList.add('hidden');
                    
                    // If traveling, close the modal
                    if (partyData.travelStatus.traveling) {
                        closeExplorerModal();
                    }
                }
                
                // Reset travel status
                partyData.travelStatus.traveling = false;
                partyData.travelStatus.daysRemaining = 0;
                partyData.travelStatus.destination = null;
            }
        }
    };
})();
