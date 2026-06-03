import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/error-handler';
import { convertPrice, type CurrencyCode } from '@/lib/currency';
import { cleanImageUrls, separateMainAndVariantImages } from '@/lib/utils/image-utils';
import type { Attribute, ProductData, ColorData, Variant, GeneratedVariant, PendingVariantHydration } from '../types';
import { useTranslation } from '@/lib/i18n-client';
import { extractColor, extractSize } from '../utils/variantAttributeExtraction';
import {
  createDefaultColorData,
  updateDefaultColorData,
  createColorData,
  updateColorData,
} from '../utils/colorDataBuilder';
import { isUnlimitedStock } from '@/lib/product-stock';
import { logger } from "@/lib/utils/logger";
import {
  collectVariantImagesFromColors,
  collectVariantImagesFromProductVariants,
} from '../utils/variantImageCollector';
import { hasVariantsWithAttributes } from '../utils/productTypeDetector';
import { buildFormData, getEmptyProductFormData } from '../utils/productFormDataBuilder';
import {
  collectVariantDefaultCustomizationValueIds,
  hydrateCustomizationFormState,
  inferSelectedCustomizationAttributeIds,
  parseProductPdpCustomization,
  type PdpCustomizationFormState,
} from '../utils/pdp-customization-form';

/** Admin product detail can include many variants/options; allow slow DB / cold Turbopack. */
const ADMIN_PRODUCT_GET_TIMEOUT_MS = 120_000;

const PRODUCT_EDIT_LOAD_ABORT_REASON = 'Product edit load cancelled';

interface UseProductEditModeProps {
  productId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  referenceCatalogReady: boolean;
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  setLoadingProduct: (loading: boolean) => void;
  setFormData: (updater: (prev: any) => any) => void;
  setUseNewCategory: (use: boolean) => void;
  setNewCategoryName: (name: string) => void;
  setHasVariantsToLoad: (has: boolean) => void;
  setProductType: (type: 'simple' | 'variable') => void;
  setSimpleProductData: (data: any) => void;
  setGeneratedVariants: (v: GeneratedVariant[] | ((prev: GeneratedVariant[]) => GeneratedVariant[])) => void;
  setSelectedAttributesForVariants: (
    v: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;
  setSelectedAttributeValueIds: (
    v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)
  ) => void;
  setOpenValueModal: (v: { variantId: string; attributeId: string } | null) => void;
  setPendingVariantHydration: (payload: PendingVariantHydration | null) => void;
  setPdpCustomizationForm: (state: PdpCustomizationFormState) => void;
  setSelectedPdpCustomizationAttributeIds: (ids: Set<string>) => void;
}

export function useProductEditMode({
  productId,
  isLoggedIn,
  isAdmin,
  referenceCatalogReady,
  attributes,
  defaultCurrency,
  setLoadingProduct,
  setFormData,
  setUseNewCategory,
  setNewCategoryName,
  setHasVariantsToLoad,
  setProductType,
  setSimpleProductData,
  setGeneratedVariants,
  setSelectedAttributesForVariants,
  setSelectedAttributeValueIds,
  setOpenValueModal,
  setPendingVariantHydration,
  setPdpCustomizationForm,
  setSelectedPdpCustomizationAttributeIds,
}: UseProductEditModeProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const attributesRef = useRef(attributes);
  attributesRef.current = attributes;
  const defaultCurrencyRef = useRef(defaultCurrency);
  defaultCurrencyRef.current = defaultCurrency;
  const tRef = useRef(t);
  tRef.current = t;
  const loadGenerationRef = useRef(0);
  const lastLoadedProductIdRef = useRef<string | null>(null);
  const productLoadedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || !referenceCatalogReady) {
      return;
    }
    if (!productId) {
      lastLoadedProductIdRef.current = null;
      productLoadedRef.current = false;
      setPendingVariantHydration(null);
      return;
    }

    const productChanged = lastLoadedProductIdRef.current !== productId;
    if (productChanged) {
      lastLoadedProductIdRef.current = productId;
      productLoadedRef.current = false;
      setPendingVariantHydration(null);
      setGeneratedVariants([]);
      setSelectedAttributesForVariants(new Set());
      setSelectedAttributeValueIds({});
      setOpenValueModal(null);
      setFormData(() => getEmptyProductFormData());
      setHasVariantsToLoad(false);
    } else if (productLoadedRef.current) {
      return;
    }

    setLoadingProduct(true);

    const abortController = new AbortController();
    const loadId = ++loadGenerationRef.current;

    const loadProduct = async () => {
      try {
        logger.debug('📥 [ADMIN] Loading product for edit:', productId);
        const product = await apiClient.get<ProductData>(`/api/v1/admin/products/${productId}`, {
          params: { _t: String(Date.now()) },
          signal: abortController.signal,
          timeoutMs: ADMIN_PRODUCT_GET_TIMEOUT_MS,
        });

        if (abortController.signal.aborted || loadId !== loadGenerationRef.current) {
          return;
        }

        const catalogAttributes = attributesRef.current;
        const currency = defaultCurrencyRef.current;
        const defaultColorLabel = tRef.current('admin.products.add.defaultColor');
          const colorDataMap = new Map<string, ColorData>();
          let firstPrice = '';
          let firstCompareAtPrice = '';
          let firstSku = '';

          (product.variants || []).forEach((variant: any, index: number) => {
            logger.debug(`🔍 [ADMIN] Processing variant ${index}:`, {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              color: variant.color,
              size: variant.size,
              options: variant.options,
              imageUrl: variant.imageUrl,
            });

            const color = extractColor(variant);
            const size = extractSize(variant);

            logger.debug(`📊 [ADMIN] Extracted from variant ${index}:`, { color, size });

            const stockValue =
              variant.stock !== undefined &&
              variant.stock !== null &&
              !isUnlimitedStock(variant.stock)
                ? String(variant.stock)
                : '';

            if (!color) {
              const defaultColor = 'default';

              if (!colorDataMap.has(defaultColor)) {
                const colorData = createDefaultColorData(
                  variant,
                  currency,
                  defaultColorLabel,
                  size,
                  stockValue
                );
                colorDataMap.set(defaultColor, colorData);
              } else {
                const existingColorData = colorDataMap.get(defaultColor)!;
                updateDefaultColorData(existingColorData, variant, currency, size, stockValue);
              }
            } else if (color) {
              if (!colorDataMap.has(color)) {
                const colorData = createColorData(
                  variant,
                  color,
                  catalogAttributes,
                  currency,
                  size,
                  stockValue
                );
                colorDataMap.set(color, colorData);
              } else {
                const existingColorData = colorDataMap.get(color)!;
                updateColorData(existingColorData, variant, currency, size, stockValue);
              }
            }

            if (index === 0) {
              const firstPriceUSD = variant.price !== undefined && variant.price !== null ? variant.price : 0;
              const firstCompareAtPriceUSD =
                variant.compareAtPrice !== undefined && variant.compareAtPrice !== null
                  ? variant.compareAtPrice
                  : 0;
              firstPrice =
                firstPriceUSD > 0 ? String(convertPrice(firstPriceUSD, 'USD', currency)) : '';
              firstCompareAtPrice =
                firstCompareAtPriceUSD > 0
                  ? String(convertPrice(firstCompareAtPriceUSD, 'USD', currency))
                  : '';
              firstSku = variant.sku || '';
            }
          });

          const mergedVariant: Variant = {
            id: `variant-${Date.now()}-${Math.random()}`,
            price: firstPrice,
            compareAtPrice: firstCompareAtPrice,
            sku: firstSku,
            colors: Array.from(colorDataMap.values()),
          };

          const variantImagesFromColors = collectVariantImagesFromColors(mergedVariant.colors);
          const variantImagesFromProduct = collectVariantImagesFromProductVariants(
            product.variants || []
          );
          const variantImages = new Set([...variantImagesFromColors, ...variantImagesFromProduct]);

          logger.debug(`🖼️ [ADMIN] Total variant images collected: ${variantImages.size}`);

          const mediaList = product.media || [];
          logger.debug('🖼️ [ADMIN] Loading main media images. Total media:', mediaList.length);

          const { main } = separateMainAndVariantImages(
            Array.isArray(mediaList) ? mediaList : [],
            variantImages.size > 0 ? Array.from(variantImages) : []
          );

          const normalizedMedia = cleanImageUrls(main);
          logger.debug(
            `🖼️ [ADMIN] Main media loaded: ${normalizedMedia.length} images (after separation from ${variantImages.size} variant images)`
          );

          const featuredIndexFromApi = Array.isArray(mediaList)
            ? mediaList.findIndex((item: any) => {
                const url = typeof item === 'string' ? item : item?.url || '';
                if (!url) return false;
                return typeof item === 'object' && item?.isFeatured === true;
              })
            : -1;

          const mainProductImage =
            (product as any).mainProductImage || (normalizedMedia.length > 0 ? normalizedMedia[0] : '');

          if (abortController.signal.aborted || loadId !== loadGenerationRef.current) {
            return;
          }

          const formData = buildFormData(
            product,
            normalizedMedia,
            featuredIndexFromApi,
            mainProductImage,
            mergedVariant
          );

          setFormData(() => ({
            ...getEmptyProductFormData(),
            ...formData,
          }));

          setUseNewCategory(false);
          setNewCategoryName('');

          const variantList = Array.isArray(product.variants) ? product.variants : [];
          const attributeIdList = Array.isArray(product.attributeIds) ? product.attributeIds : [];

          const pdpConfig = parseProductPdpCustomization(
            (product as ProductData).pdpCustomization,
          );
          const variantDefaultIds = collectVariantDefaultCustomizationValueIds(
            variantList,
            attributesRef.current,
          );
          const hydratedForm = hydrateCustomizationFormState(
            attributesRef.current,
            pdpConfig,
            variantDefaultIds,
          );
          setPdpCustomizationForm(hydratedForm);
          setSelectedPdpCustomizationAttributeIds(
            inferSelectedCustomizationAttributeIds(
              attributesRef.current,
              hydratedForm,
              pdpConfig,
            ),
          );

          setPendingVariantHydration({
            productId: product.id ?? productId,
            variants: variantList,
            attributeIds: attributeIdList,
          });
          setHasVariantsToLoad(variantList.length > 0);
          logger.debug('📋 [ADMIN] Queued variant hydration:', {
            productId: product.id ?? productId,
            variantsCount: variantList.length,
            attributeIdsCount: attributeIdList.length,
          });

          const variants = variantList;
          const hasVariants = variants.length > 0;
          const hasVariantsWithAttrs = hasVariantsWithAttributes(variants);

          logger.debug('📦 [ADMIN] Product type check:', {
            hasVariants,
            variantsCount: variants.length,
            hasVariantsWithAttributes: hasVariantsWithAttrs,
            firstVariant:
              hasVariants && variants.length > 0
                ? {
                    hasAttributes: !!(
                      variants[0] &&
                      (variants[0] as any).attributes &&
                      typeof (variants[0] as any).attributes === 'object' &&
                      Object.keys((variants[0] as any).attributes).length > 0
                    ),
                    hasOptions: !!(
                      (variants[0] as any).options &&
                      Array.isArray((variants[0] as any).options) &&
                      (variants[0] as any).options.length > 0
                    ),
                    attributes: (variants[0] as any).attributes,
                    optionsCount: ((variants[0] as any).options?.length || 0),
                  }
                : null,
          });

          if (!hasVariantsWithAttrs) {
            logger.debug('📦 [ADMIN] Product variants have no attributes, setting productType to "simple"');
            setProductType('simple');

            if (hasVariants && variants.length > 0) {
              const firstVariant = variants[0] as any;
              setSimpleProductData({
                price: firstVariant.price
                  ? String(
                      convertPrice(
                        typeof firstVariant.price === 'number'
                          ? firstVariant.price
                          : parseFloat(String(firstVariant.price || '0')),
                        'USD',
                        currency
                      )
                    )
                  : '',
                compareAtPrice: firstVariant.compareAtPrice
                  ? String(
                      convertPrice(
                        typeof firstVariant.compareAtPrice === 'number'
                          ? firstVariant.compareAtPrice
                          : parseFloat(String(firstVariant.compareAtPrice || '0')),
                        'USD',
                        currency
                      )
                    )
                  : '',
                sku: firstVariant.sku || '',
                quantity:
                  firstVariant.stock !== undefined &&
                  firstVariant.stock !== null &&
                  !isUnlimitedStock(firstVariant.stock)
                    ? String(firstVariant.stock)
                    : '',
              });
            } else {
              setSimpleProductData({
                price: '',
                compareAtPrice: '',
                sku: '',
                quantity: '',
              });
            }
          } else {
            logger.debug('📦 [ADMIN] Product variants have attributes, keeping productType as "variable"');
            setProductType('variable');
          }

          if (
            hasVariantsWithAttrs &&
            product.attributeIds &&
            product.attributeIds.length > 0
          ) {
            setSelectedAttributesForVariants(new Set(product.attributeIds));
          }

          logger.debug('✅ [ADMIN] Product loaded for edit');
          productLoadedRef.current = true;
        } catch (err: unknown) {
          if (isAbortError(err) || loadId !== loadGenerationRef.current) {
            return;
          }
          console.error('❌ [ADMIN] Error loading product:', err);
          router.push('/supersudo/products');
        } finally {
          if (loadId === loadGenerationRef.current) {
            setLoadingProduct(false);
          }
        }
      };

    void loadProduct().catch((err: unknown) => {
      if (isAbortError(err) || loadId !== loadGenerationRef.current) {
        return;
      }
      console.error('❌ [ADMIN] Unhandled error loading product:', err);
    });

    return () => {
      loadGenerationRef.current += 1;
      abortController.abort(
        new DOMException(PRODUCT_EDIT_LOAD_ABORT_REASON, 'AbortError')
      );
    };
  }, [
    productId,
    isLoggedIn,
    isAdmin,
    referenceCatalogReady,
    router,
    setLoadingProduct,
    setFormData,
    setUseNewCategory,
    setNewCategoryName,
    setHasVariantsToLoad,
    setProductType,
    setSimpleProductData,
    setGeneratedVariants,
    setSelectedAttributesForVariants,
    setSelectedAttributeValueIds,
    setOpenValueModal,
    setPendingVariantHydration,
  ]);
}
