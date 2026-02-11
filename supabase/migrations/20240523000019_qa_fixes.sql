-- Fix RPC to return distance
-- We need to define a return type or use RETURNS TABLE
drop function if exists get_nearby_users;

create or replace function get_nearby_users(
  lat float,
  long float,
  radius_meters float
)
returns table (
  id uuid,
  username text,
  bio text,
  avatar_url text,
  banner_url text,
  website text,
  location_name text,
  tags text[],
  is_creator boolean,
  subscription_price float,
  last_seen timestamptz,
  is_verified boolean,
  ghost_mode boolean,
  is_premium boolean,
  dist_meters float
)
language sql
security definer
as $$
  select 
    id,
    username,
    bio,
    avatar_url,
    banner_url,
    website,
    location_name,
    tags,
    is_creator,
    subscription_price,
    last_seen,
    is_verified,
    ghost_mode,
    is_premium,
    st_distance(location, st_point(long, lat)::geography) as dist_meters
  from profiles
  where st_dwithin(
    location,
    st_point(long, lat)::geography,
    radius_meters
  )
  order by location <-> st_point(long, lat)::geography;
$$;

-- Add Referral ID to Profiles
alter table profiles 
add column if not exists referral_id uuid references profiles(id);
