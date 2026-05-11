import Link from 'next/link';

const assets = {
  heroBg: 'https://www.figma.com/api/mcp/asset/85cedb2c-a501-40fe-9b97-de4ab816ce45',
  heroArcLeft: 'https://www.figma.com/api/mcp/asset/80d80afd-93ae-418b-9b0c-21c970356fbf',
  heroArcRight: 'https://www.figma.com/api/mcp/asset/139854e1-a89f-411c-ad5d-4f4a47341a35',
  logo: 'https://www.figma.com/api/mcp/asset/689cc9c9-6791-4a68-82c6-806f5f88f2db',
  cartIcon: 'https://www.figma.com/api/mcp/asset/a0f28cb6-e6d7-4578-9f41-996e3f956397',
  cartCounterBubble: 'https://www.figma.com/api/mcp/asset/88d287e8-13b9-4289-830b-adce14cdcb4a',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/75d2eab2-d524-4cf7-95b1-afe2b0feef74',
  loginIcon: 'https://www.figma.com/api/mcp/asset/4299f4af-fc27-4fde-bc7e-21740c9dd71d',
  searchBadge: 'https://www.figma.com/api/mcp/asset/ab1b1dfb-856b-418a-8afa-d41d546a1015',
  searchIcon: 'https://www.figma.com/api/mcp/asset/a1be6bd2-36cd-46cd-b53e-d7669727be92',
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

function HeroHeader() {
  return (
    <header className="relative z-10 mx-auto mt-3 flex h-20 w-full max-w-[1450px] items-center rounded-[120px] bg-black px-4 lg:px-6">
      <img src={assets.logo} alt="Degusto" className="h-12 w-[134px] shrink-0 object-cover" />
      <div className="relative ml-6 hidden h-12 w-[237px] rounded-[90px] bg-white md:block">
        <p className="absolute left-[18px] top-[10px] text-base leading-6 text-[rgba(105,105,105,0.56)]">...</p>
        <button
          type="button"
          className="absolute left-[calc(50%+62px)] top-1/2 inline-flex h-10 -translate-x-1/2 -translate-y-1/2 items-center overflow-hidden rounded-[20px] bg-[#f66812] py-3 pl-10 pr-4"
        >
          <span className="absolute left-0 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center overflow-hidden">
            <img src={assets.searchBadge} alt="" className="h-8 w-8 object-contain" />
            <img src={assets.searchIcon} alt="" className="absolute h-6 w-6 object-contain" />
          </span>
          <span className="text-[15px] font-semibold leading-6 text-white">Որոնել</span>
        </button>
      </div>
      <nav className="mx-auto hidden items-center gap-[30px] px-4 text-[18px] font-semibold leading-[30px] text-white lg:flex">
        <Link href="/">Գլխավոր</Link>
        <Link href="/products">Խոհանոց</Link>
        <Link href="/products">Կոմբոներ</Link>
        <Link href="/about">Մեր մասին</Link>
      </nav>
      <div className="ml-auto flex items-center gap-[11px]">
        <div className="hidden items-center gap-[7px] md:flex">
          <button type="button" className="relative h-12 w-[117px] shrink-0">
            <span className="absolute right-0 top-0 inline-flex h-12 w-[88px] items-center justify-center rounded-[70px] bg-[#f1f2f4] text-base font-bold text-black">
              0Դ
            </span>
            <img src={assets.cartIcon} alt="" className="absolute bottom-[1px] left-2 h-[34px] w-[37px] object-contain" />
            <span className="absolute left-[35px] top-[2px] inline-flex h-6 w-6 items-center justify-center">
              <img src={assets.cartCounterBubble} alt="" className="absolute h-6 w-6 object-contain" />
              <span className="relative text-sm font-bold leading-6 text-white">0</span>
            </span>
          </button>
          <button
            type="button"
            className="inline-flex h-12 items-center rounded-[70px] bg-[#f55c0a] px-[18px] text-base font-bold leading-[18px] text-white"
          >
            <img src={assets.switcherIcon} alt="" className="mr-[3px] h-[19px] w-[19px] object-contain" />
            EN / AMD
          </button>
        </div>
        <button type="button" className="inline-flex h-12 w-12 items-center justify-center">
          <img src={assets.loginIcon} alt="Log in" className="h-12 w-12 object-contain" />
        </button>
      </div>
    </header>
  );
}

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
      <section className="relative w-full overflow-hidden pb-28 pt-3 lg:h-[807px] lg:pb-0 lg:[aspect-ratio:231/130]">
        <img src={assets.heroBg} alt="Degusto hero" className="absolute inset-x-0 top-0 h-[900px] w-full object-cover lg:h-full" />
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

        <HeroHeader />

        <div className="relative z-10 ml-2 mt-8 h-[284px] w-[236px] md:ml-4 md:mt-10">
          <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />
          <img
            src={assets.product}
            alt="Daily offer"
            className="absolute left-1/2 top-[12px] h-[147px] w-[227px] -translate-x-1/2 rounded-[18px] object-cover"
          />
          <p className="absolute left-[14px] top-[172px] text-base font-medium leading-none text-[rgba(60,47,47,0.62)]">⭐ 4.7</p>
          <h2 className="absolute left-[14px] top-[194px] text-base font-bold leading-none text-[#3c2f2f]">
            <span className="block">Double</span>
            <span className="block">Cheeseburger</span>
          </h2>
          <p className="absolute left-[14px] top-[252px] text-base font-medium leading-none text-[#a1a1a1]">Բուրգեր</p>
          <span className="absolute right-[12px] top-[184px] inline-flex items-center rounded-[60px] bg-[#ff7f20] px-[17px] py-[5px] text-sm font-bold leading-none text-black">
            -30%
          </span>
          <span className="absolute right-[14px] top-[242px] text-[20px] font-black leading-none text-[#3c2f2f]">1200 ֏</span>
          <button
            type="button"
            className="absolute bottom-[-25px] left-1/2 h-[52px] w-[51px] -translate-x-1/2 rounded-full bg-[#ff7f20] text-white shadow-lg"
          >
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
