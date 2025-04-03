// Debug Routes Script
// Use this script to diagnose routing issues in development and production modes

// Add this script to your HTML for debugging routing issues:
// <script src="/debug-routes.js"></script>

(function() {
  // Check if we're coming back from a hard reset
  if (sessionStorage.getItem('hard_reset') === 'true') {
    console.log('🔄 Detected return from hard history reset');
    sessionStorage.removeItem('hard_reset');
    
    const returnTo = sessionStorage.getItem('return_to');
    if (returnTo && returnTo !== window.location.pathname) {
      console.log('🔄 Restoring path:', returnTo);
      window.history.pushState(null, '', returnTo);
      sessionStorage.removeItem('return_to');
    }
    
    // Report the new history length
    console.log('🔄 New history length:', window.history.length);
  }

  // Enhanced history management - use a more precise approach
  function smartHistoryCleanup() {
    if (window.history.length > 30) {
      console.log('🔄 Smart history cleanup: Length was', window.history.length);
      
      // Store current path only if we haven't recently cleaned up
      const lastCleanup = parseInt(sessionStorage.getItem('smartCleanupTime') || '0');
      const cooldownPeriod = 60000; // 1 minute cooldown
      
      if (Date.now() - lastCleanup < cooldownPeriod) {
        console.log('🔄 Cleanup skipped - cooling down:', Math.round((Date.now() - lastCleanup)/1000), 'seconds since last');
        return false;
      }
      
      // Store the current path to return to after cleanup
      const currentPath = window.location.pathname;
      
      // Reset the history by replacing the current state
      // This effectively clears forward history
      window.history.replaceState({cleaned: Date.now()}, '', currentPath);
      
      // Set a flag to indicate history was cleaned
      sessionStorage.setItem('smartCleanupTime', Date.now().toString());
      
      console.log('🔄 History cleaned via state replacement');
      return true;
    }
    return false;
  }
  
  // Run smart cleanup unless we're in a special situation
  if (!sessionStorage.getItem('skip_cleanup')) {
    smartHistoryCleanup();
  }

  // Save route state in sessionStorage
  function saveRouteState(routePath) {
    if (!routePath) return;
    
    try {
      sessionStorage.setItem('route:' + routePath, JSON.stringify({
        timestamp: Date.now(),
        state: window.history.state || null
      }));
    } catch (e) {
      console.error('❌ Error saving route state:', e);
    }
  }

  // Clean up old stored routes when exceeding capacity
  function cleanStoredRoutes() {
    try {
      // Get all route entries
      const storedRoutes = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('route:/')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key) || '{"timestamp":0}');
            storedRoutes.push({
              key,
              timestamp: data.timestamp || 0
            });
          } catch (e) {
            // Invalid JSON, remove it
            sessionStorage.removeItem(key);
          }
        }
      }
      
      // Remove oldest 25% of routes when exceeding capacity
      if (storedRoutes.length > 15) {
        console.log('🧹 Cleaning up old route states. Count:', storedRoutes.length);
        storedRoutes
          .sort((a,b) => a.timestamp - b.timestamp)
          .slice(0, Math.floor(storedRoutes.length * 0.25))
          .forEach(({key}) => sessionStorage.removeItem(key));
      }
    } catch (e) {
      console.error('❌ Error in cleanStoredRoutes:', e);
    }
  }

  // Save current route
  saveRouteState(window.location.pathname);
  
  // Intercept pushState to track routes
  const originalPushState = window.history.pushState;
  window.history.pushState = function(state, title, url) {
    originalPushState.apply(this, arguments);
    
    if (url) {
      try {
        // Extract path from URL
        const newPath = new URL(url, window.location.origin).pathname;
        
        // Save previous and current routes
        const currentRoute = sessionStorage.getItem('currentRoute');
        if (currentRoute) {
          sessionStorage.setItem('previousRoute', currentRoute);
        }
        
        sessionStorage.setItem('currentRoute', newPath);
        saveRouteState(newPath);
        
        // Clean up old routes
        cleanStoredRoutes();
      } catch (e) {
        console.error('❌ Error in route tracking:', e);
      }
    }
  };

  // Gather debug information
  const debugInfo = {
    currentURL: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer || 'No referrer',
    userAgent: navigator.userAgent,
    history: window.history.length,
    storageAvailable: true,
    routeTracking: {
      current: sessionStorage.getItem('currentRoute') || 'None',
      previous: sessionStorage.getItem('previousRoute') || 'None'
    },
    storageSize: sessionStorage.length,
    timestamp: new Date().toISOString()
  };
  
  // Output debug information to console
  console.log('📍 Route Debug Information:', debugInfo);
  
  // Performance monitoring
  if (typeof performance !== 'undefined') {
    // Setup performance monitoring interval
    const MONITOR_INTERVAL = 30000; // 30 seconds
    
    const performanceMonitor = setInterval(() => {
      // Only continue if document is visible to avoid background processing
      if (document.visibilityState === 'hidden') return;
      
      const memoryInfo = performance.memory ? 
        `${Math.round(performance.memory.usedJSHeapSize/1024/1024)}MB / ${Math.round(performance.memory.jsHeapSizeLimit/1024/1024)}MB` : 
        'Not available';
        
      console.table({
        timestamp: new Date().toLocaleTimeString(),
        historyLength: window.history.length,
        sessionStorageItems: sessionStorage.length,
        memoryUsage: memoryInfo
      });
      
      // Stop monitoring after 10 minutes to avoid unnecessary overhead
      const runTime = parseInt(sessionStorage.getItem('monitorRunTime') || '0');
      const MAX_MONITOR_TIME = 600000; // 10 minutes
      
      if (runTime > MAX_MONITOR_TIME) {
        console.log('📊 Performance monitoring stopped after 10 minutes');
        clearInterval(performanceMonitor);
      } else {
        sessionStorage.setItem('monitorRunTime', (runTime + MONITOR_INTERVAL).toString());
      }
    }, MONITOR_INTERVAL);
    
    // Clear monitoring on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(performanceMonitor);
    });
  }
  
  // Add global history cleanup function for debugging
  window.clearRouteHistory = function() {
    const currentPath = window.location.pathname;
    console.log('📍 Manual history cleanup initiated. Current length:', window.history.length);
    
    // Less aggressive approach - just replace the current state
    window.history.replaceState({cleaned: true}, document.title, currentPath);
    
    // Clean sessionStorage but keep essential items
    const essentialKeys = ['currentRoute', 'lastCleanup'];
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && !essentialKeys.includes(key) && key.startsWith('route:/')) {
        sessionStorage.removeItem(key);
      }
    }
    
    console.log('📍 History cleaned. Length is now:', window.history.length);
    return 'History cleaned - refresh page if issues persist';
  };
  
  // Add a more aggressive reset for severe cases
  window.forceRouteReset = function() {
    const currentPath = window.location.pathname;
    console.log('⚠️ Force reset initiated. Current history length:', window.history.length);
    
    // Set flags for restore after reload
    sessionStorage.setItem('hard_reset', 'true');
    sessionStorage.setItem('return_to', currentPath);
    
    // Replace current state to minimize history
    window.history.replaceState(null, document.title, currentPath);
    
    // Force reload
    window.location.replace(currentPath);
    
    return 'Force reset initiated - page will reload';
  };
})(); 