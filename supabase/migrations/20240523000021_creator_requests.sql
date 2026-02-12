-- Create a simple Creator Requests table for the MVP manual flow
create table if not exists creator_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone default now()
);

alter table creator_requests enable row level security;

create policy "Users can insert own creator requests" on creator_requests
  for insert with check (auth.uid() = user_id);

create policy "Users can view own creator requests" on creator_requests
  for select using (auth.uid() = user_id);

-- Admins can view/update all (assuming admin policies handled elsewhere or via dashboard logic)
create policy "Admins can view all creator requests" on creator_requests
  for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
  
create policy "Admins can update creator requests" on creator_requests
  for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
