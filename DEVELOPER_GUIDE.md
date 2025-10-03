# 🛠 Hunt Wet AI - Developer Guide

> **Complete technical documentation for developers taking over this project**

## 🎯 What This System Does

Hunt Wet AI is a predictive hunting intelligence platform that combines:
- Real-time weather data (OpenWeatherMap API)
- Lunar/solunar calculations (Moon phase API)
- AI hunting expertise (OpenAI GPT-4o-mini)
- Data learning system (Supabase database)

**Input:** "I want to hunt deer in 80424 this weekend"
**Output:** "Based on current conditions (42°F, rising pressure, First Quarter moon), hunt Saturday 6:15-8:00am at your oak ridge location. 87% success probability."

## 🔧 System Components

### 1. Frontend (`src/app/` and `src/components/`)
**What it does:** User interface and chat system
**Key files:**
- `src/app/page.tsx` - Main landing page with chat interface
- `src/components/HuntingChat.tsx` - Chat UI component
- `src/app/layout.tsx` - App shell and styling

**How it works:**
1. User types hunting question
2. Component calls `/api/hunting-advice`
3. Displays AI response with real-time typing effect
4. Handles loading states and errors

### 2. AI Engine (`src/lib/openai.ts`)
**What it does:** Main intelligence system that combines all data
**Key functions:**
- `getHuntingAdvice()` - Main function that processes everything
- Extracts ZIP codes from user messages
- Fetches weather and lunar data
- Combines with AI to generate advice
- Logs conversations to database

**Data flow:**
```
User Message → Extract ZIP → Get Weather → Get Lunar → AI Processing → Response
```

### 3. Weather Intelligence (`src/lib/weather.ts`)
**What it does:** Real-time weather data with hunting analysis
**Key functions:**
- `getWeatherForHunting(zipCode)` - Main weather intelligence
- `calculateHuntingScore()` - Converts weather to 1-10 hunting score
- `findPrimeHuntingDays()` - Identifies best days in forecast

**Hunting Score Algorithm:**
```javascript
Base score: 5
+ High pressure (>1020mb): +2
+ Low pressure (<1000mb): +1
+ Cool temps (<45°F): +1
+ Light wind (5-15mph): +1
+ Clear/overcast: +1
+ Rain/storms: -1
```

### 4. Lunar Intelligence (`src/lib/lunar.ts`)
**What it does:** Moon phases and solunar feeding times
**Key functions:**
- `getMoonPhaseForDate()` - Gets current moon phase
- `getSolunarDataForHunting()` - Calculates feeding times
- `calculateSolunarScore()` - Lunar impact on hunting success

**Solunar Logic:**
- New/Full moon = peak activity (score +3)
- Quarter moons = good activity (score +2)
- Waxing phases better than waning (score +1)

### 5. Database Layer (`src/lib/supabase.ts`)
**What it does:** Data storage and retrieval
**Key tables:**
- `hunting_sessions` - Every conversation logged
- Stores user messages, AI responses, weather data, lunar data
- Used for learning and pattern recognition

## 🔌 API Endpoints

### `/api/hunting-advice` (POST)
**Main AI endpoint**
```javascript
// Input
{
  "userMessage": "Hunt deer in 12345 tomorrow?",
  "zipCode": "12345",        // optional
  "gameType": "deer",        // optional
  "huntDate": "2025-01-15"   // optional
}

// Output
{
  "advice": "Based on current conditions..."
}
```

### `/api/test-weather` (GET)
**Weather testing endpoint**
```
GET /api/test-weather?zip=10001
Returns: Complete weather intelligence for ZIP code
```

### `/api/test-lunar` (GET)
**Lunar testing endpoint**
```
GET /api/test-lunar
Returns: Current moon phase and solunar data
```

### `/api/hunting-sessions` (GET)
**View logged data**
```
GET /api/hunting-sessions
Returns: Recent hunting sessions with full data
```

## 📊 Data Storage Schema

### hunting_sessions table
```sql
CREATE TABLE hunting_sessions (
    id UUID PRIMARY KEY,
    user_id UUID,
    created_at TIMESTAMP,
    zip_code TEXT,
    game_type TEXT,
    hunt_date TEXT,
    user_message TEXT,
    ai_response TEXT,
    ai_confidence_score INTEGER,
    weather_data JSONB,      -- Complete weather intelligence
    moon_phase_data JSONB,   -- Complete lunar data
    user_feedback TEXT,
    hunt_outcome TEXT,       -- "success" | "failure" | "partial"
    outcome_details JSONB
);
```

## 🧠 AI Prompting System

The AI uses a sophisticated system prompt that creates a hunting guide persona:

**Key elements:**
- 30+ years hunting experience personality
- Direct, practical advice style
- Specific formatting requirements (line breaks, bullet points)
- Safety and regulation reminders
- Encouraging but realistic tone

**Context provided to AI:**
- Current weather conditions with hunting scores
- Moon phase and solunar predictions
- Local hunting intelligence (when available)
- Success patterns from database
- Hunting regulations (when available)

## 🔧 Setup for New Developers

### 1. Environment Setup
```bash
# Install Node.js 18+
# Clone project
git clone [repo-url]
cd hunt-wet-ai

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with real API keys

# Test system
npm run dev
```

### 2. Get API Keys
**OpenWeather API:**
- Go to: https://openweathermap.org/api
- Sign up for free account
- Get API key (1,000 calls/day free)

**OpenAI API:**
- Go to: https://platform.openai.com/api-keys
- Create API key
- Pay-per-use (very cheap for development)

**Supabase Database:**
- Go to: https://supabase.com
- Create new project
- Get URL and anon key from settings

### 3. Test Everything Works
```bash
# Test weather
curl "localhost:3000/api/test-weather?zip=10001"

# Test lunar
curl "localhost:3000/api/test-lunar"

# Test AI
curl -X POST localhost:3000/api/hunting-advice \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Hunt deer in 12345?"}'
```

## 🚀 Development Workflow

### Adding New Features
1. **Plan the feature** - What data does it need?
2. **Update database schema** if needed (Supabase dashboard)
3. **Create/modify API endpoint** in `src/app/api/`
4. **Update AI logic** in `src/lib/openai.ts` if needed
5. **Update frontend** in `src/components/` or `src/app/`
6. **Test thoroughly** with API calls
7. **Update documentation**

### Code Style Guidelines
- **Use TypeScript** for all new files
- **Add JSDoc comments** for all functions
- **Use descriptive variable names**
- **Break complex functions** into smaller pieces
- **Add error handling** for all API calls
- **Test edge cases** (bad ZIP codes, API failures)

### Common Tasks

**Add new weather parameter:**
1. Update `weather.ts` - add to API call and processing
2. Update `calculateHuntingScore()` - include in algorithm
3. Update AI prompt in `openai.ts` - add to context
4. Test with various conditions

**Add new AI feature:**
1. Update system prompt in `openai.ts`
2. Add any required data fetching
3. Test AI responses extensively
4. Update database logging if needed

**Add new data source:**
1. Create new file in `src/lib/` (e.g., `migration.ts`)
2. Add API integration with error handling
3. Update `openai.ts` to use new data
4. Add to database logging
5. Create test endpoint

## 🐛 Troubleshooting Common Issues

### "Invalid ZIP code" errors
- Check ZIP code format (5 digits)
- Verify OpenWeather geocoding API is working
- Test with known good ZIP codes (10001, 90210, 80424)

### AI responses are generic/bad
- Check if weather/lunar data is being passed to AI
- Verify API keys are working
- Test individual data sources first
- Check AI prompt formatting

### Database errors
- Verify Supabase credentials
- Check if tables exist in Supabase dashboard
- Look at exact error messages in logs
- Test database connection with `/api/test-db`

### Build/deployment issues
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Verify all environment variables are set
- Check for TypeScript errors

## 📈 Performance Considerations

### API Rate Limits
- **OpenWeather:** 1,000 calls/day free (cache responses)
- **OpenAI:** Pay per token (responses cost ~$0.01 each)
- **Supabase:** 500MB database free

### Optimization Opportunities
- Cache weather data for 30 minutes per ZIP code
- Pre-calculate solunar data for popular locations
- Implement request deduplication
- Add database indexing for common queries

## 🔮 Future Development

### Next Priority Features
1. **Outcome tracking** - Log hunt success/failure
2. **Mobile PWA** - Offline capability for field use
3. **Advanced filters** - The "Bloomberg terminal" interface
4. **Push notifications** - Alerts for optimal conditions

### Technical Debt
- Add comprehensive error handling
- Implement proper logging system
- Add automated testing suite
- Optimize database queries
- Add monitoring/analytics

## 📞 Getting Help

### Debug Steps
1. **Check logs** - Look for error messages in terminal
2. **Test components** - Use individual API endpoints
3. **Verify data** - Check what's being passed to AI
4. **Test incrementally** - Add console.log statements
5. **Check external APIs** - Test directly with curl

### Common Resources
- **Next.js docs:** https://nextjs.org/docs
- **OpenAI API docs:** https://platform.openai.com/docs
- **Supabase docs:** https://supabase.com/docs
- **OpenWeather docs:** https://openweathermap.org/api

---

**This guide should be everything a new developer needs to understand, modify, and extend Hunt Wet AI.** 🎯

*Last updated: 2025-09-26*