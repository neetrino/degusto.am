'use client';

import { forwardRef } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { MOBILE_INPUT_TEXT_CLASS } from '@/constants/mobile-input';

export type MobileFriendlyTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'readOnly'
> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export const MobileFriendlyTextarea = forwardRef<HTMLTextAreaElement, MobileFriendlyTextareaProps>(
  function MobileFriendlyTextarea(
    {
      value,
      onChange,
      className = '',
      placeholder,
      disabled,
      rows = 4,
      id,
      name,
      required,
      autoComplete,
      ...rest
    },
    ref
  ) {
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
        className={`${MOBILE_INPUT_TEXT_CLASS} ${className}`}
        {...rest}
      />
    );
  }
);
