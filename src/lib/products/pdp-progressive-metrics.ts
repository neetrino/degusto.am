import { logger } from '@/lib/utils/logger';

const PDP_METRIC_SESSION_KEY = 'pdp-progressive-metric-session';
const PDP_METRIC_TTL_MS = 60_000;

type ProgressiveSource = 'visual' | 'summary' | 'full' | 'unknown';

interface PdpMetricSession {
  slug: string;
  startedAt: number;
  startedPerfAt: number;
  primaryMeasured: boolean;
  fullMeasured: boolean;
}

let activeSession: PdpMetricSession | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readSession(): PdpMetricSession | null {
  if (!isBrowser()) {
    return null;
  }
  if (activeSession) {
    return activeSession;
  }
  try {
    const raw = window.sessionStorage.getItem(PDP_METRIC_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PdpMetricSession;
    if (Date.now() - parsed.startedAt > PDP_METRIC_TTL_MS) {
      window.sessionStorage.removeItem(PDP_METRIC_SESSION_KEY);
      return null;
    }
    activeSession = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: PdpMetricSession | null): void {
  if (!isBrowser()) {
    return;
  }
  activeSession = session;
  if (!session) {
    window.sessionStorage.removeItem(PDP_METRIC_SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(PDP_METRIC_SESSION_KEY, JSON.stringify(session));
}

function measureDurationMs(session: PdpMetricSession): number {
  return Math.max(0, Number((performance.now() - session.startedPerfAt).toFixed(1)));
}

export function beginPdpNavigationMetric(slug: string): void {
  if (!isBrowser()) {
    return;
  }
  persistSession({
    slug: slug.trim(),
    startedAt: Date.now(),
    startedPerfAt: performance.now(),
    primaryMeasured: false,
    fullMeasured: false,
  });
}

export function markPdpPrimaryPaintMetric(
  slug: string,
  source: ProgressiveSource
): void {
  const session = readSession();
  if (!session || session.slug !== slug.trim() || session.primaryMeasured) {
    return;
  }
  session.primaryMeasured = true;
  persistSession(session);
  const primaryPaintMs = measureDurationMs(session);
  logger.debug('PDP progressive metric: primary paint', {
    slug,
    source,
    primaryPaintMs,
  });
}

export function markPdpFullHydrationMetric(slug: string): void {
  const session = readSession();
  if (
    !session ||
    session.slug !== slug.trim() ||
    session.fullMeasured ||
    !session.primaryMeasured
  ) {
    return;
  }
  session.fullMeasured = true;
  const totalMs = measureDurationMs(session);
  logger.debug('PDP progressive metric: full hydration', {
    slug,
    totalMs,
  });
  persistSession(null);
}
