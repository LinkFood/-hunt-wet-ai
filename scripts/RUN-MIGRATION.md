# 🗄️ Run Supabase Migration

## Status: ❌ hunt_logs table does NOT exist

**Verified:** Table not found in schema cache (PGRST205)

---

## ✅ REQUIRED ACTION: Run SQL Migration Manually

Due to Supabase API security policies, complex migrations must be run via SQL Editor.

### Steps:

**1. Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/lpiuiyymmqyrxmleacov/sql/new
```

**2. Copy ENTIRE contents of:**
```
supabase/migrations/20241004_001_create_hunt_logs.sql
```

**3. Paste into SQL Editor**

**4. Click "RUN" button**

---

## What This Creates:

✅ **hunt_logs table** (40+ columns)
- Hunt details (date, time, location, species, outcome)
- Complete weather snapshot (temp, humidity, dew point, conditions)
- Barometric pressure history (current, 1hr, 3hr, 6hr ago + trends)
- Wind data (speed, gust, direction, degrees)
- Precipitation data
- Sun timing (sunrise, sunset, minutes from each)
- Lunar data (phase, illumination, age, solunar score)
- User notes and photos

✅ **Indexes** for fast pattern matching:
- User + date
- User + species + outcome
- Pressure trend (for successful hunts only)
- Temperature (for successful hunts only)
- Moon phase (for successful hunts only)
- Wind direction (for successful hunts only)

✅ **Row Level Security (RLS) Policies:**
- Users can ONLY see their own hunt logs
- Users can ONLY modify their own data
- Automatic security even if API key is compromised

✅ **Built-in Analytics Functions:**
- `get_success_rate_by_pressure(user_id, species)` - Success rate by pressure trend
- `get_success_rate_by_moon_phase(user_id, species)` - Success rate by moon phase
- `find_similar_hunts(user_id, species, temp, pressure, moon, limit)` - Find past hunts with similar conditions

---

## After Migration Success:

Run verification:
```bash
npm run verify-db
```

Or manually verify in SQL Editor:
```sql
-- Check table exists
SELECT COUNT(*) FROM hunt_logs;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'hunt_logs';

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%success_rate%';
```

---

## Why Manual Migration?

Supabase requires database changes to be executed with proper authentication in their dashboard for security. The REST API (PostgREST) is read-only by design and doesn't support DDL operations like CREATE TABLE, CREATE INDEX, etc.

This is a **one-time setup**. Once the table exists, all hunt logging happens via API automatically.

---

## Next Steps After Migration:

1. ✅ Verify migration with `npm run verify-db`
2. 🧪 Test hunt logging API: `npm run test-log-hunt`
3. 🎯 Build pattern matching API
4. 📊 Build hunt entry UI
5. 🚀 Deploy to Vercel production

---

**🎯 This is the foundation. Do it once, do it right.**
