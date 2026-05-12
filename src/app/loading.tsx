import { FigmaHomePage, type HomeCategoryItem, type HomeFeaturedProduct } from '../components/home/FigmaHomePage';

const loadingFeaturedProducts: HomeFeaturedProduct[] = [
  {
    id: 'loading-featured-1',
    title: 'Art Book',
    subtitle: 'Electronics',
    price: 26499,
    oldPrice: 37999,
    image: '/api/r2/product/20260512-D3w_teddze.png',
    discountPercent: 30,
  },
  {
    id: 'loading-featured-2',
    title: 'Double Cheeseburger',
    subtitle: 'Բուրգեր',
    price: 1200,
    oldPrice: 1500,
    image: '/api/r2/product/20260512-5XM6tLjCRv.png',
    discountPercent: 20,
  },
];

const loadingCategories: HomeCategoryItem[] = [
  { id: 'loading-cat-1', title: 'Ապուրներ եւ տաք ուտեստներ', count: 78, image: '/api/r2/category/20260512-27SeUi_ujs.png' },
  { id: 'loading-cat-2', title: 'Աղցաններ', count: 41, image: '/api/r2/category/20260512-Np6RG2GuNi.png' },
  { id: 'loading-cat-3', title: 'Շաուրմա', count: 18, image: '/api/r2/category/20260512-UOlekxqQyh.png' },
  { id: 'loading-cat-4', title: 'Պիցցա', count: 44, image: '/api/r2/category/20260512-j5QKmShMEM.png' },
];

export default function Loading() {
  return <FigmaHomePage featuredProducts={loadingFeaturedProducts} categories={loadingCategories} />;
}
