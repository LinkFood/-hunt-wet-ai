# 🗄️ Database Migration - Step by Step

## Step 1: Open the SQL File
In your code editor, open this file:
```
supabase/migrations/20241004_002_create_hunt_logs_fixed.sql
```

## Step 2: Select All and Copy
- Press `Cmd+A` (select all)
- Press `Cmd+C` (copy)

## Step 3: Open Supabase SQL Editor
Click this link:
```
https://supabase.com/dashboard/project/lpiuiyymmqyrxmleacov/sql/new
```

## Step 4: Paste the SQL
- Click in the SQL editor (the big text box)
- Press `Cmd+V` (paste)
- You should see a LOT of SQL code (270 lines)

## Step 5: Run It
- Click the green "Run" button (bottom right)
- Wait 2-3 seconds

## Step 6: Check Result
You should see at the bottom:
```
Success. No rows returned
```

## Step 7: Verify It Worked
Back in your terminal, run:
```bash
npm run verify-db
```

You should see:
```
✅ Table exists!
✅ Database is ready for hunt logging!
```

---

## That's It!

If you see ✅ from `npm run verify-db`, you're done!

If you see ❌ or errors, take a screenshot and send it.
