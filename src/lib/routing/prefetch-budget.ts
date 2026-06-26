/** Network / data-saver gates for background route warmup (no new dependencies). */

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
};

function getNetworkInformation(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  return nav.connection;
}

/** True when the user enabled OS/browser data saver. */
export function isDataSaverEnabled(): boolean {
  return getNetworkInformation()?.saveData === true;
}

/** True on very slow connections where background prefetch hurts more than it helps. */
export function isSlowNetworkConnection(): boolean {
  const connection = getNetworkInformation();
  if (!connection) {
    return false;
  }
  const effectiveType = connection.effectiveType?.toLowerCase();
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return true;
  }
  return typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 1;
}

/** Whether idle / mount background route prefetch should run. Pointer/hover prefetch stays enabled. */
export function shouldRunBackgroundRoutePrefetch(): boolean {
  return !isDataSaverEnabled() && !isSlowNetworkConnection();
}

type IdleScheduleOptions = {
  timeout?: number;
  fallbackDelayMs?: number;
};

/** Schedules low-priority prefetch work after first paint. */
export function scheduleIdlePrefetch(
  work: () => void,
  options?: IdleScheduleOptions
): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => work(), { timeout: options?.timeout ?? 500 });
    return;
  }
  window.setTimeout(work, options?.fallbackDelayMs ?? 200);
}
