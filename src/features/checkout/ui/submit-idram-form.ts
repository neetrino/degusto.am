/** Auto-POSTs the Idram GetPayment form in the browser (no card modal). */
export function submitIdramForm(
  formAction: string,
  formData: Record<string, string>,
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = formAction;
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  for (const [name, value] of Object.entries(formData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
