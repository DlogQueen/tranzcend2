-- First 5-10 fans per creator get 1 year free premium
-- Premium = profile perks only (no ads, priority in discovery, etc.)
-- Still pays for: shows, private sessions, PPV, tips

-- Add premium_expires_at column if not exists
alter table profiles
add column if not exists premium_expires_at timestamp with time zone;

-- Add fan_premium_slots to creator profiles (how many free slots they offer)
alter table profiles
add column if not exists fan_premium_slots int default 5; -- Creator can set 5 or 10

-- Track which fans got free premium from which creator
create table if not exists creator_fan_perks (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade,
  fan_id uuid references profiles(id) on delete cascade,
  granted_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '1 year'),
  unique(creator_id, fan_id)
);

alter table creator_fan_perks enable row level security;

create policy "Creators can view their fan perks" on creator_fan_perks
  for select using (auth.uid() = creator_id);

create policy "Fans can view their own perks" on creator_fan_perks
  for select using (auth.uid() = fan_id);

-- Function: grant premium to early fans when they subscribe to a creator
create or replace function grant_early_fan_premium(p_creator_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  fan_count int;
  slot_limit int;
  already_granted boolean;
begin
  -- Get creator's slot limit
  select coalesce(fan_premium_slots, 5) into slot_limit
  from profiles where id = p_creator_id;

  -- Count how many fans already got the perk
  select count(*) into fan_count
  from creator_fan_perks where creator_id = p_creator_id;

  -- Check if this fan already has the perk
  select exists(
    select 1 from creator_fan_perks
    where creator_id = p_creator_id and fan_id = auth.uid()
  ) into already_granted;

  if already_granted then
    return json_build_object('success', false, 'message', 'Already have perk');
  end if;

  -- Slots still available?
  if fan_count >= slot_limit then
    return json_build_object('success', false, 'message', 'No slots left');
  end if;

  -- Grant the perk
  insert into creator_fan_perks (creator_id, fan_id)
  values (p_creator_id, auth.uid());

  -- Set premium on fan profile
  update profiles
  set is_premium = true,
      premium_expires_at = now() + interval '1 year'
  where id = auth.uid()
    and (premium_expires_at is null or premium_expires_at < now() + interval '1 year');

  return json_build_object(
    'success', true,
    'message', 'You got 1 year free premium as an early fan!',
    'slots_remaining', slot_limit - fan_count - 1
  );
end;
$$;

-- Auto-expire premium
create or replace function check_premium_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.premium_expires_at is not null and new.premium_expires_at < now() then
    new.is_premium := false;
  end if;
  return new;
end;
$$;

drop trigger if exists expire_premium on profiles;
create trigger expire_premium
before update on profiles
for each row
execute function check_premium_expiry();

-- Index
create index if not exists idx_fan_perks_creator on creator_fan_perks(creator_id);
create index if not exists idx_fan_perks_fan on creator_fan_perks(fan_id);
