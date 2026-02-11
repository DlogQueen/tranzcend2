-- Full Profile Experience Upgrade

-- 1. Add Rich Profile Fields
alter table profiles 
add column if not exists banner_url text,
add column if not exists website text,
add column if not exists tags text[] default '{}',
add column if not exists location_name text; -- e.g. "Los Angeles, CA" (User entered or reverse geocoded)

-- 2. Create Subscriptions / Follows Table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  subscriber_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(subscriber_id, creator_id) -- Prevent duplicate follows
);

-- 3. RLS for Subscriptions
alter table subscriptions enable row level security;

create policy "Public subscriptions view" on subscriptions 
  for select using (true);

create policy "Users can subscribe" on subscriptions 
  for insert with check (auth.uid() = subscriber_id);

create policy "Users can unsubscribe" on subscriptions 
  for delete using (auth.uid() = subscriber_id);
