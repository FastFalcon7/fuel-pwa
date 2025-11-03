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

### Code Organization
The application is built as a **single-file architecture** with all code embedded in `index.html`:

1. **HTML Structure**: Two-page layout using CSS transforms for navigation
   - Page 1: Standard fuel uplift calculator
   - Page 2: "90%" fuel uplift calculator for specific aviation scenarios

2. **CSS Styling**: Responsive design with mobile-first approach
   - Supports both mobile and desktop layouts
   - Touch-friendly interface with swipe navigation
   - Fixed positioning for clear button and page indicators

3. **JavaScript Functionality** (lines 292-650 in index.html):
   - Fuel calculation logic with density/temperature conversions
   - Unit conversion between pounds (lbs), liters (L), and US gallons (USG)
   - Touch gesture handling for page navigation
   - Form synchronization between both calculator pages
   - Service Worker registration and offline functionality

### Key Components

#### Fuel Calculation Logic
- **Density calculations**: Temperature-based fuel density adjustments
- **Unit conversions**: Between lbs, liters, and US gallons
- **Required uplift**: Calculated from remaining fuel and required fuel
- **90% calculation**: Specialized calculation for aviation fuel planning

#### PWA Features
- **Offline functionality**: Service Worker caches all resources
- **Installable**: Can be installed on mobile devices
- **Responsive**: Works on all screen sizes
- **Touch optimized**: Swipe navigation and pull-to-refresh

#### Service Worker (sw.js)
- **Cache strategy**: Cache-first with background refresh
- **Cache expiration**: 7-day cache duration with automatic updates
- **Offline fallback**: Graceful degradation when offline

## Development Notes

### No Build Process
This project doesn't use any build tools or package managers. All code is vanilla HTML, CSS, and JavaScript. Simply open `index.html` in a web browser or serve it through a web server.

### Testing
- Test on mobile devices for touch interactions
- Verify offline functionality by disabling network
- Check PWA installation on mobile browsers
- Test swipe navigation between calculator pages

### Deployment
The app is designed to be deployed to a web server with the path `/fuel-pwa/`. All asset paths are absolute and include this prefix.

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

### UI Functions (index.html:321-647)
- Swipe gesture handling for page navigation
- Form synchronization between calculator pages
- Pull-to-refresh functionality
- Clear button functionality

### Service Worker Functions (sw.js:24-159)
- Cache validation with timestamp checking
- Background refresh of cached resources
- Message handling for cache updates
