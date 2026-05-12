-- Create wishlist_items table for user-bound wishlist persistence
CREATE TABLE "wishlist_items" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- Enforce one wishlist row per user-product pair
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");

-- Optimize wishlist reads and product cleanup queries
CREATE INDEX "wishlist_items_userId_createdAt_idx" ON "wishlist_items"("userId", "createdAt" DESC);
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");

-- Keep wishlist consistent when user/product is removed
ALTER TABLE "wishlist_items"
ADD CONSTRAINT "wishlist_items_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "wishlist_items"
ADD CONSTRAINT "wishlist_items_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "products"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
