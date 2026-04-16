-- =========================================================================
-- LIGARE — SUPABASE SCHEMA (MVP)
-- Multi-tenant SaaS para igrejas
-- =========================================================================

-- ========================
-- 1. CHURCHES (Tenant Base)
-- ========================
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1F6FEB',
  secondary_color TEXT DEFAULT '#18B37E',
  whatsapp_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 2. SUBSCRIPTIONS (Planos SaaS)
-- ========================
CREATE TYPE public.plan_type AS ENUM ('free', 'start', 'growth', 'pro', 'enterprise');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  plan plan_type DEFAULT 'free',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  max_members INTEGER DEFAULT 100,
  max_cells INTEGER DEFAULT 3,
  max_kids_checkins_monthly INTEGER DEFAULT 50,
  features JSONB DEFAULT '{}',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(church_id)
);

-- ========================
-- 3. PROFILES (Membros/Usuários)
-- ========================
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'leader', 'member', 'kids_team');
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'away', 'transferred', 'removed');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id),
  full_name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'member',
  role_display_name TEXT, -- Custom name (e.g., "Pastor", "Obreiro")
  is_platform_admin BOOLEAN DEFAULT false, -- Master Admin Flag
  status member_status DEFAULT 'active',
  birth_date DATE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_church ON public.profiles(church_id);
CREATE INDEX idx_profiles_leader ON public.profiles(leader_id);

-- ========================
-- 4. CELLS (Células)
-- ========================
CREATE TABLE public.cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  day_of_week TEXT,
  time TEXT,
  neighborhood TEXT,
  city TEXT,
  address TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cells_church ON public.cells(church_id);

-- ========================
-- 5. CELL MEMBERS (Membros da Célula)
-- ========================
CREATE TABLE public.cell_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cell_id, profile_id)
);

-- ========================
-- 6. KIDS (Crianças)
-- ========================
CREATE TABLE public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  allergies TEXT,
  medical_notes TEXT,
  photo_url TEXT,
  classroom TEXT, -- Sala/turma
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kids_church ON public.kids(church_id);
CREATE INDEX idx_kids_parent ON public.kids(parent_id);

-- ========================
-- 7. KIDS CHECK-INS
-- ========================
CREATE TYPE public.checkin_status AS ENUM ('checked_in', 'checked_out', 'alert_sent');

CREATE TABLE public.kids_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES public.profiles(id),
  checked_out_by UUID REFERENCES public.profiles(id),
  classroom TEXT,
  status checkin_status DEFAULT 'checked_in',
  checkin_time TIMESTAMPTZ DEFAULT now(),
  checkout_time TIMESTAMPTZ,
  alert_sent_at TIMESTAMPTZ,
  notes TEXT,
  service_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_kids_checkins_kid ON public.kids_checkins(kid_id);
CREATE INDEX idx_kids_checkins_date ON public.kids_checkins(service_date);
CREATE INDEX idx_kids_checkins_church ON public.kids_checkins(church_id);

-- ========================
-- 8. PRESENCE LOGS (Motor Híbrido)
-- ========================
CREATE TYPE public.presence_source AS ENUM ('explicit', 'kids', 'qr', 'leader_validation', 'visitor_form');
CREATE TYPE public.presence_level AS ENUM ('confirmed', 'probable', 'unconfirmed');

CREATE TABLE public.presence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_name TEXT, -- For guests without account
  visitor_whatsapp TEXT,
  source presence_source NOT NULL,
  level presence_level DEFAULT 'confirmed',
  service_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_presence_church_date ON public.presence_logs(church_id, service_date);

-- ========================
-- 9. CONTRIBUTIONS (Contribuições)
-- ========================
CREATE TYPE public.contribution_type AS ENUM ('tithe', 'offering', 'campaign', 'project');
CREATE TYPE public.contribution_status AS ENUM ('registered', 'confirmed');

CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type contribution_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  status contribution_status DEFAULT 'registered',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contributions_user ON public.contributions(user_id);

-- ========================
-- 10. FOLLOW-UP EVENTS
-- ========================
CREATE TYPE public.followup_type AS ENUM ('visitor', 'new_member', 'absent', 'inactive', 'prayer_request');
CREATE TYPE public.followup_status AS ENUM ('pending', 'contacted', 'awaiting_reply', 'replied', 'closed', 'escalated');

CREATE TABLE public.followup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id),
  target_id UUID REFERENCES public.profiles(id),
  target_name TEXT, -- For visitors without an account
  target_whatsapp TEXT,
  type followup_type NOT NULL,
  status followup_status DEFAULT 'pending',
  template_used TEXT, -- Which message template was sent
  last_action_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_followup_church ON public.followup_events(church_id);
CREATE INDEX idx_followup_leader ON public.followup_events(leader_id);
CREATE INDEX idx_followup_status ON public.followup_events(status);

-- ========================
-- 11. EVENTS (Eventos)
-- ========================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_church ON public.events(church_id);

-- ========================
-- 12. PRAYER REQUESTS
-- ========================
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  requester_name TEXT,
  requester_whatsapp TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 13. ANNOUNCEMENTS (Mural de Avisos)
-- ========================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- ROW LEVEL SECURITY (RLS)
-- ========================

-- Helper para identificar Master Admin
CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_platform_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read profiles from their own church
CREATE POLICY "Users can view own church profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_platform_admin() OR
    church_id IN (
      SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Kids: parents can see their own kids; kids_team can see all church kids
CREATE POLICY "Parents can view own kids"
  ON public.kids FOR SELECT
  USING (
    parent_id = auth.uid()
    OR church_id IN (
      SELECT p.church_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager', 'kids_team')
    )
  );

-- Kids Check-ins: kids_team, admin can manage
CREATE POLICY "Kids team can manage checkins"
  ON public.kids_checkins FOR ALL
  USING (
    church_id IN (
      SELECT p.church_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager', 'kids_team')
    )
  );

-- Cells: visible to same church members
CREATE POLICY "Church members can view cells"
  ON public.cells FOR SELECT
  USING (church_id IN (
    SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()
  ));

-- Contributions: users see only their own
CREATE POLICY "Users can view own contributions"
  ON public.contributions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Follow-up: leaders see their assigned ones; admins see all
CREATE POLICY "Leaders can view own followups"
  ON public.followup_events FOR SELECT
  USING (
    leader_id = auth.uid()
    OR church_id IN (
      SELECT p.church_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Events: public events visible to all; private to church members
CREATE POLICY "Public events visible to all"
  ON public.events FOR SELECT
  USING (is_public = true OR church_id IN (
    SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()
  ));

-- Announcements: visible to church members
CREATE POLICY "Church members can view announcements"
  ON public.announcements FOR SELECT
  USING (church_id IN (
    SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()
  ));

-- Churches: public read for hub
CREATE POLICY "Churches are publicly readable"
  ON public.churches FOR SELECT
  USING (true);

-- Subscriptions: admins only
CREATE POLICY "Admins can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (church_id IN (
    SELECT p.church_id FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  ));

-- Prayer Requests: church members
CREATE POLICY "Church prayer requests"
  ON public.prayer_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR church_id IN (
      SELECT p.church_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager', 'leader')
    )
  );

CREATE POLICY "Anyone can create prayer request"
  ON public.prayer_requests FOR INSERT
  WITH CHECK (true);

-- Master Admin Policies (Acesso global de leitura a todas as tabelas)
CREATE POLICY "Master admins can read all churches" ON public.churches FOR ALL USING (public.is_platform_admin());
CREATE POLICY "Master admins can read all subscriptions" ON public.subscriptions FOR ALL USING (public.is_platform_admin());
CREATE POLICY "Master admins can read all Kids" ON public.kids FOR ALL USING (public.is_platform_admin());

-- ========================
-- RPC: Onboarding de nova Igreja
-- ========================
CREATE OR REPLACE FUNCTION public.create_new_tenant(
  church_name TEXT,
  subdomain TEXT,
  user_id UUID,
  full_name TEXT,
  email TEXT
) RETURNS jsonb AS $$
DECLARE
  new_church_id UUID;
BEGIN
  -- 1. Create Church
  INSERT INTO public.churches (name, subdomain)
  VALUES (church_name, subdomain)
  RETURNING id INTO new_church_id;

  -- 2. Create Subscription (Trial de 14 dias)
  INSERT INTO public.subscriptions (church_id, plan, status, expires_at)
  VALUES (new_church_id, 'start', 'trial', now() + interval '14 days');

  -- 3. Create Admin Profile
  INSERT INTO public.profiles (id, church_id, full_name, email, role)
  VALUES (user_id, new_church_id, full_name, email, 'super_admin');

  RETURN jsonb_build_object('church_id', new_church_id, 'status', 'success');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
