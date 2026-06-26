import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isDataSaverEnabled,
  isSlowNetworkConnection,
  shouldRunBackgroundRoutePrefetch,
} from './prefetch-budget';

describe('prefetch-budget', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows background prefetch when connection info is unavailable', () => {
    expect(shouldRunBackgroundRoutePrefetch()).toBe(true);
  });

  it('blocks background prefetch when saveData is enabled', () => {
    vi.stubGlobal('navigator', {
      connection: { saveData: true },
    });
    expect(isDataSaverEnabled()).toBe(true);
    expect(shouldRunBackgroundRoutePrefetch()).toBe(false);
  });

  it('blocks background prefetch on slow-2g', () => {
    vi.stubGlobal('navigator', {
      connection: { effectiveType: 'slow-2g' },
    });
    expect(isSlowNetworkConnection()).toBe(true);
    expect(shouldRunBackgroundRoutePrefetch()).toBe(false);
  });
});
