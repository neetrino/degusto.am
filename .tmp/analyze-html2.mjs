import fs from 'node:fs';

function analyze(file) {
  const html = fs.readFileSync(`D:/Degusto/.tmp/${file}.html`, 'utf8');
  const cardIdx = html.indexOf('data-home-product-card');
  const hiddenIdx = html.indexOf('hidden id="S:1"');
  const desktopIdx = html.indexOf('hidden bg-white pb-20 pt-5 lg:block');
  const mainIdx = html.indexOf('<main');

  console.log(`\n=== ${file} ===`);
  console.log({
    mainIdx,
    hiddenIdx,
    desktopIdx,
    cardIdx,
    cardBeforeHidden: cardIdx >= 0 && hiddenIdx >= 0 ? cardIdx < hiddenIdx : null,
    snippetAroundCard:
      cardIdx >= 0 ? html.slice(Math.max(0, cardIdx - 120), cardIdx + 120) : 'NO CARDS',
  });
}

analyze('shop-page');
analyze('combo-desktop-ua');
analyze('shop-mobile-ua');
