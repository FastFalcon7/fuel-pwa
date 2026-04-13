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
- **Cache strategy**: SIMPLE cache-first (cache → network → cache fallback)
- **Offline functionality**: ✅ **PRODUCTION VERIFIED** - tested 12+ hours on iPad, 3+ hours on iPhone
- **Persistent Storage**: Uses `navigator.storage.persist()` to request persistent cache (iOS 15.2+)
- **CRITICAL**: NO navigator.onLine (doesn't exist in SW context!)
- **CRITICAL**: NO console.log in fetch handler (causes memory issues)
- **CRITICAL**: NO complex timestamp validations or background refresh checks
- **Current cache version**: v20 (update this when cache version changes)
- **Current app version**: v0.86 (displayed in UI)

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
- Cache validation with timestamp checking
- Background refresh of cached resources
- Message handling for cache updates

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
- Density unit preference saved separately with key: `fuelDensityUnit`
- Clear button removes both form values, checklist state, and density unit preference from localStorage
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

### Service Worker Critical Rules
**NEVER use these in Service Worker context:**
- ❌ `navigator.onLine` - does NOT exist in SW, causes crashes
- ❌ Excessive `console.log` in fetch handler - fills memory, causes issues
- ❌ Complex timestamp/cache validations - causes offline failures
- ❌ Background refresh checks with `navigator.onLine`

**ALWAYS use:**
- ✅ Simple cache-first strategy: `caches.match()` → `fetch()` → `caches.match()` fallback
- ✅ Minimal logging (only in install/activate)
- ✅ Pure promises without async/await complexity
- ✅ Test offline for 20+ minutes to verify

---

## 🚫 Failed Attempts Log (Post v0.3)

**DÔLEŽITÉ:** Táto sekcia dokumentuje pokusy o predĺženie offline času, ktoré ZLYHALI. Nevracať sa k týmto prístupom!

### ❌ V0.4 - IndexedDB Backup v Install Event
**Cieľ:** Multi-layer persistence (Cache API + IndexedDB backup)

**Implementácia:**
- IndexedDB backup kritických súborov v `install` event
- Fetch súborov počas inštalácie SW
- IDB ako fallback pri cache eviction

**Výsledok:** ❌ ZLYHAL - fungoval len 5 minút (horšie ako v0.3!)

**Prečo zlyhalo:**
- `await fetch()` v install event spôsobil **SW activation timeout**
- iOS Safari ukončuje "heavy" SW inštalácie
- SW lifecycle narušený - nezaregistroval sa správne

**Poučenie:**
- ❌ **NIKDY** fetch v install event
- ❌ Async operácie v install = timeout risk
- ✅ Install musí byť rýchly - len `cache.addAll()`

---

### ❌ V0.5 - Lazy IndexedDB Backup
**Cieľ:** Oprava v0.4 - lazy backup namiesto eager v install

**Implementácia:**
- Install: len `cache.addAll()` (rýchle)
- IDB backup pri prvom cache hit (lazy)
- Postupné naplnenie IDB počas používania

**Výsledok:** ❌ ZLYHAL - stále nefungovalo offline

**Prečo zlyhalo:**
- Lazy backup sa možno nespustil včas
- IDB prázdna pri offline teste
- Komplexnosť pridala ďalšie fail pointy

**Poučenie:**
- ❌ IndexedDB nepomohlo pri iOS cache eviction
- ❌ Lazy stratégia nefunguje pre kritické súbory
- ✅ Jednoduchosť > komplexnosť

---

### ❌ V0.6-V0.7.2 - Debug Tools + Diagnostika
**Cieľ:** Zistiť prečo offline nefunguje

**Implementácia:**
- v0.6: Auto IDB backup (30s timer) + debug panel
- v0.7: Eruda mobile console
- v0.8: SW Status checker
- v0.9: Immediate SW status alerts
- v0.7.1: SW registration debug alerts
- v0.7.2: JS execution test alert

**Výsledok:** ❌ KRITICKÉ ZISTENIE - **Service Worker sa VÔBEC NEZAREGISTROVAL**

**Diagnostika:**
- ✅ JavaScript sa spúšťa (v0.7.2 alert fungoval)
- ❌ `window.onload` event možno failuje
- ❌ SW registrácia ticho zlyhala
- ❌ Eruda console prázdna = žiadne logy
- ❌ Aplikácia sa načítava dlhšie (performance degradácia)

**Prečo zlyhalo:**
- Pridanie debug nástrojov pokazilo SW registráciu
- Príliš veľa zmien naraz (IndexedDB + Eruda + alerty)
- Možno JS error pred SW registráciou
- Safari/iOS môže blokovať SW v určitých podmienkach

**Poučenie:**
- ❌ **Debugging tools môžu pokaziť produkčný kód**
- ❌ Príliš veľa zmien naraz = neidentifikovateľné problémy
- ❌ Eruda/alerts môžu spomaliť načítanie
- ✅ **JEDNA zmena, jeden test, metodicky**
- ✅ Ak funguje, neopravuj (v0.3 fungovalo!)

---

### 📊 Záver Failed Attempts

**Čo nefunguje pre iOS Safari offline:**
1. ❌ IndexedDB backup (eager ani lazy)
2. ❌ Fetch v install event
3. ❌ Komplexné SW stratégie
4. ❌ Debug nástroje v produkcii
5. ❌ Viacero zmien naraz

**Čo SA NAUČILO:**
1. ✅ **V0.3 cache-first stratégia FUNGUJE (20 min)**
2. ✅ Jednoduchosť je kľúčová
3. ✅ iOS Safari má špecifické limity
4. ✅ SW registrácia môže ticho zlyhať
5. ✅ Jedna zmena, jeden test, methodicky

**Ďalší krok:**
- Zostať pri v0.3 (overené funkčné)
- Riešiť LEN jedno: Ako predĺžiť 20 min?
- Možnosti: Persistent Storage API, manifest tweaks, Service Worker optimalizácie
- **BEZ** IndexedDB, **BEZ** debug tools, **BEZ** komplexity

---

## ✅ V0.8 - Persistent Storage API + Clean SW

**Dátum:** 2025-11-13

**Cieľ:** Predĺžiť offline čas nad 20 minút pomocou Persistent Storage API

**Implementácia:**

1. **Oprava kritických bugov v sw.js:**
   - ❌ Odstránené `navigator.onLine` checks (riadky 80, 134) - toto NEEXISTUJE v SW!
   - ❌ Odstránené komplexné timestamp validácie
   - ❌ Odstránený message handler (UPDATE_CACHE)
   - ✅ Vrátené k SIMPLE cache-first stratégii (v0.3 clean version)

2. **Pridaná Persistent Storage API:**
   - `navigator.storage.persist()` request po SW registrácii
   - iOS 15.2+ podporuje persistent storage
   - Zabráni iOS Safari aby vymazal cache pri low memory
   - Logging storage quota/usage pre debugging

3. **Zjednodušenia:**
   - Odstránený visibilitychange handler
   - Žiadne background refresh checks
   - Žiadne timestamp tracking
   - Žiadne online/offline detekcie

**Zmeny v súboroch:**
- `sw.js`: Zjednodušený na 73 riadkov (z 160)
- `index.html`: Pridaný Persistent Storage request, verzia v0.8
- `manifest.json`: Bez zmien (už optimalizovaný)
- `CLAUDE.md`: Aktualizovaná dokumentácia

**Očakávaný výsledok:**
- Persistent Storage API požiada iOS Safari o ochranu cache
- Cache by mala vydržať dlhšie ako 20 minút
- Simple SW stratégia = menej fail points

**Test plán:**
1. Deploy na GitHub Pages
2. Nainštalovať na iPhone ako PWA
3. Kliknúť na `v0.8 📊` pre zobrazenie statusu
4. Skontrolovať: "✅ Persistent Storage: GRANTED"
5. Vypnúť WiFi/mobilné dáta
6. Zatvoriť PWA a znovu otvoriť po 30-60 minútach offline
7. Overiť že aplikácia funguje

**Test výsledky:** ✅ **ÚSPECH!**
- **iPad:** 12+ hodín offline - aplikácia fungovala perfektne! 🎉
- **iPhone:** 3+ hodiny offline - aplikácia fungovala! 🎉
- **Zlepšenie:** Z 10-20 minút na niekoľko hodín (60x-18x lepšie!)
- **Persistent Storage:** GRANTED na oboch zariadeniach
- **Záver:** Persistent Storage API vyriešilo problém s iOS cache eviction

**Status:** ✅ **VYRIEŠENÉ - Produkčné**

---
