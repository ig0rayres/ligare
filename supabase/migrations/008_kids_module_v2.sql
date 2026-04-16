-- =========================================================================
-- 008_kids_module_v2.sql
-- Module Kids V2: Classrooms, Guardians, Schedules, Alerts, Invite Links
-- =========================================================================

-- ========================
-- 1. KIDS_CLASSROOMS (Salas fixas por igreja)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kids_classrooms_church ON public.kids_classrooms(church_id);

-- ========================
-- 2. MODIFY KIDS TABLE
-- ========================

-- Add new columns first
ALTER TABLE public.kids
  ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.kids_classrooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_kids_classroom ON public.kids(classroom_id);

-- Drop old columns (parent_id and classroom TEXT)
-- First, drop the foreign key constraint and index on parent_id
ALTER TABLE public.kids DROP CONSTRAINT IF EXISTS kids_parent_id_fkey;
DROP INDEX IF EXISTS idx_kids_parent;
ALTER TABLE public.kids DROP COLUMN IF EXISTS parent_id;
ALTER TABLE public.kids DROP COLUMN IF EXISTS classroom;

-- ========================
-- 3. KIDS_GUARDIANS (Até 4 responsáveis por criança)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL, -- 'Pai', 'Mãe', 'Avó', 'Tio(a)', etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kid_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_kids_guardians_kid ON public.kids_guardians(kid_id);
CREATE INDEX IF NOT EXISTS idx_kids_guardians_guardian ON public.kids_guardians(guardian_id);

-- Constraint: max 4 guardians per kid (via trigger)
CREATE OR REPLACE FUNCTION public.check_max_guardians()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.kids_guardians WHERE kid_id = NEW.kid_id) >= 4 THEN
    RAISE EXCEPTION 'Maximum of 4 guardians per child reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_guardians ON public.kids_guardians;
CREATE TRIGGER trg_check_max_guardians
  BEFORE INSERT ON public.kids_guardians
  FOR EACH ROW EXECUTE FUNCTION public.check_max_guardians();

-- ========================
-- 4. MODIFY KIDS_CHECKINS
-- ========================
ALTER TABLE public.kids_checkins
  ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS qr_code_used TEXT,
  ADD COLUMN IF NOT EXISTS checkout_note TEXT;

-- ========================
-- 5. KIDS_SCHEDULE (Escala por culto + sala)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.kids_classrooms(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(classroom_id, service_date)
);

CREATE INDEX IF NOT EXISTS idx_kids_schedule_church ON public.kids_schedule(church_id);
CREATE INDEX IF NOT EXISTS idx_kids_schedule_date ON public.kids_schedule(service_date);

-- ========================
-- 6. KIDS_SCHEDULE_STAFF (Voluntários escalados)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_schedule_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.kids_schedule(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('kids_leader', 'auxiliar')),
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_kids_schedule_staff_schedule ON public.kids_schedule_staff(schedule_id);
CREATE INDEX IF NOT EXISTS idx_kids_schedule_staff_profile ON public.kids_schedule_staff(profile_id);

-- ========================
-- 7. KIDS_ALERTS (Histórico de chamadas)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES public.kids_checkins(id) ON DELETE SET NULL,
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.profiles(id),
  sent_via TEXT NOT NULL CHECK (sent_via IN ('whatsapp', 'push', 'both')),
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kids_alerts_kid ON public.kids_alerts(kid_id);
CREATE INDEX IF NOT EXISTS idx_kids_alerts_church ON public.kids_alerts(church_id);

-- ========================
-- 8. KIDS_INVITE_LINKS (Links de cadastro)
-- ========================
CREATE TABLE IF NOT EXISTS public.kids_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  used_by UUID REFERENCES public.profiles(id),
  kid_id UUID REFERENCES public.kids(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kids_invite_token ON public.kids_invite_links(token);

-- ========================
-- 9. RLS — Enable on all new tables
-- ========================
ALTER TABLE public.kids_classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_schedule_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_invite_links ENABLE ROW LEVEL SECURITY;

-- ========================
-- 10. RLS POLICIES
-- ========================

-- Helper: check if user is kids_leader in their church
-- (reuses church_roles.permissions_level logic from migration 007)

-- kids_classrooms: admins + kids_leaders manage; church members view
CREATE POLICY "Admins and Kids Leaders manage classrooms" ON public.kids_classrooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = kids_classrooms.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Church members view classrooms" ON public.kids_classrooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.church_id = kids_classrooms.church_id
    )
  );

-- kids_guardians: admins + kids_leaders manage; guardians view own
CREATE POLICY "Admins and Kids Leaders manage guardians" ON public.kids_guardians
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      LEFT JOIN kids k ON k.id = kids_guardians.kid_id
      WHERE p.id = auth.uid()
      AND p.church_id = k.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Guardians view own links" ON public.kids_guardians
  FOR SELECT USING (guardian_id = auth.uid());

-- kids_schedule: admins + kids_leaders manage; church members view
CREATE POLICY "Admins and Kids Leaders manage schedules" ON public.kids_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = kids_schedule.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Church members view schedules" ON public.kids_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.church_id = kids_schedule.church_id
    )
  );

-- kids_schedule_staff: admins + kids_leaders manage; staff view own
CREATE POLICY "Admins and Kids Leaders manage schedule staff" ON public.kids_schedule_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      LEFT JOIN kids_schedule ks ON ks.id = kids_schedule_staff.schedule_id
      WHERE p.id = auth.uid()
      AND p.church_id = ks.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Staff view own assignments" ON public.kids_schedule_staff
  FOR SELECT USING (profile_id = auth.uid());

-- kids_alerts: admins + kids_leaders manage; guardians view own
CREATE POLICY "Admins and Kids Leaders manage alerts" ON public.kids_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = kids_alerts.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Guardians view own alerts" ON public.kids_alerts
  FOR SELECT USING (guardian_id = auth.uid());

-- kids_invite_links: kids_leaders manage; used_by can view own
CREATE POLICY "Kids Leaders manage invite links" ON public.kids_invite_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = kids_invite_links.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );

CREATE POLICY "Users view own invite links" ON public.kids_invite_links
  FOR SELECT USING (used_by = auth.uid() OR created_by = auth.uid());

-- Platform admin: global read on all new tables
CREATE POLICY "Platform admin reads classrooms" ON public.kids_classrooms FOR SELECT USING (is_platform_admin());
CREATE POLICY "Platform admin reads guardians" ON public.kids_guardians FOR SELECT USING (is_platform_admin());
CREATE POLICY "Platform admin reads schedules" ON public.kids_schedule FOR SELECT USING (is_platform_admin());
CREATE POLICY "Platform admin reads schedule staff" ON public.kids_schedule_staff FOR SELECT USING (is_platform_admin());
CREATE POLICY "Platform admin reads alerts" ON public.kids_alerts FOR SELECT USING (is_platform_admin());
CREATE POLICY "Platform admin reads invite links" ON public.kids_invite_links FOR SELECT USING (is_platform_admin());

-- ========================
-- 11. Update kids RLS to use kids_guardians instead of parent_id
-- ========================
DROP POLICY IF EXISTS "Parents and Kids Leaders can view kids" ON public.kids;

CREATE POLICY "Guardians and Kids Leaders can view kids" ON public.kids
  FOR SELECT USING (
    -- Guardian can see their own kids
    EXISTS (
      SELECT 1 FROM kids_guardians kg
      WHERE kg.kid_id = kids.id AND kg.guardian_id = auth.uid()
    )
    -- Or admin/kids_leader in same church
    OR EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid()
      AND p.church_id = kids.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager', 'kids_team')
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );
