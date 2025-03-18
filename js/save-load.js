/**
 * Viking Legacy - Save & Load System
 * Handles saving and loading game state to/from localStorage
 */

const SaveLoadSystem = (function() {
    // Maximum number of save slots
    const MAX_SAVE_SLOTS = 10;
    
    // Auto-save interval (minutes)
    const AUTO_SAVE_INTERVAL = 5;
    
    // Auto-save timer reference
    let autoSaveTimer = null;
    
    // Save metadata for UI display
    let saveMetadata = [];
    
    // Track if a save/load operation is in progress
    let operationInProgress = false;
    
    /**
     * Save the current game state
     * @param {string} [saveName] - Custom name for the save
     * @param {boolean} [isAutoSave=false] - Whether this is an auto-save
     * @returns {Object} - Result of the save operation
     */
    function saveGame(saveName, isAutoSave = false) {
        try {
            // Prevent multiple simultaneous operations
            if (operationInProgress) {
                return { success: false, message: "Another save/load operation is in progress" };
            }
            
            operationInProgress = true;
            
            // Get current game state
            const gameState = GameEngine.getGameState();
            
            // Check if game is over
            if (typeof GameOverSystem !== 'undefined' && GameOverSystem.isGameOver()) {
                return { success: false, message: "Cannot save after game over" };
            }
            
            // Generate save ID and name
            const saveId = `vl_save_${Date.now()}`;
            
            // Format the save date
            const saveDate = new Date();
            const formattedDate = `${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}`;
            
            // Default save name if not provided
            const defaultName = isAutoSave ? 
                `Auto-save (Year ${gameState.date.year}, Day ${gameState.date.day})` : 
                `${gameState.date.season} - Year ${gameState.date.year}, Day ${gameState.date.day}`;
            
            const actualSaveName = saveName || defaultName;
            
            // Create save metadata
            const metadata = {
                id: saveId,
                name: actualSaveName,
                date: formattedDate,
                gameDate: { ...gameState.date },
                isAutoSave: isAutoSave,
                population: gameState.population.total,
                rank: RankManager.getCurrentRank().title,
                fame: RankManager.getCurrentFame(),
                timestamp: Date.now()
            };
            
            // Prepare full save data
            const saveData = {
                metadata: metadata,
                gameState: gameState
            };
            
            // Serialize to JSON
            const serializedData = JSON.stringify(saveData);
            
            // Save to localStorage
            localStorage.setItem(saveId, serializedData);
            
            // Update save metadata list
            updateSaveMetadata();
            
            // Enforce max save slots limit
            enforceSaveLimit();
            
            // Log success
            Utils.log(isAutoSave ? "Game auto-saved." : "Game saved successfully!", "success");
            
            operationInProgress = false;
            return { success: true, saveId: saveId };
            
        } catch (error) {
            console.error("Error saving game:", error);
            operationInProgress = false;
            return { success: false, message: "Failed to save game: " + error.message };
        }
    }
    
    /**
     * Load a saved game
     * @param {string} saveId - ID of the save to load
     * @returns {Object} - Result of the load operation
     */
    function loadGame(saveId) {
        try {
            // Prevent multiple simultaneous operations
            if (operationInProgress) {
                return { success: false, message: "Another save/load operation is in progress" };
            }
            
            operationInProgress = true;
            
            // Get save data from localStorage
            const serializedData = localStorage.getItem(saveId);
            
            if (!serializedData) {
                operationInProgress = false;
                return { success: false, message: "Save data not found" };
            }
            
            // Parse saved data
            const saveData = JSON.parse(serializedData);
            
            if (!saveData || !saveData.gameState) {
                operationInProgress = false;
                return { success: false, message: "Invalid save data format" };
            }
            
            // Pause the game while loading
            if (GameEngine.isGameRunning()) {
                GameEngine.pauseGame();
            }
            
            // Reset the game state (this is a simplified approach - a full implementation
            // would need to properly restore each system's state)
            resetGameState();
            
            // Restore game state
            restoreGameState(saveData.gameState);
            
            // Log success
            Utils.log(`Game loaded: ${saveData.metadata.name}`, "success");
            
            operationInProgress = false;
            return { success: true };
            
        } catch (error) {
            console.error("Error loading game:", error);
            operationInProgress = false;
            return { success: false, message: "Failed to load game: " + error.message };
        }
    }
    
    /**
     * Reset the game state before loading
     * This ensures a clean slate for loading saved data
     */
    function resetGameState() {
        // This is a simplified version - a full implementation would need to
        // properly reset each system
        
        // Pause game if running
        if (GameEngine.isGameRunning()) {
            GameEngine.pauseGame();
        }
        
        // Clear UI
        Utils.log("Preparing to load saved game...", "important");
        
        // Each module needs to be properly reset
        if (typeof ResourceManager !== 'undefined' && ResourceManager.reset) {
            ResourceManager.reset();
        }
        
        if (typeof PopulationManager !== 'undefined' && PopulationManager.reset) {
            PopulationManager.reset();
        }
        
        if (typeof BuildingSystem !== 'undefined' && BuildingSystem.reset) {
            BuildingSystem.reset();
        }
        
        if (typeof LandManager !== 'undefined' && LandManager.reset) {
            LandManager.reset();
        }
        
        if (typeof WorldMap !== 'undefined' && WorldMap.reset) {
            WorldMap.reset();
        }
        
        if (typeof RankManager !== 'undefined' && RankManager.reset) {
            RankManager.reset();
        }
    }
    
    /**
     * Restore game state from saved data
     * @param {Object} savedState - Saved game state
     */
    function restoreGameState(savedState) {
        // Restore resources
        if (savedState.resources && typeof ResourceManager !== 'undefined') {
            // Reset resources first
            if (ResourceManager.setResources) {
                ResourceManager.setResources(savedState.resources);
            }
        }
        
        // Restore population and characters
        if (savedState.population && typeof PopulationManager !== 'undefined') {
            if (PopulationManager.restorePopulation) {
                PopulationManager.restorePopulation(savedState.population);
            }
            
            if (PopulationManager.restoreCharacters && savedState.characters) {
                PopulationManager.restoreCharacters(savedState.characters);
            }
        }
        
        // Restore buildings
        if (savedState.buildings && typeof BuildingSystem !== 'undefined') {
            if (BuildingSystem.restoreBuildings) {
                BuildingSystem.restoreBuildings(savedState.buildings);
            }
        }
        
        // Restore land data
        if (savedState.landData && typeof LandManager !== 'undefined') {
            if (LandManager.restoreLandData) {
                LandManager.restoreLandData(savedState.landData);
            }
        }
        
        // Restore world data
        if (savedState.playerRegion && typeof WorldMap !== 'undefined') {
            if (WorldMap.restoreWorldData) {
                WorldMap.restoreWorldData({
                    playerRegion: savedState.playerRegion,
                    playerSettlement: savedState.playerSettlement,
                    worldOverview: savedState.worldOverview
                });
            }
        }
        
        // Restore date
        if (savedState.date && typeof GameEngine !== 'undefined' && GameEngine.setDate) {
            GameEngine.setDate(savedState.date);
        }
        
        // Update UI after restoration
        refreshAllUI();
    }
    
    /**
     * Refresh all UI components after loading a game
     */
    function refreshAllUI() {
        // Each module needs to update its UI
        if (typeof ResourceManager !== 'undefined' && ResourceManager.refreshResourceUI) {
            ResourceManager.refreshResourceUI();
        }
        
        if (typeof PopulationManager !== 'undefined' && PopulationManager.updatePopulationUI) {
            PopulationManager.updatePopulationUI();
        }
        
        if (typeof BuildingSystem !== 'undefined' && BuildingSystem.updateBuildingUI) {
            BuildingSystem.updateBuildingUI();
        }
        
        if (typeof LandManager !== 'undefined' && LandManager.updateLandUI) {
            LandManager.updateLandUI();
        }
        
        if (typeof WorldMap !== 'undefined' && WorldMap.updateUI) {
            WorldMap.updateUI();
        }
        
        if (typeof StatisticsPanel !== 'undefined' && StatisticsPanel.update) {
            StatisticsPanel.update();
        }
        
        if (typeof NavigationSystem !== 'undefined' && NavigationSystem.refreshPanels) {
            NavigationSystem.refreshPanels();
        }
    }
    
    /**
     * Delete a saved game
     * @param {string} saveId - ID of the save to delete
     * @returns {boolean} - Whether the deletion was successful
     */
    function deleteSave(saveId) {
        try {
            localStorage.removeItem(saveId);
            updateSaveMetadata();
            return true;
        } catch (error) {
            console.error("Error deleting save:", error);
            return false;
        }
    }
    
    /**
     * Update the save metadata list with all available saves
     */
    function updateSaveMetadata() {
        saveMetadata = [];
        
        // Check all localStorage keys for saves
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith('vl_save_')) {
                try {
                    const serializedData = localStorage.getItem(key);
                    const saveData = JSON.parse(serializedData);
                    
                    if (saveData && saveData.metadata) {
                        saveMetadata.push(saveData.metadata);
                    }
                } catch (error) {
                    console.warn(`Error parsing save metadata for ${key}:`, error);
                }
            }
        }
        
        // Sort by timestamp (newest first)
        saveMetadata.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Enforce the maximum number of save slots
     * Removes the oldest saves if we have too many
     */
    function enforceSaveLimit() {
        // Skip if we have fewer saves than the limit
        if (saveMetadata.length <= MAX_SAVE_SLOTS) {
            return;
        }
        
        // Determine how many saves to remove
        const savesToRemove = saveMetadata.length - MAX_SAVE_SLOTS;
        
        // Delete oldest saves (they are already sorted newest-first)
        for (let i = 0; i < savesToRemove; i++) {
            if (i + MAX_SAVE_SLOTS < saveMetadata.length) {
                const oldSave = saveMetadata[i + MAX_SAVE_SLOTS];
                // Don't delete auto-saves unless we have to
                if (!oldSave.isAutoSave || i === savesToRemove - 1) {
                    deleteSave(oldSave.id);
                }
            }
        }
        
        // Update metadata after deletions
        updateSaveMetadata();
    }
    
    /**
     * Create and display the save dialog
     */
    function showSaveDialog() {
        // Pause the game while dialog is open
        const wasRunning = GameEngine.isGameRunning();
        if (wasRunning) {
            GameEngine.pauseGame();
        }
        
        // Create save dialog
        const saveDialog = document.createElement('div');
        saveDialog.className = 'save-load-modal';
        
        // Create content
        saveDialog.innerHTML = `
            <div class="save-load-content">
                <h2>Save Game</h2>
                
                <div class="save-form">
                    <div class="save-name-field">
                        <label for="save-name">Save Name:</label>
                        <input type="text" id="save-name" placeholder="Enter save name (optional)">
                    </div>
                    
                    <div class="save-buttons">
                        <button id="btn-save-confirm" class="save-load-btn">Save Game</button>
                        <button id="btn-save-cancel" class="save-load-btn secondary">Cancel</button>
                    </div>
                </div>
                
                <div class="save-slots">
                    <h3>Existing Saves (${saveMetadata.length}/${MAX_SAVE_SLOTS})</h3>
                    <div class="slots-container" id="save-slots-list">
                        ${saveMetadata.length > 0 ? '' : '<p>No saved games found.</p>'}
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(saveDialog);
        
        // Add CSS if not already added
        addSaveLoadStyles();
        
        // Populate save slots
        const saveSlotsList = document.getElementById('save-slots-list');
        if (saveSlotsList && saveMetadata.length > 0) {
            saveMetadata.forEach(save => {
                const saveSlot = document.createElement('div');
                saveSlot.className = `save-slot ${save.isAutoSave ? 'auto-save' : ''}`;
                saveSlot.dataset.saveId = save.id;
                
                saveSlot.innerHTML = `
                    <div class="save-info">
                        <div class="save-name">${save.name}</div>
                        <div class="save-game-date">Year ${save.gameDate.year}, Day ${save.gameDate.day} (${save.gameDate.season})</div>
                        <div class="save-real-date">${save.date}</div>
                    </div>
                    <div class="save-stats">
                        <div class="save-population">Population: ${save.population}</div>
                        <div class="save-rank">Rank: ${save.rank}</div>
                    </div>
                    <div class="save-actions">
                        <button class="btn-overwrite-save" data-save-id="${save.id}">Overwrite</button>
                        <button class="btn-delete-save" data-save-id="${save.id}">Delete</button>
                    </div>
                `;
                
                saveSlotsList.appendChild(saveSlot);
            });
            
            // Add event listeners to save action buttons
            document.querySelectorAll('.btn-overwrite-save').forEach(btn => {
                btn.addEventListener('click', function() {
                    const saveId = this.dataset.saveId;
                    const save = saveMetadata.find(s => s.id === saveId);
                    
                    if (save) {
                        // Confirm overwrite
                        if (confirm(`Are you sure you want to overwrite "${save.name}"?`)) {
                            // Delete old save
                            deleteSave(saveId);
                            
                            // Save with same name
                            saveGame(save.name);
                            
                            // Close dialog
                            document.body.removeChild(saveDialog);
                            
                            // Resume game if it was running
                            if (wasRunning) {
                                GameEngine.startGame();
                            }
                        }
                    }
                });
            });
            
            document.querySelectorAll('.btn-delete-save').forEach(btn => {
                btn.addEventListener('click', function() {
                    const saveId = this.dataset.saveId;
                    const save = saveMetadata.find(s => s.id === saveId);
                    
                    if (save) {
                        // Confirm deletion
                        if (confirm(`Are you sure you want to delete "${save.name}"?`)) {
                            // Delete save
                            deleteSave(saveId);
                            
                            // Close and reopen dialog to refresh
                            document.body.removeChild(saveDialog);
                            showSaveDialog();
                        }
                    }
                });
            });
        }
        
        // Add event listeners for buttons
        document.getElementById('btn-save-confirm').addEventListener('click', function() {
            const saveName = document.getElementById('save-name').value.trim();
            
            // Save the game
            saveGame(saveName || '');
            
            // Close dialog
            document.body.removeChild(saveDialog);
            
            // Resume game if it was running
            if (wasRunning) {
                GameEngine.startGame();
            }
        });
        
        document.getElementById('btn-save-cancel').addEventListener('click', function() {
            // Close dialog
            document.body.removeChild(saveDialog);
            
            // Resume game if it was running
            if (wasRunning) {
                GameEngine.startGame();
            }
        });
        
        // Focus the save name input
        document.getElementById('save-name').focus();
    }
    
    /**
     * Create and display the load dialog
     */
    function showLoadDialog() {
        // Update save metadata to ensure we have the latest
        updateSaveMetadata();
        
        // Skip if no saves exist
        if (saveMetadata.length === 0) {
            alert("No saved games found.");
            return;
        }
        
        // Pause the game while dialog is open
        const wasRunning = GameEngine.isGameRunning();
        if (wasRunning) {
            GameEngine.pauseGame();
        }
        
        // Create load dialog
        const loadDialog = document.createElement('div');
        loadDialog.className = 'save-load-modal';
        
        // Create content
        loadDialog.innerHTML = `
            <div class="save-load-content">
                <h2>Load Game</h2>
                
                <div class="load-warning">
                    <p>Loading a saved game will replace your current progress.</p>
                </div>
                
                <div class="save-slots">
                    <h3>Available Saves (${saveMetadata.length})</h3>
                    <div class="slots-container" id="load-slots-list">
                    </div>
                </div>
                
                <div class="load-buttons">
                    <button id="btn-load-cancel" class="save-load-btn secondary">Cancel</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(loadDialog);
        
        // Add CSS if not already added
        addSaveLoadStyles();
        
        // Populate load slots
        const loadSlotsList = document.getElementById('load-slots-list');
        if (loadSlotsList) {
            saveMetadata.forEach(save => {
                const saveSlot = document.createElement('div');
                saveSlot.className = `save-slot ${save.isAutoSave ? 'auto-save' : ''}`;
                saveSlot.dataset.saveId = save.id;
                
                saveSlot.innerHTML = `
                    <div class="save-info">
                        <div class="save-name">${save.name}</div>
                        <div class="save-game-date">Year ${save.gameDate.year}, Day ${save.gameDate.day} (${save.gameDate.season})</div>
                        <div class="save-real-date">${save.date}</div>
                    </div>
                    <div class="save-stats">
                        <div class="save-population">Population: ${save.population}</div>
                        <div class="save-rank">Rank: ${save.rank}</div>
                    </div>
                    <div class="save-actions">
                        <button class="btn-load-save" data-save-id="${save.id}">Load</button>
                        <button class="btn-delete-save" data-save-id="${save.id}">Delete</button>
                    </div>
                `;
                
                loadSlotsList.appendChild(saveSlot);
            });
            
            // Add event listeners to load action buttons
            document.querySelectorAll('.btn-load-save').forEach(btn => {
                btn.addEventListener('click', function() {
                    const saveId = this.dataset.saveId;
                    const save = saveMetadata.find(s => s.id === saveId);
                    
                    if (save) {
                        // Confirm load
                        if (confirm(`Are you sure you want to load "${save.name}"? Your current progress will be lost.`)) {
                            // Close dialog
                            document.body.removeChild(loadDialog);
                            
                            // Load the game
                            const result = loadGame(saveId);
                            
                            if (!result.success) {
                                alert(`Failed to load game: ${result.message}`);
                            }
                        }
                    }
                });
            });
            
            document.querySelectorAll('.btn-delete-save').forEach(btn => {
                btn.addEventListener('click', function() {
                    const saveId = this.dataset.saveId;
                    const save = saveMetadata.find(s => s.id === saveId);
                    
                    if (save) {
                        // Confirm deletion
                        if (confirm(`Are you sure you want to delete "${save.name}"?`)) {
                            // Delete save
                            deleteSave(saveId);
                            
                            // Close and reopen dialog to refresh
                            document.body.removeChild(loadDialog);
                            showLoadDialog();
                        }
                    }
                });
            });
        }
        
        // Add event listener for cancel button
        document.getElementById('btn-load-cancel').addEventListener('click', function() {
            // Close dialog
            document.body.removeChild(loadDialog);
            
            // Resume game if it was running
            if (wasRunning) {
                GameEngine.startGame();
            }
        });
    }
    
    /**
     * Add CSS styles for save/load dialogs
     */
    function addSaveLoadStyles() {
        // Check if styles already exist
        if (document.getElementById('save-load-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'save-load-styles';
        styleEl.textContent = `
            .save-load-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1500;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .save-load-content {
                background-color: #f7f0e3;
                border-radius: 8px;
                padding: 25px;
                max-width: 700px;
                width: 90%;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.4);
                border: 2px solid #8b5d33;
                max-height: 90vh;
                overflow-y: auto;
                background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c4zIgLAAABklJREFUOI3tmleWpDAMRVNEJOccX/9bebfvEFrV3TO/mRpOCUklqWpD+H9pGP7m5SFUg/yAQvKa+5+QHiIlIT6E9YF4re1v0DBX9l+gjNA/IHb9KsiHkFJC5A9EbvoRkcsSIZv5EZH+8+5n5G9E7dTPyN+I7PWPCL81hPkRERvCFLY+EdvkWaYwer5bCFMap3zIeSmFKULWm5R55X6SBLM8YQa3JYTNnlBeIj9kKGgQJdgfE0HTvN0G6OWJ3CgUDKWQI0Ih3GWL9eCnhIjkC33ZU64jRxI/lYlkfpQ7BUdqGEqGEilUz+dChDRy5nY50CHXpmVD0iJ3lPtHsjBNpTtJ0jhBQYVJEq+x+6P3RJIz0tiVqEzTJL4W0yQl15WYJZrGceol49TLQDLJkmyf/KDayBKhKFw2iR3qIrFErK4kXuEK/iR27vBUFNFKsMSu9GLGqbcgrsgdBskrkPDjBEi8MhMhiwgkP6RowSn4iQc5WoWQu3GiGhC7M0kDxO50j/hIgEQbIa4I+kUhVLgiVIkg7ynW2sgBUYrYDa3plkAQ5/NYEeCQJ8iMIHJBEDl+Efk8YYohbGbvCfC28YbkT2KTzJ8uRvwklLj3iM5uRNzeCBGFZZG4d0v9JEDwcr8ieO5KEYWAYGkQMX4SvUWE/CT8b0fE3G4uyHF9CrK4OxfDESJ+RARJNB6Dj1QOCQlfNRG7PY/YCc85RnxFPKAOyCKu53KvI0QghCiqq+J4nA1HmCrHUZVF1ScJWfq3FbEzKmzJQbWQ/P7n/1OGqx0yNE4YFd7zP2M4RE6ZQyLsHs9nVfFSCx3N8xQFTzZR8CaKlE9TJH2a7C4X4uV9ieIlilfEjyl8S8q3pnhryreofMvKt658G/A24W3B25K3BW8r3la8rXnb8HbD2w1vt7zdUh/yDGcDz3Ceocs84DPP8Bmf8Rmf8Rmf6TO+gC/gC/gCvoAv4Ev4Er6EL+FL+BK+gq/gK/gKvoKv4Gv4Gr6Gr+Fr+Aa+gW/gG/gGvoFv4Vv4Fr6Fb+Fb+A6+g+/gO/gOvoPv4Xv4Hr6H7+EH+AF+gB/gh7+f/gfmv3D+C+e/cP4L579w/gvnv3D+C+e/cP6L4L8I/ovgvwj+i+C/CP6L4L8I/ovgvwj+i+S/SP6L5L9I/ovkv0j+i+S/SP6L5L9I/ovivyj+i+K/KP6L4r8o/ovivyj+i+K/KP6L5r9o/ovmv2j+i+a/aP6L5r9o/ovmv2j+i+G/GP6L4b8Y/ovhvxj+i+G/GP6L4b8Y/ovlv1j+i+W/WP6L5b9Y/ovlv1j+i+W/WP6L474a');
            }
            
            .save-load-content h2 {
                color: #5d4037;
                margin-top: 0;
                font-size: 1.6rem;
                border-bottom: 2px solid #8b5d33;
                padding-bottom: 10px;
                margin-bottom: 20px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
            }
            
            .save-load-content h3 {
                color: #5d4037;
                margin-top: 10px;
                font-size: 1.2rem;
                margin-bottom: 15px;
            }
            
            .save-form {
                margin-bottom: 20px;
            }
            
            .save-name-field {
                margin-bottom: 15px;
            }
            
            .save-name-field label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #5d4037;
            }
            
            .save-name-field input {
                width: 100%;
                padding: 10px;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                background-color: #fff;
                font-size: 1rem;
            }
            
            .save-buttons, .load-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 15px;
            }
            
            .save-load-btn {
                background: linear-gradient(to bottom, #8b5d33, #6d4c2a);
                color: #f7f0e3;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
                font-size: 1rem;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                border: 1px solid #5d4027;
            }
            
            .save-load-btn:hover {
                background: linear-gradient(to bottom, #a97c50, #8b5d33);
                transform: translateY(-1px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
            }
            
            .save-load-btn:active {
                transform: translateY(1px);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
            }
            
            .save-load-btn.secondary {
                background: linear-gradient(to bottom, #a99c8a, #8c8275);
                border: 1px solid #7a7064;
            }
            
            .save-load-btn.secondary:hover {
                background: linear-gradient(to bottom, #bfb3a1, #a99c8a);
            }
            
            .save-slots {
                margin-top: 20px;
            }
            
            .slots-container {
                max-height: 400px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .save-slot {
                background-color: #fff;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid #8b5d33;
                transition: all 0.2s;
            }
            
            .save-slot:hover {
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
            
            .save-slot.auto-save {
                border-left-color: #2196f3;
            }
            
            .save-slot.auto-save::before {
                content: "AUTO";
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 0.7rem;
                background-color: #2196f3;
                color: white;
                padding: 2px 5px;
                border-radius: 3px;
            }
            
            .save-info {
                flex: 2;
            }
            
            .save-name {
                font-weight: bold;
                margin-bottom: 5px;
                color: #5d4037;
            }
            
            .save-game-date {
                font-size: 0.9rem;
                color: #8b5d33;
                margin-bottom: 3px;
            }
            
            .save-real-date {
                font-size: 0.8rem;
                color: #8b7355;
            }
            
            .save-stats {
                flex: 1;
                text-align: center;
                font-size: 0.9rem;
                color: #5d4037;
            }
            
            .save-actions {
                display: flex;
                gap: 5px;
            }
            
            .save-actions button {
                padding: 5px 10px;
                font-size: 0.9rem;
                background-color: #f7f0e3;
                border: 1px solid #c9ba9b;
                color: #5d4037;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .save-actions button:hover {
                background-color: #e6d8c3;
            }
            
            .btn-load-save, .btn-overwrite-save {
                border-color: #8b5d33 !important;
                background-color: #f0e2c9 !important;
            }
            
            .btn-delete-save {
                border-color: #c62828 !important;
                color: #c62828 !important;
            }
            
            .btn-delete-save:hover {
                background-color: #ffebee !important;
            }
            
            .load-warning {
                background-color: #fff3e0;
                border-left: 4px solid #ff9800;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            
            .load-warning p {
                margin: 0;
                color: #e65100;
            }
            
            .game-control-save-load {
                margin-left: auto !important;
            }
            
            @media (max-width: 600px) {
                .save-slot {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .save-stats {
                    text-align: left;
                    margin: 10px 0;
                }
                
                .save-actions {
                    width: 100%;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Add save/load buttons to game controls
     */
    function addSaveLoadControls() {
        // Get game controls container
        const gameControls = document.querySelector('.game-controls');
        if (!gameControls) {
            console.warn("Game controls not found, can't add save/load buttons");
            return;
        }
        
        // Create container for save/load buttons
        const saveLoadContainer = document.createElement('div');
        saveLoadContainer.className = 'game-control-save-load';
        
        // Add save and load buttons
        saveLoadContainer.innerHTML = `
            <button id="btn-save-game" title="Save Game">Save</button>
            <button id="btn-load-game" title="Load Game">Load</button>
        `;
        
        // Add to game controls
        gameControls.appendChild(saveLoadContainer);
        
        // Add event listeners
        document.getElementById('btn-save-game').addEventListener('click', function() {
            showSaveDialog();
        });
        
        document.getElementById('btn-load-game').addEventListener('click', function() {
            showLoadDialog();
        });
    }
    
    /**
     * Start auto-save timer
     */
    function startAutoSaveTimer() {
        // Clear existing timer if any
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        
        // Set up new timer (convert minutes to milliseconds)
        autoSaveTimer = setInterval(function() {
            // Only auto-save if game is running
            if (GameEngine.isGameRunning()) {
                saveGame(null, true); // Auto-save
            }
        }, AUTO_SAVE_INTERVAL * 60 * 1000);
        
        console.log(`Auto-save timer started (${AUTO_SAVE_INTERVAL} minutes)`);
    }
    
    /**
     * Check if any saved games exist
     * @returns {boolean} - Whether saved games exist
     */
    function hasSavedGames() {
        updateSaveMetadata();
        return saveMetadata.length > 0;
    }
    
    // Public API
    return {
        /**
         * Initialize the save/load system
         */
        init: function() {
            console.log("Initializing Save/Load System...");
            
            // Update save metadata
            updateSaveMetadata();
            
            // Add CSS styles
            addSaveLoadStyles();
            
            // Add save/load controls to game UI
            addSaveLoadControls();
            
            // Start auto-save timer
            startAutoSaveTimer();
            
            console.log("Save/Load System initialized");
            console.log(`Found ${saveMetadata.length} existing saves`);
        },
        
        /**
         * Save the current game
         * @param {string} [saveName] - Custom name for the save
         * @param {boolean} [isAutoSave=false] - Whether this is an auto-save
         * @returns {Object} - Result of the save operation
         */
        saveGame: function(saveName, isAutoSave = false) {
            return saveGame(saveName, isAutoSave);
        },
        
        /**
         * Load a saved game
         * @param {string} saveId - ID of the save to load
         * @returns {Object} - Result of the load operation
         */
        loadGame: function(saveId) {
            return loadGame(saveId);
        },
        
        /**
         * Delete a saved game
         * @param {string} saveId - ID of the save to delete
         * @returns {boolean} - Whether the deletion was successful
         */
        deleteSave: function(saveId) {
            return deleteSave(saveId);
        },
        
        /**
         * Show the save dialog
         */
        showSaveDialog: function() {
            showSaveDialog();
        },
        
        /**
         * Show the load dialog
         */
        showLoadDialog: function() {
            showLoadDialog();
        },
        
        /**
         * Get save metadata
         * @returns {Array} - Array of save metadata objects
         */
        getSaveMetadata: function() {
            updateSaveMetadata();
            return [...saveMetadata];
        },
        
        /**
         * Check if any saved games exist
         * @returns {boolean} - Whether saved games exist
         */
        hasSavedGames: function() {
            return hasSavedGames();
        },
        
        /**
         * Change auto-save interval
         * @param {number} minutes - New interval in minutes
         */
        setAutoSaveInterval: function(minutes) {
            // Validate input
            if (typeof minutes !== 'number' || minutes <= 0) {
                console.error("Invalid auto-save interval:", minutes);
                return;
            }
            
            // Update interval
            AUTO_SAVE_INTERVAL = minutes;
            
            // Restart timer
            startAutoSaveTimer();
            
            console.log(`Auto-save interval updated to ${minutes} minutes`);
        },
        
        /**
         * Enable or disable auto-save
         * @param {boolean} enabled - Whether auto-save should be enabled
         */
        setAutoSaveEnabled: function(enabled) {
            if (enabled) {
                startAutoSaveTimer();
            } else {
                clearInterval(autoSaveTimer);
                autoSaveTimer = null;
                console.log("Auto-save disabled");
            }
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        SaveLoadSystem.init();
    }, 1000);
});