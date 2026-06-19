/**
 * TEMP Phase 2 browser baseline for /shop.
 * Usage: npx --yes playwright@1.49.1 install chromium && node .tmp/shop-browser-perf.mjs
 */
import { chromium, devices } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.SHOP_PERF_BASE ?? 'http://localhost:3000';

async function collectScenario(browser, name, contextOptions, url) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const requests = [];

  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      startTime: Date.now(),
    });
  });

  page.on('response', async (res) => {
    const reqUrl = res.url();
    const match = requests.find(
      (r) => r.url === reqUrl && r.responseStatus === undefined
    );
    const headers = await res.allHeaders();
    const body = await res.body().catch(() => Buffer.alloc(0));
    const entry = {
      url: reqUrl,
      method: res.request().method(),
      status: res.status(),
      resourceType: res.request().resourceType(),
      durationMs: match ? Date.now() - match.startTime : null,
      sizeBytes: body.length,
      responseHeaders: {
        'x-shop-api-total-ms': headers['x-shop-api-total-ms'],
        'x-shop-service-ms': headers['x-shop-service-ms'],
        'content-type': headers['content-type'],
      },
    };
    if (match) {
      match.responseStatus = res.status();
      match.durationMs = entry.durationMs;
      match.sizeBytes = entry.sizeBytes;
    }
    requests.push({ type: 'response', ...entry });
  });

  const navStart = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  const navEnd = Date.now();

  await page.waitForSelector('article, [aria-busy="true"]', { timeout: 30000 }).catch(() => {});

  const firstProductVisibleMs = await page.evaluate(() => {
    const t0 = performance.timeOrigin;
    const article = document.querySelector('article');
    if (!article) return null;
    return performance.now();
  });

  const productCards = await page.locator('article').count();
  const interactive = await page.evaluate(() => {
    const btn = document.querySelector('button[type="button"]');
    return Boolean(btn);
  });

  const renderCounts = await page.evaluate(() => ({
    renders: window.__SHOP_PERF_RENDERS ?? null,
    events: window.__SHOP_PERF_EVENTS ?? null,
  }));

  const webVitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((p) => p.name === 'first-contentful-paint');
    return {
      domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
      loadEventEnd: nav?.loadEventEnd ?? null,
      responseStart: nav?.responseStart ?? null,
      transferSize: nav?.transferSize ?? null,
      encodedBodySize: nav?.encodedBodySize ?? null,
      fcp: fcp?.startTime ?? null,
    };
  });

  // Filter benchmark: soft category click on desktop viewport only
  let filterBenchmark = null;
  if (name.includes('desktop')) {
    const sidebarLink = page.locator('aside a[href*="category="]').first();
    if (await sidebarLink.count()) {
      const href = await sidebarLink.getAttribute('href');
      const beforeCards = await page.locator('article').count();
      const t0 = Date.now();
      await sidebarLink.click({ force: true });
      await page.waitForTimeout(50);
      const duringPending = await page.locator('[aria-busy="true"]').count();
      await page.waitForFunction(
        () => {
          const events = window.__SHOP_PERF_EVENTS ?? [];
          return events.some((e) => e.event === 'soft-nav-complete');
        },
        { timeout: 15000 }
      ).catch(() => null);
      const t1 = Date.now();
      const afterCards = await page.locator('article').count();
      const events = await page.evaluate(() => window.__SHOP_PERF_EVENTS ?? []);
      const softStart = events.find((e) => e.event === 'soft-nav-start');
      const softEnd = events.find((e) => e.event === 'soft-nav-complete');
      filterBenchmark = {
        action: 'desktop-soft-category',
        href,
        beforeCards,
        afterCards,
        clickToCompleteMs: softEnd && softStart ? softEnd.t - softStart.t : t1 - t0,
        skeletonVisibleDuring: duringPending > 0,
        listEmptiedDuringNav: beforeCards > 0 && afterCards === 0,
      };
    }
  }

  const responseRows = requests.filter((r) => r.type === 'response');
  const apiRows = responseRows.filter((r) => r.url.includes('/api/'));
  const shopApiRows = responseRows.filter((r) => r.url.includes('/shop') || r.url.includes('menu-products'));

  const result = {
    name,
    url,
    navigationMs: navEnd - navStart,
    productCards,
    interactive,
    firstProductVisibleMs,
    webVitals,
    renderCounts,
    filterBenchmark,
    requestSummary: {
      totalResponses: responseRows.length,
      apiResponses: apiRows.length,
      shopRelatedResponses: shopApiRows.length,
      totalTransferBytes: responseRows.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0),
      slowest: [...responseRows]
        .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
        .slice(0, 8),
    },
    shopApi,
  };

  // fix typo - shopApi should be shopApiRows mapped
  result.shopApi = shopApiRows.map((r) => ({
    url: r.url,
    durationMs: r.durationMs,
    sizeBytes: r.sizeBytes,
    headers: r.responseHeaders,
  }));

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const scenarios = [
    {
      name: 'desktop-shop-base',
      context: { viewport: { width: 1440, height: 900 } },
      url: `${BASE}/shop?shopPerf=1&category=all`,
    },
    {
      name: 'mobile-shop-base',
      context: { ...devices['iPhone 13'] },
      url: `${BASE}/shop?shopPerf=1`,
    },
    {
      name: 'desktop-shop-filtered',
      context: { viewport: { width: 1440, height: 900 } },
      url: `${BASE}/shop?shopPerf=1&search=chicken&minPrice=1000&maxPrice=30000&taste=pepper`,
    },
  ];

  const out = {
    measuredAt: new Date().toISOString(),
    scenarios: [],
  };

  for (const s of scenarios) {
    out.scenarios.push(await collectScenario(browser, s.name, s.context, s.url));
  }

  await browser.close();
  const json = JSON.stringify(out, null, 2);
  writeFileSync('.tmp/shop-browser-perf.json', json);
  console.log(json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
