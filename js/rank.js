/**
 * Viking Legacy - Rank and Fame Management Module
 * Handles player progression through ranks based on fame accumulation
 */

const RankManager = (function() {
    // Private variables
    let currentFame = 0;
    let currentRankIndex = 0;
    
    // Rank definitions (from your provided table)
    const ranks = [
        {
            index: 0,
            title: "Lowly Karl",
            subRank: 1,
            fameRequired: 0,
            maxVassals: 0,
            maxVillages: 1,
            notes: "Beginning rank; access to basic research and a default scout."
        },
        {
            index: 1,
            title: "Humble Bondi",
            subRank: 1,
            fameRequired: 100,
            maxVassals: 0,
            maxVillages: 1,
            notes: "Unlocks rudimentary farming techniques."
        },
        {
            index: 2,
            title: "Rising Skald",
            subRank: 1,
            fameRequired: 250,
            maxVassals: 0,
            maxVillages: 1,
            notes: "Gains local recognition; basic raiding options unlocked."
        },
        {
            index: 3,
            title: "Wary Hirdman",
            subRank: 1,
            fameRequired: 500,
            maxVassals: 1,
            maxVillages: 1,
            notes: "Gains access to basic defense and scouting units."
        },
        {
            index: 4,
            title: "Steadfast Berserker",
            subRank: 1,
            fameRequired: 750,
            maxVassals: 1,
            maxVillages: 1,
            notes: "Enhanced battle prowess; unlocks minor raiding capabilities."
        },
        {
            index: 5,
            title: "Valiant Raider",
            subRank: 1,
            fameRequired: 1000,
            maxVassals: 1,
            maxVillages: 2,
            notes: "Improved raiding options and trade route access."
        },
        {
            index: 6,
            title: "Respected Hirdman",
            subRank: 1,
            fameRequired: 1500,
            maxVassals: 1,
            maxVillages: 2,
            notes: "Increased local influence; expanded vassal limit."
        },
        {
            index: 7,
            title: "Notable Hersir",
            subRank: 2,
            fameRequired: 2000,
            maxVassals: 2,
            maxVillages: 2,
            notes: "Early noble privileges; can form small warbands."
        },
        {
            index: 8,
            title: "Renowned Skald",
            subRank: 2,
            fameRequired: 3000,
            maxVassals: 2,
            maxVillages: 3,
            notes: "Unlocks advanced cultural benefits and morale boosts."
        },
        {
            index: 9,
            title: "Acclaimed Viking",
            subRank: 2,
            fameRequired: 4000,
            maxVassals: 2,
            maxVillages: 3,
            notes: "Access to elite research and advanced warrior training."
        },
        {
            index: 10,
            title: "Distinguished Thane",
            subRank: 3,
            fameRequired: 5500,
            maxVassals: 3,
            maxVillages: 4,
            notes: "Greater leadership capacity and military tactics."
        },
        {
            index: 11,
            title: "Esteemed Jarlsman",
            subRank: 3,
            fameRequired: 7000,
            maxVassals: 3,
            maxVillages: 4,
            notes: "Unlocks fortified defenses and extended raiding options."
        },
        {
            index: 12,
            title: "Noble Hersir",
            subRank: 3,
            fameRequired: 9000,
            maxVassals: 4,
            maxVillages: 5,
            notes: "Early noble council access and enhanced resource production."
        },
        {
            index: 13,
            title: "Exalted Chieftain",
            subRank: 4,
            fameRequired: 11000,
            maxVassals: 4,
            maxVillages: 5,
            notes: "Manages multiple holdings and gains advanced diplomacy."
        },
        {
            index: 14,
            title: "Grand Hirdman",
            subRank: 4,
            fameRequired: 13500,
            maxVassals: 5,
            maxVillages: 6,
            notes: "Unlocks elite raiding strategies and broader regional influence."
        },
        {
            index: 15,
            title: "Mighty Jarl",
            subRank: 5,
            fameRequired: 16000,
            maxVassals: 6,
            maxVillages: 7,
            notes: "Major expansion opportunities; access to siege technologies."
        },
        {
            index: 16,
            title: "Venerable Earl",
            subRank: 6,
            fameRequired: 19000,
            maxVassals: 7,
            maxVillages: 8,
            notes: "Enhanced regional control and political clout."
        },
        {
            index: 17,
            title: "Imperial Skald",
            subRank: 7,
            fameRequired: 22000,
            maxVassals: 8,
            maxVillages: 9,
            notes: "Combines cultural and military leadership; elite units become available."
        },
        {
            index: 18,
            title: "Legendary Viking",
            subRank: 8,
            fameRequired: 26000,
            maxVassals: 9,
            maxVillages: 10,
            notes: "Renowned across lands; unlocks legendary raiding and diplomatic dominance."
        },
        {
            index: 19,
            title: "Fabled Allfather",
            subRank: 10,
            fameRequired: 30000,
            maxVassals: 10,
            maxVillages: 10,
            notes: "Pinnacle of Viking fame; maximum holdings, advanced research, and elite privileges unlocked."
        }
    ];
    
    // Fame gain rules
    const fameGainRules = {
        // Resource production
        resourceThresholds: [100, 250, 500, 1000, 2000, 5000],
        resourceFameRewards: [5, 10, 25, 50, 100, 200],
        
        // Population growth
        populationThresholds: [10, 25, 50, 100, 200, 500],
        populationFameRewards: [10, 25, 50, 100, 250, 500],
        
        // Building construction
        buildingFameRewards: {
            house: 10,
            farm: 15,
            smithy: 25,
            longhouse: 50,
            tradingPost: 75,
            temple: 100,
            fortress: 250
        },
        
        // Event outcomes
        eventFameRewards: {
            minor: 5,
            moderate: 15,
            major: 30,
            legendary: 100
        },
        
        // Seasonal achievements
        seasonalFameBonus: 10,
        yearlyFameBonus: 50,
        
        // Combat and raiding
        raidSuccessFame: 50,
        raidBonusPerResource: 0.1,
        defenseSuccessFame: 40
    };
    
    // Fame tracking metrics
    let fameMetrics = {
        totalResourcesProduced: {
            food: 0,
            wood: 0,
            stone: 0,
            metal: 0
        },
        maxPopulationReached: 0,
        buildingsConstructed: {},
        raidsCompleted: 0,
        raidsSuccessful: 0,
        eventsResolved: 0,
        yearsCompleted: 0
    };
    
    // Private methods
    
    /**
     * Check if player can rank up based on current fame
     */
    function checkForRankUp() {
        // Look for the next rank that requires more fame than we have
        for (let i = currentRankIndex + 1; i < ranks.length; i++) {
            if (currentFame >= ranks[i].fameRequired) {
                // We can rank up to this level
                const oldRank = ranks[currentRankIndex];
                currentRankIndex = i;
                const newRank = ranks[currentRankIndex];
                
                // Log the rank up
                Utils.log(`You have risen in fame and are now known as ${newRank.title}!`, "success");
                
                // Log any special unlocks
                if (newRank.maxVassals > oldRank.maxVassals) {
                    Utils.log(`You can now have up to ${newRank.maxVassals} vassals.`, "success");
                }
                
                if (newRank.maxVillages > oldRank.maxVillages) {
                    Utils.log(`You can now control up to ${newRank.maxVillages} villages.`, "success");
                }
                
                Utils.log(newRank.notes, "success");
                
                // Update UI
                updateRankUI();
                
                // Continue checking for multiple rank-ups
                checkForRankUp();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Update the rank information in the UI
     */
    function updateRankUI() {
        const currentRank = ranks[currentRankIndex];
        
        // Update title
        Utils.updateElement('player-rank', currentRank.title);
        
        // Update fame display
        Utils.updateElement('player-fame', currentFame);
        
        // Update next rank info (if not at max rank)
        if (currentRankIndex < ranks.length - 1) {
            const nextRank = ranks[currentRankIndex + 1];
            const fameNeeded = nextRank.fameRequired - currentFame;
            Utils.updateElement('next-rank', nextRank.title);
            Utils.updateElement('fame-needed', fameNeeded);
        } else {
            // Max rank achieved
            Utils.updateElement('next-rank-container', 'Maximum rank achieved!');
        }
    }
    
    // Public API
    return {
  /**
 * Initialize the rank manager
 */
init: function() {
    // Check if rank display already exists
    const existingRankDisplay = document.getElementById('rank-display');
    
    // Only create the rank display if it doesn't exist
    if (!existingRankDisplay) {
        console.log("Creating rank display elements");
        const headerDiv = document.querySelector('header');
        
        if (headerDiv) {
            // Create rank display elements
            const rankDisplayDiv = document.createElement('div');
            rankDisplayDiv.id = 'rank-display';
            rankDisplayDiv.innerHTML = `
                <div class="rank-info">
                    <span class="rank-label">Rank:</span>
                    <span id="player-rank">${ranks[currentRankIndex].title}</span>
                </div>
                <div class="fame-info">
                    <span class="fame-label">Fame:</span>
                    <span id="player-fame">0</span>
                </div>
                <div id="next-rank-container" class="next-rank-info">
                    <span class="next-rank-label">Next Rank:</span>
                    <span id="next-rank">${ranks[currentRankIndex+1].title}</span>
                    (<span id="fame-needed">${ranks[currentRankIndex+1].fameRequired}</span> fame needed)
                </div>
            `;
            
            headerDiv.appendChild(rankDisplayDiv);
        }
    } else {
        console.log("Rank display already exists, skipping creation");
    }
    
    // Update UI
    updateRankUI();
    
    console.log("Rank Manager initialized");
},
        
        /**
         * Get current rank information
         * @returns {Object} - Current rank object
         */
        getCurrentRank: function() {
            return ranks[currentRankIndex];
        },
        
        /**
         * Get current fame points
         * @returns {number} - Current fame
         */
        getCurrentFame: function() {
            return currentFame;
        },
        
        /**
         * Add fame points
         * @param {number} amount - Amount of fame to add
         * @param {string} [reason] - Reason for fame gain (for logging)
         * @returns {boolean} - Whether a rank up occurred
         */
        addFame: function(amount, reason) {
            if (amount <= 0) return false;
            
            currentFame += amount;
            
            // Log fame gain with reason if provided
            if (reason && amount >= 50) { // Only log significant fame gains
                Utils.log(`+${amount} Fame: ${reason}`);
            }
            
            // Update UI
            Utils.updateElement('player-fame', currentFame);
            
            // Check for rank up
            return checkForRankUp();
        },
        
        /**
         * Process resource production for fame
         * @param {Object} resourcesProduced - Resources produced in this tick
         */
        processResourceProduction: function(resourcesProduced) {
            // Update metrics
            for (const resource in resourcesProduced) {
                if (fameMetrics.totalResourcesProduced.hasOwnProperty(resource)) {
                    fameMetrics.totalResourcesProduced[resource] += resourcesProduced[resource];
                }
            }
            
            // Check for reaching resource thresholds
            for (const resource in fameMetrics.totalResourcesProduced) {
                const total = fameMetrics.totalResourcesProduced[resource];
                
                // Check each threshold
                for (let i = 0; i < fameGainRules.resourceThresholds.length; i++) {
                    const threshold = fameGainRules.resourceThresholds[i];
                    
                    // If we've just crossed a threshold
                    if (total >= threshold && total - resourcesProduced[resource] < threshold) {
                        const fameGain = fameGainRules.resourceFameRewards[i];
                        this.addFame(fameGain, `Produced ${threshold} total ${resource}`);
                    }
                }
            }
        },
        
        /**
         * Process population changes for fame
         * @param {Object} population - Current population data
         */
        processPopulation: function(population) {
            if (population.total > fameMetrics.maxPopulationReached) {
                // Check population thresholds
                for (let i = 0; i < fameGainRules.populationThresholds.length; i++) {
                    const threshold = fameGainRules.populationThresholds[i];
                    
                    // If we've just crossed a threshold
                    if (population.total >= threshold && 
                        fameMetrics.maxPopulationReached < threshold) {
                        const fameGain = fameGainRules.populationFameRewards[i];
                        this.addFame(fameGain, `Settlement grew to ${threshold} people`);
                    }
                }
                
                // Update max population metric
                fameMetrics.maxPopulationReached = population.total;
            }
        },
        
        /**
         * Process building construction for fame
         * @param {string} buildingType - Type of building constructed
         */
        processBuildingConstruction: function(buildingType) {
            // Update building count
            if (!fameMetrics.buildingsConstructed[buildingType]) {
                fameMetrics.buildingsConstructed[buildingType] = 0;
            }
            fameMetrics.buildingsConstructed[buildingType]++;
            
            // Award fame if this building type has a fame reward
            if (fameGainRules.buildingFameRewards[buildingType]) {
                const fameGain = fameGainRules.buildingFameRewards[buildingType];
                this.addFame(fameGain, `Constructed a ${buildingType}`);
            }
        },
        
        /**
         * Process events for fame
         * @param {string} eventImportance - Importance of the event ('minor', 'moderate', 'major', 'legendary')
         */
        processEvent: function(eventImportance) {
            fameMetrics.eventsResolved++;
            
            // Award fame based on event importance
            if (fameGainRules.eventFameRewards[eventImportance]) {
                const fameGain = fameGainRules.eventFameRewards[eventImportance];
                this.addFame(fameGain, `Resolved a ${eventImportance} event`);
            }
        },
        
        /**
         * Process seasonal changes for fame
         * @param {Object} date - Current game date
         * @param {string} previousSeason - Previous season
         */
        processSeason: function(date, previousSeason) {
            // Award fame for surviving a season
            this.addFame(fameGainRules.seasonalFameBonus, `Survived the ${previousSeason} season`);
            
            // Award additional fame for completing a year
            if (date.season === "Spring" && previousSeason === "Winter") {
                fameMetrics.yearsCompleted++;
                this.addFame(fameGainRules.yearlyFameBonus, `Completed year ${fameMetrics.yearsCompleted}`);
            }
        },
        
        /**
         * Process raid results for fame
         * @param {boolean} success - Whether the raid was successful
         * @param {Object} resourcesGained - Resources gained from the raid
         */
        processRaid: function(success, resourcesGained) {
            fameMetrics.raidsCompleted++;
            
            if (success) {
                fameMetrics.raidsSuccessful++;
                
                // Base fame for successful raid
                let totalFame = fameGainRules.raidSuccessFame;
                
                // Bonus fame based on resources gained
                if (resourcesGained) {
                    let resourceValue = 0;
                    for (const resource in resourcesGained) {
                        resourceValue += resourcesGained[resource];
                    }
                    
                    totalFame += Math.floor(resourceValue * fameGainRules.raidBonusPerResource);
                }
                
                this.addFame(totalFame, "Successful raid");
            }
        },
        
        /**
         * Process successful defense for fame
         */
        processDefense: function() {
            this.addFame(fameGainRules.defenseSuccessFame, "Successfully defended settlement");
        },
        
        /**
         * Check if player meets rank requirement for a feature
         * @param {string} featureType - Type of feature to check
         * @param {number} featureValue - Value to check against current limits
         * @returns {boolean} - Whether the requirement is met
         */
        meetsRankRequirement: function(featureType, featureValue) {
            const currentRank = ranks[currentRankIndex];
            
            switch (featureType) {
                case 'vassals':
                    return featureValue <= currentRank.maxVassals;
                case 'villages':
                    return featureValue <= currentRank.maxVillages;
                default:
                    return false;
            }
        },
        
        /**
         * Get the maximum allowed value for a feature based on current rank
         * @param {string} featureType - Type of feature to check
         * @returns {number} - Maximum allowed value
         */
        getMaxAllowed: function(featureType) {
            const currentRank = ranks[currentRankIndex];
            
            switch (featureType) {
                case 'vassals':
                    return currentRank.maxVassals;
                case 'villages':
                    return currentRank.maxVillages;
                default:
                    return 0;
            }
        },
        
        /**
         * Get all rank data for debugging or display
         * @returns {Array} - Array of all rank objects
         */
        getAllRanks: function() {
            return [...ranks];
        }
    };
})();
