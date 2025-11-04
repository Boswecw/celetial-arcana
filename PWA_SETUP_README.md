# Celestia Arcana PWA Setup Guide

Your app has been converted into a Progressive Web App (PWA)! Here's what was added and what you need to do next.

## ✅ Files Created

1. **`static/manifest.json`** - PWA manifest with app metadata
2. **`static/sw.js`** - Service Worker for offline functionality
3. **`static/pwa.js`** - PWA installation manager
4. **`static/pwa-styles.css`** - PWA UI styles
5. **`src/app.html`** - Updated with PWA meta tags

## 📱 Next Steps: Create PWA Icons

### Option 1: Use the Icon Generator Tool (Recommended)

1. Save this HTML to a file and open in your browser:

```html
<!-- Create a file called icon-generator.html -->
```

See the `icon-generator.html` content in the implementation guide provided earlier.

2. Upload your logo (recommended: 512x512px PNG with transparent background)
3. Customize colors and padding
4. Download all icons as a ZIP file
5. Extract the icons to `static/icons/` directory

### Option 2: Manual Icon Creation

Create these icon sizes and place them in `static/icons/`:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Design Tips:**
- Use your cosmic purple theme (#7B61FF) as background
- Keep logo/symbol centered with 20% padding
- Ensure good contrast for visibility
- Use rounded corners for modern look

### Quick Icon Template

You can create icons using any of these tools:
- **Figma** - Design template with export sizes
- **Canva** - Use "App Icon" template
- **GIMP/Photoshop** - Batch export from master design
- **Online Tools** - PWABuilder, Favicon Generator

## 🚀 Testing Your PWA

### Local Testing

1. **Start dev server:**
   ```bash
   npm run dev -- --port 8120
   ```

2. **Test in Chrome:**
   - Open DevTools → Application tab
   - Check "Manifest" and "Service Workers"
   - Look for "Install" button in address bar

### Production Testing

1. **Build and deploy:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Requirements for PWA:**
   - Must be served over HTTPS (or localhost)
   - All icons must be present in `static/icons/`
   - manifest.json must be accessible
   - Service worker must register successfully

### Mobile Testing

**iOS (iPhone/iPad):**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. App icon appears on home screen

**Android:**
1. Open in Chrome
2. Tap "Install App" prompt or
3. Menu → "Add to Home Screen"

## 🎨 Customization

### Update App Name/Description

Edit `static/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your description",
  ...
}
```

### Change Theme Colors

Edit `static/manifest.json`:
```json
{
  "theme_color": "#7B61FF",
  "background_color": "#1a1b3a"
}
```

Also update in `src/app.html`:
```html
<meta name="theme-color" content="#7B61FF" />
```

### Customize Install Button

Edit `static/pwa-styles.css` to change button appearance.

## 🔧 Features Included

### ✨ Offline Support
- App works offline after first visit
- Cached pages: Home, Deck, Alignment, Reading
- Automatic caching of visited pages

### 📲 Install Prompt
- "Install App" button appears when installable
- Auto-hides when app is installed
- Works on desktop and mobile

### 🔄 Auto-Update
- Detects new versions automatically
- Shows "Update Available" banner
- One-click update

### 🌐 Offline Indicator
- Shows status when offline
- Notifies when back online
- Graceful fallback for failed requests

### 💾 Background Sync
- Queues form submissions when offline
- Automatically syncs when connection returns
- Works for chart calculations and readings

## 📊 Analytics & Monitoring

### Check Service Worker Status

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered service workers:', regs);
});
```

### Clear Cache (for testing)

```javascript
// In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## 🐛 Troubleshooting

### "Install" button doesn't appear
- Check HTTPS (required in production)
- Verify all icons exist in `static/icons/`
- Check browser console for manifest errors
- Some browsers require user interaction first

### Service Worker not registering
- Check `/sw.js` is accessible
- Look for errors in DevTools → Console
- Ensure HTTPS in production
- Try hard refresh (Ctrl+Shift+R)

### Icons not showing
- Verify icon files exist in `static/icons/`
- Check file names match `manifest.json`
- Clear browser cache
- Verify correct image format (PNG)

### Offline mode not working
- Service worker must install first (visit once)
- Check cached assets in DevTools → Application → Cache Storage
- Verify network requests in DevTools → Network

## 📱 App Shortcuts

The manifest includes shortcuts to key features:
- **Tarot Deck** - `/deck`
- **Birth Chart** - `/alignment`
- **Tarot Reading** - `/reading`

Long-press app icon (Android) or right-click (desktop) to see shortcuts.

## 🔐 Privacy & Security

- All data stays in browser (localStorage/IndexedDB)
- No tracking or analytics added
- Service Worker only caches public assets
- Works completely offline after first visit

## 🎯 Next Steps

1. ✅ Create PWA icons (see above)
2. ✅ Test locally on mobile device
3. ✅ Deploy to HTTPS domain
4. ✅ Test PWA installation
5. ✅ Share with users!

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)

## 🌟 Enhancements to Consider

- Push notifications for daily readings
- Share functionality for readings
- Export/import saved readings
- Offline-first database (IndexedDB)
- Install prompts with custom timing

---

**Your PWA is ready!** Just add icons and test. 🚀✨
