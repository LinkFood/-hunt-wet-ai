#!/usr/bin/env node

/**
 * Run Supabase Migration Script
 * Executes the hunt_logs migration SQL
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('📋 Reading migration file...')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241004_001_create_hunt_logs.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    console.log('🚀 Executing migration...\n')

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Log statement type
      const firstLine = statement.trim().split('\n')[0]
      console.log(`[${i + 1}/${statements.length}] ${firstLine.substring(0, 60)}...`)

      try {
        // Use raw SQL execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        })

        if (!response.ok) {
          const error = await response.text()
          console.error(`   ❌ Error: ${error}`)
          errorCount++
        } else {
          console.log('   ✅ Success')
          successCount++
        }
      } catch (error) {
        console.error(`   ❌ Exception: ${error.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration complete: ${successCount} succeeded, ${errorCount} failed`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be okay if:')
      console.log('   - Extensions already exist')
      console.log('   - Tables/functions already exist')
      console.log('   - You need to run this in Supabase SQL Editor instead')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
