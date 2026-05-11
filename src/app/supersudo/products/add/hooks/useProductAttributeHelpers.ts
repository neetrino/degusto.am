import { logger } from "@/lib/utils/logger";
/**
 * Hook for product attribute helper functions
 */

import { useMemo } from 'react';
import type { Attribute } from '../types';

interface UseProductAttributeHelpersProps {
  attributes: Attribute[];
}

export function useProductAttributeHelpers({ attributes }: UseProductAttributeHelpersProps) {
  const colorAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    const colorAttr = attributes.find((attr) => attr.key === 'color');
    if (!colorAttr) {
      logger.debug('⚠️ [ADMIN] Color attribute not found. Available attributes:', attributes.map(a => ({ key: a.key, name: a.name })));
    } else {
      logger.debug('✅ [ADMIN] Color attribute found:', { id: colorAttr.id, key: colorAttr.key, valuesCount: colorAttr.values?.length || 0 });
    }
    return colorAttr;
  }, [attributes]);

  const sizeAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    const sizeAttr = attributes.find((attr) => attr.key === 'size');
    if (!sizeAttr) {
      logger.debug('⚠️ [ADMIN] Size attribute not found. Available attributes:', attributes.map(a => ({ key: a.key, name: a.name })));
    } else {
      logger.debug('✅ [ADMIN] Size attribute found:', { id: sizeAttr.id, key: sizeAttr.key, valuesCount: sizeAttr.values?.length || 0 });
    }
    return sizeAttr;
  }, [attributes]);

  const getColorAttribute = () => colorAttribute;
  const getSizeAttribute = () => sizeAttribute;

  return {
    colorAttribute,
    sizeAttribute,
    getColorAttribute,
    getSizeAttribute,
  };
}

