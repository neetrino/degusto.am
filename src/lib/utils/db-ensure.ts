import { db } from "@white-shop/db";
import { logger } from "./logger";

// Cache to track if table check has been performed
let tableChecked = false;
let tableExists = false;

// Cache for product_reviews table
let reviewsTableChecked = false;
let reviewsTableExists = false;

// Cache for product_variants.attributes column
let attributesColumnChecked = false;
let attributesColumnExists = false;

// Cache for cart_items.customizations column
let cartCustomizationsColumnChecked = false;
let cartCustomizationsColumnExists = false;

// Cache for attribute_values.priceAdjustment column
let attributeValuePriceAdjustmentChecked = false;
let attributeValuePriceAdjustmentExists = false;

/**
 * Ensures the product_attributes table exists in the database
 * This is a fallback mechanism for Vercel deployments where migrations might not run automatically
 * Uses lazy initialization - checks only once per process
 * 
 * @returns Promise<boolean> - true if table exists or was created, false if creation failed
 */
export async function ensureProductAttributesTable(): Promise<boolean> {
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
export async function ensureProductReviewsTable(): Promise<boolean> {
  // If already checked and exists, return immediately
  if (reviewsTableChecked && reviewsTableExists) {
    return true;
  }
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
export async function ensureProductVariantAttributesColumn(): Promise<boolean> {
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
export async function ensureCartItemCustomizationsColumn(): Promise<boolean> {
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
export async function ensureAttributeValuePriceAdjustmentColumn(): Promise<boolean> {
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

