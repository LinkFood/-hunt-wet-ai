# Supabase Setup Guide - Hunt Wet AI

**Production-grade database setup. Do this ONCE, do it RIGHT.**

---

## 🎯 Prerequisites

1. Supabase account (free tier works for development)
2. Project created at https://supabase.com/dashboard

---

## 📋 Step-by-Step Setup

### 1. Get Your Supabase Credentials

Go to your Supabase project → Settings → API

Copy these values:
```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. Run Database Migration

**Go to:** Supabase Dashboard → SQL Editor → New Query

**Copy and paste the ENTIRE contents of:**
```
supabase/migrations/20241004_001_create_hunt_logs.sql
```

**Click "Run"**

✅ This creates:
- `hunt_logs` table with 40+ columns
- All indexes for fast pattern matching
- Row Level Security policies
- Built-in analytics functions

---

### 3. Verify Setup

**Test 1: Check table exists**
```sql
SELECT COUNT(*) FROM hunt_logs;
```
Should return: `0` (table is empty but exists)

**Test 2: Check RLS is enabled**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'hunt_logs';
```
Should return: `rowsecurity = true`

**Test 3: Check functions exist**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%success_rate%';
```
Should return: `get_success_rate_by_pressure`, `get_success_rate_by_moon_phase`

---

### 4. Set Up Authentication

**Option A: Email/Password (Simple)**

Go to: Authentication → Settings → Email Auth

Enable: Email confirmations = **OFF** (for development)

**Option B: Anonymous Auth (Simplest for testing)**

Go to: Authentication → Settings → Anonymous Sign-Ins

Enable: **ON**

Then in your app:
```typescript
const { data } = await supabase.auth.signInAnonymously()
const userId = data.user?.id
```

**Option C: Magic Link (Best for production)**

Go to: Authentication → Settings → Email Auth

Enable: Magic Links = **ON**

---

### 5. Test Insert (Manual)

Go to: SQL Editor → New Query

```sql
-- Create test user (if you don't have one)
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert test hunt log
INSERT INTO hunt_logs (
  user_id,
  hunt_date,
  hunt_time,
  location_name,
  latitude,
  longitude,
  species,
  outcome,
  animals_seen,
  animals_killed,
  temperature,
  feels_like,
  humidity,
  dew_point,
  barometric_pressure,
  pressure_trend,
  pressure_change_3hr,
  wind_speed,
  wind_direction,
  wind_degrees,
  precipitation_amount,
  precipitation_type,
  cloud_cover,
  visibility,
  conditions,
  sunrise,
  sunset,
  minutes_from_sunrise,
  minutes_from_sunset,
  moon_phase,
  moon_illumination,
  solunar_score,
  user_notes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '2024-10-15',
  '06:30:00',
  'Towson, MD',
  39.4,
  -76.6,
  'deer',
  'success',
  3,
  1,
  58.0,
  54.0,
  68.0,
  48.0,
  1018.0,
  'falling',
  -2.5,
  8.0,
  'NW',
  315,
  0.0,
  'none',
  40.0,
  10.0,
  'Clear',
  '07:12:00',
  '18:45:00',
  -42,
  725,
  'waxing_crescent',
  32,
  7,
  'Perfect morning, saw 3 does, wind was perfect'
);

-- Verify it worked
SELECT
  hunt_date,
  species,
  outcome,
  temperature,
  pressure_trend,
  moon_phase
FROM hunt_logs
LIMIT 1;
```

✅ If this returns data, your database is working!

---

## 🧪 Test the API

Once database is set up, test the hunt logging API:

**Terminal:**
```bash
curl -X POST http://localhost:3000/api/log-hunt \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "hunt_date": "2024-10-01",
    "hunt_time": "06:30:00",
    "location_name": "Towson, MD",
    "latitude": 39.4,
    "longitude": -76.6,
    "species": "deer",
    "outcome": "success",
    "animals_seen": 3,
    "animals_killed": 1,
    "user_notes": "Perfect morning hunt",
    "season": "archery",
    "hunting_method": "stand"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "hunt_id": "uuid-here",
  "message": "✅ Hunt logged successfully with complete environmental snapshot",
  "data": {
    // 40+ data points including weather, pressure trends, moon phase, etc.
  }
}
```

---

## 📊 Use Built-in Analytics Functions

**Get success rate by pressure:**
```sql
SELECT * FROM get_success_rate_by_pressure(
  '00000000-0000-0000-0000-000000000001', -- user_id
  'deer' -- species (or NULL for all species)
);
```

Returns:
```
pressure_trend | total_hunts | successful_hunts | success_rate
---------------|-------------|------------------|-------------
falling        | 12          | 10               | 83.33
steady         | 8           | 5                | 62.50
rising         | 3           | 1                | 33.33
```

**Get success rate by moon phase:**
```sql
SELECT * FROM get_success_rate_by_moon_phase(
  '00000000-0000-0000-0000-000000000001',
  'deer'
);
```

**Find similar past hunts:**
```sql
SELECT * FROM find_similar_hunts(
  '00000000-0000-0000-0000-000000000001', -- user_id
  'deer',                                  -- species
  58.0,                                    -- temperature
  'falling',                               -- pressure_trend
  'waxing_crescent',                       -- moon_phase
  10                                       -- limit
);
```

---

## 🔒 Security Notes

**✅ Row Level Security (RLS) is ENABLED**
- Users can ONLY see their own hunt logs
- Users can ONLY modify their own data
- Even if someone gets your API key, they can't see other users' data

**✅ Data Validation**
- All inputs are validated with CHECK constraints
- Invalid coordinates are rejected
- Invalid outcomes are rejected
- Animals killed can't exceed animals seen

**✅ Cascade Deletes**
- If user deletes their account, their hunt logs are automatically deleted
- No orphaned data

---

## 📈 Scaling Considerations

**Free Tier Limits:**
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users

**When to upgrade to Pro ($25/mo):**
- Database > 500 MB (approximately 50,000+ hunt logs with full data)
- Need daily backups
- Need point-in-time recovery
- Need more compute for complex queries

**At 1,000 users logging 50 hunts/year:**
- 50,000 rows/year
- ~100 MB/year (with full 40+ data points)
- **You can run on free tier for several years**

---

## 🚨 Troubleshooting

**Error: "relation hunt_logs does not exist"**
→ Run the migration SQL in Supabase SQL Editor

**Error: "new row violates row-level security policy"**
→ Make sure you're authenticated and using correct user_id

**Error: "permission denied for function"**
→ Re-run the GRANT statements at bottom of migration

**Error: "VISUAL_CROSSING_API_KEY not set"**
→ Add API key to `.env.local` and restart dev server

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables in `.env.local`
- [ ] Migration SQL executed successfully
- [ ] `hunt_logs` table exists
- [ ] RLS policies are active
- [ ] Analytics functions created
- [ ] Test insert works manually
- [ ] API test returns success
- [ ] Can query hunt logs

---

## 🎯 You're Done!

Database is production-ready. Never need to touch this again unless:
1. Adding new features (new columns/tables)
2. Scaling beyond 50k users (upgrade to Pro)
3. Adding more analytics functions

**The foundation is SOLID. Build on it for 25 years.**
