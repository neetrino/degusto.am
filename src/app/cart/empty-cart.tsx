'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@shop/ui';

interface EmptyCartProps {
  t: (key: string) => string;
}

export function EmptyCart({ t }: EmptyCartProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t('common.cart.title')}</h1>
      <div className="rounded-2xl border border-[#F66812]/20 bg-white px-6 py-14 text-center shadow-sm sm:px-10 sm:py-16">
        <div className="mx-auto max-w-md">
          <Image
            src="https://cdn-icons-png.flaticon.com/512/3081/3081986.png"
            alt={t('common.cart.empty')}
            width={88}
            height={88}
            className="mx-auto mb-5"
          />
          <h2 className="mb-2 text-2xl font-bold text-[#1F2E1F]">
            {t('common.cart.empty')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('common.cart.emptyDescription')}
          </p>
          <Link href="/shop">
            <Button variant="primary" size="lg" className="mt-7">
              {t('common.buttons.browseProducts')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}




