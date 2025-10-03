# 🎯 Hunt Wet AI - The Ultimate Hunting Intelligence Platform

> **The Bloomberg Terminal for hunting** - transforming hunting from guesswork into precision intelligence.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Text editor (VS Code recommended)

### Setup (5 minutes)
```bash
# Clone the project
git clone <your-repo-url>
cd hunt-wet-ai

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Visit `http://localhost:3000` - your hunting AI is ready! 🎯

## 🧠 What This Does

Hunt Wet AI combines:
- **Real-time weather data** (temperature, pressure, wind, conditions)
- **Lunar/solunar intelligence** (moon phases, feeding times)
- **AI hunting expertise** (GPT-4o-mini with hunting guide persona)
- **Data learning system** (gets smarter with every hunt logged)

**Result:** Predictive hunting intelligence that tells you exactly when and where to hunt.

## 🔧 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AI Engine      │    │   Data APIs     │
│                 │    │                  │    │                 │
│ • Next.js       │◄──►│ • OpenAI GPT-4   │◄──►│ • Weather API   │
│ • React 19      │    │ • Hunting Logic  │    │ • Moon Phase    │
│ • TypeScript    │    │ • Data Analysis  │    │ • Geocoding     │
│ • Tailwind CSS  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────▼────────────────────────┘
                            ┌─────────────────┐
                            │   Database      │
                            │                 │
                            │ • Supabase      │
                            │ • PostgreSQL    │
                            │ • Hunt Sessions │
                            │ • User Data     │
                            └─────────────────┘
```

## 📊 Current Features

### ✅ Working Now
- **AI Chat Interface** - Talk to your hunting guide
- **Weather Intelligence** - Real-time conditions with hunting scores
- **Lunar Data** - Moon phases and solunar feeding times
- **Location Intelligence** - ZIP code-based predictions
- **Data Logging** - Every conversation stored for learning
- **Success Scoring** - 1-10 hunting condition ratings

### 🚧 In Development
- Mobile optimization for field use
- Success outcome tracking
- Advanced filter system
- Predictive alerts

## 🗂 Project Structure

```
hunt-wet-ai/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API endpoints
│   │   │   ├── hunting-advice/  # Main AI endpoint
│   │   │   ├── test-weather/    # Weather testing
│   │   │   └── test-lunar/      # Lunar testing
│   │   ├── layout.tsx      # App layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   └── HuntingChat.tsx # Main chat interface
│   └── lib/               # Core business logic
│       ├── openai.ts      # AI hunting intelligence
│       ├── weather.ts     # Weather API integration
│       ├── lunar.ts       # Moon phase / solunar data
│       └── supabase.ts    # Database connection
├── .env.local             # Environment variables
├── package.json           # Dependencies and scripts
└── MASTER_PLAN.md        # Complete project roadmap
```

## 🔑 Environment Variables

Create `.env.local` with these required variables:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# OpenAI (AI Engine)
OPENAI_API_KEY=your_openai_key

# Weather API
OPENWEATHER_API_KEY=your_openweather_key

# App Config
NEXT_PUBLIC_APP_NAME="Hunt Wet AI"
```

## Example Conversations

**"I'm elk hunting in Colorado ZIP 80424 tomorrow morning"**
> AI analyzes weather patterns, suggests optimal timing, and recommends tactics based on current conditions.

**"What's the moon phase doing to deer movement this week?"**  
> AI explains lunar influences and adjusts hunting strategy accordingly.

**"Storm moving in - should I still hunt?"**
> AI provides real-time weather analysis and tactical adjustments.

## Roadmap

- [ ] Location-based weather integration
- [ ] Historical success pattern tracking  
- [ ] Push notifications for optimal conditions
- [ ] Community hunting intel integration
- [ ] Calendar planning with AI optimization
- [ ] Voice chat capabilities

## Contributing

This is an active project! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share hunting success stories

## License

MIT License - Use it, improve it, make hunting better with AI!

---

**Hunt smarter, not harder.** 🏹