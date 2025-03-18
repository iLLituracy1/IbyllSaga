/**
 * Viking Legacy - Game Over System
 * Handles game ending conditions, displays game over screen, and provides options to continue
 */

const GameOverSystem = (function() {
    // Game over state tracking
    let isGameOver = false;
    let gameOverReason = '';
    let finalStats = {};
    
    /**
     * Create and display the game over modal
     */
    function showGameOverScreen() {
        // Pause the game
        GameEngine.pauseGame();
        
        // Create game over modal
        const gameOverModal = document.createElement('div');
        gameOverModal.className = 'game-over-modal';
        
        // Generate stats summary
        const statsHTML = generateStatsSummary();
        
        // Create content
        gameOverModal.innerHTML = `
            <div class="game-over-content">
                <h2>Your Saga Has Ended</h2>
                <div class="game-over-reason">${gameOverReason}</div>
                
                <div class="game-over-summary">
                    ${statsHTML}
                </div>
                
                <div class="game-over-message">
                    <p>Your legacy has reached its end, but the sagas will remember your deeds.</p>
                </div>
                
                <div class="game-over-options">
                    <button id="btn-load-save" class="game-over-btn">Load Saved Game</button>
                    <button id="btn-new-game" class="game-over-btn">Start New Game</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(gameOverModal);
        
        // Add event listeners
        document.getElementById('btn-load-save').addEventListener('click', function() {
            // Close game over screen
            document.body.removeChild(gameOverModal);
            
            // Show load game dialog
            if (typeof SaveLoadSystem !== 'undefined' && SaveLoadSystem.showLoadDialog) {
                SaveLoadSystem.showLoadDialog();
            } else {
                // Fallback if SaveLoadSystem isn't available
                location.reload();
            }
        });
        
        document.getElementById('btn-new-game').addEventListener('click', function() {
            // Simply reload the page to start a new game
            location.reload();
        });
        
        // Add CSS if not already added
        addGameOverStyles();
    }
    
    /**
     * Generate HTML for the final stats summary
     * @returns {string} - HTML for stats summary
     */
    function generateStatsSummary() {
        let html = '<div class="final-stats">';
        
        // Add game duration
        const years = finalStats.date ? finalStats.date.year : 0;
        const days = finalStats.date ? finalStats.date.day : 0;
        html += `<div class="stat-row"><span>Saga Duration:</span> ${years} years and ${days} days</div>`;
        
        // Add population peak
        const populationPeak = finalStats.populationPeak || 0;
        html += `<div class="stat-row"><span>Population Peak:</span> ${populationPeak} villagers</div>`;
        
        // Add building count
        const buildingCount = finalStats.buildingCount || 0;
        html += `<div class="stat-row"><span>Buildings Constructed:</span> ${buildingCount}</div>`;
        
        // Add resources gathered
        const resourcesGathered = finalStats.resourcesGathered || {};
        html += `<div class="stat-row"><span>Resources Gathered:</span></div>`;
        html += '<div class="resources-summary">';
        for (const resource in resourcesGathered) {
            const amount = Math.floor(resourcesGathered[resource]);
            if (amount > 0) {
                html += `<div class="resource-item">${resource}: ${amount}</div>`;
            }
        }
        html += '</div>';
        
        // Add fame
        const fame = finalStats.fame || 0;
        html += `<div class="stat-row"><span>Final Fame:</span> ${fame}</div>`;
        
        // Add rank
        const rank = finalStats.rank || 'Lowly Karl';
        html += `<div class="stat-row"><span>Final Rank:</span> ${rank}</div>`;
        
        html += '</div>';
        return html;
    }
    
    /**
     * Add CSS styles for game over screen
     */
    function addGameOverStyles() {
        // Check if styles already exist
        if (document.getElementById('game-over-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'game-over-styles';
        styleEl.textContent = `
            .game-over-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .game-over-content {
                background-color: #f7f0e3;
                border-radius: 8px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
                border: 3px solid #8b5d33;
                text-align: center;
                max-height: 90vh;
                overflow-y: auto;
                background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c4zIgLAAABklJREFUOI3tmleWpDAMRVNEJOccX/9bebfvEFrV3TO/mRpOCUklqWpD+H9pGP7m5SFUg/yAQvKa+5+QHiIlIT6E9YF4re1v0DBX9l+gjNA/IHb9KsiHkFJC5A9EbvoRkcsSIZv5EZH+8+5n5G9E7dTPyN+I7PWPCL81hPkRERvCFLY+EdvkWaYwer5bCFMap3zIeSmFKULWm5R55X6SBLM8YQa3JYTNnlBeIj9kKGgQJdgfE0HTvN0G6OWJ3CgUDKWQI0Ih3GWL9eCnhIjkC33ZU64jRxI/lYlkfpQ7BUdqGEqGEilUz+dChDRy5nY50CHXpmVD0iJ3lPtHsjBNpTtJ0jhBQYVJEq+x+6P3RJIz0tiVqEzTJL4W0yQl15WYJZrGceol49TLQDLJkmyf/KDayBKhKFw2iR3qIrFErK4kXuEK/iR27vBUFNFKsMSu9GLGqbcgrsgdBskrkPDjBEi8MhMhiwgkP6RowSn4iQc5WoWQu3GiGhC7M0kDxO50j/hIgEQbIa4I+kUhVLgiVIkg7ynW2sgBUYrYDa3plkAQ5/NYEeCQJ8iMIHJBEDl+Efk8YYohbGbvCfC28YbkT2KTzJ8uRvwklLj3iM5uRNzeCBGFZZG4d0v9JEDwcr8ieO5KEYWAYGkQMX4SvUWE/CT8b0fE3G4uyHF9CrK4OxfDESJ+RARJNB6Dj1QOCQlfNRG7PY/YCc85RnxFPKAOyCKu53KvI0QghCiqq+J4nA1HmCrHUZVF1ScJWfq3FbEzKmzJQbWQ/P7n/1OGqx0yNE4YFd7zP2M4RE6ZQyLsHs9nVfFSCx3N8xQFTzZR8CaKlE9TJH2a7C4X4uV9ieIlilfEjyl8S8q3pnhryreofMvKt658G/A24W3B25K3BW8r3la8rXnb8HbD2w1vt7zdUh/yDGcDz3Ceocs84DPP8Bmf8Rmf8Rmf6TO+gC/gC/gCvoAv4Ev4Er6EL+FL+BK+gq/gK/gKvoKv4Gv4Gr6Gr+Fr+Aa+gW/gG/gGvoFv4Vv4Fr6Fb+Fb+A6+g+/gO/gOvoPv4Xv4Hr6H7+EH+AF+gB/gh7+f/gfmv3D+C+e/cP4L579w/gvnv3D+C+e/cP6L4L8I/ovgvwj+i+C/CP6L4L8I/ovgvwj+i+S/SP6L5L9I/ovkv0j+i+S/SP6L5L9I/ovivyj+i+K/KP6L4r8o/ovivyj+i+K/KP6L5r9o/ovmv2j+i+a/aP6L5r9o/ovmv2j+i+G/GP6L4b8Y/ovhvxj+i+G/GP6L4b8Y/ovlv1j+i+W/WP6L5b9Y/ovlv1j+i+W/WP6L474a');
            }
            
            .game-over-content h2 {
                color: #5d4037;
                margin-top: 0;
                font-size: 2rem;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            .game-over-reason {
                color: #c62828;
                font-size: 1.4rem;
                margin-bottom: 20px;
                font-weight: bold;
            }
            
            .game-over-summary {
                margin: 20px 0;
                text-align: left;
            }
            
            .final-stats {
                background-color: #fff;
                padding: 20px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
            }
            
            .stat-row {
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #e6d8c3;
                padding-bottom: 8px;
            }
            
            .stat-row span {
                font-weight: bold;
                color: #5d4037;
            }
            
            .resources-summary {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
                margin-top: 10px;
                margin-bottom: 15px;
            }
            
            .resource-item {
                background-color: #f5f0e5;
                padding: 6px 10px;
                border-radius: 4px;
                border-left: 3px solid #8b5d33;
                font-size: 0.9rem;
            }
            
            .game-over-message {
                margin: 20px 0;
                font-style: italic;
                color: #5d4037;
                line-height: 1.6;
                font-size: 1.1rem;
            }
            
            .game-over-options {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 30px;
            }
            
            .game-over-btn {
                background: linear-gradient(to bottom, #8b5d33, #6d4c2a);
                color: #f7f0e3;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
                font-size: 1.1rem;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                border: 1px solid #5d4027;
            }
            
            .game-over-btn:hover {
                background: linear-gradient(to bottom, #a97c50, #8b5d33);
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
            }
            
            .game-over-btn:active {
                transform: translateY(1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
            }
            
            @media (max-width: 600px) {
                .game-over-options {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .game-over-content h2 {
                    font-size: 1.5rem;
                }
                
                .game-over-reason {
                    font-size: 1.2rem;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Check if game over conditions are met
     * @param {Object} gameState - Current game state
     * @returns {boolean} - Whether game over conditions are met
     */
    function checkGameOverConditions(gameState) {
        // Check population extinction
        if (gameState.population.total <= 0) {
            gameOverReason = 'Your settlement has perished. All villagers have died.';
            return true;
        }
        
        // Check dynasty extinction (no characters left)
        if (gameState.characters.length <= 0) {
            gameOverReason = 'Your dynasty has ended. No one remains to carry on your legacy.';
            return true;
        }
        
        // Check if no dynasty members (special case if only non-dynasty characters remain)
        const dynastyMembers = gameState.characters.filter(char => 
            char.isLeader || char.relations.some(rel => gameState.characters.some(c => c.id === rel))
        );
        
        if (dynastyMembers.length <= 0) {
            gameOverReason = 'Your bloodline has been extinguished. Your dynasty has fallen.';
            return true;
        }
        
        // No game over conditions met
        return false;
    }
    
    /**
 * Collect final statistics when game ends
 * @param {Object} gameState - Current game state
 */
function collectFinalStats(gameState) {
    // Check if StatisticsPanel and getStatistics function exist
    const statistics = (typeof StatisticsPanel !== 'undefined' && 
                        typeof StatisticsPanel.getStatistics === 'function') 
                        ? StatisticsPanel.getStatistics() 
                        : null;
    
    finalStats = {
        date: gameState.date,
        populationPeak: Math.max(gameState.population.total, statistics?.maxPopulation || 0),
        buildingCount: Object.values(gameState.buildings.built).reduce((sum, count) => sum + count, 0),
        resourcesGathered: (statistics?.totalResourcesProduced || gameState.resources),
        fame: RankManager.getCurrentFame(),
        rank: RankManager.getCurrentRank().title
    };
}
    
    // Public API
    return {
        /**
         * Initialize the Game Over system
         */
        init: function() {
            console.log("Initializing Game Over System...");
            isGameOver = false;
            gameOverReason = '';
            finalStats = {};
            
            // Add CSS styles
            addGameOverStyles();
            
            console.log("Game Over System initialized");
        },
        
        /**
         * Check if game over conditions are met and handle game over
         * @param {Object} gameState - Current game state
         * @returns {boolean} - Whether game has ended
         */
        checkGameOver: function(gameState) {
            // Skip check if already in game over state
            if (isGameOver) return true;
            
            // Check game over conditions
            const isEnd = checkGameOverConditions(gameState);
            
            if (isEnd) {
                console.log("Game over condition met:", gameOverReason);
                isGameOver = true;
                
                // Collect final stats
                collectFinalStats(gameState);
                
                // Show game over screen
                showGameOverScreen();
                
                return true;
            }
            
            return false;
        },
        
        /**
         * Check if the game is over
         * @returns {boolean} - Whether the game is over
         */
        isGameOver: function() {
            return isGameOver;
        },
        
        /**
         * Get the game over reason
         * @returns {string} - Reason for game over
         */
        getGameOverReason: function() {
            return gameOverReason;
        },
        
        /**
         * Manually trigger game over for testing
         * @param {string} reason - Custom game over reason
         */
        debugTriggerGameOver: function(reason) {
            gameOverReason = reason || 'Debug-triggered game over';
            isGameOver = true;
            collectFinalStats(GameEngine.getGameState());
            showGameOverScreen();
        }
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        GameOverSystem.init();
        
        // Register with GameEngine if it exists
        if (typeof GameEngine !== 'undefined' && typeof GameEngine.registerTickProcessor === 'function') {
            GameEngine.registerTickProcessor(function(gameState, tickSize) {
                GameOverSystem.checkGameOver(gameState);
            });
        }
    }, 1000);
});