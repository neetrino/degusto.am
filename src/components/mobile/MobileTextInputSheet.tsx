'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { CornerDownLeft, Eye, EyeOff } from 'lucide-react';
import {
  MOBILE_INPUT_SHEET_TEXT_CLASS,
  MOBILE_INPUT_SHEET_TOP_OFFSET_PX,
  MOBILE_INPUT_SHEET_Z_INDEX,
} from '@/constants/mobile-input';

export type MobileTextInputSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (nextValue: string) => void;
  onCommit?: (nextValue: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  doneLabel: string;
  cancelLabel: string;
  sheetFooter?: ReactNode;
  onInputKeyDown?: InputHTMLAttributes<HTMLInputElement>['onKeyDown'];
};

const ENTER_BUTTON_CLASS =
  'mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f66812] text-white';

export function MobileTextInputSheet({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  onCommit,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  multiline = false,
  rows = 4,
  doneLabel,
  sheetFooter,
  onInputKeyDown,
}: MobileTextInputSheetProps) {
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setDraft(value);
    setShowPassword(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      fieldRef.current?.focus();
    }, 50);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, value]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const commit = () => {
    onChange(draft);
    onCommit?.(draft);
    onClose();
  };

  const handleFieldKeyDown: InputHTMLAttributes<HTMLInputElement>['onKeyDown'] = (event) => {
    onInputKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault();
      commit();
    }
  };

  const resolvedInputType = isPasswordField && showPassword ? 'text' : type;
  const inputClassName = `min-w-0 flex-1 bg-transparent px-4 py-3 ${MOBILE_INPUT_SHEET_TEXT_CLASS} text-[#1F2E1F] outline-none placeholder:text-[#a1a1aa]`;
  const barClassName =
    'flex w-full items-center overflow-hidden rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]';

  const enterButton = (
    <button type="button" onClick={commit} className={ENTER_BUTTON_CLASS} aria-label={doneLabel}>
      <CornerDownLeft className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );

  return createPortal(
    <>
      <MobileInputSheetBackdrop onClose={onClose} title={title} />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 flex justify-center px-4"
        style={{
          zIndex: MOBILE_INPUT_SHEET_Z_INDEX,
          paddingTop: `calc(max(0.75rem, env(safe-area-inset-top)) + ${MOBILE_INPUT_SHEET_TOP_OFFSET_PX}px)`,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="pointer-events-auto w-full max-w-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {multiline ? (
            <div className="w-full overflow-hidden rounded-[20px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]">
              <textarea
                ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
                value={draft}
                onChange={(event) => {
                  const next = event.target.value;
                  setDraft(next);
                  onChange(next);
                }}
                placeholder={placeholder}
                rows={rows}
                autoComplete={autoComplete}
                className={`w-full resize-none border-0 bg-transparent px-4 py-3 ${MOBILE_INPUT_SHEET_TEXT_CLASS} text-[#1F2E1F] outline-none placeholder:text-[#a1a1aa]`}
              />
              <div className="flex justify-end px-1 pb-1">{enterButton}</div>
            </div>
          ) : (
            <div className={`${barClassName} h-12`}>
              <input
                ref={fieldRef as React.RefObject<HTMLInputElement>}
                type={resolvedInputType}
                inputMode={inputMode}
                value={draft}
                onChange={(event) => {
                  const next = event.target.value;
                  setDraft(next);
                  onChange(next);
                }}
                onKeyDown={handleFieldKeyDown}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`${inputClassName} h-full ${isPasswordField ? 'pr-1' : ''}`}
              />
              {isPasswordField ? (
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#717182]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              ) : null}
              {enterButton}
            </div>
          )}
          {sheetFooter ? <div className="mt-2 max-h-[50vh] overflow-y-auto">{sheetFooter}</div> : null}
        </div>
      </div>
    </>,
    document.body
  );
}

function MobileInputSheetBackdrop({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm"
      style={{ zIndex: MOBILE_INPUT_SHEET_Z_INDEX - 1 }}
      role="presentation"
      aria-label={title}
      onClick={onClose}
    />
  );
}
