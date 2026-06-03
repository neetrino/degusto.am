/** True when the form should create one variant from simple price/stock fields. */
export function shouldSubmitAsSimpleProduct(input: {
  productType: 'simple' | 'variable';
  formVariantsLength: number;
  generatedVariantsLength: number;
  hasVariantsToLoad: boolean;
}): boolean {
  if (input.productType === 'simple') {
    return true;
  }
  return (
    input.formVariantsLength === 0 &&
    input.generatedVariantsLength === 0 &&
    !input.hasVariantsToLoad
  );
}
