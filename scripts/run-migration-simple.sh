#!/bin/bash

# Load environment variables
source .env.local 2>/dev/null || true

echo "=========================================="
echo "🗄️  Supabase Migration Runner"
echo "=========================================="
echo ""
echo "Migration: hunt_logs table creation"
echo ""
echo "⚠️  NOTE: Due to Supabase API limitations, you need to:"
echo ""
echo "1. Go to: https://lpiuiyymmqyrxmleacov.supabase.co/project/lpiuiyymmqyrxmleacov/sql/new"
echo ""
echo "2. Copy the ENTIRE contents of:"
echo "   supabase/migrations/20241004_001_create_hunt_logs.sql"
echo ""
echo "3. Paste into SQL Editor"
echo ""
echo "4. Click 'Run'"
echo ""
echo "✅ This creates:"
echo "   - hunt_logs table (40+ columns)"
echo "   - All indexes for pattern matching"
echo "   - Row Level Security policies"
echo "   - Analytics functions (get_success_rate_by_pressure, etc.)"
echo ""
echo "=========================================="
echo ""

# Let's try to verify connection at least
echo "🔍 Testing Supabase connection..."
echo ""

curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Supabase connection successful"
  echo ""
  echo "Project URL: $NEXT_PUBLIC_SUPABASE_URL"
  echo "SQL Editor: https://lpiuiyymmqyrxmleacov.supabase.co/project/lpiuiyymmqyrxmleacov/sql/new"
else
  echo "❌ Could not connect to Supabase"
  echo "Check your credentials in .env.local"
fi

echo ""
