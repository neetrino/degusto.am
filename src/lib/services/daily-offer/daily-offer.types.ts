export type DailyOfferPlatform = 'mobile' | 'desktop';

export type DailyOfferSelection = {
  mobileProductId: string | null;
  desktopProductId: string | null;
};

export const DAILY_OFFER_SETTINGS_KEY = 'dailyOfferSelection';

export const EMPTY_DAILY_OFFER_SELECTION: DailyOfferSelection = {
  mobileProductId: null,
  desktopProductId: null,
};
