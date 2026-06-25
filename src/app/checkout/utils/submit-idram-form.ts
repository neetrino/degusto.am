import type { IdramFormData } from '@/lib/payments/idram/types';

/** POST hidden form to Idram GetPayment endpoint. */
export function submitIdramPaymentForm(formAction: string, formData: IdramFormData): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = formAction;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  for (const [name, value] of Object.entries(formData)) {
    if (value === undefined || value === null) {
      continue;
    }
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
