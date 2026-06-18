import fs from 'node:fs';

const files = ['shop-page', 'shop-mobile-ua', 'combo-desktop-ua'];

for (const file of files) {
  const html = fs.readFileSync(`D:/Degusto/.tmp/${file}.html`, 'utf8');
  console.log(file, {
    cards: html.split('data-home-product-card').length - 1,
    desktop: html.includes('hidden bg-white pb-20 pt-5 lg:block'),
    mobileList: html.includes('pb-8 pt-0 lg:hidden'),
    categoryGrid: html.includes('chooseCategories'),
    hiddenStreaming: html.includes('hidden id="S:1"'),
    f66913Title: (html.match(/text-\[#f66913\]/g) ?? []).length,
  });
}
