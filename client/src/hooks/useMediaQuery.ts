import { useState, useEffect } from 'react';

/**
 * Hook per responsive design basato su media queries
 * @param query - Media query string (es. "(max-width: 768px)")
 * @returns boolean - true se la media query matcha
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener function
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
