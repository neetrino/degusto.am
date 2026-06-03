'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // e.g. Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('products.errors.loadFailed')}</h2>
        <p className="text-gray-600 mb-4">{t('products.errors.tryAgain')}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            {t('common.buttons.tryAgain')}
          </button>
          <Link href="/" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            {t('common.navigation.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
