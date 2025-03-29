/**
 * Route Fallback Service
 * 
 * This service provides utilities for handling route fallbacks in the application.
 * It works with the cascading fallback system implemented in 404.html.
 */

/**
 * Array of fallback routes in order of preference
 */
export const FALLBACK_ROUTES = [
  '/', // Home/Dashboard route
  '/login', // Login route
];

/**
 * Handles navigation errors by implementing a cascading fallback strategy
 * @param currentPath The path that failed to load
 * @param navigate A navigation function (from react-router-dom's useNavigate)
 * @param resetAttempts Whether to reset the fallback attempts counter
 * @returns True if a fallback was attempted, false otherwise
 */
export function handleRouteFallback(
  currentPath: string,
  navigate: (path: string) => void,
  resetAttempts = false
): boolean {
  // Normalize the path for storage key
  // Replace / with _ to avoid issues with storage key naming
  const fallbackKey = `fallback_${currentPath.replace(/\//g, '_')}`;
  let attemptCount = parseInt(sessionStorage.getItem(fallbackKey) || '0');
  
  console.log(`[Route Fallback] Checking fallback for path: ${currentPath}`);
  console.log(`[Route Fallback] Current attempt: ${attemptCount}`);
  
  // Reset attempts if requested
  if (resetAttempts) {
    console.log(`[Route Fallback] Resetting attempts for ${currentPath}`);
    sessionStorage.removeItem(fallbackKey);
    attemptCount = 0;
  }
  
  // Don't attempt fallback if we're already on a fallback route
  if (FALLBACK_ROUTES.includes(currentPath)) {
    console.log(`[Route Fallback] Already on fallback route: ${currentPath}`);
    return false;
  }
  
  // If we've tried all fallbacks, don't attempt anymore
  if (attemptCount >= FALLBACK_ROUTES.length) {
    console.error(`[Route Fallback] All fallbacks exhausted for path: ${currentPath}`);
    sessionStorage.removeItem(fallbackKey);
    return false;
  }
  
  // Get the next fallback route
  const fallbackRoute = FALLBACK_ROUTES[attemptCount];
  
  // Increment the attempt counter
  sessionStorage.setItem(fallbackKey, (attemptCount + 1).toString());
  
  // Log the fallback attempt
  console.log(`[Route Fallback] Redirecting from ${currentPath} -> ${fallbackRoute} (attempt ${attemptCount + 1})`);
  
  // Navigate to the fallback route
  navigate(fallbackRoute);
  return true;
}

/**
 * Reset all fallback attempts in the session storage
 */
export function resetAllFallbackAttempts(): void {
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('fallback_')) {
      sessionStorage.removeItem(key);
    }
  });
}

export default {
  handleRouteFallback,
  resetAllFallbackAttempts,
  FALLBACK_ROUTES
}; 