/**
 * Viking Legacy - Factions Panel
 * UI for exploring kingdoms, territories, rulers and diplomatic relations
 */

const FactionsPanel = (function() {
    // Track state
    let currentView = 'overview'; // 'overview', 'kingdom', 'ruler', 'territory', 'relations'
    let selectedFactionId = null;
    let selectedRulerId = null;
    let selectedTerritoryId = null;
    
    // Create the factions panel
    function createFactionsPanel() {
        console.log("Creating factions panel...");
        
        // Check if panel already exists
        if (document.getElementById('factions-panel')) {
            console.log("Factions panel already exists, skipping creation");
            return;
        }
        
        // Create panel container
        const factionsPanel = document.createElement('div');
        factionsPanel.id = 'factions-panel';
        factionsPanel.className = 'factions-panel hidden-panel'; // Start hidden
        
        // Add panel content
        factionsPanel.innerHTML = `
            <h2>Political Landscape</h2>
            
            <div class="factions-navigation">
                <button id="btn-factions-overview" class="factions-nav-btn active">Overview</button>
                <button id="btn-factions-kingdoms" class="factions-nav-btn">Kingdoms</button>
                <button id="btn-factions-territories" class="factions-nav-btn">Territories</button>
                <button id="btn-factions-relations" class="factions-nav-btn">Diplomacy</button>
            </div>
            
            <div class="factions-content">
                <div id="factions-overview" class="faction-view active">
                    <h3>Known Realms</h3>
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
                    
                    <div class="faction-list-container">
                        <h4>Major Kingdoms</h4>
                        <div id="kingdoms-list" class="faction-list">Loading kingdoms...</div>
                    </div>
                    
                    <div class="region-politics-info">
                        <h4>Your Region's Politics</h4>
                        <div id="player-region-politics">Loading local political information...</div>
                    </div>
                </div>
                
                <div id="factions-kingdom-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-kingdom" class="btn-back">← Back</button>
                        <h3 id="kingdom-detail-name">Kingdom Name</h3>
                    </div>
                    <div class="kingdom-info-container">
                        <div class="kingdom-ruler-info">
                            <h4>Ruler</h4>
                            <div id="kingdom-ruler-details">Loading ruler details...</div>
                        </div>
                        <div class="kingdom-stats">
                            <h4>Kingdom Statistics</h4>
                            <div id="kingdom-stats-details">Loading kingdom statistics...</div>
                        </div>
                        <div class="kingdom-vassals">
                            <h4>Vassals</h4>
                            <div id="kingdom-vassals-list">Loading vassals...</div>
                        </div>
                    </div>
                </div>
                
                <div id="factions-ruler-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-ruler" class="btn-back">← Back</button>
                        <h3 id="ruler-detail-name">Ruler Name</h3>
                    </div>
                    <div id="ruler-details">Loading ruler information...</div>
                </div>
                
                <div id="factions-territories" class="faction-view">
                    <h3>Territories</h3>
                    <div class="territory-filters">
                        <select id="territory-faction-filter">
                            <option value="all">All Factions</option>
                            <option value="NORSE">Norse</option>
                            <option value="ANGLO_SAXON">Anglo-Saxon</option>
                            <option value="FRANKISH">Frankish</option>
                        </select>
                    </div>
                    <div id="territories-list" class="territories-list">
                        Loading territories...
                    </div>
                </div>
                
                <div id="factions-territory-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-territory" class="btn-back">← Back</button>
                        <h3 id="territory-detail-name">Territory Name</h3>
                    </div>
                    <div id="territory-details">Loading territory information...</div>
                </div>
                
                <div id="factions-relations" class="faction-view">
                    <h3>Diplomatic Relations</h3>
                    <div class="relations-container">
                        <div class="relations-selector">
                            <label for="relation-faction1">View relations between:</label>
                            <select id="relation-faction1">
                                <option value="">Select First Faction</option>
                            </select>
                            <select id="relation-faction2">
                                <option value="">Select Second Faction</option>
                            </select>
                            <button id="btn-view-relation">View</button>
                        </div>
                        <div id="relation-display" class="relation-display">
                            Select two factions to view their relationship
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
                console.log("Factions panel registered with navigation system");
            }
            
            // Add event listeners
            setupEventListeners();
        }
        
        // Add CSS styles
        addFactionsPanelStyles();
    }
    
    // Setup event listeners for UI interactions
    function setupEventListeners() {
        // Navigation buttons
        document.getElementById('btn-factions-overview').addEventListener('click', () => {
            switchView('overview');
            updateOverview();
        });
        
        document.getElementById('btn-factions-kingdoms').addEventListener('click', () => {
            switchView('kingdoms');
            updateKingdomsList();
        });
        
        document.getElementById('btn-factions-territories').addEventListener('click', () => {
            switchView('territories');
            updateTerritoriesList();
        });
        
        document.getElementById('btn-factions-relations').addEventListener('click', () => {
            switchView('relations');
            updateRelationsView();
        });
        
        // Back buttons
        document.getElementById('btn-back-from-kingdom').addEventListener('click', () => {
            switchView('overview');
        });
        
        document.getElementById('btn-back-from-ruler').addEventListener('click', () => {
            // If we came from kingdom detail, go back there
            if (selectedFactionId) {
                switchView('kingdom');
                showKingdomDetail(selectedFactionId);
            } else {
                switchView('overview');
            }
        });
        
        document.getElementById('btn-back-from-territory').addEventListener('click', () => {
            switchView('territories');
        });
        
        // Territory filter
        document.getElementById('territory-faction-filter').addEventListener('change', function() {
            updateTerritoriesList(this.value);
        });
        
        // Relations selector
        document.getElementById('btn-view-relation').addEventListener('click', () => {
            const faction1 = document.getElementById('relation-faction1').value;
            const faction2 = document.getElementById('relation-faction2').value;
            
            if (faction1 && faction2) {
                showRelation(faction1, faction2);
            }
        });
    }
    
    // Switch between different views
    function switchView(view) {
        console.log(`Switching to view: ${view}`);
        
        // Update currentView state
        currentView = view;
        
        // Remove active class from all view containers
        document.querySelectorAll('.faction-view').forEach(el => {
            el.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.factions-nav-btn').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active class to selected view and button
        switch(view) {
            case 'overview':
                const overviewEl = document.getElementById('factions-overview');
                if (overviewEl) overviewEl.classList.add('active');
                
                const overviewBtn = document.getElementById('btn-factions-overview');
                if (overviewBtn) overviewBtn.classList.add('active');
                
                // Update overview content
                updateOverview();
                break;
                
            case 'kingdoms':
                const kingdomsEl = document.getElementById('factions-kingdoms');
                if (kingdomsEl) kingdomsEl.classList.add('active');
                
                const kingdomsBtn = document.getElementById('btn-factions-kingdoms');
                if (kingdomsBtn) kingdomsBtn.classList.add('active');
                
                // Update kingdoms list
                updateKingdomsList();
                break;
                
            case 'kingdom':
                const kingdomDetailEl = document.getElementById('factions-kingdom-detail');
                if (kingdomDetailEl) kingdomDetailEl.classList.add('active');
                
                const kingdomsListBtn = document.getElementById('btn-factions-kingdoms');
                if (kingdomsListBtn) kingdomsListBtn.classList.add('active');
                break;
                
            case 'ruler':
                const rulerDetailEl = document.getElementById('factions-ruler-detail');
                if (rulerDetailEl) rulerDetailEl.classList.add('active');
                break;
                
            case 'territories':
                const territoriesEl = document.getElementById('factions-territories');
                if (territoriesEl) territoriesEl.classList.add('active');
                
                const territoriesBtn = document.getElementById('btn-factions-territories');
                if (territoriesBtn) territoriesBtn.classList.add('active');
                
                // Update territories list
                updateTerritoriesList();
                break;
                
            case 'territory':
                const territoryDetailEl = document.getElementById('factions-territory-detail');
                if (territoryDetailEl) territoryDetailEl.classList.add('active');
                
                const territoriesListBtn = document.getElementById('btn-factions-territories');
                if (territoriesListBtn) territoriesListBtn.classList.add('active');
                break;
                
            case 'relations':
                const relationsEl = document.getElementById('factions-relations');
                if (relationsEl) relationsEl.classList.add('active');
                
                const relationsBtn = document.getElementById('btn-factions-relations');
                if (relationsBtn) relationsBtn.classList.add('active');
                
                // Update relations view
                updateRelationsView();
                break;
        }
        
        console.log(`Switched to view: ${view}`);
    }


    
    // Update the overview page with faction counts and major kingdoms
    function updateOverview() {
        console.log("Updating factions overview...");
        
        const factionData = FactionIntegration.getFactionData();
        
        // Get the overview element
        const overviewElement = document.getElementById('factions-overview');
        if (!overviewElement) {
            console.error("Could not find factions-overview element");
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
        
        // Create HTML for the overview
        let overviewHTML = `
            <h3>Known Realms</h3>
            <div class="faction-counters">
                <div class="faction-counter norse">
                    <div class="counter-label">Norse Kingdoms:</div>
                    <div id="norse-kingdom-count" class="counter-value">${norseCount}</div>
                </div>
                <div class="faction-counter anglo">
                    <div class="counter-label">Anglo Kingdoms:</div>
                    <div id="anglo-kingdom-count" class="counter-value">${angloCount}</div>
                </div>
                <div class="faction-counter frankish">
                    <div class="counter-label">Frankish Kingdoms:</div>
                    <div id="frankish-kingdom-count" class="counter-value">${frankishCount}</div>
                </div>
            </div>
            
            <div class="faction-list-container">
                <h4>Major Kingdoms</h4>
                <div id="kingdoms-list" class="faction-list">
        `;
        
        // Add kingdoms list
        if (factionData.kingdoms && factionData.kingdoms.length > 0) {
            factionData.kingdoms.forEach(kingdom => {
                const ruler = FactionIntegration.getRulerById(kingdom.rulerId);
                const factionClass = kingdom.type.toLowerCase().replace('_', '-');
                
                overviewHTML += `
                    <div class="faction-item ${factionClass}" data-faction-id="${kingdom.id}">
                        <div class="faction-name">${kingdom.name}</div>
                        <div class="faction-ruler">${ruler ? ruler.title + ' ' + ruler.name : 'Unknown'}</div>
                        <div class="faction-strength">Strength: ${kingdom.strength}</div>
                        <button class="btn-view-faction" data-faction-id="${kingdom.id}">View Details</button>
                    </div>
                `;
            });
        } else {
            overviewHTML += '<p>No kingdoms discovered yet.</p>';
        }
        
        overviewHTML += `
                </div>
            </div>
            
            <div class="region-politics-info">
                <h4>Your Region's Politics</h4>
                <div id="player-region-politics">
        `;
        
        // Add player region politics
        const playerRegion = WorldMap.getPlayerRegion();
        
        if (!playerRegion) {
            overviewHTML += '<p>No region information available.</p>';
        } else {
            // Get settlements in the player's region
            const settlements = WorldMap.getSettlementsByRegion(playerRegion.id);
            if (!settlements || settlements.length === 0) {
                overviewHTML += '<p>No known settlements in your region.</p>';
            } else {
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
                
                overviewHTML += `
                    <div class="region-name">${playerRegion.name}</div>
                    <div class="region-settlements-count">${settlements.length} settlements</div>
                    <div class="region-factions-list">
                `;
                
                if (factionsInRegion.size === 0) {
                    overviewHTML += '<p>No known factions in this region.</p>';
                } else {
                    overviewHTML += '<h5>Factions in Region:</h5>';
                    
                    factionsInRegion.forEach(faction => {
                        const factionClass = faction.type.toLowerCase().replace('_', '-');
                        overviewHTML += `
                            <div class="region-faction ${factionClass}">
                                <div class="faction-name">${faction.name}</div>
                                <button class="btn-view-faction" data-faction-id="${faction.id}">View</button>
                            </div>
                        `;
                    });
                }
                
                overviewHTML += '</div>';
            }
        }
        
        overviewHTML += `
                </div>
            </div>
        `;
        
        // Update the overview element
        overviewElement.innerHTML = overviewHTML;
        
        // Add event listeners to view buttons
        const viewButtons = overviewElement.querySelectorAll('.btn-view-faction');
        if (viewButtons && viewButtons.length > 0) {
            viewButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const factionId = this.dataset.factionId;
                    showKingdomDetail(factionId);
                });
            });
        }
        
        console.log("Finished updating factions overview");
    }

    function recreatePanelStructure() {
        console.log("Recreating factions panel structure...");
        
        // Get the factions panel
        const factionsPanel = document.getElementById('factions-panel');
        
        if (!factionsPanel) {
            console.error("Could not find factions-panel element");
            return;
        }
        
        // Create the basic panel structure
        factionsPanel.innerHTML = `
            <h2>Political Landscape</h2>
            
            <div class="factions-navigation">
                <button id="btn-factions-overview" class="factions-nav-btn active">Overview</button>
                <button id="btn-factions-kingdoms" class="factions-nav-btn">Kingdoms</button>
                <button id="btn-factions-territories" class="factions-nav-btn">Territories</button>
                <button id="btn-factions-relations" class="factions-nav-btn">Diplomacy</button>
            </div>
            
            <div class="factions-content">
                <div id="factions-overview" class="faction-view active">
                    <!-- Overview content will be populated by updateOverview() -->
                </div>
                
                <div id="factions-kingdom-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-kingdom" class="btn-back">← Back</button>
                        <h3 id="kingdom-detail-name">Kingdom Name</h3>
                    </div>
                    <div class="kingdom-info-container">
                        <div class="kingdom-ruler-info">
                            <h4>Ruler</h4>
                            <div id="kingdom-ruler-details">Loading ruler details...</div>
                        </div>
                        <div class="kingdom-stats">
                            <h4>Kingdom Statistics</h4>
                            <div id="kingdom-stats-details">Loading kingdom statistics...</div>
                        </div>
                        <div class="kingdom-vassals">
                            <h4>Vassals</h4>
                            <div id="kingdom-vassals-list">Loading vassals...</div>
                        </div>
                    </div>
                </div>
                
                <div id="factions-ruler-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-ruler" class="btn-back">← Back</button>
                        <h3 id="ruler-detail-name">Ruler Name</h3>
                    </div>
                    <div id="ruler-details">Loading ruler information...</div>
                </div>
                
                <div id="factions-territories" class="faction-view">
                    <h3>Territories</h3>
                    <div class="territory-filters">
                        <select id="territory-faction-filter">
                            <option value="all">All Factions</option>
                            <option value="NORSE">Norse</option>
                            <option value="ANGLO_SAXON">Anglo-Saxon</option>
                            <option value="FRANKISH">Frankish</option>
                        </select>
                    </div>
                    <div id="territories-list" class="territories-list">
                        Loading territories...
                    </div>
                </div>
                
                <div id="factions-territory-detail" class="faction-view">
                    <div class="detail-header">
                        <button id="btn-back-from-territory" class="btn-back">← Back</button>
                        <h3 id="territory-detail-name">Territory Name</h3>
                    </div>
                    <div id="territory-details">Loading territory information...</div>
                </div>
                
                <div id="factions-relations" class="faction-view">
                    <h3>Diplomatic Relations</h3>
                    <div class="relations-container">
                        <div class="relations-selector">
                            <label for="relation-faction1">View relations between:</label>
                            <select id="relation-faction1">
                                <option value="">Select First Faction</option>
                            </select>
                            <select id="relation-faction2">
                                <option value="">Select Second Faction</option>
                            </select>
                            <button id="btn-view-relation">View</button>
                        </div>
                        <div id="relation-display" class="relation-display">
                            Select two factions to view their relationship
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Set up event listeners for the new elements
        setupEventListeners();
        
        // Update the overview content
        updateOverview();
        
        console.log("Factions panel structure recreated successfully");
    }
    
    // Update the player's region political information
    function updatePlayerRegionPolitics() {
        const playerRegionPoliticsDiv = document.getElementById('player-region-politics');
        
        // Add null check to prevent errors
        if (!playerRegionPoliticsDiv) {
            console.log("player-region-politics element not found, skipping update");
            return;
        }
        
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
            <div class="region-name">${playerRegion.name}</div>
            <div class="region-settlements-count">${settlements.length} settlements</div>
            <div class="region-factions-list">
        `;
        
        if (factionsInRegion.size === 0) {
            regionHTML += '<p>No known factions in this region.</p>';
        } else {
            regionHTML += '<h5>Factions in Region:</h5>';
            
            factionsInRegion.forEach(faction => {
                const factionClass = faction.type.toLowerCase().replace('_', '-');
                regionHTML += `
                    <div class="region-faction ${factionClass}">
                        <div class="faction-name">${faction.name}</div>
                        <button class="btn-view-faction" data-faction-id="${faction.id}">View</button>
                    </div>
                `;
            });
        }
        
        regionHTML += '</div>';
        playerRegionPoliticsDiv.innerHTML = regionHTML;
        
        // Add event listeners
        const viewButtons = playerRegionPoliticsDiv.querySelectorAll('.btn-view-faction');
        if (viewButtons && viewButtons.length > 0) {
            viewButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const factionId = this.dataset.factionId;
                    showKingdomDetail(factionId);
                });
            });
        }
    }
    
    // Show detailed information about a kingdom
    function showKingdomDetail(factionId) {
        selectedFactionId = factionId;
        const faction = FactionIntegration.getFactionById(factionId);
        
        if (!faction) {
            console.error(`Faction not found: ${factionId}`);
            return;
        }
        
        // Switch to kingdom view
        switchView('kingdom');
        
        // Update kingdom name
        document.getElementById('kingdom-detail-name').textContent = faction.name;
        
        // Update ruler details
        const rulerDetailsDiv = document.getElementById('kingdom-ruler-details');
        const ruler = FactionIntegration.getRulerById(faction.rulerId);
        
        if (ruler) {
            const traitsHTML = ruler.traits.map(trait => `<span class="ruler-trait">${trait}</span>`).join('');
            
            rulerDetailsDiv.innerHTML = `
                <div class="ruler-detail-card">
                    <div class="ruler-name-title">
                        <span class="ruler-title">${ruler.title}</span>
                        <span class="ruler-name">${ruler.name}</span>
                    </div>
                    <div class="ruler-age-gender">
                        ${ruler.age} years old, ${ruler.gender}
                    </div>
                    <div class="ruler-traits">
                        ${traitsHTML}
                    </div>
                    <button class="btn-view-ruler" data-ruler-id="${ruler.id}">View Ruler</button>
                </div>
            `;
            
            // Add event listener for ruler detail button
            rulerDetailsDiv.querySelector('.btn-view-ruler').addEventListener('click', function() {
                const rulerId = this.dataset.rulerId;
                showRulerDetail(rulerId);
            });
        } else {
            rulerDetailsDiv.innerHTML = '<p>No ruler information available.</p>';
        }
        
        // Update kingdom stats
        const statsDiv = document.getElementById('kingdom-stats-details');
        const territories = FactionIntegration.getTerritoriesByFactionId(factionId);
        
        // Get settlements for this faction
        const factionSettlements = WorldMap.getWorldMap().settlements.filter(s => s.factionId === factionId);
        
        // Calculate total population and military
        let totalPopulation = 0;
        let totalWarriors = 0;
        let totalDefenses = 0;
        
        factionSettlements.forEach(settlement => {
            totalPopulation += settlement.population || 0;
            totalWarriors += settlement.military?.warriors || 0;
            totalDefenses += settlement.military?.defenses || 0;
        });
        
        statsDiv.innerHTML = `
            <div class="kingdom-stat">
                <div class="stat-label">Territories:</div>
                <div class="stat-value">${territories.length}</div>
            </div>
            <div class="kingdom-stat">
                <div class="stat-label">Settlements:</div>
                <div class="stat-value">${factionSettlements.length}</div>
            </div>
            <div class="kingdom-stat">
                <div class="stat-label">Population:</div>
                <div class="stat-value">${totalPopulation}</div>
            </div>
            <div class="kingdom-stat">
                <div class="stat-label">Military Strength:</div>
                <div class="stat-value">${faction.strength}</div>
            </div>
            <div class="kingdom-stat">
                <div class="stat-label">Warriors:</div>
                <div class="stat-value">${totalWarriors}</div>
            </div>
            <div class="kingdom-stat">
                <div class="stat-label">Defenses:</div>
                <div class="stat-value">${totalDefenses}</div>
            </div>
        `;
        
        // Update vassals list
        const vassalsDiv = document.getElementById('kingdom-vassals-list');
        
        if (faction.vassalIds && faction.vassalIds.length > 0) {
            let vassalsHTML = '';
            
            faction.vassalIds.forEach(vassalId => {
                const vassal = FactionIntegration.getFactionById(vassalId);
                if (vassal) {
                    const vassalRuler = FactionIntegration.getRulerById(vassal.rulerId);
                    const relation = FactionIntegration.getRelation(factionId, vassalId);
                    
                    // Determine relationship class
                    let relationClass = 'neutral';
                    if (relation > 75) relationClass = 'friendly';
                    else if (relation > 50) relationClass = 'positive';
                    else if (relation > 25) relationClass = 'cordial';
                    else if (relation < -75) relationClass = 'hostile';
                    else if (relation < -50) relationClass = 'negative';
                    else if (relation < -25) relationClass = 'wary';
                    
                    vassalsHTML += `
                        <div class="vassal-item relation-${relationClass}">
                            <div class="vassal-name">${vassal.name}</div>
                            <div class="vassal-ruler">${vassalRuler ? vassalRuler.title + ' ' + vassalRuler.name : 'Unknown'}</div>
                            <div class="vassal-relation">Relation: ${relation}</div>
                            <button class="btn-view-faction" data-faction-id="${vassal.id}">View</button>
                        </div>
                    `;
                }
            });
            
            vassalsDiv.innerHTML = vassalsHTML;
            
            // Add event listeners
            vassalsDiv.querySelectorAll('.btn-view-faction').forEach(btn => {
                btn.addEventListener('click', function() {
                    const vassalId = this.dataset.factionId;
                    showKingdomDetail(vassalId);
                });
            });
        } else {
            vassalsDiv.innerHTML = '<p>This realm has no known vassals.</p>';
        }
    }
    
    // Show detailed information about a ruler
    function showRulerDetail(rulerId) {
        selectedRulerId = rulerId;
        const ruler = FactionIntegration.getRulerById(rulerId);
        
        if (!ruler) {
            console.error(`Ruler not found: ${rulerId}`);
            return;
        }
        
        // Switch to ruler view
        switchView('ruler');
        
        // Update ruler name
        document.getElementById('ruler-detail-name').textContent = `${ruler.title} ${ruler.name}`;
        
        // Update ruler details
        const rulerDetailsDiv = document.getElementById('ruler-details');
        const faction = FactionIntegration.getFactionById(ruler.factionId);
        
        const traitsHTML = ruler.traits.map(trait => `<span class="ruler-trait">${trait}</span>`).join('');
        
        rulerDetailsDiv.innerHTML = `
            <div class="ruler-full-details">
                <div class="ruler-portrait">
                    <div class="ruler-avatar ${ruler.gender}"></div>
                </div>
                
                <div class="ruler-info">
                    <div class="ruler-stat">
                        <div class="stat-label">Age:</div>
                        <div class="stat-value">${ruler.age} years</div>
                    </div>
                    <div class="ruler-stat">
                        <div class="stat-label">Gender:</div>
                        <div class="stat-value">${ruler.gender}</div>
                    </div>
                    <div class="ruler-stat">
                        <div class="stat-label">Rank:</div>
                        <div class="stat-value">${ruler.rank}</div>
                    </div>
                    <div class="ruler-stat">
                        <div class="stat-label">Realm:</div>
                        <div class="stat-value">${faction ? faction.name : 'Unknown'}</div>
                    </div>
                    <div class="ruler-stat">
                        <div class="stat-label">Prestige:</div>
                        <div class="stat-value">${ruler.prestige}</div>
                    </div>
                </div>
                
                <div class="ruler-traits-section">
                    <h4>Traits</h4>
                    <div class="ruler-traits-list">
                        ${traitsHTML}
                    </div>
                </div>
                
                ${faction ? `<button class="btn-view-faction" data-faction-id="${faction.id}">View Realm</button>` : ''}
            </div>
        `;
        
        // Add event listener for view faction button
        const viewFactionBtn = rulerDetailsDiv.querySelector('.btn-view-faction');
        if (viewFactionBtn) {
            viewFactionBtn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        }
    }
    
    // Update the list of all kingdoms
    function updateKingdomsList() {
        console.log("Updating kingdoms list...");
        
        const factionData = FactionIntegration.getFactionData();
        
        // Check if we have the factions-overview element for safety
        const kingdomsListView = document.getElementById('factions-overview');
        if (!kingdomsListView) {
            console.error("Could not find kingdoms list view element");
            return;
        }
        
        // Get factions and sort by rank and strength
        const factions = factionData.factions.filter(f => f.rank >= 4); // Show major factions only
        
        // Check if we have any factions
        if (!factions || factions.length === 0) {
            kingdomsListView.innerHTML = `
                <h3>Known Realms</h3>
                <p>No major realms discovered yet.</p>
            `;
            return;
        }
        
        // Sort by rank and then strength
        factions.sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            return b.strength - a.strength;
        });
        
        // Group factions by type
        const factionsByType = {
            'NORSE': [],
            'ANGLO_SAXON': [],
            'FRANKISH': []
        };
        
        factions.forEach(faction => {
            if (factionsByType[faction.type]) {
                factionsByType[faction.type].push(faction);
            }
        });
        
        // Create factions list HTML
        let factionsHTML = '<h3>Known Realms</h3>';
        
        for (const type in factionsByType) {
            if (factionsByType[type].length > 0) {
                const typeName = type === 'NORSE' ? 'Norse Realms' : 
                                 type === 'ANGLO_SAXON' ? 'Anglo-Saxon Realms' : 
                                 'Frankish Realms';
                
                factionsHTML += `<div class="faction-type-section">
                    <h4>${typeName}</h4>
                    <div class="faction-type-list">`;
                
                factionsByType[type].forEach(faction => {
                    const ruler = FactionIntegration.getRulerById(faction.rulerId);
                    const factionClass = faction.type.toLowerCase().replace('_', '-');
                    
                    factionsHTML += `
                        <div class="faction-item ${factionClass}" data-faction-id="${faction.id}">
                            <div class="faction-name">${faction.name}</div>
                            <div class="faction-ruler">${ruler ? ruler.title + ' ' + ruler.name : 'Unknown'}</div>
                            <div class="faction-strength">Strength: ${faction.strength}</div>
                            <button class="btn-view-faction" data-faction-id="${faction.id}">View Details</button>
                        </div>
                    `;
                });
                
                factionsHTML += `</div></div>`;
            }
        }
        
        // Update the view
        kingdomsListView.innerHTML = factionsHTML;
        
        // Add event listeners to view buttons
        const viewButtons = kingdomsListView.querySelectorAll('.btn-view-faction');
        if (viewButtons && viewButtons.length > 0) {
            viewButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const factionId = this.dataset.factionId;
                    showKingdomDetail(factionId);
                });
            });
        }
        
        console.log(`Updated kingdoms list with ${factions.length} factions`);
    }
    
    // Update the list of territories
    function updateTerritoriesList(factionFilter = 'all') {
        const factionData = FactionIntegration.getFactionData();
        const territoriesList = document.getElementById('territories-list');
        
        if (!territoriesList) return;
        
        // Filter territories by faction type if requested
        let territories = [...factionData.territories];
        
        if (factionFilter !== 'all') {
            territories = territories.filter(territory => {
                const faction = FactionIntegration.getFactionById(territory.factionId);
                return faction && faction.type === factionFilter;
            });
        }
        
        // Sort by prosperity
        territories.sort((a, b) => b.prosperity - a.prosperity);
        
        if (territories.length === 0) {
            territoriesList.innerHTML = '<p>No territories discovered yet.</p>';
            return;
        }
        
        let territoriesHTML = '';
        
        territories.forEach(territory => {
            const faction = FactionIntegration.getFactionById(territory.factionId);
            if (!faction) return;
            
            const factionClass = faction.type.toLowerCase().replace('_', '-');
            
            territoriesHTML += `
                <div class="territory-item ${factionClass}">
                    <div class="territory-name">${territory.name}</div>
                    <div class="territory-faction">Faction: ${faction.name}</div>
                    <div class="territory-stats">
                        <span class="territory-prosperity">Prosperity: ${territory.prosperity}</span>
                        <span class="territory-unrest">Unrest: ${territory.unrest}</span>
                    </div>
                    <button class="btn-view-territory" data-territory-id="${territory.id}">View Details</button>
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
    
    // Show detailed information about a territory
    function showTerritoryDetail(territoryId) {
        selectedTerritoryId = territoryId;
        const territory = FactionIntegration.getTerritoryById(territoryId);
        
        if (!territory) {
            console.error(`Territory not found: ${territoryId}`);
            return;
        }
        
        // Switch to territory view
        switchView('territory');
        
        // Update territory name
        document.getElementById('territory-detail-name').textContent = territory.name;
        
        // Update territory details
        const territoryDetailsDiv = document.getElementById('territory-details');
        const faction = FactionIntegration.getFactionById(territory.factionId);
        const region = WorldMap.getRegion(territory.regionId);
        
        // Get settlements in this territory
        const territorySettlements = [];
        territory.settlements.forEach(settlementId => {
            const settlement = WorldMap.getSettlement(settlementId);
            if (settlement) {
                territorySettlements.push(settlement);
            }
        });
        
        let resourcesHTML = '';
        const resourceCategories = {
            'Basic Resources': ['food', 'wood', 'stone', 'metal'],
            'Advanced Resources': ['leather', 'fur', 'cloth', 'clay', 'pitch', 'salt', 'honey', 'herbs'],
            'Wealth Resources': ['silver', 'gold', 'amber', 'ivory', 'jewels'],
            'Environmental Resources': ['peat', 'whale_oil', 'ice', 'exotic']
        };
        
        for (const category in resourceCategories) {
            let categoryHTML = '';
            let hasResources = false;
            
            resourceCategories[category].forEach(resource => {
                if (territory.resources[resource] > 0) {
                    categoryHTML += `
                        <div class="resource-item">
                            <div class="resource-name">${resource.charAt(0).toUpperCase() + resource.slice(1).replace('_', ' ')}</div>
                            <div class="resource-value">${territory.resources[resource]}</div>
                        </div>
                    `;
                    hasResources = true;
                }
            });
            
            if (hasResources) {
                resourcesHTML += `
                    <div class="resource-category">
                        <h5>${category}</h5>
                        <div class="resource-list">
                            ${categoryHTML}
                        </div>
                    </div>
                `;
            }
        }
        
        territoryDetailsDiv.innerHTML = `
            <div class="territory-full-details">
                <div class="territory-faction-info">
                    <h4>Political Information</h4>
                    <div class="territory-faction">Faction: ${faction ? faction.name : 'Unknown'}</div>
                    <div class="territory-region">Region: ${region ? region.name : 'Unknown'}</div>
                    <div class="territory-prosperity">Prosperity: ${territory.prosperity}</div>
                    <div class="territory-unrest">Unrest: ${territory.unrest}</div>
                </div>
                
                <div class="territory-settlements">
                    <h4>Settlements</h4>
                    <div class="territory-settlements-list">
                        ${territorySettlements.length > 0 ? 
                            territorySettlements.map(s => `
                                <div class="territory-settlement">
                                    <div class="settlement-name">${s.name}</div>
                                    <div class="settlement-population">Pop: ${s.population}</div>
                                </div>
                            `).join('') : 
                            '<p>No known settlements in this territory.</p>'
                        }
                    </div>
                </div>
                
                <div class="territory-resources">
                    <h4>Resources</h4>
                    <div class="territory-resources-list">
                        ${resourcesHTML}
                    </div>
                </div>
                
                ${faction ? `<button class="btn-view-faction" data-faction-id="${faction.id}">View Controlling Faction</button>` : ''}
            </div>
        `;
        
        // Add event listener for view faction button
        const viewFactionBtn = territoryDetailsDiv.querySelector('.btn-view-faction');
        if (viewFactionBtn) {
            viewFactionBtn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        }
    }



    function resetPanelLayout() {
        console.log("Resetting factions panel layout...");
        
        // Reset the view state
        currentView = 'overview';
        
        // Hide all views
        document.querySelectorAll('.faction-view').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show the overview view
        const overviewElement = document.getElementById('factions-overview');
        if (overviewElement) {
            overviewElement.classList.add('active');
        }
        
        // Reset navigation button states
        document.querySelectorAll('.factions-nav-btn').forEach(el => {
            el.classList.remove('active');
        });
        
        // Activate overview button
        const overviewBtn = document.getElementById('btn-factions-overview');
        if (overviewBtn) {
            overviewBtn.classList.add('active');
        }
        
        // Update the overview content
        updateOverview();
    }
    
    // Update the relations view with faction dropdowns
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
    }
    
    // Show relation between two factions
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
        let relationDesc = "Neutral";
        let relationClass = "neutral";
        
        if (relation > 75) {
            relationDesc = "Friendly";
            relationClass = "friendly";
        } else if (relation > 50) {
            relationDesc = "Positive";
            relationClass = "positive";
        } else if (relation > 25) {
            relationDesc = "Cordial";
            relationClass = "cordial";
        } else if (relation < -75) {
            relationDesc = "Hostile";
            relationClass = "hostile";
        } else if (relation < -50) {
            relationDesc = "Negative";
            relationClass = "negative";
        } else if (relation < -25) {
            relationDesc = "Wary";
            relationClass = "wary";
        }
        
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
                
                <div class="relation-actions">
                    <button class="btn-view-faction" data-faction-id="${faction1.id}">View ${faction1.name}</button>
                    <button class="btn-view-faction" data-faction-id="${faction2.id}">View ${faction2.name}</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        relationDisplay.querySelectorAll('.btn-view-faction').forEach(btn => {
            btn.addEventListener('click', function() {
                const factionId = this.dataset.factionId;
                showKingdomDetail(factionId);
            });
        });
    }
    
    // Add CSS styles for the factions panel
    function addFactionsPanelStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'factions-panel-styles';
        styleElement.textContent = `
            /* Factions Panel Styles */
            .factions-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #c9ba9b;
                overflow-y: auto;
                max-height: 80vh;
            }
            
            .factions-panel h2 {
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                color: #5d4037;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-bottom: 15px;
                letter-spacing: 1px;
                font-weight: 700;
            }
            
            .factions-navigation {
                display: flex;
                border-bottom: 1px solid #c9ba9b;
                margin-bottom: 20px;
                padding-bottom: 10px;
                gap: 10px;
            }
            
            .factions-nav-btn {
                padding: 8px 12px;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .factions-nav-btn:hover {
                background-color: #c9ba9b;
            }
            
            .factions-nav-btn.active {
                background-color: #8b5d33;
                color: #fff;
                border: 1px solid #5d4037;
            }
            
            .faction-view {
                display: none;
            }
            
            .faction-view.active {
                display: block;
            }
            
            /* Overview Styles */
            .faction-counters {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .faction-counter {
                background-color: #f7f0e3;
                padding: 10px 15px;
                border-radius: 4px;
                flex: 1;
            }
            
            .faction-counter.norse {
                border-left: 4px solid #b71c1c; /* Viking red */
            }
            
            .faction-counter.anglo {
                border-left: 4px solid #1565c0; /* Anglo blue */
            }
            
            .faction-counter.frankish {
                border-left: 4px solid #6a1b9a; /* Frankish purple */
            }
            
            .counter-label {
                font-weight: 500;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .counter-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #8b5d33;
            }
            
            /* Faction List Styles */
            .faction-list-container {
                margin-bottom: 20px;
            }
            
            .faction-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }
            
            .faction-item {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .faction-item.norse {
                border-left: 4px solid #b71c1c; /* Viking red */
            }
            
            .faction-item.anglo-saxon {
                border-left: 4px solid #1565c0; /* Anglo blue */
            }
            
            .faction-item.frankish {
                border-left: 4px solid #6a1b9a; /* Frankish purple */
            }
            
            .faction-name {
                font-weight: bold;
                font-size: 1.1rem;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .faction-ruler {
                color: #8b5d33;
                margin-bottom: 5px;
            }
            
            .faction-strength {
                font-size: 0.9rem;
                color: #5d4037;
                margin-bottom: 10px;
            }
            
            .btn-view-faction {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #8b5d33;
                color: #fff;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .btn-view-faction:hover {
                background-color: #a97c50;
            }
            
            /* Kingdom Detail Styles */
            .detail-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .btn-back {
                margin-right: 15px;
                padding: 5px 10px;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .btn-back:hover {
                background-color: #c9ba9b;
            }
            
            .kingdom-info-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .kingdom-ruler-info, .kingdom-stats, .kingdom-vassals {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .kingdom-ruler-info, .kingdom-vassals {
                grid-column: span 2;
            }
            
            .ruler-detail-card {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .ruler-name-title {
                font-size: 1.2rem;
                color: #5d4037;
            }
            
            .ruler-title {
                font-weight: bold;
                margin-right: 5px;
            }
            
            .ruler-traits {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin: 10px 0;
            }
            
            .ruler-trait {
                background-color: #d7cbb9;
                padding: 3px 8px;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #5d4037;
            }
            
            .kingdom-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e6d8c3;
            }
            
            .kingdom-stat:last-child {
                border-bottom: none;
            }
            
            .stat-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            .stat-value {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .vassal-item {
                background-color: #f9f5ea;
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                border-left: 4px solid #8b5d33;
            }
            
            .vassal-name {
                font-weight: 500;
                margin-right: 15px;
                flex: 1;
            }
            
            .vassal-ruler {
                color: #8b5d33;
                margin-right: 15px;
                flex: 1;
            }
            
            .vassal-relation {
                font-size: 0.9rem;
                margin-right: 15px;
            }
            
            /* Relation classes */
            .relation-friendly {
                border-left-color: #2e7d32; /* Green */
                color: #2e7d32;
            }
            
            .relation-positive {
                border-left-color: #689f38; /* Light green */
                color: #689f38;
            }
            
            .relation-cordial {
                border-left-color: #afb42b; /* Yellow-green */
                color: #afb42b;
            }
            
            .relation-neutral {
                border-left-color: #8b7355; /* Brown */
                color: #8b7355;
            }
            
            .relation-wary {
                border-left-color: #ff8f00; /* Amber */
                color: #ff8f00;
            }
            
            .relation-negative {
                border-left-color: #f57c00; /* Orange */
                color: #f57c00;
            }
            
            .relation-hostile {
                border-left-color: #c62828; /* Red */
                color: #c62828;
            }
            
            /* Ruler Detail Styles */
            .ruler-full-details {
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 20px;
                background-color: #f7f0e3;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .ruler-portrait {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .ruler-avatar {
                width: 150px;
                height: 150px;
                border-radius: 50%;
                background-color: #d7cbb9;
                position: relative;
                overflow: hidden;
            }
            
            .ruler-avatar.male::after {
                content: '♂';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 80px;
                color: #5d4037;
            }
            
            .ruler-avatar.female::after {
                content: '♀';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 80px;
                color: #c62828;
            }
            
            .ruler-info {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .ruler-traits-section {
                grid-column: span 2;
                margin-top: 20px;
            }
            
            /* Territory Styles */
            .territory-filters {
                margin-bottom: 20px;
            }
            
            .territory-filters select {
                padding: 8px;
                background-color: #f7f0e3;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                color: #5d4037;
                width: 200px;
            }
            
            .territories-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 15px;
            }
            
            .territory-item {
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .territory-item.norse {
                border-left: 4px solid #b71c1c;
            }
            
            .territory-item.anglo-saxon {
                border-left: 4px solid #1565c0;
            }
            
            .territory-item.frankish {
                border-left: 4px solid #6a1b9a;
            }
            
            .territory-name {
                font-weight: bold;
                font-size: 1.1rem;
                color: #5d4037;
                margin-bottom: 5px;
            }
            
            .territory-faction {
                color: #8b5d33;
                margin-bottom: 5px;
            }
            
            .territory-stats {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            
            .territory-prosperity {
                color: #2e7d32;
            }
            
            .territory-unrest {
                color: #c62828;
            }
            
            .btn-view-territory {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #8b5d33;
                color: #fff;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .btn-view-territory:hover {
                background-color: #a97c50;
            }
            
            /* Territory Detail Styles */
            .territory-full-details {
                display: flex;
                flex-direction: column;
                gap: 20px;
                background-color: #f7f0e3;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .territory-faction-info, .territory-settlements, .territory-resources {
                padding: 15px;
                background-color: #f9f5ea;
                border-radius: 4px;
            }
            
            .territory-settlements-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .territory-settlement {
                background-color: #f0e6d2;
                padding: 8px;
                border-radius: 3px;
                border-left: 3px solid #8b5d33;
            }
            
            .territory-resources-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }
            
            .resource-category h5 {
                margin-top: 0;
                margin-bottom: 8px;
                color: #5d4037;
                font-size: 1rem;
                border-bottom: 1px solid #e6d8c3;
                padding-bottom: 5px;
            }
            
            .resource-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 8px;
            }
            
            .resource-item {
                display: flex;
                justify-content: space-between;
                background-color: #f0e6d2;
                padding: 5px 8px;
                border-radius: 3px;
                font-size: 0.9rem;
            }
            
            /* Relations View Styles */
            .relations-container {
                background-color: #f7f0e3;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .relations-selector {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .relations-selector select {
                padding: 8px;
                background-color: #fdfbf6;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                color: #5d4037;
                min-width: 200px;
            }
            
            .relation-display {
                padding: 15px;
                background-color: #f9f5ea;
                border-radius: 4px;
                min-height: 150px;
            }
            
            .relation-result {
                padding: 20px;
                background-color: #ffffff;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .relation-factions {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .relation-faction {
                padding: 10px 15px;
                min-width: 150px;
                text-align: center;
                font-weight: 500;
                border-radius: 4px;
            }
            
            .relation-faction.faction-norse {
                background-color: #ffebee;
                color: #b71c1c;
                border: 1px solid #ffcdd2;
            }
            
            .relation-faction.faction-anglo-saxon {
                background-color: #e3f2fd;
                color: #1565c0;
                border: 1px solid #bbdefb;
            }
            
            .relation-faction.faction-frankish {
                background-color: #f3e5f5;
                color: #6a1b9a;
                border: 1px solid #e1bee7;
            }
            
            .relation-arrow {
                font-size: 2rem;
                font-weight: bold;
            }
            
            .relation-status {
                text-align: center;
                padding: 10px;
                font-size: 1.2rem;
                font-weight: bold;
                border-radius: 4px;
                margin-bottom: 15px;
            }
            
            .relation-status.relation-friendly {
                background-color: #e8f5e9;
                color: #2e7d32;
            }
            
            .relation-status.relation-positive {
                background-color: #f1f8e9;
                color: #689f38;
            }
            
            .relation-status.relation-cordial {
                background-color: #f9fbe7;
                color: #afb42b;
            }
            
            .relation-status.relation-neutral {
                background-color: #f7f0e3;
                color: #8b7355;
            }
            
            .relation-status.relation-wary {
                background-color: #fff8e1;
                color: #ff8f00;
            }
            
            .relation-status.relation-negative {
                background-color: #fff3e0;
                color: #f57c00;
            }
            
            .relation-status.relation-hostile {
                background-color: #ffebee;
                color: #c62828;
            }
            
            .vassalage-info {
                text-align: center;
                font-style: italic;
                margin-bottom: 15px;
            }
            
            .relation-actions {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
            }
            
            /* Responsive styles */
            @media (max-width: 768px) {
                .faction-counters {
                    flex-direction: column;
                }
                
                .kingdom-info-container {
                    grid-template-columns: 1fr;
                }
                
                .kingdom-stats {
                    grid-column: span 2;
                }
                
                .ruler-full-details {
                    grid-template-columns: 1fr;
                }
                
                .ruler-portrait {
                    margin-bottom: 20px;
                }
                
                .territories-list,
                .faction-list {
                    grid-template-columns: 1fr;
                }
                
                .relations-selector {
                    flex-direction: column;
                    align-items: stretch;
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
            console.log("Initializing Factions Panel...");
            
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
                        
                        // Recreate panel structure and update content
                        setTimeout(() => {
                            recreatePanelStructure();
                        }, 50);
                    });
                }
            }
            
            console.log("Factions Panel initialized");
        },

        
        
        /**
         * Update panel content
         */
        update: function() {
            // Reset the layout first to ensure clean state
            resetPanelLayout();
            
            // Then update content based on current view
            switch(currentView) {
                case 'overview':
                    updateOverview();
                    break;
                case 'kingdoms':
                    updateKingdomsList();
                    break;
                case 'territories':
                    updateTerritoriesList();
                    break;
                case 'relations':
                    updateRelationsView();
                    break;
            }
        },

        resetPanelLayout: resetPanelLayout
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
            
            // Initialize the factions panel
            FactionsPanel.init();
        }
    }, 500);
});
