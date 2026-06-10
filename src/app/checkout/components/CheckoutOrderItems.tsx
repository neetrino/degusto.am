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
      <div className="border-b border-[#1F2E1F]/8 bg-[#fffaf6] px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className={`${CHECKOUT_SECTION_TITLE} mb-0 uppercase text-[18px] tracking-[0.02em]`}>
            {t('checkout.productsInOrder')}
          </h2>
          <span className="rounded-full border border-[#F66812]/25 bg-white px-3 py-1 text-xs font-semibold text-[#1F2E1F]/70">
            {itemsLabel}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap gap-4 md:gap-5">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="group w-[108px] rounded-2xl border border-[#1F2E1F]/10 bg-white p-2.5 shadow-[0_4px_12px_rgba(31,46,31,0.06)] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(31,46,31,0.10)]"
            >
              <div className="relative mb-2 h-[84px] w-full overflow-hidden rounded-xl border border-[#1F2E1F]/8 bg-[#f8f8f8]">
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isSubmitting}
                  className="absolute left-1.5 top-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 bg-white/95 text-[13px] font-semibold leading-none text-[#1F2E1F]/70 shadow-sm transition-colors hover:bg-white hover:text-[#d63031] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('checkout.removeItem').replace('{title}', item.variant.product.title)}
                >
                  ×
                </button>
                <Image
                  src={resolveStorefrontProductImage(item.variant.product.image)}
                  alt=""
                  fill
                  sizes="84px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  unoptimized
                />
              </div>
              <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#1F2E1F]">
                {item.variant.product.title}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Card>
  );
}
