/**
 * Enhanced Navigation Debug Tools
 * This script provides advanced diagnostic functions for navigation issues
 */

(function() {
    // Create the debug control panel
    function createDebugPanel() {
        // Check if panel already exists
        if (document.getElementById('nav-debug-panel')) {
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'nav-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            max-height: 200px;
            overflow: auto;
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Navigation Debugger</div>
            <div>
                <button id="btn-check-nav">Check Status</button>
                <button id="btn-fix-nav">Fix Panels</button>
                <button id="btn-close-debug">Close</button>
            </div>
            <div id="debug-output" style="margin-top: 5px; font-size: 11px;"></div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('btn-check-nav').addEventListener('click', checkNavigation);
        document.getElementById('btn-fix-nav').addEventListener('click', fixNavigation);
        document.getElementById('btn-close-debug').addEventListener('click', () => {
            panel.remove();
        });
    }
    
    // Function to check navigation system status
    function checkNavigation() {
        const output = document.getElementById('debug-output');
        if (output) {
            output.innerHTML = "Checking navigation...";
        }
        
        console.group("Navigation System Status Check");
        
        // Check NavigationSystem object
        const navSystemExists = typeof NavigationSystem !== 'undefined';
        console.log("NavigationSystem exists:", navSystemExists);
        
        let results = [`<div>NavigationSystem: ${navSystemExists ? '✅' : '❌'}</div>`];
        
        if (navSystemExists) {
            const activeTab = NavigationSystem.getActiveTab();
            console.log("Active tab:", activeTab);
            results.push(`<div>Active tab: ${activeTab}</div>`);
            
            // Get debug info if available
            if (typeof NavigationSystem.getDebugInfo === 'function') {
                const debug = NavigationSystem.getDebugInfo();
                console.log("Debug info:", debug);
                
                // Check panel registration status
                results.push(`<div>Registered panels:</div><ul>`);
                for (const [panelId, status] of Object.entries(debug.registeredPanels)) {
                    const panel = document.getElementById(panelId);
                    const statusIcon = panel ? '✅' : '❌';
                    const display = panel ? panel.style.display : 'N/A';
                    results.push(`<li>${panelId}: ${status} ${statusIcon} (${display})</li>`);
                }
                results.push(`</ul>`);
            } else {
                // Manual check of key panels
                const panels = [
                    'resources-panel', 'population-panel', 'actions-panel',
                    'log-panel', 'world-panel', 'land-panel',
                    'building-panel', 'statistics-panel'
                ];
                
                results.push(`<div>Panel visibility:</div><ul>`);
                panels.forEach(panelId => {
                    const panel = document.getElementById(panelId);
                    const statusIcon = panel ? '✅' : '❌';
                    const display = panel ? panel.style.display : 'N/A';
                    const visible = panel && NavigationSystem.isPanelVisible(panelId);
                    results.push(`<li>${panelId}: ${statusIcon} (${display}) ${visible ? '👁️' : ''}</li>`);
                });
                results.push(`</ul>`);
            }
        }
        
        console.groupEnd();
        
        // Update debug panel if it exists
        if (output) {
            output.innerHTML = results.join('');
        }
        
        return results.join('');
    }
    
    // Function to fix navigation issues
    function fixNavigation() {
        const output = document.getElementById('debug-output');
        if (output) {
            output.innerHTML = "Fixing navigation...";
        }
        
        console.group("Navigation System Fix");
        
        if (typeof NavigationSystem === 'undefined') {
            console.error("NavigationSystem not defined, cannot fix");
            if (output) {
                output.innerHTML = "Error: NavigationSystem not found";
            }
            console.groupEnd();
            return;
        }
        
        // Apply fixes
        let fixResults = [];
        
        // 1. Hide all panels first
        const allPanels = [
            'resources-panel', 'population-panel', 'actions-panel',
            'log-panel', 'world-panel', 'land-panel',
            'building-panel', 'statistics-panel'
        ];
        
        fixResults.push("<div>Step 1: Reset all panels</div>");
        allPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
                console.log(`Reset panel: ${panelId}`);
                fixResults.push(`<div>- Reset ${panelId}</div>`);
            }
        });
        
        // 2. Fix CSS styles that might interfere
        fixResults.push("<div>Step 2: Fix CSS styles</div>");
        try {
            const gameContent = document.querySelector('.game-content');
            if (gameContent) {
                gameContent.style.display = 'block';
                fixResults.push(`<div>- Fixed game-content display</div>`);
            }
            
            // Fix grid styles on panels
            allPanels.forEach(panelId => {
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.style.gridColumn = 'auto';
                    panel.style.gridRow = 'auto';
                    panel.style.position = 'relative';
                    fixResults.push(`<div>- Fixed styles for ${panelId}</div>`);
                }
            });
        } catch (e) {
            console.error("Error fixing CSS:", e);
            fixResults.push(`<div>⚠️ Error fixing CSS: ${e.message}</div>`);
        }
        
        // 3. Re-activate current tab
        fixResults.push("<div>Step 3: Reactivate current tab</div>");
        try {
            const activeTab = NavigationSystem.getActiveTab();
            console.log(`Reactivating tab: ${activeTab}`);
            fixResults.push(`<div>- Reactivating ${activeTab} tab</div>`);
            NavigationSystem.switchToTab(activeTab);
        } catch (e) {
            console.error("Error switching tab:", e);
            fixResults.push(`<div>⚠️ Error switching tab: ${e.message}</div>`);
        }
        
        // 4. Final refresh
        fixResults.push("<div>Step 4: Final refresh</div>");
        if (typeof NavigationSystem.refreshPanels === 'function') {
            NavigationSystem.refreshPanels();
            fixResults.push(`<div>- Called NavigationSystem.refreshPanels()</div>`);
        }
        
        console.groupEnd();
        
        // Update debug output
        if (output) {
            output.innerHTML = fixResults.join('') + "<div style='margin-top:10px'>Fix complete! Checking status...</div>";
            
            // Wait a moment then run a check
            setTimeout(() => {
                const statusResult = checkNavigation();
                output.innerHTML += statusResult;
            }, 500);
        }
    }
    
    // Create global debug functions
    window.checkNavigation = checkNavigation;
    window.fixNavigation = fixNavigation;
    window.showNavigationDebugger = createDebugPanel;
    
    // Auto-show debugger if URL has debug parameter
    if (window.location.search.includes('debug=true')) {
        window.addEventListener('load', function() {
            setTimeout(createDebugPanel, 1000);
        });
    }
    
    console.log("Enhanced navigation debug tools loaded. Call showNavigationDebugger() to use.");
})();
