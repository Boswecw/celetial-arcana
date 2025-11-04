# Celestia Arcana ✨

> A mystical Progressive Web App combining Tarot wisdom with cosmic alignment calculations

Celestia Arcana is an immersive spiritual tool that brings together the ancient art of Tarot reading with modern astrological birth chart calculations. Built as a Progressive Web App, it works seamlessly online and offline, providing mystical guidance wherever you are.

## Features

### 🃏 Tarot Deck
- Interactive 78-card Tarot deck with stunning cosmic-themed artwork
- Detailed card meanings for each Major and Minor Arcana card
- Hover tooltips displaying card interpretations
- Beautiful visual presentation with smooth animations

### 🌟 Cosmic Alignment Calculator
- Complete birth chart calculations using NASA JPL ephemeris data
- Calculate planetary positions for any date, time, and location
- Support for both manual coordinates and location search
- Detailed astrological house system (Placidus)
- Planetary aspects with precise degree calculations
- Educational tooltips explaining astrological concepts

### 🔮 Tarot Reading
- AI-powered tarot readings with contextual interpretations
- Multiple spread options
- Personalized readings based on your questions
- Integration with birth chart data for deeper insights

### 📱 Progressive Web App (PWA)
- **Install on any device** - Works like a native app on mobile and desktop
- **Offline functionality** - Access your readings without internet connection
- **Auto-updates** - Get the latest features automatically
- **Fast loading** - Cached assets for instant access
- **Background sync** - Form submissions work even when offline

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd celestia-arcana
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Running on Custom Port

```bash
npm run dev -- --port 8120
```

## PWA Setup

The app is already configured as a PWA! To complete the setup:

### Create PWA Icons

You need to create app icons for the PWA to be fully installable. See [PWA_SETUP_README.md](./PWA_SETUP_README.md) for detailed instructions.

**Quick Start:**
1. Create icons in the following sizes and place them in `static/icons/`:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

2. Use the cosmic purple theme (#7B61FF) for consistency
3. Keep designs simple and centered with 20% padding

**Design Tools:**
- [PWA Builder](https://www.pwabuilder.com/)
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Icon Generator](https://progressier.com/pwa-icons-generator)

### Testing PWA Features

#### Local Testing
```bash
npm run dev -- --port 8120
```
- Open DevTools → Application tab
- Check "Manifest" and "Service Workers" sections
- Look for "Install" button in browser address bar

#### Production Testing
```bash
npm run build
npm run preview
```

**Note:** PWAs require HTTPS in production (localhost is exempt)

#### Mobile Testing

**iOS (Safari):**
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

**Android (Chrome):**
1. Open the app in Chrome
2. Tap "Install App" prompt or
3. Menu → "Add to Home Screen"

## Building for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
celestia-arcana/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Card.svelte           # Tarot card component
│   │   │   ├── InfoTooltip.svelte    # Educational tooltip component
│   │   │   ├── ReadingExplainer.svelte
│   │   │   └── Toast.svelte          # Card meaning tooltips
│   │   ├── ephemeris.ts              # NASA JPL ephemeris calculations
│   │   └── types.ts                  # TypeScript type definitions
│   ├── routes/
│   │   ├── +page.svelte              # Landing page
│   │   ├── deck/+page.svelte         # Tarot deck browser
│   │   ├── alignment/+page.svelte    # Birth chart calculator
│   │   ├── reading/+page.svelte      # Tarot reading interface
│   │   └── api/
│   │       ├── combined-reading/+server.ts
│   │       └── reading-explanation/+server.ts
│   └── app.html                      # HTML template with PWA meta tags
├── static/
│   ├── cards/                        # Tarot card images (78 cards)
│   ├── icons/                        # PWA app icons (to be created)
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   ├── pwa.js                        # PWA manager
│   └── pwa-styles.css                # PWA UI styles
├── PWA_SETUP_README.md              # Complete PWA setup guide
└── README.md                         # This file
```

## Technologies Used

- **[SvelteKit](https://kit.svelte.dev/)** - Full-stack framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **NASA JPL Ephemeris** - Astronomical calculations
- **Service Workers** - Offline functionality
- **Web App Manifest** - PWA capabilities
- **OpenAI API** - AI-powered tarot interpretations

## Features in Detail

### Educational Tooltips
Every form field includes helpful tooltips explaining astrological concepts:
- Birth date, time, and location significance
- Latitude and longitude coordinate systems
- Planetary positions and their meanings
- Astrological angles (Ascendant, Midheaven, etc.)
- Planetary aspects and relationships

### Offline Support
The Service Worker caches:
- All app pages (Home, Deck, Alignment, Reading)
- Static assets (CSS, JS, images)
- Previously visited pages
- Form submissions (synced when back online)

### Auto-Update System
- Detects new app versions automatically
- Shows update banner with one-click update
- Seamless background updates

### Connection Status
- Real-time online/offline indicator
- Graceful fallback for failed requests
- Queue system for offline form submissions

## API Endpoints

### POST `/api/combined-reading`
Generate a complete tarot reading with AI interpretation.

### POST `/api/reading-explanation`
Get detailed explanations of individual tarot cards.

## Development Notes

### Tarot Card Images
- 78 cards in WebP format (22 Major Arcana + 56 Minor Arcana)
- Located in `static/cards/`
- Named format: `The_Fool.webp`, `Ace_of_Cups.webp`, etc.

### Birth Chart Calculations
- Uses NASA JPL ephemeris data for accuracy
- Supports dates from 1800-2100
- Placidus house system
- Includes all classical planets plus modern planets

### PWA Caching Strategy
- Cache-first for static assets
- Network-first for API calls
- Background sync for form submissions

## Troubleshooting

### PWA Install Button Not Appearing
- Verify all icons exist in `static/icons/`
- Check browser console for manifest errors
- Ensure HTTPS in production
- Try hard refresh (Ctrl+Shift+R)

### Service Worker Issues
- Clear browser cache
- Unregister old service workers in DevTools
- Check `/sw.js` is accessible
- Verify HTTPS in production

### Blurry Tooltips
- Already fixed with CSS anti-aliasing
- Uses `-webkit-font-smoothing: antialiased`
- Positioned with pixel-perfect CSS

## Privacy

- All data stored locally in browser
- No tracking or analytics
- Birth chart calculations done client-side
- Tarot readings use secure API calls
- No personal data collected or stored on servers

## Contributing

This is a personal mystical tool project. Feel free to fork and customize for your own spiritual practice.

## License

See LICENSE file for details.

---

**Built with cosmic energy and mystical code** ✨🌙⭐
