import type { FormEvent, InputHTMLAttributes } from 'react';

type NativeValidationHandlers = {
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
  onInput?: InputHTMLAttributes<HTMLInputElement>['onInput'];
};

/** Clears browser custom validity so the field can re-validate on input. */
export function clearNativeValidationMessage(event: FormEvent<HTMLInputElement>): void {
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
  const clearAndCall = (
    event: FormEvent<HTMLInputElement>,
    next?: NativeValidationHandlers[keyof NativeValidationHandlers]
  ) => {
    clearNativeValidationMessage(event);
    next?.(event);
  };

  return {
    onInvalid: (event: FormEvent<HTMLInputElement>) => {
      setNativeRequiredValidationMessage(event, message);
    },
    onInput: (event: FormEvent<HTMLInputElement>) => {
      clearAndCall(event, handlers.onInput);
    },
    onChange: (event: FormEvent<HTMLInputElement>) => {
      clearAndCall(event, handlers.onChange);
    },
  };
}
