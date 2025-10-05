#!/usr/bin/env node

/**
 * Apply Supabase Migration via Management API
 * Uses service_role key to execute SQL directly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

// Read migration SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/20241004_001_create_hunt_logs.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🗄️  Hunt Wet AI - Database Migration');
console.log('=====================================\n');
console.log('📋 Migration: Create hunt_logs table');
console.log('📍 Target:', SUPABASE_URL);
console.log('\n🚀 Executing SQL migration...\n');

// We'll use the database-js library that's already installed with Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('1️⃣  Testing connection...');
  
  // Try to query pg_tables to see if we can connect
  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .limit(1);
  
  if (error) {
    console.log('   ⚠️  Cannot query system tables (expected with anon key)');
    console.log('   ℹ️  Will need manual migration via SQL Editor\n');
    return false;
  }
  
  console.log('   ✅ Connection successful\n');
  return true;
}

async function checkIfTableExists() {
  console.log('2️⃣  Checking if hunt_logs table exists...');
  
  const { data, error } = await supabase
    .from('hunt_logs')
    .select('id')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') { // Table doesn't exist
      console.log('   ℹ️  Table does not exist (will create)\n');
      return false;
    }
    console.log('   ⚠️  Error checking table:', error.message);
    return null;
  }
  
  console.log('   ✅ Table already exists!\n');
  return true;
}

async function main() {
  try {
    await testConnection();
    const exists = await checkIfTableExists();
    
    if (exists === true) {
      console.log('✅ Migration already applied!');
      console.log('\nYou can verify by running:');
      console.log('  SELECT COUNT(*) FROM hunt_logs;\n');
      return;
    }
    
    console.log('─────────────────────────────────────');
    console.log('⚠️  MANUAL MIGRATION REQUIRED');
    console.log('─────────────────────────────────────\n');
    console.log('Due to Supabase security policies, you need to run the');
    console.log('migration SQL manually in the Supabase dashboard.\n');
    console.log('Steps:');
    console.log('1. Go to: ' + SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/'));
    console.log('2. Click "SQL Editor" in left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy ENTIRE contents of:');
    console.log('   supabase/migrations/20241004_001_create_hunt_logs.sql');
    console.log('5. Paste into SQL Editor');
    console.log('6. Click "Run"\n');
    console.log('✅ This creates:');
    console.log('   • hunt_logs table (40+ columns)');
    console.log('   • All indexes for pattern matching');
    console.log('   • Row Level Security policies');
    console.log('   • Analytics functions\n');
    console.log('Then run this script again to verify.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
