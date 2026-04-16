-- =========================================================================
-- 010_kids_checkin_and_whatsapp_engine.sql
-- Add image right check and whatsapp outbox engine
-- =========================================================================

-- ========================
-- 1. KIDS_IMAGE_RIGHTS
-- ========================
ALTER TABLE public.kids
  ADD COLUMN IF NOT EXISTS image_rights_granted BOOLEAN DEFAULT false;

-- ========================
-- 2. WHATSAPP_OUTBOX
-- ========================
CREATE TYPE public.whatsapp_message_status AS ENUM ('pending', 'processing', 'sent', 'failed');

CREATE TABLE IF NOT EXISTS public.whatsapp_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  trigger_event TEXT NOT NULL, -- e.g., 'kids_registration', 'visitor_welcome'
  payload JSONB DEFAULT '{}', -- Allows storing dynamic template data (like names, QR codes, links)
  status whatsapp_message_status DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_church ON public.whatsapp_outbox(church_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status ON public.whatsapp_outbox(status);

-- ========================
-- 3. RLS - WHATSAPP_OUTBOX
-- ========================
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and Leaders from the same church can insert messages, and read them. 
-- In practice, mostly inserted by Server Actions bypassing RLS or by authenticated users.
CREATE POLICY "Admins and Leaders manage whatsapp outbox" ON public.whatsapp_outbox
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = whatsapp_outbox.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Platform admin reads all whatsapp outbox" ON public.whatsapp_outbox 
  FOR SELECT USING (is_platform_admin());

-- Notify realtime (optional but useful if a future listener wants to process the outbox)
-- This allows a Node.js worker/listener to process row inserts if needed.
-- (Leaving it simple for now)
