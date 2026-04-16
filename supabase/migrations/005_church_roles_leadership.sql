-- 005_church_roles_leadership.sql
-- Migration for Phase 1: Custom Roles and Leadership History

-- 1. Create church_roles table
CREATE TABLE IF NOT EXISTS public.church_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions_level TEXT NOT NULL CHECK (permissions_level IN ('admin', 'leader', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching roles by church
CREATE INDEX IF NOT EXISTS idx_church_roles_church_id ON public.church_roles(church_id);

-- 2. Add church_role_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS church_role_id UUID REFERENCES public.church_roles(id) ON DELETE SET NULL;

-- Index for querying profiles by role
CREATE INDEX IF NOT EXISTS idx_profiles_church_role_id ON public.profiles(church_role_id);

-- 3. Create leadership_assignments (History log for Chat filtering)
CREATE TABLE IF NOT EXISTS public.leadership_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    unassigned_at TIMESTAMP WITH TIME ZONE, -- null means it's the active assignment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance (often queried for the chat RLS policy)
CREATE INDEX IF NOT EXISTS idx_leadership_member ON public.leadership_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_leadership_leader ON public.leadership_assignments(leader_id);

-- 4. Enable RLS
ALTER TABLE public.church_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_assignments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for church_roles
CREATE POLICY "Admins can manage church_roles" ON public.church_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = church_roles.church_id
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Anyone in church can view roles" ON public.church_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = church_roles.church_id
        )
    );

-- 6. RLS Policies for leadership_assignments
CREATE POLICY "Admins can manage leadership assignments" ON public.leadership_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = leadership_assignments.church_id
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Leaders can view their assignments" ON public.leadership_assignments
    FOR SELECT USING (
        leader_id = auth.uid()
    );

CREATE POLICY "Members can view their assignments" ON public.leadership_assignments
    FOR SELECT USING (
        member_id = auth.uid()
    );
