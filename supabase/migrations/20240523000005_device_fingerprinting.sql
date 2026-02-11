p more -- Device Fingerprinting & Alt-Account Detection
-- This system prevents ban evasion by linking users who share the same device or network signature.

create table if not exists device_fingerprints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  device_hash text not null, -- A unique hash generated client-side (e.g., Canvas + Audio + Screen fingerprint)
  ip_address text,
  user_agent text,
  trust_score int default 100, -- 0 = Banned, 100 = Trusted
  created_at timestamp with time zone default now()
);

-- Index for fast lookups
create index if not exists idx_device_hash on device_fingerprints(device_hash);
create index if not exists idx_ip_address on device_fingerprints(ip_address);

-- Function to ban all accounts associated with a specific device
create or replace function ban_device(target_device_hash text)
returns void as $$
begin
  -- 1. Mark all fingerprints with this hash as 0 trust (Banned)
  update device_fingerprints
  set trust_score = 0
  where device_hash = target_device_hash;

  -- 2. (Optional) Could also flag the profiles directly, but keeping it decoupled is cleaner.
end;
$$ language plpgsql security definer;

-- RLS
alter table device_fingerprints enable row level security;

-- Users can insert their own fingerprint (happens on login/signup)
create policy "Users can log their device" on device_fingerprints
  for insert with check (auth.uid() = user_id);

-- Only admins/system can read fingerprints to detect alts
-- (No select policy for public/anon)
