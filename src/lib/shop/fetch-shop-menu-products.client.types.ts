import type { MenuCard } from '@/components/home/menu-types';

export type ShopMenuProductsResponse = {
  cards: MenuCard[];
  effectivePage: number;
  totalPages: number;
};
