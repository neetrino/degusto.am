CREATE TYPE "public"."product_modifier_kind" AS ENUM('ADDITION', 'EXCLUSION');--> statement-breakpoint
CREATE TABLE "product_modifiers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"kind" "product_modifier_kind" NOT NULL,
	"label" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_modifiers_label_nonempty_chk" CHECK (char_length(btrim("product_modifiers"."label")) > 0)
);
--> statement-breakpoint
ALTER TABLE "product_modifiers" ADD CONSTRAINT "product_modifiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_modifiers_product_kind_idx" ON "product_modifiers" USING btree ("product_id","kind","sort_order");