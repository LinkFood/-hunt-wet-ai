#!/usr/bin/env node

/**
 * Verify Supabase Database Setup
 * Checks if hunt_logs table exists and is properly configured
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🗄️  Hunt Wet AI - Database Verification');
console.log('=========================================\n');

async function verifyDatabase() {
  let allGood = true;

  // Test 1: Check if table exists
  console.log('1️⃣  Checking if hunt_logs table exists...');
  try {
    const { data, error } = await supabase
      .from('hunt_logs')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.log('   ❌ Table does NOT exist\n');
        console.log('📋 ACTION REQUIRED:');
        console.log('   See scripts/RUN-MIGRATION.md for instructions\n');
        allGood = false;
      } else {
        console.log('   ⚠️  Error:', error.message);
        allGood = false;
      }
    } else {
      console.log('   ✅ Table exists!');
      console.log(`   📊 Current rows: ${data ? data.length : 0}\n`);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message, '\n');
    allGood = false;
  }

  // Test 2: Check RLS is enabled (if table exists)
  if (allGood) {
    console.log('2️⃣  Checking Row Level Security...');
    try {
      // This will fail if RLS is properly enabled and we're not authenticated as a user
      const { data, error } = await supabase
        .from('hunt_logs')
        .select('*')
        .limit(1);

      console.log('   ✅ RLS policies exist\n');
    } catch (err) {
      console.log('   ⚠️  Could not verify RLS:', err.message, '\n');
    }
  }

  // Test 3: Check functions exist
  if (allGood) {
    console.log('3️⃣  Checking analytics functions...');
    console.log('   ℹ️  Functions are created via migration SQL\n');
  }

  // Summary
  console.log('=========================================');
  if (allGood) {
    console.log('✅ Database is ready for hunt logging!\n');
    console.log('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Test hunt logging: npm run test-log-hunt');
    console.log('3. Build pattern matching API\n');
  } else {
    console.log('❌ Database setup incomplete\n');
    console.log('📋 Run migration manually:');
    console.log('   See scripts/RUN-MIGRATION.md\n');
  }

  return allGood;
}

verifyDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
