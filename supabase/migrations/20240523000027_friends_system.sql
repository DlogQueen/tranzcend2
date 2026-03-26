-- Facebook-style Friends System
-- Only friends can message each other

-- 1. Create Friends table (bidirectional friendship)
create table if not exists friends (
  id uuid default gen_random_uuid() primary key,
  user_id_1 uuid references profiles(id) on delete cascade,
  user_id_2 uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id_1, user_id_2),
  check (user_id_1 < user_id_2) -- Ensures only one row per friendship
);

-- 2. Create Friend Requests table
create table if not exists friend_requests (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(requester_id, receiver_id)
);

-- 3. Enable RLS
alter table friends enable row level security;
alter table friend_requests enable row level security;

-- 4. RLS Policies for Friends
create policy "Users can view their own friendships" on friends
  for select using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can delete their own friendships" on friends
  for delete using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- 5. RLS Policies for Friend Requests
create policy "Users can view their own friend requests" on friend_requests
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can send friend requests" on friend_requests
  for insert with check (auth.uid() = requester_id);

create policy "Users can update received requests" on friend_requests
  for update using (auth.uid() = receiver_id);

-- 6. Function to check if two users are friends
create or replace function are_friends(user1 uuid, user2 uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from friends
    where (user_id_1 = least(user1, user2) and user_id_2 = greatest(user1, user2))
  );
$$;

-- 7. Function to check if user is blocked
create or replace function is_blocked(blocker uuid, blocked uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from blocks
    where blocker_id = blocker and blocked_id = blocked
  );
$$;

-- 8. Update Messages RLS to require friendship
drop policy if exists "Users can view their own messages" on messages;
drop policy if exists "Users can send messages" on messages;

create policy "Users can view messages with friends" on messages
  for select using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and are_friends(sender_id, receiver_id)
    and not is_blocked(receiver_id, sender_id)
    and not is_blocked(sender_id, receiver_id)
  );

create policy "Users can send messages to friends" on messages
  for insert with check (
    auth.uid() = sender_id
    and are_friends(sender_id, receiver_id)
    and not is_blocked(receiver_id, sender_id)
    and not is_blocked(sender_id, receiver_id)
  );

-- 9. Function to send friend request
create or replace function send_friend_request(receiver uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Check if already friends
  if are_friends(auth.uid(), receiver) then
    return json_build_object('success', false, 'message', 'Already friends');
  end if;

  -- Check if blocked
  if is_blocked(receiver, auth.uid()) then
    return json_build_object('success', false, 'message', 'Cannot send request');
  end if;

  -- Check if request already exists
  if exists(
    select 1 from friend_requests
    where requester_id = auth.uid() and receiver_id = receiver and status = 'pending'
  ) then
    return json_build_object('success', false, 'message', 'Request already sent');
  end if;

  -- Insert request
  insert into friend_requests (requester_id, receiver_id)
  values (auth.uid(), receiver);

  return json_build_object('success', true, 'message', 'Friend request sent');
end;
$$;

-- 10. Function to accept friend request
create or replace function accept_friend_request(request_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  req friend_requests;
begin
  -- Get request
  select * into req from friend_requests
  where id = request_id and receiver_id = auth.uid() and status = 'pending';

  if not found then
    return json_build_object('success', false, 'message', 'Request not found');
  end if;

  -- Update request status
  update friend_requests set status = 'accepted', updated_at = now()
  where id = request_id;

  -- Create friendship (ensure user_id_1 < user_id_2)
  insert into friends (user_id_1, user_id_2)
  values (least(req.requester_id, req.receiver_id), greatest(req.requester_id, req.receiver_id))
  on conflict do nothing;

  return json_build_object('success', true, 'message', 'Friend request accepted');
end;
$$;

-- 11. Function to get friends list
create or replace function get_friends_list()
returns table (
  friend_id uuid,
  username text,
  avatar_url text,
  bio text,
  is_verified boolean,
  last_seen timestamp with time zone
)
language sql
security definer
stable
as $$
  select 
    case 
      when f.user_id_1 = auth.uid() then f.user_id_2
      else f.user_id_1
    end as friend_id,
    p.username,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.last_seen
  from friends f
  join profiles p on p.id = case 
    when f.user_id_1 = auth.uid() then f.user_id_2
    else f.user_id_1
  end
  where f.user_id_1 = auth.uid() or f.user_id_2 = auth.uid()
  order by p.last_seen desc nulls last;
$$;

-- 12. Indexes for performance
create index if not exists idx_friends_user1 on friends(user_id_1);
create index if not exists idx_friends_user2 on friends(user_id_2);
create index if not exists idx_friend_requests_receiver on friend_requests(receiver_id) where status = 'pending';
create index if not exists idx_friend_requests_requester on friend_requests(requester_id);
create index if not exists idx_blocks_blocker on blocks(blocker_id);
create index if not exists idx_blocks_blocked on blocks(blocked_id);
