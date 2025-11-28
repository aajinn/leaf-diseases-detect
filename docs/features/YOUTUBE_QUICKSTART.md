# 🚀 YouTube Integration - Quick Setup Guide

Get YouTube treatment videos in your disease detection results in 5 minutes!

---

## Step 1: Get Perplexity API Key (2 minutes)

1. Go to [https://www.perplexity.ai/](https://www.perplexity.ai/)
2. Sign up or log in
3. Navigate to **Settings** → **API**
4. Click **"Generate API Key"**
5. Copy your key (starts with `pplx-`)

---

## Step 2: Add API Key to Environment (1 minute)

Open your `.env` file and add:

```bash
PERPLEXITY_API_KEY=pplx-your-actual-api-key-here
```

**Example:**
```bash
# Existing keys
GROQ_API_KEY=gsk_abc123...
MONGODB_URL=mongodb://localhost:27017

# Add this line
PERPLEXITY_API_KEY=pplx-xyz789...
```

---

## Step 3: Restart Your Server (30 seconds)

```bash
# Stop current server (Ctrl+C)

# Restart FastAPI
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 4: Test the Integration (1 minute)

### Option A: Run Test Script

```bash
python test_perplexity.py
```

You should see:
```
✅ Service initialized successfully
✅ Found 3 videos
🎉 All tests passed!
```

### Option B: Test via Web Interface

1. Go to http://localhost:8000/dashboard
2. Upload a leaf image
3. Click "Analyze Image"
4. Scroll down to see **"Recommended Treatment Videos"** section

---

## ✅ Verification Checklist

- [ ] Perplexity API key added to `.env`
- [ ] Server restarted
- [ ] Test script passes
- [ ] Videos appear in dashboard
- [ ] Videos appear in history modal

---

## 🎉 You're Done!

Your system now automatically fetches and displays relevant YouTube treatment videos for every disease detection!

---

## 🐛 Troubleshooting

### No videos appearing?

**Check 1: API Key**
```bash
# Verify key is in .env
cat .env | grep PERPLEXITY_API_KEY
```

**Check 2: Logs**
```bash
# Look for errors
tail -f disease_detection.log | grep -i perplexity
```

**Check 3: Test Service**
```bash
python test_perplexity.py
```

### Still not working?

1. Make sure you restarted the server after adding the API key
2. Check that your API key is valid (no extra spaces)
3. Verify you have internet connection
4. Check Perplexity API status: [https://status.perplexity.ai/](https://status.perplexity.ai/)

---

## 📊 What Happens Now?

### For Disease Detection:
- System fetches **3 treatment videos** specific to the detected disease
- Videos are embedded in the results
- Links are saved to database for future reference

### For Healthy Plants:
- System fetches **2 general plant care videos**
- Helps users maintain plant health

### In History:
- All past analyses show their associated videos
- Videos are accessible anytime from history page

---

## 💡 Pro Tips

1. **First analysis takes longer** (10-30 seconds) while fetching videos
2. **Videos are cached** in database - subsequent views are instant
3. **Works offline** - once videos are fetched, they're stored
4. **Mobile friendly** - videos work on all devices

---

## 📚 Learn More

- Full documentation: `YOUTUBE_INTEGRATION_GUIDE.md`
- API reference: See guide for detailed API docs
- Feature enhancement plan: `FEATURE_ENHANCEMENT_PLAN.md`

---

## 🎯 Next Steps

Want to customize the integration?

1. **Change video count**: Edit `max_videos` parameter in `routes/disease_detection.py`
2. **Customize search**: Modify prompts in `services/perplexity_service.py`
3. **Add video ratings**: Implement user feedback system
4. **Cache videos**: Add Redis caching for faster responses

---

**Need Help?** Check the full guide or open an issue on GitHub!

---

*Setup time: ~5 minutes | Difficulty: Easy | Impact: High* 🚀
