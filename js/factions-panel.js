/**
 * Viking Legacy - Enhanced Factions Panel
 * UI for exploring kingdoms, territories, rulers and diplomatic relations
 * with improved navigation and data aggregation
 */

const FactionsPanel = (function() {
    // Track state
    let currentView = 'overview'; // 'overview', 'kingdom', 'ruler', 'territory', 'relations', 'comparison'
    let selectedFactionId = null;
    let selectedRulerId = null;
    let selectedTerritoryId = null;
    let selectedTab = 'kingdoms'; // For sub-tabs: 'kingdoms', 'territories', 'relations'
    let comparisonFactions = []; // For faction comparison view
    
    // For data caching
    let kingdomCache = {};
    
    // Create the factions panel with improved structure
    function createFactionsPanel() {
        console.log("Creating enhanced factions panel...");
        
        // Check if panel already exists
        if (document.getElementById('factions-panel')) {
            console.log("Factions panel already exists, skipping creation");
            return;
        }
        
        // Create panel container
        const factionsPanel = document.createElement('div');
        factionsPanel.id = 'factions-panel';
        factionsPanel.className = 'factions-panel hidden-panel'; // Start hidden
        
        // Add panel content with improved structure
        factionsPanel.innerHTML = `
            <div class="factions-header">
                <h2>Political Landscape</h2>
                <div class="view-controls">
                    <button id="btn-back-to-overview" class="btn-back hidden">← Back to Overview</button>
                </div>
            </div>
            
            <div class="factions-navigation">
                <button id="btn-nav-kingdoms" class="faction-nav-btn active" data-tab="kingdoms">Kingdoms</button>
                <button id="btn-nav-territories" class="faction-nav-btn" data-tab="territories">Territories</button>
                <button id="btn-nav-relations" class="faction-nav-btn" data-tab="relations">Diplomacy</button>
                <button id="btn-nav-comparison" class="faction-nav-btn" data-tab="comparison">Compare</button>
            </div>
            
            <div class="factions-content">
                <!-- Overview & Summary Views -->
                <div id="faction-tab-kingdoms" class="faction-tab active">
                    <!-- Kingdoms List View -->
                    <div id="kingdoms-overview" class="faction-view active">
                        <div class="faction-summary">
                            <div class="faction-summary-header">
                                <h3>Known Realms</h3>
                                <div class="faction-filters">
                                    <select id="kingdom-faction-filter">
                                        <option value="all">All Factions</option>
                                        <option value="NORSE">Norse</option>
                                        <option value="ANGLO_SAXON">Anglo-Saxon</option>
                                        <option value="FRANKISH">Frankish</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="faction-counters">
                                <div class="faction-counter norse">
                                    <div class="counter-label">Norse Kingdoms:</div>
                                    <div id="norse-kingdom-count" class="counter-value">0</div>
                                </div>
                                <div class="faction-counter anglo">
                                    <div class="counter-label">Anglo Kingdoms:</div>
                                    <div id="anglo-kingdom-count" class="counter-value">0</div>
                                </div>
                                <div class="faction-counter frankish">
                                    <div class="counter-label">Frankish Kingdoms:</div>
                                    <div id="frankish-kingdom-count" class="counter-value">0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="kingdoms-container">
                            <div id="kingdoms-list" class="faction-list kingdom-grid">
                                Loading kingdoms...
                            </div>
                        </div>
                        
                        <div class="local-politics">
                            <h3>Your Region's Politics</h3>
                            <div id="player-region-politics">Loading local political information...</div>
                        </div>
                    </div>
                    
                    <!-- Single Kingdom Detail View -->
                    <div id="kingdom-detail" class="faction-view">
                        <div class="kingdom-header">
                            <div class="kingdom-title">
                                <h3 id="kingdom-detail-name">Kingdom Name</h3>
                                <div id="kingdom-type-badge" class="kingdom-type-badge">Type</div>
                            </div>
                            <div class="kingdom-actions">
                                <button id="btn-compare-kingdom" class="btn-action">Add to Comparison</button>
                            </div>
                        </div>
                        
                        <div class="kingdom-content">
                            <div class="kingdom-statistics">
                                <div class="stat-section">
                                    <h4>Realm Overview</h4>
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Ruler</div>
                                            <div id="kingdom-ruler-name" class="stat-value">Unknown</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Capital</div>
                                            <div id="kingdom-capital-name" class="stat-value">Unknown</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Territories</div>
                                            <div id="kingdom-territory-count" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Settlements</div>
                                            <div id="kingdom-settlement-count" class="stat-value">0</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-section">
                                    <h4>Population & Military</h4>
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Total Population</div>
                                            <div id="kingdom-total-population" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Military Strength</div>
                                            <div id="kingdom-military-strength" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Warriors</div>
                                            <div id="kingdom-warriors" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Defenses</div>
                                            <div id="kingdom-defenses" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Ships</div>
                                            <div id="kingdom-ships" class="stat-value">0</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-section">
                                    <h4>Resources</h4>
                                    <div class="resources-summary" id="kingdom-resources">
                                        Loading resources...
                                    </div>
                                </div>
                            </div>
                            
                            <div class="kingdom-details-tabs">
                                <div class="detail-tabs">
                                    <button class="detail-tab active" data-tab="settlements">Settlements</button>
                                    <button class="detail-tab" data-tab="vassals">Vassals</button>
                                    <button class="detail-tab" data-tab="ruler">Ruler</button>
                                </div>
                                
                                <div class="detail-content">
                                    <div id="kingdom-settlements-tab" class="detail-pane active">
                                        <div id="kingdom-settlements-list" class="settlement-list">
                                            Loading settlements...
                                        </div>
                                    </div>
                                    
                                    <div id="kingdom-vassals-tab" class="detail-pane">
                                        <div id="kingdom-vassals-list" class="vassals-list">
                                            Loading vassals...
                                        </div>
                                    </div>
                                    
                                    <div id="kingdom-ruler-tab" class="detail-pane">
                                        <div id="kingdom-ruler-details" class="ruler-profile">
                                            Loading ruler details...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Territories Tab Content -->
                <div id="faction-tab-territories" class="faction-tab">
                    <!-- Territories List View -->
                    <div id="territories-overview" class="faction-view active">
                        <div class="territories-header">
                            <h3>Territories</h3>
                            <div class="territory-filters">
                                <select id="territory-faction-filter">
                                    <option value="all">All Factions</option>
                                    <option value="NORSE">Norse</option>
                                    <option value="ANGLO_SAXON">Anglo-Saxon</option>
                                    <option value="FRANKISH">Frankish</option>
                                </select>
                                <select id="territory-resource-filter">
                                    <option value="all">All Resources</option>
                                    <option value="food">Food</option>
                                    <option value="wood">Wood</option>
                                    <option value="stone">Stone</option>
                                    <option value="metal">Metal</option>
                                    <option value="silver">Silver</option>
                                    <option value="gold">Gold</option>
                                </select>
                                <select id="territory-sort">
                                    <option value="name">Sort by Name</option>
                                    <option value="prosperity">Sort by Prosperity</option>
                                    <option value="population">Sort by Population</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="territories-list" class="territories-grid">
                            Loading territories...
                        </div>
                    </div>
                    
                    <!-- Territory Detail View -->
                    <div id="territory-detail" class="faction-view">
                        <div class="territory-header">
                            <h3 id="territory-detail-name">Territory Name</h3>
                            <div id="territory-faction-name" class="territory-faction-badge">Faction</div>
                        </div>
                        
                        <div class="territory-content">
                            <div class="territory-stats">
                                <div class="stat-section">
                                    <h4>Overview</h4>
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Region</div>
                                            <div id="territory-region-name" class="stat-value">Unknown</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Prosperity</div>
                                            <div id="territory-prosperity" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Unrest</div>
                                            <div id="territory-unrest" class="stat-value">0</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Settlements</div>
                                            <div id="territory-settlement-count" class="stat-value">0</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="territory-resources">
                                <h4>Resources</h4>
                                <div id="territory-resources-list" class="resources-grid">
                                    Loading resources...
                                </div>
                            </div>
                            
                            <div class="territory-settlements">
                                <h4>Settlements</h4>
                                <div id="territory-settlements-list" class="settlements-grid">
                                    Loading settlements...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Diplomacy Tab Content -->
                <div id="faction-tab-relations" class="faction-tab">
                    <div id="relations-overview" class="faction-view active">
                        <h3>Diplomatic Relations</h3>
                        
                        <div class="relations-selector">
                            <div class="relation-form">
                                <div class="form-group">
                                    <label for="relation-faction1">First Faction:</label>
                                    <select id="relation-faction1">
                                        <option value="">Select First Faction</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="relation-faction2">Second Faction:</label>
                                    <select id="relation-faction2">
                                        <option value="">Select Second Faction</option>
                                    </select>
                                </div>
                                
                                <div class="form-actions">
                                    <button id="btn-view-relation" class="btn-action">View Relationship</button>
                                </div>
                            </div>
                            
                            <div id="relation-display" class="relation-display">
                                <div class="relation-placeholder">
                                    Select two factions to view their relationship
                                </div>
                            </div>
                        </div>
                        
                        <div class="diplomatic-matrix">
                            <h4>Diplomatic Overview</h4>
                            <div id="relation-matrix" class="relation-matrix">
                                Loading diplomatic relationships...
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Comparison Tab Content -->
                <div id="faction-tab-comparison" class="faction-tab">
                    <div id="comparison-view" class="faction-view active">
                        <div class="comparison-header">
                            <h3>Realm Comparison</h3>
                            <div class="comparison-controls">
                                <button id="btn-clear-comparison" class="btn-action">Clear Comparison</button>
                            </div>
                        </div>
                        
                        <div class="comparison-selector">
                            <div class="selected-factions" id="comparison-selected-factions">
                                No realms selected for comparison
                            </div>
                            
                            <div class="add-to-comparison">
                                <select id="comparison-add-faction">
                                    <option value="">Add a realm to compare...</option>
                                </select>
                                <button id="btn-add-to-comparison">Add</button>
                            </div>
                        </div>
                        
                        <div class="comparison-content" id="comparison-content">
                            <div class="comparison-placeholder">
                                Select at least two realms to compare
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Ruler Detail View (can be accessed from multiple places) -->
                <div id="ruler-detail-view" class="faction-view">
                    <div class="ruler-header">
                        <h3 id="ruler-detail-name">Ruler Name</h3>
                        <div id="ruler-faction-name" class="ruler-faction-badge">Faction</div>
                    </div>
                    
                    <div class="ruler-content">
                        <div id="ruler-details" class="ruler-details">
                            Loading ruler information...
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(factionsPanel);
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('factions-panel', 'politics');
                console.log("Enhanced factions panel registered with navigation system");
            }
            
            // Add event listeners
            setupEventListeners();
        }
        
        // Add CSS styles
        addEnhancedFactionsPanelStyles();
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    function setupEventListeners() {
        // Main navigation tabs
        document.querySelectorAll('.faction-nav-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.dataset.tab;
                switchTab(tab);
            });
        });
        
        // Back button
        document.getElementById('btn-back-to-overview').addEventListener('click', function() {
            goBackToOverview();
        });
        
        // Kingdom actions
        document.getElementById('btn-compare-kingdom').addEventListener('click', function() {
            if (selectedFactionId) {
                addFactionToComparison(selectedFactionId);
                switchTab('comparison');
            }
        });
        
        // Kingdom detail tabs
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                switchKingdomDetailTab(tabName);
            });
        });
        
        // Filters
        document.getElementById('kingdom-faction-filter').addEventListener('change', function() {
            updateKingdomsList(this.value);
        });
        
        document.getElementById('territory-faction-filter').addEventListener('change', function() {
            updateTerritoriesList(this.value);
        });
        
        document.getElementById('territory-resource-filter').addEventListener('change', function() {
            const factionFilter = document.getElementById('territory-faction-filter').value;
            updateTerritoriesList(factionFilter, this.value);
        });
        
        document.getElementById('territory-sort').addEventListener('change', function() {
            const factionFilter = document.getElementById('territory-faction-filter').value;
            const resourceFilter = document.getElementById('territory-resource-filter').value;
            updateTerritoriesList(factionFilter, resourceFilter, this.value);
        });
        
        // Relations view
        document.getElementById('btn-view-relation').addEventListener('click', function() {
            const faction1 = document.getElementById('relation-faction1').value;
            const faction2 = document.getElementById('relation-faction2').value;
            
            if (faction1 && faction2) {
                showRelation(faction1, faction2);
            }
        });
        
        // Comparison view
        document.getElementById('btn-clear-comparison').addEventListener('click', function() {
            clearComparison();
        });
        
        document.getElementById('btn-add-to-comparison').addEventListener('click', function() {
            const factionId = document.getElementById('comparison-add-faction').value;
            if (factionId) {
                addFactionToComparison(factionId);
            }
        });
    }
    
    /**
     * Switch between main tabs (kingdoms, territories, relations, comparison)
     * @param {string} tabName - Tab to switch to
     */
    function switchTab(tabName) {
        // Update selectedTab
        selectedTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.faction-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTabBtn = document.getElementById(`btn-nav-${tabName}`);
        if (activeTabBtn) activeTabBtn.classList.add('active');
        
        // Hide all tab content
        document.querySelectorAll('.faction-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`faction-tab-${tabName}`);
        if (tabContent) tabContent.classList.add('active');
        
        // Reset to overview view within the tab
        if (tabName === 'kingdoms') {
            showKingdomsOverview();
        } else if (tabName === 'territories') {
            showTerritoriesOverview();
        } else if (tabName === 'relations') {
            updateRelationsView();
        } else if (tabName === 'comparison') {
            updateComparisonView();
        }
    }
    
    /**
     * Switch between detail tabs in kingdom view
     * @param {string} tabName - Tab to switch to (settlements, vassals, ruler)
     */
    function switchKingdomDetailTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTabBtn = document.querySelector(`.detail-tab[data-tab="${tabName}"]`);
        if (activeTabBtn) activeTabBtn.classList.add('active');
        
        // Hide all detail content
        document.querySelectorAll('.detail-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Show selected content
        const tabContent = document.getElementById(`kingdom-${tabName}-tab`);
        if (tabContent) tabContent.classList.add('active');
    }
    
    /**
     * Go back to the overview from a detail view
     */
    function goBackToOverview() {
        // Reset selected IDs
        selectedFactionId = null;
        selectedRulerId = null;
        selectedTerritoryId = null;
        
        // Hide back button
        document.getElementById('btn-back-to-overview').classList.add('hidden');
        
        // Show overview based on current tab
        if (selectedTab === 'kingdoms') {
            showKingdomsOverview();
        } else if (selectedTab === 'territories') {
            showTerritoriesOverview();
        } else if (selectedTab === 'relations') {
            // Already showing overview
        } else if (selectedTab === 'comparison') {
            // Already showing overview
        }
    }
    
    /**
     * Show the kingdoms overview (list of all kingdoms)
     */
    function showKingdomsOverview() {
        // Hide all views in kingdoms tab
        document.querySelectorAll('#faction-tab-kingdoms .faction-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show kingdoms overview
        const overviewElement = document.getElementById('kingdoms-overview');
        if (overviewElement) overviewElement.classList.add('active');
        
        // Hide back button
        document.getElementById('btn-back-to-overview').classList.add('hidden');
        
        // Update content
        updateKingdomsList();
    }
    
    /**
     * Show the territories overview (list of all territories)
     */
    function showTerritoriesOverview() {
        // Hide all views in territories tab
        document.querySelectorAll('#faction-tab-territories .faction-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show territories overview
        const overviewElement = document.getElementById('territories-overview');
        if (overviewElement) overviewElement.classList.add('active');
        
        // Hide back button
        document.getElementById('btn-back-to-overview').classList.add('hidden');
        
        // Update content
        updateTerritoriesList();
    }
    
    /**
     * Update the overview page with faction counts and kingdom list
     * @param {string} [factionFilter='all'] - Optional faction type to filter by
     */
    function updateKingdomsList(factionFilter = 'all') {
        console.log("Updating kingdoms list with filter:", factionFilter);
        
        const factionData = FactionIntegration.getFactionData();
        
        // Get the kingdoms list element
        const kingdomsListElement = document.getElementById('kingdoms-list');
        if (!kingdomsListElement) {
            console.error("Could not find kingdoms-list element");
            return;
        }
        
        // Count kingdoms by type
        let norseCount = 0;
        let angloCount = 0;
        let frankishCount = 0;
        
        if (factionData.kingdoms && factionData.kingdoms.length > 0) {
            factionData.kingdoms.forEach(kingdom => {
                if (kingdom.type === 'NORSE') norseCount++;
                else if (kingdom.type === 'ANGLO_SAXON') angloCount++;
                else if (kingdom.type === 'FRANKISH') frankishCount++;
            });
        }
        
        // Update counter displays
        document.getElementById('norse-kingdom-count').textContent = norseCount;
        document.getElementById('anglo-kingdom-count').textContent = angloCount;
        document.getElementById('frankish-kingdom-count').textContent = frankishCount;
        
        // Filter kingdoms by faction type if requested
        let kingdoms = [...factionData.kingdoms];
        
        if (factionFilter !== 'all') {
            kingdoms = kingdoms.filter(kingdom => kingdom.type === factionFilter);
        }
        
        // Sort kingdoms by strength
        kingdoms.sort((a, b) => b.strength - a.strength);
        
        // Create HTML for kingdoms list
        if (kingdoms.length === 0) {
            kingdomsListElement.innerHTML = '<div class="empty-list">No kingdoms discovered yet.</div>';
            return;
        }
        
        let kingdomsHTML = '';
        
        kingdoms.forEach(kingdom => {
            // Get ruler
            const ruler = FactionIntegration.getRulerById(kingdom.rulerId);
            
            // Calculate aggregated data for this kingdom
            const kingdomData = getAggregatedKingdomData(kingdom.id);
            
            // CSS class based on faction type
            const factionClass = kingdom.type.toLowerCase().replace('_', '-');
            
            // Format settlement count
            const settlementsCount = kingdomData.settlements.length;
            
            kingdomsHTML += `
                <div class="kingdom-card ${factionClass}" data-faction-id="${kingdom.id}">
                    <div class="kingdom-card-header">
                        <div class="kingdom-name">${kingdom.name}</div>
                        <div class="kingdom-type">${formatFactionType(kingdom.type)}</div>
                    </div>
                    
                    <div class="kingdom-card-ruler">
                        <div class="ruler-name">${ruler ? `${ruler.title} ${ruler.name}` : 'Unknown'}</div>
                    </div>
                    
                    <div class="kingdom-card-stats">
                        <div class="stat">
                            <div class="stat-label">Strength</div>
                            <div class="stat-value">${kingdom.strength}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Population</div>
                            <div class="stat-value">${kingdomData.totalPopulation}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Warriors</div>
                            <div class="stat-value">${kingdomData.totalWarriors}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Settlements</div>
                            <div class="stat-value">${settlementsCount}</div>
                        </div>
                    </div>
                    
                    <div class="kingdom-card-actions">
                        <button class="btn-view-kingdom" data-faction-id="${kingdom.id}">View Details</button>
                    </div>
                </div>
            `;
        });
        
        kingdomsListElement.innerHTML = kingdomsHTML;
        
        // Add event listeners
        kingdomsListElement.querySelectorAll('.btn-view-kingdom').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        });
        
        // Update player region politics section
        updatePlayerRegionPolitics();
    }
    
    /**
     * Update the player's region political information
     */
    function updatePlayerRegionPolitics() {
        const playerRegionPoliticsDiv = document.getElementById('player-region-politics');
        if (!playerRegionPoliticsDiv) return;
        
        const playerRegion = WorldMap.getPlayerRegion();
        if (!playerRegion) {
            playerRegionPoliticsDiv.innerHTML = '<p>No region information available.</p>';
            return;
        }
        
        // Get settlements in the player's region
        const settlements = WorldMap.getSettlementsByRegion(playerRegion.id);
        if (!settlements || settlements.length === 0) {
            playerRegionPoliticsDiv.innerHTML = '<p>No known settlements in your region.</p>';
            return;
        }
        
        // Get factions present in the region
        const factionsInRegion = new Map();
        settlements.forEach(settlement => {
            if (settlement.factionId) {
                const faction = FactionIntegration.getFactionById(settlement.factionId);
                if (faction && !factionsInRegion.has(faction.id)) {
                    factionsInRegion.set(faction.id, faction);
                }
            }
        });
        
        // Create HTML for region politics
        let regionHTML = `
            <div class="region-info-container">
                <div class="region-header">
                    <div class="region-name">${playerRegion.name}</div>
                    <div class="region-type">${playerRegion.typeName || 'Region'}</div>
                </div>
                
                <div class="region-settlements">
                    <div class="stat-label">Settlements:</div>
                    <div class="stat-value">${settlements.length}</div>
                </div>
            </div>
        `;
        
        // Add factions section
        if (factionsInRegion.size === 0) {
            regionHTML += '<p>No known factions in this region.</p>';
        } else {
            regionHTML += `
                <div class="region-factions">
                    <h4>Factions in Region:</h4>
                    <div class="region-factions-list">
            `;
            
            factionsInRegion.forEach(faction => {
                const factionClass = faction.type.toLowerCase().replace('_', '-');
                
                // Get aggregated data
                const factionData = getAggregatedKingdomData(faction.id);
                
                regionHTML += `
                    <div class="region-faction ${factionClass}">
                        <div class="faction-info">
                            <div class="faction-name">${faction.name}</div>
                            <div class="faction-type">${formatFactionType(faction.type)}</div>
                        </div>
                        <div class="faction-stats">
                            <div class="stat">
                                <div class="stat-label">Population</div>
                                <div class="stat-value">${factionData.totalPopulation}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Warriors</div>
                                <div class="stat-value">${factionData.totalWarriors}</div>
                            </div>
                        </div>
                        <button class="btn-view-faction" data-faction-id="${faction.id}">View</button>
                    </div>
                `;
            });
            
            regionHTML += `
                    </div>
                </div>
            `;
        }
        
        playerRegionPoliticsDiv.innerHTML = regionHTML;
        
        // Add event listeners
        playerRegionPoliticsDiv.querySelectorAll('.btn-view-faction').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        });
    }
    
    /**
     * Show detailed information about a kingdom
     * @param {string} factionId - ID of the faction to display
     */
    function showKingdomDetail(factionId) {
        selectedFactionId = factionId;
        const faction = FactionIntegration.getFactionById(factionId);
        
        if (!faction) {
            console.error(`Faction not found: ${factionId}`);
            return;
        }
        
        // Hide all views in kingdoms tab
        document.querySelectorAll('#faction-tab-kingdoms .faction-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show kingdom detail view
        const detailView = document.getElementById('kingdom-detail');
        if (detailView) detailView.classList.add('active');
        
        // Show back button
        document.getElementById('btn-back-to-overview').classList.remove('hidden');
        
        // Get aggregated data for this kingdom
        const kingdomData = getAggregatedKingdomData(factionId);
        
        // Update kingdom name and type
        document.getElementById('kingdom-detail-name').textContent = faction.name;
        document.getElementById('kingdom-type-badge').textContent = formatFactionType(faction.type);
        document.getElementById('kingdom-type-badge').className = `kingdom-type-badge ${faction.type.toLowerCase().replace('_', '-')}`;
        
        // Update overview section
        const ruler = FactionIntegration.getRulerById(faction.rulerId);
        const capitalSettlement = WorldMap.getSettlement(faction.capitalSettlementId);
        
        document.getElementById('kingdom-ruler-name').textContent = ruler ? `${ruler.title} ${ruler.name}` : 'Unknown';
        document.getElementById('kingdom-capital-name').textContent = capitalSettlement ? capitalSettlement.name : 'Unknown';
        document.getElementById('kingdom-territory-count').textContent = faction.territoryIds ? faction.territoryIds.length : 0;
        document.getElementById('kingdom-settlement-count').textContent = kingdomData.settlements.length;
        
        // Update population & military section
        document.getElementById('kingdom-total-population').textContent = kingdomData.totalPopulation;
        document.getElementById('kingdom-military-strength').textContent = faction.strength;
        document.getElementById('kingdom-warriors').textContent = kingdomData.totalWarriors;
        document.getElementById('kingdom-defenses').textContent = kingdomData.totalDefenses;
        document.getElementById('kingdom-ships').textContent = kingdomData.totalShips;
        
        // Update resources section
        updateKingdomResourcesSection(kingdomData.resources);
        
        // Initialize with settlements tab active
        switchKingdomDetailTab('settlements');
        
        // Update settlements list
        updateKingdomSettlementsList(kingdomData.settlements);
        
        // Update vassals list
        updateKingdomVassalsList(faction);
        
        // Update ruler details
        updateKingdomRulerDetails(ruler, faction);
    }
    
    /**
     * Update the kingdom resources section with aggregated resource data
     * @param {Object} resources - Aggregated resources object
     */
    function updateKingdomResourcesSection(resources) {
        const resourcesElement = document.getElementById('kingdom-resources');
        if (!resourcesElement) return;
        
        // Group resources by category
        const resourceCategories = {
            'Basic Resources': ['food', 'wood', 'stone', 'metal'],
            'Advanced Resources': ['leather', 'fur', 'cloth', 'clay', 'pitch', 'salt', 'honey', 'herbs'],
            'Wealth Resources': ['silver', 'gold', 'amber', 'ivory', 'jewels'],
            'Environmental Resources': ['peat', 'whale_oil', 'ice', 'exotic']
        };
        
        let resourcesHTML = '<div class="resources-grid">';
        
        // For each category, add resources that exist
        for (const category in resourceCategories) {
            let categoryHTML = '';
            let hasResources = false;
            
            resourceCategories[category].forEach(resource => {
                if (resources[resource] && resources[resource] > 0) {
                    categoryHTML += `
                        <div class="resource-item">
                            <div class="resource-name">${formatResourceName(resource)}</div>
                            <div class="resource-value">${Math.round(resources[resource])}</div>
                        </div>
                    `;
                    hasResources = true;
                }
            });
            
            if (hasResources) {
                resourcesHTML += `
                    <div class="resource-category">
                        <div class="category-name">${category}</div>
                        <div class="category-items">${categoryHTML}</div>
                    </div>
                `;
            }
        }
        
        resourcesHTML += '</div>';
        resourcesElement.innerHTML = resourcesHTML;
    }
    
    /**
     * Update the kingdom settlements list
     * @param {Array} settlements - List of settlements in the kingdom
     */
    function updateKingdomSettlementsList(settlements) {
        const settlementsElement = document.getElementById('kingdom-settlements-list');
        if (!settlementsElement) return;
        
        if (settlements.length === 0) {
            settlementsElement.innerHTML = '<div class="empty-list">No settlements found.</div>';
            return;
        }
        
        let settlementsHTML = '';
        
        settlements.forEach(settlement => {
            const isCapital = selectedFactionId && 
                FactionIntegration.getFactionById(selectedFactionId)?.capitalSettlementId === settlement.id;
            
            settlementsHTML += `
                <div class="settlement-item ${isCapital ? 'capital' : ''}">
                    <div class="settlement-info">
                        <div class="settlement-name">${settlement.name} ${isCapital ? '<span class="capital-badge">Capital</span>' : ''}</div>
                        <div class="settlement-type">${settlement.type}</div>
                    </div>
                    
                    <div class="settlement-stats">
                        <div class="stat">
                            <div class="stat-label">Population</div>
                            <div class="stat-value">${settlement.population || 0}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Warriors</div>
                            <div class="stat-value">${settlement.military?.warriors || 0}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Defenses</div>
                            <div class="stat-value">${settlement.military?.defenses || 0}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        settlementsElement.innerHTML = settlementsHTML;
    }
    
    /**
     * Update the kingdom vassals list
     * @param {Object} faction - The kingdom faction object
     */
    function updateKingdomVassalsList(faction) {
        const vassalsElement = document.getElementById('kingdom-vassals-list');
        if (!vassalsElement) return;
        
        if (!faction.vassalIds || faction.vassalIds.length === 0) {
            vassalsElement.innerHTML = '<div class="empty-list">This realm has no known vassals.</div>';
            return;
        }
        
        let vassalsHTML = '';
        
        faction.vassalIds.forEach(vassalId => {
            const vassal = FactionIntegration.getFactionById(vassalId);
            if (!vassal) return;
            
            const vassalRuler = FactionIntegration.getRulerById(vassal.rulerId);
            const relation = FactionIntegration.getRelation(faction.id, vassalId);
            
            // Determine relationship class
            let relationClass = getRelationshipClass(relation);
            
            // Get vassal strength
            const vassalData = getAggregatedKingdomData(vassalId);
            
            vassalsHTML += `
                <div class="vassal-item relation-${relationClass}">
                    <div class="vassal-info">
                        <div class="vassal-name">${vassal.name}</div>
                        <div class="vassal-ruler">${vassalRuler ? vassalRuler.title + ' ' + vassalRuler.name : 'Unknown'}</div>
                    </div>
                    
                    <div class="vassal-stats">
                        <div class="stat">
                            <div class="stat-label">Strength</div>
                            <div class="stat-value">${vassal.strength}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Warriors</div>
                            <div class="stat-value">${vassalData.totalWarriors}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Relation</div>
                            <div class="stat-value relation-${relationClass}">${relation}</div>
                        </div>
                    </div>
                    
                    <button class="btn-view-faction" data-faction-id="${vassal.id}">View</button>
                </div>
            `;
        });
        
        vassalsElement.innerHTML = vassalsHTML;
        
        // Add event listeners
        vassalsElement.querySelectorAll('.btn-view-faction').forEach(btn => {
            btn.addEventListener('click', function() {
                const vassalId = this.dataset.factionId;
                showKingdomDetail(vassalId);
            });
        });
    }
    
    /**
     * Update the kingdom ruler details
     * @param {Object} ruler - The ruler object
     * @param {Object} faction - The faction object
     */
    function updateKingdomRulerDetails(ruler, faction) {
        const rulerDetailsElement = document.getElementById('kingdom-ruler-details');
        if (!rulerDetailsElement) return;
        
        if (!ruler) {
            rulerDetailsElement.innerHTML = '<div class="empty-list">No ruler information available.</div>';
            return;
        }
        
        // Format traits as badges
        const traitsHTML = ruler.traits.map(trait => 
            `<span class="trait-badge">${trait}</span>`
        ).join('');
        
        rulerDetailsElement.innerHTML = `
            <div class="ruler-card">
                <div class="ruler-header">
                    <div class="ruler-avatar ${ruler.gender.toLowerCase()}"></div>
                    <div class="ruler-title-name">
                        <div class="ruler-title">${ruler.title}</div>
                        <div class="ruler-name">${ruler.name}</div>
                    </div>
                </div>
                
                <div class="ruler-stats">
                    <div class="stat-row">
                        <div class="stat-label">Age:</div>
                        <div class="stat-value">${ruler.age} years</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">Gender:</div>
                        <div class="stat-value">${ruler.gender}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">Rank:</div>
                        <div class="stat-value">${ruler.rank}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">Prestige:</div>
                        <div class="stat-value">${ruler.prestige}</div>
                    </div>
                </div>
                
                <div class="ruler-traits">
                    <div class="traits-label">Traits:</div>
                    <div class="traits-list">${traitsHTML}</div>
                </div>
                
                <div class="ruler-actions">
                    <button class="btn-view-ruler" data-ruler-id="${ruler.id}">View Ruler Details</button>
                </div>
            </div>
        `;
        
        // Add event listener for ruler details button
        rulerDetailsElement.querySelector('.btn-view-ruler').addEventListener('click', function() {
            const rulerId = this.dataset.rulerId;
            showRulerDetail(rulerId);
        });
    }
    
    /**
     * Show detailed information about a ruler
     * @param {string} rulerId - ID of the ruler to display
     */
    function showRulerDetail(rulerId) {
        selectedRulerId = rulerId;
        const ruler = FactionIntegration.getRulerById(rulerId);
        
        if (!ruler) {
            console.error(`Ruler not found: ${rulerId}`);
            return;
        }
        
        // Hide all views
        document.querySelectorAll('.faction-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show ruler detail view
        const rulerDetailView = document.getElementById('ruler-detail-view');
        if (rulerDetailView) rulerDetailView.classList.add('active');
        
        // Show back button
        document.getElementById('btn-back-to-overview').classList.remove('hidden');
        
        // Update ruler name and faction
        const faction = FactionIntegration.getFactionById(ruler.factionId);
        
        document.getElementById('ruler-detail-name').textContent = `${ruler.title} ${ruler.name}`;
        
        if (faction) {
            document.getElementById('ruler-faction-name').textContent = faction.name;
            document.getElementById('ruler-faction-name').className = `ruler-faction-badge ${faction.type.toLowerCase().replace('_', '-')}`;
        } else {
            document.getElementById('ruler-faction-name').textContent = 'Unknown Faction';
            document.getElementById('ruler-faction-name').className = 'ruler-faction-badge';
        }
        
        // Format traits as badges
        const traitsHTML = ruler.traits.map(trait => 
            `<span class="trait-badge">${trait}</span>`
        ).join('');
        
        const rulerDetailsElement = document.getElementById('ruler-details');
        
        rulerDetailsElement.innerHTML = `
            <div class="ruler-detail-card">
                <div class="ruler-portrait">
                    <div class="ruler-avatar-large ${ruler.gender.toLowerCase()}"></div>
                </div>
                
                <div class="ruler-detail-stats">
                    <div class="stat-section">
                        <h4>Personal Information</h4>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-label">Age</div>
                                <div class="stat-value">${ruler.age} years</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Gender</div>
                                <div class="stat-value">${ruler.gender}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Rank</div>
                                <div class="stat-value">${ruler.rank}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Prestige</div>
                                <div class="stat-value">${ruler.prestige}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="realm-section">
                        <h4>Realm</h4>
                        <div class="realm-info">
                            ${faction ? `
                                <div class="realm-name">${faction.name}</div>
                                <div class="realm-type">${formatFactionType(faction.type)}</div>
                                <button class="btn-view-faction" data-faction-id="${faction.id}">View Realm</button>
                            ` : 'No faction information available.'}
                        </div>
                    </div>
                </div>
                
                <div class="ruler-traits-section">
                    <h4>Traits</h4>
                    <div class="traits-grid">
                        ${traitsHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for view faction button
        const viewFactionBtn = rulerDetailsElement.querySelector('.btn-view-faction');
        if (viewFactionBtn) {
            viewFactionBtn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        }
    }
    
    /**
     * Update the list of territories
     * @param {string} [factionFilter='all'] - Optional faction type to filter by
     * @param {string} [resourceFilter='all'] - Optional resource type to filter by
     * @param {string} [sortBy='name'] - How to sort the territories
     */
    function updateTerritoriesList(factionFilter = 'all', resourceFilter = 'all', sortBy = 'name') {
        const territoriesList = document.getElementById('territories-list');
        if (!territoriesList) return;
        
        const factionData = FactionIntegration.getFactionData();
        let territories = [...factionData.territories];
        
        // Filter by faction type if requested
        if (factionFilter !== 'all') {
            territories = territories.filter(territory => {
                const faction = FactionIntegration.getFactionById(territory.factionId);
                return faction && faction.type === factionFilter;
            });
        }
        
        // Filter by resource if requested
        if (resourceFilter !== 'all') {
            territories = territories.filter(territory => 
                territory.resources && 
                territory.resources[resourceFilter] && 
                territory.resources[resourceFilter] > 0
            );
        }
        
        // Apply sorting
        if (sortBy === 'name') {
            territories.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'prosperity') {
            territories.sort((a, b) => b.prosperity - a.prosperity);
        } else if (sortBy === 'population') {
            // Calculate population for each territory
            territories.sort((a, b) => {
                const aSettlements = a.settlements ? a.settlements.map(id => WorldMap.getSettlement(id)).filter(Boolean) : [];
                const bSettlements = b.settlements ? b.settlements.map(id => WorldMap.getSettlement(id)).filter(Boolean) : [];
                
                const aPopulation = aSettlements.reduce((sum, s) => sum + (s.population || 0), 0);
                const bPopulation = bSettlements.reduce((sum, s) => sum + (s.population || 0), 0);
                
                return bPopulation - aPopulation;
            });
        }
        
        if (territories.length === 0) {
            territoriesList.innerHTML = '<div class="empty-list">No territories found matching the filters.</div>';
            return;
        }
        
        let territoriesHTML = '';
        
        territories.forEach(territory => {
            const faction = FactionIntegration.getFactionById(territory.factionId);
            if (!faction) return;
            
            const region = WorldMap.getRegion(territory.regionId);
            const factionClass = faction.type.toLowerCase().replace('_', '-');
            
            // Get settlements in this territory
            const settlements = territory.settlements ? 
                territory.settlements.map(id => WorldMap.getSettlement(id)).filter(Boolean) : [];
            
            // Calculate total population
            const totalPopulation = settlements.reduce((sum, s) => sum + (s.population || 0), 0);
            
            // Get primary resources (highest values)
            const resourceEntries = Object.entries(territory.resources || {})
                .filter(([_, value]) => value > 0)
                .sort(([_, aValue], [__, bValue]) => bValue - aValue)
                .slice(0, 3);
            
            const resourceList = resourceEntries.map(([resource, value]) => 
                `<div class="resource-tag"><span class="resource-name">${formatResourceName(resource)}</span>: <span class="resource-value">${Math.round(value)}</span></div>`
            ).join('');
            
            territoriesHTML += `
                <div class="territory-card ${factionClass}">
                    <div class="territory-card-header">
                        <div class="territory-name">${territory.name}</div>
                        <div class="territory-faction">${faction.name}</div>
                    </div>
                    
                    <div class="territory-card-region">
                        ${region ? region.name : 'Unknown Region'}
                    </div>
                    
                    <div class="territory-card-stats">
                        <div class="stat">
                            <div class="stat-label">Prosperity</div>
                            <div class="stat-value">${territory.prosperity}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Population</div>
                            <div class="stat-value">${totalPopulation}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Settlements</div>
                            <div class="stat-value">${settlements.length}</div>
                        </div>
                    </div>
                    
                    <div class="territory-card-resources">
                        <div class="resource-header">Key Resources:</div>
                        <div class="resource-tags">
                            ${resourceList.length > 0 ? resourceList : 'No significant resources'}
                        </div>
                    </div>
                    
                    <div class="territory-card-actions">
                        <button class="btn-view-territory" data-territory-id="${territory.id}">View Details</button>
                    </div>
                </div>
            `;
        });
        
        territoriesList.innerHTML = territoriesHTML;
        
        // Add event listeners
        territoriesList.querySelectorAll('.btn-view-territory').forEach(btn => {
            btn.addEventListener('click', function() {
                const territoryId = this.dataset.territoryId;
                showTerritoryDetail(territoryId);
            });
        });
    }
    
    /**
     * Show detailed information about a territory
     * @param {string} territoryId - ID of the territory to display
     */
    function showTerritoryDetail(territoryId) {
        selectedTerritoryId = territoryId;
        const territory = FactionIntegration.getTerritoryById(territoryId);
        
        if (!territory) {
            console.error(`Territory not found: ${territoryId}`);
            return;
        }
        
        // Hide all views in territories tab
        document.querySelectorAll('#faction-tab-territories .faction-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show territory detail view
        const detailView = document.getElementById('territory-detail');
        if (detailView) detailView.classList.add('active');
        
        // Show back button
        document.getElementById('btn-back-to-overview').classList.remove('hidden');
        
        // Update territory name and faction
        const faction = FactionIntegration.getFactionById(territory.factionId);
        const region = WorldMap.getRegion(territory.regionId);
        
        document.getElementById('territory-detail-name').textContent = territory.name;
        
        if (faction) {
            document.getElementById('territory-faction-name').textContent = faction.name;
            document.getElementById('territory-faction-name').className = `territory-faction-badge ${faction.type.toLowerCase().replace('_', '-')}`;
        } else {
            document.getElementById('territory-faction-name').textContent = 'Unknown Faction';
            document.getElementById('territory-faction-name').className = 'territory-faction-badge';
        }
        
        // Update overview section
        document.getElementById('territory-region-name').textContent = region ? region.name : 'Unknown';
        document.getElementById('territory-prosperity').textContent = territory.prosperity;
        document.getElementById('territory-unrest').textContent = territory.unrest;
        
        // Get settlements in this territory
        const settlements = territory.settlements ? 
            territory.settlements.map(id => WorldMap.getSettlement(id)).filter(Boolean) : [];
        
        document.getElementById('territory-settlement-count').textContent = settlements.length;
        
        // Update resources section
        updateTerritoryResourcesList(territory.resources);
        
        // Update settlements section
        updateTerritorySettlementsList(settlements);
    }
    
    /**
     * Update the territory resources list
     * @param {Object} resources - Resources object
     */
    function updateTerritoryResourcesList(resources) {
        const resourcesElement = document.getElementById('territory-resources-list');
        if (!resourcesElement) return;
        
        if (!resources || Object.keys(resources).length === 0) {
            resourcesElement.innerHTML = '<div class="empty-list">No resources information available.</div>';
            return;
        }
        
        // Group resources by category
        const resourceCategories = {
            'Basic Resources': ['food', 'wood', 'stone', 'metal'],
            'Advanced Resources': ['leather', 'fur', 'cloth', 'clay', 'pitch', 'salt', 'honey', 'herbs'],
            'Wealth Resources': ['silver', 'gold', 'amber', 'ivory', 'jewels'],
            'Environmental Resources': ['peat', 'whale_oil', 'ice', 'exotic']
        };
        
        let resourcesHTML = '';
        
        // For each category, add resources that exist
        for (const category in resourceCategories) {
            let categoryHTML = '';
            let hasResources = false;
            
            resourceCategories[category].forEach(resource => {
                if (resources[resource] && resources[resource] > 0) {
                    categoryHTML += `
                        <div class="resource-item">
                            <div class="resource-name">${formatResourceName(resource)}</div>
                            <div class="resource-value">${Math.round(resources[resource])}</div>
                        </div>
                    `;
                    hasResources = true;
                }
            });
            
            if (hasResources) {
                resourcesHTML += `
                    <div class="resource-category">
                        <div class="category-name">${category}</div>
                        <div class="category-items">${categoryHTML}</div>
                    </div>
                `;
            }
        }
        
        if (resourcesHTML === '') {
            resourcesElement.innerHTML = '<div class="empty-list">No resources information available.</div>';
        } else {
            resourcesElement.innerHTML = resourcesHTML;
        }
    }
    
    /**
     * Update the territory settlements list
     * @param {Array} settlements - List of settlements in the territory
     */
    function updateTerritorySettlementsList(settlements) {
        const settlementsElement = document.getElementById('territory-settlements-list');
        if (!settlementsElement) return;
        
        if (!settlements || settlements.length === 0) {
            settlementsElement.innerHTML = '<div class="empty-list">No settlements in this territory.</div>';
            return;
        }
        
        let settlementsHTML = '';
        
        settlements.forEach(settlement => {
            // Determine if this is a capital settlement for its faction
            const isCapital = FactionIntegration.getFactionById(settlement.factionId)?.capitalSettlementId === settlement.id;
            
            settlementsHTML += `
                <div class="settlement-item ${isCapital ? 'capital' : ''}">
                    <div class="settlement-info">
                        <div class="settlement-name">${settlement.name} ${isCapital ? '<span class="capital-badge">Capital</span>' : ''}</div>
                        <div class="settlement-type">${settlement.type}</div>
                    </div>
                    
                    <div class="settlement-stats">
                        <div class="stat">
                            <div class="stat-label">Population</div>
                            <div class="stat-value">${settlement.population || 0}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Warriors</div>
                            <div class="stat-value">${settlement.military?.warriors || 0}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Defenses</div>
                            <div class="stat-value">${settlement.military?.defenses || 0}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        settlementsElement.innerHTML = settlementsHTML;
    }
    
    /**
     * Update the relations view and populate faction dropdowns
     */
    function updateRelationsView() {
        const factionData = FactionIntegration.getFactionData();
        const factions = factionData.factions.filter(f => f.rank >= 3); // Show only significant factions
        
        // Sort by type, then rank and name
        factions.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.rank !== b.rank) return b.rank - a.rank;
            return a.name.localeCompare(b.name);
        });
        
        // Populate faction selectors
        const faction1Select = document.getElementById('relation-faction1');
        const faction2Select = document.getElementById('relation-faction2');
        
        if (!faction1Select || !faction2Select) return;
        
        // Clear existing options (keep the first one)
        while (faction1Select.options.length > 1) faction1Select.remove(1);
        while (faction2Select.options.length > 1) faction2Select.remove(1);
        
        // Add option groups by faction type
        const types = {
            'NORSE': 'Norse Realms',
            'ANGLO_SAXON': 'Anglo-Saxon Realms',
            'FRANKISH': 'Frankish Realms'
        };
        
        const optgroups1 = {};
        const optgroups2 = {};
        
        for (const type in types) {
            optgroups1[type] = document.createElement('optgroup');
            optgroups1[type].label = types[type];
            faction1Select.appendChild(optgroups1[type]);
            
            optgroups2[type] = document.createElement('optgroup');
            optgroups2[type].label = types[type];
            faction2Select.appendChild(optgroups2[type]);
        }
        
        // Add options for each faction
        factions.forEach(faction => {
            const option1 = document.createElement('option');
            option1.value = faction.id;
            option1.textContent = faction.name;
            
            const option2 = document.createElement('option');
            option2.value = faction.id;
            option2.textContent = faction.name;
            
            if (optgroups1[faction.type]) {
                optgroups1[faction.type].appendChild(option1);
                optgroups2[faction.type].appendChild(option2);
            }
        });
        
        // Update relation matrix
        updateRelationMatrix(factions);
    }
    
    /**
     * Show relation between two factions
     * @param {string} faction1Id - ID of the first faction
     * @param {string} faction2Id - ID of the second faction
     */
    function showRelation(faction1Id, faction2Id) {
        const relationDisplay = document.getElementById('relation-display');
        if (!relationDisplay) return;
        
        const faction1 = FactionIntegration.getFactionById(faction1Id);
        const faction2 = FactionIntegration.getFactionById(faction2Id);
        
        if (!faction1 || !faction2) {
            relationDisplay.innerHTML = '<p>Could not find faction information.</p>';
            return;
        }
        
        const relation = FactionIntegration.getRelation(faction1Id, faction2Id);
        
        // Determine relationship descriptor and class
        const relationDesc = getRelationshipDescription(relation);
        const relationClass = getRelationshipClass(relation);
        
        // Vassalage status
        let vassalageInfo = '';
        if (faction1.parentFactionId === faction2.id) {
            vassalageInfo = `<div class="vassalage-info">${faction1.name} is a vassal of ${faction2.name}</div>`;
        } else if (faction2.parentFactionId === faction1.id) {
            vassalageInfo = `<div class="vassalage-info">${faction2.name} is a vassal of ${faction1.name}</div>`;
        }
        
        relationDisplay.innerHTML = `
            <div class="relation-result">
                <div class="relation-factions">
                    <div class="relation-faction faction-${faction1.type.toLowerCase().replace('_', '-')}">
                        ${faction1.name}
                    </div>
                    <div class="relation-arrow relation-${relationClass}">→</div>
                    <div class="relation-faction faction-${faction2.type.toLowerCase().replace('_', '-')}">
                        ${faction2.name}
                    </div>
                </div>
                
                <div class="relation-status relation-${relationClass}">
                    ${relationDesc} (${relation})
                </div>
                
                ${vassalageInfo}
                
                <div class="relation-factors">
                    <h4>Key Factors:</h4>
                    <ul class="relation-factors-list">
                        ${generateRelationFactors(faction1, faction2, relation)}
                    </ul>
                </div>
                
                <div class="relation-actions">
                    <button class="btn-view-faction" data-faction-id="${faction1.id}">View ${faction1.name}</button>
                    <button class="btn-view-faction" data-faction-id="${faction2.id}">View ${faction2.name}</button>
                    <button class="btn-add-to-comparison" data-faction-ids="${faction1.id},${faction2.id}">Compare These Realms</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        relationDisplay.querySelectorAll('.btn-view-faction').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                selectedTab = 'kingdoms';
                switchTab('kingdoms');
                showKingdomDetail(factionId);
            });
        });
        
        relationDisplay.querySelector('.btn-add-to-comparison').addEventListener('click', function() {
            const factionIds = this.dataset.factionIds.split(',');
            factionIds.forEach(id => addFactionToComparison(id));
            switchTab('comparison');
        });
    }
    
    /**
     * Generate relation factors explanation
     * @param {Object} faction1 - First faction
     * @param {Object} faction2 - Second faction
     * @param {number} relation - Relation value
     * @returns {string} - HTML for relation factors
     */
    function generateRelationFactors(faction1, faction2, relation) {
        // This is a simplified factors list - in a full implementation,
        // this would use actual factors from the simulation
        const factors = [];
        
        // Culture/type factor
        if (faction1.type === faction2.type) {
            factors.push(`<li><span class="factor-positive">+20</span> Same culture</li>`);
        } else {
            if ((faction1.type === 'NORSE' && (faction2.type === 'ANGLO_SAXON' || faction2.type === 'FRANKISH')) ||
                ((faction1.type === 'ANGLO_SAXON' || faction1.type === 'FRANKISH') && faction2.type === 'NORSE')) {
                factors.push(`<li><span class="factor-negative">-20</span> Historical rivals</li>`);
            } else {
                factors.push(`<li><span class="factor-neutral">0</span> Different cultures</li>`);
            }
        }
        
        // Vassalage factors
        if (faction1.parentFactionId === faction2.id) {
            factors.push(`<li><span class="factor-positive">+40</span> Vassal to liege relationship</li>`);
        } else if (faction2.parentFactionId === faction1.id) {
            factors.push(`<li><span class="factor-positive">+40</span> Liege to vassal relationship</li>`);
        }
        
        // Fellow vassals
        if (faction1.parentFactionId && faction1.parentFactionId === faction2.parentFactionId) {
            factors.push(`<li><span class="factor-positive">+10</span> Fellow vassals</li>`);
        }
        
        // Rank difference
        const rankDifference = Math.abs((faction1.rank || 3) - (faction2.rank || 3));
        if (rankDifference > 0) {
            factors.push(`<li><span class="factor-negative">-${rankDifference * 5}</span> Rank difference (${rankDifference} levels)</li>`);
        }
        
        // Add some randomization factor
        factors.push(`<li><span class="factor-neutral">±15</span> Other factors</li>`);
        
        return factors.join('');
    }
    
    /**
     * Update the diplomatic relations matrix
     * @param {Array} factions - List of factions to include in the matrix
     */
    function updateRelationMatrix(factions) {
        const matrixElement = document.getElementById('relation-matrix');
        if (!matrixElement) return;
        
        // Limit to major factions for readability
        const majorFactions = factions.filter(f => f.rank >= 4).slice(0, 8);
        
        if (majorFactions.length === 0) {
            matrixElement.innerHTML = '<div class="empty-list">No major factions discovered yet.</div>';
            return;
        }
        
        let matrixHTML = '<div class="matrix-table">';
        
        // Header row
        matrixHTML += '<div class="matrix-row header-row"><div class="matrix-cell empty-cell"></div>';
        majorFactions.forEach(faction => {
            const factionClass = faction.type.toLowerCase().replace('_', '-');
            matrixHTML += `<div class="matrix-cell header-cell ${factionClass}" data-faction-id="${faction.id}">${faction.name}</div>`;
        });
        matrixHTML += '</div>';
        
        // Data rows
        majorFactions.forEach(faction1 => {
            const rowClass = faction1.type.toLowerCase().replace('_', '-');
            matrixHTML += `<div class="matrix-row"><div class="matrix-cell row-header ${rowClass}" data-faction-id="${faction1.id}">${faction1.name}</div>`;
            
            majorFactions.forEach(faction2 => {
                if (faction1.id === faction2.id) {
                    matrixHTML += '<div class="matrix-cell self-cell">—</div>';
                } else {
                    const relation = FactionIntegration.getRelation(faction1.id, faction2.id);
                    const relationClass = getRelationshipClass(relation);
                    
                    matrixHTML += `
                        <div class="matrix-cell relation-cell relation-${relationClass}" 
                             data-faction1="${faction1.id}" 
                             data-faction2="${faction2.id}"
                             data-relation="${relation}">
                            ${relation}
                        </div>
                    `;
                }
            });
            
            matrixHTML += '</div>';
        });
        
        matrixHTML += '</div>';
        matrixElement.innerHTML = matrixHTML;
        
        // Add event listeners for cells
        matrixElement.querySelectorAll('.relation-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                const faction1Id = this.dataset.faction1;
                const faction2Id = this.dataset.faction2;
                
                if (faction1Id && faction2Id) {
                    // Update relation selectors
                    document.getElementById('relation-faction1').value = faction1Id;
                    document.getElementById('relation-faction2').value = faction2Id;
                    
                    // Show relation
                    showRelation(faction1Id, faction2Id);
                }
            });
        });
    }
    
    /**
     * Update the faction comparison view
     */
    function updateComparisonView() {
        // Update selector dropdown
        updateComparisonSelector();
        
        // Update content
        if (comparisonFactions.length < 2) {
            document.getElementById('comparison-content').innerHTML = `
                <div class="comparison-placeholder">
                    Select at least two realms to compare
                </div>
            `;
            return;
        }
        
        // Get data for all factions
        const factionDataMap = new Map();
        
        comparisonFactions.forEach(factionId => {
            const faction = FactionIntegration.getFactionById(factionId);
            if (faction) {
                const data = getAggregatedKingdomData(factionId);
                data.faction = faction;
                factionDataMap.set(factionId, data);
            }
        });
        
        // Create comparison table
        let comparisonHTML = `
            <div class="comparison-table">
                <div class="comparison-row header-row">
                    <div class="comparison-cell category-header">Category</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell faction-header ${data.faction.type.toLowerCase().replace('_', '-')}">
                            ${data.faction.name}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Type -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Type</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${formatFactionType(data.faction.type)}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Rank -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Rank</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.faction.rank}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Strength -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Military Strength</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.faction.strength}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Population -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Population</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.totalPopulation}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Settlements -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Settlements</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.settlements.length}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Warriors -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Warriors</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.totalWarriors}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Defenses -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Defenses</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.totalDefenses}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Ships -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Ships</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            ${data.totalShips}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Key Resources -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Key Resources</div>
                    ${Array.from(factionDataMap.values()).map(data => {
                        // Get top resources
                        const topResources = Object.entries(data.resources)
                            .filter(([_, value]) => value > 0)
                            .sort(([_, aValue], [__, bValue]) => bValue - aValue)
                            .slice(0, 3);
                        
                        return `
                            <div class="comparison-cell">
                                ${topResources.map(([resource, value]) => 
                                    `<div class="resource-tag">${formatResourceName(resource)}: ${Math.round(value)}</div>`
                                ).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Diplomatic Relations -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Relations</div>
                    ${Array.from(factionDataMap.values()).map((data1, i) => {
                        if (comparisonFactions.length <= 1) {
                            return `<div class="comparison-cell">—</div>`;
                        }
                        
                        // Create relation info for other factions
                        let relationHTML = '<div class="comparison-relations">';
                        
                        Array.from(factionDataMap.values()).forEach((data2, j) => {
                            if (data1.faction.id === data2.faction.id) return;
                            
                            const relation = FactionIntegration.getRelation(data1.faction.id, data2.faction.id);
                            const relationClass = getRelationshipClass(relation);
                            
                            relationHTML += `
                                <div class="relation-to-faction">
                                    <span class="relation-target">${data2.faction.name}: </span>
                                    <span class="relation-value relation-${relationClass}">${relation}</span>
                                </div>
                            `;
                        });
                        
                        relationHTML += '</div>';
                        return `<div class="comparison-cell">${relationHTML}</div>`;
                    }).join('')}
                </div>
                
                <!-- Actions -->
                <div class="comparison-row category-row">
                    <div class="comparison-cell category-name">Actions</div>
                    ${Array.from(factionDataMap.values()).map(data => `
                        <div class="comparison-cell">
                            <button class="btn-view-faction" data-faction-id="${data.faction.id}">View Details</button>
                            <button class="btn-remove-comparison" data-faction-id="${data.faction.id}">Remove</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('comparison-content').innerHTML = comparisonHTML;
        
        // Add event listeners
        document.querySelectorAll('.btn-view-faction').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                selectedTab = 'kingdoms';
                switchTab('kingdoms');
                showKingdomDetail(factionId);
            });
        });
        
        document.querySelectorAll('.btn-remove-comparison').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                removeFactionFromComparison(factionId);
            });
        });
    }
    
    /**
     * Update the comparison selector
     */
    function updateComparisonSelector() {
        const selectedFactionsElement = document.getElementById('comparison-selected-factions');
        const selectorElement = document.getElementById('comparison-add-faction');
        
        if (!selectedFactionsElement || !selectorElement) return;
        
        // Update selected factions display
        if (comparisonFactions.length === 0) {
            selectedFactionsElement.innerHTML = 'No realms selected for comparison';
        } else {
            let factionsHTML = '<div class="selected-factions-list">';
            
            comparisonFactions.forEach(factionId => {
                const faction = FactionIntegration.getFactionById(factionId);
                if (faction) {
                    const factionClass = faction.type.toLowerCase().replace('_', '-');
                    
                    factionsHTML += `
                        <div class="selected-faction ${factionClass}">
                            <div class="faction-name">${faction.name}</div>
                            <button class="btn-remove" data-faction-id="${faction.id}">×</button>
                        </div>
                    `;
                }
            });
            
            factionsHTML += '</div>';
            selectedFactionsElement.innerHTML = factionsHTML;
            
            // Add event listeners for remove buttons
            selectedFactionsElement.querySelectorAll('.btn-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    const factionId = this.dataset.factionId;
                    removeFactionFromComparison(factionId);
                });
            });
        }
        
        // Update selector dropdown
        const factionData = FactionIntegration.getFactionData();
        const kingdoms = factionData.kingdoms || [];
        
        // Clear existing options (keep the first one)
        while (selectorElement.options.length > 1) selectorElement.remove(1);
        
        // Group by faction type
        const factionsByType = {
            'NORSE': [],
            'ANGLO_SAXON': [],
            'FRANKISH': []
        };
        
        kingdoms.forEach(kingdom => {
            if (!comparisonFactions.includes(kingdom.id)) {
                if (factionsByType[kingdom.type]) {
                    factionsByType[kingdom.type].push(kingdom);
                }
            }
        });
        
        // Add option groups by faction type
        for (const type in factionsByType) {
            if (factionsByType[type].length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = formatFactionType(type);
                
                factionsByType[type].forEach(faction => {
                    const option = document.createElement('option');
                    option.value = faction.id;
                    option.textContent = faction.name;
                    optgroup.appendChild(option);
                });
                
                selectorElement.appendChild(optgroup);
            }
        }
    }
    
    /**
     * Add a faction to the comparison
     * @param {string} factionId - ID of the faction to add
     */
    function addFactionToComparison(factionId) {
        // Don't add duplicates
        if (comparisonFactions.includes(factionId)) return;
        
        comparisonFactions.push(factionId);
        updateComparisonView();
    }
    
    /**
     * Remove a faction from the comparison
     * @param {string} factionId - ID of the faction to remove
     */
    function removeFactionFromComparison(factionId) {
        comparisonFactions = comparisonFactions.filter(id => id !== factionId);
        updateComparisonView();
    }
    
    /**
     * Clear all factions from the comparison
     */
    function clearComparison() {
        comparisonFactions = [];
        updateComparisonView();
    }
    
    /**
     * Get aggregated data for a kingdom, including all settlements
     * @param {string} factionId - ID of the faction
     * @returns {Object} - Aggregated data
     */
    function getAggregatedKingdomData(factionId) {
        // Check cache first
        if (kingdomCache[factionId]) {
            return kingdomCache[factionId];
        }
        
        const faction = FactionIntegration.getFactionById(factionId);
        if (!faction) {
            return {
                totalPopulation: 0,
                totalWarriors: 0,
                totalDefenses: 0,
                totalShips: 0,
                settlements: [],
                resources: {}
            };
        }
        
        // Get all settlements with this faction ID
        const allSettlements = WorldMap.getWorldMap().settlements;
        const factionSettlements = allSettlements.filter(s => s.factionId === factionId);
        
        // Get vassals' settlements too
        if (faction.vassalIds && faction.vassalIds.length > 0) {
            faction.vassalIds.forEach(vassalId => {
                const vassalSettlements = allSettlements.filter(s => s.factionId === vassalId);
                factionSettlements.push(...vassalSettlements);
            });
        }
        
        // Calculate totals
        let totalPopulation = 0;
        let totalWarriors = 0;
        let totalDefenses = 0;
        let totalShips = 0;
        
        // Aggregate resources
        const resources = {};
        
        factionSettlements.forEach(settlement => {
            // Add population
            totalPopulation += settlement.population || 0;
            
            // Add military
            if (settlement.military) {
                totalWarriors += settlement.military.warriors || 0;
                totalDefenses += settlement.military.defenses || 0;
                totalShips += settlement.military.ships || 0;
            }
            
            // Add resources
            if (settlement.resources) {
                for (const resource in settlement.resources) {
                    if (!resources[resource]) resources[resource] = 0;
                    resources[resource] += settlement.resources[resource];
                }
            }
        });
        
        // Add territory resources too
        if (faction.territoryIds && faction.territoryIds.length > 0) {
            faction.territoryIds.forEach(territoryId => {
                const territory = FactionIntegration.getTerritoryById(territoryId);
                if (territory && territory.resources) {
                    for (const resource in territory.resources) {
                        if (!resources[resource]) resources[resource] = 0;
                        resources[resource] += territory.resources[resource];
                    }
                }
            });
        }
        
        const data = {
            totalPopulation,
            totalWarriors,
            totalDefenses,
            totalShips,
            settlements: factionSettlements,
            resources
        };
        
        // Cache the result
        kingdomCache[factionId] = data;
        
        return data;
    }
    
    /**
     * Get a descriptor for a relation value
     * @param {number} relation - Relation value
     * @returns {string} - Description of the relationship
     */
    function getRelationshipDescription(relation) {
        if (relation > 75) return "Friendly";
        if (relation > 50) return "Positive";
        if (relation > 25) return "Cordial";
        if (relation > -25) return "Neutral";
        if (relation > -50) return "Wary";
        if (relation > -75) return "Negative";
        return "Hostile";
    }
    
    /**
     * Get a CSS class for a relation value
     * @param {number} relation - Relation value
     * @returns {string} - CSS class
     */
    function getRelationshipClass(relation) {
        if (relation > 75) return "friendly";
        if (relation > 50) return "positive";
        if (relation > 25) return "cordial";
        if (relation > -25) return "neutral";
        if (relation > -50) return "wary";
        if (relation > -75) return "negative";
        return "hostile";
    }
    
    /**
     * Format a faction type for display
     * @param {string} type - Faction type code
     * @returns {string} - Formatted type name
     */
    function formatFactionType(type) {
        switch (type) {
            case 'NORSE': return 'Norse';
            case 'ANGLO_SAXON': return 'Anglo-Saxon';
            case 'FRANKISH': return 'Frankish';
            default: return type;
        }
    }
    
    /**
     * Format a resource name for display
     * @param {string} resource - Resource key
     * @returns {string} - Formatted resource name
     */
    function formatResourceName(resource) {
        // Replace underscores with spaces and capitalize
        return resource.replace('_', ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Add CSS styles for the enhanced factions panel
     */
    function addEnhancedFactionsPanelStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'enhanced-factions-panel-styles';
        styleElement.textContent = `
            /* Enhanced Factions Panel Styles */
            .factions-panel {
                background-color: #f7f0e3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid #e6d8c3;
                height: 100%;
                overflow-y: auto;
                color: #5d4037;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            /* Header styles */
            .factions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .factions-panel h2 {
                color: #5d4037;
                margin: 0;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            
            .factions-panel h3 {
                color: #8b5d33;
                margin-top: 0;
                margin-bottom: 12px;
                font-weight: 600;
            }
            
            .factions-panel h4 {
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 1rem;
                font-weight: 600;
                border-bottom: 1px solid #e6d8c3;
                padding-bottom: 5px;
            }
            
            /* Navigation tabs */
            .factions-navigation {
                display: flex;
                border-bottom: 1px solid #e6d8c3;
                margin-bottom: 20px;
                gap: 5px;
            }
            
            .faction-nav-btn {
                padding: 8px 16px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                color: #8b7355;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
            }
            
            .faction-nav-btn:hover {
                background-color: #f0e6d2;
                color: #5d4037;
            }
            
            .faction-nav-btn.active {
                border-bottom-color: #8b5d33;
                color: #8b5d33;
                font-weight: 500;
            }
            
            /* Content containers */
            .faction-tab {
                display: none;
            }
            
            .faction-tab.active {
                display: block;
            }
            
            .faction-view {
                display: none;
            }
            
            .faction-view.active {
                display: block;
            }
            
            /* Back button */
            .view-controls {
                display: flex;
                align-items: center;
            }
            
            .btn-back {
                padding: 6px 12px;
                background-color: #e6d8c3;
                border: 1px solid #d7cbb9;
                border-radius: 4px;
                color: #5d4037;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
            }
            
            .btn-back:hover {
                background-color: #d7cbb9;
            }
            
            .btn-back.hidden {
                display: none;
            }
            
            /* Kingdom cards grid */
            .kingdom-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .kingdom-card {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                border-left: 4px solid #8b5d33;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .kingdom-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .kingdom-card.norse {
                border-left-color: #b71c1c; /* Viking red */
            }
            
            .kingdom-card.anglo-saxon {
                border-left-color: #1565c0; /* Anglo blue */
            }
            
            .kingdom-card.frankish {
                border-left-color: #6a1b9a; /* Frankish purple */
            }
            
            .kingdom-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #f0e6d2;
            }
            
            .kingdom-name {
                font-weight: 600;
                font-size: 1.1rem;
                color: #5d4037;
            }
            
            .kingdom-type {
                font-size: 0.8rem;
                padding: 2px 6px;
                border-radius: 10px;
                background-color: #f0e6d2;
                color: #8b7355;
            }
            
            .kingdom-card-ruler {
                margin-bottom: 10px;
                color: #8b5d33;
                font-style: italic;
            }
            
            .kingdom-card-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .stat {
                display: flex;
                flex-direction: column;
            }
            
            .stat-label {
                font-size: 0.8rem;
                color: #8b7355;
            }
            
            .stat-value {
                font-weight: 600;
                color: #5d4037;
            }
            
            .kingdom-card-actions {
                text-align: right;
            }
            
            .btn-view-kingdom, .btn-view-faction {
                padding: 6px 12px;
                background-color: #8b5d33;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s;
            }
            
            .btn-view-kingdom:hover, .btn-view-faction:hover {
                background-color: #a97c50;
            }
            
            /* Faction counters */
            .faction-summary {
                margin-bottom: 20px;
            }
            
            .faction-summary-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .faction-counters {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .faction-counter {
                flex: 1;
                background-color: #fff;
                padding: 10px 15px;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                border-left: 4px solid #8b5d33;
            }
            
            .faction-counter.norse {
                border-left-color: #b71c1c; /* Viking red */
            }
            
            .faction-counter.anglo {
                border-left-color: #1565c0; /* Anglo blue */
            }
            
            .faction-counter.frankish {
                border-left-color: #6a1b9a; /* Frankish purple */
            }
            
            .counter-label {
                font-size: 0.9rem;
                color: #8b7355;
                margin-bottom: 5px;
            }
            
            .counter-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #5d4037;
            }
            
            /* Filters */
            .faction-filters, .territory-filters {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .faction-filters select, .territory-filters select {
                padding: 8px;
                border: 1px solid #e6d8c3;
                border-radius: 4px;
                background-color: #fff;
                color: #5d4037;
                min-width: 150px;
            }
            
            /* Kingdom detail view */
            .kingdom-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .kingdom-title {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .kingdom-title h3 {
                margin: 0;
                font-size: 1.4rem;
            }
            
            .kingdom-type-badge {
                padding: 4px 8px;
                border-radius: 10px;
                background-color: #f0e6d2;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .kingdom-type-badge.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .kingdom-type-badge.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .kingdom-type-badge.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .kingdom-content {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 20px;
            }
            
            .kingdom-statistics {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .stat-section {
                margin-bottom: 20px;
            }
            
            .stat-section:last-child {
                margin-bottom: 0;
            }
            
            .stat-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .stat-item {
                margin-bottom: 5px;
            }
            
            .resources-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 15px;
            }
            
            .resource-category {
                margin-bottom: 15px;
            }
            
            .category-name {
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 5px;
                color: #8b5d33;
            }
            
            .category-items {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
            }
            
            .resource-item {
                display: flex;
                justify-content: space-between;
                padding: 3px 6px;
                background-color: #f9f5eb;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .resource-name {
                color: #8b7355;
            }
            
            .resource-value {
                font-weight: 600;
                color: #5d4037;
            }
            
            /* Kingdom detail tabs */
            .kingdom-details-tabs {
                background-color: #fff;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }
            
            .detail-tabs {
                display: flex;
                background-color: #f0e6d2;
                border-bottom: 1px solid #e6d8c3;
            }
            
            .detail-tab {
                padding: 10px 15px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                color: #8b7355;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
            }
            
            .detail-tab.active {
                background-color: #fff;
                border-bottom-color: #8b5d33;
                color: #5d4037;
                font-weight: 500;
            }
            
            .detail-content {
                padding: 15px;
            }
            
            .detail-pane {
                display: none;
            }
            
            .detail-pane.active {
                display: block;
            }
            
            /* Settlement list */
            .settlement-list, .vassals-list {
                max-height: 500px;
                overflow-y: auto;
            }
            
            .settlement-item {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background-color: #f9f5eb;
                border-radius: 6px;
                margin-bottom: 10px;
            }
            
            .settlement-item.capital {
                border-left: 4px solid gold;
                background-color: #fffbeb;
            }
            
            .settlement-info {
                flex: 1;
            }
            
            .settlement-name {
                font-weight: 600;
                color: #5d4037;
                margin-bottom: 3px;
            }
            
            .settlement-type {
                font-size: 0.8rem;
                color: #8b7355;
            }
            
            .settlement-stats {
                display: flex;
                gap: 15px;
            }
            
            .capital-badge {
                font-size: 0.7rem;
                padding: 2px 5px;
                background-color: #fff9c4;
                color: #ffa000;
                border-radius: 10px;
                margin-left: 5px;
                vertical-align: middle;
            }
            
            /* Vassal items */
            .vassal-item {
                display: flex;
                justify-content: space-between;
                padding: 15px;
                background-color: #f9f5eb;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid #8b5d33;
            }
            
            .vassal-info {
                flex: 1;
            }
            
            .vassal-name {
                font-weight: 600;
                color: #5d4037;
                margin-bottom: 3px;
            }
            
            .vassal-ruler {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .vassal-stats {
                display: flex;
                gap: 15px;
            }
            
            /* Relation classes */
            .relation-friendly {
                background-color: #e8f5e9;
                border-left-color: #2e7d32; /* Green */
                color: #2e7d32;
            }
            
            .relation-positive {
                background-color: #f1f8e9;
                border-left-color: #689f38; /* Light green */
                color: #689f38;
            }
            
            .relation-cordial {
                background-color: #f9fbe7;
                border-left-color: #afb42b; /* Yellow-green */
                color: #afb42b;
            }
            
            .relation-neutral {
                background-color: #f0e6d2;
                border-left-color: #8b7355; /* Brown */
                color: #8b7355;
            }
            
            .relation-wary {
                background-color: #fff8e1;
                border-left-color: #ff8f00; /* Amber */
                color: #ff8f00;
            }
            
            .relation-negative {
                background-color: #fff3e0;
                border-left-color: #f57c00; /* Orange */
                color: #f57c00;
            }
            
            .relation-hostile {
                background-color: #ffebee;
                border-left-color: #c62828; /* Red */
                color: #c62828;
            }
            
            /* Ruler card */
            .ruler-card {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .ruler-header {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .ruler-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #e6d8c3;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.8rem;
                color: #8b5d33;
            }
            
            .ruler-avatar.male::after {
                content: '♂';
            }
            
            .ruler-avatar.female::after {
                content: '♀';
                color: #c62828;
            }
            
            .ruler-title-name {
                display: flex;
                flex-direction: column;
            }
            
            .ruler-title {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .ruler-name {
                font-size: 1.2rem;
                font-weight: 600;
                color: #5d4037;
            }
            
            .ruler-stats {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
            }
            
            .ruler-traits {
                margin-top: 10px;
            }
            
            .traits-label {
                font-weight: 600;
                margin-bottom: 5px;
                color: #8b5d33;
            }
            
            .traits-list {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .trait-badge {
                padding: 3px 8px;
                background-color: #f0e6d2;
                border-radius: 10px;
                font-size: 0.8rem;
                color: #8b5d33;
            }
            
            /* Territories grid */
            .territories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 15px;
            }
            
            .territory-card {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                border-left: 4px solid #8b5d33;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .territory-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .territory-card.norse {
                border-left-color: #b71c1c;
            }
            
            .territory-card.anglo-saxon {
                border-left-color: #1565c0;
            }
            
            .territory-card.frankish {
                border-left-color: #6a1b9a;
            }
            
            .territory-card-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .territory-name {
                font-weight: 600;
                font-size: 1.1rem;
                color: #5d4037;
            }
            
            .territory-faction {
                font-size: 0.8rem;
                color: #8b7355;
            }
            
            .territory-card-region {
                margin-bottom: 10px;
                color: #8b5d33;
                font-style: italic;
            }
            
            .territory-card-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .territory-card-resources {
                margin-bottom: 15px;
            }
            
            .resource-header {
                font-size: 0.9rem;
                font-weight: 600;
                margin-bottom: 5px;
                color: #8b5d33;
            }
            
            .resource-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .resource-tag {
                padding: 3px 6px;
                background-color: #f0e6d2;
                border-radius: 10px;
                font-size: 0.8rem;
                color: #5d4037;
                white-space: nowrap;
            }
            
            /* Territory detail view */
            .territory-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .territory-header h3 {
                margin: 0;
                font-size: 1.4rem;
            }
            
            .territory-faction-badge {
                padding: 4px 10px;
                border-radius: 10px;
                background-color: #f0e6d2;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .territory-faction-badge.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .territory-faction-badge.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .territory-faction-badge.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .territory-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .territory-stats {
                grid-column: span 2;
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .territory-resources, .territory-settlements {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            /* Relations view */
            .relations-selector {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .relation-form {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .form-group select {
                width: 100%;
                padding: 8px;
                border: 1px solid #e6d8c3;
                border-radius: 4px;
                color: #5d4037;
            }
            
            .form-actions {
                text-align: right;
            }
            
            .btn-action {
                padding: 6px 12px;
                background-color: #8b5d33;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .btn-action:hover {
                background-color: #a97c50;
            }
            
            .relation-display {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                min-height: 150px;
            }
            
            .relation-placeholder {
                color: #8b7355;
                font-style: italic;
                text-align: center;
                padding: 30px 0;
            }
            
            .relation-result {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .relation-factions {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
            
            .relation-faction {
                padding: 10px 15px;
                border-radius: 6px;
                font-weight: 500;
                text-align: center;
                min-width: 120px;
            }
            
            .relation-faction.faction-norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .relation-faction.faction-anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .relation-faction.faction-frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .relation-arrow {
                font-size: 1.8rem;
            }
            
            .relation-status {
                text-align: center;
                padding: 10px 15px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .vassalage-info {
                text-align: center;
                font-style: italic;
                padding: 5px 10px;
                background-color: #f0e6d2;
                border-radius: 6px;
                color: #8b5d33;
            }
            
            .relation-factors {
                padding: 10px 15px;
                background-color: #f9f5eb;
                border-radius: 6px;
            }
            
            .relation-factors h4 {
                border-bottom: none;
                margin-bottom: 5px;
            }
            
            .relation-factors-list {
                padding-left: 20px;
                margin: 0;
            }
            
            .factor-positive {
                color: #2e7d32;
                font-weight: 500;
            }
            
            .factor-negative {
                color: #c62828;
                font-weight: 500;
            }
            
            .factor-neutral {
                color: #8b7355;
            }
            
            .relation-actions {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 10px;
            }
            
            /* Relation matrix */
            .diplomatic-matrix {
                margin-top: 30px;
            }
            
            .matrix-table {
                display: table;
                border-collapse: separate;
                border-spacing: 2px;
                width: 100%;
            }
            
            .matrix-row {
                display: table-row;
            }
            
            .matrix-cell {
                display: table-cell;
                padding: 8px;
                text-align: center;
                font-size: 0.9rem;
                background-color: #f9f5eb;
                border-radius: 4px;
            }
            
            .empty-cell {
                background-color: transparent;
            }
            
            .header-cell, .row-header {
                font-weight: 600;
                background-color: #f0e6d2;
                color: #5d4037;
            }
            
            .header-cell.norse, .row-header.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .header-cell.anglo-saxon, .row-header.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .header-cell.frankish, .row-header.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .self-cell {
                background-color: #e0e0e0;
                color: #757575;
            }
            
            .relation-cell {
                cursor: pointer;
                transition: transform 0.1s;
            }
            
            .relation-cell:hover {
                transform: scale(1.05);
                font-weight: 600;
            }
            
            /* Comparison view */
            .comparison-selector {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .selected-factions {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                min-height: 50px;
                color: #8b7355;
                font-style: italic;
            }
            
            .selected-factions-list {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .selected-faction {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                background-color: #f0e6d2;
                border-radius: 15px;
                font-size: 0.9rem;
            }
            
            .selected-faction.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .selected-faction.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .selected-faction.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .btn-remove {
                width: 18px;
                height: 18px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: rgba(0, 0, 0, 0.1);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                color: inherit;
                font-size: 0.8rem;
                line-height: 1;
                transition: background 0.2s;
            }
            
            .btn-remove:hover {
                background-color: rgba(0, 0, 0, 0.2);
            }
            
            .add-to-comparison {
                display: flex;
                gap: 10px;
            }
            
            .add-to-comparison select {
                flex: 1;
                padding: 8px;
                border: 1px solid #e6d8c3;
                border-radius: 4px;
                color: #5d4037;
            }
            
            .comparison-content {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .comparison-placeholder {
                color: #8b7355;
                font-style: italic;
                text-align: center;
                padding: 30px 0;
            }
            
            .comparison-table {
                display: table;
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                overflow-x: auto;
            }
            
            .comparison-row {
                display: table-row;
            }
            
            .comparison-row.header-row {
                background-color: #f0e6d2;
            }
            
            .comparison-row.category-row:nth-child(even) {
                background-color: #f9f5eb;
            }
            
            .comparison-cell {
                display: table-cell;
                padding: 10px;
                text-align: center;
                border-bottom: 1px solid #e6d8c3;
            }
            
            .category-header, .category-name {
                text-align: left;
                font-weight: 600;
                color: #5d4037;
            }
            
            .faction-header {
                font-weight: 600;
                color: #5d4037;
                padding: 12px;
            }
            
            .faction-header.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .faction-header.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .faction-header.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .comparison-relations {
                display: flex;
                flex-direction: column;
                gap: 5px;
                font-size: 0.9rem;
            }
            
            /* Ruler detail view */
            .ruler-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .ruler-header h3 {
                margin: 0;
                font-size: 1.4rem;
            }
            
            .ruler-faction-badge {
                padding: 4px 10px;
                border-radius: 10px;
                background-color: #f0e6d2;
                color: #8b7355;
                font-size: 0.9rem;
            }
            
            .ruler-faction-badge.norse {
                background-color: #ffebee;
                color: #b71c1c;
            }
            
            .ruler-faction-badge.anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
            }
            
            .ruler-faction-badge.frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
            }
            
            .ruler-detail-card {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 20px;
            }
            
            .ruler-portrait {
                text-align: center;
            }
            
            .ruler-avatar-large {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background-color: #e6d8c3;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 3.5rem;
                color: #8b5d33;
                margin-bottom: 10px;
            }
            
            .ruler-avatar-large.male::after {
                content: '♂';
            }
            
            .ruler-avatar-large.female::after {
                content: '♀';
                color: #c62828;
            }
            
            .ruler-detail-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .ruler-traits-section {
                grid-column: span 2;
                background-color: #f9f5eb;
                border-radius: 6px;
                padding: 15px;
            }
            
            .traits-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            
            .realm-section {
                background-color: #f9f5eb;
                border-radius: 6px;
                padding: 15px;
            }
            
            .realm-info {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .realm-name {
                font-weight: 600;
                color: #5d4037;
                font-size: 1.1rem;
            }
            
            .realm-type {
                color: #8b7355;
                margin-bottom: 10px;
            }
            
            /* Local politics section */
            .local-politics {
                margin-top: 20px;
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .region-info-container {
                margin-bottom: 15px;
            }
            
            .region-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .region-name {
                font-weight: 600;
                font-size: 1.1rem;
                color: #5d4037;
            }
            
            .region-type {
                font-size: 0.9rem;
                color: #8b7355;
            }
            
            .region-settlements {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
            }
            
            .region-factions-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .region-faction {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background-color: #f9f5eb;
                border-radius: 6px;
                border-left: 4px solid #8b5d33;
            }
            
            .region-faction.norse {
                border-left-color: #b71c1c;
            }
            
            .region-faction.anglo-saxon {
                border-left-color: #1565c0;
            }
            
            .region-faction.frankish {
                border-left-color: #6a1b9a;
            }
            
            .faction-info {
                flex: 1;
            }
            
            .faction-stats {
                display: flex;
                gap: 10px;
                margin-right: 10px;
            }
            
            /* Empty states */
            .empty-list {
                padding: 20px;
                text-align: center;
                color: #8b7355;
                font-style: italic;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .faction-counters {
                    flex-direction: column;
                }
                
                .kingdom-content,
                .territory-content,
                .relations-selector,
                .ruler-detail-card,
                .ruler-detail-stats {
                    grid-template-columns: 1fr;
                }
                
                .kingdom-grid,
                .territories-grid {
                    grid-template-columns: 1fr;
                }
                
                .settlement-item,
                .vassal-item {
                    flex-direction: column;
                }
                
                .settlement-stats,
                .vassal-stats {
                    margin-top: 10px;
                }
                
                .relation-factions {
                    flex-direction: column;
                }
                
                .relation-arrow {
                    transform: rotate(90deg);
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Public API
    return {
        /**
         * Initialize the factions panel
         */
        init: function() {
            console.log("Initializing Enhanced Factions Panel...");
            
            // Create panel
            createFactionsPanel();
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                // Register the politics tab
                NavigationSystem.tabs = NavigationSystem.tabs || {};
                
                // Add politics tab definition to NavigationSystem
                NavigationSystem.tabs.politics = {
                    id: 'politics-tab',
                    title: 'Politics',
                    icon: '👑',
                    panels: ['factions-panel'],
                    isDefault: false
                };
                
                // Add the politics tab to navigation
                const navContainer = document.getElementById('game-navigation');
                if (navContainer) {
                    const politicsTab = document.createElement('div');
                    politicsTab.className = 'nav-tab';
                    politicsTab.dataset.tab = 'politics';
                    politicsTab.id = 'politics-tab';
                    politicsTab.innerHTML = `
                        <span class="tab-icon">👑</span>
                        <span class="tab-text">Politics</span>
                    `;
                    
                    navContainer.appendChild(politicsTab);
                    
                    // Add event listener to the new tab
                    politicsTab.addEventListener('click', function() {
                        if (typeof NavigationSystem.switchTab === 'function') {
                            NavigationSystem.switchTab('politics');
                        }
                    });
                }
            }
            
            console.log("Enhanced Factions Panel initialized");
        },
        
        /**
         * Update panel content
         */
        update: function() {
            // Update content based on current tab
            switch(selectedTab) {
                case 'kingdoms':
                    if (selectedFactionId) {
                        showKingdomDetail(selectedFactionId);
                    } else if (selectedRulerId) {
                        showRulerDetail(selectedRulerId);
                    } else {
                        updateKingdomsList();
                    }
                    break;
                case 'territories':
                    if (selectedTerritoryId) {
                        showTerritoryDetail(selectedTerritoryId);
                    } else {
                        updateTerritoriesList();
                    }
                    break;
                case 'relations':
                    updateRelationsView();
                    break;
                case 'comparison':
                    updateComparisonView();
                    break;
            }
        },
        
        /**
         * Reset the panel to overview state
         */
        resetView: function() {
            // Clear selected IDs
            selectedFactionId = null;
            selectedRulerId = null;
            selectedTerritoryId = null;
            
            // Switch to kingdoms tab
            selectedTab = 'kingdoms';
            switchTab('kingdoms');
        },
        
        /**
         * Add a faction to the comparison
         * @param {string} factionId - ID of the faction to add
         */
        addToComparison: function(factionId) {
            addFactionToComparison(factionId);
            switchTab('comparison');
        },
        
        /**
         * Get the current view state
         * @returns {Object} - Current view state
         */
        getViewState: function() {
            return {
                tab: selectedTab,
                factionId: selectedFactionId,
                rulerId: selectedRulerId,
                territoryId: selectedTerritoryId,
                comparisonFactions: [...comparisonFactions]
            };
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the faction integration to be initialized
    const waitForFactionIntegration = setInterval(function() {
        if (typeof FactionIntegration !== 'undefined' && 
            typeof FactionIntegration.getFactionData === 'function' &&
            FactionIntegration.getFactionData().factions.length > 0) {
            
            clearInterval(waitForFactionIntegration);
            
            // Initialize the enhanced factions panel
            FactionsPanel.init();
        }
    }, 500);
});