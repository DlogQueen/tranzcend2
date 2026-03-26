#!/bin/bash

# Tranzcend X - Database Migration Script
# This script applies all pending migrations to your Supabase database

set -e  # Exit on error

echo "🚀 Tranzcend X - Database Migration"
echo "===================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "⚠️  Project not linked!"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo "📦 Project: $PROJECT_REF"
echo ""

# List migrations
echo "📋 Pending migrations:"
echo "  1. Revenue Splits (Creator payouts)"
echo "  2. Friends System (Facebook-style)"
echo "  3. Show Types (Public, Private, Group, Interactive)"
echo "  4. Safety & Moderation (Reports, bans, support)"
echo ""

read -p "Apply all migrations? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Applying migrations..."
echo ""

# Apply migrations in order
MIGRATIONS=(
    "20240523000025_revenue_splits.sql"
    "20240523000027_friends_system.sql"
    "20240523000028_show_types.sql"
    "20240523000029_safety_moderation.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "📝 Applying: $migration"
    if supabase db push --file "supabase/migrations/$migration"; then
        echo "✅ Success: $migration"
    else
        echo "❌ Failed: $migration"
        echo "Check the error above and fix before continuing"
        exit 1
    fi
    echo ""
done

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify in Supabase Dashboard"
echo "  2. Test new features locally"
echo "  3. Deploy frontend updates"
echo ""
