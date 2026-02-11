-- Force Recreation of Media Bucket and Policies
-- We will drop the policies first to ensure a clean slate, then recreate them.

-- 1. Drop existing policies (ignore errors if they don't exist)
drop policy if exists "Authenticated users can upload media" on storage.objects;
drop policy if exists "Public can view media" on storage.objects;
drop policy if exists "Users can update own media" on storage.objects;
drop policy if exists "Users can delete own media" on storage.objects;

-- 2. Ensure Bucket Exists
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- 3. Create permissive policies for 'media' bucket
create policy "Authenticated users can upload media"
on storage.objects for insert
with check (
  bucket_id = 'media' 
  and auth.role() = 'authenticated'
);

create policy "Public can view media"
on storage.objects for select
using ( bucket_id = 'media' );

create policy "Users can update own media"
on storage.objects for update
using (
  bucket_id = 'media' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own media"
on storage.objects for delete
using (
  bucket_id = 'media' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
