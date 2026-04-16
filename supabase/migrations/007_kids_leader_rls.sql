-- 007_kids_leader_rls.sql
-- Update Row Level Security (RLS) for Kids and Checkins to recognize the custom 'kids_leader' permission level.

-- 1. Update public.kids SELECT policy
DROP POLICY IF EXISTS "Parents can view own kids" ON public.kids;
DROP POLICY IF EXISTS "Parents and Kids Leaders can view kids" ON public.kids;

CREATE POLICY "Parents and Kids Leaders can view kids"
  ON public.kids FOR SELECT
  USING (
    parent_id = auth.uid()
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

-- 2. Update public.kids ALL policy for management (if any exist)
-- Let's just create an ALL policy for Admins and Kids Leaders to insert/update kids
DROP POLICY IF EXISTS "Admins and Kids Leaders can manage kids" ON public.kids;

CREATE POLICY "Admins and Kids Leaders can manage kids"
  ON public.kids FOR ALL
  USING (
    EXISTS (
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

-- 3. Update public.kids_checkins ALL policy
DROP POLICY IF EXISTS "Kids team can manage checkins" ON public.kids_checkins;
DROP POLICY IF EXISTS "Kids team and Kids Leaders can manage checkins" ON public.kids_checkins;

CREATE POLICY "Kids team and Kids Leaders can manage checkins"
  ON public.kids_checkins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN church_roles cr ON cr.id = p.church_role_id
      WHERE p.id = auth.uid() 
      AND p.church_id = kids_checkins.church_id
      AND (
        p.role IN ('admin', 'super_admin', 'manager', 'kids_team') 
        OR cr.permissions_level IN ('admin', 'kids_leader')
      )
    )
  );
