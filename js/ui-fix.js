/**
 * Viking Legacy - Comprehensive UI Fix
 * Fixes navigation, responsiveness, and control visibility issues
 */

(function() {
    console.log("Applying comprehensive UI fixes...");
    
    // ---------------
    // 1. Add required CSS fixes
    // ---------------
    function addFixStyles() {
        const styleEl = document.createElement('style');
        styleEl.id = 'comprehensive-fix-styles';
        styleEl.textContent = `
            /* Fix container sizing and centering */
            .game-container {
                max-width: 100% !important;
                width: 100% !important;
                padding: 15px !important;
                margin: 0 auto !important;
                box-sizing: border-box !important;
                overflow-x: hidden !important;
            }
            
            /* Fix content layout - CRITICAL */
            .game-content {
                display: block !important;
                width: 100% !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
                position: relative !important;
                overflow: visible !important;
            }
            
            /* Ensure all panels take full width */
            [id$="-panel"] {
                width: 100% !important;
                max-width: 100% !important;
                margin: 20px 0 !important;
                box-sizing: border-box !important;
                grid-column: auto !important;
                grid-row: auto !important;
            }
            
            /* Game controls always visible fix */
            .game-controls {
                position: fixed !important;
                bottom: 10px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 1000 !important;
                background: rgba(247, 240, 227, 0.9) !important;
                border: 2px solid #8b7355 !important;
                border-radius: 8px !important;
                padding: 8px 15px !important;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2) !important;
                width: auto !important;
                display: flex !important;
                justify-content: center !important;
            }
            
            /* Ensure navigation is responsive */
            .game-navigation {
                max-width: 100% !important;
                width: 100% !important;
                display: flex !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
            }
            
            /* Add margin below game log to prevent it being hidden behind controls */
            .log-panel {
                margin-bottom: 70px !important;
            }
            
            /* Make sure header is visible */
            header {
                width: 100% !important;
                max-width: 1200px !important;
                margin: 0 auto 20px !important;
            }
            
            /* Responsive tab adjustments */
            @media (max-width: 768px) {
                .nav-tab {
                    padding: 8px 12px !important;
                    font-size: 0.9rem !important;
                }
                
                .game-controls {
                    padding: 5px 10px !important;
                }
                
                .game-controls button {
                    padding: 5px 8px !important;
                    font-size: 0.9rem !important;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log("✅ Added UI fix styles");
    }

    // ---------------
    // 2. Fix panel visibility and navigation issues
    // ---------------
    function fixNavigation() {
        console.log("Fixing navigation and panel visibility...");
        
        // Define tab-to-panel mapping
        const tabPanels = {
            settlement: ['resources-panel', 'population-panel', 'actions-panel'],
            buildings: ['building-panel'],
            land: ['land-panel'],
            world: ['world-panel'],
            saga: ['log-panel'],
            stats: ['statistics-panel']
        };
        
        // Find all panels
        const allPanels = document.querySelectorAll('[id$="-panel"]');
        console.log(`Found ${allPanels.length} panels to manage`);
        
        // Hide all panels first
        allPanels.forEach(panel => {
            // Override any inline styles
            panel.style.setProperty('display', 'none', 'important');
            console.log(`Hidden panel: ${panel.id}`);
        });
        
        // Get active tab
        let activeTab = 'settlement';
        if (typeof NavigationSystem !== 'undefined' && NavigationSystem.getActiveTab) {
            activeTab = NavigationSystem.getActiveTab();
        }
        console.log(`Current active tab: ${activeTab}`);
        
        // Show panels for active tab
        const panelsToShow = tabPanels[activeTab] || [];
        panelsToShow.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.setProperty('display', 'block', 'important');
                console.log(`Showing panel: ${panelId}`);
                
                // Force style reset to ensure panel displays properly
                panel.style.setProperty('grid-column', 'auto', 'important');
                panel.style.setProperty('grid-row', 'auto', 'important');
                panel.style.setProperty('position', 'relative', 'important');
                panel.style.setProperty('width', '100%', 'important');
            }
        });
        
        // Fix tab click handlers
        document.querySelectorAll('.nav-tab').forEach(tab => {
            // Clone to remove existing event listeners
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            // Add new event handler
            newTab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Update active tab visual indicator
                document.querySelectorAll('.nav-tab').forEach(t => {
                    t.classList.remove('active');
                });
                this.classList.add('active');
                
                // Get tab key
                const tabKey = this.dataset.tab;
                console.log(`Tab clicked: ${tabKey}`);
                
                // Hide all panels
                document.querySelectorAll('[id$="-panel"]').forEach(p => {
                    p.style.setProperty('display', 'none', 'important');
                });
                
                // Show this tab's panels
                const showPanels = tabPanels[tabKey] || [];
                showPanels.forEach(panelId => {
                    const panel = document.getElementById(panelId);
                    if (panel) {
                        panel.style.setProperty('display', 'block', 'important');
                    }
                });
                
                // Update NavigationSystem state if it exists
                if (typeof NavigationSystem !== 'undefined' && NavigationSystem.switchToTab) {
                    NavigationSystem.switchToTab(tabKey);
                }
            });
        });
        
        console.log("✅ Fixed navigation and panel visibility");
    }

    // ---------------
    // 3. Fix game controls visibility
    // ---------------
    function fixGameControls() {
        console.log("Fixing game controls visibility...");
        
        const gameControlsEl = document.querySelector('.game-controls');
        if (gameControlsEl) {
            // Ensure controls are visible and styled correctly
            gameControlsEl.style.setProperty('position', 'fixed', 'important');
            gameControlsEl.style.setProperty('bottom', '10px', 'important');
            gameControlsEl.style.setProperty('left', '50%', 'important');
            gameControlsEl.style.setProperty('transform', 'translateX(-50%)', 'important');
            gameControlsEl.style.setProperty('z-index', '1000', 'important');
            gameControlsEl.style.setProperty('display', 'flex', 'important');
            gameControlsEl.style.setProperty('background', 'rgba(247, 240, 227, 0.9)', 'important');
            gameControlsEl.style.setProperty('border', '2px solid #8b7355', 'important');
            gameControlsEl.style.setProperty('border-radius', '8px', 'important');
            gameControlsEl.style.setProperty('padding', '8px 15px', 'important');
            gameControlsEl.style.setProperty('box-shadow', '0 0 10px rgba(0, 0, 0, 0.2)', 'important');
            
            console.log("✅ Fixed game controls");
        } else {
            console.log("⚠️ Game controls element not found");
        }
    }
    
    // ---------------
    // 4. Create UI Debug Helper
    // ---------------
    function createDebugHelper() {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = "UI Debug";
        debugBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #8b5d33;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        debugBtn.addEventListener('click', function() {
            // Apply all fixes again
            fixNavigation();
            fixGameControls();
            
            // Show debug info
            alert("UI Fix Applied! Current tab: " + 
                  (typeof NavigationSystem !== 'undefined' ? NavigationSystem.getActiveTab() : "unknown") +
                  "\nTotal panels found: " + document.querySelectorAll('[id$="-panel"]').length +
                  "\nVisible panels: " + document.querySelectorAll('[id$="-panel"][style*="block"]').length);
        });
        
        document.body.appendChild(debugBtn);
        console.log("✅ Added UI debug helper button");
    }

    // Run all fixes
    addFixStyles();
    fixNavigation();
    fixGameControls();
    createDebugHelper();
    
    console.log("All UI fixes applied successfully!");
})();
