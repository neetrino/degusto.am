'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    className = '',
    onKeyDown,
    value,
    onChange,
    ...props
  },
  ref
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '|' || e.keyCode === 220 || (e.shiftKey && e.key === '\\')) {
      return;
    }
    onKeyDown?.(e);
  };

  const hasValueProp = value !== undefined && value !== null;
  const stringValue = hasValueProp ? String(value) : undefined;

  const inputElement = (
    <MobileFriendlyInput
      ref={ref}
      value={stringValue}
      onChange={(event) => {
        onChange?.(event);
      }}
      className={`w-full px-4 py-2 text-base leading-6 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
        error ? 'border-error focus:ring-error' : 'border-gray-300'
      } ${className}`}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );

  return (
    <div className="w-full">
      {label ? <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label> : null}
      {inputElement}
      {error ? <p className="mt-1 text-sm text-error">{error}</p> : null}
    </div>
  );
});
