-- Create a function to get nearby users
create or replace function get_nearby_users(
  lat float,
  long float,
  radius_meters float
)
returns setof profiles
language sql
security definer
as $$
  select *
  from profiles
  where st_dwithin(
    location,
    st_point(long, lat)::geography,
    radius_meters
  )
  order by location <-> st_point(long, lat)::geography;
$$;
