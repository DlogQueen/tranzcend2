# Supabase Migration Guide

## Current Status
Your Supabase project is set up. Here's how to apply all the new features.

## New Migrations to Apply

We've created several new migration files that need to be pushed to your Supabase database:

1. `20240523000025_revenue_splits.sql` - Creator revenue tiers (100% for first 100)
2. `20240523000027_friends_system.sql` - Facebook-style friends & messaging
3. `20240523000028_show_types.sql` - Multiple show types (public, private, group, interactive)
4. `20240523000029_safety_moderation.sql` - Safety features & moderation system

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20240523000025_revenue_splits.sql
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste each migration file content
5. Run them in order (25 → 27 → 28 → 29)

### Option 3: Using Migration Script

```bash
# Run the automated migration script
npm run migrate
```

## Migration Order (IMPORTANT!)

Apply in this exact order:

1. **Revenue Splits** (25) - Adds creator payout tiers
2. **Friends System** (27) - Adds friends & messaging restrictions
3. **Show Types** (28) - Adds multiple streaming modes
4. **Safety & Moderation** (29) - Adds safety features

## What Each Migration Does

### Revenue Splits (25)
- Adds `revenue_split` column to profiles (1.0 = 100%)
- Adds `is_founding_creator` flag
- Creates `calculate_creator_payout()` function
- Sets up tiered payout system

### Friends System (27)
- Creates `friends` table (bidirectional)
- Creates `friend_requests` table
- Updates message RLS to require friendship
- Adds helper functions: `are_friends()`, `send_friend_request()`, etc.

### Show Types (28)
- Adds show_type to live_streams (public, private, group, interactive)
- Creates `show_participants` table
- Creates `tips` and `virtual_gifts` tables
- Adds `start_show()` and `join_show()` functions
- Inserts default virtual gifts

### Safety & Moderation (29)
- Creates `reports` table with LGBTQ-specific categories
- Creates `user_warnings` and `user_bans` tables
- Adds privacy and safety settings to profiles
- Creates `support_resources` table with crisis hotlines
- Adds emergency stop functionality
- Inserts default support resources

## Verify Migrations

After applying, verify with these queries:

```sql
-- Check if revenue_split column exists
SELECT revenue_split FROM profiles LIMIT 1;

-- Check if friends table exists
SELECT * FROM friends LIMIT 1;

-- Check if show_type column exists
SELECT show_type FROM live_streams LIMIT 1;

-- Check if reports table exists
SELECT * FROM reports LIMIT 1;

-- Check virtual gifts
SELECT * FROM virtual_gifts;

-- Check support resources
SELECT * FROM support_resources;
```

## Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
# Using Supabase CLI
supabase db reset

# Or manually drop tables in reverse order
DROP TABLE IF EXISTS gift_transactions CASCADE;
DROP TABLE IF EXISTS virtual_gifts CASCADE;
DROP TABLE IF EXISTS tips CASCADE;
-- etc...
```

## Post-Migration Steps

1. **Update Environment Variables** (if needed)
   - Check `.env` file has correct Supabase URL and keys

2. **Test Key Features**
   - Try sending a friend request
   - Test blocking a user
   - Create a test stream with different show types
   - Submit a test report

3. **Seed Data** (Optional)
   - Virtual gifts are auto-inserted
   - Support resources are auto-inserted
   - You may want to add test users

## Common Issues

### Issue: "relation already exists"
**Solution:** That table was already created. Skip that migration or drop the table first.

### Issue: "permission denied"
**Solution:** Make sure you're connected as the database owner.

### Issue: "function already exists"
**Solution:** Drop the function first: `DROP FUNCTION function_name CASCADE;`

## Need Help?

If migrations fail:
1. Check the error message carefully
2. Verify you're on the correct database
3. Check if tables already exist: `\dt` in psql
4. Try applying migrations one at a time

## Backup First!

Before applying migrations to production:

```bash
# Backup your database
supabase db dump -f backup.sql

# Or use Supabase dashboard to create a backup
```

## Region Check

Your Supabase project region:
- Check in Dashboard → Settings → General
- Recommended: `us-west-1` or `us-west-2` for US West Coast
- Can't change region after creation (would need new project)

## Next Steps After Migration

1. Test all new features in development
2. Update your frontend to use new features
3. Deploy to production
4. Monitor for any issues
5. Set up proper age verification service
6. Configure payment processing (Stripe)
