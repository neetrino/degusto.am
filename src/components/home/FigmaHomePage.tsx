import Link from 'next/link';

const assets = {
  heroBg: 'https://www.figma.com/api/mcp/asset/85cedb2c-a501-40fe-9b97-de4ab816ce45',
  heroArcLeft: 'https://www.figma.com/api/mcp/asset/80d80afd-93ae-418b-9b0c-21c970356fbf',
  heroArcRight: 'https://www.figma.com/api/mcp/asset/139854e1-a89f-411c-ad5d-4f4a47341a35',
  logo: 'https://www.figma.com/api/mcp/asset/75a32c78-85e0-47c2-9691-6e5867f261b5',
  product: 'https://www.figma.com/api/mcp/asset/391d8c26-5fd9-4a5a-bd37-4fb776b3791d',
  categorySoup: 'https://www.figma.com/api/mcp/asset/f59e55b2-9f13-4728-a2ab-b81a336c933e',
  categorySalad: 'https://www.figma.com/api/mcp/asset/bb38ad79-89f9-419e-adaf-93b0ac75db5a',
  categoryShawarma: 'https://www.figma.com/api/mcp/asset/43549dd0-8594-452d-9fd3-c5f3697f20d8',
  categoryPizza: 'https://www.figma.com/api/mcp/asset/23f5ca6d-8c2f-4461-ae15-1888a189e1b5',
  footerImage: 'https://www.figma.com/api/mcp/asset/6abff93b-7778-4529-b767-af04ebcb8750',
};

type CardItem = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  image: string;
};

type CategoryItem = {
  id: string;
  title: string;
  count: string;
  image: string;
};

const newsCards: CardItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `news-${index + 1}`,
  title: 'Double Cheeseburger',
  subtitle: 'Բուրգեր',
  price: '1200 ֏',
  image: assets.product,
}));

const categoryBase: CategoryItem[] = [
  { id: 'cat-1', title: 'Ապուրներ եւ տաք ուտեստներ', count: '(78 ապրանք)', image: assets.categorySoup },
  { id: 'cat-2', title: 'Աղցաններ', count: '(41 ապրանք)', image: assets.categorySalad },
  { id: 'cat-3', title: 'Շաուրմա', count: '(18 ապրանք)', image: assets.categoryShawarma },
  { id: 'cat-4', title: 'Պիցցա', count: '(44 ապրանք)', image: assets.categoryPizza },
];

const categories: CategoryItem[] = [...categoryBase, ...categoryBase, ...categoryBase, ...categoryBase].map((item, index) => ({
  ...item,
  id: `${item.id}-${index}`,
}));

function NewsCard({ item }: { item: CardItem }) {
  return (
    <article className="relative w-[236px] shrink-0 rounded-[20px] bg-white p-3 pb-4">
      <img src={item.image} alt={item.title} className="h-[145px] w-full rounded-[16px] object-cover" />
      <div className="mt-2 flex items-start justify-between">
        <div>
          <p className="text-sm text-[#5b5b5b]">⭐ 4.7</p>
          <h3 className="text-xl font-black leading-tight text-[#3c2f2f]">{item.title}</h3>
          <p className="text-sm text-[#9b9b9b]">{item.subtitle}</p>
        </div>
        <div className="rounded-full bg-[#ff7f20] px-3 py-1 text-xs font-bold text-black">-30%</div>
      </div>
      <p className="mt-2 text-right text-3xl font-black text-[#3c2f2f]">{item.price}</p>
      <button type="button" className="absolute -bottom-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-[#ff7f20] text-white shadow-lg">
        🛒
      </button>
    </article>
  );
}

function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <article className="rounded-[22px] bg-[#0c0d12] p-4">
      <h3 className="min-h-[56px] text-2xl font-black leading-tight text-white">{item.title}</h3>
      <p className="mb-2 mt-1 text-sm text-white/80">{item.count}</p>
      <img src={item.image} alt={item.title} className="mx-auto h-[190px] w-full max-w-[240px] object-contain" />
    </article>
  );
}

export function FigmaHomePage() {
  return (
    <div className="bg-[#ff6a10]">
      <section className="relative mx-auto w-full max-w-[1434px] overflow-hidden px-4 pb-28 pt-3 md:px-8 lg:h-[807px] lg:px-12 lg:pb-0 lg:[aspect-ratio:231/130]">
        <img src={assets.heroBg} alt="Degusto hero" className="absolute inset-x-0 top-3 h-[900px] w-full rounded-b-[28px] object-cover lg:top-0 lg:h-full" />
        <img
          src={assets.heroArcLeft}
          alt=""
          className="pointer-events-none absolute left-[-180px] top-[-380px] opacity-75"
          style={{
            width: '717.855px',
            height: '1512.29px',
            transform: 'rotate(-139.877deg)',
            transformOrigin: 'center',
          }}
        />
        <img
          src={assets.heroArcRight}
          alt=""
          className="pointer-events-none absolute right-[-170px] top-[-130px] opacity-75"
          style={{
            width: '611.208px',
            height: '979.275px',
            transform: 'rotate(-18.041deg)',
            transformOrigin: 'center',
          }}
        />

        <header className="relative z-10 mx-auto flex h-20 max-w-[1374px] items-center justify-between gap-3 rounded-[90px] bg-black px-3 md:px-7">
          <img src={assets.logo} alt="Degusto" className="h-12 w-auto" />
          <nav className="hidden items-center gap-8 text-[18px] font-semibold text-white lg:flex">
            <Link href="/">Գլխավոր</Link>
            <Link href="/products">Խոհանոց</Link>
            <Link href="/products">Կոմբոներ</Link>
            <Link href="/about">Մեր մասին</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className="hidden rounded-full bg-white px-4 py-2 text-sm text-[#696969] md:block">
              ...
            </button>
            <button type="button" className="rounded-full bg-[#f66812] px-4 py-2 text-sm font-semibold text-white md:px-5 md:text-base">
              Որոնել
            </button>
            <button type="button" className="rounded-full bg-[#f1f2f4] px-4 py-2 text-sm font-bold text-black">
              0 ֏
            </button>
            <button type="button" className="hidden h-10 w-10 rounded-full bg-white text-black md:block">
              👤
            </button>
          </div>
        </header>

        <div className="relative z-10 mt-10 w-[236px] rounded-[20px] bg-white p-2.5 pb-3 shadow-xl md:mt-14">
          <img src={assets.product} alt="Daily offer" className="h-[147px] w-full rounded-[14px] object-cover" />
          <p className="mt-2 text-xs text-[#5b5b5b]">⭐ 4.7</p>
          <h2 className="mt-1 text-[28px] font-black leading-[1] text-[#3c2f2f]">
            <span className="block">Double</span>
            <span className="block">Cheeseburger</span>
          </h2>
          <p className="mt-1 text-sm text-[#9b9b9b]">Բուրգեր</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded-full bg-[#ff7f20] px-3 py-1 text-xs font-bold">-30%</span>
            <span className="text-[38px] font-black leading-none text-[#3c2f2f]">1200 ֏</span>
          </div>
          <button type="button" className="absolute -bottom-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-[#ff7f20] text-white shadow-lg">
            🛒
          </button>
          <div className="absolute -right-9 -top-9 rounded-[50%] bg-black px-4 py-5 text-center text-xs font-bold text-white">
            Օրվա
            <br />
            Առաջարկ
          </div>
        </div>
      </section>

      <section className="rounded-t-[40px] bg-[#0c0d12] px-4 pb-14 pt-14 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-4xl font-black text-white md:text-6xl">
              <span className="text-[#f66913]">Մենք ունենք </span>նորույթներ
            </h2>
            <Link href="/products" className="rounded-full bg-[#ff7f20] px-6 py-4 text-lg font-bold text-white">
              Ավելին →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-8">
            {newsCards.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-t-[40px] bg-[#e6e6e8] px-4 pb-20 pt-10 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-8 text-5xl font-black text-black md:text-6xl">Կատեգորիաներ</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <CategoryCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <footer className="rounded-t-[40px] bg-[#121212] px-4 pb-10 pt-12 text-white md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
            <div>
              <h3 className="mb-4 text-3xl font-black text-[#ff7f20]">Հասցեներ</h3>
              <p className="leading-8">Պարույր Սևակի 92</p>
              <p className="leading-8">Բագրատունյաց 11Ա</p>
              <p className="leading-8">Ազատության 24/19, Coffee Studio by Degusto</p>
            </div>
            <div>
              <h3 className="mb-4 text-3xl font-black text-[#ff7f20]">Պայմաններ</h3>
              <p className="leading-8">Գաղտնիության քաղաքականություն</p>
              <p className="leading-8">Առաքման քաղաքականություն</p>
              <p className="leading-8">Վերադարձի քաղաքականություն</p>
              <p className="leading-8">Պայմաններ և դրույթներ</p>
            </div>
            <div>
              <h3 className="mb-4 text-3xl font-black text-[#ff7f20]">Հղումներ</h3>
              <p className="leading-8">Գլխավոր</p>
              <p className="leading-8">Խոհանոց</p>
              <p className="leading-8">Կոմբոներ</p>
              <p className="leading-8">Մեր մասին</p>
            </div>
            <img src={assets.footerImage} alt="Degusto footer visual" className="h-full max-h-[260px] w-full rounded-2xl object-cover" />
          </div>

          <div className="mt-8 border-t border-white/20 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <img src={assets.logo} alt="Degusto" className="h-10 w-auto" />
              <p className="text-sm text-white/80">
                Copyright © 2026 | Բոլոր իրավունքները պաշտպանված են | Ստեղծվել է <span className="font-black text-[#ff7f20]">Neetrino IT Company</span> կողմից
              </p>
              <div className="flex gap-2 text-xs">
                <span className="rounded-lg bg-white px-3 py-1 text-black">idram</span>
                <span className="rounded-lg bg-white px-3 py-1 text-black">fastshift</span>
                <span className="rounded-lg bg-white px-3 py-1 text-black">arca</span>
                <span className="rounded-lg bg-white px-3 py-1 text-black">visa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
