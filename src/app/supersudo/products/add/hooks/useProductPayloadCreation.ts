import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { PdpCustomizationConfig } from '@/lib/products/pdp-customization-config';
import { resolveProductSlug } from '../utils/productUtils';
import { logger } from "@/lib/utils/logger";

interface CreateAndSubmitPayloadProps {
  formData: {
    title: string;
    slug: string;
    descriptionHtml: string;
    categoryIds: string[];
    published: boolean;
    featured: boolean;
    imageUrls: string[];
    featuredImageIndex: number;
    mainProductImage: string;
    labels: any[];
  };
  finalPrimaryCategoryId: string;
  variants: any[];
  attributeIds: string[];
  pdpCustomization: PdpCustomizationConfig | null;
  finalMedia: string[];
  mainImage: string | null;
  isEditMode: boolean;
  productId: string | null;
  creationMessages: string[];
  setLoading: (loading: boolean) => void;
  router: AppRouterInstance;
}

export async function createAndSubmitPayload({
  formData,
  finalPrimaryCategoryId,
  variants,
  attributeIds,
  pdpCustomization,
  finalMedia,
  mainImage,
  isEditMode,
  productId,
  creationMessages,
  setLoading,
  router,
}: CreateAndSubmitPayloadProps): Promise<void> {
  const categoryIds = [...formData.categoryIds];
  if (finalPrimaryCategoryId && !categoryIds.includes(finalPrimaryCategoryId)) {
    categoryIds.unshift(finalPrimaryCategoryId);
  }

  const resolvedSlug = resolveProductSlug(formData.title, formData.slug);

  const payload: any = {
      title: formData.title.trim(),
      slug: resolvedSlug,
      descriptionHtml: formData.descriptionHtml || undefined,
      primaryCategoryId: finalPrimaryCategoryId || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      published: isEditMode ? formData.published : true,
      featured: formData.featured,
      locale: 'en',
      variants: variants,
      attributeIds: attributeIds.length > 0 ? attributeIds : undefined,
      pdpCustomization: pdpCustomization ?? undefined,
    };
    
    if (finalMedia.length > 0) {
      payload.media = finalMedia;
    }
    
    if (mainImage) {
      payload.mainProductImage = mainImage;
    }

    payload.labels = (formData.labels || [])
      .filter((label) => label.value && label.value.trim() !== '')
      .map((label) => ({
        type: label.type,
        value: label.value.trim(),
        position: label.position,
        color: label.color || null,
      }));

    logger.debug('📤 [ADMIN] Sending payload:', JSON.stringify(payload, null, 2));
    
    try {
      if (isEditMode && productId) {
        const product = await apiClient.put(`/api/v1/admin/products/${productId}`, payload);
        logger.debug('✅ [ADMIN] Product updated:', product);
        const baseMessage = 'Ապրանքը հաջողությամբ թարմացվեց!';
        const extra = creationMessages.length ? `\n\n${creationMessages.join('\n')}` : '';
        alert(`${baseMessage}${extra}`);
        router.refresh();
      } else {
        const product = await apiClient.post('/api/v1/admin/products', payload);
        logger.debug('✅ [ADMIN] Product created:', product);
        const baseMessage = 'Ապրանքը հաջողությամբ ստեղծվեց!';
        const extra = creationMessages.length ? `\n\n${creationMessages.join('\n')}` : '';
        alert(`${baseMessage}${extra}`);
        router.refresh();
      }
      
      router.push('/supersudo/products');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving product:', err);

      let errorMessage = isEditMode ? 'Չհաջողվեց թարմացնել ապրանքը' : 'Չհաջողվեց ստեղծել ապրանքը';

      if (err instanceof ApiError) {
        const data = err.data;
        if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      throw err;
    } finally {
      setLoading(false);
    }
}

