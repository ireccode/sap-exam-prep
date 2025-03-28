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

  // Check and clean browser history if needed
  if (window.history.length > 30) {
    console.log('🔄 History cleanup: Length was', window.history.length);
    
    // Store the current path to return to after cleanup
    const currentPath = window.location.pathname;
    
    // Reset the history by replacing the current state
    // This effectively clears forward history
    window.history.replaceState(null, '', currentPath);
    
    // Set a flag to indicate history was cleaned
    sessionStorage.setItem('history_cleaned', Date.now().toString());
    
    console.log('🔄 History cleaned - new length should be reset');
  }

  // Special handling for known problematic routes
  if (window.location.pathname === '/aichat') {
    console.log('🔴 DEBUG FIX: Detected troublesome /aichat route');
    
    // Record the problematic route
    sessionStorage.setItem('fix_route_ai_chat', '1');
    
    // Check if we need to force a navigation fix
    if (sessionStorage.getItem('fix_route_ai_chat_attempt') === '1') {
      console.log('🔴 DEBUG FIX: Applying special fix for /aichat route');
      sessionStorage.removeItem('fix_route_ai_chat_attempt');
      window.history.pushState(null, '', '/');
      window.history.pushState(null, '', '/aichat');
    }
  }

  const debugInfo = {
    currentURL: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer || 'No referrer',
    userAgent: navigator.userAgent,
    fallbacksAttempted: [],
    history: window.history.length,
    storageAvailable: true,
    routeFixAttempt: sessionStorage.getItem('fix_route_ai_chat') === '1'
  };
  
  // Check session storage entries for fallback attempts
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('fallback_')) {
        debugInfo.fallbacksAttempted.push({
          key: key,
          value: sessionStorage.getItem(key)
        });
      }
    }
    
    debugInfo.fallbackAttempt = sessionStorage.getItem('fallbackAttempt');
  } catch (e) {
    debugInfo.storageAvailable = false;
    debugInfo.storageError = e.message;
  }
  
  // Output debug information to console
  console.log('📍 Route Debug Information:', debugInfo);
  
  // Add global history cleanup function for debugging
  window.clearRouteHistory = function() {
    const currentPath = window.location.pathname;
    console.log('📍 Manual history cleanup initiated. Current length:', window.history.length);
    
    // Hard reset approach
    localStorage.clear();  // Clear all localStorage items
    sessionStorage.clear(); // Clear all sessionStorage items
    
    // Set a flag to indicate we're doing a hard reset
    sessionStorage.setItem('hard_reset', 'true');
    sessionStorage.setItem('return_to', currentPath);
    
    // Replace the current history entry to minimize history
    window.history.replaceState(null, document.title, currentPath);
    
    // Force a reload with clean history
    window.location.replace(currentPath);
    
    return 'Performing hard history reset... page will reload';
  };
  
})(); 