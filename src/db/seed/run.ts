import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { hashPassword } from "@/lib/auth/password";
import * as schema from "@/db/schema";
import { getSeedEnv } from "@/db/seed/env";
import { seedIds } from "@/db/seed/ids";
import { seedMenuCategories } from "@/db/seed/menu-categories";

async function seed(): Promise<void> {
  const env = getSeedEnv();
  const db = drizzle(neon(env.DATABASE_URL), { schema });

  const now = new Date();
  const adminPasswordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  const customerEmail = env.SEED_CUSTOMER_EMAIL ?? "customer@white-shop.local";
  const customerPassword = env.SEED_CUSTOMER_PASSWORD ?? env.SEED_ADMIN_PASSWORD;
  const customerPasswordHash = await hashPassword(customerPassword);

  await db
    .insert(schema.users)
    .values({
      id: seedIds.adminUser,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      emailVerifiedAt: now,
      passwordHash: adminPasswordHash,
      passwordUpdatedAt: now,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
      termsAcceptedAt: now,
      termsVersion: "1.0",
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: env.SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash: adminPasswordHash,
        passwordUpdatedAt: now,
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: now,
      },
    });

  await db
    .insert(schema.users)
    .values({
      id: seedIds.customerUser,
      email: customerEmail.toLowerCase(),
      emailVerifiedAt: now,
      passwordHash: customerPasswordHash,
      passwordUpdatedAt: now,
      firstName: "Demo",
      lastName: "Customer",
      role: "CUSTOMER",
      status: "ACTIVE",
      termsAcceptedAt: now,
      termsVersion: "1.0",
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: customerEmail.toLowerCase(),
        passwordHash: customerPasswordHash,
        passwordUpdatedAt: now,
        role: "CUSTOMER",
        status: "ACTIVE",
        updatedAt: now,
      },
    });

  const burgerProducts = [
    {
      id: seedIds.productBurger1,
      sku: "DG-BURGER-001",
      title: "Double Cheeseburger",
      slug: "double-cheeseburger",
      mediaId: seedIds.mediaBurger1,
      productCategoryId: seedIds.productCategoryBurger1,
      objectKey: "assets/products/burger-1.webp",
      sortOrder: 1,
    },
    {
      id: seedIds.productBurger2,
      sku: "DG-BURGER-002",
      title: "Classic Burger",
      slug: "classic-burger",
      mediaId: seedIds.mediaBurger2,
      productCategoryId: seedIds.productCategoryBurger2,
      objectKey: "assets/products/burger-2.webp",
      sortOrder: 2,
    },
    {
      id: seedIds.productBurger3,
      sku: "DG-BURGER-003",
      title: "Spicy Burger",
      slug: "spicy-burger",
      mediaId: seedIds.mediaBurger3,
      productCategoryId: seedIds.productCategoryBurger3,
      objectKey: "assets/products/burger-3.webp",
      sortOrder: 3,
    },
    {
      id: seedIds.productBurger4,
      sku: "DG-BURGER-004",
      title: "Cheese Burger",
      slug: "cheese-burger",
      mediaId: seedIds.mediaBurger4,
      productCategoryId: seedIds.productCategoryBurger4,
      objectKey: "assets/products/burger-4.webp",
      sortOrder: 4,
    },
    {
      id: seedIds.productBurger5,
      sku: "DG-BURGER-005",
      title: "Deluxe Burger",
      slug: "deluxe-burger",
      mediaId: seedIds.mediaBurger5,
      productCategoryId: seedIds.productCategoryBurger5,
      objectKey: "assets/products/burger-5.webp",
      sortOrder: 5,
    },
  ] as const;

  for (const category of seedMenuCategories) {
    await db
      .insert(schema.categories)
      .values({
        id: category.id,
        translations: category.translations,
        sortOrder: category.sortOrder,
        status: category.status,
      })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          translations: category.translations,
          sortOrder: category.sortOrder,
          status: category.status,
          updatedAt: now,
        },
      });
  }

  await db
    .insert(schema.products)
    .values(
      burgerProducts.map((product) => ({
        id: product.id,
        sku: product.sku,
        translations: {
          hy: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
          en: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
          ru: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
        },
        priceAmount: 1200,
        compareAtAmount: 1714,
        stockOnHand: 50,
        lowStockThreshold: 5,
        status: "ACTIVE" as const,
        isFeatured: true,
      })),
    )
    .onConflictDoUpdate({
      target: schema.products.id,
      set: {
        priceAmount: 1200,
        compareAtAmount: 1714,
        stockOnHand: 50,
        status: "ACTIVE",
        isFeatured: true,
        updatedAt: now,
      },
    });

  for (const product of burgerProducts) {
    await db
      .update(schema.products)
      .set({
        sku: product.sku,
        translations: {
          hy: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
          en: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
          ru: {
            title: product.title,
            slug: product.slug,
            description: product.title,
          },
        },
        updatedAt: now,
      })
      .where(eq(schema.products.id, product.id));
  }

  await db
    .insert(schema.productCategories)
    .values(
      burgerProducts.map((product) => ({
        id: product.productCategoryId,
        productId: product.id,
        categoryId: seedIds.categoryBurgers,
        isPrimary: true,
        sortOrder: product.sortOrder,
      })),
    )
    .onConflictDoNothing({ target: schema.productCategories.id });

  for (const product of burgerProducts) {
    await db
      .insert(schema.mediaAssets)
      .values({
        id: product.mediaId,
        objectKey: product.objectKey,
        mimeType: "image/webp",
        byteSize: 80_000,
        width: 454,
        height: 294,
        uploadStatus: "READY",
        role: "PRIMARY",
        sortOrder: 0,
        isPrimary: true,
        productId: product.id,
        altTranslations: {
          hy: product.title,
          en: product.title,
          ru: product.title,
        },
      })
      .onConflictDoUpdate({
        target: schema.mediaAssets.id,
        set: {
          objectKey: product.objectKey,
          uploadStatus: "READY",
          role: "PRIMARY",
          isPrimary: true,
          productId: product.id,
          updatedAt: now,
        },
      });
  }

  for (const category of seedMenuCategories) {
    await db
      .insert(schema.mediaAssets)
      .values({
        id: category.mediaId,
        objectKey: category.objectKey,
        mimeType: "image/webp",
        byteSize: 50_000,
        uploadStatus: "READY",
        role: "PRIMARY",
        sortOrder: 0,
        isPrimary: true,
        categoryId: category.id,
        altTranslations: {
          hy: category.translations.hy?.title ?? "Category",
          en: category.translations.en?.title ?? "Category",
          ru: category.translations.ru?.title ?? "Category",
        },
      })
      .onConflictDoUpdate({
        target: schema.mediaAssets.id,
        set: {
          objectKey: category.objectKey,
          uploadStatus: "READY",
          role: "PRIMARY",
          isPrimary: true,
          categoryId: category.id,
          updatedAt: now,
        },
      });
  }

  await db
    .insert(schema.deliveryRules)
    .values({
      id: seedIds.deliveryArmenia,
      countryCode: "Armenia",
      city: "Yerevan",
      priceAmount: 1500,
      freeThresholdAmount: 50000,
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      isActive: true,
      priority: 100,
    })
    .onConflictDoUpdate({
      target: schema.deliveryRules.id,
      set: {
        isActive: true,
        countryCode: "Armenia",
        city: "Yerevan",
        priceAmount: 1500,
        freeThresholdAmount: 50000,
        updatedAt: now,
      },
    });

  await db
    .insert(schema.heroSlides)
    .values({
      id: seedIds.heroHome,
      translations: {
        hy: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Browse",
          buttonUrl: "/hy/products",
        },
        en: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Shop now",
          buttonUrl: "/en/products",
        },
        ru: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Browse",
          buttonUrl: "/ru/products",
        },
      },
      sortOrder: 1,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: schema.heroSlides.id,
      set: {
        isActive: true,
        updatedAt: now,
      },
    });

  await db
    .insert(schema.promotions)
    .values({
      id: seedIds.promoWelcome,
      kind: "COUPON",
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscountAmount: 5000,
      minimumOrderAmount: 10000,
      totalUsageLimit: 1000,
      perUserUsageLimit: 1,
      isActive: true,
      priority: 10,
      allowStacking: false,
      startsAt: now,
    })
    .onConflictDoUpdate({
      target: schema.promotions.id,
      set: {
        isActive: true,
        discountValue: 10,
        updatedAt: now,
      },
    });

  await db
    .insert(schema.blogPosts)
    .values({
      id: seedIds.blogWelcome,
      authorUserId: seedIds.adminUser,
      status: "PUBLISHED",
      publishedAt: now,
      translations: {
        hy: {
          title: "Welcome to White Shop",
          slug: "bari-galust",
          excerpt: "Store launch",
          content: "<p>White Shop is ready.</p>",
        },
        en: {
          title: "Welcome to White Shop",
          slug: "welcome",
          excerpt: "Store launch note",
          content: "<p>White Shop is ready.</p>",
        },
        ru: {
          title: "Welcome to White Shop",
          slug: "dobro-pozhalovat",
          excerpt: "Store launch",
          content: "<p>White Shop is ready.</p>",
        },
      },
      tags: ["news", "launch"],
    })
    .onConflictDoUpdate({
      target: schema.blogPosts.id,
      set: {
        status: "PUBLISHED",
        updatedAt: now,
      },
    });

  await db
    .insert(schema.storeSettings)
    .values([
      {
        key: "store.identity",
        value: {
          version: 1,
          name: "Degusto",
          defaultLocale: "hy",
          defaultCurrency: "AMD",
        },
      },
      {
        key: "store.maintenance",
        value: { version: 1, enabled: false },
      },
    ])
    .onConflictDoUpdate({
      target: schema.storeSettings.key,
      set: {
        updatedAt: now,
      },
    });

  await db
    .insert(schema.appMeta)
    .values({
      key: "seed.version",
      value: "2",
    })
    .onConflictDoUpdate({
      target: schema.appMeta.key,
      set: {
        value: "2",
        updatedAt: now,
      },
    });

  console.info(
    JSON.stringify({
      level: "info",
      message: "seed.complete",
      adminEmail: env.SEED_ADMIN_EMAIL.toLowerCase(),
      customerEmail: customerEmail.toLowerCase(),
      products: burgerProducts.map((product) => product.sku),
      coupon: "WELCOME10",
    }),
  );
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({ level: "error", message: "seed.failed", error: message }),
  );
  process.exitCode = 1;
});
