# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Progressive Web Application (PWA)** for aviation fuel calculations. The app features three pages:
1. **Jet A-1 Uplift Calculator** - Standard fuel uplift calculations
2. **"90%" Uplift Calculator** - Specialized aviation fuel planning
3. **Parking Checklist** - Interactive pre-parking checklist with 11 items

The application works fully offline and can be installed on mobile devices.

## Architecture

### File Structure
- `index.html` - Main application file containing all HTML, CSS, and JavaScript (838 lines)
- `manifest.json` - PWA manifest defining app metadata and icons
- `sw.js` - Service Worker v12 with simple cache-first strategy (108 lines)
- `assets/` - Directory containing app icons (48px to 512px) and screenshots

### Code Organization

The application uses **single-file architecture** with all code in `index.html`:

#### HTML Structure (lines 1-400)
Three-page layout using CSS transforms for horizontal swipe navigation:
- **Page 1** (lines 242-301): Jet A-1 Uplift Calculator
  - Remaining Fuel, Required Fuel inputs
  - Fuel Density/Temperature with bidirectional conversion
  - Required Uplift (lbs/liters/USgal)
  - Actual Uplift and Total Actual Fuel

- **Page 2** (lines 307-341): "90%" Uplift Calculator
  - Remaining Fuel (synced with Page 1)
  - Trip+Taxi Fuel input
  - Calculated Required Fuel (90% of trip+taxi)
  - On Block Fuel calculation

- **Page 3** (lines 342-388): Parking Checklist
  - 11 interactive checkbox items
  - Items: Sun shields, Chocks, Brake OFF, Gear/RAT pins, Probes covers, NLG disconnect, Toilet service, Water drain, Fuel spillage, Engine/APU covers, Batteries

#### CSS Styling (lines 22-227)
- **Container**: 300vw width for 3 pages, CSS transform for navigation
- **Responsive**: Mobile-first, switches to horizontal layout at 600px+
- **Colors**:
  - Page titles (h1): Blue #0066cc
  - Checklist unchecked: Dark orange #FF8C00
  - Checklist checked: Green #4CAF50
  - Unit labels: Blue #0066cc
  - CLR button: Green #35c94e
- **Checklist styling**: 21px font, 650 weight, 0 margin-bottom, 8px padding
- **Fixed elements**: CLR button (bottom right), Page indicators (bottom center)

#### JavaScript Functionality (lines 400-838)

**Main Features:**
- Swipe navigation between 3 pages (lines 427-485)
- Fuel calculations with density/temperature conversions (lines 552-577)
- Unit conversions (lbs ↔ liters ↔ US gallons) (lines 560-577)
- Form synchronization between calculator pages (lines 506-515)
- localStorage persistence for all inputs and checklist states (lines 719-778)
- Pull-to-refresh triggers CLR function (lines 786-812)

**Key Functions:**
- `updatePagePosition()` (line 480): Updates transform and dots for current page
- `calculate90Percent()` (line 488): Calculates 90% fuel requirement
- `calculateDensity(temperature)` (line 552): Returns density from temperature
- `calculateTemperature(density)` (line 556): Reverse calculation
- `updateCalculations()` (line 586): Main calculator orchestrator
- `clearForm()` (line 518): Resets all forms and clears localStorage
- `saveCalculatorState()` (line 720): Saves all calculator inputs to localStorage
- `loadCalculatorState()` (line 742): Loads saved calculator state on startup
- `saveChecklistState()` (line 698): Saves checklist checkbox states
- `loadChecklistState()` (line 684): Restores checkbox states on load

**Service Worker Registration** (line 827): Registered outside window.onload for reliability

### localStorage Persistence

Two storage keys used:
1. **`parkingChecklistState`**: JSON object with checkbox states (11 items)
2. **`fuelCalculatorState`**: JSON object with all calculator inputs from both pages

All values are automatically saved on input and restored on app load. CLR button clears all localStorage data.

### PWA Features

- **Offline-first**: Service Worker caches all resources
- **Cache strategy**: Pure cache-first (sw.js:62-108)
- **No network dependencies**: Works indefinitely offline once cached
- **Installable**: Full PWA manifest with icons
- **Touch optimized**: Swipe navigation, pull-to-refresh
- **Responsive**: Works on all screen sizes

### Service Worker (sw.js)

**Simple and reliable cache-first strategy:**
- Cache version: `fuel-pwa-v12`
- Install: Caches all files in CACHE_FILES array (lines 20-37)
- Activate: Deletes old caches (lines 40-58)
- Fetch: Serves from cache immediately, falls back to network (lines 62-108)
- No `navigator.onLine` checks (not available in SW context)
- Minimal logging to prevent memory issues

## Development Notes

### No Build Process
Pure vanilla HTML, CSS, and JavaScript. No npm, webpack, or any build tools. Simply open `index.html` in a browser or serve through a web server.

### Deployment Path
Designed for deployment at `/fuel-pwa/` path. All asset references use this prefix:
- Update if deploying to different path
- Affects: index.html (icon links), manifest.json (start_url, scope, icons), sw.js (CACHE_FILES)

### Testing Offline Functionality
1. Open app online (loads and caches resources)
2. Close browser completely
3. Disable network/wifi
4. Wait 20+ minutes
5. Open app - should work fully offline

### Updating the Application

**When modifying cached files** (index.html, manifest.json, assets):
1. Increment `CACHE_NAME` version in sw.js (line 1)
2. Test with hard refresh (Ctrl+Shift+R) or clear cache
3. Verify new SW activates in DevTools > Application

### Code Style
- Slovak language in console messages and some comments
- Functional programming for calculations
- Event-driven UI interactions
- No external dependencies

## Color Scheme

- **Primary Blue**: #0066cc (page titles, unit labels)
- **Orange (Unchecked)**: #FF8C00 (checklist items, borders)
- **Green (Checked/Action)**: #4CAF50 (checked items), #35c94e (CLR button)
- **Background Highlights**: #ffe4d1 (Page 1), #e4f1ff (Page 2)

## Critical Implementation Details

1. **Service Worker must NOT use `navigator.onLine`** - this property doesn't exist in SW context and causes failures
2. **SW registration outside window.onload** - ensures registration happens reliably
3. **localStorage keys**: Never change these without migration strategy
4. **Swipe navigation**: Uses touchstart/touchmove/touchend with scroll detection
5. **Form sync**: Remaining Fuel fields on pages 1 and 2 are bidirectionally synced
6. **CLR button**: Clears ALL data - calculator inputs, checklist, localStorage
