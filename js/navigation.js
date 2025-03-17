/**
 * Viking Legacy - Game Navigation System (Fixed Version)
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
        }
    };
    
    /**
     * Create the navigation bar
     */
    function createNavigation() {
        // Create tab content container that will hold game content
        const tabContentContainer = document.createElement('div');
        tabContentContainer.className = 'tab-content-container';
        tabContentContainer.id = 'tab-content-container';
        
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
        
        // Get the game container and game content
        const gameContainer = document.getElementById('game-container');
        const gameContent = document.querySelector('.game-content');
        
        if (!gameContainer || !gameContent) {
            console.error('Game container or content not found');
            return;
        }
        
        // Insert navigation after header, before game content
        const header = gameContainer.querySelector('header');
        gameContainer.insertBefore(navContainer, header.nextSibling);
        
        // Move game controls out if they're inside game content
        const gameControls = gameContent.querySelector('.game-controls');
        if (gameControls) {
            gameContent.removeChild(gameControls);
            gameContainer.appendChild(gameControls);
        }
        
        // Add tab click event listeners
        const tabElements = document.querySelectorAll('.nav-tab');
        tabElements.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabKey = this.dataset.tab;
                switchTab(tabKey);
            });
        });
        
        // Important step: Find all panels and position them correctly
        findAndPositionPanels();
        
        // Initial tab setup
        organizeGamePanels();
        
        console.log('Navigation system setup complete');
    }
    
    /**
     * Find all registered panels and position them correctly
     * This is critical for proper panel display
     */
    function findAndPositionPanels() {
        const gameContent = document.querySelector('.game-content');
        if (!gameContent) return;
        
        // Clear existing style
        gameContent.style.gridTemplateColumns = 'none';
        gameContent.style.gridTemplateRows = 'none';
        gameContent.style.display = 'block';
        
        // Get all panel IDs from all tabs
        const allPanelIds = [];
        for (const tabKey in tabs) {
            allPanelIds.push(...tabs[tabKey].panels);
        }
        
        // Get unique panel IDs
        const uniquePanelIds = [...new Set(allPanelIds)];
        
        // Apply initial styling to all panels
        uniquePanelIds.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                // Reset grid positioning
                panel.style.gridColumn = 'auto';
                panel.style.gridRow = 'auto';
                panel.style.margin = '20px 0';
                panel.style.position = 'relative';
                
                // Initially hide all panels
                panel.style.display = 'none';
            }
        });
    }
    
    /**
     * Switch to a different tab
     * @param {string} tabKey - Key of the tab to switch to
     */
    function switchTab(tabKey) {
        if (!tabs[tabKey]) return;
        
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
        // Get all potential panels
        const allPanelIds = [];
        for (const tabKey in tabs) {
            allPanelIds.push(...tabs[tabKey].panels);
        }
        
        // Get unique panel IDs
        const uniquePanelIds = [...new Set(allPanelIds)];
        
        // Hide all panels first
        uniquePanelIds.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
        
        // Show panels for active tab
        const activeTabPanels = tabs[activeTab].panels;
        activeTabPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'block';
            }
        });
        
        console.log(`Switched to ${activeTab} tab, showing panels:`, activeTabPanels);
    }
    
    /**
     * Check if a panel belongs to the active tab
     * @param {string} panelId - ID of the panel to check
     * @returns {boolean} - Whether the panel belongs to the active tab
     */
    function isPanelVisible(panelId) {
        return tabs[activeTab].panels.includes(panelId);
    }
    
    /**
     * Register a new panel with the navigation system
     * @param {string} panelId - ID of the panel
     * @param {string} tabKey - Key of the tab to add it to
     */
    function registerPanel(panelId, tabKey) {
        if (!tabs[tabKey]) return;
        
        if (!tabs[tabKey].panels.includes(panelId)) {
            tabs[tabKey].panels.push(panelId);
        }
        
        // Update visibility if needed
        const panel = document.getElementById(panelId);
        if (panel) {
            // Reset grid positioning
            panel.style.gridColumn = 'auto';
            panel.style.gridRow = 'auto';
            panel.style.margin = '20px 0';
            
            // Set display based on active tab
            panel.style.display = activeTab === tabKey ? 'block' : 'none';
        }
    }
    
    /**
     * Add CSS styles for the navigation system
     */
    function addNavigationStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Game Navigation Styles */
            .game-container {
                display: flex;
                flex-direction: column;
            }
            
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
            
            /* Critical fix: Ensure game content does not use grid */
            .game-content {
                display: block !important;
                margin: 0;
                border-radius: 0 0 8px 8px;
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
         * @returns {boolean} - Whether the panel is visible
         */
        isPanelVisible: function(panelId) {
            return isPanelVisible(panelId);
        }
    };
})();
