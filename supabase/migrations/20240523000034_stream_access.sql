create table if not exists stream_access (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  plan text not null, -- 'day', 'month'
  price_paid float not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  unique(stream_id, user_id)
);

alter table stream_access enable row level security;

create policy "Users can view their own access" on stream_access
  for select using (auth.uid() = user_id);

create policy "Users can purchase access" on stream_access
  for insert with check (auth.uid() = user_id);

create index if not exists idx_stream_access_user on stream_access(user_id);
create index if not exists idx_stream_access_stream on stream_access(stream_id);
