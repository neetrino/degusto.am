'use client';

import { forwardRef, useState } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileTextInputSheet } from '@/components/mobile/MobileTextInputSheet';
import { useTranslation } from '@/lib/i18n-client';

export type MobileFriendlyTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'readOnly'
> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  sheetTitle?: string;
  sheetDoneLabel?: string;
  sheetCancelLabel?: string;
  onSheetCommit?: (value: string) => void;
  /** When true, use a normal inline textarea on mobile instead of the sheet popup. Default: true. */
  disableMobileSheet?: boolean;
};

function buildSyntheticChange(value: string): ChangeEvent<HTMLTextAreaElement> {
  return {
    target: { value },
    currentTarget: { value },
  } as ChangeEvent<HTMLTextAreaElement>;
}

export const MobileFriendlyTextarea = forwardRef<HTMLTextAreaElement, MobileFriendlyTextareaProps>(
  function MobileFriendlyTextarea(
    {
      value,
      onChange,
      className = '',
      placeholder,
      disabled,
      rows = 4,
      sheetTitle,
      sheetDoneLabel,
      sheetCancelLabel,
      onSheetCommit,
      disableMobileSheet = true,
      id,
      name,
      required,
      autoComplete,
      ...rest
    },
    ref
  ) {
    const { t } = useTranslation();
    const isMobile = useIsMobileViewport();
    const [sheetOpen, setSheetOpen] = useState(false);

    const useSheet = isMobile && !disableMobileSheet && !disabled;

    const resolvedTitle = sheetTitle ?? placeholder ?? '';
    const doneLabel = sheetDoneLabel ?? t('common.buttons.done');
    const cancelLabel = sheetCancelLabel ?? t('common.buttons.cancel');

    if (!useSheet) {
      return (
        <textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`text-base leading-6 ${className}`}
          {...rest}
        />
      );
    }

    const displayValue = value.trim().length > 0 ? value : '';
    const triggerTextClassName = displayValue ? 'text-inherit' : 'text-gray-400';

    return (
      <>
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setSheetOpen(true)}
          className={`min-h-[120px] w-full cursor-text rounded-md border border-gray-300 px-3 py-2 text-left ${className}`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <span className={`block whitespace-pre-wrap ${triggerTextClassName}`}>
            {displayValue || placeholder}
          </span>
        </button>
        {name ? (
          <textarea
            ref={ref}
            tabIndex={-1}
            aria-hidden
            className="sr-only"
            name={name}
            value={value}
            required={required}
            readOnly
          />
        ) : null}
        <MobileTextInputSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={resolvedTitle}
          value={value}
          onChange={(next) => onChange(buildSyntheticChange(next))}
          onCommit={onSheetCommit}
          placeholder={placeholder}
          multiline
          rows={rows}
          autoComplete={autoComplete}
          doneLabel={doneLabel}
          cancelLabel={cancelLabel}
        />
      </>
    );
  }
);
