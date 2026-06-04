-- Persist product compare lists in the database (guest session or authenticated user).
CREATE TABLE "compare_items" (
  "id" TEXT NOT NULL,
  "ownerKey" TEXT NOT NULL,
  "userId" TEXT,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "compare_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compare_items_ownerKey_productId_key" ON "compare_items"("ownerKey", "productId");
CREATE INDEX "compare_items_ownerKey_createdAt_idx" ON "compare_items"("ownerKey", "createdAt" DESC);
CREATE INDEX "compare_items_productId_idx" ON "compare_items"("productId");

ALTER TABLE "compare_items"
ADD CONSTRAINT "compare_items_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "compare_items"
ADD CONSTRAINT "compare_items_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "products"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
