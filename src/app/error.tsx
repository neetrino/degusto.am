'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

export default function Error({
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
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('common.errors.title')}</h1>
        <p className="text-gray-600 mb-6">{t('common.errors.description')}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            {t('common.buttons.tryAgain')}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('common.notFound.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
