-- Simple Policy Fix - Just drop and recreate policies for new tables only
-- This avoids checking old tables that might have different structures

-- Drop policies on new tables only
do $$ 
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
    and tablename in (
      'subscription_tiers', 'ppv_content', 'ppv_purchases', 
      'tip_menu_items', 'stories', 'story_views', 
      'fan_wall_posts', 'group_chats', 'group_chat_members',
      'group_chat_messages', 'qa_sessions', 'qa_questions'
    )
  ) loop
    execute format('drop policy %I on %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  end loop;
  
  raise notice 'Dropped existing policies on new tables';
end $$;

-- Subscription Features Policies (only for new tables)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'subscription_tiers') then
    create policy "Anyone can view active subscription tiers" on subscription_tiers
      for select using (is_active = true);

    create policy "Creators can manage their tiers" on subscription_tiers
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created subscription_tiers policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'ppv_content') then
    create policy "Anyone can view active PPV content" on ppv_content
      for select using (is_active = true);

    create policy "Creators can manage their PPV content" on ppv_content
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created ppv_content policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'ppv_purchases') then
    create policy "Users can view their purchases" on ppv_purchases
      for select using (auth.uid() = buyer_id);
      
    raise notice '✅ Created ppv_purchases policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'stories') then
    create policy "Anyone can view active stories" on stories
      for select using (expires_at > now());

    create policy "Creators can manage their stories" on stories
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created stories policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'tip_menu_items') then
    create policy "Anyone can view tip menu items" on tip_menu_items
      for select using (is_active = true);

    create policy "Creators can manage tip menu" on tip_menu_items
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created tip_menu_items policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'fan_wall_posts') then
    create policy "Users can view approved fan wall posts" on fan_wall_posts
      for select using (is_approved = true);

    create policy "Creators can manage fan wall" on fan_wall_posts
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created fan_wall_posts policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'group_chats') then
    create policy "Anyone can view active group chats" on group_chats
      for select using (is_active = true);

    create policy "Creators can manage their groups" on group_chats
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created group_chats policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'group_chat_members') then
    create policy "Members can view their groups" on group_chat_members
      for select using (auth.uid() = user_id);
      
    raise notice '✅ Created group_chat_members policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'group_chat_messages') then
    create policy "Members can view group messages" on group_chat_messages
      for select using (
        exists(
          select 1 from group_chat_members
          where group_id = group_chat_messages.group_id and user_id = auth.uid()
        )
      );

    create policy "Members can send group messages" on group_chat_messages
      for insert with check (
        exists(
          select 1 from group_chat_members
          where group_id = group_chat_messages.group_id and user_id = auth.uid()
        )
      );
      
    raise notice '✅ Created group_chat_messages policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'qa_sessions') then
    create policy "Anyone can view scheduled QA sessions" on qa_sessions
      for select using (true);

    create policy "Creators can manage their QA sessions" on qa_sessions
      for all using (auth.uid() = creator_id);
      
    raise notice '✅ Created qa_sessions policies';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'qa_questions') then
    create policy "Anyone can view QA questions" on qa_questions
      for select using (true);

    create policy "Users can ask questions" on qa_questions
      for insert with check (auth.uid() = asker_id);
      
    raise notice '✅ Created qa_questions policies';
  end if;
end $$;

-- Success message
do $$
begin
  raise notice '🎉 Policy fix complete! Now run migration 20240523000030';
end $$;
