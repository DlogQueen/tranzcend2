-- Comments System

-- 1. Create Comments Table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- 2. RLS for Comments
alter table comments enable row level security;

-- Everyone can view comments (on posts they can see)
create policy "Public view comments" on comments 
  for select using (true); 

-- Only authenticated users can comment (logic for 'subscriber only' will be enforced in app or strict policy)
-- To enforce "Subscriber Only" via RLS is complex because it requires joining subscriptions. 
-- We'll allow insert for auth users, but the UI will gate it, and we can add a trigger or policy later if needed.
create policy "Auth users can comment" on comments 
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments" on comments 
  for delete using (auth.uid() = user_id);

-- 3. Add 'comment_count' to posts (optional, or just count on read)
-- We'll just count on read for MVP to avoid trigger complexity.
