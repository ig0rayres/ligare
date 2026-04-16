-- 011_kids_consent_status.sql
-- Replace the basic boolean with advanced hybrid consent status mechanics

ALTER TABLE public.kids DROP COLUMN image_rights_granted;

ALTER TABLE public.kids ADD COLUMN image_rights_status TEXT DEFAULT 'pending';
ALTER TABLE public.kids ADD COLUMN image_rights_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.kids ADD COLUMN image_rights_ip TEXT;
ALTER TABLE public.kids ADD COLUMN image_rights_token TEXT;

ALTER TABLE public.kids ADD CONSTRAINT kids_image_rights_status_check
  CHECK (image_rights_status IN ('pending', 'approved_physical', 'approved_digital', 'denied'));
