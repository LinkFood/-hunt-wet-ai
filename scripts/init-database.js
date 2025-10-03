// Initialize Supabase database with Hunt Wet AI schema
const fs = require('fs')
const path = require('path')

console.log('🎯 Hunt Wet AI Database Initialization')
console.log('=====================================')

const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database-schema.sql')

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Database schema file not found!')
  process.exit(1)
}

const schema = fs.readFileSync(schemaPath, 'utf8')

console.log('\n📋 Database Schema Ready:')
console.log('- Users table for hunter profiles')
console.log('- Hunting sessions table for all interactions')
console.log('- Success patterns table for learning')
console.log('- Hunting regulations table for legal compliance')
console.log('- ZIP code locations table for local intelligence')
console.log('- AI feedback table for continuous improvement')

console.log('\n🚀 Next Steps:')
console.log('1. Create new Supabase project at https://supabase.com')
console.log('2. Go to SQL Editor in your Supabase dashboard')
console.log('3. Copy and paste the schema from src/lib/database-schema.sql')
console.log('4. Run the SQL to create all tables')
console.log('5. Update .env.local with your Supabase URL and keys')

console.log('\n📋 Schema Preview:')
console.log(schema.substring(0, 500) + '...')

console.log('\n✅ Ready to build the hunting intelligence database!')