-- Migration 013: Add support_material_url and support_material_text to kids_schedule
ALTER TABLE "public"."kids_schedule"
ADD COLUMN "support_material_url" text,
ADD COLUMN "support_material_text" text;
