-- Multiple Show Types and Monetization Options
-- Public, Private, Group, Interactive shows

-- 1. Add show type to live_streams table
alter table live_streams
add column if not exists show_type text default 'public', -- 'public', 'private', 'group', 'interactive'
add column if not exists price_per_minute float default 0.0, -- For private/group shows
add column if not exists min_viewers int default 1, -- Minimum viewers for group show to start
add column if not exists max_viewers int, -- Maximum viewers for private/group shows
add column if not exists tip_goal float default 0.0, -- Goal for interactive shows
add column if not exists tip_goal_description text, -- What happens when goal is reached
add column if not exists interactive_toy_connected boolean default false;

-- 2. Create show_participants table (for private/group shows)
create table if not exists show_participants (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  left_at timestamp with time zone,
  total_minutes int default 0,
  total_paid float default 0.0,
  unique(stream_id, user_id)
);

-- 3. Create tips table
create table if not exists tips (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  tipper_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  amount float not null,
  message text,
  is_anonymous boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. Create virtual_gifts table
create table if not exists virtual_gifts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon_url text,
  price float not null,
  animation_url text, -- URL to animation/effect
  is_active boolean default true
);

-- 5. Create gift_transactions table
create table if not exists gift_transactions (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  gift_id uuid references virtual_gifts(id),
  sender_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  quantity int default 1,
  total_amount float not null,
  created_at timestamp with time zone default now()
);

-- 6. Create private_show_requests table (enhanced)
alter table private_requests
add column if not exists show_type text default 'private', -- 'private' or 'group'
add column if not exists duration_minutes int default 15,
add column if not exists price_per_minute float;

-- 7. Enable RLS
alter table show_participants enable row level security;
alter table tips enable row level security;
alter table virtual_gifts enable row level security;
alter table gift_transactions enable row level security;

-- 8. RLS Policies for show_participants
create policy "Participants can view their own participation" on show_participants
  for select using (auth.uid() = user_id);

create policy "Creators can view their show participants" on show_participants
  for select using (
    exists(
      select 1 from live_streams
      where id = stream_id and creator_id = auth.uid()
    )
  );

create policy "Users can join shows" on show_participants
  for insert with check (auth.uid() = user_id);

-- 9. RLS Policies for tips
create policy "Anyone can view tips" on tips
  for select using (true);

create policy "Authenticated users can send tips" on tips
  for insert with check (auth.uid() = tipper_id);

-- 10. RLS Policies for gifts
create policy "Anyone can view active gifts" on virtual_gifts
  for select using (is_active = true);

create policy "Anyone can view gift transactions" on gift_transactions
  for select using (true);

create policy "Authenticated users can send gifts" on gift_transactions
  for insert with check (auth.uid() = sender_id);

-- 11. Function to start a show
create or replace function start_show(
  p_show_type text,
  p_price_per_minute float default 0.0,
  p_min_viewers int default 1,
  p_max_viewers int default null,
  p_tip_goal float default 0.0,
  p_tip_goal_description text default null
)
returns json
language plpgsql
security definer
as $$
declare
  stream_id uuid;
begin
  -- Check if user is a creator
  if not exists(select 1 from profiles where id = auth.uid() and is_creator = true) then
    return json_build_object('success', false, 'message', 'Only creators can start shows');
  end if;

  -- Check if already live
  if exists(select 1 from live_streams where creator_id = auth.uid() and status = 'live') then
    return json_build_object('success', false, 'message', 'Already live');
  end if;

  -- Create stream
  insert into live_streams (
    creator_id,
    status,
    show_type,
    price_per_minute,
    min_viewers,
    max_viewers,
    tip_goal,
    tip_goal_description
  ) values (
    auth.uid(),
    'live',
    p_show_type,
    p_price_per_minute,
    p_min_viewers,
    p_max_viewers,
    p_tip_goal,
    p_tip_goal_description
  )
  returning id into stream_id;

  return json_build_object('success', true, 'stream_id', stream_id);
end;
$$;

-- 12. Function to join a show
create or replace function join_show(p_stream_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  stream live_streams;
  participant_count int;
begin
  -- Get stream details
  select * into stream from live_streams where id = p_stream_id and status = 'live';
  
  if not found then
    return json_build_object('success', false, 'message', 'Show not found or not live');
  end if;

  -- Check if blocked
  if is_blocked(stream.creator_id, auth.uid()) or is_blocked(auth.uid(), stream.creator_id) then
    return json_build_object('success', false, 'message', 'Cannot join this show');
  end if;

  -- Public shows: anyone can join
  if stream.show_type = 'public' then
    return json_build_object('success', true, 'message', 'Joined public show');
  end if;

  -- Private/Group shows: check capacity
  select count(*) into participant_count
  from show_participants
  where stream_id = p_stream_id and left_at is null;

  if stream.max_viewers is not null and participant_count >= stream.max_viewers then
    return json_build_object('success', false, 'message', 'Show is full');
  end if;

  -- Add participant
  insert into show_participants (stream_id, user_id)
  values (p_stream_id, auth.uid())
  on conflict (stream_id, user_id) do nothing;

  return json_build_object('success', true, 'message', 'Joined show');
end;
$$;

-- 13. Function to send tip
create or replace function send_tip(
  p_stream_id uuid,
  p_amount float,
  p_message text default null,
  p_is_anonymous boolean default false
)
returns json
language plpgsql
security definer
as $$
declare
  stream live_streams;
  creator_revenue float;
  platform_fee float;
begin
  -- Get stream
  select * into stream from live_streams where id = p_stream_id and status = 'live';
  
  if not found then
    return json_build_object('success', false, 'message', 'Show not found');
  end if;

  -- Check user balance (assuming balance in profiles table)
  if (select balance from profiles where id = auth.uid()) < p_amount then
    return json_build_object('success', false, 'message', 'Insufficient balance');
  end if;

  -- Calculate revenue split
  select revenue_split into creator_revenue from profiles where id = stream.creator_id;
  creator_revenue := p_amount * coalesce(creator_revenue, 0.8);
  platform_fee := p_amount - creator_revenue;

  -- Deduct from tipper
  update profiles set balance = balance - p_amount where id = auth.uid();

  -- Add to creator
  update profiles set balance = balance + creator_revenue where id = stream.creator_id;

  -- Record tip
  insert into tips (stream_id, tipper_id, creator_id, amount, message, is_anonymous)
  values (p_stream_id, auth.uid(), stream.creator_id, p_amount, p_message, p_is_anonymous);

  -- Record transaction
  insert into transactions (user_id, type, amount, description)
  values 
    (auth.uid(), 'tip_sent', -p_amount, 'Tip to ' || (select username from profiles where id = stream.creator_id)),
    (stream.creator_id, 'earning', creator_revenue, 'Tip from viewer');

  return json_build_object('success', true, 'message', 'Tip sent');
end;
$$;

-- 14. Insert default virtual gifts
insert into virtual_gifts (name, description, price, icon_url) values
  ('Rose', 'A beautiful rose', 1.00, '/gifts/rose.png'),
  ('Heart', 'Send some love', 2.00, '/gifts/heart.png'),
  ('Kiss', 'Blow a kiss', 3.00, '/gifts/kiss.png'),
  ('Champagne', 'Celebrate!', 5.00, '/gifts/champagne.png'),
  ('Diamond', 'You''re a gem', 10.00, '/gifts/diamond.png'),
  ('Crown', 'Royalty treatment', 25.00, '/gifts/crown.png'),
  ('Yacht', 'Living large', 50.00, '/gifts/yacht.png'),
  ('Mansion', 'Ultimate luxury', 100.00, '/gifts/mansion.png')
on conflict do nothing;

-- 15. Indexes for performance
create index if not exists idx_show_participants_stream on show_participants(stream_id);
create index if not exists idx_show_participants_user on show_participants(user_id);
create index if not exists idx_tips_stream on tips(stream_id);
create index if not exists idx_tips_creator on tips(creator_id);
create index if not exists idx_gift_transactions_stream on gift_transactions(stream_id);
create index if not exists idx_live_streams_show_type on live_streams(show_type);
