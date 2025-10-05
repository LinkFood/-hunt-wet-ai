# 🦌 Hunt Wet AI - Personal Hunting Intelligence Engine

**The world's first crowd-sourced hunting intelligence platform**

> "Build it for me first. If it works for me, it works for anyone."

---

## 🎯 The Vision

**Hunt Wet AI** is a personal hunting intelligence engine that captures every detail of your hunts, analyzes patterns in your success, and alerts you when conditions match your proven winners.

**It's NOT a prediction tool.** It's a pattern recognition system based on YOUR actual data.

### The Problem We're Solving:

Right now, if you want to hunt ducks in Louisiana next week, you need to visit:
- State DNR website (regulations, seasons, zones)
- Weather forecast sites (temperature, wind, rain)
- Moon phase calculators
- Solunar tables
- Migration trackers
- Public land maps
- License purchase sites
- ...and 20+ other sources

**Hunt Wet AI pulls it all into one place.**

But more importantly: **It learns from YOUR hunts to show you when conditions match your proven success.**

---

## 🧠 How It Works

### 1. **Log Every Hunt**
Simple form: Date, time, location, species, outcome, notes.

### 2. **We Capture Everything**
When you log a hunt, we automatically capture **40+ environmental data points** at that exact moment:
- Temperature, feels like, humidity, dew point
- Barometric pressure (current, 1hr ago, 3hr ago, 6hr ago)
- Pressure trend (rising/falling/steady) and rate of change
- Wind speed, gusts, direction
- Precipitation, cloud cover, visibility
- Moon phase, illumination, solunar score
- Sunrise/sunset times, minutes from sunrise
- And more...

### 3. **Pattern Matching**
After 10+ logged hunts, we analyze YOUR success patterns:
- "Your success rate when pressure is falling: 89%"
- "Your best temperature range: 52-64°F"
- "Your best moon phase: Waxing crescent"
- "Your best wind direction: NW"

### 4. **Smart Alerts**
We check the next 7 days' forecast and alert you when conditions match your patterns:

```
🔔 PATTERN ALERT

Tuesday, Oct 22 conditions match your proven success pattern:

✓ Falling pressure (appears in 89% of your kills)
✓ 58°F (your 71% success range: 52-64°F)
✓ Waxing moon (appears in 76% of your kills)
✓ NW wind (your best direction)

Similar past hunts:
  • Oct 15, 2023 - 1 kill
  • Nov 2, 2022 - 2 kills
  • Oct 28, 2021 - 1 kill

Your success rate under these conditions: 83% (10 of 12 hunts)
```

### 5. **Ask Anything**
"Perplexity for hunting" - Ask any question:
- "Duck hunting Mississippi October 30"
- "Best public land for deer in Maryland"
- "When is turkey season in PA?"

GPT-4o searches the web, finds official sources, and gives you a comprehensive answer with citations.

---

## 💎 The Data Moat

**This is the $1M asset:**

After 25 years with 1,000 logged hunts = 40,000+ data points about YOUR patterns.

But it scales:
- 10,000 users × 100 hunts = **1 MILLION data points**
- Decode species behavior patterns
- Prove hunting myths right or wrong
- "Whitetail deer: 82% success during falling pressure + waxing moon"

**No one can replicate this dataset.** It takes years of users logging real hunts.

### Future Applications:
- Wildlife biologists pay for population insights
- State DNRs want harvest data analysis
- Conservation orgs need migration patterns
- **This architecture works for ANY outdoor activity** (fishing, surfing, skiing, birding)

---

## 🏗️ Technical Architecture

### Premium Stack:
- **Next.js 15** + React 19 + TypeScript
- **GPT-4o** with web search ($300/mo)
- **Visual Crossing Weather API** Timeline plan ($249/mo)
  - Historical weather data (backfill past hunts)
  - 15-day hourly forecasts
  - Minute-by-minute precipitation
  - Pressure trends, wind gusts
- **Supabase** PostgreSQL ($0-25/mo)
- **RainViewer** Live radar (free)
- **Vercel** Hosting (free)

**Total: ~$350-574/month** (worth it for premium data quality)

### Database Schema:

**hunt_logs table** - Complete snapshot of every hunt
```sql
- Hunt details (date, time, location, species, outcome, notes)
- Weather snapshot (40+ data points at exact hunt time)
- Lunar data (phase, illumination, solunar score)
- Time context (sunrise/sunset, minutes from sunrise)
- User notes, photos
```

**user_patterns table** - Pre-computed patterns for fast lookups
```sql
- Success rates by pressure trend
- Success rates by temperature range
- Success rates by moon phase
- Best wind directions
- Best times of day
- Best locations
```

**pattern_alerts table** - Track alerts sent
**calendar_reminders table** - Future hunt dates to monitor

See `DATABASE_SCHEMA.md` for complete schema.

---

## 🚀 Development Roadmap

### Phase 1: Foundation (Week 1) ✅
- Set up Visual Crossing Weather API
- Create Supabase tables
- Build hunt logging system
- Create simple hunt log form
- **Goal:** Log first hunt with full data capture

### Phase 2: Pattern Matching (Week 2)
- Build pattern recognition engine
- Create pattern display UI
- "Check conditions" feature for upcoming days
- **Goal:** After 10 logs, see success rate analysis

### Phase 3: Smart Alerts (Week 3)
- Daily cron job checks next 7 days
- Match forecast to user patterns
- Web push notifications
- **Goal:** Receive first pattern alert

### Phase 4: GPT-4o Web Search (Week 4)
- Rebuild chat with web search tools
- Source citations
- "Log this hunt?" integration
- **Goal:** Ask any hunting question, get sourced answer

### Phase 5: Scale (Weeks 5-6)
- User authentication
- Invite 5-10 friends
- Mobile polish
- Historical data backfill
- **Goal:** 10 users, 100+ logs, proven patterns

---

## 📊 Success Metrics

### Personal Success (Phase 1-2):
- [ ] Logged 10+ hunts with full data
- [ ] See "Your success rate when pressure is falling: X%"
- [ ] Pattern matching finds similar past hunts

### Product Success (Phase 3-4):
- [ ] Received pattern alert
- [ ] Alert showed matching conditions
- [ ] Asked complex hunting question, got sourced answer

### Scale Success (Phase 5):
- [ ] 5-10 friends actively using
- [ ] 100+ total hunt logs
- [ ] Community patterns emerging

---

## 🎮 Getting Started (Development)

### Prerequisites:
```bash
Node.js 18+
npm or yarn
Supabase account
Visual Crossing Weather API key
OpenAI API key (GPT-4o access)
```

### Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
VISUAL_CROSSING_API_KEY=your_visual_crossing_key
```

### Installation:
```bash
cd hunt-wet-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
/src
  /app
    /api
      /log-hunt         - Log hunt with full environmental snapshot
      /get-patterns     - Get user's success patterns
      /check-conditions - Check upcoming conditions vs patterns
      /chat             - GPT-4o with web search
    page.tsx            - Main interface
    layout.tsx          - Root layout
  /lib
    weather-visual-crossing.ts  - Visual Crossing API client
    lunar.ts                    - Moon phase calculations
    pattern-matching.ts         - Pattern recognition engine
    hunt-logger.ts              - Comprehensive logging system
    supabase.ts                 - Supabase client
  /components
    HuntLogForm.tsx     - Simple hunt entry form
    PatternDisplay.tsx  - Show matched patterns
    ConditionsCard.tsx  - Display conditions
    AlertCard.tsx       - Pattern alert display
```

---

## 🔐 Privacy & Data

**Your data is YOUR data.**

- All hunt logs are private (Row Level Security)
- Only you see your patterns
- Aggregate community insights are anonymized
- Export your data anytime
- Delete your account anytime

**We never share:**
- Your exact hunting locations
- Your specific hunt times
- Your identifiable data

**We may share (anonymized, aggregated):**
- "Maryland deer hunters: 82% success during falling pressure"
- "Turkey hunters nationwide: Peak activity 28 min after sunrise"

---

## 💰 Business Model (Future)

### Freemium:
- **Free:** 5 questions/month, log hunts, basic patterns
- **Pro ($9.99/mo):** Unlimited questions, advanced patterns, alerts, historical analysis

### Data Licensing:
- Sell aggregated insights to wildlife agencies, researchers, conservation orgs

### Affiliate Revenue:
- OnX Maps partnership
- License sales commissions
- Hunting gear recommendations

---

## 🤝 Contributing

**Currently private development** (building proof of concept).

Will open source pattern matching engine after launch.

---

## 📞 Contact

**James Chellis**
- Email: jayhillendalepress@gmail.com
- Project: Hunt Wet AI

---

## 📄 License

Proprietary (for now)

---

## 🎯 The Mission

**"Make hunters more successful by learning from their own data."**

No more guessing. No more hunting myths. Just YOUR data showing YOU what actually works.

In 25 years with 1,000 logged hunts, you'll know EXACTLY when to hunt.

That's the dream. Let's build it.

---

**Last Updated:** October 4, 2024
**Version:** 2.0 (Complete rebuild)
**Status:** Phase 1 - Foundation in progress
