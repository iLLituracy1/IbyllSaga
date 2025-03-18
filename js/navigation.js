/**
 * Viking Legacy - Game Navigation System
 * Creates a tabbed interface to manage different game panels
 */

const NavigationSystem = (function() {
    // Track which tab is currently active
    let activeTab = 'settlement';
    
    // Define all game tabs and their content
    const tabs = {
        settlement: {
            id: 'settlement-tab',
            title: 'Settlement',
            icon: '🏠',
            panels: ['resources-panel', 'population-panel', 'actions-panel'],
            isDefault: true
        },
        buildings: {
            id: 'buildings-tab',
            title: 'Buildings',
            icon: '🏗️',
            panels: ['building-panel']
        },
        land: {
            id: 'land-tab',
            title: 'Land',
            icon: '🏞️',
            panels: ['land-panel']
        },
        world: {
            id: 'world-tab',
            title: 'World Map',
            icon: '🗺️',
            panels: ['world-panel']
        },
        saga: {
            id: 'saga-tab',
            title: 'Saga',
            icon: '📜',
            panels: ['log-panel']
        },
        stats: {
            id: 'stats-tab',
            title: 'Statistics',
            icon: '📊',
            panels: ['statistics-panel']
        },
        workers: {
            id: 'workers-tab',
            title: 'Workers',
            icon: '👷',
            panels: ['worker-panel']
        },
        economy: {
            id: 'economy-tab',
            title: 'Economy',
            icon: '📊',
            panels: ['economy-panel']
        },
    };
    
    // Map of panel registration status
    let registeredPanels = {};
    
    /**
     * Create the navigation bar
     */
    function createNavigation() {
        console.log("Creating game navigation bar...");
        
        // Get the game container and game content
        const gameContainer = document.getElementById('game-container');
        const gameContent = document.querySelector('.game-content');
        
        if (!gameContainer || !gameContent) {
            console.error('Game container or content not found');
            return;
        }
        
        // Create navigation container
        const navContainer = document.createElement('div');
        navContainer.className = 'game-navigation';
        navContainer.id = 'game-navigation';
        
        // Create tabs
        let tabsHtml = '';
        
        for (const tabKey in tabs) {
            const tab = tabs[tabKey];
            tabsHtml += `
                <div class="nav-tab ${tab.isDefault ? 'active' : ''}" data-tab="${tabKey}" id="${tab.id}">
                    <span class="tab-icon">${tab.icon}</span>
                    <span class="tab-text">${tab.title}</span>
                </div>
            `;
        }
        
        navContainer.innerHTML = tabsHtml;
        
        // Insert navigation after header, before game content
        const header = gameContainer.querySelector('header');
        gameContainer.insertBefore(navContainer, header.nextSibling);
        
        // Add tab click event listeners
        const tabElements = document.querySelectorAll('.nav-tab');
        tabElements.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabKey = this.dataset.tab;
                switchTab(tabKey);
            });
        });
        
        // Modify game content layout for tab system
        console.log("Modifying game content layout for tab system...");
        gameContent.classList.add('tabbed-content');
        
        // Initial tab setup
        organizeGamePanels();
        
        console.log('Navigation system setup complete');
    }
    
    /**
     * Switch to a different tab
     * @param {string} tabKey - Key of the tab to switch to
     */
    function switchTab(tabKey) {
        console.log(`Switching to tab: ${tabKey}`);
        
        if (!tabs[tabKey]) {
            console.warn(`Unknown tab: ${tabKey}`);
            return;
        }
        
        // Update active tab
        activeTab = tabKey;
        
        // Update tab styling
        const tabElements = document.querySelectorAll('.nav-tab');
        tabElements.forEach(tab => {
            if (tab.dataset.tab === tabKey) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show/hide appropriate panels
        organizeGamePanels();
    }
    
    /**
     * Organize game panels based on active tab
     */
    function organizeGamePanels() {
        console.log(`Organizing panels for tab: ${activeTab}`);
        
        // Get all panels
        const allPanels = document.querySelectorAll('[id$="-panel"]');
        console.log(`Found ${allPanels.length} total panels`);
        
        // Hide all panels first
        allPanels.forEach(panel => {
            panel.classList.remove('visible-panel');
            panel.classList.add('hidden-panel');
            
            // Track this panel
            registeredPanels[panel.id] = true;
        });
        
        // Get panels for active tab
        const activeTabPanels = tabs[activeTab]?.panels || [];
        console.log(`Showing ${activeTabPanels.length} panels for ${activeTab} tab`);
        
        // Show panels for active tab
        activeTabPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.remove('hidden-panel');
                panel.classList.add('visible-panel');
                console.log(`Showing panel: ${panelId}`);
            } else {
                console.log(`Panel not found: ${panelId}`);
            }
        });
    }
    
    /**
     * Check if a panel belongs to the active tab
     * @param {string} panelId - ID of the panel to check
     * @returns {boolean} - Whether the panel belongs to the active tab
     */
    function isPanelVisible(panelId) {
        return tabs[activeTab]?.panels.includes(panelId) || false;
    }
    
    /**
     * Register a new panel with the navigation system
     * @param {string} panelId - ID of the panel
     * @param {string} tabKey - Key of the tab to add it to
     */
    function registerPanel(panelId, tabKey) {
        if (!tabs[tabKey]) {
            console.warn(`Cannot register panel ${panelId} - unknown tab: ${tabKey}`);
            return;
        }
        
        console.log(`Registering panel: ${panelId} with tab: ${tabKey}`);
        
        // Add to tab's panel list if not already included
        if (!tabs[tabKey].panels.includes(panelId)) {
            tabs[tabKey].panels.push(panelId);
        }
        
        // Check if panel exists in DOM
        const panel = document.getElementById(panelId);
        if (panel) {
            // Apply appropriate visibility
            if (activeTab === tabKey) {
                panel.classList.remove('hidden-panel');
                panel.classList.add('visible-panel');
                console.log(`Panel ${panelId} set to visible (matches active tab)`);
            } else {
                panel.classList.remove('visible-panel');
                panel.classList.add('hidden-panel');
                console.log(`Panel ${panelId} set to hidden (doesn't match active tab)`);
            }
            
            // Track this panel
            registeredPanels[panelId] = true;
        } else {
            // Panel doesn't exist yet - will be handled when it's created
            console.log(`Panel ${panelId} not found in DOM yet, will be handled when created`);
            registeredPanels[panelId] = 'pending';
        }
    }
    
    /**
     * Add CSS styles for the navigation system
     */
    function addNavigationStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'navigation-styles';
        styleElement.textContent = `
            /* Game Navigation Styles */
            .game-navigation {
                display: flex;
                flex-wrap: wrap;
                background-color: #e6d8c3;
                border-radius: 8px 8px 0 0;
                border: 2px solid #8b7355;
                border-bottom: none;
                margin: 20px auto 0;
                max-width: 1200px;
                width: 100%;
            }
            
            .nav-tab {
                padding: 12px 18px;
                background-color: #d7cbb9;
                color: #5d4037;
                cursor: pointer;
                border-right: 1px solid #a99275;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
                user-select: none;
            }
            
            .nav-tab:first-child {
                border-radius: 6px 0 0 0;
            }
            
            .nav-tab:last-child {
                border-right: none;
                border-radius: 0 6px 0 0;
            }
            
            .nav-tab:hover {
                background-color: #c9ba9b;
            }
            
            .nav-tab.active {
                background-color: #f7f0e3;
                font-weight: 600;
                border-bottom: 3px solid #8b5d33;
            }
            
            .tab-icon {
                font-size: 1.2rem;
            }
            
            /* Tab content layout */
            .tabbed-content {
                display: block;
                position: relative;
            }
            
            /* Panel visibility classes */
            .hidden-panel {
                display: none !important;
            }
            
            .visible-panel {
                display: block !important;
            }
            
            /* Responsive styles */
            @media (max-width: 768px) {
                .game-navigation {
                    justify-content: center;
                }
                
                .nav-tab {
                    padding: 10px;
                    flex-direction: column;
                    text-align: center;
                    flex-grow: 1;
                    max-width: 25%;
                }
                
                .tab-text {
                    font-size: 0.8rem;
                }
                
                .tab-icon {
                    font-size: 1.4rem;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Public API
    return {
        /**
         * Initialize the navigation system
         */
        init: function() {
            console.log("Initializing Game Navigation...");
            
            // Add styles
            addNavigationStyles();
            
            // Create navigation
            createNavigation();
            
            console.log("Game Navigation initialized");
        },
        
        /**
         * Switch to a specific tab
         * @param {string} tabKey - Key of the tab to switch to
         */
        switchToTab: function(tabKey) {
            switchTab(tabKey);
        },
        
        /**
         * Get the currently active tab
         * @returns {string} - Key of the active tab
         */
        getActiveTab: function() {
            return activeTab;
        },

        switchToPanel: function(panelId) {
            // First determine which tab the panel belongs to
            let tabId = null;
            
            for (const tab in this.panels) {
                if (this.panels[tab].includes(panelId)) {
                    tabId = tab;
                    break;
                }
            }
            
            // If we found the tab, switch to it and show the panel
            if (tabId) {
                // Switch to the tab first
                this.switchToTab(tabId);
                
                // Then show the specific panel
                const panel = document.getElementById(panelId);
                if (panel) {
                    // Hide all other panels in this tab
                    this.panels[tabId].forEach(id => {
                        const p = document.getElementById(id);
                        if (p) p.classList.add('hidden-panel');
                    });
                    
                    // Show the requested panel
                    panel.classList.remove('hidden-panel');
                    
                    console.log(`Switched to panel: ${panelId} in tab: ${tabId}`);
                } else {
                    console.warn(`Panel ${panelId} not found in the DOM.`);
                }
            } else {
                console.warn(`Could not find tab for panel: ${panelId}`);
            }
        },
        
        /**
         * Register a panel with a tab
         * @param {string} panelId - ID of the panel
         * @param {string} tabKey - Key of the tab
         */
        registerPanel: function(panelId, tabKey) {
            registerPanel(panelId, tabKey);
        },
        
        /**
         * Check if a panel is currently visible
         * @param {string} panelId - ID of the panel
         * @returns {boolean} - Whether the panel belongs to the active tab
         */
        isPanelVisible: function(panelId) {
            return isPanelVisible(panelId);
        },
        
        /**
         * Force a refresh of the panel visibility
         * Useful if panels were dynamically added or modified
         */
        refreshPanels: function() {
            organizeGamePanels();
        }
    };
})();
