-- Add Security and Verification features

-- 1. Create Unlocks table to track purchased content
create table if not exists unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- 2. Add Verification and Privacy fields to Profiles
alter table profiles 
add column if not exists is_verified boolean default false,
add column if not exists ghost_mode boolean default false;

-- 3. Update RLS for Unlocks
alter table unlocks enable row level security;

create policy "Users can view their own unlocks" on unlocks 
  for select using (auth.uid() = user_id);

create policy "Users can unlock content" on unlocks 
  for insert with check (auth.uid() = user_id);

-- 4. Secure Posts Access (Refining the previous broad policy)
-- First, drop the old policy if it exists (handling idempotent runs)
drop policy if exists "Public posts are viewable by everyone" on posts;

-- Create new policy: 
-- Visible if:
-- 1. Post is NOT locked
-- 2. OR User is the owner
-- 3. OR User has unlocked the post
create policy "Posts visibility policy" on posts for select using (
  is_locked = false 
  or 
  auth.uid() = user_id 
  or 
  exists (
    select 1 from unlocks 
    where unlocks.post_id = posts.id 
    and unlocks.user_id = auth.uid()
  )
);
