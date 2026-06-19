import { useTranslation } from '../../../lib/i18n-client';
import { SHOP_MENU_ASSETS } from './shop-menu-assets';

type FoodFilterOption = 'leaf' | 'neutral' | 'pepper';

type ShopFoodAttributeSwitcherProps = {
  selectedOption: FoodFilterOption;
  onChange: (_next: FoodFilterOption) => void;
};

export function ShopFoodAttributeSwitcher({
  selectedOption,
  onChange,
}: ShopFoodAttributeSwitcherProps) {
  const { t } = useTranslation();
  const optionOrder: FoodFilterOption[] = ['leaf', 'neutral', 'pepper'];
  const selectedIndex = optionOrder.indexOf(selectedOption);
  const switcherBackgroundClassName =
    selectedOption === 'leaf'
      ? 'bg-[#7fb24a]'
      : selectedOption === 'pepper'
        ? 'bg-[#dc3f3a]'
        : 'bg-[#aeb1ba]';

  return (
    <div
      role="radiogroup"
      aria-label={t('home.figma.desktop.shop.foodAttributeSwitcherAria')}
      className={`relative flex h-[46px] w-[120px] items-center gap-[6px] rounded-[40px] px-[4px] transition-colors duration-200 ${switcherBackgroundClassName}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[6px] top-1/2 z-20 inline-flex h-[28px] w-[28px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm transition-transform duration-200"
        style={{ transform: `translate(${selectedIndex * 38}px, -50%)` }}
      />

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'leaf'}
        onClick={() => onChange('leaf')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full transition-opacity ${
          selectedOption === 'leaf' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <img src={SHOP_MENU_ASSETS.switcherLeafRibbon} alt="" className="h-[32px] w-[32px] object-contain" />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'neutral'}
        onClick={() => onChange('neutral')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ececef] text-[#b5b5b8] transition-opacity ${
          selectedOption === 'neutral' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-[15px] w-[15px]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={selectedOption === 'pepper'}
        onClick={() => onChange('pepper')}
        className={`relative z-10 inline-flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff2b2e] transition-opacity ${
          selectedOption === 'pepper' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <img src={SHOP_MENU_ASSETS.switcherPepper} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
      </button>
    </div>
  );
}
