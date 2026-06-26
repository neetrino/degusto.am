import { db } from "@white-shop/db";
import { logger } from "./logger";

const ENABLE_RUNTIME_SCHEMA_PATCH =
  process.env.ENABLE_RUNTIME_SCHEMA_PATCH === "1";

/** Only admin write paths may invoke runtime DDL when explicitly enabled. */
export type RuntimeSchemaPatchContext = "admin-mutation";

export function isRuntimeSchemaPatchEnabled(): boolean {
  return ENABLE_RUNTIME_SCHEMA_PATCH;
}

const loggedHotPathBlocks = new Set<string>();
const loggedPatchDisabled = new Set<string>();

/**
 * Logs migration drift on a hot read/request path. Runtime DDL is never attempted here.
 */
export function logHotPathSchemaDrift(entity: string, detail?: string): void {
  const key = `${entity}:${detail ?? ""}`;
  if (loggedHotPathBlocks.has(key)) {
    return;
  }
  loggedHotPathBlocks.add(key);
  logger.error("[schema] Migration drift on hot path; runtime patch blocked", {
    entity,
    detail,
    patchEnabled: ENABLE_RUNTIME_SCHEMA_PATCH,
    hint: "Apply Prisma migrations. Runtime DDL runs only on admin-mutation paths when ENABLE_RUNTIME_SCHEMA_PATCH=1.",
  });
}

function logPatchDisabled(entity: string): void {
  if (loggedPatchDisabled.has(entity)) {
    return;
  }
  loggedPatchDisabled.add(entity);
  logger.warn("[schema] Runtime schema patch skipped (disabled)", {
    entity,
    hint: "Set ENABLE_RUNTIME_SCHEMA_PATCH=1 to allow DDL on admin-mutation paths only.",
  });
}

function canRunRuntimeSchemaPatch(
  context: RuntimeSchemaPatchContext,
  entity: string
): boolean {
  if (context !== "admin-mutation") {
    logHotPathSchemaDrift(entity, "invalid or missing admin-mutation context");
    return false;
  }
  if (!ENABLE_RUNTIME_SCHEMA_PATCH) {
    logPatchDisabled(entity);
    return false;
  }
  logger.warn("[schema] Runtime schema patch executing on admin-mutation path", {
    entity,
  });
  return true;
}

// Cache to track if table check has been performed
let tableChecked = false;
let tableExists = false;

// Cache for product_reviews table
let reviewsTableChecked = false;
let reviewsTableExists = false;
let reviewsTableEnsureInFlight: Promise<boolean> | null = null;

// Cache for product_variants.attributes column
let attributesColumnChecked = false;
let attributesColumnExists = false;

// Cache for cart_items.customizations column
let cartCustomizationsColumnChecked = false;
let cartCustomizationsColumnExists = false;

// Cache for attribute_values.priceAdjustment column
let attributeValuePriceAdjustmentChecked = false;
let attributeValuePriceAdjustmentExists = false;

// Cache for products.pdpCustomization column
let pdpCustomizationColumnChecked = false;
let pdpCustomizationColumnExists = false;

/**
 * Ensures the product_attributes table exists in the database
 * This is a fallback mechanism for Vercel deployments where migrations might not run automatically
 * Uses lazy initialization - checks only once per process
 * 
 * @returns Promise<boolean> - true if table exists or was created, false if creation failed
 */
export async function ensureProductAttributesTable(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, "product_attributes table")) {
    return false;
  }
  // If already checked and exists, return immediately
  if (tableChecked && tableExists) {
    return true;
  }
  try {
    // Try to query the table to check if it exists
    await db.$queryRaw`SELECT 1 FROM "product_attributes" LIMIT 1`;
    tableChecked = true;
    tableExists = true;
    return true;
  } catch (error: unknown) {
    // If table doesn't exist, create it
    const prismaError = error as { code?: string; message?: string };
    if (
      prismaError?.code === 'P2021' || 
      prismaError?.message?.includes('does not exist') ||
      prismaError?.message?.includes('product_attributes')
    ) {
      logger.info('product_attributes table not found, creating...');
      
      try {
        // Create table if it doesn't exist
        await db.$executeRaw`
          CREATE TABLE IF NOT EXISTS "product_attributes" (
            "id" TEXT NOT NULL,
            "productId" TEXT NOT NULL,
            "attributeId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
          )
        `;

        // Create unique index if it doesn't exist
        await db.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "product_attributes_productId_attributeId_key" 
          ON "product_attributes"("productId", "attributeId")
        `;

        // Create indexes if they don't exist
        await db.$executeRaw`
          CREATE INDEX IF NOT EXISTS "product_attributes_productId_idx" 
          ON "product_attributes"("productId")
        `;

        await db.$executeRaw`
          CREATE INDEX IF NOT EXISTS "product_attributes_attributeId_idx" 
          ON "product_attributes"("attributeId")
        `;

        // Add foreign key constraints if they don't exist
        // Check and add productId foreign key
        const productFkExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'product_attributes_productId_fkey'
          ) as exists
        `;

        if (!productFkExists[0]?.exists) {
          await db.$executeRaw`
            ALTER TABLE "product_attributes" 
            ADD CONSTRAINT "product_attributes_productId_fkey" 
            FOREIGN KEY ("productId") 
            REFERENCES "products"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        }

        // Check and add attributeId foreign key
        const attributeFkExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'product_attributes_attributeId_fkey'
          ) as exists
        `;

        if (!attributeFkExists[0]?.exists) {
          await db.$executeRaw`
            ALTER TABLE "product_attributes" 
            ADD CONSTRAINT "product_attributes_attributeId_fkey" 
            FOREIGN KEY ("attributeId") 
            REFERENCES "attributes"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        }

        // Create trigger for updatedAt (if it doesn't exist)
        const triggerExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'product_attributes_updated_at'
          ) as exists
        `;

        if (!triggerExists[0]?.exists) {
          await db.$executeRaw`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW."updatedAt" = CURRENT_TIMESTAMP;
              RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER product_attributes_updated_at
            BEFORE UPDATE ON "product_attributes"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
          `;
        }

        logger.info('product_attributes table created successfully');
        tableChecked = true;
        tableExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error('Failed to create product_attributes table', {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        tableChecked = true;
        tableExists = false;
        return false;
      }
    }
    
    // Other errors - log and return false
    logger.error('Unexpected error checking product_attributes table', {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    tableChecked = true;
    tableExists = false;
    return false;
  }
}

/**
 * Ensures the product_reviews table exists in the database
 * This is a fallback mechanism for deployments where migrations might not run automatically
 * Uses lazy initialization - checks only once per process
 * 
 * @returns Promise<boolean> - true if table exists or was created, false if creation failed
 */
export async function ensureProductReviewsTable(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, "product_reviews table")) {
    return false;
  }
  // If already checked and exists, return immediately
  if (reviewsTableChecked && reviewsTableExists) {
    return true;
  }
  if (reviewsTableEnsureInFlight) {
    return reviewsTableEnsureInFlight;
  }

  reviewsTableEnsureInFlight = ensureProductReviewsTableInner();
  try {
    return await reviewsTableEnsureInFlight;
  } finally {
    reviewsTableEnsureInFlight = null;
  }
}

async function ensureProductReviewsTableInner(): Promise<boolean> {
  try {
    // Try to query the table to check if it exists
    await db.$queryRaw`SELECT 1 FROM "product_reviews" LIMIT 1`;
    reviewsTableChecked = true;
    reviewsTableExists = true;
    return true;
  } catch (error: unknown) {
    // If table doesn't exist, create it
    const prismaError = error as { code?: string; message?: string };
    if (
      prismaError?.code === 'P2021' || 
      prismaError?.message?.includes('does not exist') ||
      prismaError?.message?.includes('product_reviews')
    ) {
      logger.info('product_reviews table not found, creating...');
      
      try {
        // Create table if it doesn't exist
        await db.$executeRaw`
          CREATE TABLE IF NOT EXISTS "product_reviews" (
            "id" TEXT NOT NULL,
            "productId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "rating" INTEGER NOT NULL,
            "comment" TEXT,
            "published" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
          )
        `;

        // Create indexes if they don't exist
        await db.$executeRaw`
          CREATE INDEX IF NOT EXISTS "product_reviews_productId_idx" 
          ON "product_reviews"("productId")
        `;

        await db.$executeRaw`
          CREATE INDEX IF NOT EXISTS "product_reviews_userId_idx" 
          ON "product_reviews"("userId")
        `;

        await db.$executeRaw`
          CREATE INDEX IF NOT EXISTS "product_reviews_published_createdAt_idx" 
          ON "product_reviews"("published", "createdAt" DESC)
        `;

        // Create unique constraint (one review per user per product)
        await db.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_productId_userId_key" 
          ON "product_reviews"("productId", "userId")
        `;

        // Add foreign key constraints if they don't exist
        // Check and add productId foreign key
        const productFkExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'product_reviews_productId_fkey'
          ) as exists
        `;

        if (!productFkExists[0]?.exists) {
          await db.$executeRaw`
            ALTER TABLE "product_reviews" 
            ADD CONSTRAINT "product_reviews_productId_fkey" 
            FOREIGN KEY ("productId") 
            REFERENCES "products"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        }

        // Check and add userId foreign key
        const userFkExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'product_reviews_userId_fkey'
          ) as exists
        `;

        if (!userFkExists[0]?.exists) {
          await db.$executeRaw`
            ALTER TABLE "product_reviews" 
            ADD CONSTRAINT "product_reviews_userId_fkey" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        }

        // Create trigger for updatedAt (if it doesn't exist)
        const triggerExists = await db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'product_reviews_updated_at'
          ) as exists
        `;

        if (!triggerExists[0]?.exists) {
          await db.$executeRaw`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW."updatedAt" = CURRENT_TIMESTAMP;
              RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER product_reviews_updated_at
            BEFORE UPDATE ON "product_reviews"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
          `;
        }

        logger.info('product_reviews table created successfully');
        reviewsTableChecked = true;
        reviewsTableExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error('Failed to create product_reviews table', {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        reviewsTableChecked = true;
        reviewsTableExists = false;
        return false;
      }
    }
    
    // Other errors - log and return false
    logger.error('Unexpected error checking product_reviews table', {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    reviewsTableChecked = true;
    reviewsTableExists = false;
    return false;
  }
}

/**
 * Ensures the attributes column exists in the product_variants table
 * This is a fallback mechanism for Vercel deployments where migrations might not run automatically
 * Uses lazy initialization - checks only once per process
 * 
 * @returns Promise<boolean> - true if column exists or was created, false if creation failed
 */
export async function ensureProductVariantAttributesColumn(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, 'product_variants."attributes" column')) {
    return false;
  }
  // If already checked and exists, return immediately
  if (attributesColumnChecked && attributesColumnExists) {
    return true;
  }
  
  try {
    // Try to query the column to check if it exists
    await db.$queryRaw`SELECT "attributes" FROM "product_variants" LIMIT 1`;
    attributesColumnChecked = true;
    attributesColumnExists = true;
    return true;
  } catch (error: unknown) {
    // If column doesn't exist, create it
    const prismaError = error as { code?: string; message?: string };
    if (
      prismaError?.code === 'P2022' || 
      prismaError?.message?.includes('does not exist') ||
      prismaError?.message?.includes('product_variants.attributes') ||
      (prismaError?.message?.includes('column') && prismaError?.message?.includes('attributes'))
    ) {
      logger.info('product_variants.attributes column not found, creating...');
      
      try {
        // Add the attributes JSONB column if it doesn't exist
        await db.$executeRaw`
          ALTER TABLE "product_variants" 
          ADD COLUMN IF NOT EXISTS "attributes" JSONB
        `;
        
        logger.info('product_variants.attributes column created successfully');
        attributesColumnChecked = true;
        attributesColumnExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error('Failed to create product_variants.attributes column', {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        attributesColumnChecked = true;
        attributesColumnExists = false;
        return false;
      }
    }
    
    // Other errors - log and return false
    logger.error('Unexpected error checking product_variants.attributes column', {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    attributesColumnChecked = true;
    attributesColumnExists = false;
    return false;
  }
}

/**
 * Ensures the customizations column exists in the cart_items table
 * This is a fallback mechanism for deployments where migrations might not run automatically
 * Uses lazy initialization - checks only once per process
 *
 * @returns Promise<boolean> - true if column exists or was created, false if creation failed
 */
export async function ensureCartItemCustomizationsColumn(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, 'cart_items."customizations" column')) {
    return false;
  }
  if (cartCustomizationsColumnChecked && cartCustomizationsColumnExists) {
    return true;
  }

  try {
    await db.$queryRaw`SELECT "customizations" FROM "cart_items" LIMIT 1`;
    cartCustomizationsColumnChecked = true;
    cartCustomizationsColumnExists = true;
    return true;
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string };
    if (
      prismaError?.code === "P2022" ||
      prismaError?.message?.includes("does not exist") ||
      prismaError?.message?.includes("cart_items.customizations") ||
      (prismaError?.message?.includes("column") &&
        prismaError?.message?.includes("customizations"))
    ) {
      logger.info("cart_items.customizations column not found, creating...");

      try {
        await db.$executeRaw`
          ALTER TABLE "cart_items"
          ADD COLUMN IF NOT EXISTS "customizations" JSONB
        `;

        logger.info("cart_items.customizations column created successfully");
        cartCustomizationsColumnChecked = true;
        cartCustomizationsColumnExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error("Failed to create cart_items.customizations column", {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        cartCustomizationsColumnChecked = true;
        cartCustomizationsColumnExists = false;
        return false;
      }
    }

    logger.error("Unexpected error checking cart_items.customizations column", {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    cartCustomizationsColumnChecked = true;
    cartCustomizationsColumnExists = false;
    return false;
  }
}

/**
 * Ensures `priceAdjustment` exists on `attribute_values` (migration drift / partial deploys).
 */
export async function ensureAttributeValuePriceAdjustmentColumn(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, 'attribute_values."priceAdjustment" column')) {
    return false;
  }
  if (attributeValuePriceAdjustmentChecked && attributeValuePriceAdjustmentExists) {
    return true;
  }

  try {
    await db.$queryRaw`SELECT "priceAdjustment" FROM "attribute_values" LIMIT 1`;
    attributeValuePriceAdjustmentChecked = true;
    attributeValuePriceAdjustmentExists = true;
    return true;
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string };
    const msg = (prismaError?.message ?? "").toLowerCase();
    const isMissingPriceAdjustmentColumn =
      prismaError?.code === "P2022" ||
      (msg.includes("priceadjustment") && msg.includes("does not exist")) ||
      (msg.includes("column") && msg.includes("priceadjustment"));

    if (isMissingPriceAdjustmentColumn) {
      logger.info('attribute_values."priceAdjustment" column not found, creating...');

      try {
        await db.$executeRaw`
          ALTER TABLE "attribute_values"
          ADD COLUMN IF NOT EXISTS "priceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0
        `;
        logger.info('attribute_values."priceAdjustment" column created successfully');
        attributeValuePriceAdjustmentChecked = true;
        attributeValuePriceAdjustmentExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error('Failed to create attribute_values."priceAdjustment" column', {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        attributeValuePriceAdjustmentChecked = true;
        attributeValuePriceAdjustmentExists = false;
        return false;
      }
    }

    logger.error('Unexpected error checking attribute_values."priceAdjustment" column', {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    attributeValuePriceAdjustmentChecked = true;
    attributeValuePriceAdjustmentExists = false;
    return false;
  }
}

/** Ensures `pdpCustomization` exists on `products` (migration drift / partial deploys). */
export async function ensureProductPdpCustomizationColumn(
  context: RuntimeSchemaPatchContext
): Promise<boolean> {
  if (!canRunRuntimeSchemaPatch(context, 'products."pdpCustomization" column')) {
    return false;
  }
  if (pdpCustomizationColumnChecked && pdpCustomizationColumnExists) {
    return true;
  }

  try {
    await db.$queryRaw`SELECT "pdpCustomization" FROM "products" LIMIT 1`;
    pdpCustomizationColumnChecked = true;
    pdpCustomizationColumnExists = true;
    return true;
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string };
    const msg = (prismaError?.message ?? '').toLowerCase();
    const isMissingColumn =
      prismaError?.code === 'P2022' ||
      (msg.includes('pdpcustomization') && msg.includes('does not exist')) ||
      (msg.includes('column') && msg.includes('pdpcustomization'));

    if (isMissingColumn) {
      logger.info('products."pdpCustomization" column not found, creating...');
      try {
        await db.$executeRaw`
          ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pdpCustomization" JSONB
        `;
        logger.info('products."pdpCustomization" column created successfully');
        pdpCustomizationColumnChecked = true;
        pdpCustomizationColumnExists = true;
        return true;
      } catch (createError: unknown) {
        const prismaCreateError = createError as { message?: string; code?: string };
        logger.error('Failed to create products."pdpCustomization" column', {
          message: prismaCreateError?.message,
          code: prismaCreateError?.code,
        });
        pdpCustomizationColumnChecked = true;
        pdpCustomizationColumnExists = false;
        return false;
      }
    }

    logger.error('Unexpected error checking products."pdpCustomization" column', {
      message: prismaError?.message,
      code: prismaError?.code,
    });
    pdpCustomizationColumnChecked = true;
    pdpCustomizationColumnExists = false;
    return false;
  }
}

