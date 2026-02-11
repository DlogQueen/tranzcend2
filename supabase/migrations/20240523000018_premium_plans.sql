-- Add Premium Status to Profiles
alter table profiles 
add column if not exists is_premium boolean default false;

-- Function to handle registration promo (First 10 users get Premium)
create or replace function handle_new_user_promo()
returns trigger as $$
declare
  user_count int;
begin
  select count(*) into user_count from profiles;
  
  if user_count < 10 then
    new.is_premium := true;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to run before profile insert
-- Note: 'profiles' usually inserted manually in code, so BEFORE INSERT works.
drop trigger if exists promo_check on profiles;
create trigger promo_check
before insert on profiles
for each row
execute function handle_new_user_promo();
