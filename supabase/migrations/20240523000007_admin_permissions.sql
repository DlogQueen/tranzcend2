-- Admin Roles and Permissions

-- 1. Add Admin flag to profiles
alter table profiles 
add column if not exists is_admin boolean default false;

-- 2. Update RLS for Verification Requests to allow Admins to manage them
-- Drop old policies to avoid conflicts if we redefine them strictly
drop policy if exists "Users can view own verification requests" on verification_requests;
drop policy if exists "Users can submit verification" on verification_requests;

-- Re-create user policies
create policy "Users can view own verification requests" on verification_requests
  for select using (auth.uid() = user_id);

create policy "Users can submit verification" on verification_requests
  for insert with check (auth.uid() = user_id);

-- Admin policies
-- Admins can view ALL requests
create policy "Admins can view all verification requests" on verification_requests
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Admins can update requests (to approve/reject)
create policy "Admins can update verification requests" on verification_requests
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );
