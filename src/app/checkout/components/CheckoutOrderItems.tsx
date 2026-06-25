'use client';

import Image from 'next/image';
import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { CHECKOUT_CARD_FRAME, CHECKOUT_SECTION_TITLE } from '../checkout-ui';
import type { Cart } from '../types';

interface CheckoutOrderItemsProps {
  cart: Cart;
  isSubmitting: boolean;
  onRemoveItem: (itemId: string) => void;
}

export function CheckoutOrderItems({
  cart,
  isSubmitting,
  onRemoveItem,
}: CheckoutOrderItemsProps) {
  const { t } = useTranslation();
  const itemsLabel = t('checkout.itemsCount').replace('{count}', String(cart.itemsCount));

  return (
    <Card className={`overflow-hidden p-0 ${CHECKOUT_CARD_FRAME}`}>
      <div className="px-3 pb-1 pt-3 md:border-b md:border-[#1F2E1F]/8 md:bg-[#fffaf6] md:px-6 md:py-4">
        <div className="flex items-start justify-between gap-2">
          <h2
            className={`${CHECKOUT_SECTION_TITLE} mb-0 text-[12px] font-bold uppercase tracking-[0.03em] md:text-[18px] md:tracking-[0.02em] md:normal-case`}
          >
            {t('checkout.productsInOrder')}
          </h2>
          <span className="whitespace-nowrap pt-0.5 text-[12px] font-medium text-[#1F2E1F]/70 md:pt-1 md:text-xs">
            {itemsLabel}
          </span>
        </div>
      </div>

      <div className="px-3 pb-3 pt-1 md:px-6 md:py-5">
        <div className="flex flex-wrap gap-2 md:gap-5">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="group w-[66px] min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none md:w-[108px] md:rounded-2xl md:border md:border-[#1F2E1F]/10 md:bg-white md:p-2.5 md:shadow-[0_4px_12px_rgba(31,46,31,0.06)]"
            >
              <div className="relative mb-1 h-[50px] w-[50px] overflow-hidden rounded-[8px] border border-[#1F2E1F]/10 bg-[#f8f8f8] md:mb-2 md:h-[84px] md:w-full md:rounded-xl md:border-[#1F2E1F]/8">
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isSubmitting}
                  className="absolute -right-1 -top-1 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#d7dbe0] bg-white text-[11px] font-semibold leading-none text-[#1F2E1F]/60 shadow-sm transition-colors hover:text-[#d63031] disabled:cursor-not-allowed disabled:opacity-50 md:left-1.5 md:top-1.5 md:h-5 md:w-5 md:border-white/60 md:bg-white/95 md:text-[13px] md:text-[#1F2E1F]/70"
                  aria-label={t('checkout.removeItem').replace('{title}', item.variant.product.title)}
                >
                  ×
                </button>
                <Image
                  src={resolveStorefrontProductImage(item.variant.product.image)}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50px, 84px"
                  className="object-cover md:transition-transform md:duration-300 md:group-hover:scale-[1.03]"
                  unoptimized
                />
              </div>
              <p className="line-clamp-2 text-[11px] font-medium leading-[1.15] text-[#1F2E1F] md:text-[15px] md:font-semibold md:leading-5">
                {item.variant.product.title}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Card>
  );
}
