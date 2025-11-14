# Security Fixes Implementation Guide

This document provides step-by-step instructions and code snippets to fix all security vulnerabilities identified in the security audit.

---

## 🔴 CRITICAL FIX: XSS Vulnerability in Error Handling

### Issue
**Location:** index.html:959

**Current Code (VULNERABLE):**
```javascript
statusContent.innerHTML = '<p><span class="status-error">❌ Error: ' + error.message + '</span></p>';
```

### Fix Option 1: Use textContent (Recommended - Simplest)

```javascript
// Replace line 959 with:
const errorParagraph = document.createElement('p');
const errorSpan = document.createElement('span');
errorSpan.className = 'status-error';
errorSpan.textContent = '❌ Error: ' + error.message;
errorParagraph.appendChild(errorSpan);
statusContent.innerHTML = ''; // Clear existing content
statusContent.appendChild(errorParagraph);
```

### Fix Option 2: HTML Entity Escaping

```javascript
// Add this helper function at the top of the script section (after line 477):
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Replace line 959 with:
statusContent.innerHTML = '<p><span class="status-error">❌ Error: ' + escapeHtml(error.message) + '</span></p>';
```

### Fix Option 3: Template Literals with Sanitization

```javascript
// Replace line 959 with:
statusContent.innerHTML = '';
const errorElement = document.createElement('p');
errorElement.innerHTML = '<span class="status-error"></span>';
errorElement.querySelector('.status-error').textContent = '❌ Error: ' + error.message;
statusContent.appendChild(errorElement);
```

**Recommended:** Use Fix Option 1 (textContent) for maximum security.

---

## 🟠 HIGH PRIORITY: Implement Content Security Policy

### Add CSP Meta Tag

**Location:** index.html, inside `<head>` section (after line 19, before closing `</head>`)

```html
    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data:;
        connect-src 'self';
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        manifest-src 'self';
        worker-src 'self';
    ">

    <link rel="manifest" href="/fuel-pwa/manifest.json">
```

### Optional: Stricter CSP (After removing inline scripts)

Once inline event handlers are removed (see Medium Priority fixes):

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self';
    img-src 'self' data:;
    connect-src 'self';
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    manifest-src 'self';
    worker-src 'self';
">
```

---

## 🟡 MEDIUM PRIORITY: Input Validation

### Step 1: Add Input Validation Function

**Location:** Add after line 477 in the `<script>` section

```javascript
    <script>
    // Input validation helper function
    function validateNumericInput(value, min = 0, max = 999999, defaultValue = 0) {
        const parsed = parseFloat(value);

        // Check if NaN
        if (isNaN(parsed)) {
            return defaultValue;
        }

        // Check if negative
        if (parsed < min) {
            return min;
        }

        // Check if too large
        if (parsed > max) {
            return max;
        }

        // Check for Infinity
        if (!isFinite(parsed)) {
            return defaultValue;
        }

        return parsed;
    }

    window.onload = function() {
        // ... rest of code
```

### Step 2: Update Calculation Functions

**Replace lines 567-568:**
```javascript
// OLD:
const remainingFuel90 = parseFloat(elements.remainingFuel90.value) || 0;
const tripTaxiFuel = parseFloat(elements.tripTaxiFuel.value) || 0;

// NEW:
const remainingFuel90 = validateNumericInput(elements.remainingFuel90.value, 0, 999999, 0);
const tripTaxiFuel = validateNumericInput(elements.tripTaxiFuel.value, 0, 999999, 0);
```

**Replace lines 701-703:**
```javascript
// OLD:
const density = parseFloat(elements.fuelDensity.value) || 0.79;
const remainingFuelLbs = parseFloat(elements.remainingFuel.value) || 0;
const requiredFuelLbs = parseFloat(elements.requiredFuel.value) || 0;
let upliftLbs = parseFloat(elements.requiredUpliftLbs.value) || 0;

// NEW:
const density = validateNumericInput(elements.fuelDensity.value, 0.5, 1.0, 0.79);
const remainingFuelLbs = validateNumericInput(elements.remainingFuel.value, 0, 999999, 0);
const requiredFuelLbs = validateNumericInput(elements.requiredFuel.value, 0, 999999, 0);
let upliftLbs = validateNumericInput(elements.requiredUpliftLbs.value, 0, 999999, 0);
```

**Replace other parseFloat occurrences:**

Lines 638, 642, 649, 658, 689, 761, 773:
```javascript
// Find all instances of:
parseFloat(...)

// Replace with:
validateNumericInput(..., 0, 999999, 0)

// For density-specific inputs:
validateNumericInput(..., 0.5, 1.0, 0.79)

// For temperature-specific inputs:
validateNumericInput(..., -50, 100, 15)
```

### Step 3: Add HTML5 Input Constraints (Optional but Recommended)

Update all numeric input fields to include validation attributes:

```html
<!-- Example for remainingFuel (line 326) -->
<input type="text"
       inputmode="decimal"
       id="remainingFuel"
       pattern="[0-9]*\.?[0-9]*"
       title="Please enter a positive number">

<!-- Example for fuelDensity (line 340) -->
<input type="text"
       inputmode="decimal"
       id="fuelDensity"
       value="0.7900"
       pattern="0\.[0-9]{4}"
       title="Please enter density between 0.5 and 1.0">

<!-- Example for fuelTemperature (line 347) -->
<input type="text"
       inputmode="decimal"
       id="fuelTemperature"
       pattern="-?[0-9]*\.?[0-9]*"
       title="Please enter temperature in Celsius">
```

---

## 🟡 MEDIUM PRIORITY: localStorage Data Validation

### Update loadFormState Function

**Location:** Replace lines 831-845

```javascript
// Load saved form values with validation
function loadFormState() {
    try {
        const savedState = localStorage.getItem(FORM_STORAGE_KEY);
        if (!savedState) return;

        const state = JSON.parse(savedState);

        // Validate that state is an object
        if (typeof state !== 'object' || state === null) {
            console.warn('Invalid form state in localStorage, clearing...');
            localStorage.removeItem(FORM_STORAGE_KEY);
            return;
        }

        inputFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && state[fieldId] !== undefined && state[fieldId] !== '') {
                // Validate that value is a valid number string
                const value = String(state[fieldId]);

                // Allow negative, decimal, and positive numbers
                if (!/^-?\d*\.?\d+$/.test(value) && value !== '') {
                    console.warn(`Invalid value for ${fieldId}, skipping`);
                    return;
                }

                element.value = value;
            }
        });

        // Trigger calculations after loading
        updateCalculations();
        calculate90Percent();

    } catch (error) {
        console.error('Failed to load form state:', error);
        localStorage.removeItem(FORM_STORAGE_KEY);
    }
}
```

### Update loadChecklistState Function

**Location:** Replace lines 789-800

```javascript
// Načítanie stavu checklistu z localStorage
function loadChecklistState() {
    try {
        const savedState = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (!savedState) return;

        const state = JSON.parse(savedState);

        // Validate state structure
        if (typeof state !== 'object' || state === null) {
            console.warn('Invalid checklist state, clearing...');
            localStorage.removeItem(CHECKLIST_STORAGE_KEY);
            return;
        }

        checklistItems.forEach(item => {
            const itemKey = item.getAttribute('data-item');
            if (itemKey && state[itemKey] === true) {
                item.classList.add('checked');
            }
        });

    } catch (error) {
        console.error('Failed to load checklist state:', error);
        localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    }
}
```

---

## 🟡 MEDIUM PRIORITY: Remove Inline Event Handler

### Step 1: Remove onclick from HTML

**Location:** Line 309

**OLD:**
```html
<div id="versionInfo" onclick="checkPWAStatus()" title="Klikni pre zobrazenie PWA statusu">v0.81 📊</div>
```

**NEW:**
```html
<div id="versionInfo" title="Klikni pre zobrazenie PWA statusu">v0.81 📊</div>
```

### Step 2: Update JavaScript to Use addEventListener

**Location:** After line 961 (after checkPWAStatus function definition)

**OLD:**
```javascript
        // Funkcia pre kontrolu PWA statusu - spustí sa na klik
        window.checkPWAStatus = async function() {
            // ... function body ...
        };
```

**NEW:**
```javascript
        // Funkcia pre kontrolu PWA statusu
        async function checkPWAStatus() {
            // ... function body ... (same as before)
        }

        // Attach event listener to version info
        document.getElementById('versionInfo').addEventListener('click', checkPWAStatus);
```

---

## 🟢 LOW PRIORITY: Fix window.onload

### Replace window.onload with addEventListener

**Location:** Line 478

**OLD:**
```javascript
    window.onload = function() {
```

**NEW:**
```javascript
    window.addEventListener('DOMContentLoaded', function() {
```

**Note:** Also update the closing brace at line 982 to properly close the function.

---

## Implementation Checklist

Use this checklist to track your progress:

### Critical Fixes (Do First)
- [ ] Fix XSS vulnerability in error handling (line 959)
- [ ] Test error handling with various error messages
- [ ] Verify no innerHTML is used with untrusted data

### High Priority Fixes
- [ ] Add Content Security Policy meta tag
- [ ] Test application with CSP enabled
- [ ] Check browser console for CSP violations

### Medium Priority Fixes
- [ ] Add validateNumericInput function
- [ ] Update all parseFloat calls to use validation
- [ ] Add HTML5 input validation attributes
- [ ] Update loadFormState with validation
- [ ] Update loadChecklistState with validation
- [ ] Remove inline onclick handler
- [ ] Add addEventListener for versionInfo click
- [ ] Test localStorage loading/saving

### Low Priority Fixes
- [ ] Replace window.onload with addEventListener
- [ ] Test application initialization
- [ ] Verify all event listeners work correctly

### Testing
- [ ] Test all calculators (page 1 and page 2)
- [ ] Test checklist functionality
- [ ] Test clear button
- [ ] Test pull-to-refresh
- [ ] Test offline functionality
- [ ] Test localStorage persistence
- [ ] Test PWA installation
- [ ] Test on iOS Safari
- [ ] Test on Chrome/Firefox
- [ ] Run OWASP ZAP scan (optional)

### Version Update
- [ ] Increment app version to v0.82 (line 309)
- [ ] Increment cache version to v16 (sw.js line 1)
- [ ] Update CLAUDE.md with new versions
- [ ] Test Service Worker update

---

## Testing After Implementation

### Manual Testing

1. **Test XSS Fix:**
   ```javascript
   // In browser console:
   throw new Error('<img src=x onerror=alert("XSS")>');
   // Then click version info to trigger error display
   // Verify no alert() appears and error is displayed as text
   ```

2. **Test CSP:**
   - Open browser DevTools → Console
   - Look for CSP violation warnings
   - Verify no violations reported

3. **Test Input Validation:**
   ```javascript
   // Try entering these values in input fields:
   - Negative numbers: -100
   - Very large numbers: 999999999999
   - Special characters: <script>
   - Decimal numbers: 123.456
   - Verify all are handled gracefully
   ```

4. **Test localStorage:**
   - Enter values in all fields
   - Close and reopen application
   - Verify values are restored correctly
   - Open DevTools → Application → Local Storage
   - Manually edit stored values to invalid JSON
   - Reload page and verify graceful handling

### Automated Testing (Optional)

Create a test file `security-tests.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Security Tests</title>
</head>
<body>
    <h1>Security Test Results</h1>
    <div id="results"></div>

    <script>
        const results = [];

        // Test 1: XSS Prevention
        try {
            const maliciousInput = '<img src=x onerror=alert("XSS")>';
            const div = document.createElement('div');
            div.textContent = maliciousInput;

            if (div.innerHTML.includes('<img')) {
                results.push('❌ FAIL: XSS test failed - HTML not escaped');
            } else {
                results.push('✅ PASS: XSS test passed - HTML escaped');
            }
        } catch (e) {
            results.push('❌ ERROR: XSS test error - ' + e.message);
        }

        // Test 2: Input Validation
        try {
            function validateNumericInput(value, min = 0, max = 999999, defaultValue = 0) {
                const parsed = parseFloat(value);
                if (isNaN(parsed)) return defaultValue;
                if (parsed < min) return min;
                if (parsed > max) return max;
                if (!isFinite(parsed)) return defaultValue;
                return parsed;
            }

            const tests = [
                { input: '-100', expected: 0, desc: 'negative number' },
                { input: '9999999999', expected: 999999, desc: 'too large' },
                { input: 'abc', expected: 0, desc: 'non-numeric' },
                { input: '123.45', expected: 123.45, desc: 'valid decimal' },
            ];

            let passed = 0;
            tests.forEach(test => {
                const result = validateNumericInput(test.input);
                if (result === test.expected) {
                    passed++;
                } else {
                    results.push(`❌ FAIL: Input validation for ${test.desc}`);
                }
            });

            if (passed === tests.length) {
                results.push('✅ PASS: All input validation tests passed');
            }
        } catch (e) {
            results.push('❌ ERROR: Input validation test error - ' + e.message);
        }

        // Display results
        document.getElementById('results').innerHTML = results.join('<br>');
    </script>
</body>
</html>
```

---

## Version Control

After implementing all fixes, update version numbers:

1. **index.html line 309:**
   ```html
   <div id="versionInfo" title="Klikni pre zobrazenie PWA statusu">v0.82 📊</div>
   ```

2. **sw.js line 1:**
   ```javascript
   const CACHE_NAME = 'fuel-pwa-v16';
   ```

3. **CLAUDE.md:**
   Update these lines in the Service Worker section:
   ```markdown
   - **Current cache version**: v16
   - **Current app version**: v0.82
   ```

---

## Deployment Steps

1. Implement all fixes
2. Test locally
3. Update version numbers
4. Commit changes with message: "Security fixes: XSS, CSP, input validation (v0.82)"
5. Push to main branch
6. Wait for GitHub Pages deployment (1-2 minutes)
7. Test deployed version
8. Clear Safari cache and reinstall PWA
9. Verify offline functionality

---

## Support

If you encounter issues during implementation:

1. Check browser console for errors
2. Verify CSP is not blocking necessary resources
3. Test in multiple browsers (Safari, Chrome, Firefox)
4. Use browser DevTools to debug Service Worker
5. Check localStorage in DevTools → Application → Local Storage

---

**Last Updated:** 2025-11-14
**Corresponding Audit Report:** SECURITY_AUDIT_REPORT.md
