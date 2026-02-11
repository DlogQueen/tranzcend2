-- Fix Storage Policies for 'posts' bucket
-- Note: Supabase Storage policies must be set via SQL or Dashboard.
-- We'll try to insert a row into 'storage.buckets' if it doesn't exist (this sometimes requires superuser, but often works in migrations)
-- And then set policies.

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to 'posts' bucket
create policy "Authenticated users can upload posts"
on storage.objects for insert
with check (
  bucket_id = 'posts' 
  and auth.role() = 'authenticated'
);

-- Allow public to view files in 'posts' bucket
create policy "Public can view posts"
on storage.objects for select
using ( bucket_id = 'posts' );
