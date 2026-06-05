import type { ChangeEvent, FormEvent, InputHTMLAttributes } from 'react';

type NativeValidationHandlers = {
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
  onInput?: InputHTMLAttributes<HTMLInputElement>['onInput'];
};

/** Clears browser custom validity so the field can re-validate on input. */
export function clearNativeValidationMessage(
  event: FormEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>
): void {
  event.currentTarget.setCustomValidity('');
}

/** Sets a localized message for HTML5 `required` validation bubbles. */
export function setNativeRequiredValidationMessage(
  event: FormEvent<HTMLInputElement>,
  message: string
): void {
  const input = event.currentTarget;
  if (input.validity.valueMissing) {
    input.setCustomValidity(message);
  }
}

/** Binds localized native validation handlers for required inputs/checkboxes. */
export function bindNativeRequiredValidation(
  message: string,
  handlers: NativeValidationHandlers = {}
) {
  return {
    onInvalid: (event: FormEvent<HTMLInputElement>) => {
      setNativeRequiredValidationMessage(event, message);
    },
    onInput: (event: FormEvent<HTMLInputElement>) => {
      clearNativeValidationMessage(event);
      handlers.onInput?.(event);
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      clearNativeValidationMessage(event);
      handlers.onChange?.(event);
    },
  };
}
