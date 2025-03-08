// TransitionSystem.js
// Handles transitions between different game states and screens

class TransitionSystem extends Component {
  constructor() {
    super('transitionSystem');
    
    this.state = {
      currentState: 'initializing', // initializing, characterCreation, mainGame
      transitions: {},
      transitionInProgress: false,
      mainElementIds: {
        creator: 'creator',
        gameContainer: 'gameContainer'
      }
    };
  }
  
  initialize() {
    // Call base Component initialization
    super.initialize();
    
    // Initialize transitions
    this.initializeTransitions();
    
    // Subscribe to events
    this.setupEventSubscriptions();
    
    // Override the startAdventure function
    this.overrideStartAdventure();
    
    // Determine initial state based on what's visible
    this.detectInitialState();
    
    console.log("TransitionSystem initialized, current state:", this.state.currentState);
  }
  
  /**
   * Initialize transition definitions
   */
  initializeTransitions() {
    // Define all possible transitions
    this.state.transitions = {
      // Character creation progress transitions
      'intro_to_origin': {
        from: 'intro',
        to: 'originSection',
        beforeFn: null,
        afterFn: null
      },
      'origin_to_intro': {
        from: 'originSection',
        to: 'intro',
        beforeFn: null,
        afterFn: null
      },
      'origin_to_name': {
        from: 'originSection',
        to: 'nameSection',
        beforeFn: null,
        afterFn: null
      },
      'name_to_origin': {
        from: 'nameSection',
        to: 'originSection',
        beforeFn: null,
        afterFn: null
      },
      'name_to_finalOutput': {
        from: 'nameSection',
        to: 'finalOutput',
        beforeFn: null,
        afterFn: null
      },
      'finalOutput_to_name': {
        from: 'finalOutput',
        to: 'nameSection',
        beforeFn: null,
        afterFn: null
      },
      'finalOutput_to_prologue': {
        from: 'finalOutput',
        to: 'prologueSection',
        beforeFn: () => window.initializeRelationships(),
        afterFn: null
      },
      'prologue_to_empire': {
        from: 'prologueSection',
        to: 'empireSection',
        beforeFn: null,
        afterFn: null
      },
      
      // Major state transitions
      'characterCreation_to_mainGame': {
        from: 'characterCreation',
        to: 'mainGame',
        beforeFn: this.prepareGameTransition.bind(this),
        afterFn: this.finalizeGameTransition.bind(this)
      }
    };
  }
  
  /**
   * Setup event subscriptions
   */
  setupEventSubscriptions() {
    // Subscribe to transition event
    this.system.eventBus.subscribe('requestTransition', (data) => {
      this.handleTransitionRequest(data.from, data.to, data.beforeFn, data.afterFn);
    });
    
    // Character creation section transitions
    document.querySelectorAll('.menu-button').forEach(button => {
      const id = button.id;
      
      // Add listeners for character creation buttons
      if (id === 'paanic-button' || id === 'nesian-button' || 
          id === 'lunarine-button' || id === 'wyrdman-button') {
        button.addEventListener('click', () => {
          const origin = id.split('-')[0];
          if (typeof window.selectOrigin === 'function') {
            window.selectOrigin(origin);
          }
          this.transitionCharacterCreationSections('intro', 'originSection');
        });
      }
      
      // Button mappings for creation transitions
      const buttonTransitionMap = {
        'back-to-intro-button': ['originSection', 'intro'],
        'back-to-origin-button': ['nameSection', 'originSection'],
        'confirm-name-button': ['nameSection', 'finalOutput'],
        'back-to-name-button': ['finalOutput', 'nameSection'],
        'confirm-character-button': ['finalOutput', 'prologueSection'],
        'continue-to-empire-button': ['prologueSection', 'empireSection']
      };
      
      // Add listeners for mapped buttons
      if (buttonTransitionMap[id]) {
        const [from, to] = buttonTransitionMap[id];
        button.addEventListener('click', () => {
          this.transitionCharacterCreationSections(from, to);
        });
      }
    });
  }
  
  /**
   * Override the startAdventure function to use our transition system
   */
  overrideStartAdventure() {
    if (typeof window.startAdventure === 'function') {
      // Store reference to original function
      const originalStartAdventure = window.startAdventure;
      
      // Replace with our version
      window.startAdventure = () => {
        console.log("TransitionSystem: Initiating character creation to main game transition");
        
        // Use our transition system instead
        this.handleTransitionRequest('characterCreation', 'mainGame');
        
        // Call the original function as a fallback
        try {
          // Only call if our transition fails
          if (this.state.currentState !== 'mainGame') {
            console.log("TransitionSystem: Calling original startAdventure as fallback");
            originalStartAdventure();
          }
        } catch (error) {
          console.error("Error in original startAdventure:", error);
        }
      };
      
      console.log("Overrode startAdventure function");
    } else {
      console.warn("startAdventure function not found - could not override");
    }
  }
  
  /**
   * Detect the initial state based on what's visible
   */
  detectInitialState() {
    const creatorElement = document.getElementById(this.state.mainElementIds.creator);
    const gameContainerElement = document.getElementById(this.state.mainElementIds.gameContainer);
    
    if (!creatorElement || !gameContainerElement) {
      this.state.currentState = 'initializing';
      return;
    }
    
    const creatorHidden = creatorElement.classList.contains('hidden');
    const gameContainerHidden = gameContainerElement.classList.contains('hidden');
    
    if (!creatorHidden && gameContainerHidden) {
      this.state.currentState = 'characterCreation';
    } else if (creatorHidden && !gameContainerHidden) {
      this.state.currentState = 'mainGame';
    } else {
      // Default to character creation if state is ambiguous
      this.state.currentState = 'characterCreation';
      
      // Fix visibility if it's wrong
      creatorElement.classList.remove('hidden');
      gameContainerElement.classList.add('hidden');
    }
    
    console.log("Detected initial state:", this.state.currentState);
  }
  
  /**
   * Handle transition between character creation sections
   * @param {string} fromSection - ID of the section to transition from
   * @param {string} toSection - ID of the section to transition to
   */
  transitionCharacterCreationSections(fromSection, toSection) {
    // Get the section elements
    const fromElement = document.getElementById(fromSection);
    const toElement = document.getElementById(toSection);
    
    if (!fromElement || !toElement) {
      console.error(`Section elements not found: ${fromSection} or ${toSection}`);
      return;
    }
    
    // Create transition ID
    const transitionId = `${fromSection}_to_${toSection}`;
    
    // Get transition definition if it exists
    const transition = this.state.transitions[transitionId];
    
    // Execute before function if present
    if (transition && transition.beforeFn) {
      transition.beforeFn();
    }
    
    // Hide from section and show to section
    fromElement.classList.add('hidden');
    toElement.classList.remove('hidden');
    
    // Execute after function if present
    if (transition && transition.afterFn) {
      transition.afterFn();
    }
    
    console.log(`Transitioned from ${fromSection} to ${toSection}`);
  }
  
  /**
   * Handle transition request between major game states
   * @param {string} from - State to transition from
   * @param {string} to - State to transition to
   * @param {Function} beforeFn - Function to execute before transition
   * @param {Function} afterFn - Function to execute after transition
   */
  handleTransitionRequest(from, to, beforeFn, afterFn) {
    // Verify states
    if (from !== this.state.currentState) {
      console.warn(`Current state ${this.state.currentState} doesn't match requested from state ${from}`);
    }
    
    // Check if transition is in progress
    if (this.state.transitionInProgress) {
      console.warn("Transition already in progress, request ignored");
      return;
    }
    
    console.log(`TransitionSystem: Handling transition request ${from} -> ${to}`);
    
    // Set transition in progress flag
    this.state.transitionInProgress = true;
    
    // Get transition definition if it exists
    const transitionId = `${from}_to_${to}`;
    const transition = this.state.transitions[transitionId];
    
    // Execute before function from definition or parameter
    const beforeFunction = (transition && transition.beforeFn) ? transition.beforeFn : beforeFn;
    if (typeof beforeFunction === 'function') {
      try {
        beforeFunction();
      } catch (error) {
        console.error("Error in before transition function:", error);
      }
    }
    
    // Perform transition based on to/from states
    if (from === 'characterCreation' && to === 'mainGame') {
      this.performCharacterCreationToGameTransition();
    } else {
      console.warn(`Unsupported transition: ${from} -> ${to}`);
      this.state.transitionInProgress = false;
      return;
    }
    
    // Update current state
    this.state.currentState = to;
    
    // Execute after function from definition or parameter
    const afterFunction = (transition && transition.afterFn) ? transition.afterFn : afterFn;
    if (typeof afterFunction === 'function') {
      try {
        afterFunction();
      } catch (error) {
        console.error("Error in after transition function:", error);
      }
    }
    
    // Clear transition in progress flag
    this.state.transitionInProgress = false;
    
    // Publish completion event
    this.system.eventBus.publish('transitionCompleted', { from, to });
    
    console.log(`TransitionSystem: Completed transition ${from} -> ${to}`);
  }
  
  /**
   * Perform transition from character creation to main game
   */
  performCharacterCreationToGameTransition() {
    // Get the main elements
    const creatorElement = document.getElementById(this.state.mainElementIds.creator);
    const gameContainerElement = document.getElementById(this.state.mainElementIds.gameContainer);
    
    if (!creatorElement || !gameContainerElement) {
      console.error("Creator or gameContainer element not found");
      return;
    }
    
    // Hide creator and show game container
    creatorElement.classList.add('hidden');
    gameContainerElement.classList.remove('hidden');
    
    console.log("Transitioned from character creation to main game");
  }
  
  /**
   * Prepare for game transition
   * Called before transition to main game
   */
  prepareGameTransition() {
    console.log("Preparing for game transition");
    
    // Close any open panels
    this.system.eventBus.publish('closeAllPanels', {});
    
    // Clean up any existing UI elements to prevent duplicates
    this.cleanupUIElements();
  }
  
  /**
   * Clean up UI elements before transition
   */
  cleanupUIElements() {
    // Remove any duplicate status bars
    const statusBars = document.querySelectorAll('.status-bars:not(:first-child)');
    statusBars.forEach(bar => {
      if (bar && bar.parentNode) {
        bar.parentNode.removeChild(bar);
      }
    });
    
    // Remove any sidebar and main content duplicates
    const existingSidebars = document.querySelectorAll('.game-sidebar');
    if (existingSidebars.length > 1) {
      for (let i = 1; i < existingSidebars.length; i++) {
        existingSidebars[i].parentNode.removeChild(existingSidebars[i]);
      }
    }
    
    const existingMainContents = document.querySelectorAll('.game-main');
    if (existingMainContents.length > 1) {
      for (let i = 1; i < existingMainContents.length; i++) {
        existingMainContents[i].parentNode.removeChild(existingMainContents[i]);
      }
    }
    
    console.log("Cleaned up UI elements before transition");
  }
  
  /**
   * Finalize game transition
   * Called after transition to main game
   */
  finalizeGameTransition() {
    console.log("Finalizing game transition");
    
    // Initialize game state if the function exists
    if (typeof window.initializeGameState === 'function') {
      window.initializeGameState();
    }
    
    // Initialize inventory system if the function exists
    if (typeof window.initializeInventorySystem === 'function') {
      window.initializeInventorySystem();
    }
    
    // Add starting items for the character's career
    if (typeof window.addStartingItems === 'function') {
      window.addStartingItems();
    }
    
    // Update status display
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars();
    }
    
    // Update time display
    if (typeof window.updateTimeAndDay === 'function') {
      window.updateTimeAndDay(0);
    }
    
    // Set initial narrative
    if (typeof window.setNarrative === 'function') {
      // Create a default narrative if player data is available
      let narrativeText = "Your journey begins...";
      
      if (window.player && window.player.name && window.player.career && window.player.origin) {
        narrativeText = `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
        Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
        The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
        For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`;
      }
      
      window.setNarrative(narrativeText);
    }
    
    // Notify other systems that the game has started
    this.system.eventBus.publish('gameStarted', {});
  }
  
  /**
   * Update method called by the UI system
   */
  update(data) {
    // No regular update needed for now
  }
}

// Export the component
window.TransitionSystem = TransitionSystem;
