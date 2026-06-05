-- CreateTable
CREATE TABLE "order_number_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "value" INTEGER NOT NULL,

    CONSTRAINT "order_number_counter_pkey" PRIMARY KEY ("id")
);

-- Renumber existing orders chronologically starting at 1000
WITH "numbered" AS (
    SELECT
        "id",
        (ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) + 999)::TEXT AS "new_number"
    FROM "orders"
)
UPDATE "orders" AS "o"
SET "number" = "n"."new_number"
FROM "numbered" AS "n"
WHERE "o"."id" = "n"."id";

-- Seed counter so the next allocated number follows the highest existing order
INSERT INTO "order_number_counter" ("id", "value")
SELECT
    1,
    GREATEST(
        999,
        COALESCE((SELECT MAX("number"::INTEGER) FROM "orders"), 999)
    );
