/**
 * Viking Legacy - Dynasty UI Panel
 * Adds a family/dynasty panel to visualize the leader and family relationships
 * Add this code to js/population.js or create a new file js/dynasty-ui.js
 */

const DynastyPanel = (function() {
    // Track if panel exists
    let isPanelCreated = false;
    
    // Update frequency (in ms)
    const UPDATE_INTERVAL = 2000;
    
    // Update timer reference
    let updateTimer = null;
    
    /**
     * Create the dynasty panel DOM elements
     */
    function createPanel() {
        // Check if panel already exists
        if (document.getElementById('dynasty-panel')) {
            console.log("Dynasty panel already exists");
            return;
        }
        
        // Create panel container
        const dynastyPanel = document.createElement('div');
        dynastyPanel.className = 'dynasty-panel';
        dynastyPanel.id = 'dynasty-panel';
        
        // Create panel content
        dynastyPanel.innerHTML = `
            <h2>Your Dynasty</h2>
            <div class="dynasty-content">
                <div class="leader-section">
                    <h3>Current Leader</h3>
                    <div id="leader-card" class="leader-card">
                        <div class="leader-loading">Loading leader data...</div>
                    </div>
                </div>
                
                <div class="family-section">
                    <h3>Family Members</h3>
                    <div id="family-filters" class="family-filters">
                        <button class="family-filter active" data-filter="all">All</button>
                        <button class="family-filter" data-filter="spouse">Spouse</button>
                        <button class="family-filter" data-filter="children">Children</button>
                        <button class="family-filter" data-filter="extended">Extended</button>
                    </div>
                    <div id="family-members" class="family-members">
                        <div class="family-loading">Loading family data...</div>
                    </div>
                </div>
                
                <div class="dynasty-stats">
                    <h3>Dynasty Statistics</h3>
                    <div class="stat-row">
                        <div class="stat-label">Dynasty Size:</div>
                        <div id="dynasty-size" class="stat-value">0</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">Generations:</div>
                        <div id="dynasty-generations" class="stat-value">1</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">Legacy:</div>
                        <div id="dynasty-legacy" class="stat-value">New</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to game content
        const gameContent = document.querySelector('.game-content');
        if (gameContent) {
            gameContent.appendChild(dynastyPanel);
            
            // Add event listeners
            setupEventListeners();
            
            // Add styles
            addStyles();
            
            // Register with NavigationSystem if it exists
            if (typeof NavigationSystem !== 'undefined') {
                NavigationSystem.registerPanel('dynasty-panel', 'settlement');
            }
            
            isPanelCreated = true;
            
            // Do initial update
            updateDynastyPanel();
            
            // Set up update interval
            updateTimer = setInterval(updateDynastyPanel, UPDATE_INTERVAL);
        }
    }
    
    /**
     * Set up event listeners for the dynasty panel
     */
    function setupEventListeners() {
        // Family filter buttons
        const filterButtons = document.querySelectorAll('.family-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Apply filter
                const filterType = this.dataset.filter;
                filterFamilyMembers(filterType);
            });
        });
    }
    
    /**
     * Add CSS styles for the dynasty panel
     */
    function addStyles() {
        // Check if styles already exist
        if (document.getElementById('dynasty-panel-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'dynasty-panel-styles';
        styleEl.textContent = `
            .dynasty-panel {
                background-color: #e6d8c3;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #c9ba9b;
                margin-top: 20px;
                grid-column: 1 / 3;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .dynasty-panel h2 {
                color: #5d4037;
                margin-top: 0;
                font-size: 1.8rem;
                border-bottom: 2px solid #a99275;
                padding-bottom: 8px;
                margin-bottom: 15px;
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                letter-spacing: 1px;
                font-weight: 700;
            }
            
            .dynasty-panel h3 {
                color: #5d4037;
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 1.3rem;
                border-bottom: 1px solid #c9ba9b;
                padding-bottom: 5px;
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                letter-spacing: 0.5px;
                font-weight: 600;
            }
            
            .dynasty-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-areas:
                    "leader family"
                    "stats stats";
                gap: 20px;
            }
            
            .leader-section {
                grid-area: leader;
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .family-section {
                grid-area: family;
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .dynasty-stats {
                grid-area: stats;
                background-color: #f7f0e3;
                padding: 15px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .leader-card {
                background-color: #fff5e6;
                border-radius: 6px;
                padding: 16px;
                margin-top: 10px;
                border-left: 5px solid #8b5d33;
                box-shadow: 0 2px 8px rgba(139, 93, 51, 0.2);
            }
            
            .leader-info {
                display: flex;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .leader-portrait {
                width: 80px;
                height: 80px;
                background-color: #8b5d33;
                border-radius: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 2rem;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .leader-details {
                flex-grow: 1;
            }
            
            .leader-name {
                font-size: 1.4rem;
                font-weight: bold;
                color: #5d4037;
                margin-bottom: 4px;
            }
            
            .leader-gender {
                display: inline-block;
                margin-left: 8px;
                font-size: 1.1rem;
            }
            
            .gender-male {
                color: #1565c0;
            }
            
            .gender-female {
                color: #c62828;
            }
            
            .leader-role {
                font-size: 1.1rem;
                color: #8b5d33;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .leader-age {
                font-size: 1rem;
                color: #5d4037;
            }
            
            .leader-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 12px;
            }
            
            .leader-stat {
                background-color: #f7f0e3;
                padding: 8px 10px;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
            }
            
            .stat-name {
                font-weight: 500;
                color: #5d4037;
            }
            
            .stat-value {
                font-weight: 600;
                color: #8b5d33;
            }
            
            .leader-traits {
                margin-top: 12px;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .trait {
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 0.9rem;
            }
            
            .trait-positive {
                background-color: #c8e6c9;
                color: #2e7d32;
            }
            
            .trait-negative {
                background-color: #ffcdd2;
                color: #c62828;
            }
            
            .family-filters {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .family-filter {
                padding: 6px 12px;
                background-color: #d7cbb9;
                border: 1px solid #c9ba9b;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                color: #5d4037;
                font-weight: 500;
            }
            
            .family-filter:hover {
                background-color: #c9ba9b;
            }
            
            .family-filter.active {
                background-color: #8b5d33;
                color: #fff;
                border-color: #5d4037;
            }
            
            .family-members {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 12px;
                max-height: 260px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .family-member {
                background-color: #fff;
                border-radius: 6px;
                padding: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                transition: transform 0.2s;
                border-left: 3px solid #a99275;
            }
            
            .family-member:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .family-member.spouse-member {
                border-left-color: #e91e63;
            }
            
            .family-member.child-member {
                border-left-color: #2196f3;
            }
            
            .family-member.extended-member {
                border-left-color: #ff9800;
            }
            
            .member-name {
                font-weight: bold;
                color: #5d4037;
                margin-bottom: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .member-gender {
                display: inline-block;
                margin-left: 4px;
                font-size: 0.9rem;
            }
            
            .member-relation {
                color: #8b5d33;
                font-size: 0.9rem;
                font-weight: 500;
                margin-bottom: 5px;
            }
            
            .member-age {
                color: #5d4037;
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .member-traits {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 6px;
            }
            
            .member-trait {
                padding: 2px 5px;
                border-radius: 2px;
                font-size: 0.8rem;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 8px 12px;
                background-color: #fff;
                border-radius: 4px;
            }
            
            .stat-label {
                font-weight: 500;
                color: #5d4037;
            }
            
            @media (max-width: 768px) {
                .dynasty-content {
                    grid-template-columns: 1fr;
                    grid-template-areas:
                        "leader"
                        "family"
                        "stats";
                }
                
                .family-members {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Update the dynasty panel with current data
     */
    function updateDynastyPanel() {
        if (!isPanelCreated) return;
        
        // Update leader card
        updateLeaderCard();
        
        // Update family members
        updateFamilyMembers();
        
        // Update dynasty stats
        updateDynastyStats();
    }
    
    /**
     * Update the leader card with current leader data
     */
    function updateLeaderCard() {
        const leaderCard = document.getElementById('leader-card');
        if (!leaderCard) return;
        
        // Get leader from PopulationManager
        const leader = PopulationManager.getDynastyLeader();
        
        if (!leader) {
            leaderCard.innerHTML = '<div class="leader-loading">No leader found</div>';
            return;
        }
        
        // Get first letter of name for portrait
        const nameInitial = leader.name.charAt(0).toUpperCase();
        
        // Determine trait classes
        const positiveTraits = ["Strong", "Quick", "Wise", "Charismatic", "Brave", "Cunning", "Patient", "Healthy"];
        const leaderTraits = leader.traits.map(trait => {
            const isPositive = positiveTraits.includes(trait);
            return `<div class="trait ${isPositive ? 'trait-positive' : 'trait-negative'}">${trait}</div>`;
        }).join('');
        
        // Format leader card HTML
        leaderCard.innerHTML = `
            <div class="leader-info">
                <div class="leader-portrait">${nameInitial}</div>
                <div class="leader-details">
                    <div class="leader-name">
                        ${leader.name}
                        <span class="leader-gender gender-${leader.gender}">${leader.gender === 'male' ? '♂' : '♀'}</span>
                    </div>
                    <div class="leader-role">Leader of the Settlement</div>
                    <div class="leader-age">Age: ${Math.floor(leader.age)} years</div>
                </div>
            </div>
            
            <div class="leader-stats">
                <div class="leader-stat">
                    <div class="stat-name">Farming</div>
                    <div class="stat-value">${leader.skills.farming}</div>
                </div>
                <div class="leader-stat">
                    <div class="stat-name">Woodcutting</div>
                    <div class="stat-value">${leader.skills.woodcutting}</div>
                </div>
                <div class="leader-stat">
                    <div class="stat-name">Mining</div>
                    <div class="stat-value">${leader.skills.mining}</div>
                </div>
                <div class="leader-stat">
                    <div class="stat-name">Combat</div>
                    <div class="stat-value">${leader.skills.combat}</div>
                </div>
                <div class="leader-stat">
                    <div class="stat-name">Crafting</div>
                    <div class="stat-value">${leader.skills.crafting}</div>
                </div>
                <div class="leader-stat">
                    <div class="stat-name">Leadership</div>
                    <div class="stat-value">${leader.skills.leadership}</div>
                </div>
            </div>
            
            ${leader.traits.length > 0 ? `<div class="leader-traits">${leaderTraits}</div>` : ''}
        `;
    }
    
    /**
     * Update the family members section
     */
    function updateFamilyMembers() {
        const familyMembersContainer = document.getElementById('family-members');
        if (!familyMembersContainer) return;
        
        // Get leader and all characters
        const leader = PopulationManager.getDynastyLeader();
        const characters = PopulationManager.getCharacters();
        
        if (!leader || characters.length === 0) {
            familyMembersContainer.innerHTML = '<div class="family-loading">No family members found</div>';
            return;
        }
        
        // Find family members
        const familyMembers = classifyFamilyMembers(leader, characters);
        
        if (Object.values(familyMembers).flat().length === 0) {
            familyMembersContainer.innerHTML = '<div class="family-loading">Leader has no family members</div>';
            return;
        }
        
        // Build HTML for family members
        let familyHTML = '';
        
        // Process each category
        for (const category in familyMembers) {
            familyMembers[category].forEach(member => {
                const memberClassification = getMemberRelationClass(category);
                
                // Get first trait if any
                let traitsHTML = '';
                if (member.traits && member.traits.length > 0) {
                    const positiveTraits = ["Strong", "Quick", "Wise", "Charismatic", "Brave", "Cunning", "Patient", "Healthy"];
                    const trait = member.traits[0]; // Just show first trait to save space
                    const isPositive = positiveTraits.includes(trait);
                    traitsHTML = `
                        <div class="member-traits">
                            <div class="member-trait ${isPositive ? 'trait-positive' : 'trait-negative'}">${trait}</div>
                        </div>
                    `;
                }
                
                familyHTML += `
                    <div class="family-member ${memberClassification}" data-member-id="${member.id}" data-relation="${category}">
                        <div class="member-name">
                            ${member.name}
                            <span class="member-gender gender-${member.gender}">${member.gender === 'male' ? '♂' : '♀'}</span>
                        </div>
                        <div class="member-relation">${formatRelation(category)}</div>
                        <div class="member-age">Age: ${Math.floor(member.age)} years</div>
                        ${traitsHTML}
                    </div>
                `;
            });
        }
        
        familyMembersContainer.innerHTML = familyHTML;
        
        // Apply active filter
        const activeFilter = document.querySelector('.family-filter.active');
        if (activeFilter) {
            filterFamilyMembers(activeFilter.dataset.filter);
        }
    }
    
    /**
     * Classify family members into categories based on their relationship to the leader
     * @param {Object} leader - Leader character
     * @param {Array} characters - All characters
     * @returns {Object} - Family members by category
     */
    function classifyFamilyMembers(leader, characters) {
        const family = {
            spouse: [],
            children: [],
            extended: []
        };
        
        if (!leader) return family;
        
        // Get leader's relations
        const leaderRelations = leader.relations || [];
        
        characters.forEach(character => {
            // Skip the leader
            if (character.id === leader.id) return;
            
            // Has direct relation with leader
            if (leaderRelations.includes(character.id) || (character.relations && character.relations.includes(leader.id))) {
                // Determine relationship type
                if (isSpouse(leader, character)) {
                    family.spouse.push(character);
                } else if (isChild(leader, character)) {
                    family.children.push(character);
                } else {
                    family.extended.push(character);
                }
            }
        });
        
        return family;
    }
    
    /**
     * Check if two characters are spouses
     * @param {Object} char1 - First character
     * @param {Object} char2 - Second character
     * @returns {boolean} - Whether they are spouses
     */
    function isSpouse(char1, char2) {
        // Different genders and both adults and have relation
        return (
            char1.gender !== char2.gender &&
            char1.age >= 15 && char2.age >= 15 &&
            char1.relations.includes(char2.id) &&
            char2.relations.includes(char1.id)
        );
    }
    
    /**
     * Check if a character is a child of another
     * @param {Object} parent - Potential parent
     * @param {Object} child - Potential child
     * @returns {boolean} - Whether parent-child relationship exists
     */
    function isChild(parent, child) {
        // Significant age difference and have relation
        return (
            parent.age >= child.age + 15 &&
            parent.relations.includes(child.id) &&
            child.relations.includes(parent.id)
        );
    }
    
    /**
     * Get CSS class for a family member based on relation category
     * @param {string} category - Relation category
     * @returns {string} - CSS class
     */
    function getMemberRelationClass(category) {
        switch (category) {
            case 'spouse': return 'spouse-member';
            case 'children': return 'child-member';
            case 'extended': return 'extended-member';
            default: return '';
        }
    }
    
    /**
     * Format relation category for display
     * @param {string} category - Relation category
     * @returns {string} - Formatted relation
     */
    function formatRelation(category) {
        switch (category) {
            case 'spouse': return 'Spouse';
            case 'children': return 'Child';
            case 'extended': return 'Family Member';
            default: return 'Relation';
        }
    }
    
    /**
     * Filter family members based on selected filter
     * @param {string} filterType - Filter type
     */
    function filterFamilyMembers(filterType) {
        const memberElements = document.querySelectorAll('.family-member');
        
        memberElements.forEach(element => {
            if (filterType === 'all' || element.dataset.relation === filterType) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }
    
    /**
     * Update dynasty statistics
     */
    function updateDynastyStats() {
        // Get all characters and leader
        const characters = PopulationManager.getCharacters();
        const leader = PopulationManager.getDynastyLeader();
        
        if (!leader) return;
        
        // Calculate dynasty size (all related to leader)
        const dynastySize = characters.filter(char => {
            if (char.id === leader.id) return true;
            if (leader.relations.includes(char.id)) return true;
            if (char.relations && char.relations.includes(leader.id)) return true;
            return false;
        }).length;
        
        // Estimate generations
        let generations = 1;
        
        // Look for children
        const children = characters.filter(char => 
            isChild(leader, char)
        );
        
        if (children.length > 0) {
            generations = 2;
            
            // Look for grandchildren
            for (const child of children) {
                const grandchildren = characters.filter(char =>
                    isChild(child, char)
                );
                
                if (grandchildren.length > 0) {
                    generations = 3;
                    break;
                }
            }
        }
        
        // Update UI
        Utils.updateElement('dynasty-size', dynastySize);
        Utils.updateElement('dynasty-generations', generations);
        
        // Determine legacy status
        let legacyStatus = 'New';
        if (dynastySize >= 10 && generations >= 2) {
            legacyStatus = 'Established';
        } else if (dynastySize >= 20 && generations >= 3) {
            legacyStatus = 'Renowned';
        }
        
        Utils.updateElement('dynasty-legacy', legacyStatus);
    }
    
    // Public API
    return {
        /**
         * Initialize the dynasty panel
         */
        init: function() {
            // Create panel
            createPanel();
            
            console.log("Dynasty Panel initialized");
        },
        
        /**
         * Manually update the panel
         */
        update: function() {
            updateDynastyPanel();
        }
    };
})();

// Initialize the panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time for other systems to initialize
    setTimeout(function() {
        DynastyPanel.init();
    }, 1000);
});

// Alternatively, you can initialize from the game.js file:
// if (typeof GameEngine !== 'undefined' && GameEngine.isGameRunning) {
//     DynastyPanel.init();
// }
