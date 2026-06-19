/**
 * TEMP Phase 2 — full document + linked static asset sizing for /shop
 */
const BASE = process.env.SHOP_PERF_BASE ?? 'http://localhost:3000';

async function fetchSize(url) {
  const started = performance.now();
  const res = await fetch(url, { redirect: 'follow' });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    url,
    status: res.status,
    durationMs: performance.now() - started,
    sizeBytes: buf.length,
    contentType: res.headers.get('content-type'),
  };
}

function extractAssetUrls(html, origin) {
  const urls = new Set();
  const patterns = [
    /\/_next\/static\/[^"'\\s>]+/g,
    /\/api\/r2\/[^"'\\s>]+/g,
    /\/assets\/[^"'\\s>]+/g,
  ];
  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      urls.add(new URL(match[0], origin).href);
    }
  }
  return [...urls];
}

async function measureShopPage(path) {
  const pageUrl = `${BASE}${path}`;
  const doc = await fetchSize(pageUrl);
  const html = (await fetch(pageUrl)).text(); // second fetch for parse only
  const assetUrls = extractAssetUrls(html, BASE).slice(0, 40);
  const assets = [];
  for (const url of assetUrls) {
    assets.push(await fetchSize(url));
  }
  const jsAssets = assets.filter((a) => a.url.includes('/_next/static/chunks/') && a.url.endsWith('.js'));
  const totalJs = jsAssets.reduce((s, a) => s + a.sizeBytes, 0);
  const totalAssets = assets.reduce((s, a) => s + a.sizeBytes, 0);
  return {
    path,
    document: doc,
    assetCountFetched: assets.length,
    jsChunkCount: jsAssets.length,
    totalJsBytes: totalJs,
    totalAssetBytes: totalAssets + doc.sizeBytes,
    topJs: jsAssets.sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 8),
    slowestAssets: assets.sort((a, b) => b.durationMs - a.durationMs).slice(0, 8),
  };
}

async function main() {
  const pages = ['/shop?category=all', '/shop', '/shop?category=pizza'];
  const results = [];
  for (const p of pages) {
    results.push(await measureShopPage(p));
  }
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
}

main().catch(console.error);
