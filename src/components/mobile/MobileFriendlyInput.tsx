'use client';

import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { MOBILE_INPUT_TEXT_CLASS } from '@/constants/mobile-input';

export type MobileFriendlyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'readOnly'> & {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

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
      onKeyDown,
      id,
      name,
      required,
      ...rest
    },
    ref
  ) {
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
        className={`${MOBILE_INPUT_TEXT_CLASS} ${className}`}
        {...rest}
      />
    );
  }
);
