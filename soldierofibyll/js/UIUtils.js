// UIUtils.js
// Utilities for debugging, logging, and error handling

// Create global namespace for UI utilities
window.UIUtils = {
  // Debug settings
  debug: {
    enabled: true,
    level: 'info', // 'error', 'warn', 'info', 'debug', 'trace'
    showTimestamps: true,
    logToConsole: true,
    logToElement: false, // Set to true to log to DOM element
    logElementId: 'debug-log',
    maxLogEntries: 100
  },
  
  // Log history
  logs: [],
  
  // Initialize the debug utility
  initDebug: function(options = {}) {
    // Apply options
    Object.assign(this.debug, options);
    
    // Create log element if needed
    if (this.debug.logToElement && !document.getElementById(this.debug.logElementId)) {
      const logElement = document.createElement('div');
      logElement.id = this.debug.logElementId;
      logElement.className = 'debug-log';
      logElement.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        width: 400px;
        height: 200px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-y: auto;
        z-index: 9999;
        border: 1px solid #555;
        border-radius: 4px;
        display: none;
      `;
      
      document.body.appendChild(logElement);
      
      // Add toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = 'Show Debug';
      toggleButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        z-index: 10000;
        padding: 5px;
        cursor: pointer;
      `;
      
      toggleButton.addEventListener('click', function() {
        const log = document.getElementById(this.debug.logElementId);
        if (log) {
          const isVisible = log.style.display !== 'none';
          log.style.display = isVisible ? 'none' : 'block';
          toggleButton.textContent = isVisible ? 'Show Debug' : 'Hide Debug';
        }
      }.bind(this));
      
      document.body.appendChild(toggleButton);
    }
    
    this.log('info', 'Debug system initialized');
    
    // Override console methods to capture logs
    if (this.debug.enabled) {
      this.overrideConsole();
    }
    
    return this;
  },
  
  // Log a message with level
  log: function(level, message, data) {
    // Skip if debug is disabled or level is too low
    if (!this.debug.enabled) return;
    
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    const levelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(this.debug.level);
    
    if (levelIndex > configLevelIndex) return;
    
    // Format message
    const timestamp = this.debug.showTimestamps ? new Date().toISOString() : '';
    const formattedMessage = this.debug.showTimestamps 
      ? `[${timestamp}] [${level.toUpperCase()}] ${message}` 
      : `[${level.toUpperCase()}] ${message}`;
    
    // Store in log history
    this.logs.push({
      level,
      message,
      data,
      timestamp: new Date()
    });
    
    // Trim log history if needed
    if (this.logs.length > this.debug.maxLogEntries) {
      this.logs.shift();
    }
    
    // Output to console if enabled
    if (this.debug.logToConsole) {
      const consoleMethod = console[level] || console.log;
      if (data !== undefined) {
        consoleMethod(formattedMessage, data);
      } else {
        consoleMethod(formattedMessage);
      }
    }
    
    // Output to DOM element if enabled
    if (this.debug.logToElement) {
      const logElement = document.getElementById(this.debug.logElementId);
      if (logElement) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${level}`;
        entry.textContent = formattedMessage;
        
        if (data !== undefined) {
          entry.title = JSON.stringify(data);
        }
        
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
      }
    }
  },
  
  // Shorthand logging methods
  error: function(message, data) {
    this.log('error', message, data);
  },
  
  warn: function(message, data) {
    this.log('warn', message, data);
  },
  
  info: function(message, data) {
    this.log('info', message, data);
  },
  
  debug: function(message, data) {
    this.log('debug', message, data);
  },
  
  trace: function(message, data) {
    this.log('trace', message, data);
  },
  
  // Clear logs
  clearLogs: function() {
    this.logs = [];
    
    // Clear DOM element if enabled
    if (this.debug.logToElement) {
      const logElement = document.getElementById(this.debug.logElementId);
      if (logElement) {
        logElement.innerHTML = '';
      }
    }
  },
  
  // Override console methods to capture all logs
  overrideConsole: function() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override methods
    console.log = function() {
      window.UIUtils.log('info', arguments[0], Array.from(arguments).slice(1));
      originalConsole.log.apply(console, arguments);
    };
    
    console.info = function() {
      window.UIUtils.log('info', arguments[0], Array.from(arguments).slice(1));
      originalConsole.info.apply(console, arguments);
    };
    
    console.warn = function() {
      window.UIUtils.log('warn', arguments[0], Array.from(arguments).slice(1));
      originalConsole.warn.apply(console, arguments);
    };
    
    console.error = function() {
      window.UIUtils.log('error', arguments[0], Array.from(arguments).slice(1));
      originalConsole.error.apply(console, arguments);
    };
    
    console.debug = function() {
      window.UIUtils.log('debug', arguments[0], Array.from(arguments).slice(1));
      originalConsole.debug.apply(console, arguments);
    };
  },
  
  // Error handling utilities
  error: {
    // Global error handler
    handleGlobalErrors: function() {
      window.addEventListener('error', function(event) {
        window.UIUtils.error('Global error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
        
        // Try to recover UI if possible
        window.UIUtils.recovery.attemptUIRecovery();
        
        // Don't prevent default handling
        return false;
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', function(event) {
        window.UIUtils.error('Unhandled promise rejection:', {
          reason: event.reason
        });
        
        // Don't prevent default handling
        return false;
      });
      
      window.UIUtils.info('Global error handlers installed');
    },
    
    // Try to safely execute a function with error handling
    trySafe: function(fn, fallback, context) {
      try {
        return fn.call(context);
      } catch (error) {
        window.UIUtils.error('Error in trySafe:', {
          error: error,
          function: fn.toString().slice(0, 100) + '...'
        });
        
        // Call fallback if provided
        if (typeof fallback === 'function') {
          try {
            return fallback.call(context, error);
          } catch (fallbackError) {
            window.UIUtils.error('Error in fallback:', fallbackError);
          }
        }
        
        return null;
      }
    },
    
    // Try to safely execute an async function with error handling
    async trySafeAsync(fn, fallback, context) {
      try {
        return await fn.call(context);
      } catch (error) {
        window.UIUtils.error('Error in trySafeAsync:', {
          error: error,
          function: fn.toString().slice(0, 100) + '...'
        });
        
        // Call fallback if provided
        if (typeof fallback === 'function') {
          try {
            return await fallback.call(context, error);
          } catch (fallbackError) {
            window.UIUtils.error('Error in async fallback:', fallbackError);
          }
        }
        
        return null;
      }
    }
  },
  
  // Recovery utilities
  recovery: {
    // Attempt to recover the UI system
    attemptUIRecovery: function() {
      window.UIUtils.warn('Attempting UI recovery');
      
      // Check if UI system exists
      if (!window.UI || !window.UI.system) {
        window.UIUtils.error('UI system not found, cannot recover');
        return false;
      }
      
      // Recreate critical components
      try {
        // Get list of components
        const components = Object.keys(window.UI.system.components || {});
        
        // Try to reinitialize each component
        components.forEach(componentName => {
          const component = window.UI.system.components[componentName];
          
          if (component && typeof component.initialize === 'function') {
            try {
              component.initialize();
              window.UIUtils.info(`Reinitialized component: ${componentName}`);
            } catch (error) {
              window.UIUtils.error(`Failed to reinitialize component: ${componentName}`, error);
            }
          }
        });
        
        window.UIUtils.info('UI recovery completed');
        return true;
      } catch (error) {
        window.UIUtils.error('UI recovery failed:', error);
        return false;
      }
    }
  },
  
  // Performance monitoring
  performance: {
    // Start a performance measurement
    startMeasure: function(name) {
      if (window.performance && window.performance.mark) {
        window.performance.mark(`${name}-start`);
      }
    },
    
    // End a performance measurement and log the result
    endMeasure: function(name, logLevel = 'debug') {
      if (window.performance && window.performance.mark && window.performance.measure) {
        window.performance.mark(`${name}-end`);
        window.performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measures = window.performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const duration = measures[0].duration.toFixed(2);
          window.UIUtils.log(logLevel, `Performance [${name}]: ${duration}ms`);
          return duration;
        }
      }
      return null;
    },
    
    // Log UI component render times
    trackComponentRenders: function() {
      // Check if UI system exists
      if (!window.UI || !window.UI.system) {
        window.UIUtils.error('UI system not found, cannot track renders');
        return;
      }
      
      // Get components
      const components = window.UI.system.components;
      
      // Override render method for each component
      for (const componentName in components) {
        const component = components[componentName];
        if (component && typeof component.render === 'function') {
          // Store original render method
          const originalRender = component.render;
          
          // Replace with instrumented version
          component.render = function() {
            window.UIUtils.performance.startMeasure(`render-${componentName}`);
            const result = originalRender.apply(this, arguments);
            window.UIUtils.performance.endMeasure(`render-${componentName}`);
            return result;
          };
        }
      }
      
      window.UIUtils.info('Component render tracking enabled');
    }
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  window.UIUtils.initDebug();
  window.UIUtils.error.handleGlobalErrors();
});
