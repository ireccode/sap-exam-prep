// Route Refresh - External script
// This script handles route-specific issues and history management

(function() {
  // Constants for history management
  const MAX_HISTORY_LENGTH = 20;
  const CLEANUP_COOLDOWN = 30000; // 30 seconds

  // Improved history management function
  function manageHistory() {
    if (window.history.length > MAX_HISTORY_LENGTH) {
      const lastCleanup = parseInt(sessionStorage.getItem('lastCleanup') || '0');
      
      if (Date.now() - lastCleanup > CLEANUP_COOLDOWN) {
        console.log('[Route Fix] Performing history cleanup. Length:', window.history.length);
        window.history.replaceState({ clean: true }, '', window.location.href);
        sessionStorage.setItem('lastCleanup', Date.now().toString());
      } else {
        console.log('[Route Fix] Skipping cleanup, cooling down. Last cleanup:', Math.round((Date.now() - lastCleanup) / 1000), 'seconds ago');
      }
    }
  }

  // Call history management on load
  manageHistory();

  // State management for routes
  function saveRouteState(routePath) {
    try {
      sessionStorage.setItem(routePath, JSON.stringify({
        timestamp: Date.now(),
        state: window.history.state
      }));
    } catch (e) {
      console.error('[Route Fix] Error saving route state:', e);
    }
  }

  // Smart cleanup for stored route states
  function smartCleanup() {
    try {
      const storedRoutes = Object.keys(sessionStorage)
        .filter(key => key.startsWith('/'))
        .map(key => ({
          key,
          timestamp: JSON.parse(sessionStorage.getItem(key) || '{"timestamp":0}').timestamp
        }));
      
      // Remove oldest 25% of routes when exceeding capacity
      if (storedRoutes.length > 15) {
        console.log('[Route Fix] Cleaning up old route states. Count:', storedRoutes.length);
        storedRoutes
          .sort((a,b) => a.timestamp - b.timestamp)
          .slice(0, Math.floor(storedRoutes.length * 0.25))
          .forEach(({key}) => sessionStorage.removeItem(key));
      }
    } catch (e) {
      console.error('[Route Fix] Error in smartCleanup:', e);
    }
  }

  // Save current route state
  saveRouteState(window.location.pathname);
  
  // Check if we need to restore path after hard reset
  if (sessionStorage.getItem('return_to_path')) {
    const path = sessionStorage.getItem('return_to_path');
    console.log('[Route Fix] Restoring path after history reset:', path);
    sessionStorage.removeItem('return_to_path');
    
    // Only navigate if we're not already there
    if (path && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }
  
  // Route integration - detect navigation via history API
  const originalPushState = window.history.pushState;
  window.history.pushState = function(state, title, url) {
    originalPushState.apply(this, arguments);
    
    // Save previous route
    sessionStorage.setItem('previousRoute', sessionStorage.getItem('currentRoute') || '');
    
    // Set current route if URL is valid
    if (url) {
      try {
        const newPath = new URL(url, window.location.origin).pathname;
        sessionStorage.setItem('currentRoute', newPath);
        saveRouteState(newPath);
      } catch (e) {
        console.error('[Route Fix] Error processing URL:', e);
      }
    }
    
    // Run smart cleanup after navigation
    smartCleanup();
  };
  
  // Run clean up periodically
  setInterval(smartCleanup, 60000); // Every minute
})(); 