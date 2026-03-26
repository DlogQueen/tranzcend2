-- Safety, Moderation, and LGBTQ-Focused Platform Features
-- Based on industry standards for LGBTQ webcam platforms

-- 1. Enhanced Reports table with LGBTQ-specific categories
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade,
  reported_id uuid references profiles(id) on delete cascade,
  report_type text not null, -- 'user', 'post', 'message', 'stream'
  content_id uuid, -- ID of post, message, or stream
  category text not null, -- 'hate_speech', 'transphobia', 'harassment', 'racism', 'sexual_harassment', 'spam', 'other'
  severity text default 'medium', -- 'low', 'medium', 'high', 'critical'
  reason text not null,
  evidence_urls text[], -- Screenshots or recordings
  status text default 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  moderator_id uuid references profiles(id),
  moderator_notes text,
  action_taken text, -- 'warning', 'temp_ban', 'permanent_ban', 'content_removed', 'no_action'
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

-- 2. User Warnings and Bans
create table if not exists user_warnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  moderator_id uuid references profiles(id),
  reason text not null,
  severity text not null, -- 'minor', 'major', 'severe'
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists user_bans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  moderator_id uuid references profiles(id),
  reason text not null,
  ban_type text not null, -- 'temporary', 'permanent'
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. Moderator Activity Log
create table if not exists moderator_actions (
  id uuid default gen_random_uuid() primary key,
  moderator_id uuid references profiles(id) on delete cascade,
  action_type text not null, -- 'ban', 'warn', 'remove_content', 'resolve_report'
  target_user_id uuid references profiles(id),
  target_content_id uuid,
  reason text,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 4. Privacy Settings (enhanced)
alter table profiles
add column if not exists privacy_settings jsonb default '{
  "show_location": false,
  "show_real_name": false,
  "allow_screenshots": false,
  "blur_background": false,
  "hide_from_search": false,
  "anonymous_tips": false,
  "require_verification_to_message": false
}'::jsonb,
add column if not exists safety_settings jsonb default '{
  "auto_block_new_accounts": false,
  "require_friend_to_message": true,
  "filter_offensive_messages": true,
  "hide_from_non_lgbtq": false
}'::jsonb,
add column if not exists pronouns text,
add column if not exists gender_identity text,
add column if not exists sexual_orientation text,
add column if not exists is_moderator boolean default false,
add column if not exists two_factor_enabled boolean default false,
add column if not exists account_verified_at timestamp with time zone;

-- 5. Content Warnings
create table if not exists content_warnings (
  id uuid default gen_random_uuid() primary key,
  content_type text not null, -- 'post', 'stream', 'profile'
  content_id uuid not null,
  warning_type text not null, -- 'nudity', 'explicit', 'violence', 'sensitive'
  created_at timestamp with time zone default now()
);

-- 6. Safe Words / Emergency Stop for streams
create table if not exists stream_safety_events (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  event_type text not null, -- 'safe_word', 'emergency_stop', 'panic_button'
  triggered_at timestamp with time zone default now(),
  moderator_notified boolean default false,
  moderator_response_time interval
);

-- 7. Community Guidelines Acceptance
create table if not exists guidelines_acceptance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  version text not null,
  accepted_at timestamp with time zone default now(),
  ip_address inet
);

-- 8. Mental Health Resources
create table if not exists support_resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null, -- 'mental_health', 'lgbtq_support', 'crisis', 'legal', 'safety'
  url text,
  phone_number text,
  is_crisis_line boolean default false,
  is_lgbtq_specific boolean default false,
  country_code text,
  is_active boolean default true
);

-- 9. Enable RLS
alter table reports enable row level security;
alter table user_warnings enable row level security;
alter table user_bans enable row level security;
alter table moderator_actions enable row level security;
alter table content_warnings enable row level security;
alter table stream_safety_events enable row level security;
alter table guidelines_acceptance enable row level security;
alter table support_resources enable row level security;

-- 10. RLS Policies for Reports
create policy "Users can view their own reports" on reports
  for select using (auth.uid() = reporter_id);

create policy "Users can create reports" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "Moderators can view all reports" on reports
  for select using (
    exists(select 1 from profiles where id = auth.uid() and (is_moderator = true or is_admin = true))
  );

create policy "Moderators can update reports" on reports
  for update using (
    exists(select 1 from profiles where id = auth.uid() and (is_moderator = true or is_admin = true))
  );

-- 11. RLS Policies for Warnings and Bans
create policy "Users can view their own warnings" on user_warnings
  for select using (auth.uid() = user_id);

create policy "Moderators can manage warnings" on user_warnings
  for all using (
    exists(select 1 from profiles where id = auth.uid() and (is_moderator = true or is_admin = true))
  );

create policy "Users can view their own bans" on user_bans
  for select using (auth.uid() = user_id);

create policy "Moderators can manage bans" on user_bans
  for all using (
    exists(select 1 from profiles where id = auth.uid() and (is_moderator = true or is_admin = true))
  );

-- 12. Function to check if user is banned
create or replace function is_user_banned(p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from user_bans
    where user_id = p_user_id
    and is_active = true
    and (expires_at is null or expires_at > now())
  );
$$;

-- 13. Function to submit report
create or replace function submit_report(
  p_reported_id uuid,
  p_report_type text,
  p_content_id uuid,
  p_category text,
  p_reason text,
  p_evidence_urls text[] default null
)
returns json
language plpgsql
security definer
as $$
declare
  report_id uuid;
  severity_level text;
begin
  -- Determine severity based on category
  severity_level := case
    when p_category in ('hate_speech', 'transphobia', 'racism') then 'critical'
    when p_category in ('harassment', 'sexual_harassment') then 'high'
    else 'medium'
  end;

  -- Create report
  insert into reports (
    reporter_id,
    reported_id,
    report_type,
    content_id,
    category,
    severity,
    reason,
    evidence_urls
  ) values (
    auth.uid(),
    p_reported_id,
    p_report_type,
    p_content_id,
    p_category,
    severity_level,
    p_reason,
    p_evidence_urls
  )
  returning id into report_id;

  -- Auto-block for critical reports
  if severity_level = 'critical' then
    insert into blocks (blocker_id, blocked_id)
    values (auth.uid(), p_reported_id)
    on conflict do nothing;
  end if;

  return json_build_object(
    'success', true,
    'report_id', report_id,
    'message', 'Report submitted. Our moderation team will review this within 24 hours.'
  );
end;
$$;

-- 14. Function to trigger emergency stop
create or replace function trigger_emergency_stop(p_stream_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  -- Record event
  insert into stream_safety_events (stream_id, creator_id, event_type)
  select id, creator_id, 'emergency_stop'
  from live_streams
  where id = p_stream_id and creator_id = auth.uid();

  -- End stream immediately
  update live_streams
  set status = 'ended', ended_at = now()
  where id = p_stream_id and creator_id = auth.uid();

  -- Notify moderators (would integrate with notification system)
  
  return json_build_object('success', true, 'message', 'Stream ended. Help is on the way.');
end;
$$;

-- 15. Insert default support resources
insert into support_resources (title, description, category, phone_number, is_crisis_line, is_lgbtq_specific, country_code) values
  ('Trevor Project', '24/7 crisis support for LGBTQ+ youth', 'crisis', '1-866-488-7386', true, true, 'US'),
  ('Trans Lifeline', 'Peer support hotline for trans people', 'crisis', '1-877-565-8860', true, true, 'US'),
  ('LGBT National Hotline', 'Support and information for LGBTQ+ community', 'lgbtq_support', '1-888-843-4564', false, true, 'US'),
  ('National Suicide Prevention Lifeline', '24/7 crisis support', 'crisis', '988', true, false, 'US'),
  ('RAINN Sexual Assault Hotline', 'Support for sexual assault survivors', 'crisis', '1-800-656-4673', true, false, 'US'),
  ('GLBT National Youth Talkline', 'Support for LGBTQ+ youth under 25', 'lgbtq_support', '1-800-246-7743', false, true, 'US')
on conflict do nothing;

-- 16. Indexes for performance
create index if not exists idx_reports_status on reports(status) where status = 'pending';
create index if not exists idx_reports_severity on reports(severity);
create index if not exists idx_reports_created on reports(created_at desc);
create index if not exists idx_user_bans_active on user_bans(user_id) where is_active = true;
create index if not exists idx_moderator_actions_created on moderator_actions(created_at desc);
create index if not exists idx_profiles_moderator on profiles(is_moderator) where is_moderator = true;

-- 17. Trigger to auto-expire temporary bans
create or replace function expire_temporary_bans()
returns trigger
language plpgsql
as $$
begin
  update user_bans
  set is_active = false
  where expires_at < now() and is_active = true;
  return null;
end;
$$;

create trigger check_expired_bans
  after insert or update on user_bans
  execute function expire_temporary_bans();
