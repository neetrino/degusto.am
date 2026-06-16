import { useEffect, useState } from 'react';

/**
 * Becomes true only after client hydration is complete.
 * Use for browser-only enhancements that must not affect SSR/first client render.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
