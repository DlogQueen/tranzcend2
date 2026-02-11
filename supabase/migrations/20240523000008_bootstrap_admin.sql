-- Bootstrap Admin Function
-- Use this to set the first admin user in the system.

create or replace function claim_admin_access()
returns void as $$
begin
  -- Optional: Security check to ensure this can't be abused in production
  -- For now, we allow it if the user is authenticated.
  
  update profiles
  set is_admin = true,
      is_creator = true,
      is_verified = true
  where id = auth.uid();
end;
$$ language plpgsql security definer;
