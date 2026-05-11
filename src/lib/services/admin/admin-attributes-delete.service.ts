import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

class AdminAttributesDeleteService {
  /**
   * Delete attribute
   */
  async deleteAttribute(attributeId: string) {
    try {
      logger.debug('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Սկսվում է attribute-ի հեռացում:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });

      // Ստուգում ենք, արդյոք attribute-ը գոյություն ունի
      logger.debug('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է attribute-ի գոյությունը...');
      const attribute = await db.attribute.findUnique({
        where: { id: attributeId },
        select: {
          id: true,
          key: true,
        },
      });

      if (!attribute) {
        logger.debug('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը չի գտնվել:', attributeId);
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      logger.debug('✅ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը գտնվել է:', {
        id: attribute.id,
        key: attribute.key,
      });

      // Ստուգում ենք, արդյոք attribute-ը օգտագործվում է արտադրանքներում
      logger.debug('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է, արդյոք attribute-ը օգտագործվում է արտադրանքներում...');
      
      let productAttributesCount = 0;
      
      // Ստուգում ենք, արդյոք db.productAttribute գոյություն ունի
      if (db.productAttribute) {
        try {
          productAttributesCount = await db.productAttribute.count({
            where: { attributeId },
          });
          logger.debug('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count:', productAttributesCount);
        } catch (countError: any) {
          console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count սխալ:', {
            error: countError,
            message: countError?.message,
            code: countError?.code,
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          try {
            const productAttributes = await db.productAttribute.findMany({
              where: { attributeId },
              select: { id: true },
            });
            productAttributesCount = productAttributes.length;
            logger.debug('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes count (via findMany):', productAttributesCount);
          } catch (findError: any) {
            console.warn('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Product attributes findMany-ը նույնպես չի աշխատում, skip անում ենք ստուգումը');
            productAttributesCount = 0;
          }
        }
      } else {
        console.warn('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] db.productAttribute-ը undefined է, skip անում ենք product attributes ստուգումը');
      }

      if (productAttributesCount > 0) {
        logger.debug('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը օգտագործվում է արտադրանքներում:', productAttributesCount);
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute",
          detail: `Attribute is used in ${productAttributesCount} product(s). Please remove it from products first.`,
        };
      }

      // Ստուգում ենք, արդյոք attribute values-ները օգտագործվում են variants-ներում
      logger.debug('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է, արդյոք attribute values-ները օգտագործվում են variants-ներում...');
      const attributeValues = await db.attributeValue.findMany({
        where: { attributeId },
        select: { id: true },
      });

      logger.debug('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Attribute values count:', attributeValues.length);

      if (attributeValues.length > 0) {
        const valueIds = attributeValues.map((v: { id: string }) => v.id);
        logger.debug('🔍 [ADMIN ATTRIBUTES DELETE SERVICE] Ստուգվում է variant options...');
        
        let variantOptionsCount = 0;
        try {
          variantOptionsCount = await db.productVariantOption.count({
            where: {
              valueId: { in: valueIds },
            },
          });
          logger.debug('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count:', variantOptionsCount);
        } catch (countError: any) {
          console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count սխալ:', {
            error: countError,
            message: countError?.message,
            code: countError?.code,
          });
          // Եթե count-ը չի աշխատում, փորձում ենք findMany-ով
          const variantOptions = await db.productVariantOption.findMany({
            where: {
              valueId: { in: valueIds },
            },
            select: { id: true },
          });
          variantOptionsCount = variantOptions.length;
          logger.debug('📊 [ADMIN ATTRIBUTES DELETE SERVICE] Variant options count (via findMany):', variantOptionsCount);
        }

        if (variantOptionsCount > 0) {
          logger.debug('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute values-ները օգտագործվում են variants-ներում:', variantOptionsCount);
          throw {
            status: 400,
            type: "https://api.shop.am/problems/validation-error",
            title: "Cannot delete attribute",
            detail: `Some attribute values are used in ${variantOptionsCount} variant(s). Please remove them from variants first.`,
          };
        }
      }

      // Հեռացնում ենք attribute-ը (values-ները կհեռացվեն cascade-ով)
      logger.debug('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Հեռացվում է attribute-ը...');
      await db.attribute.delete({
        where: { id: attributeId },
      });

      logger.debug('✅ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute-ը հաջողությամբ հեռացվել է:', {
        attributeId,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error: any) {
      // Եթե սա մեր ստեղծած սխալ է, ապա վերադարձնում ենք այն
      if (error.status && error.type) {
        console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Ստանդարտ սխալ:', {
          status: error.status,
          type: error.type,
          title: error.title,
          detail: error.detail,
        });
        throw error;
      }

      // Մանրամասն լոգավորում
      console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Attribute հեռացման սխալ:', {
        attributeId,
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack?.substring(0, 1000),
        },
        timestamp: new Date().toISOString(),
      });

      // Prisma սխալների մշակում
      if (error?.code === 'P2025') {
        logger.debug('⚠️ [ADMIN ATTRIBUTES DELETE SERVICE] Prisma P2025: Գրառումը չի գտնվել');
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute not found",
          detail: `Attribute with id '${attributeId}' does not exist`,
        };
      }

      // Գեներիկ սխալ
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error?.message || "Failed to delete attribute",
      };
    }
  }

  /**
   * Delete attribute value
   */
  async deleteAttributeValue(attributeValueId: string) {
    try {
      logger.debug('🗑️ [ADMIN ATTRIBUTES DELETE SERVICE] Deleting attribute value:', attributeValueId);

      // First check if attribute value exists
      const attributeValue = await db.attributeValue.findUnique({
        where: { id: attributeValueId },
        select: {
          id: true,
          attributeId: true,
        },
      });

      if (!attributeValue) {
        throw {
          status: 404,
          type: "https://api.shop.am/problems/not-found",
          title: "Attribute value not found",
          detail: `Attribute value with id '${attributeValueId}' does not exist`,
        };
      }

      // Check if value is used in any variants
      const variantOptionsCount = await db.productVariantOption.count({
        where: {
          valueId: attributeValueId,
        },
      });

      if (variantOptionsCount > 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cannot delete attribute value",
          detail: `Attribute value is used in ${variantOptionsCount} variant(s). Please remove it from variants first.`,
        };
      }

      // Delete attribute value
      await db.attributeValue.delete({
        where: { id: attributeValueId },
      });

      // Return updated attribute
      const attribute = await db.attribute.findUnique({
        where: { id: attributeValue.attributeId },
        include: {
          translations: {
            where: { locale: "en" },
            take: 1,
          },
          values: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!attribute) {
        throw {
          status: 500,
          type: "https://api.shop.am/problems/internal-error",
          title: "Internal Server Error",
          detail: "Failed to retrieve updated attribute",
        };
      }

      const translation = attribute.translations[0];
      const values = attribute.values || [];

      return {
        id: attribute.id,
        key: attribute.key,
        name: translation?.name || attribute.key,
        type: attribute.type,
        filterable: attribute.filterable,
        values: values.map((val: any) => {
          const valTranslation = val.translations?.[0];
          return {
            id: val.id,
            value: val.value,
            label: valTranslation?.label || val.value,
          };
        }),
      };
    } catch (error: any) {
      console.error('❌ [ADMIN ATTRIBUTES DELETE SERVICE] Error deleting attribute value:', error);
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: error.message || "Failed to delete attribute value",
      };
    }
  }
}

export const adminAttributesDeleteService = new AdminAttributesDeleteService();






