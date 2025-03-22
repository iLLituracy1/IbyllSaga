/**
 * Viking Legacy - Military Panel Update
 * Enhances the Military Panel to display faction armies information
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
    console.log("Enhancing Military Panel with faction army information...");
    
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
    
    // Create or update the UI elements
    enhanceMilitaryPanelUI();
    
    console.log("Military Panel enhanced successfully");
}

/**
 * Enhance the Military Panel UI with faction armies section
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
    
    // Add CSS for faction armies
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
    `;
    
    document.head.appendChild(style);
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
                </div>
            </div>
        `;
    });
    
    factionArmiesList.innerHTML = armiesHTML;
}
