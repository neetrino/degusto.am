// Currency utilities and exchange rates
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  AMD: { code: 'AMD', symbol: 'Դ', name: 'Armenian Dram', rate: 400 }, // 1 USD = 400 AMD
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 }, // 1 USD = 0.92 EUR
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rate: 90 }, // 1 USD = 90 RUB
  GEL: { code: 'GEL', symbol: '₾', name: 'Georgian Lari', rate: 2.7 }, // 1 USD = 2.7 GEL
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
type CurrencySymbolPlacement = 'prefix' | 'suffix';

const CURRENCY_SYMBOL_PLACEMENT: Record<CurrencyCode, CurrencySymbolPlacement> = {
  USD: 'prefix',
  AMD: 'suffix',
  EUR: 'prefix',
  RUB: 'prefix',
  GEL: 'prefix',
};

// Cache for currency rates from API
let currencyRatesCache: Record<string, number> | null = null;
let currencyRatesCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function formatAmountWithCurrencySymbol(amount: number, currency: CurrencyCode): string {
  const roundedAmount = Math.round(amount);
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);

  const symbol = CURRENCIES[currency].symbol;
  const placement = CURRENCY_SYMBOL_PLACEMENT[currency];

  return placement === 'suffix' ? `${formattedAmount}\u00A0${symbol}` : `${symbol}${formattedAmount}`;
}

/**
 * Get currency rates from API with caching
 */
async function getCurrencyRates(): Promise<Record<string, number>> {
  // Return cached rates if still valid
  if (currencyRatesCache && Date.now() - currencyRatesCacheTime < CACHE_DURATION) {
    return currencyRatesCache;
  }

  try {
    const response = await fetch('/api/v1/currency-rates', {
      cache: 'no-store', // Always fetch fresh rates
    });
    if (response.ok) {
      const rates = await response.json();
      currencyRatesCache = rates;
      currencyRatesCacheTime = Date.now();
      return rates;
    } else {
      console.error('❌ [CURRENCY] API returned error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ [CURRENCY] Failed to fetch currency rates:', error);
  }

  // Return default rates on error
  return {
    USD: 1,
    AMD: 400,
    EUR: 0.92,
    RUB: 90,
    GEL: 2.7,
  };
}

/**
 * Clear currency rates cache (call this when rates are updated in admin)
 */
export function clearCurrencyRatesCache(): void {
  currencyRatesCache = null;
  currencyRatesCacheTime = 0;
  // Dispatch event to notify components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('currency-rates-updated'));
  }
}

const CURRENCY_STORAGE_KEY = 'shop_currency';

/** Matches `getStoredCurrency()` when `window` is undefined (SSR / first paint). */
export const HYDRATION_SAFE_CURRENCY: CurrencyCode = 'AMD';

export function getStoredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return HYDRATION_SAFE_CURRENCY;
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && stored in CURRENCIES) {
      return stored as CurrencyCode;
    }
  } catch {
    // Ignore errors
  }
  return 'AMD';
}

export function setStoredCurrency(currency: CurrencyCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new Event('currency-updated'));
  } catch (error) {
    console.error('Failed to save currency:', error);
  }
}

/**
 * Format price with currency conversion
 * Uses cached rates from API if available, otherwise falls back to default rates
 * Works both on client and server side
 */
export function formatPrice(price: number, currency: CurrencyCode = 'USD'): string {
  // Use cached rates if available (client-side only), otherwise use default rates
  // On server-side, currencyRatesCache will be null, so it will use default rates
  let rate: number;
  if (typeof window !== 'undefined' && currencyRatesCache && currencyRatesCache[currency] !== undefined) {
    rate = currencyRatesCache[currency];
  } else {
    rate = CURRENCIES[currency].rate;
  }
  
  const convertedPrice = price * rate;

  return formatAmountWithCurrencySymbol(convertedPrice, currency);
}

/**
 * Initialize currency rates on client side
 * Call this in a useEffect or component mount
 */
export async function initializeCurrencyRates(forceReload: boolean = false): Promise<void> {
  if (typeof window === 'undefined') return;
  
  if (forceReload) {
    currencyRatesCache = null;
    currencyRatesCacheTime = 0;
  }
  
  await getCurrencyRates();
}

export function convertPrice(price: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
  if (fromCurrency === toCurrency) return price;
  
  // Use cached rates if available, otherwise use default rates
  const fromRate = currencyRatesCache?.[fromCurrency] ?? CURRENCIES[fromCurrency].rate;
  const toRate = currencyRatesCache?.[toCurrency] ?? CURRENCIES[toCurrency].rate;
  
  // Convert to USD first, then to target currency
  const usdPrice = price / fromRate;
  return usdPrice * toRate;
}

/**
 * Catalog price filter bounds from the storefront are entered in AMD; `ProductVariant.price`
 * is stored in USD (see admin product save paths). Uses the same rates as {@link convertPrice}.
 */
export function storefrontAmdPriceBoundToVariantUsd(amdAmount: number): number {
  return convertPrice(amdAmount, 'AMD', 'USD');
}

/**
 * Format price that is already in the target currency (no conversion)
 * Use this for prices that are already in AMD (like shipping costs)
 */
export function formatPriceInCurrency(price: number, currency: CurrencyCode = 'AMD'): string {
  return formatAmountWithCurrencySymbol(price, currency);
}


