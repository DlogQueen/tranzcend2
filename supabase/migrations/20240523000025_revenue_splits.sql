-- Revenue Split Tiers for Creator Payouts
-- Launch Strategy: 100% to early adopters, then tiered based on following/performance

alter table profiles 
add column if not exists revenue_split float default 1.0, -- 1.0 = 100% to creator, 0.8 = 80% to creator
add column if not exists is_founding_creator boolean default false, -- Locked at 100% forever
add column if not exists joined_at timestamp with time zone default now();

-- Comment explaining the tiers:
-- 1.0 (100%): Founding creators (first 100 verified creators) - LIFETIME
-- 0.9 (90%): Creators who join in first 6 months with 1k+ followers
-- 0.85 (85%): Creators who join in first year
-- 0.8 (80%): Standard rate after launch period

-- Function to calculate creator earnings from a transaction
create or replace function calculate_creator_payout(
  creator_id uuid,
  gross_amount float
)
returns float
language plpgsql
security definer
as $$
declare
  split float;
begin
  select revenue_split into split
  from profiles
  where id = creator_id;
  
  return gross_amount * coalesce(split, 0.8);
end;
$$;

-- Add index for faster queries
create index if not exists idx_profiles_founding_creator on profiles(is_founding_creator) where is_founding_creator = true;
create index if not exists idx_profiles_revenue_split on profiles(revenue_split);
