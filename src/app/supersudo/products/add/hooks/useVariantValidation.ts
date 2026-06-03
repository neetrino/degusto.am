import type { Variant } from '../types';

interface UseVariantValidationProps {
  variants: Variant[];
  simpleProductData: {
    price: string;
    sku: string;
    quantity: string;
  };
  setLoading: (loading: boolean) => void;
  t: (key: string) => string;
}

export function useVariantValidation({
  variants,
  simpleProductData,
  setLoading,
  t,
}: UseVariantValidationProps) {
  const validateVariants = (submitAsSimple: boolean): boolean => {
    if (!submitAsSimple && variants.length === 0) {
      setLoading(false);
      alert(t('admin.products.add.variableVariantsRequired'));
      return false;
    }

    if (!submitAsSimple) {
      const skuSet = new Set<string>();
      for (const variant of variants) {
        const variantSku = variant.sku ? variant.sku.trim() : '';
        if (variantSku !== '' && skuSet.has(variantSku)) {
          setLoading(false);
          alert(t('admin.products.add.duplicateSku'));
          return false;
        }
        if (variantSku !== '') {
          skuSet.add(variantSku);
        }

        const colorData = variant.colors && variant.colors.length > 0 ? variant.colors : [];

        if (colorData.length > 0) {
          for (const colorDataItem of colorData) {
            const colorSizes = colorDataItem.sizes || [];
            const colorSizeStocks = colorDataItem.sizeStocks || {};
            const hasColor = colorDataItem.colorValue && colorDataItem.colorValue.trim() !== '';

            if (hasColor) {
              const colorPriceValue = parseFloat(colorDataItem.price || '0');
              if (!colorDataItem.price || Number.isNaN(colorPriceValue) || colorPriceValue <= 0) {
                setLoading(false);
                alert(t('admin.products.add.priceRequired'));
                return false;
              }
            } else if (colorData.indexOf(colorDataItem) === 0) {
              const variantPriceValue = parseFloat(variant.price || '0');
              if (!variant.price || Number.isNaN(variantPriceValue) || variantPriceValue <= 0) {
                setLoading(false);
                alert(t('admin.products.add.priceRequired'));
                return false;
              }
            }

            if (colorSizes.length > 0) {
              for (const size of colorSizes) {
                const stock = colorSizeStocks[size];
                if (
                  stock !== undefined &&
                  stock !== null &&
                  typeof stock === 'string' &&
                  stock.trim() !== '' &&
                  Number.parseInt(stock, 10) < 0
                ) {
                  setLoading(false);
                  alert(t('admin.products.add.invalidStock'));
                  return false;
                }
              }
            } else if (
              colorDataItem.stock !== undefined &&
              colorDataItem.stock !== null &&
              typeof colorDataItem.stock === 'string' &&
              colorDataItem.stock.trim() !== '' &&
              Number.parseInt(colorDataItem.stock, 10) < 0
            ) {
              setLoading(false);
              alert(t('admin.products.add.invalidStock'));
              return false;
            }
          }
        }
      }
    }

    if (submitAsSimple) {
      if (!simpleProductData.price || simpleProductData.price.trim() === '') {
        setLoading(false);
        alert(t('admin.products.add.priceRequired'));
        return false;
      }
      const priceValue = Number.parseFloat(simpleProductData.price);
      if (Number.isNaN(priceValue) || priceValue <= 0) {
        setLoading(false);
        alert(t('admin.products.add.priceRequired'));
        return false;
      }
      if (
        simpleProductData.quantity.trim() !== '' &&
        Number.parseInt(simpleProductData.quantity, 10) < 0
      ) {
        setLoading(false);
        alert(t('admin.products.add.invalidStock'));
        return false;
      }
    }

    return true;
  };

  return { validateVariants };
}
