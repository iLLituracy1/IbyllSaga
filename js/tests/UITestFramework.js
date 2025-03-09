// UITestFramework.js - Simple test framework for the UI system

/**
 * Simple testing framework for the new UI System and its components.
 * This allows for testing in the browser console and running automated checks.
 */
class UITestFramework {
  constructor() {
    this.tests = {};
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
    this.debug = true;
  }

  /**
   * Register a test suite with related test cases
   * @param {string} suiteName - Name of the test suite
   * @param {Object} tests - Object with test functions
   */
  registerTestSuite(suiteName, tests) {
    if (!this.tests[suiteName]) {
      this.tests[suiteName] = {};
    }
    
    // Add each test to the suite
    Object.entries(tests).forEach(([testName, testFn]) => {
      this.tests[suiteName][testName] = testFn;
    });
    
    this.log(`Registered test suite: ${suiteName} with ${Object.keys(tests).length} tests`);
  }

  /**
   * Run a specific test suite
   * @param {string} suiteName - Name of the suite to run
   */
  async runTestSuite(suiteName) {
    if (!this.tests[suiteName]) {
      this.error(`Test suite not found: ${suiteName}`);
      return;
    }
    
    this.log(`Running test suite: ${suiteName}`);
    
    const suiteResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: Object.keys(this.tests[suiteName]).length
    };
    
    // Run each test in the suite
    for (const [testName, testFn] of Object.entries(this.tests[suiteName])) {
      try {
        this.log(`  Running test: ${testName}`);
        
        // Set up assertions context for this test
        const assertions = {
          assertEqual: (actual, expected, message = '') => {
            if (actual !== expected) {
              throw new Error(`${message} Expected ${expected}, got ${actual}`);
            }
          },
          assertTrue: (condition, message = '') => {
            if (!condition) {
              throw new Error(`${message} Expected true, got ${condition}`);
            }
          },
          assertFalse: (condition, message = '') => {
            if (condition) {
              throw new Error(`${message} Expected false, got ${condition}`);
            }
          },
          assertNotNull: (value, message = '') => {
            if (value === null || value === undefined) {
              throw new Error(`${message} Expected non-null value, got ${value}`);
            }
          }
        };
        
        // Run the test (support both async and sync)
        await testFn(assertions);
        
        this.log(`  ✅ Passed: ${testName}`);
        suiteResults.passed++;
      } catch (error) {
        if (error.message === 'SKIP') {
          this.log(`  ⚠️ Skipped: ${testName}`);
          suiteResults.skipped++;
        } else {
          this.error(`  ❌ Failed: ${testName}`);
          this.error(`     ${error.message}`);
          suiteResults.failed++;
        }
      }
    }
    
    // Update overall results
    this.results.passed += suiteResults.passed;
    this.results.failed += suiteResults.failed;
    this.results.skipped += suiteResults.skipped;
    this.results.total += suiteResults.total;
    
    // Log suite results
    this.log(`Completed test suite: ${suiteName}`);
    this.log(`  Passed: ${suiteResults.passed}/${suiteResults.total}`);
    this.log(`  Failed: ${suiteResults.failed}`);
    this.log(`  Skipped: ${suiteResults.skipped}`);
    
    return suiteResults;
  }

  /**
   * Run all registered test suites
   */
  async runAllTests() {
    this.resetResults();
    this.log('Running all test suites...');
    
    for (const suiteName of Object.keys(this.tests)) {
      await this.runTestSuite(suiteName);
    }
    
    this.logResults();
    return this.results;
  }

  /**
   * Reset test results
   */
  resetResults() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
  }

  /**
   * Log overall test results
   */
  logResults() {
    console.log('%c==== UI System Test Results ====', 'font-weight: bold; font-size: 16px;');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`%c✅ Passed: ${this.results.passed}`, 'color: green; font-weight: bold;');
    console.log(`%c❌ Failed: ${this.results.failed}`, 'color: red; font-weight: bold;');
    console.log(`%c⚠️ Skipped: ${this.results.skipped}`, 'color: orange; font-weight: bold;');
    
    const passRate = this.results.total > 0 
      ? Math.round((this.results.passed / (this.results.total - this.results.skipped)) * 100) 
      : 0;
    
    console.log(`Pass Rate: ${passRate}%`);
  }

  /**
   * Log a message (only in debug mode)
   */
  log(message) {
    if (this.debug) {
      console.log(`%c[UITest] ${message}`, 'color: #4285F4;');
    }
  }

  /**
   * Log an error
   */
  error(message) {
    console.error(`%c[UITest] ${message}`, 'color: #EA4335;');
  }
}

// Create basic test suites for our components
window.UITestFramework = new UITestFramework();

// Register test suite for UISystem
window.UITestFramework.registerTestSuite('UISystem', {
  'system initialization': async (assert) => {
    assert.assertNotNull(window.uiSystem, 'UISystem should be initialized');
    assert.assertTrue(typeof window.uiSystem.initialize === 'function', 'UISystem should have initialize method');
    assert.assertTrue(typeof window.uiSystem.registerComponent === 'function', 'UISystem should have registerComponent method');
  },
  
  'event bus functionality': async (assert) => {
    assert.assertNotNull(window.uiSystem.eventBus, 'EventBus should be initialized');
    
    // Test event subscription and publishing
    let eventFired = false;
    const unsubscribe = window.uiSystem.eventBus.subscribe('test-event', () => {
      eventFired = true;
    });
    
    window.uiSystem.eventBus.publish('test-event', {});
    assert.assertTrue(eventFired, 'Event should be fired when published');
    
    // Test unsubscribe
    eventFired = false;
    unsubscribe();
    window.uiSystem.eventBus.publish('test-event', {});
    assert.assertFalse(eventFired, 'Event should not fire after unsubscribe');
  },
  
  'component registration': async (assert) => {
    // Create a test component
    class TestComponent extends Component {
      constructor() {
        super('test-component');
      }
      
      initialize() {
        super.initialize();
        this.initialized = true;
      }
    }
    
    const testComponent = new TestComponent();
    window.uiSystem.registerComponent('test', testComponent);
    
    assert.assertNotNull(window.uiSystem.components['test'], 'Component should be registered');
    assert.assertTrue(window.uiSystem.components['test'].initialized, 'Component should be initialized');
  }
});

// Register test suite for StatusDisplayComponent
window.UITestFramework.registerTestSuite('StatusDisplayComponent', {
  'component initialization': async (assert) => {
    const component = window.uiSystem.components['statusDisplay'];
    if (!component) throw new Error('SKIP'); // Skip if component not registered
    
    assert.assertNotNull(component, 'StatusDisplayComponent should be registered');
    assert.assertNotNull(component.element, 'Component should have root element');
  },
  
  'health update': async (assert) => {
    const component = window.uiSystem.components['statusDisplay'];
    if (!component) throw new Error('SKIP'); // Skip if component not registered
    
    // Update health via event bus
    window.uiSystem.eventBus.publish('status:update', {
      health: 75,
      maxHealth: 100,
      stamina: 80, 
      maxStamina: 100,
      morale: 90
    });
    
    // Verify state was updated
    assert.assertEqual(component.state.health, 75, 'Health should be updated');
    assert.assertEqual(component.state.maxHealth, 100, 'Max health should be updated');
  }
});

// Register test suite for TimeSystemComponent
window.UITestFramework.registerTestSuite('TimeSystemComponent', {
  'component initialization': async (assert) => {
    const component = window.uiSystem.components['timeSystem'];
    if (!component) throw new Error('SKIP'); // Skip if component not registered
    
    assert.assertNotNull(component, 'TimeSystemComponent should be registered');
  },
  
  'time advancement': async (assert) => {
    const component = window.uiSystem.components['timeSystem'];
    if (!component) throw new Error('SKIP'); // Skip if component not registered
    
    const initialTime = component.state.time;
    const initialDay = component.state.day;
    
    // Advance time by 30 minutes
    window.uiSystem.eventBus.publish('time:advance', { minutes: 30 });
    
    // Verify time was updated
    assert.assertEqual(component.state.time, initialTime + 30, 'Time should be advanced by 30 minutes');
    assert.assertEqual(component.state.day, initialDay, 'Day should not change for 30 minutes');
    
    // Test day change
    const minutesToMidnight = 1440 - component.state.time;
    window.uiSystem.eventBus.publish('time:advance', { minutes: minutesToMidnight + 10 });
    
    // Verify day was updated
    assert.assertEqual(component.state.day, initialDay + 1, 'Day should increment after passing midnight');
  }
});

// Run tests on window load or via console
window.runUITests = async () => {
  if (window.uiSystem) {
    return await window.UITestFramework.runAllTests();
  } else {
    console.error('UI System not initialized. Cannot run tests.');
  }
};

// Add to window load but only in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.addEventListener('load', () => {
    // Wait for UI system to be ready
    if (window.uiSystem) {
      setTimeout(() => window.runUITests(), 1000);
    } else {
      // Wait for UI system to be initialized
      document.addEventListener('uiSystemReady', () => {
        setTimeout(() => window.runUITests(), 1000);
      });
    }
  });
}
