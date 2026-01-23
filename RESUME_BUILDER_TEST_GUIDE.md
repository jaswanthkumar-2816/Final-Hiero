# 🧪 Resume Builder - Quick Test Guide

## Quick Start Testing

### 1. Restart Servers
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder"
./restart-all-5-servers.sh
```

### 2. Test Desktop

#### A. Not Logged In
```
1. Open: http://localhost:2816/dashboard/resume-builder.html
2. ✅ Should see alert: "Please login to access the resume builder"
3. ✅ Should redirect to login page
```

#### B. After Login
```
1. Go to: http://localhost:2816
2. Click "Get Started"
3. Login with Google
4. ✅ Should land on dashboard
5. Click "Create Resume" (or go to /dashboard/resume-builder.html)
6. ✅ Should see Step 1: Template Selection
7. ✅ Form should be HIDDEN
```

#### C. Select Template & Fill Form
```
1. Click "Start Building" on any template (e.g., Modern Professional)
2. ✅ Should hide template selection
3. ✅ Should show Step 2: Fill Information
4. ✅ Should see "Change Template" button on left
5. ✅ Step indicator shows: "Step 2: Fill Your Information (Using Modern Professional template)"
6. Fill in some details (name, email, etc.)
7. Click "Generate Resume"
8. ✅ PDF should download with selected template design
```

#### D. Test Navigation
```
1. Click "Dashboard" button (top right)
2. ✅ Goes to /dashboard
3. Click "Create Resume" again
4. ✅ Shows Step 1 (template selection) again - FRESH START
5. Click "Change Template" button (in Step 2)
6. ✅ Returns to Step 1
```

#### E. Test Logout
```
1. Click "Logout" button (top right)
2. ✅ Shows confirmation: "Are you sure you want to logout?"
3. Click "OK"
4. ✅ Redirects to /dashboard/login.html
5. Try to access /dashboard/resume-builder.html directly
6. ✅ Should redirect to login again
```

---

### 3. Test Mobile (ngrok)

```bash
# Start ngrok
ngrok http 2816

# Visit on phone: https://your-ngrok-url.ngrok-free.app
```

#### A. Login on Mobile
```
1. Open ngrok URL on phone
2. Login with Google
3. ✅ Dashboard loads with styles
4. Click "Create Resume"
```

#### B. Template Selection on Mobile
```
1. ✅ See all templates in grid
2. ✅ Can scroll through templates
3. ✅ Click "Start Building"
4. ✅ Moves to Step 2
```

#### C. Navigation on Mobile
```
1. ✅ Dashboard button visible (top right)
2. ✅ Logout button visible (top right)
3. ✅ "Change Template" button visible
4. ✅ All buttons are tap-able (not too small)
```

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Access builder without login | ❌ Redirected to login |
| Access builder after login | ✅ Shows Step 1 (templates) |
| Select template | ✅ Moves to Step 2 (form) |
| Generate resume | ✅ PDF downloads with correct template |
| Return to builder | ✅ Shows Step 1 again |
| Click "Change Template" | ✅ Returns to Step 1 |
| Click "Dashboard" | ✅ Goes to dashboard |
| Click "Logout" | ✅ Confirmation → Login page |
| Try to access after logout | ❌ Redirected to login |

---

## Common Issues & Fixes

### ❌ "Template not found" in PDF
**Problem:** Backend doesn't have template
**Fix:** Need to implement backend templates (see next document)

### ❌ Page doesn't redirect to login
**Problem:** Token still in localStorage
**Fix:** 
```javascript
// Clear in browser console:
localStorage.clear();
```

### ❌ Can't click buttons on mobile
**Problem:** Buttons too small
**Fix:** Already fixed with responsive CSS (min 44x44px)

### ❌ Form data not clearing
**Problem:** localStorage persisting data
**Fix:** Add form reset on page load if needed

---

## Next Steps

1. ✅ Test the complete flow
2. 🔧 Implement backend template rendering
3. 🎨 Add 2 new standout templates (as requested)
4. ✅ Ensure template selection works end-to-end

---

**Quick Test Script:**
```bash
# 1. Start servers
./restart-all-5-servers.sh

# 2. Open browser
open http://localhost:2816

# 3. Login → Resume Builder → Select Template → Generate PDF

# 4. Test logout and re-login flow
```

**Status:** ✅ Frontend flow complete - ready for testing!
