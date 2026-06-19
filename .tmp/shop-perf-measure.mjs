/**
 * TEMP Phase 2 shop performance baseline collector.
 * Usage: node .tmp/shop-perf-measure.mjs
 */
const BASE = process.env.SHOP_PERF_BASE ?? 'http://localhost:3000';

function percentile(sorted, q) {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((sorted.length - 1) * q);
  return sorted[idx] ?? sorted[sorted.length - 1] ?? 0;
}

async function timedFetch(url, opts = {}) {
  const started = performance.now();
  const res = await fetch(url, { ...opts, redirect: 'follow' });
  const body = Buffer.from(await res.arrayBuffer());
  const durationMs = performance.now() - started;
  return {
    url,
    status: res.status,
    durationMs,
    sizeBytes: body.length,
    headers: Object.fromEntries(res.headers.entries()),
    bodyPreview: body.slice(0, 200).toString('utf8'),
  };
}

async function runSamples(label, url, count = 3) {
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    samples.push(await timedFetch(url, { headers: { 'Cache-Control': 'no-cache' } }));
    await new Promise((r) => setTimeout(r, 150));
  }
  const durations = samples.map((s) => s.durationMs).sort((a, b) => a - b);
  const sizes = samples.map((s) => s.sizeBytes);
  return {
    label,
    url,
    samples: samples.length,
    durationMin: durations[0] ?? 0,
    durationP50: percentile(durations, 0.5),
    durationP95: percentile(durations, 0.95),
    durationMax: durations[durations.length - 1] ?? 0,
    sizeBytesP50: percentile(sizes.sort((a, b) => a - b), 0.5),
    lastHeaders: samples[samples.length - 1]?.headers ?? {},
    status: samples[samples.length - 1]?.status ?? 0,
  };
}

async function main() {
  const coldSearch = `perf${Date.now()}`;
  const scenarios = [
    { label: 'shop-html-base', url: `${BASE}/shop` },
    { label: 'shop-html-category-pizza', url: `${BASE}/shop?category=pizza` },
    { label: 'shop-html-search-cold', url: `${BASE}/shop?search=${coldSearch}` },
    { label: 'shop-html-price-filter', url: `${BASE}/shop?minPrice=1000&maxPrice=50000` },
    { label: 'shop-html-taste-pepper', url: `${BASE}/shop?taste=pepper` },
    { label: 'shop-html-page-2', url: `${BASE}/shop?category=all&page=2` },
    { label: 'api-menu-products-base', url: `${BASE}/api/v1/shop/menu-products?category=all&page=1` },
    { label: 'api-menu-products-pizza', url: `${BASE}/api/v1/shop/menu-products?category=pizza&page=1` },
    { label: 'api-menu-products-search-cold', url: `${BASE}/api/v1/shop/menu-products?search=${coldSearch}&page=1` },
    { label: 'api-menu-products-filtered', url: `${BASE}/api/v1/shop/menu-products?category=all&search=chicken&taste=pepper&minPrice=1000&maxPrice=30000&page=1` },
  ];

  const results = [];
  for (const scenario of scenarios) {
    results.push(await runSamples(scenario.label, scenario.url, 3));
  }

  let perfHealth = null;
  try {
    const healthRes = await fetch(`${BASE}/api/health/perf/shop-menu?runs=3`);
    if (healthRes.ok) {
      perfHealth = await healthRes.json();
    }
  } catch {
    perfHealth = { error: 'unavailable' };
  }

  const payload = {
    measuredAt: new Date().toISOString(),
    base: BASE,
    scenarios: results,
    perfHealth,
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
