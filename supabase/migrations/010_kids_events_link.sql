-- ============================================================
-- Migration 010: Kids Check-in ↔ Events Link
-- Links check-ins and schedules to events, adds notifications
-- ============================================================

-- 1. Add event_id to kids_checkins
ALTER TABLE kids_checkins 
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kids_checkins_event ON kids_checkins(event_id);

-- 2. Add event_id to kids_schedule (replace service_date as primary link)
ALTER TABLE kids_schedule 
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kids_schedule_event ON kids_schedule(event_id);

-- Update unique constraint: from (classroom_id, service_date) to (classroom_id, event_id)
-- Drop old constraint safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'kids_schedule_classroom_id_service_date_key'
  ) THEN
    ALTER TABLE kids_schedule DROP CONSTRAINT kids_schedule_classroom_id_service_date_key;
  END IF;
END $$;

-- New unique: one schedule per classroom per event
ALTER TABLE kids_schedule 
  ADD CONSTRAINT kids_schedule_classroom_event_key UNIQUE(classroom_id, event_id);

-- Make service_date nullable (legacy, new records use event_id)
ALTER TABLE kids_schedule ALTER COLUMN service_date DROP NOT NULL;

-- 3. Create notifications table (generic, in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'general', -- 'schedule', 'checkin', 'alert', 'general'
  reference_id uuid,           -- polymorphic link to schedule, event, checkin, etc
  reference_type text,         -- 'event', 'schedule', 'checkin', 'kid'
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_church ON notifications(church_id);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark own as read" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Church staff can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    church_id IN (
      SELECT p.church_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Platform admin reads all notifications" ON notifications
  FOR SELECT USING (is_platform_admin());

-- 4. Update whatsapp_outbox trigger_event enum to accept new types
-- (whatsapp_outbox uses text, so no enum change needed — just documenting)
-- New trigger_event values: 'schedule_notification', 'schedule_reminder'

-- 5. Update events RLS: kids_team can insert events with scope='kids'
-- Current policy already allows any church member to insert. ✅
-- We need to add a policy for kids_team to update/delete their own kids-scope events.

CREATE POLICY "Kids leaders can update kids events" ON events
  FOR UPDATE USING (
    scope = 'kids' AND (
      created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM profiles p 
        LEFT JOIN church_roles cr ON cr.id = p.church_role_id
        WHERE p.id = auth.uid() 
        AND p.church_id = events.church_id
        AND (
          p.role IN ('admin', 'super_admin', 'manager', 'kids_team')
          OR cr.permissions_level IN ('admin', 'kids_leader')
        )
      )
    )
  );

CREATE POLICY "Kids leaders can delete kids events" ON events
  FOR DELETE USING (
    scope = 'kids' AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p 
        LEFT JOIN church_roles cr ON cr.id = p.church_role_id
        WHERE p.id = auth.uid() 
        AND p.church_id = events.church_id
        AND (
          p.role IN ('admin', 'super_admin', 'manager', 'kids_team')
          OR cr.permissions_level IN ('admin', 'kids_leader')
        )
      )
    )
  );

-- Done!
