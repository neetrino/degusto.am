import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const ARTIFACTS_DIR = path.resolve('.tmp/qa-artifacts');

type ScenarioResult = {
  id: string;
  pass: boolean;
  notes: string[];
  metrics?: Record<string, string | number | boolean>;
};

async function openCartDrawer(page: Page): Promise<void> {
  const target = page.locator('[data-cart-fly-target]').first();
  await target.waitFor({ state: 'visible', timeout: 15000 });
  const button = target.locator('xpath=ancestor::button[1]');
  await button.click();
  await page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ has: page.locator('#cart-drawer-title') })
    .first()
    .waitFor({ state: 'visible', timeout: 10000 });
}

async function getDrawerItemCount(page: Page): Promise<number> {
  const dialog = page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ has: page.locator('#cart-drawer-title') })
    .first();
  return dialog.locator('input[type="number"]').count();
}

async function getDrawerQuantities(page: Page): Promise<number[]> {
  const dialog = page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ has: page.locator('#cart-drawer-title') })
    .first();
  return dialog.locator('input[type="number"]').evaluateAll((inputs) =>
    inputs.map((input) => Number.parseInt(String((input as HTMLInputElement).value || '0'), 10) || 0)
  );
}

async function clickAddToCartOnCard(page: Page, cardIndex: number): Promise<void> {
  const card = page.locator('[data-home-product-card]:visible').nth(cardIndex);
  await card.waitFor({ state: 'visible', timeout: 20000 });
  await card.locator('button[class*="-translate-x-1/2"]').first().click();
}

test.describe.configure({ mode: 'serial' });

test('cart and image QA scenarios', async ({ page, browser }) => {
  test.setTimeout(180000);
  await mkdir(ARTIFACTS_DIR, { recursive: true });
  const networkEvents: Array<{ type: 'request' | 'response'; url: string; method?: string; status?: number }> = [];
  const consoleWarnings: string[] = [];
  const scenarios: ScenarioResult[] = [];

  page.on('request', (request) => {
    if (request.url().includes('/api/v1/cart')) {
      networkEvents.push({ type: 'request', url: request.url(), method: request.method() });
    }
  });
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/cart')) {
      networkEvents.push({
        type: 'response',
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
      });
    }
  });
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'warning' || msg.type() === 'error' || text.includes('CART_FRONTEND')) {
      consoleWarnings.push(text);
    }
  });

  // 1) Initial /shop load
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 45000 });
  const productCards = page.locator('[data-home-product-card]');
  const productCardsCount = await productCards.count();
  const cartReadStatuses = networkEvents
    .filter((e) => e.type === 'response' && /\/api\/v1\/cart(\?|$)/.test(e.url))
    .map((e) => e.status ?? 0);
  const cartReadRequestsCount = networkEvents.filter(
    (e) => e.type === 'request' && /\/api\/v1\/cart(\?|$)/.test(e.url)
  ).length;
  const preloadDefaultWarning = consoleWarnings.some((msg) =>
    msg.toLowerCase().includes('default-product.png') && msg.toLowerCase().includes('preload')
  );
  scenarios.push({
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
  });

  await productCards.first().evaluate((el) => {
    el.setAttribute('data-qa-anchor-card', '1');
  });

  await clickAddToCartOnCard(page, 0);
  await openCartDrawer(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 2) Add to cart
  await openCartDrawer(page);
  const beforeAddQuantities = await getDrawerQuantities(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const addStart = Date.now();
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(300);
  await openCartDrawer(page);
  const afterAddQuantities = await getDrawerQuantities(page);
  const addLatencyMs = Date.now() - addStart;
  const appearedFast = addLatencyMs < 1000;
  const anchorCardStillConnected = (await page.locator('[data-qa-anchor-card="1"]').count()) === 1;
  const quantityDidNotDrop =
    afterAddQuantities.reduce((a, b) => a + b, 0) >= beforeAddQuantities.reduce((a, b) => a + b, 0);
  scenarios.push({
    id: '2-add-to-cart',
    pass: appearedFast && anchorCardStillConnected && quantityDidNotDrop,
    notes: [
      `before=${beforeAddQuantities.join(',') || 'none'}`,
      `after=${afterAddQuantities.join(',') || 'none'}`,
      `addLatencyMs=${addLatencyMs}`,
      `anchorCardStillConnected=${anchorCardStillConnected}`,
      `staleIgnoredLogged=${consoleWarnings.some((msg) => msg.includes('stale_response_ignored'))}`,
    ],
  });

  // 3) Add same product multiple times
  const beforeSame = await getDrawerQuantities(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await clickAddToCartOnCard(page, 0);
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(1000);
  await openCartDrawer(page);
  const afterSame = await getDrawerQuantities(page);
  const incremented = afterSame.reduce((a, b) => a + b, 0) >= beforeSame.reduce((a, b) => a + b, 0) + 1;
  const rowsAfterSame = await getDrawerItemCount(page);
  scenarios.push({
    id: '3-same-product-multi-add',
    pass: incremented && rowsAfterSame > 0,
    notes: [
      `before=${beforeSame.join(',') || 'none'}`,
      `after=${afterSame.join(',') || 'none'}`,
      `rowsAfterSame=${rowsAfterSame}`,
    ],
  });

  // 4) Add different products quickly
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await clickAddToCartOnCard(page, 0);
  await clickAddToCartOnCard(page, 1);
  await clickAddToCartOnCard(page, 2);
  await page.waitForTimeout(1200);
  await openCartDrawer(page);
  const rowsAfterQuickAdd = await getDrawerItemCount(page);
  const quantitiesAfterQuickAdd = await getDrawerQuantities(page);
  scenarios.push({
    id: '4-different-products-quick-add',
    pass: rowsAfterQuickAdd >= 2 && quantitiesAfterQuickAdd.every((q) => q > 0),
    notes: [
      `rows=${rowsAfterQuickAdd}`,
      `quantities=${quantitiesAfterQuickAdd.join(',') || 'none'}`,
      `staleIgnoredLogged=${consoleWarnings.some((msg) => msg.includes('stale_response_ignored'))}`,
    ],
  });

  // 5) Simulate /api/v1/cart 503
  await page.route('**/api/v1/cart**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET' && /\/api\/v1\/cart(\?|$)/.test(request.url())) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA cart 503' }),
      });
      return;
    }
    await route.continue();
  });
  const beforeCart503 = await getDrawerItemCount(page);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { forceReload: true } }));
  });
  await page.waitForTimeout(1200);
  const afterCart503 = await getDrawerItemCount(page);
  scenarios.push({
    id: '5-cart-read-503',
    pass: afterCart503 >= beforeCart503,
    notes: [
      `before=${beforeCart503}`,
      `after=${afterCart503}`,
      `fallbackLogSeen=${consoleWarnings.some((msg) => msg.includes('fallback_used'))}`,
    ],
  });
  await page.unroute('**/api/v1/cart**');

  // 6) Simulate /api/v1/cart/items 503
  await page.route('**/api/v1/cart/items', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA add 503' }),
      });
      return;
    }
    await route.continue();
  });
  await page.keyboard.press('Escape');
  await clickAddToCartOnCard(page, 0);
  await page.waitForTimeout(800);
  await openCartDrawer(page);
  const rowsAfterAdd503 = await getDrawerItemCount(page);
  scenarios.push({
    id: '6-cart-items-503',
    pass: rowsAfterAdd503 > 0,
    notes: [
      `rowsAfterAdd503=${rowsAfterAdd503}`,
      `mutationFailedSeen=${consoleWarnings.some((msg) => msg.includes('mutation_failed'))}`,
    ],
  });
  await page.unroute('**/api/v1/cart/items');

  // 7) Delete behavior + failed delete
  const dialog = page
    .locator('[role="dialog"][aria-modal="true"]')
    .filter({ has: page.locator('#cart-drawer-title') })
    .first();
  const firstRow = dialog.locator('div:has(input[type="number"])').first();
  const removeBtn = firstRow.locator('button:not([aria-label])').first();
  const beforeDelete = await getDrawerItemCount(page);
  if (await removeBtn.count()) {
    await removeBtn.click();
    await page.waitForTimeout(700);
  }
  const afterDelete = await getDrawerItemCount(page);
  await page.route('**/api/v1/cart/items/**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503, detail: 'QA delete 503' }),
      });
      return;
    }
    await route.continue();
  });
  const anotherRow = dialog.locator('div:has(input[type="number"])').first();
  const removeBtnFail = anotherRow.locator('button:not([aria-label])').first();
  if (await removeBtnFail.count()) {
    await removeBtnFail.click();
    await page.waitForTimeout(1200);
  }
  const afterFailedDelete = await getDrawerItemCount(page);
  scenarios.push({
    id: '7-delete-item',
    pass: afterDelete <= beforeDelete && afterFailedDelete >= 0,
    notes: [
      `beforeDelete=${beforeDelete}`,
      `afterDelete=${afterDelete}`,
      `afterFailedDelete=${afterFailedDelete}`,
      `deleteFailureObserved=${networkEvents.some((e) => e.status === 503 && e.method === 'DELETE')}`,
    ],
  });
  await page.unroute('**/api/v1/cart/items/**');

  // 8) Missing image fallback
  await page.keyboard.press('Escape');
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
  const defaultImageInstances = await page.locator('img[src*="default-product.png"]').count();
  const layoutShiftWarnings = consoleWarnings.some((msg) => msg.toLowerCase().includes('layout shift'));
  scenarios.push({
    id: '8-missing-image',
    pass: !preloadDefaultWarning && !layoutShiftWarnings,
    notes: [
      `defaultImageInstances=${defaultImageInstances}`,
      `defaultPreloadWarning=${preloadDefaultWarning}`,
      `layoutShiftWarnings=${layoutShiftWarnings}`,
    ],
  });

  // 9) Mobile checks in separate context
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();
  const mobileWarnings: string[] = [];
  mobilePage.on('console', (msg) => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      mobileWarnings.push(msg.text());
    }
  });
  await mobilePage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 45000 });
  const mobileCardsBefore = await mobilePage.locator('[data-home-product-card]:visible').count();
  if (mobileCardsBefore > 0) {
    await clickAddToCartOnCard(mobilePage, 0);
    await mobilePage.waitForTimeout(700);
  }
  const mobileCardsAfter = await mobilePage.locator('[data-home-product-card]:visible').count();
  scenarios.push({
    id: '9-mobile',
    pass: mobileCardsBefore > 0 && mobileCardsAfter === mobileCardsBefore,
    notes: [
      `cardsBefore=${mobileCardsBefore}`,
      `cardsAfter=${mobileCardsAfter}`,
      `productCardsVisible=${mobileCardsBefore > 0}`,
      `warnings=${mobileWarnings.length}`,
    ],
  });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile-final.png'), fullPage: true });
  await mobileContext.close();

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop-final.png'), fullPage: true });

  const reportPath = path.join(ARTIFACTS_DIR, 'cart-qa-report.json');
  const report = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    scenarios,
    consoleWarnings,
    networkEvents,
    screenshots: {
      desktop: path.join(ARTIFACTS_DIR, 'desktop-final.png'),
      mobile: path.join(ARTIFACTS_DIR, 'mobile-final.png'),
    },
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  // Ensure test itself fails only if the page is unavailable.
  await expect(page).toHaveURL(/\/shop/);
  // eslint-disable-next-line no-console
  console.log(`QA_REPORT_PATH=${reportPath}`);
});
