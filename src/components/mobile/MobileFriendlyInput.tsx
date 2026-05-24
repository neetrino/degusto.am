'use client';

import { forwardRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileTextInputSheet } from '@/components/mobile/MobileTextInputSheet';
import { useTranslation } from '@/lib/i18n-client';

export type MobileFriendlyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'readOnly'
> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  sheetTitle?: string;
  sheetDoneLabel?: string;
  sheetCancelLabel?: string;
  sheetFooter?: ReactNode;
  onSheetCommit?: (value: string) => void;
  onSheetOpen?: () => void;
  /** When true, use a normal inline input on mobile instead of the sheet popup. Default: true (sheet only for search). */
  disableMobileSheet?: boolean;
};

function buildSyntheticChange(value: string): ChangeEvent<HTMLInputElement> {
  return {
    target: { value },
    currentTarget: { value },
  } as ChangeEvent<HTMLInputElement>;
}

export const MobileFriendlyInput = forwardRef<HTMLInputElement, MobileFriendlyInputProps>(
  function MobileFriendlyInput(
    {
      value,
      onChange,
      className = '',
      placeholder,
      type = 'text',
      inputMode,
      autoComplete,
      disabled,
      sheetTitle,
      sheetDoneLabel,
      sheetCancelLabel,
      sheetFooter,
      onSheetCommit,
      onSheetOpen,
      onKeyDown,
      disableMobileSheet = true,
      id,
      name,
      required,
      ...rest
    },
    ref
  ) {
    const { t } = useTranslation();
    const isMobile = useIsMobileViewport();
    const [sheetOpen, setSheetOpen] = useState(false);

    const useSheet =
      isMobile &&
      !disableMobileSheet &&
      !disabled &&
      type !== 'checkbox' &&
      type !== 'radio' &&
      type !== 'file' &&
      type !== 'hidden' &&
      type !== 'submit' &&
      type !== 'button';

    const resolvedTitle = sheetTitle ?? placeholder ?? '';
    const doneLabel = sheetDoneLabel ?? t('common.buttons.done');
    const cancelLabel = sheetCancelLabel ?? t('common.buttons.cancel');

    if (!useSheet) {
      return (
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          className={`text-base leading-6 ${className}`}
          {...rest}
        />
      );
    }

    const displayValue = value.trim().length > 0 ? value : '';
    const triggerTextClassName = displayValue ? 'text-inherit' : 'text-[#abb7c2]';

    return (
      <>
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => {
            setSheetOpen(true);
            onSheetOpen?.();
          }}
          className={`cursor-text text-left ${className}`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <span className={`block truncate ${triggerTextClassName}`}>
            {displayValue || placeholder}
          </span>
        </button>
        {name ? (
          <input
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
          onChange={(next) => {
            onChange?.(buildSyntheticChange(next));
          }}
          onCommit={onSheetCommit}
          placeholder={placeholder}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          doneLabel={doneLabel}
          cancelLabel={cancelLabel}
          sheetFooter={sheetFooter}
          onInputKeyDown={onKeyDown}
        />
      </>
    );
  }
);
