-- LGBTQ+ Community Categories

-- 1. Add 'identity_tags' and 'interest_tags' to profiles
alter table profiles 
add column if not exists identity_tags text[] default '{}',
add column if not exists interest_tags text[] default '{}';

-- 2. Create a predefined list of tags (Optional, can be managed in app code or a separate table)
-- For flexibility, we'll stick to array columns on the profile for now.

-- Example Identities: Trans Woman, Trans Man, Non-Binary, Genderfluid, Cis Female, Cis Male, Crossdresser
-- Example Interests: Dating, Networking, Content Creation, Hookups, Friendship
