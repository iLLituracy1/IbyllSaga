/**
 * Viking Legacy - Military Panel Update
 * Enhances the Military Panel to display faction armies information and debug data
 */

// Wait for both MilitaryPanel and FactionArmySystem to be available
document.addEventListener('DOMContentLoaded', function() {
    const waitForSystems = setInterval(function() {
        if (typeof MilitaryPanel !== 'undefined' && 
            typeof FactionArmySystem !== 'undefined') {
            clearInterval(waitForSystems);
            
            // Enhance the military panel with faction army information
            enhanceMilitaryPanel();
        }
    }, 500);
});

/**
 * Enhance the Military Panel with faction army information
 */
function enhanceMilitaryPanel() {
    console.log("Enhancing Military Panel with faction army information and debug tools...");
    
    // Store original update method
    const originalUpdate = MilitaryPanel.update;
    
    // Override update method to include faction armies
    MilitaryPanel.update = function() {
        // Call original update first
        originalUpdate.call(this);
        
        // Then update faction armies info
        updateFactionArmiesInfo();
    };
    
    // Add a new method to show faction armies
    MilitaryPanel.showFactionArmies = function() {
        updateFactionArmiesInfo();
    };
    
    // Add debug methods
    MilitaryPanel.refreshFactionDebug = function() {
        updateFactionDebugInfo();
    };
    
    // Create or update the UI elements
    enhanceMilitaryPanelUI();
    
    console.log("Military Panel enhanced successfully");
}

/**
 * Enhance the Military Panel UI with faction armies section and debug tools
 */
function enhanceMilitaryPanelUI() {
    // Check if the Military Panel exists
    const militaryPanel = document.getElementById('military-panel');
    if (!militaryPanel) return;
    
    // Check if battles section exists
    const battlesSection = document.getElementById('military-battles');
    if (!battlesSection) return;
    
    // Add faction armies section to battles view
    const factionArmiesSection = document.createElement('div');
    factionArmiesSection.id = 'faction-armies-section';
    factionArmiesSection.innerHTML = `
        <h4>Faction Armies</h4>
        <div id="faction-armies-list" class="faction-armies-list">
            <div class="empty-list">No known faction armies.</div>
        </div>
    `;
    
    // Insert after the battles list
    const battlesList = document.getElementById('battles-list');
    if (battlesList) {
        battlesList.after(factionArmiesSection);
    } else {
        battlesSection.appendChild(factionArmiesSection);
    }
    
    // Add debug section
    const debugSection = document.createElement('div');
    debugSection.id = 'faction-debug-section';
    debugSection.className = 'section';
    debugSection.innerHTML = `
        <div class="section-header">
            <h3>Faction System Debug</h3>
            <button id="refresh-debug-btn" class="small-btn">Refresh</button>
        </div>
        <div id="faction-debug-info" class="debug-info">
            <p>Loading debug information...</p>
        </div>
        <div class="debug-controls">
            <button id="test-faction-response-btn" class="small-btn">Test Faction Response</button>
            <button id="create-test-army-btn" class="small-btn">Create Test Army</button>
        </div>
    `;
    
    // Add debug section to panel
    militaryPanel.appendChild(debugSection);
    
    // Set up event listeners for debug buttons
    document.getElementById('refresh-debug-btn').addEventListener('click', function() {
        updateFactionDebugInfo();
    });
    
    document.getElementById('test-faction-response-btn').addEventListener('click', function() {
        testFactionResponse();
    });
    
    document.getElementById('create-test-army-btn').addEventListener('click', function() {
        createTestArmy();
    });
    
    // Add CSS for faction armies and debug section
    const style = document.createElement('style');
    style.id = 'faction-armies-styles';
    style.textContent = `
        .faction-armies-list {
            margin-top: 15px;
        }
        
        .faction-army-item {
            background-color: #fff;
            border-radius: 6px;
            margin-bottom: 10px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #8b5d33;
        }
        
        .faction-army-item.norse {
            border-left-color: #b71c1c;
        }
        
        .faction-army-item.anglo-saxon {
            border-left-color: #1565c0;
        }
        
        .faction-army-item.frankish {
            border-left-color: #6a1b9a;
        }
        
        .faction-army-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            border-bottom: 1px solid #e6d8c3;
            padding-bottom: 8px;
        }
        
        .faction-army-name {
            font-weight: 600;
            color: #5d4037;
        }
        
        .faction-army-faction {
            font-size: 0.9rem;
            color: #8b7355;
        }
        
        .faction-army-status {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.9rem;
            background-color: #e6d8c3;
        }
        
        .faction-army-details {
            margin-bottom: 12px;
        }
        
        .status-marching .faction-army-status {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        
        .status-defending .faction-army-status {
            background-color: #e3f2fd;
            color: #1565c0;
        }
        
        .status-battling .faction-army-status {
            background-color: #ffebee;
            color: #c62828;
        }
        
        .status-disbanding .faction-army-status {
            background-color: #fff8e1;
            color: #ff8f00;
        }
        
        /* Debug styles */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .debug-info {
            background-color: #f5f5f5;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
        
        .debug-controls {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        
        .small-btn {
            background-color: #795548;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .small-btn:hover {
            background-color: #5d4037;
        }
        
        .debug-group {
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
        }
        
        .debug-group-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .debug-item {
            margin-left: 10px;
            line-height: 1.4;
        }
    `;
    
    document.head.appendChild(style);
    
    // Initialize debug info
    updateFactionDebugInfo();
}

/**
 * Update the faction armies information in the UI
 */
function updateFactionArmiesInfo() {
    // Get faction armies list element
    const factionArmiesList = document.getElementById('faction-armies-list');
    if (!factionArmiesList) return;
    
    // Get all faction armies
    const factionArmies = FactionArmySystem.getFactionArmies();
    
    // If no faction armies, show empty message
    if (factionArmies.length === 0) {
        factionArmiesList.innerHTML = '<div class="empty-list">No known faction armies.</div>';
        return;
    }
    
    // Create HTML for each faction army
    let armiesHTML = '';
    
    factionArmies.forEach(army => {
        // Skip disbanded armies
        if (army.status === "disbanded") return;
        
        // Get faction information
        const faction = FactionIntegration.getFactionById(army.factionId);
        if (!faction) return;
        
        // Get region name
        const region = WorldMap.getRegion(army.currentRegionId);
        const regionName = region ? region.name : "Unknown Region";
        
        // Determine faction CSS class
        let factionClass = '';
        if (faction.type === 'NORSE') factionClass = 'norse';
        else if (faction.type === 'ANGLO_SAXON') factionClass = 'anglo-saxon';
        else if (faction.type === 'FRANKISH') factionClass = 'frankish';
        
        // Format status text
        const statusText = army.status.charAt(0).toUpperCase() + army.status.slice(1);
        
        armiesHTML += `
            <div class="faction-army-item status-${army.status} ${factionClass}">
                <div class="faction-army-header">
                    <div class="faction-army-name">${army.name}</div>
                    <div class="faction-army-status">${statusText}</div>
                </div>
                <div class="faction-army-details">
                    <div class="detail-row">
                        <div class="detail-label">Faction:</div>
                        <div class="detail-value">${faction.name}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Location:</div>
                        <div class="detail-value">${regionName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Warriors:</div>
                        <div class="detail-value">${army.warriors}</div>
                    </div>
                    ${army.targetRegionId && army.targetRegionId !== army.currentRegionId ? `
                    <div class="detail-row">
                        <div class="detail-label">Target:</div>
                        <div class="detail-value">${WorldMap.getRegion(army.targetRegionId)?.name || army.targetRegionId}</div>
                    </div>` : ''}
                    ${army.status === 'marching' ? `
                    <div class="detail-row">
                        <div class="detail-label">Progress:</div>
                        <div class="detail-value">${army.movementProgress.toFixed(1)}%</div>
                    </div>` : ''}
                </div>
            </div>
        `;
    });
    
    factionArmiesList.innerHTML = armiesHTML;
}

/**
 * Update the faction debug information
 */
function updateFactionDebugInfo() {
    const debugInfoElement = document.getElementById('faction-debug-info');
    if (!debugInfoElement) return;
    
    // Get debug information from FactionArmySystem
    let debugHTML = '<div class="debug-group">';
    
    if (typeof FactionArmySystem.getDebugInfo === 'function') {
        const debugInfo = FactionArmySystem.getDebugInfo();
        
        debugHTML += `
            <div class="debug-group-title">Faction Army System Status:</div>
            <div class="debug-item">Total Armies: ${debugInfo.armiesCount}</div>
            <div class="debug-item">Next Check: day ${debugInfo.nextArmyCheck}</div>
        `;
    } else {
        debugHTML += `
            <div class="debug-group-title">Faction Army System Status:</div>
            <div class="debug-item">Debug info method not available</div>
        `;
    }
    debugHTML += '</div>';
    
    // Get information about player expeditions
    debugHTML += '<div class="debug-group">';
    if (typeof ExpeditionSystem !== 'undefined' && typeof ExpeditionSystem.getExpeditions === 'function') {
        const playerExpeditions = ExpeditionSystem.getExpeditions('player');
        
        debugHTML += `
            <div class="debug-group-title">Player Expeditions:</div>
            <div class="debug-item">Total: ${playerExpeditions.length}</div>
        `;
        
        if (playerExpeditions.length > 0) {
            playerExpeditions.forEach(exp => {
                const regionName = WorldMap.getRegion(exp.currentRegion)?.name || 'Unknown';
                debugHTML += `
                    <div class="debug-item">
                        ${exp.name}: ${exp.status} in ${regionName}
                    </div>
                `;
            });
        }
    } else {
        debugHTML += `
            <div class="debug-group-title">Player Expeditions:</div>
            <div class="debug-item">ExpeditionSystem not available</div>
        `;
    }
    debugHTML += '</div>';
    
    // Get active faction information
    debugHTML += '<div class="debug-group">';
    if (typeof FactionIntegration !== 'undefined' && typeof FactionIntegration.getFactionData === 'function') {
        const factionData = FactionIntegration.getFactionData();
        
        debugHTML += `
            <div class="debug-group-title">Factions:</div>
            <div class="debug-item">Total: ${factionData.factions.length}</div>
            <div class="debug-item">Kingdoms: ${factionData.kingdoms.length}</div>
            <div class="debug-item">Territories: ${factionData.territories.length}</div>
        `;
    } else {
        debugHTML += `
            <div class="debug-group-title">Factions:</div>
            <div class="debug-item">FactionIntegration not available</div>
        `;
    }
    debugHTML += '</div>';
    
    debugInfoElement.innerHTML = debugHTML;
}

/**
 * Test faction response to player expedition
 */
function testFactionResponse() {
    console.log("Testing faction response to player expedition");
    
    // Get player expeditions
    if (typeof ExpeditionSystem === 'undefined' || !ExpeditionSystem.getExpeditions) {
        alert("ExpeditionSystem not available");
        return;
    }
    
    const playerExpeditions = ExpeditionSystem.getExpeditions('player');
    
    if (playerExpeditions.length === 0) {
        alert("No player expeditions found. Create an expedition first.");
        return;
    }
    
    // Get factions
    if (typeof FactionIntegration === 'undefined' || !FactionIntegration.getFactionData) {
        alert("FactionIntegration not available");
        return;
    }
    
    const factionData = FactionIntegration.getFactionData();
    
    if (factionData.factions.length === 0) {
        alert("No factions found in the world.");
        return;
    }
    
    // Force next check to happen immediately
    const gameState = GameEngine.getGameState();
    
    try {
        // Force the check to run now
        FactionArmySystem.processTick(gameState, 1);
        
        // Update UI
        updateFactionArmiesInfo();
        updateFactionDebugInfo();
        
        Utils.log("Forced faction response check", "important");
    } catch (error) {
        console.error("Error testing faction response:", error);
        alert("Error testing faction response: " + error.message);
    }
}

/**
 * Create a test faction army
 */
function createTestArmy() {
    console.log("Creating test faction army");
    
    // Get factions
    if (typeof FactionIntegration === 'undefined' || !FactionIntegration.getFactionData) {
        alert("FactionIntegration not available");
        return;
    }
    
    const factionData = FactionIntegration.getFactionData();
    
    if (factionData.factions.length === 0) {
        alert("No factions found in the world.");
        return;
    }
    
    // Get player region
    const playerRegion = WorldMap.getPlayerRegion();
    if (!playerRegion) {
        alert("Player region not found");
        return;
    }
    
    // Find a faction to use
    const faction = factionData.factions[0];
    
    // Create test army
    try {
        const army = FactionArmySystem.createFactionArmy(faction.id, playerRegion.id);
        
        if (army) {
            Utils.log(`Created test faction army: ${army.name}`, "important");
            updateFactionArmiesInfo();
            updateFactionDebugInfo();
        } else {
            alert("Failed to create test army");
        }
    } catch (error) {
        console.error("Error creating test army:", error);
        alert("Error creating test army: " + error.message);
    }
}
