# Deployment Guide - Celestia Arcana

## ⚠️ Important: Python Dependency

Celestia Arcana uses Python for **astrological synthesis** (`/api/astro-tarot` endpoint). This creates deployment considerations:

---

## Deployment Options

### ✅ Full Support (Python + Node/Bun)

These platforms support both JavaScript and Python runtimes:

#### 1. Render (Recommended) ⭐
- **Pros:** Free tier available, simple configuration, includes `render.yaml` in project
- **Setup:** Connect GitHub repo, auto-deploys via Blueprint
- **Cost:** Free tier available (with cold starts), Starter plan $7/month
- **Docs:** https://render.com
- **Status:** ✅ Pre-configured with `render.yaml`

#### 2. Railway
- **Pros:** Easy setup, auto-detects dependencies, affordable
- **Setup:** Connect GitHub repo, Railway auto-configures
- **Cost:** $5/month base + usage
- **Docs:** https://railway.app

#### 3. Fly.io
- **Pros:** Global edge deployment, flexible
- **Setup:** Requires Dockerfile
- **Cost:** Free tier available
- **Docs:** https://fly.io

#### 4. Traditional VPS
- **Examples:** DigitalOcean, Linode, AWS EC2, Hetzner
- **Pros:** Full control, no vendor lock-in
- **Setup:** Manual server configuration
- **Cost:** $5-10/month+

---

### ⚠️ Limited Support (No Python)

These platforms support JavaScript but **not Python** by default:

#### Netlify (Current Deployment)
- ✅ **Works:** Landing page, card browser, traditional tarot readings
- ❌ **Fails:** Astrological synthesis (`/api/astro-tarot`)
- **Error:** "Python not available in serverless environments"
- **Workaround:** See options below

#### Vercel
- Same limitations as Netlify
- Serverless functions don't support Python runtime

#### Cloudflare Pages
- Same limitations as Netlify/Vercel
- Workers don't support Python

---

## Workarounds for Serverless Deployment

If you want to deploy to Netlify/Vercel but keep astrological synthesis:

### Option 1: Separate Python Service

Deploy Python script separately and call it as an external API:

1. **Deploy Python script to Railway/Render:**
   ```python
   # Create a simple Flask/FastAPI wrapper around astro_tarot_reader.py
   ```

2. **Update astro-tarot endpoint:**
   ```typescript
   // src/routes/api/astro-tarot/+server.ts
   const response = await fetch(process.env.PYTHON_SERVICE_URL, {
     method: 'POST',
     body: JSON.stringify(payload)
   });
   ```

3. **Add environment variable:**
   ```env
   PYTHON_SERVICE_URL=https://your-python-service.railway.app/api/astro-tarot
   ```

### Option 2: Disable Astrological Synthesis

Keep deployment simple by disabling the feature:

1. **Frontend change:** Hide astro-synthesis UI
2. **Backend change:** Return traditional reading only
3. **User impact:** Users get tarot readings without astrological context

### Option 3: Client-Side Warning

Add a banner explaining the limitation:

```svelte
{#if isServerless}
  <div class="warning">
    ⚠️ Astrological synthesis unavailable in this deployment.
    Only traditional tarot readings are available.
  </div>
{/if}
```

---

## Current Deployment Status

Based on your current setup:

**Platform:** Netlify (Serverless)
**Status:** Partial functionality
**Works:** ✅ Landing page, deck browser, traditional readings
**Fails:** ❌ Astrological synthesis

**Error Message:**
```
"Python astrological synthesis is not available in serverless environments"
```

---

## Recommended Deployment: Render

### Quick Start with Render Blueprint

This project includes a `render.yaml` configuration for one-click deployment:

1. **Create a Render account** at https://render.com (free tier available)

2. **Connect your GitHub repository:**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select the `celestia-arcana` repository

3. **Render will automatically:**
   - Detect `render.yaml` configuration
   - Install Node.js 20 and Python 3.11
   - Install dependencies from `package.json` and `requirements.txt`
   - Build the SvelteKit application
   - Deploy to a live URL

4. **Set environment variables:**
   - In Render Dashboard, go to your service
   - Navigate to "Environment" tab
   - Add: `OPENAI_API_KEY=sk-your-key-here`
   - Click "Save Changes" (triggers redeploy)

5. **Your app is live!** 🎉
   - URL: `https://celestia-arcana-xxxx.onrender.com`
   - All features including astrological synthesis will work

### Manual Render Deployment (Alternative)

If you prefer manual configuration:

1. **Create Web Service:**
   - Dashboard → "New" → "Web Service"
   - Connect repository

2. **Configure Build:**
   ```
   Name: celestia-arcana
   Region: Oregon (or your choice)
   Branch: main
   Runtime: Node
   Build Command: bun install && pip install -r requirements.txt && bun run build
   Start Command: node build/index.js
   ```

3. **Add Environment Variables:**
   ```
   NODE_VERSION=20
   PYTHON_VERSION=3.11
   OPENAI_API_KEY=sk-your-key-here
   ASTRO_TAROT_MODEL=gpt-4o-mini
   ```

4. **Deploy:** Click "Create Web Service"

### Render Free Tier Notes

- **Cold Starts:** Free tier services spin down after 15 minutes of inactivity
- **First Request:** May take 30-60 seconds to wake up
- **Recommendation:** Upgrade to Starter plan ($7/month) for always-on service

### Alternative: Railway

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add environment variables:**
   - In Railway dashboard, add `OPENAI_API_KEY`
   - Automatically installs from `requirements.txt`

### For Netlify/Vercel (Limited):

1. **Accept limitation** - Astro-synthesis won't work
2. **Add user-facing notice** in the reading UI
3. **Consider Option 1** (separate Python service) for hybrid approach

---

## Testing Deployment

After deploying, test these endpoints:

```bash
# Should work on all platforms
curl https://your-app.com/api/cards

# Should work on all platforms
curl -X POST https://your-app.com/api/reading \
  -H "Content-Type: application/json" \
  -d '{"question":"test","draw":[...]}'

# Only works on Python-supporting platforms
curl -X POST https://your-app.com/api/astro-tarot \
  -H "Content-Type: application/json" \
  -d '{"question":"test","timeframe":"next 30 days",...}'
```

---

## FAQ

**Q: Can I make Python work on Netlify Functions?**
A: Not easily. Netlify Functions run on AWS Lambda which doesn't include Python by default. You'd need custom Lambda layers.

**Q: What's the easiest solution?**
A: Deploy to Railway. It auto-detects both JavaScript and Python dependencies.

**Q: Can I keep using Netlify?**
A: Yes, but astrological synthesis won't work. Traditional tarot readings will still function.

**Q: How much does Railway cost?**
A: $5/month base + usage. Usually $8-12/month total for small apps.

**Q: Can I use the free tier on Render?**
A: Yes! Render has a free tier that supports Python. Note: free tier has cold starts.

---

## Support

For deployment issues:
- Check logs in your platform's dashboard
- Run `bun run test:python` locally to verify setup
- See [README.md](README.md) troubleshooting section

For platform-specific help:
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Fly.io: https://fly.io/docs
