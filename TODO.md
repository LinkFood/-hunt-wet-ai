# ✅ Hunt Wet AI - Action Checklist

**Last Updated:** 2025-10-03

---

## 🚀 PHASE 1: DEPLOY & TEST (This Week)

### Deploy to Production
- [ ] Run `vercel login`
- [ ] Run `vercel --prod`
- [ ] Add environment variables in Vercel dashboard:
  - [ ] OPENAI_API_KEY
  - [ ] OPENWEATHER_API_KEY
  - [ ] NEXT_PUBLIC_OPENWEATHER_API_KEY
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Test production URL works
- [ ] Share URL with 2-3 hunting buddies

### Verify Supabase Works
- [ ] Log into Supabase dashboard
- [ ] Check if tables exist:
  - [ ] hunting_sessions
  - [ ] hunt_outcomes
  - [ ] success_patterns
- [ ] Test creating a session from production
- [ ] Test logging an outcome
- [ ] Verify data appears in Supabase

---

## 🔧 PHASE 2: WIRE LIVE DATA (Next Few Days)

### Fix Weather Tab
- [ ] Open `src/app/page.tsx` (line 226-254)
- [ ] Replace hardcoded alerts with call to `/api/test-weather`
- [ ] Display real weather data
- [ ] Test on mobile

### Fix Intel Tab
- [ ] Open `src/app/page.tsx` (line 258-290)
- [ ] Connect to `/api/wildlife-data`
- [ ] Connect to `/api/social-intel`
- [ ] Display real data or remove if not ready

### Test Outcome Tracking
- [ ] Chat with AI, get hunting advice
- [ ] Click "Log Outcome" buttons
- [ ] Verify data saves to Supabase
- [ ] Check if outcome appears in database

---

## 📊 PHASE 3: BUILD LEARNING SYSTEM (Next 2-4 Weeks)

### Pattern Recognition
- [ ] Write Supabase query to get successful hunts by ZIP
- [ ] Write query to get weather patterns for successes
- [ ] Aggregate data by conditions (temp, pressure, moon phase)
- [ ] Pass patterns to GPT prompt

### Update AI Prompt
- [ ] Modify `src/lib/openai.ts` to include historical patterns
- [ ] Add "Based on X logged hunts in your area..." context
- [ ] Test that advice changes based on logged outcomes

### Add Analytics
- [ ] Create simple stats page
- [ ] Show: Total hunts logged
- [ ] Show: Success rate %
- [ ] Show: Best conditions for success

---

## 🎯 PHASE 4: FRIENDS-FIRST TESTING (Next 1-3 Months)

### Invite & Track
- [ ] Get 5-10 hunting buddies using it
- [ ] Have them log 20+ hunts each
- [ ] Collect feedback on UX
- [ ] Fix bugs and annoyances

### Measure Success
- [ ] Calculate prediction accuracy
- [ ] Get testimonials from friends
- [ ] Document success rate improvements
- [ ] Video demos of field use

---

## 🔒 SECURITY TASKS (Before Public Launch)

- [ ] Rotate OpenAI API key (current one exposed)
- [ ] Set up Supabase RLS policies
- [ ] Add rate limiting to APIs
- [ ] Implement user authentication
- [ ] Write terms of service
- [ ] Add privacy policy

---

## 💡 OPTIONAL IMPROVEMENTS (Nice to Have)

### Mobile UX
- [ ] Test with gloves on
- [ ] Test in cold weather
- [ ] Add offline mode
- [ ] Optimize for poor cell signal
- [ ] Add home screen install prompt

### Notifications
- [ ] Set up push notifications
- [ ] Alert users to prime hunting times
- [ ] Send cold front alerts
- [ ] Daily hunting forecast

### Social Features
- [ ] Add hunting buddy invites
- [ ] Share hunts within friend group
- [ ] Local leaderboards
- [ ] Success story feed

---

## 📝 NOTES

### Current Status:
- ✅ Dead code removed (81% reduction)
- ✅ Build passing
- ✅ Ready to deploy
- 🚧 Weather/Intel tabs need API wiring
- 🚧 Outcome tracking needs backend

### Immediate Blockers:
1. Need to deploy to Vercel
2. Need to verify Supabase tables exist
3. Need to wire Weather/Intel tabs

### Data Moat Strategy:
- Every logged hunt = competitive advantage
- Focus on 5-10 friends first
- Build 50+ logged hunts before public launch
- Big players can't replicate data quickly

---

## 🎯 SUCCESS DEFINITION

You'll know you're ready for public launch when:

- ✅ 5+ hunting buddies actively using it
- ✅ 50+ hunts logged with detailed outcomes
- ✅ Proven 60%+ success rate improvement
- ✅ Testimonials and success stories
- ✅ Mobile UX tested in real field conditions
- ✅ AI advice visibly improving from logged data

**Until then: Keep it friends-only and build your data moat!**

---

**Last reviewed:** 2025-10-03
