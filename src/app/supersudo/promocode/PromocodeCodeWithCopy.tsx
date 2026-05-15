'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { logger } from '../../../lib/utils/logger';

const COPIED_FEEDBACK_MS = 2000;

interface PromocodeCodeWithCopyProps {
  code: string;
  className?: string;
}

export function PromocodeCodeWithCopy({ code, className }: PromocodeCodeWithCopyProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const clearCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearCopiedTimeoutRef.current !== null) {
        clearTimeout(clearCopiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (clearCopiedTimeoutRef.current !== null) {
        clearTimeout(clearCopiedTimeoutRef.current);
      }
      clearCopiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        clearCopiedTimeoutRef.current = null;
      }, COPIED_FEEDBACK_MS);
    } catch (error: unknown) {
      logger.error('Failed to copy promocode', { error, code });
      alert(t('admin.promocode.copyError'));
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="font-semibold text-gray-900">{code}</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void handleCopy()}
        className="shrink-0 p-0 text-gray-600 hover:text-[#f66812]"
        title={t('admin.promocode.copyCode')}
        aria-label={t('admin.promocode.copyCode')}
      >
        {copied ? (
          <svg
            className="h-5 w-5 text-[#2f7d4a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </Button>
    </div>
  );
}
