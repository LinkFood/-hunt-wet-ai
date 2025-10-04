# Hunt Wet AI - Deployment Guide

## 🎉 STATUS: READY FOR FRIENDS-FIRST TESTING

Your Hunt Wet AI is built and ready to deploy for your hunting crew!

## ✅ COMPLETED:
- ✅ Production build successful
- ✅ Core chat interface with AI hunting advice
- ✅ Real-time weather + lunar intelligence
- ✅ Mobile-first design for field use
- ✅ Supabase integration for data learning
- ✅ All dead custom LLM code removed

## 🚀 DEPLOYMENT STEPS:

### Step 1: Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy Hunt Wet AI
vercel --prod

# Add your custom domain (optional)
vercel domains add huntwet.com
```

### Step 2: Environment Variables in Vercel
Add these to your Vercel project settings (do NOT use the keys from .env.local, those are exposed):

**Required:**
```
OPENAI_API_KEY=your-openai-api-key-here
OPENWEATHER_API_KEY=your-openweather-api-key-here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Optional (for future features):**
```
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

### Step 3: Configure Domain (huntwet.com)
1. Go to your domain registrar (GoDaddy, etc.)
2. Update nameservers to point to Vercel
3. Or add CNAME record pointing to your Vercel deployment

## 💰 COSTS BREAKDOWN:

### Production Hosting (Recommended):
- **Vercel Hobby**: FREE (good for testing with friends)
- **Vercel Pro**: $20/month (needed if you get popular)
- **Supabase**: FREE tier (500MB database, plenty for friends-first)
- **OpenAI API**: ~$5-20/month (depends on usage)
- **OpenWeather API**: FREE (1,000 calls/day)

**Total for friends-first testing: ~$5-20/month**

### Future Costs (If You Scale):
- Vercel Pro: $20/month
- Supabase Pro: $25/month (if you outgrow free tier)
- OpenAI: $50-200/month (depends on user volume)
- **Estimated at 100 active users: ~$100-250/month**

## 🎯 IMMEDIATE ACTION ITEMS:

1. **Deploy to Vercel**: `vercel login && vercel --prod`
2. **Add Environment Variables**: In Vercel dashboard
3. **Test Production**: Make sure everything works
4. **Invite 2-3 Hunting Buddies**: Get real feedback
5. **Start Logging Hunts**: Build your data moat

## 📱 FRIENDS-FIRST STRATEGY:

### Phase 1 (Current - 3 months):
- Deploy for you + 5-10 hunting buddies
- Log every hunt with outcomes
- Perfect the UX based on field use
- Build data that big players can't replicate

### Phase 2 (3-6 months):
- Expand to local hunting community
- Prove prediction accuracy
- Refine based on diverse feedback

### Phase 3 (6-12 months):
- Consider public launch
- By then, you have proprietary data moat
- Big players can't easily copy what took seasons to build

## 🔒 SECURITY NOTES:

**IMPORTANT:** Your `.env.local` file contains exposed API keys. These are fine for local development but:

1. **Never commit `.env.local` to GitHub** (already in .gitignore)
2. **Use Vercel environment variables** for production
3. **Rotate your OpenAI key** before public launch
4. **Keep Supabase keys secure** (use RLS policies)

## 🚨 WHAT'S DIFFERENT NOW:

### ❌ NO MORE Custom LLM Dreams:
- Removed all Python training scripts
- Removed RunPod infrastructure
- Removed data scraping systems
- **Why:** GPT-4 + your Supabase data = better and cheaper

### ✅ NEW STRATEGY:
- OpenAI GPT-4o-mini reads YOUR Supabase database
- Every logged hunt makes predictions smarter
- Your competitive moat is THE DATA, not the model
- Much simpler, much cheaper, actually works

## 🔗 USEFUL COMMANDS:

```bash
# Local development
npm run dev

# Production build (test before deploy)
npm run build

# Deploy to production
vercel --prod

# Check deployment status
vercel list

# View production logs
vercel logs
```

## 📊 SUCCESS METRICS TO TRACK:

- [ ] Deployed to production URL
- [ ] 5+ hunting buddies using it
- [ ] 20+ hunts logged with outcomes
- [ ] AI predictions improving based on data
- [ ] Mobile UX working in field conditions
- [ ] No major bugs or crashes

## 🎯 NEXT PHASE GOALS:

After successful friends-first testing:
- [ ] 50+ logged hunts with outcomes
- [ ] Proven prediction accuracy (60%+ vs baseline)
- [ ] Testimonials from hunting crew
- [ ] Ready for local community beta
- [ ] Consider monetization strategy

---

**Ready to deploy? Run: `vercel login && vercel --prod`**

Then share the URL with your hunting buddies and start logging hunts!
