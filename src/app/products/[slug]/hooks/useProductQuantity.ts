import { useState, useEffect, useCallback } from 'react';
import { getEffectiveMaxQuantity, hasSellableStock } from '@/lib/product-stock';
import type { ProductVariant } from '../types';

interface UseProductQuantityProps {
  currentVariant: ProductVariant | null;
  isOutOfStock: boolean;
}

export function useProductQuantity({
  currentVariant,
  isOutOfStock,
}: UseProductQuantityProps) {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = currentVariant ? getEffectiveMaxQuantity(currentVariant.stock) : 0;

  useEffect(() => {
    if (!currentVariant || !hasSellableStock(currentVariant.stock)) {
      setQuantity(0);
      return;
    }
    
    setQuantity(prev => {
      const currentMax = getEffectiveMaxQuantity(currentVariant.stock);
      if (prev > currentMax) return currentMax;
      if (prev <= 0) return 1;
      return prev;
    });
  }, [currentVariant?.id, currentVariant?.stock]);

  const adjustQuantity = useCallback((delta: number) => {
    if (isOutOfStock) return;
    
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return currentVariant && hasSellableStock(currentVariant.stock) ? 1 : 0;
      return next > maxQuantity ? maxQuantity : next;
    });
  }, [isOutOfStock, currentVariant, maxQuantity]);

  return { quantity, setQuantity, maxQuantity, adjustQuantity };
}




