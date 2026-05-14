import { useState, useEffect, useCallback } from 'react';
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
  const maxQuantity = currentVariant?.stock && currentVariant.stock > 0 ? currentVariant.stock : 0;

  useEffect(() => {
    if (!currentVariant || currentVariant.stock <= 0) {
      setQuantity(0);
      return;
    }
    
    setQuantity(prev => {
      const currentStock = currentVariant.stock;
      if (prev > currentStock) return currentStock;
      if (prev <= 0 && currentStock > 0) return 1;
      return prev;
    });
  }, [currentVariant?.id, currentVariant?.stock]);

  const adjustQuantity = useCallback((delta: number) => {
    if (isOutOfStock) return;
    
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return currentVariant && currentVariant.stock > 0 ? 1 : 0;
      return next > maxQuantity ? maxQuantity : next;
    });
  }, [isOutOfStock, currentVariant, maxQuantity]);

  return { quantity, setQuantity, maxQuantity, adjustQuantity };
}




