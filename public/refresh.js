// Route Refresh - External script
// This script handles route-specific issues and history management

(function() {
  // More aggressive history cleanup when it gets too large
  if (window.history.length > 15) {
    console.log('[Route Fix] History too large:', window.history.length);
    
    try {
      // Store current location
      const currentPath = window.location.pathname;
      const currentUrl = window.location.href;
      
      // History replacement approach
      // This forces a reload but with a clean history
      if (window.history.length > 25) {
        console.log('[Route Fix] Performing hard history reset');
        sessionStorage.setItem('return_to_path', currentPath);
        window.location.replace(currentUrl);
        return; // Stop execution to allow redirect
      }
      
      // For moderate cases, try to compact history
      if (sessionStorage.getItem('history_cleaned_timestamp')) {
        // Don't repeat cleanup too often
        const lastCleanup = parseInt(sessionStorage.getItem('history_cleaned_timestamp') || '0');
        const timeSince = Date.now() - lastCleanup;
        
        if (timeSince < 60000) { // Less than 1 minute ago
          console.log('[Route Fix] Skipping cleanup, last done', Math.round(timeSince/1000), 'seconds ago');
          return;
        }
      }
      
      // Try to compact history by replacing state
      console.log('[Route Fix] Compacting history');
      
      // Replace the current URL in history
      window.history.replaceState({clean: true}, document.title, currentUrl);
      
      // Track cleanup
      sessionStorage.setItem('history_cleaned_timestamp', Date.now().toString());
      sessionStorage.setItem('history_length_before', window.history.length.toString());
    } catch (e) {
      console.error('[Route Fix] Error cleaning history:', e);
    }
  }
  
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
  
  // Check if we're returning after a page reload with auth issues
  window.addEventListener('DOMContentLoaded', function() {
    const isAiChatRoute = window.location.pathname === '/aichat';
    const hadError = localStorage.getItem('ai_chat_had_error') === 'true';
    
    if (isAiChatRoute && hadError) {
      console.log('[Route Fix] Detected previous error, clearing for fresh state');
      localStorage.removeItem('ai_chat_had_error');
    }
  });
})(); 