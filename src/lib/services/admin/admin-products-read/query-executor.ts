import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { logHotPathSchemaDrift } from "../../../utils/db-ensure";
import { logger } from "../../../utils/logger";

/**
 * Base include configuration for product list queries
 */
const getProductListInclude = () => ({
  translations: {
    where: { locale: "en" },
    take: 1,
  },
  variants: {
    where: { published: true },
    take: 1,
    orderBy: { price: "asc" as const },
  },
  categories: {
    include: {
      translations: {
        where: { locale: "en" },
        take: 1,
      },
    },
  },
});

/**
 * Base include configuration for product detail queries
 */
const getProductDetailInclude = () => ({
  translations: true,
  categories: {
    include: {
      translations: true,
    },
  },
  variants: {
    include: {
      options: {
        include: {
          attributeValue: {
            include: {
              attribute: true,
              translations: true,
            },
          },
        },
      },
    },
    orderBy: {
      position: "asc" as const,
    },
  },
  labels: true,
});

/**
 * ProductAttributes include configuration
 */
const getProductAttributesInclude = () => ({
  productAttributes: {
    include: {
      attribute: true,
    },
  },
});

/**
 * Check if error is related to product_variants.attributes column
 */
function isVariantAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('product_variants.attributes') || 
         (errorMessage.includes('attributes') && errorMessage.includes('does not exist'));
}

/**
 * Check if error is related to productAttributes table
 */
function isProductAttributesError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (errorObj && typeof errorObj === 'object' && 'code' in errorObj && errorObj.code === 'P2021') || 
         errorMessage.includes('productAttributes') || 
         errorMessage.includes('does not exist');
}

/**
 * Execute product list query with error handling
 */
export async function executeProductListQuery(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  skip: number,
  take: number
) {
  const queryStartTime = Date.now();
  
  try {
    const listQuery = db.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: getProductListInclude(),
    });

    const COUNT_TIMEOUT_MS = 10_000;
    const countWithTimeout = Promise.race([
      db.product.count({ where }),
      new Promise<number>((_, reject) => {
        setTimeout(() => reject(new Error("Count query timeout")), COUNT_TIMEOUT_MS);
      }),
    ]).catch((countError: unknown) => {
      logger.warn("Count query failed or timed out, using estimated total", {
        error: countError instanceof Error ? countError.message : String(countError),
      });
      return -1;
    });

    logger.debug("Fetching products and total count in parallel...");
    const [products, countResult] = await Promise.all([listQuery, countWithTimeout]);

    const total = countResult === -1 ? products.length || take : countResult;

    const queryTime = Date.now() - queryStartTime;
    logger.debug(`All database queries completed in ${queryTime}ms`, {
      productCount: products.length,
      total,
    });

    return { products, total };
  } catch (error: unknown) {
    if (isVariantAttributesError(error)) {
      logHotPathSchemaDrift(
        'product_variants."attributes" column',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }

    const queryTime = Date.now() - queryStartTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorObj = error as { code?: string; meta?: unknown; stack?: string };
    logger.error(`Database query error after ${queryTime}ms`, {
      error: {
        message: errorMessage,
        code: errorObj?.code,
        meta: errorObj?.meta,
        stack: errorObj?.stack?.substring(0, 500),
      },
    });
    
    throw error;
  }
}

/**
 * Execute product detail query with error handling
 */
export async function executeProductDetailQuery(productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        ...getProductDetailInclude(),
        ...getProductAttributesInclude(),
      },
    });
    return product;
  } catch (error: unknown) {
    // If productAttributes table doesn't exist, retry without it
    if (isProductAttributesError(error)) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('productAttributes table not found, fetching without it', { error: errorMessage });
      const product = await db.product.findUnique({
        where: { id: productId },
        include: getProductDetailInclude(),
      });
      return product;
    }
    throw error;
  }
}

