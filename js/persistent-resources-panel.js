/**
 * Viking Legacy - Persistent Resources Panel
 * Creates a fixed panel on the right side showing ALL resources at all times
 * Does not shift the main game content
 */

(function() {
    // Configuration
    const PANEL_WIDTH = '180px';
    const RESOURCE_HEIGHT = '24px';
    const CATEGORY_SPACING = '10px';
    const HIGH_Z_INDEX = '9999';
    
    // Keep track of the panel instance
    let panelInstance = null;
    let panelObserver = null;
    let styleElement = null;
    let updateInterval = null;
    
    /**
     * Create the persistent resources panel
     */
    function createPersistentResourcesPanel() {
        console.log("Creating persistent resources panel...");
        
        // Remove any existing panel
        removeExistingPanel();
        
        // Add CSS for the panel
        addPanelStyles();
        
        // Create the panel container
        const panel = document.createElement('div');
        panel.id = 'persistent-resources-panel';
        panel.className = 'viking-resources-persistent-panel'; // Unique class for our panel
        
        // Set inline styles to ensure visibility
        Object.assign(panel.style, {
            position: 'fixed',
            top: '0',
            right: '0',
            width: PANEL_WIDTH,
            height: '100vh',
            backgroundColor: 'rgba(83, 58, 41, 0.9)',
            color: '#f7f0e3',
            zIndex: HIGH_Z_INDEX,
            overflowY: 'auto',
            padding: '10px 5px',
            boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            fontSize: '14px',
            boxSizing: 'border-box'
        });
        
        // Add to document body
        document.body.appendChild(panel);
        panelInstance = panel;
        
        // Populate the panel with resource categories
        populateResourcePanel();
        
        // Setup update interval
        updateInterval = setInterval(updateResourceValues, 500);
        
        // Setup mutation observer to ensure panel stays visible
        setupPanelObserver();
        
        // Add resize listener
        window.addEventListener('resize', onWindowResize);
        
        console.log("Persistent resources panel created");
    }
    
    /**
     * Remove any existing panel and cleanup
     */
    function removeExistingPanel() {
        const existingPanel = document.getElementById('persistent-resources-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        if (panelObserver) {
            panelObserver.disconnect();
            panelObserver = null;
        }
        
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        if (styleElement) {
            styleElement.remove();
            styleElement = null;
        }
    }
    
    /**
     * Set up a mutation observer to ensure our panel stays visible
     */
    function setupPanelObserver() {
        // Create observer to watch for panel being removed or hidden
        panelObserver = new MutationObserver(function(mutations) {
            let needsRestore = false;
            
            // Check if panel was removed or hidden
            if (!document.getElementById('persistent-resources-panel')) {
                console.log('Panel was removed, restoring...');
                needsRestore = true;
            } else if (panelInstance) {
                const style = window.getComputedStyle(panelInstance);
                if (style.display === 'none' || style.visibility === 'hidden' || 
                    style.opacity === '0' || parseInt(style.zIndex, 10) < 9000) {
                    console.log('Panel was hidden, restoring...');
                    needsRestore = true;
                }
            }
            
            if (needsRestore) {
                // Re-create the panel
                setTimeout(createPersistentResourcesPanel, 10);
            }
        });
        
        // Watch for changes to body and our panel
        panelObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Also watch for tab changes by monitoring click events on navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Short delay to allow navigation to complete
                setTimeout(function() {
                    ensurePanelVisibility();
                }, 50);
            });
        });
    }
    
    /**
     * Ensure panel is visible - force it if needed
     */
    function ensurePanelVisibility() {
        if (!panelInstance || !document.body.contains(panelInstance)) {
            createPersistentResourcesPanel();
            return;
        }
        
        // Force panel to be visible
        Object.assign(panelInstance.style, {
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            zIndex: HIGH_Z_INDEX
        });
    }
    
    /**
     * Handle window resize events
     */
    function onWindowResize() {
        ensurePanelVisibility();
    }
    
    /**
     * Add CSS styles for the panel
     */
    function addPanelStyles() {
        // Remove existing styles if any
        if (styleElement) {
            styleElement.remove();
        }
        
        styleElement = document.createElement('style');
        styleElement.id = 'persistent-resources-styles';
        styleElement.textContent = `
            /* Category styling */
            .viking-resources-persistent-panel .resource-category {
                margin-bottom: ${CATEGORY_SPACING};
                border-bottom: 1px solid #8b7355;
                padding-bottom: 5px;
            }
            
            .viking-resources-persistent-panel .category-header {
                font-weight: bold;
                text-align: center;
                margin-bottom: 5px;
                color: #e6d8c3;
                background-color: rgba(59, 41, 29, 0.7);
                padding: 3px;
                border-radius: 3px;
            }
            
            .viking-resources-persistent-panel .resource-item {
                display: flex;
                justify-content: space-between;
                height: ${RESOURCE_HEIGHT};
                align-items: center;
                margin: 2px 0;
                padding: 0 5px;
                border-radius: 3px;
                position: relative;
            }
            
            .viking-resources-persistent-panel .resource-name {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .viking-resources-persistent-panel .resource-value {
                font-weight: bold;
                margin-left: 5px;
            }
            
            /* Capacity indicator - shows as thin line under each resource */
            .viking-resources-persistent-panel .capacity-indicator {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background-color: rgba(255, 255, 255, 0.3);
                transition: width 0.3s ease;
            }
            
            /* Colors for when storage is getting full */
            .viking-resources-persistent-panel .capacity-high {
                background-color: rgba(255, 165, 0, 0.7); /* Orange when >75% */
            }
            
            .viking-resources-persistent-panel .capacity-critical {
                background-color: rgba(255, 0, 0, 0.7); /* Red when >90% */
            }
            
            /* Resource category colors */
            .viking-resources-persistent-panel .basic-resources .resource-item {
                background-color: rgba(0, 100, 0, 0.3);
            }
            
            .viking-resources-persistent-panel .advanced-resources .resource-item {
                background-color: rgba(106, 27, 154, 0.3);
            }
            
            .viking-resources-persistent-panel .wealth-resources .resource-item {
                background-color: rgba(255, 143, 0, 0.3);
            }
            
            .viking-resources-persistent-panel .environmental-resources .resource-item {
                background-color: rgba(0, 105, 92, 0.3);
            }
            
            /* Scrollbar styles */
            .viking-resources-persistent-panel::-webkit-scrollbar {
                width: 6px;
            }
            
            .viking-resources-persistent-panel::-webkit-scrollbar-track {
                background: #3a2e21;
            }
            
            .viking-resources-persistent-panel::-webkit-scrollbar-thumb {
                background-color: #8b5d33;
                border-radius: 3px;
            }
            
            /* Mobile adjustments */
            @media (max-width: 768px) {
                .viking-resources-persistent-panel {
                    width: 120px !important;
                    font-size: 12px !important;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Populate the panel with resource categories and items
     */
    function populateResourcePanel() {
        if (!panelInstance) return;
        
        // Clear current content
        panelInstance.innerHTML = '';
        
        // Get resource categories from ResourceManager if available
        let resourceCategories = {
            basic: ["food", "wood", "stone", "metal"],
            advanced: ["leather", "fur", "cloth", "clay", "pitch", "salt", "honey", "herbs"],
            wealth: ["silver", "gold", "amber", "ivory", "jewels"],
            environmental: ["peat", "whale_oil", "ice", "exotic"]
        };
        
        if (typeof ResourceManager !== 'undefined' && ResourceManager.getResourceCategories) {
            resourceCategories = ResourceManager.getResourceCategories();
        }
        
        // Get resource display names if available
        let resourceDisplayNames = {};
        if (typeof ResourceManager !== 'undefined' && ResourceManager.getResourceDisplayNames) {
            resourceDisplayNames = ResourceManager.getResourceDisplayNames();
        }
        
        // Create categories and resource items
        const categoryNames = {
            basic: "Basic Resources",
            advanced: "Advanced Resources",
            wealth: "Wealth Resources",
            environmental: "Environmental Resources"
        };
        
        for (const category in resourceCategories) {
            // Create category section
            const categorySection = document.createElement('div');
            categorySection.className = `resource-category ${category}-resources`;
            
            // Add category header
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = categoryNames[category] || category;
            categorySection.appendChild(header);
            
            // Add resource items
            resourceCategories[category].forEach(resource => {
                const resourceItem = document.createElement('div');
                resourceItem.className = 'resource-item';
                resourceItem.dataset.resource = resource;
                
                const resourceName = document.createElement('div');
                resourceName.className = 'resource-name';
                resourceName.textContent = resourceDisplayNames[resource] || 
                    resource.charAt(0).toUpperCase() + resource.slice(1);
                
                const resourceValue = document.createElement('div');
                resourceValue.className = 'resource-value';
                resourceValue.textContent = '0';
                resourceValue.id = `persistent-${resource}-value`;
                
                // Add capacity indicator (thin line under the resource)
                const capacityIndicator = document.createElement('div');
                capacityIndicator.className = 'capacity-indicator';
                capacityIndicator.id = `persistent-${resource}-capacity`;
                
                resourceItem.appendChild(resourceName);
                resourceItem.appendChild(resourceValue);
                resourceItem.appendChild(capacityIndicator);
                categorySection.appendChild(resourceItem);
            });
            
            panelInstance.appendChild(categorySection);
        }
    }
    
    /**
     * Update resource values in the panel
     */
    function updateResourceValues() {
        if (!panelInstance) return;
        
        // Get current resources
        let resources = {};
        let storageCapacity = {};
        
        if (typeof ResourceManager !== 'undefined') {
            if (ResourceManager.getResources) {
                resources = ResourceManager.getResources();
            }
            
            // Get storage capacity if available
            if (ResourceManager.getStorageCapacity) {
                storageCapacity = ResourceManager.getStorageCapacity();
            }
        }
        
        // Update each resource value
        for (const resource in resources) {
            const element = document.getElementById(`persistent-${resource}-value`);
            if (element) {
                const value = Math.floor(resources[resource]);
                
                // If capacity exists for this resource, show value/capacity format
                if (storageCapacity[resource]) {
                    element.textContent = `${value}/${storageCapacity[resource]}`;
                } else {
                    // Otherwise just show the value
                    element.textContent = value;
                }
                
                // Update capacity indicator bar if it exists
                const capacityElement = document.getElementById(`persistent-${resource}-capacity`);
                if (capacityElement && storageCapacity[resource]) {
                    const capacity = storageCapacity[resource];
                    const percentage = Math.min(100, Math.floor((value / capacity) * 100));
                    
                    // Set width based on fill percentage
                    capacityElement.style.width = `${percentage}%`;
                    
                    // Reset classes
                    capacityElement.classList.remove('capacity-high', 'capacity-critical');
                    
                    // Add appropriate class based on how full it is
                    if (percentage > 90) {
                        capacityElement.classList.add('capacity-critical');
                    } else if (percentage > 75) {
                        capacityElement.classList.add('capacity-high');
                    }
                }
            }
        }
    }
    
    // Add a global function to force panel to show
    window.showResourcesPanel = function() {
        ensurePanelVisibility();
    };
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPersistentResourcesPanel);
    } else {
        // DOM already loaded, run immediately
        createPersistentResourcesPanel();
    }
    
    // Also add a load event listener in case DOMContentLoaded already fired
    window.addEventListener('load', function() {
        if (!panelInstance) {
            createPersistentResourcesPanel();
        }
        
        // Setup delayed check to ensure panel is visible after all scripts have run
        setTimeout(ensurePanelVisibility, 1000);
    });
    
    // Add event listeners to navigation tabs to ensure panel stays visible after tab changes
    setTimeout(function() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                setTimeout(ensurePanelVisibility, 100);
            });
        });
    }, 1000);
})();