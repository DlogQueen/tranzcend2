# Tranzcend X - Deployment Guide

## Current Setup
- **Database**: Supabase (PostgreSQL)
- **Region**: US East (can be changed)
- **Project URL**: https://prmpnnylrcmwixggwiei.supabase.co

## Recommended: Move to US West Region

### Why US West?
1. **Nevada proximity** - Most permissive adult content laws
2. **Lower latency** for West Coast users
3. **Oregon/California** - Better privacy laws
4. **Closer to target market**

### How to Change Region

**Option 1: Stay on Current Project (Easiest)**
- Current project is already set up
- Just run migrations to update database
- No region change needed immediately

**Option 2: Create New US West Project**
1. Go to https://supabase.com/dashboard
2. Create new project
3. Choose region: `us-west-1` (Oregon)
4. Run all migrations on new project
5. Update `.env` with new credentials

## Running Migrations

### Local Development
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref prmpnnylrcmwixggwiei

# Run migrations
supabase db push

# Or run specific migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.prmpnnylrcmwixggwiei.supabase.co:5432/postgres" -f supabase/migrations/20240523000030_subscription_features.sql
```

### Production Deployment

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/prmpnnylrcmwixggwiei/editor
2. Click "SQL Editor"
3. Copy/paste migration files one by one
4. Run in order (by filename number)

**Using Supabase CLI:**
```bash
# Push all pending migrations
supabase db push
```

## Environment Variables

### Current `.env` (Development)
```env
VITE_SUPABASE_URL=https://prmpnnylrcmwixggwiei.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEEPAR_API_KEY=671a79a835115da86883aa50dfeb368ea91ceab15a627ef2e2158fe44a23603fc61e519f1fb0d00a
```

### Production `.env` (Vercel)
Set these in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEEPAR_API_KEY`

## Vercel Deployment

### Current Setup
- Connected to Vercel
- Auto-deploys from Git

### Deploy Command
```bash
npm run build
```

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Database Migrations Status

### Completed Migrations
✅ 00-24: Core features (profiles, posts, messages, etc.)
✅ 25: Revenue splits (100% for founding creators)
✅ 26: Live streaming infrastructure
✅ 27: Friends system (Facebook-style)
✅ 28: Show types (public, private, group, interactive)
✅ 29: Safety & moderation system
✅ 30: Subscription features (PPV, tip menus, stories)

### To Run
```bash
# Run all migrations
supabase db push

# Or manually in SQL Editor
# Copy each file from supabase/migrations/ and run in order
```

## Legal Compliance Setup

### Age Verification
1. Integrate ID verification service:
   - Yoti (https://www.yoti.com)
   - Jumio (https://www.jumio.com)
   - Onfido (https://onfido.com)

2. Update verification flow:
   - Require government ID upload
   - Verify age 18+
   - Store verification status (already in DB)

### 2257 Compliance
1. Designate custodian of records
2. Store performer IDs securely
3. Display 2257 statement on site
4. Keep records for 7 years

### Terms of Service
- Require 18+ for all users
- Prohibit illegal content
- DMCA takedown process
- Privacy policy (GDPR/CCPA compliant)

## Recommended Next Steps

1. **Run Migrations** (30 minutes)
   ```bash
   supabase db push
   ```

2. **Test Features** (1 hour)
   - Create test accounts
   - Test friend requests
   - Test messaging
   - Test creator features

3. **Set Up Age Verification** (1 week)
   - Choose provider (Yoti recommended)
   - Integrate API
   - Update verification page

4. **Legal Setup** (1-2 weeks)
   - Form LLC in Nevada/Delaware
   - Get business license
   - Set up payment processing (Stripe)
   - Create Terms of Service

5. **Launch Marketing** (Ongoing)
   - Social media presence
   - Reach out to creators
   - Offer founding creator program (100% payouts)

## Support & Monitoring

### Supabase Dashboard
- Monitor database: https://supabase.com/dashboard/project/prmpnnylrcmwixggwiei
- View logs
- Check API usage
- Manage storage

### Error Tracking
- Set up Sentry or similar
- Monitor Vercel logs
- Track user reports

## Backup Strategy

### Automatic Backups
- Supabase backs up daily
- Point-in-time recovery available

### Manual Backup
```bash
# Export database
pg_dump "postgresql://postgres:[PASSWORD]@db.prmpnnylrcmwixggwiei.supabase.co:5432/postgres" > backup.sql
```

## Scaling Considerations

### When to Upgrade
- 10,000+ users: Consider dedicated database
- 100+ concurrent streams: Need CDN for video
- International users: Multi-region setup

### CDN Setup
- Cloudflare (recommended)
- AWS CloudFront
- Bunny CDN (adult-friendly)

## Questions?
Contact: [Your support email]
