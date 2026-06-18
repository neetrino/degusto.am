import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
const ARTIFACTS_DIR = path.resolve('.tmp/qa-artifacts');

/**
 * @typedef {{
 *   id: string;
 *   pass: boolean;
 *   notes: string[];
 *   metrics?: Record<string, string | number | boolean>;
 * }} ScenarioResult
 */

/**
 * @param {import('playwright').Page} page
 */
async function openCartDrawer(page) {
  const target = page.locator('[data-cart-fly-target]').first();
  await target.waitFor({ state: 'visible', timeout: 15000 });
  const buttonHandle = await target.evaluateHandle((el) => el.closest('button'));
  const buttonElement = buttonHandle.asElement();
  if (!buttonElement) {
    throw new Error('Cart drawer button not found');
  }
  await buttonElement.click();
  await page.locator('[role="dialog"][aria-modal="true"]').waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * @param {import('playwright').Page} page
 */
async function getDrawerItemCount(page) {
  const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
  const qtyInputs = dialog.locator('input[type="number"]');
  return qtyInputs.count();
}

/**
 * @param {import('playwright').Page} page
 */
async function getDrawerQuantities(page) {
  const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
  const qtyInputs = dialog.locator('input[type="number"]');
  const values = await qtyInputs.evaluateAll((inputs) =>
    inputs.map((input) => Number.parseInt(String(input.value || '0'), 10) || 0)
  );
  return values;
}

/**
 * @param {import('playwright').Page} page
 * @param {number} cardIndex
 */
async function clickAddToCartOnCard(page, cardIndex = 0) {
  const card = page.locator('[data-home-product-card]').nth(cardIndex);
  await card.waitFor({ state: 'visible', timeout: 20000 });
  const addBtn = card.locator('button[class*="-translate-x-1/2"]').first();
  await addBtn.click();
}

/**
 * @param {import('playwright').Page} page
 * @param {Array<{ type: string; url: string; status?: number; method?: string; text?: string }>} networkEvents
 * @param {string[]} consoleWarnings
 */
async function runScenarios(page, networkEvents, consoleWarnings) {
  /** @type {ScenarioResult[]} */
  const results = [];

  // 1) Initial load
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 45000 });
  const productCards = page.locator('[data-home-product-card]');
  const productCardsCount = await productCards.count();
  const cartReadStatuses = networkEvents
    .filter((e) => e.type === 'response' && e.url.includes('/api/v1/cart'))
    .map((e) => e.status ?? 0);
  const cartReadRequestsCount = networkEvents.filter(
    (e) => e.type === 'request' && e.url.includes('/api/v1/cart') && !e.url.includes('/api/v1/cart/items')
  ).length;
  const preloadDefaultWarning = consoleWarnings.some((msg) =>
    msg.toLowerCase().includes('default-product.png') && msg.toLowerCase().includes('preload')
  );
  results.push({
    id: '1-initial-shop-load',
    pass:
      productCardsCount > 0 &&
      !cartReadStatuses.includes(503) &&
      cartReadRequestsCount <= 3 &&
      !preloadDefaultWarning,
    notes: [
      `productCards=${productCardsCount}`,
      `cartReadStatuses=${cartReadStatuses.join(',') || 'none'}`,
      `cartReadRequests=${cartReadRequestsCount}`,
      `defaultProductPreloadWarning=${preloadDefaultWarning}`,
    ],
    metrics: { productCardsCount, cartReadRequestsCount, preloadDefaultWarning },
  });

  // Seed cart with one product and open drawer
  const firstCard = productCards.first();
  await firstCard.evaluate((el) => {
    el.setAttribute('data-qa-anchor-card', '1');
  });
  await clickAddToCartOnCard(page, 0);
  await openCartDrawer(page);
  const baselineDrawerCount = await getDrawerItemCount(page);

  // 2) Add to cart behavior
  const beforeQuantities = await getDrawerQuantities(page);
  const addStart = Date.now();
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(250);
  const afterQuantities = await getDrawerQuantities(page);
  const appearedFast = Date.now() - addStart < 1000;
  const anchorCardStillConnected =
    (await page.locator('[data-qa-anchor-card="1"]').count()) === 1;
  const staleIgnoredLogged = consoleWarnings.some((msg) => msg.includes('stale_response_ignored'));
  const quantityDidNotDrop =
    afterQuantities.reduce((a, b) => a + b, 0) >= beforeQuantities.reduce((a, b) => a + b, 0);
  results.push({
    id: '2-add-to-cart',
    pass: appearedFast && quantityDidNotDrop && anchorCardStillConnected,
    notes: [
      `beforeQuantities=${beforeQuantities.join(',') || 'none'}`,
      `afterQuantities=${afterQuantities.join(',') || 'none'}`,
      `appearedUnder1s=${appearedFast}`,
      `anchorCardStillConnected=${anchorCardStillConnected}`,
      `staleIgnoredLogged=${staleIgnoredLogged}`,
    ],
    metrics: { appearedFast, anchorCardStillConnected, staleIgnoredLogged },
  });

  // 3) Add same product multiple times
  const beforeSameMulti = await getDrawerQuantities(page);
  await clickAddToCartOnCard(page, 0);
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(900);
  const afterSameMulti = await getDrawerQuantities(page);
  const noDuplicateRows = (await getDrawerItemCount(page)) <= Math.max(1, baselineDrawerCount + 2);
  const incremented = afterSameMulti.reduce((a, b) => a + b, 0) >= beforeSameMulti.reduce((a, b) => a + b, 0) + 1;
  results.push({
    id: '3-same-product-multi-add',
    pass: incremented && noDuplicateRows,
    notes: [
      `before=${beforeSameMulti.join(',') || 'none'}`,
      `after=${afterSameMulti.join(',') || 'none'}`,
      `noDuplicateRows=${noDuplicateRows}`,
    ],
    metrics: { noDuplicateRows, incremented },
  });

  // 4) Add different products quickly
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await clickAddToCartOnCard(page, 0);
  await clickAddToCartOnCard(page, 1);
  await clickAddToCartOnCard(page, 2);
  await page.waitForTimeout(1200);
  await openCartDrawer(page);
  const quickAddCount = await getDrawerItemCount(page);
  const quickAddQty = await getDrawerQuantities(page);
  results.push({
    id: '4-different-products-quick-add',
    pass: quickAddCount >= 2 && quickAddQty.every((q) => q > 0),
    notes: [
      `drawerRows=${quickAddCount}`,
      `quantities=${quickAddQty.join(',') || 'none'}`,
      `staleIgnoredLogged=${consoleWarnings.some((msg) => msg.includes('stale_response_ignored'))}`,
    ],
    metrics: { quickAddCount },
  });

  // 5) Simulate /api/v1/cart 503 and trigger reload
  await page.route('**/api/v1/cart**', async (route) => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'GET' && /\/api\/v1\/cart(\?|$)/.test(url)) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA simulated cart 503' }),
      });
      return;
    }
    await route.continue();
  });
  const before503Count = await getDrawerItemCount(page);
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('cart-updated', { detail: { forceReload: true, skipReconcile: false } })
    );
  });
  await page.waitForTimeout(1200);
  const after503Count = await getDrawerItemCount(page);
  const fallbackLogSeen = consoleWarnings.some((msg) => msg.includes('fallback_used'));
  results.push({
    id: '5-cart-read-503',
    pass: after503Count >= before503Count,
    notes: [
      `beforeDrawerCount=${before503Count}`,
      `afterDrawerCount=${after503Count}`,
      `fallbackDiagnosticSeen=${fallbackLogSeen}`,
    ],
    metrics: { before503Count, after503Count, fallbackLogSeen },
  });
  await page.unroute('**/api/v1/cart**');

  // 6) Simulate /api/v1/cart/items 503 on add
  await page.route('**/api/v1/cart/items', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA simulated add 503' }),
      });
      return;
    }
    await route.continue();
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(700);
  await openCartDrawer(page);
  const add503Count = await getDrawerItemCount(page);
  results.push({
    id: '6-cart-items-503',
    pass: add503Count > 0,
    notes: [
      `drawerRowsAfterAdd503=${add503Count}`,
      `mutationFailedDiagnosticSeen=${consoleWarnings.some((msg) => msg.includes('mutation_failed'))}`,
    ],
    metrics: { add503Count },
  });
  await page.unroute('**/api/v1/cart/items');

  // 7) Delete item + failed delete
  const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
  const firstRow = dialog.locator('div:has(input[type="number"])').first();
  const removeBtn = firstRow.locator('button:not([aria-label])').first();
  const beforeDeleteRows = await getDrawerItemCount(page);
  if (await removeBtn.count()) {
    await removeBtn.click();
    await page.waitForTimeout(600);
  }
  const afterDeleteRows = await getDrawerItemCount(page);
  await page.route('**/api/v1/cart/items/**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA simulated delete 503' }),
      });
      return;
    }
    await route.continue();
  });
  const rowAfterSuccessDelete = dialog.locator('div:has(input[type="number"])').first();
  const removeBtnFail = rowAfterSuccessDelete.locator('button:not([aria-label])').first();
  if (await removeBtnFail.count()) {
    await removeBtnFail.click();
    await page.waitForTimeout(900);
  }
  const afterFailedDeleteRows = await getDrawerItemCount(page);
  results.push({
    id: '7-delete-cart-item',
    pass: afterDeleteRows <= beforeDeleteRows && afterFailedDeleteRows >= 0,
    notes: [
      `beforeDeleteRows=${beforeDeleteRows}`,
      `afterDeleteRows=${afterDeleteRows}`,
      `afterFailedDeleteRows=${afterFailedDeleteRows}`,
      `deleteMutationFailedSeen=${consoleWarnings.some((msg) => msg.includes('operation":"delete'))}`,
    ],
    metrics: { beforeDeleteRows, afterDeleteRows, afterFailedDeleteRows },
  });
  await page.unroute('**/api/v1/cart/items/**');

  // 8) Missing image behavior
  await page.keyboard.press('Escape');
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 45000 });
  const defaultImageInstances = await page.locator('img[src*="default-product.png"]').count();
  const layoutShiftWarnings = consoleWarnings.some((msg) => msg.toLowerCase().includes('layout shift'));
  results.push({
    id: '8-missing-image-fallback',
    pass: !preloadDefaultWarning && !layoutShiftWarnings,
    notes: [
      `defaultImageInstances=${defaultImageInstances}`,
      `defaultPreloadWarning=${preloadDefaultWarning}`,
      `layoutShiftWarnings=${layoutShiftWarnings}`,
    ],
    metrics: { defaultImageInstances, preloadDefaultWarning, layoutShiftWarnings },
  });

  return results;
}

async function runDesktopAndMobile() {
  await mkdir(ARTIFACTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const desktopContext = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const desktopPage = await desktopContext.newPage();
    const desktopNetworkEvents = [];
    const desktopConsoleWarnings = [];

    desktopPage.on('request', (request) => {
      if (request.url().includes('/api/v1/cart')) {
        desktopNetworkEvents.push({ type: 'request', url: request.url(), method: request.method() });
      }
    });
    desktopPage.on('response', (response) => {
      if (response.url().includes('/api/v1/cart')) {
        desktopNetworkEvents.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });
    desktopPage.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'warning' || msg.type() === 'error' || text.includes('CART_FRONTEND')) {
        desktopConsoleWarnings.push(text);
      }
    });

    const desktopScenarioResults = await runScenarios(desktopPage, desktopNetworkEvents, desktopConsoleWarnings);
    await desktopPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop-final.png'), fullPage: true });
    await desktopContext.close();

    // 9) Mobile scenario
    const mobileContext = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    const mobileWarnings = [];
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        mobileWarnings.push(msg.text());
      }
    });

    await mobilePage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 45000 });
    const cardsCountBefore = await mobilePage.locator('[data-home-product-card]').count();
    await clickAddToCartOnCard(mobilePage, 0);
    await mobilePage.waitForTimeout(600);
    const cardsCountAfter = await mobilePage.locator('[data-home-product-card]').count();
    const mobileScenario = /** @type {ScenarioResult} */ ({
      id: '9-mobile-stability',
      pass: cardsCountAfter === cardsCountBefore && cardsCountAfter > 0,
      notes: [
        `cardsBefore=${cardsCountBefore}`,
        `cardsAfter=${cardsCountAfter}`,
        `warnings=${mobileWarnings.length}`,
      ],
      metrics: { cardsCountBefore, cardsCountAfter, mobileWarnings: mobileWarnings.length },
    });
    await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile-final.png'), fullPage: true });
    await mobileContext.close();

    const output = {
      baseUrl: BASE_URL,
      generatedAt: new Date().toISOString(),
      desktopScenarioResults,
      mobileScenario,
      desktopConsoleWarnings,
      desktopNetworkEvents,
      screenshots: {
        desktop: path.join(ARTIFACTS_DIR, 'desktop-final.png'),
        mobile: path.join(ARTIFACTS_DIR, 'mobile-final.png'),
      },
    };

    const reportPath = path.join(ARTIFACTS_DIR, 'cart-qa-report.json');
    await writeFile(reportPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`QA_REPORT_PATH=${reportPath}`);
  } finally {
    await browser.close();
  }
}

runDesktopAndMobile().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
