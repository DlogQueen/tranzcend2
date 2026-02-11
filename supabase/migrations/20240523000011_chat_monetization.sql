-- Chat Subscriptions and Media Unlocking

-- 1. Add 'is_subscribed' check helper (optional, can do in RLS)

-- 2. Enhance Messages table for Media
alter table messages 
add column if not exists media_url text,
add column if not exists is_locked boolean default false,
add column if not exists price float default 0.0;

-- 3. Create 'Message Unlocks' table (similar to Post Unlocks)
create table if not exists message_unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, message_id)
);

-- 4. RLS for Message Unlocks
alter table message_unlocks enable row level security;

create policy "Users can view own message unlocks" on message_unlocks 
  for select using (auth.uid() = user_id);

create policy "Users can unlock messages" on message_unlocks 
  for insert with check (auth.uid() = user_id);
