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
   - Checklist state persistence using localStorage
   - Service Worker registration and offline functionality
   - Mobile-optimized numeric keyboard (inputmode="decimal")

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
- **Persistent storage**: Checklist state saved in localStorage

#### Service Worker (sw.js)
- **Cache strategy**: Cache-first with background refresh
- **Cache expiration**: 7-day cache duration with automatic updates
- **Offline fallback**: Graceful degradation when offline
- **Current version**: v8 (update this when cache version changes)

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
- Pull-to-refresh functionality (clears forms)
- Clear button functionality (bottom right, clears all inputs)
- Checklist management with localStorage persistence

### Service Worker Functions
- Cache validation with timestamp checking
- Background refresh of cached resources
- Message handling for cache updates

## Important Notes

### Input Fields
All input fields use `type="text"` with `inputmode="decimal"` to ensure numeric keyboard appears on mobile devices (iPhone/iPad). This provides better user experience than `type="number"`.

### Cache Management
When making significant changes to the app:
1. Increment cache version in `sw.js` (CACHE_NAME and DYNAMIC_CACHE)
2. Update version number in CLAUDE.md under "Service Worker" section
3. This forces cache refresh for all users

### Pull-to-Refresh
Pull-to-refresh gesture **clears the form** (same as Clear button). It does NOT refresh/update the app.
