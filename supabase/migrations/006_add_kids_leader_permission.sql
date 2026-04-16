-- 006_add_kids_leader_permission.sql
-- Add 'kids_leader' to the available permissions paths for custom church roles

-- Drop the old constraint
ALTER TABLE public.church_roles DROP CONSTRAINT IF EXISTS church_roles_permissions_level_check;

-- Create the new constraint including 'kids_leader'
ALTER TABLE public.church_roles ADD CONSTRAINT church_roles_permissions_level_check 
CHECK (permissions_level IN ('admin', 'leader', 'member', 'kids_leader'));

-- Add a comment for documentation
COMMENT ON COLUMN public.church_roles.permissions_level IS 'Defines the system-level visibility. kids_leader sees all kids, leader sees direct cells/disciples.';
