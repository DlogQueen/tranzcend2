-- Create Security Logs table for Audit and Analytics
-- This serves as the foundation for future Snowflake integration for fraud/threat analysis.

create table if not exists security_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null, -- e.g., 'login', 'purchase_attempt', 'profile_update', 'ghost_mode_toggle'
  severity text default 'info', -- 'info', 'warning', 'critical'
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table security_logs enable row level security;

-- Only admins/system can insert. Users cannot read logs.
-- For now, we allow authenticated users to insert their own logs (e.g. client-side events),
-- but in a real prod env, this would be strictly server-side.
create policy "Users can insert own security logs" on security_logs
  for insert with check (auth.uid() = user_id);

-- No select policy means no one (except service_role) can read these logs via API.
-- This is intentional for security.
