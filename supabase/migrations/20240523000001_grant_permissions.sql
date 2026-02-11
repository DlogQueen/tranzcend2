-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated;

-- Grant access to posts
GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO anon, authenticated;

-- Grant access to messages
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon, authenticated;
