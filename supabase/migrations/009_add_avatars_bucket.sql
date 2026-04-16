-- 1. Create columns in tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.church_members ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up access policies for the avatars bucket
-- Allow public read access to all avatars
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars or admins to upload members' avatars
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update avatars
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Allow admins to delete avatars
CREATE POLICY "Users can delete avatars" ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);
