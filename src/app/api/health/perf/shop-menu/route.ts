import { NextRequest, NextResponse } from 'next/server';
import {
  parseShopMenuSearchParams,
  toShopMenuProductsQuery,
} from '@/lib/services/shop-page/parse-shop-menu-search-params';
import { getShopMenuProductsPageWithMetrics } from '@/lib/services/shop-page/shop-page-data.service';

type PerfSample = {
  totalMs: number;
  serviceMs: number;
  cardsCount: number;
  totalPages: number;
  effectivePage: number;
};

type PerfScenarioResult = {
  name: string;
  query: string;
  totalMs: {
    min: number;
    p50: number;
    p95: number;
    max: number;
  };
  serviceMs: {
    min: number;
    p50: number;
    p95: number;
    max: number;
  };
  runs: PerfSample[];
};

const DEFAULT_RUNS = 3;
const MIN_RUNS = 1;
const MAX_RUNS = 15;
const DEFAULT_REGRESSION_THRESHOLD_MS = 1500;
const MIN_REGRESSION_THRESHOLD_MS = 100;
const MAX_REGRESSION_THRESHOLD_MS = 10000;

type ScenarioDefinition = {
  name: string;
  queryParams: Record<string, string>;
};

const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    name: 'base-page-1',
    queryParams: {
      category: 'all',
      page: '1',
    },
  },
  {
    name: 'base-page-2',
    queryParams: {
      category: 'all',
      page: '2',
    },
  },
  {
    name: 'search-chicken',
    queryParams: {
      category: 'all',
      search: 'chicken',
      page: '1',
    },
  },
  {
    name: 'filtered-spicy',
    queryParams: {
      category: 'all',
      search: 'chicken',
      taste: 'pepper',
      minPrice: '1000',
      maxPrice: '30000',
      page: '1',
    },
  },
];

function toNumberInRange(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const safeQ = Math.min(1, Math.max(0, q));
  const index = Math.floor((sorted.length - 1) * safeQ);
  return sorted[index] ?? sorted[sorted.length - 1] ?? 0;
}

function summarize(values: readonly number[]): { min: number; p50: number; p95: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

function buildScenarioSearchParams(
  requestSearchParams: URLSearchParams,
  scenario: ScenarioDefinition
): URLSearchParams {
  const next = new URLSearchParams();
  const lang = requestSearchParams.get('lang');
  if (lang) {
    next.set('lang', lang);
  }
  for (const [key, value] of Object.entries(scenario.queryParams)) {
    next.set(key, value);
  }
  return next;
}

async function runScenario(
  requestSearchParams: URLSearchParams,
  scenario: ScenarioDefinition,
  runs: number
): Promise<PerfScenarioResult> {
  const scenarioParams = buildScenarioSearchParams(requestSearchParams, scenario);
  const parsed = parseShopMenuSearchParams(scenarioParams);
  const query = toShopMenuProductsQuery(parsed);
  const samples: PerfSample[] = [];

  for (let index = 0; index < runs; index += 1) {
    const startedAt = Date.now();
    const { data, metrics } = await getShopMenuProductsPageWithMetrics(query);
    samples.push({
      totalMs: Date.now() - startedAt,
      serviceMs: metrics.totalServiceMs,
      cardsCount: data.cards.length,
      totalPages: data.totalPages,
      effectivePage: data.effectivePage,
    });
  }

  const totalMsValues = samples.map((sample) => sample.totalMs);
  const serviceMsValues = samples.map((sample) => sample.serviceMs);

  return {
    name: scenario.name,
    query: scenarioParams.toString(),
    totalMs: summarize(totalMsValues),
    serviceMs: summarize(serviceMsValues),
    runs: samples,
  };
}

/**
 * GET /api/health/perf/shop-menu
 * Dev-only summary for detecting latency regressions on shop/combo menu-product scenarios.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ status: 'not_available' }, { status: 404 });
  }

  const searchParams = new URL(req.url).searchParams;
  const runs = toNumberInRange(searchParams.get('runs'), DEFAULT_RUNS, MIN_RUNS, MAX_RUNS);
  const regressionThresholdMs = toNumberInRange(
    searchParams.get('regressionThresholdMs'),
    DEFAULT_REGRESSION_THRESHOLD_MS,
    MIN_REGRESSION_THRESHOLD_MS,
    MAX_REGRESSION_THRESHOLD_MS
  );

  const results: PerfScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    const result = await runScenario(searchParams, scenario, runs);
    results.push(result);
  }

  const regressions = results
    .filter((item) => item.serviceMs.p95 > regressionThresholdMs)
    .map((item) => ({
      scenario: item.name,
      p95ServiceMs: item.serviceMs.p95,
      thresholdMs: regressionThresholdMs,
    }));

  return NextResponse.json(
    {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      runsPerScenario: runs,
      regressionThresholdMs,
      regressions,
      scenarios: results,
    },
    { status: 200 }
  );
}
