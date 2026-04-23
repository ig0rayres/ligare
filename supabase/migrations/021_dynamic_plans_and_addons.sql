-- ============================================================
-- Migration 021: Dynamic Plans, Addons & Tenant Instances
-- ============================================================

-- ─── 1. platform_plans ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  description           TEXT,
  asaas_plan_id         TEXT,                        -- Asaas subscription plan ref
  monthly_price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_quarterly    INT NOT NULL DEFAULT 0,      -- % discount for 3mo billing
  discount_semiannual   INT NOT NULL DEFAULT 0,      -- % discount for 6mo billing
  discount_annual       INT NOT NULL DEFAULT 0,      -- % discount for 12mo billing
  trial_days            INT NOT NULL DEFAULT 7,
  grace_period_days     INT NOT NULL DEFAULT 3,
  allow_trial_upgrades  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. platform_addons ──────────────────────────────────────
CREATE TYPE IF NOT EXISTS public.addon_type AS ENUM ('feature_toggle', 'volume_limit');

CREATE TABLE IF NOT EXISTS public.platform_addons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,               -- ex: 'whatsapp_channel', 'members'
  description    TEXT,
  type           public.addon_type NOT NULL DEFAULT 'volume_limit',
  monthly_price  NUMERIC(10,2) NOT NULL DEFAULT 0,   -- price per unit/instance
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. plans_addons_link (N:N Buffet Composition) ───────────
-- included_quantity: -1 = unlimited, 0 = not included, N = fixed quota
CREATE TABLE IF NOT EXISTS public.plans_addons_link (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             UUID NOT NULL REFERENCES public.platform_plans(id) ON DELETE CASCADE,
  addon_id            UUID NOT NULL REFERENCES public.platform_addons(id) ON DELETE CASCADE,
  included_quantity   INT NOT NULL DEFAULT 0,         -- -1 unlimited, 0 not included, N = quota
  UNIQUE(plan_id, addon_id)
);

-- ─── 4. tenant_addons (Active Addon Instances per Church) ────
-- Tracks every individually contracted addon instance per church
CREATE TABLE IF NOT EXISTS public.tenant_addons (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id              UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  addon_id               UUID NOT NULL REFERENCES public.platform_addons(id),
  quantity               INT NOT NULL DEFAULT 1,      -- number of purchased instances
  asaas_subscription_id  TEXT,                        -- recurring charge ref in Asaas
  active                 BOOLEAN NOT NULL DEFAULT TRUE,
  activated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. Migrate subscriptions to reference platform_plans ────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.platform_plans(id);

-- ─── 6. RLS Policies ─────────────────────────────────────────
ALTER TABLE public.platform_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_addons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_addons_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_addons    ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read plans/addons (for upsell UI)
CREATE POLICY "plans_read_all" ON public.platform_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "addons_read_all" ON public.platform_addons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "plans_addons_link_read_all" ON public.plans_addons_link
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only platform admins can write plans/addons
CREATE POLICY "plans_admin_write" ON public.platform_plans
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "addons_admin_write" ON public.platform_addons
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "plans_addons_link_admin_write" ON public.plans_addons_link
  FOR ALL USING (public.is_platform_admin());

-- Tenant addons: church members can read their own; admins can write
CREATE POLICY "tenant_addons_read_own" ON public.tenant_addons
  FOR SELECT USING (
    church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY "tenant_addons_admin_write" ON public.tenant_addons
  FOR ALL USING (public.is_platform_admin());

-- ─── 7. Seed: platform_addons catalog ────────────────────────
INSERT INTO public.platform_addons (name, slug, description, type, monthly_price, sort_order) VALUES
  ('Membros',               'members',            'Quantidade de membros cadastrados',                       'volume_limit',   0.00, 1),
  ('Crianças (Kids)',       'kids',               'Quantidade de crianças no módulo Kids',                   'volume_limit',   0.00, 2),
  ('Visitantes',            'visitors',           'Quantidade de visitantes cadastrados',                    'volume_limit',   0.00, 3),
  ('Células',               'cells',              'Quantidade de células/grupos ativas',                     'volume_limit',   0.00, 4),
  ('Usuários (Roles)',      'users',              'Quantidade de contas de usuário criadas (qualquer role)', 'volume_limit',   0.00, 5),
  ('Eventos por mês',       'events_monthly',     'Quantidade de cultos/eventos registrados por mês',       'volume_limit',   0.00, 6),
  ('Disparos de notificação','notifications',     'Envios de push/whatsapp por mês',                        'volume_limit',   0.00, 7),
  ('Canal WhatsApp',        'whatsapp_channel',   'Número WhatsApp oficial conectado via WAHA',             'volume_limit',  79.90, 8),
  ('Canal Instagram',       'instagram_channel',  'Integração com DMs do Instagram',                        'volume_limit',  49.90, 9),
  ('Widget de Site',        'website_widget',     'Widget de captação embedável em sites externos',         'feature_toggle', 29.90,10)
ON CONFLICT (slug) DO NOTHING;

-- ─── 8. Seed: platform_plans ─────────────────────────────────
INSERT INTO public.platform_plans (name, description, monthly_price, discount_quarterly, discount_semiannual, discount_annual, trial_days, grace_period_days, allow_trial_upgrades, sort_order) VALUES
  ('Ligare Free',       'Plano gratuito para igrejas pequeninhas começarem',        0.00,  0, 0, 0, 0, 0, FALSE, 1),
  ('Ligare Start',      'Ideal para igrejas em crescimento',                        97.00, 10, 15, 20, 7, 3, FALSE, 2),
  ('Ligare Pro',        'Para igrejas com múltiplas células e equipes',            197.00, 10, 15, 20, 7, 3, TRUE,  3),
  ('Ligare Enterprise', 'Uso ilimitado e suporte prioritário para grandes igrejas',497.00, 10, 20, 30, 7, 3, TRUE,  4)
ON CONFLICT DO NOTHING;

-- ─── 9. Seed: plans_addons_link (Buffet composition) ─────────
-- We use sub-selects to be ID-agnostic
DO $$
DECLARE
  plan_free       UUID := (SELECT id FROM public.platform_plans WHERE name = 'Ligare Free');
  plan_start      UUID := (SELECT id FROM public.platform_plans WHERE name = 'Ligare Start');
  plan_pro        UUID := (SELECT id FROM public.platform_plans WHERE name = 'Ligare Pro');
  plan_enterprise UUID := (SELECT id FROM public.platform_plans WHERE name = 'Ligare Enterprise');

  a_members       UUID := (SELECT id FROM public.platform_addons WHERE slug = 'members');
  a_kids          UUID := (SELECT id FROM public.platform_addons WHERE slug = 'kids');
  a_visitors      UUID := (SELECT id FROM public.platform_addons WHERE slug = 'visitors');
  a_cells         UUID := (SELECT id FROM public.platform_addons WHERE slug = 'cells');
  a_users         UUID := (SELECT id FROM public.platform_addons WHERE slug = 'users');
  a_events        UUID := (SELECT id FROM public.platform_addons WHERE slug = 'events_monthly');
  a_notif         UUID := (SELECT id FROM public.platform_addons WHERE slug = 'notifications');
  a_wpp           UUID := (SELECT id FROM public.platform_addons WHERE slug = 'whatsapp_channel');
  a_insta         UUID := (SELECT id FROM public.platform_addons WHERE slug = 'instagram_channel');
  a_widget        UUID := (SELECT id FROM public.platform_addons WHERE slug = 'website_widget');
BEGIN
  -- FREE plan: very limited
  INSERT INTO public.plans_addons_link (plan_id, addon_id, included_quantity) VALUES
    (plan_free, a_members,   50),
    (plan_free, a_kids,      20),
    (plan_free, a_visitors,  20),
    (plan_free, a_cells,      1),
    (plan_free, a_users,      2),
    (plan_free, a_events,     4),
    (plan_free, a_notif,    100),
    (plan_free, a_wpp,        0),
    (plan_free, a_insta,      0),
    (plan_free, a_widget,     0)
  ON CONFLICT (plan_id, addon_id) DO NOTHING;

  -- START plan
  INSERT INTO public.plans_addons_link (plan_id, addon_id, included_quantity) VALUES
    (plan_start, a_members,   200),
    (plan_start, a_kids,      100),
    (plan_start, a_visitors,  100),
    (plan_start, a_cells,       5),
    (plan_start, a_users,       5),
    (plan_start, a_events,     12),
    (plan_start, a_notif,    1000),
    (plan_start, a_wpp,         0),  -- must purchase addon
    (plan_start, a_insta,       0),
    (plan_start, a_widget,      0)
  ON CONFLICT (plan_id, addon_id) DO NOTHING;

  -- PRO plan
  INSERT INTO public.plans_addons_link (plan_id, addon_id, included_quantity) VALUES
    (plan_pro, a_members,  1000),
    (plan_pro, a_kids,      500),
    (plan_pro, a_visitors,  500),
    (plan_pro, a_cells,      20),
    (plan_pro, a_users,      15),
    (plan_pro, a_events,     -1),   -- unlimited events
    (plan_pro, a_notif,    5000),
    (plan_pro, a_wpp,         1),   -- 1 WhatsApp included
    (plan_pro, a_insta,       0),
    (plan_pro, a_widget,      0)
  ON CONFLICT (plan_id, addon_id) DO NOTHING;

  -- ENTERPRISE plan: everything unlimited
  INSERT INTO public.plans_addons_link (plan_id, addon_id, included_quantity) VALUES
    (plan_enterprise, a_members,  -1),
    (plan_enterprise, a_kids,     -1),
    (plan_enterprise, a_visitors, -1),
    (plan_enterprise, a_cells,    -1),
    (plan_enterprise, a_users,    -1),
    (plan_enterprise, a_events,   -1),
    (plan_enterprise, a_notif,    -1),
    (plan_enterprise, a_wpp,       2),  -- 2 WhatsApp channels included
    (plan_enterprise, a_insta,     1),  -- 1 Instagram included
    (plan_enterprise, a_widget,    1)   -- 1 Widget included
  ON CONFLICT (plan_id, addon_id) DO NOTHING;
END;
$$;
