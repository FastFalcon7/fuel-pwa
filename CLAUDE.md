# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Progressive Web Application (PWA)** for aviation fuel calculations, specifically designed for Jet A-1 fuel uplift calculations. The application is a single-page web app that works offline and can be installed on mobile devices.

## Architecture

### File Structure
- `index.html` - Main application file containing all HTML, CSS, and JavaScript
- `manifest.json` - PWA manifest defining app metadata and icons
- `sw.js` - Service Worker handling offline functionality and caching
- `assets/` - Directory containing app icons and screenshots in various sizes
- `README.md` - User guide for installation and usage on iOS devices

### Code Organization
The application is built as a **single-file architecture** with all code embedded in `index.html`:

1. **HTML Structure**: Three-page layout using CSS transforms for navigation
   - Page 1: Standard fuel uplift calculator
   - Page 2: "90%" fuel uplift calculator for specific aviation scenarios
   - Page 3: Parking checklist with interactive checkboxes

2. **CSS Styling**: Responsive design with mobile-first approach
   - Supports both mobile and desktop layouts
   - Touch-friendly interface with swipe navigation
   - Fixed positioning for clear button and page indicators
   - Blue color scheme for page titles (#0066cc)
   - Orange checklist items with hover/checked states

3. **JavaScript Functionality**:
   - Fuel calculation logic with density/temperature conversions
   - Unit conversion between pounds (lbs), liters (L), and US gallons (USG)
   - Touch gesture handling for page navigation (swipe left/right)
   - Form synchronization between both calculator pages
   - Pull-to-refresh functionality for clearing forms
   - **Form values persistence** using localStorage (all input fields)
   - **Checklist state persistence** using localStorage
   - Service Worker registration and offline functionality
   - Mobile-optimized numeric keyboard (inputmode="decimal")
   - **Version display** in bottom left corner

### Key Components

#### Fuel Calculation Logic
- **Density calculations**: Temperature-based fuel density adjustments
- **Unit conversions**: Between lbs, liters, and US gallons
- **Required uplift**: Calculated from remaining fuel and required fuel
- **90% calculation**: Specialized calculation for aviation fuel planning

#### PWA Features
- **Offline functionality**: Service Worker caches all resources
- **Installable**: Can be installed on iPhone/iPad via Safari "Add to Home Screen"
- **Responsive**: Works on all screen sizes
- **Touch optimized**: Swipe navigation and pull-to-clear functionality
- **Persistent storage**: All form values and checklist state saved in localStorage
- **Version tracking**: Version number visible in bottom left corner (v0.0, v0.1, etc.)

#### Service Worker (sw.js)
- **Cache strategy**: Multi-layer persistence (Cache API → IndexedDB → Network)
- **Offline functionality**: Enhanced with IndexedDB backup for critical files
- **IndexedDB backup**: Critical files (index.html, manifest.json) backed up to IndexedDB
- **iOS Safari resilience**: IndexedDB is more resistant to cache eviction than Cache API
- **Background refresh**: Updates both Cache API and IndexedDB when online
- **Message handlers**:
  - UPDATE_CACHE: Force refresh of cache and IDB backups
  - VERIFY_CACHE: Verify contents of Cache API and IndexedDB
- **Current cache version**: v13 (update this when cache version changes)
- **Current app version**: v0.4 (displayed in UI)

## Development Notes

### No Build Process
This project doesn't use any build tools or package managers. All code is vanilla HTML, CSS, and JavaScript. Simply open `index.html` in a web browser or serve it through a web server.

### Testing
- Test on mobile devices for touch interactions
- Verify offline functionality by disabling network
- Check PWA installation on mobile browsers
- Test swipe navigation between calculator pages

### Deployment
The app is deployed to GitHub Pages at: https://fastfalcon7.github.io/fuel-pwa/
All asset paths are absolute and include the `/fuel-pwa/` prefix.

**Deployment workflow:**
1. Push changes to `main` branch
2. GitHub Pages automatically deploys (1-2 minutes)
3. Users may need to clear Safari cache to see updates

**Branch strategy:**
- `main` - production branch (only branch in use)

### Code Style
- Uses Slovak language for console messages and some comments
- Follows functional programming patterns for calculations
- Event-driven architecture for UI interactions
- Extensive use of vanilla JavaScript without external dependencies

## Key Functions

### Calculation Functions (index.html:449-513)
- `calculateDensity(temperature)` - Calculates fuel density from temperature
- `calculateTemperature(density)` - Reverse calculation
- `convertToLiters/convertFromLiters` - Unit conversion utilities
- `updateCalculations()` - Main calculation orchestrator

### UI Functions
- Swipe gesture handling for page navigation (left/right between 3 pages)
- Form synchronization between calculator pages
- Pull-to-refresh functionality (clears forms and localStorage)
- Clear button functionality (bottom right, clears all inputs and localStorage)
- Checklist management with localStorage persistence
- Form values persistence (auto-save on every input change)
- `loadFormState()` - Restores all form values from localStorage on page load
- `saveFormState()` - Saves all form values to localStorage

### Service Worker Functions
- **Multi-layer fetch**: Cache API → IndexedDB → Network
- **IndexedDB helpers**: openIDB(), saveToIDB(), getFromIDB()
- **Background refresh**: Updates both Cache API and IndexedDB
- **Cache restoration**: Automatically restores Cache API from IndexedDB
- **Message handling**: UPDATE_CACHE (refresh), VERIFY_CACHE (diagnostics)

## Important Notes

### Version Management
**IMPORTANT:** Every time you make changes to the app, you MUST update version numbers:

1. **Update app version in HTML** (index.html):
   - Find: `<div id="versionInfo">v0.0</div>`
   - Change to: `v0.1`, `v0.2`, `v0.3`, etc. (increment by 0.1 each time)
   - This version is visible to users in bottom left corner

2. **Update cache version in sw.js**:
   - Increment `CACHE_NAME` from `fuel-pwa-v9` to `fuel-pwa-v10`, etc.
   - Increment `DYNAMIC_CACHE` similarly (e.g., `fuel-pwa-dynamic-v9` → `fuel-pwa-dynamic-v10`)
   - This forces all users to download fresh app files

3. **Update CLAUDE.md**:
   - Update "Current cache version" under "Service Worker" section
   - Update "Current app version" under "Service Worker" section

**Why this matters:**
- Users can verify they have the latest version (check bottom left)
- Cache version change forces browser to download updated files
- Prevents users from running old cached versions with bugs

### Input Fields
All input fields use `type="text"` with `inputmode="decimal"` to ensure numeric keyboard appears on mobile devices (iPhone/iPad). This provides better user experience than `type="number"`.

### Form Persistence
- All input field values are automatically saved to localStorage on every change
- Values persist after closing/reopening the app
- Saved fields: `remainingFuel`, `requiredFuel`, `fuelDensity`, `fuelTemperature`, `requiredUpliftLbs`, `actualUplift`, `remainingFuel90`, `tripTaxiFuel`
- Clear button removes both form values and checklist state from localStorage
- Uses storage key: `fuelCalculatorFormState`

### Checklist Persistence
- Checklist state saved to localStorage automatically when items are checked/unchecked
- Persists after app close/reopen
- Uses storage key: `parkingChecklistState`

### Cache Management
When making significant changes to the app:
1. Increment cache version in `sw.js` (CACHE_NAME and DYNAMIC_CACHE)
2. Update version number in CLAUDE.md under "Service Worker" section
3. This forces cache refresh for all users

### Pull-to-Refresh
Pull-to-refresh gesture **clears the form and localStorage** (same as Clear button). It does NOT refresh/update the app.

### Service Worker Implementation Details

**Current approach (v13 - Enhanced with IndexedDB):**
- ✅ Multi-layer persistence: Cache API → IndexedDB → Network
- ✅ IndexedDB backup for critical files (index.html, manifest.json)
- ✅ iOS Safari resilient: IDB more resistant to cache eviction
- ✅ Cache restoration: IDB automatically restores Cache API if evicted
- ✅ Background refresh updates both Cache API and IndexedDB
- ✅ Message handlers: UPDATE_CACHE, VERIFY_CACHE
- ✅ No timestamp validation (not needed for offline-first)

**Critical implementation:**
1. **Cache API first** (fastest) → serve immediately
2. **IndexedDB fallback** (iOS resilient) → if cache evicted
3. **Network fallback** → if both offline stores empty
4. **Automatic cache restoration** → IDB restores Cache API when serving
5. **Background refresh** → updates both stores when online
6. **Critical file backup** → only index.html and manifest.json in IDB (saves storage)

**Why IndexedDB solves the problem:**
- iOS Safari aggressively evicts Cache API after ~20-30 minutes
- IndexedDB has better persistence characteristics on iOS
- When Cache API is evicted, IDB serves the file AND restores the cache
- This creates a self-healing cache system

**Testing requirement:**
- Test offline for 1+ hours to verify iOS cache eviction handling
- Monitor console for "Serving from IndexedDB" messages
