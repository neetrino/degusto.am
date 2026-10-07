ALTER TABLE "orders" ADD COLUMN "delivery_timing_mode" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_slot_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_slot_end_at" timestamp with time zone;