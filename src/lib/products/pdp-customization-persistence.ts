import type { Prisma } from '@prisma/client';
import { db } from '@white-shop/db';
import { logger } from '@/lib/utils/logger';
import {
  ensureProductPdpCustomizationColumn,
  logHotPathSchemaDrift,
} from '@/lib/utils/db-ensure';
import {
  parsePdpCustomizationConfig,
  type PdpCustomizationConfig,
} from '@/lib/products/pdp-customization-config';

type DbClient = Prisma.TransactionClient | typeof db;

function isMissingPdpCustomizationColumn(error: unknown): boolean {
  const prismaError = error as { code?: string; message?: string };
  const msg = (prismaError?.message ?? '').toLowerCase();
  return (
    prismaError?.code === 'P2022' ||
    (msg.includes('pdpcustomization') && msg.includes('does not exist')) ||
    (msg.includes('column') && msg.includes('pdpcustomization'))
  );
}

/**
 * Persist PDP customization JSON without relying on generated Prisma client fields
 * (supports DB column added before `prisma generate`).
 */
export async function saveProductPdpCustomization(
  productId: string,
  config: PdpCustomizationConfig | null | undefined,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  if (config === undefined) {
    return;
  }

  if (!config?.items?.length) {
    const ready = await ensureProductPdpCustomizationColumn('admin-mutation');
    if (!ready) {
      return;
    }
    const client: DbClient = tx ?? db;
    await client.$executeRawUnsafe(
      'UPDATE products SET "pdpCustomization" = NULL WHERE id = $1',
      productId,
    );
    return;
  }

  const ready = await ensureProductPdpCustomizationColumn('admin-mutation');
  if (!ready) {
    logger.warn('pdpCustomization column unavailable; customization not saved', { productId });
    return;
  }

  const client: DbClient = tx ?? db;
  const json = JSON.stringify(config);

  await client.$executeRawUnsafe(
    'UPDATE products SET "pdpCustomization" = $1::jsonb WHERE id = $2',
    json,
    productId,
  );
}

/** Load PDP customization when Prisma client omits the column from selects. */
export async function loadProductPdpCustomization(
  productId: string,
): Promise<PdpCustomizationConfig | null> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ pdpCustomization: unknown }>>(
      'SELECT "pdpCustomization" FROM products WHERE id = $1 LIMIT 1',
      productId,
    );

    return parsePdpCustomizationConfig(rows[0]?.pdpCustomization);
  } catch (error: unknown) {
    if (isMissingPdpCustomizationColumn(error)) {
      logHotPathSchemaDrift(
        'products."pdpCustomization" column',
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
    throw error;
  }
}
