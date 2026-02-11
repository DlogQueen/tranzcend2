-- Ensure 'media' bucket exists for Avatars and Banners
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to 'media' bucket
create policy "Authenticated users can upload media"
on storage.objects for insert
with check (
  bucket_id = 'media' 
  and auth.role() = 'authenticated'
);

-- Allow public to view files in 'media' bucket
create policy "Public can view media"
on storage.objects for select
using ( bucket_id = 'media' );

-- Also ensure users can update their own profile (re-affirming just in case)
-- (Existing policy should cover this, but being safe)
-- create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
