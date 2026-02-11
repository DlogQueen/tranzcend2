-- Model Verification & Approval Workflow

-- 1. Create a table for Verification Requests
create table if not exists verification_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  full_legal_name text not null,
  id_document_url text not null, -- URL to the uploaded ID image in Supabase Storage
  selfie_with_id_url text not null, -- URL to the selfie verification
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create Storage Bucket for Sensitive Verification Docs (Private)
-- Note: Storage buckets are usually created via API/Dashboard, but we can set policies here if the bucket exists.
-- We will assume a bucket named 'verification_docs' will be created.

-- 3. RLS
alter table verification_requests enable row level security;

-- Users can view their own requests
create policy "Users can view own verification requests" on verification_requests
  for select using (auth.uid() = user_id);

-- Users can create a request
create policy "Users can submit verification" on verification_requests
  for insert with check (auth.uid() = user_id);

-- Only admins can update status (Simulated via a specific user ID or role for now, 
-- or we just leave it open for 'service_role' and restricted for users)
-- For this MVP, we won't add an explicit 'admin' role check in SQL to avoid complexity,
-- but users won't have an UPDATE policy, effectively locking it.
