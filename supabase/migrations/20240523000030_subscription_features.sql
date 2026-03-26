-- Subscription Tiers and Premium Features
-- Tiered access, PPV content, tip menus, and interactive features

-- 1. Subscription Tiers
create table if not exists subscription_tiers (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  name text not null, -- 'Basic', 'Premium', 'VIP'
  price float not null,
  description text,
  benefits jsonb default '[]'::jsonb, -- Array of benefit descriptions
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. Enhanced Subscriptions table
alter table subscriptions
add column if not exists tier_id uuid references subscription_tiers(id),
add column if not exists auto_renew boolean default true,
add column if not exists next_billing_date timestamp with time zone,
add column if not exists cancelled_at timestamp with time zone;

-- 3. Pay-Per-View (PPV) Content
create table if not exists ppv_content (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  media_url text not null,
  thumbnail_url text,
  price float not null,
  duration_seconds int, -- For videos
  content_type text not null, -- 'video', 'photo_set', 'audio'
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. PPV Purchases
create table if not exists ppv_purchases (
  id uuid default gen_random_uuid() primary key,
  content_id uuid references ppv_content(id) on delete cascade,
  buyer_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  amount_paid float not null,
  purchased_at timestamp with time zone default now(),
  unique(content_id, buyer_id)
);

-- 5. Tip Menus
create table if not exists tip_menu_items (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  action text not null, -- 'Flash', 'Dance', 'Remove Top', etc.
  price float not null,
  emoji text, -- Optional emoji icon
  is_active boolean default true,
  sort_order int default 0
);

-- 6. Story/Teaser Content
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null, -- 'photo', 'video'
  duration_seconds int default 24, -- How long story is visible (hours)
  caption text,
  link_url text, -- Link to full content/profile
  views_count int default 0,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '24 hours')
);

-- 7. Story Views
create table if not exists story_views (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references stories(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete cascade,
  viewed_at timestamp with time zone default now(),
  unique(story_id, viewer_id)
);

-- 8. Fan Wall / Shoutouts
create table if not exists fan_wall_posts (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  fan_id uuid references profiles(id) on delete cascade,
  message text not null,
  amount_paid float default 0, -- Optional paid shoutout
  is_pinned boolean default false,
  is_approved boolean default false, -- Creator can moderate
  created_at timestamp with time zone default now()
);

-- 9. Group Chats
create table if not exists group_chats (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  price float default 0, -- Monthly price to join
  max_members int,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists group_chat_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references group_chats(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  is_muted boolean default false,
  unique(group_id, user_id)
);

create table if not exists group_chat_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references group_chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  media_url text,
  created_at timestamp with time zone default now()
);

-- 10. Q&A Sessions
create table if not exists qa_sessions (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  title text not null,
  scheduled_at timestamp with time zone not null,
  duration_minutes int default 60,
  price float default 0, -- Free or paid
  status text default 'scheduled', -- 'scheduled', 'live', 'ended'
  created_at timestamp with time zone default now()
);

create table if not exists qa_questions (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references qa_sessions(id) on delete cascade,
  asker_id uuid references profiles(id) on delete cascade,
  question text not null,
  is_answered boolean default false,
  upvotes int default 0,
  created_at timestamp with time zone default now()
);

-- 11. Enable RLS
alter table subscription_tiers enable row level security;
alter table ppv_content enable row level security;
alter table ppv_purchases enable row level security;
alter table tip_menu_items enable row level security;
alter table stories enable row level security;
alter table story_views enable row level security;
alter table fan_wall_posts enable row level security;
alter table group_chats enable row level security;
alter table group_chat_members enable row level security;
alter table group_chat_messages enable row level security;
alter table qa_sessions enable row level security;
alter table qa_questions enable row level security;

-- 12. RLS Policies (drop existing first to avoid conflicts)
do $$ 
begin
  -- Drop existing policies if they exist
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'subscription_tiers' and p.polname = 'Anyone can view active subscription tiers'
  ) then
    drop policy "Anyone can view active subscription tiers" on subscription_tiers;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'subscription_tiers' and p.polname = 'Creators can manage their tiers'
  ) then
    drop policy "Creators can manage their tiers" on subscription_tiers;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'ppv_content' and p.polname = 'Anyone can view active PPV content'
  ) then
    drop policy "Anyone can view active PPV content" on ppv_content;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'ppv_content' and p.polname = 'Creators can manage their PPV content'
  ) then
    drop policy "Creators can manage their PPV content" on ppv_content;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'ppv_purchases' and p.polname = 'Users can view their purchases'
  ) then
    drop policy "Users can view their purchases" on ppv_purchases;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'stories' and p.polname = 'Anyone can view active stories'
  ) then
    drop policy "Anyone can view active stories" on stories;
  end if;
  
  if exists (
    select 1 from pg_policy p
    join pg_class c on p.polrelid = c.oid
    where c.relname = 'stories' and p.polname = 'Creators can manage their stories'
  ) then
    drop policy "Creators can manage their stories" on stories;
  end if;
end $$;

-- Now create the policies
create policy "Anyone can view active subscription tiers" on subscription_tiers
  for select using (is_active = true);

create policy "Creators can manage their tiers" on subscription_tiers
  for all using (auth.uid() = creator_id);

create policy "Anyone can view active PPV content" on ppv_content
  for select using (is_active = true);

create policy "Creators can manage their PPV content" on ppv_content
  for all using (auth.uid() = creator_id);

create policy "Users can view their purchases" on ppv_purchases
  for select using (auth.uid() = buyer_id);

create policy "Anyone can view active stories" on stories
  for select using (expires_at > now());

create policy "Creators can manage their stories" on stories
  for all using (auth.uid() = creator_id);

-- 13. Function to purchase PPV content
create or replace function purchase_ppv(p_content_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  content ppv_content;
  creator_revenue float;
  platform_fee float;
  revenue_split float;
begin
  -- Get content
  select * into content from ppv_content where id = p_content_id and is_active = true;
  
  if not found then
    return json_build_object('success', false, 'message', 'Content not found');
  end if;

  -- Check if already purchased
  if exists(select 1 from ppv_purchases where content_id = p_content_id and buyer_id = auth.uid()) then
    return json_build_object('success', false, 'message', 'Already purchased');
  end if;

  -- Check balance
  if (select balance from profiles where id = auth.uid()) < content.price then
    return json_build_object('success', false, 'message', 'Insufficient balance');
  end if;

  -- Get creator revenue split
  select revenue_split into revenue_split from profiles where id = content.creator_id;
  creator_revenue := content.price * coalesce(revenue_split, 0.8);
  platform_fee := content.price - creator_revenue;

  -- Process payment
  update profiles set balance = balance - content.price where id = auth.uid();
  update profiles set balance = balance + creator_revenue where id = content.creator_id;

  -- Record purchase
  insert into ppv_purchases (content_id, buyer_id, creator_id, amount_paid)
  values (p_content_id, auth.uid(), content.creator_id, content.price);

  -- Record transactions
  insert into transactions (user_id, type, amount, description)
  values 
    (auth.uid(), 'ppv_purchase', -content.price, 'PPV: ' || content.title),
    (content.creator_id, 'earning', creator_revenue, 'PPV sale: ' || content.title);

  return json_build_object('success', true, 'message', 'Purchase successful');
end;
$$;

-- 14. Function to check PPV access
create or replace function has_ppv_access(p_content_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from ppv_purchases
    where content_id = p_content_id and buyer_id = p_user_id
  );
$$;

-- 15. Indexes
create index if not exists idx_subscription_tiers_creator on subscription_tiers(creator_id);
create index if not exists idx_ppv_content_creator on ppv_content(creator_id);
create index if not exists idx_ppv_purchases_buyer on ppv_purchases(buyer_id);
create index if not exists idx_stories_creator on stories(creator_id);
create index if not exists idx_stories_expires on stories(expires_at);
create index if not exists idx_fan_wall_creator on fan_wall_posts(creator_id);
create index if not exists idx_group_chats_creator on group_chats(creator_id);
