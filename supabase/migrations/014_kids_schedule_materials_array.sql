ALTER TABLE "public"."kids_schedule" 
ADD COLUMN "support_materials" jsonb DEFAULT '[]'::jsonb;

UPDATE "public"."kids_schedule" 
SET "support_materials" = jsonb_build_array("support_material_url")
WHERE "support_material_url" IS NOT NULL;

ALTER TABLE "public"."kids_schedule" DROP COLUMN "support_material_url";
