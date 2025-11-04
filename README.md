<div align="center">
  <img src="static/Celestia_Arcana_banner.avif" alt="Celestia Arcana" width="600">

  # Celestia Arcana ✨

  An immersive SvelteKit experience that blends tarot, astrology, and AI into flowing cosmic readings. Featuring full-deck animations, intelligent narration, and astrological synthesis powered by OpenAI.

  **[Live Demo](https://your-demo-url.com)** · **[Report Bug](https://github.com/yourusername/celestia-arcana/issues)** · **[Request Feature](https://github.com/yourusername/celestia-arcana/issues)**
</div>

---

## ✨ Features

- 🎴 **Full 78-Card Tarot Deck** - Complete Celestia Arcana deck with upright & reversed interpretations
- 🌙 **Astrological Integration** - Readings influenced by celestial positions, Sun signs, and planetary movements
- 🔮 **AI-Powered Synthesis** - Multi-stage pipeline combining traditional tarot with astrological context
- 🎬 **Animated Card Shuffling** - Beautiful swirling animation during reading generation
- 🔊 **Voice Narration** - Natural speech synthesis with intelligent voice selection
- 📊 **Birth Chart Calculator** - Real-time ephemeris calculations with smart zodiac fallback
- 💬 **Conversational Explainer** - Ask questions about your reading with context-aware AI
- ⚡ **Optimized Performance** - 70%+ faster load times with modern web optimizations

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1 (recommended) or Node.js 18+
- Python 3.6+ (for astrological synthesis)
- OpenAI API key for AI readings

### Installation

#### Option 1: Quick Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/celestia-arcana.git
cd celestia-arcana

# Run automated setup script
./setup.sh

# Add your OPENAI_API_KEY to .env
# Then start the dev server
bun run dev
```

#### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/celestia-arcana.git
cd celestia-arcana

# Install JavaScript dependencies
bun install

# Install Python dependencies (for astrological synthesis)
pip3 install -r requirements.txt
# or: python3 -m pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start development server
bun run dev

# Or specify a port
bun run dev -- --port 5180
```

Visit [http://localhost:5173](http://localhost:5173) to see the app.

### Build for Production

```bash
# Build optimized bundle
bun run build

# Preview production build
bun run preview
```

### Verify Setup

```bash
# Test Python detection and dependencies
bun run test:python
# or: npm run test:python
```

This will verify:
- ✅ Python is installed and detected
- ✅ Required Python packages (openai, requests) are installed
- ✅ OpenAI API key is configured

---

## 📁 Project Structure

```
celestia-arcana/
├── src/
│   ├── routes/
│   │   ├── +page.svelte                    # Landing page
│   │   ├── +layout.svelte                  # Root layout
│   │   ├── reading/+page.svelte            # Reading interface
│   │   ├── deck/+page.svelte               # Card browser
│   │   ├── alignment/+page.svelte          # Birth chart calculator
│   │   ├── dashboard/+page.svelte          # AI dashboard
│   │   └── api/
│   │       ├── reading/+server.ts          # Traditional tarot engine
│   │       ├── astro-tarot/+server.ts      # Astrological synthesis
│   │       ├── combined-reading/+server.ts # Final reading merger
│   │       ├── ephemeris/+server.ts        # Celestial calculations
│   │       └── reading-explanation/+server.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Card.svelte                 # Tarot card component
│   │   │   ├── ReadingFeedback.svelte
│   │   │   └── ReadingExplainer.svelte
│   │   ├── decks/
│   │   │   ├── celestia-arcana.ts          # Full deck definitions
│   │   │   └── tarot-meanings-map.ts
│   │   ├── utils/
│   │   │   └── voiceSelection.ts           # Speech synthesis utilities
│   │   ├── tarot.ts                        # Card drawing logic
│   │   └── ephemeris.ts                    # Astronomical calculations
│   └── app.css                             # Global styles
├── static/
│   ├── cards/                              # 78 tarot card images (WebP)
│   └── Celestia_Arcana_banner.avif         # Logo/banner
├── astro_tarot_reader.py                   # Python astrological engine
└── package.json
```

---

## 🎮 Usage

### Getting a Reading

1. Navigate to the **Reading** page
2. Enter your birth details (month, day, year, time)
3. Allow location access or manually enter coordinates
4. Optionally enter a specific question
5. Click "Get Your Reading" to generate your cosmic reading
6. Listen to the narrated interpretation or read the text

### Exploring the Deck

Visit the **Deck** page to browse all 78 cards with their meanings and astrological associations.

### Birth Chart

Use the **Alignment** page to calculate your astrological birth chart based on your birth details.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
VITE_ASTRO_TAROT_MODEL=gpt-4o-mini  # Override AI model
```

### Available Models

- `gpt-4o-mini` (default) - Fast, cost-effective
- `gpt-4o` - More nuanced interpretations
- `gpt-4-turbo` - Balance of speed and quality

---

## 🧪 Testing

```bash
# Run all test suites
./run_all_tests.sh

# Individual test suites
python test_project_comprehensive.py      # Backend tests
./test_frontend_structure.sh             # Frontend structure
python test_performance_improvements.py   # Performance tests

# Type checking
bunx svelte-check

# Code formatting
bun run format
bun run lint
```

---

## 🎨 Customization

### Adding Custom Cards

1. Add card images to `static/cards/` (recommended: WebP format, 300-400KB)
2. Update card definitions in `src/lib/decks/celestia-arcana.ts`
3. Follow the existing card structure:

```typescript
{
  id: 'unique-id',
  name: 'Card Name',
  filename: 'Card_Name.webp',
  upright: 'Upright meaning...',
  reversed: 'Reversed meaning...',
  element: 'Fire' // or Water, Air, Earth
}
```

### Customizing Voice Narration

Modify voice selection preferences in `src/lib/utils/voiceSelection.ts`:

```typescript
const OLDER_WOMAN_DESCRIPTORS = ['grandma', 'elder', 'mature'];
const WOMAN_DESCRIPTORS = ['female', 'woman', 'lady'];
```

---

## 🚀 Performance Optimizations

This project includes extensive performance optimizations:

- ⚡ **Code Splitting** - Automatic route-based splitting
- 📦 **Lazy Loading** - Images and video load on-demand
- 🗜️ **Optimized Assets** - AVIF banner (85% smaller), lazy card images
- 🔄 **Parallel API Calls** - 40% faster reading generation
- 🎨 **Reduced GPU Load** - Optimized blur effects for smooth mobile performance
- 📱 **Mobile-First** - Responsive design with touch-friendly interactions

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size | ~800KB | ~250KB | **-69%** |
| Initial Load | 40MB | 500KB | **-99%** |
| Time to Interactive | 4-6s | 1.5-2s | **-67%** |
| Reading Generation | 4-6s | 2-4s | **-40%** |

---

## 📦 Deployment

### ⚠️ Important: Python Astrological Synthesis

The **Astro-Tarot synthesis feature** requires Python and cannot run on serverless platforms (Netlify Functions, Vercel Functions) as they don't support Python runtime by default.

**Options:**

1. **Deploy to Python-supporting platforms (Recommended):**
   - **[Render](https://render.com)** ⭐ - Pre-configured with `render.yaml`, free tier available
   - [Railway](https://railway.app) - Auto-detects dependencies, $5/month
   - [Fly.io](https://fly.io) - Custom Dockerfile required
   - Traditional VPS (DigitalOcean, Linode, etc.)

2. **Use static deployment** (without astrological synthesis):
   - Netlify, Vercel, Cloudflare Pages
   - Note: Traditional tarot readings will still work, but astro-tarot endpoint will return errors

### Render (Recommended) ⭐

This project includes `render.yaml` for one-click deployment:

1. Push your code to GitHub
2. Create account at [render.com](https://render.com)
3. Click "New" → "Blueprint"
4. Select your repository
5. Add `OPENAI_API_KEY` environment variable in dashboard
6. Deploy automatically!

**Free tier available** (with cold starts) or Starter plan $7/month for always-on.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed step-by-step instructions.

### Railway (Alternative)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add OPENAI_API_KEY in Railway dashboard
```

### Netlify/Vercel (Limited - No Python)

**Warning:** Astrological synthesis will not work on these platforms.

```bash
# Netlify
bun add -D @sveltejs/adapter-netlify
netlify deploy --prod

# Vercel
bun add -D @sveltejs/adapter-vercel
vercel --prod
```

### Docker

```dockerfile
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["bun", "run", "build/index.js"]
```

---

## 🛠️ Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) 2.0 (Svelte 5)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.0
- **Runtime**: [Bun](https://bun.sh/) 1.3+
- **AI**: [OpenAI API](https://openai.com/api/) (GPT-4)
- **Astronomy**: [Astronomy Engine](https://github.com/cosinekitty/astronomy) 2.1
- **Animation**: [Motion](https://motion.dev/) 12
- **Validation**: [Zod](https://zod.dev/) 4.1

---

## 📝 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cards` | GET | Retrieve all tarot cards |
| `/api/reading` | POST | Generate traditional tarot reading |
| `/api/astro-tarot` | POST | Generate astrological synthesis |
| `/api/combined-reading` | POST | Merge traditional + astro readings |
| `/api/ephemeris` | GET | Calculate celestial positions |
| `/api/reading-explanation` | POST | AI-powered reading Q&A |
| `/api/feedback` | POST | Submit reading feedback |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (Prettier config provided)
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

You are free to:
- **Share** - Copy and redistribute the material
- **Adapt** - Remix, transform, and build upon the material

Under the following terms:
- **Attribution** - You must give appropriate credit
- **NonCommercial** - You may not use the material for commercial purposes
- **ShareAlike** - If you remix or transform the material, you must distribute your contributions under the same license

See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgments

- Tarot card artwork: Celestia Arcana custom deck
- Astronomical calculations: [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- AI synthesis: [OpenAI](https://openai.com/)
- Inspired by the ancient wisdom of tarot and modern web technologies

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/celestia-arcana/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/celestia-arcana/discussions)
- **Email**: your-email@example.com

---

## 🔧 Troubleshooting

### "Python not found" Error

If you get `spawn python3 ENOENT` or `Python not found` error:

**Option 1: Install Python**
```bash
# Check if Python is installed
python3 --version

# If not installed, install Python 3.6+
# On Ubuntu/Debian:
sudo apt-get install python3 python3-pip

# On macOS (with Homebrew):
brew install python3

# On Windows:
# Download from https://python.org
```

**Option 2: Set Python Path Manually**

If Python is installed but not detected, add to your `.env` file:
```env
PYTHON_PATH=/usr/bin/python3
# or wherever your Python is located
# Find it with: which python3
```

Then restart the dev server.

### Missing Python Dependencies

If readings fail with import errors:

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Or with full path:
python3 -m pip install -r requirements.txt

# Verify installation:
python3 -c "import openai; print('OpenAI OK')"
python3 -c "import requests; print('Requests OK')"
```

### OpenAI API Key Issues

If you get API authentication errors:

1. Verify `.env` file exists and contains: `OPENAI_API_KEY=sk-your-key-here`
2. Restart the development server after adding the key
3. Check your OpenAI API key is valid at [platform.openai.com](https://platform.openai.com)

### Build Errors

```bash
# Clear build cache
rm -rf .svelte-kit build node_modules

# Reinstall dependencies
bun install

# Rebuild
bun run build
```

### "Python not available in serverless environments" Error

If you get this error when deployed to Netlify/Vercel:

**The astrological synthesis feature requires Python and cannot run on serverless platforms.**

**Solutions:**

1. **Deploy to a Python-supporting platform:**
   - Railway, Render, Fly.io, or traditional VPS
   - See [Deployment section](#-deployment) for details

2. **Disable astrological synthesis:**
   - The app will still work for traditional tarot readings
   - Only the `/api/astro-tarot` endpoint will fail

3. **Use a separate Python service:**
   - Deploy the Python script separately as an API
   - Update the fetch URL in the astro-tarot endpoint

---

## 🔮 Roadmap

- [ ] PWA support with offline mode
- [ ] Reading history and favorites
- [ ] Custom spread creator
- [ ] Social sharing features
- [ ] Multiple language support
- [ ] Voice input for questions
- [ ] Card of the Day notifications

---

<div align="center">

**Built with ✨ by Boswell Digital Solutions LLC**

*May your readings be luminous* 🔮

[⬆ Back to Top](#celestia-arcana-)

</div>
