-- Enable PostGIS for location queries
create extension if not exists postgis;

-- Profiles Table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  bio text,
  avatar_url text,
  is_creator boolean default false,
  subscription_price float default 0.0,
  location geography(POINT),
  last_seen timestamp with time zone default now()
);

-- Posts Table
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  media_url text not null,
  caption text,
  is_locked boolean default false,
  created_at timestamp with time zone default now()
);

-- Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  content text,
  created_at timestamp with time zone default now()
);

-- RLS Policies (Basic)
alter table profiles enable row level security;
alter table posts enable row level security;
alter table messages enable row level security;

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Public posts are viewable by everyone" on posts for select using (true); -- Refine for locked content later
create policy "Users can create posts" on posts for insert with check (auth.uid() = user_id);

create policy "Users can view their own messages" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id);
