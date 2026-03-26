-- Live Streaming Infrastructure

-- Live Streams Table
create table if not exists live_streams (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  title text default 'Live Stream',
  status text default 'offline', -- 'offline', 'live', 'private'
  viewer_count int default 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Live Chat Messages
create table if not exists live_chat_messages (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  sender_username text not null,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  is_tip boolean default false,
  is_announcement boolean default false,
  amount float default 0,
  created_at timestamp with time zone default now()
);

-- Private Show Requests
create table if not exists private_requests (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  requester_id uuid references profiles(id) on delete cascade,
  status text default 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
  offered_amount float not null,
  message text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table live_streams enable row level security;
alter table live_chat_messages enable row level security;
alter table private_requests enable row level security;

-- RLS Policies
create policy "Anyone can view live streams" on live_streams
  for select using (true);

create policy "Creators can manage their streams" on live_streams
  for all using (auth.uid() = creator_id);

create policy "Anyone can view chat messages" on live_chat_messages
  for select using (true);

create policy "Authenticated users can send messages" on live_chat_messages
  for insert with check (auth.uid() = sender_id or auth.uid() = creator_id);

create policy "Users can view their private requests" on private_requests
  for select using (auth.uid() = creator_id or auth.uid() = requester_id);

create policy "Users can create private requests" on private_requests
  for insert with check (auth.uid() = requester_id);

create policy "Creators can update their requests" on private_requests
  for update using (auth.uid() = creator_id);

-- Indexes for performance
create index idx_live_streams_creator on live_streams(creator_id);
create index idx_live_streams_status on live_streams(status);
create index idx_live_chat_creator on live_chat_messages(creator_id);
create index idx_live_chat_created on live_chat_messages(created_at desc);
create index idx_private_requests_creator on private_requests(creator_id);
create index idx_private_requests_status on private_requests(status);

-- Function to update viewer count
create or replace function update_viewer_count(stream_id uuid, count_change int)
returns void
language plpgsql
security definer
as $$
begin
  update live_streams
  set viewer_count = greatest(0, viewer_count + count_change)
  where id = stream_id;
end;
$$;
