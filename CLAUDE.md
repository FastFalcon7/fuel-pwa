# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone Progressive Web App (PWA) for calculating Jet A-1 fuel uplift requirements for aviation purposes. The app is built with vanilla HTML, CSS, and JavaScript - no build tools or frameworks required.

## Development Commands

**Local Development Server:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server is installed)
npx http-server -p 8000
```

Access the app at: `http://localhost:8000/fuel-pwa/`

**Testing PWA Features:**
- Use Chrome DevTools > Application tab to inspect service worker, manifest, and cache storage
- Test offline functionality by checking "Offline" in the Network tab
- Verify installability using Lighthouse PWA audit

## Architecture

### File Structure
- `index.html` - Single-page application with inline CSS and JavaScript
- `manifest.json` - PWA manifest defining app metadata, icons, and display settings
- `sw.js` - Service worker implementing cache-first strategy for offline functionality
- `assets/` - App icons (48px to 512px) and screenshots for PWA installation

### Key Design Decisions

**Inline Code**: All CSS and JavaScript are embedded in `index.html` for simplicity and minimal HTTP requests.

**Base Path**: The app is designed to be deployed at `/fuel-pwa/` path. All asset references use this prefix. Update these paths if deploying to a different location.

**Responsive Design**:
- Mobile-first with stacked layout on narrow screens
- Switches to horizontal layout at 600px+ width
- Prevents zooming on iOS (`user-scalable=no`)

### Calculator Logic

The app performs aviation fuel calculations with these key functions:

**Density-Temperature Relationship** (index.html:181-187):
- Calculates fuel density based on temperature: `density = 0.79 + (15 - temperature) * 0.0007`
- Bidirectional conversion between density and temperature

**Unit Conversions** (index.html:189-211):
- Converts between pounds (lbs), liters (L), and US gallons (USG)
- Density-dependent conversion for weight-to-volume calculations

**Reactive Calculations**:
- Required Uplift = Required Fuel - Remaining Fuel
- Total Actual Fuel = Remaining Fuel + Actual Uplift
- All calculations update in real-time via input event listeners

### Service Worker Caching

**Cache Strategy**: Cache-first with network fallback (sw.js:49-78)
- Serves cached content immediately for offline functionality
- Falls back to network for uncached resources
- Caches successful network responses dynamically

**Cache Versioning** (sw.js:1):
- Version is `fuel-pwa-v1`
- When updating the app, increment this version to force cache refresh
- Old caches are automatically cleaned up on service worker activation (sw.js:34-46)

## Making Changes

**When modifying cached files** (index.html, manifest.json, or assets):
1. Update `CACHE_NAME` version in `sw.js` (line 1) - e.g., `fuel-pwa-v2`
2. Test with hard refresh (Ctrl+Shift+R) or clear cache in DevTools
3. Verify service worker updates in Application tab

**When changing base path**:
- Update all `/fuel-pwa/` references in:
  - index.html (lines 14-19: icon links, line 19: manifest link)
  - manifest.json (start_url, scope, id, icon/screenshot src paths)
  - sw.js (CACHE_FILES array)

**When adding new assets**:
- Add asset path to `CACHE_FILES` array in `sw.js`
- Increment `CACHE_NAME` version
