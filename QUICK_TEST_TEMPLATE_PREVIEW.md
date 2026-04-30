# Quick Test Guide - Template Preview Fix 🧪

## Prerequisites
✅ Backend server must be running on port 3000

## Start Backend Server
```bash
cd "login system"
node main.js
```

You should see:
```
✅ Server started on port 3000
```

## Test Steps

### 1. Open Resume Builder
- Navigate to: `hiero last prtotype/jss/hiero/hiero last/public/resume-builder.html`
- Or use Live Server in VS Code

### 2. Test Template Preview

#### Test Case 1: Click Preview on Any Template
1. Find any template card (e.g., "Classic Professional")
2. Click the template preview area or "Preview" button
3. **Expected:** 
   - Modal opens
   - Loading spinner appears briefly
   - Preview loads with sample data
   - Template styling matches backend

#### Test Case 2: Try All Templates
Test each template one by one:
- ✅ Classic Professional
- ✅ Minimal  
- ✅ Modern Professional
- ✅ Tech Focus
- ✅ Creative Bold
- ✅ Portfolio Style
- ✅ ATS Optimized
- ✅ Corporate ATS
- ✅ Elegant Gradient
- ✅ Minimalist Mono

**Expected:** Each template shows unique styling from backend

#### Test Case 3: Modal Controls
1. Click preview on any template
2. Try closing the modal:
   - Click the × button in top-right
   - Click outside the modal (on dark background)
3. **Expected:** Modal closes properly

#### Test Case 4: Use Template Button
1. Click preview on a template
2. Click "Use This Template" button
3. **Expected:** 
   - Modal closes
   - Form appears (Step 2)
   - Template is selected

### 3. Test Error Handling

#### Test Case 5: Backend Offline
1. Stop the backend server (Ctrl+C)
2. Click preview on any template
3. **Expected:**
   - Loading spinner appears
   - Error message shows: "Failed to load preview"
   - User can still click "Use This Template" to proceed

#### Test Case 6: Network Issues
- Same as Test Case 5

## What to Look For

### ✅ Good Signs:
- Previews load within 1-2 seconds
- Template styles match backend exactly
- No console errors
- Smooth animations
- All templates work

### ❌ Bad Signs:
- Infinite loading spinner
- Console errors about CORS
- Preview shows wrong template
- Modal doesn't close
- Broken styles

## Console Logs to Check

Open browser DevTools (F12) → Console tab

### Successful Preview:
```
POST http://localhost:3000/preview-resume 200 OK
```

### Backend Offline:
```
POST http://localhost:3000/preview-resume net::ERR_CONNECTION_REFUSED
Error fetching preview: Failed to fetch
```

## Troubleshooting

### Problem: Preview not loading
**Solution:** 
1. Check if backend is running: `http://localhost:3000/health`
2. Check console for errors
3. Verify no CORS issues

### Problem: Wrong template appears
**Solution:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check `templateId` being sent to backend

### Problem: Modal won't close
**Solution:** 
1. Refresh page
2. Check browser console for errors
3. Try different template

## API Test (Optional)

Test backend directly with curl:

```bash
curl -X POST http://localhost:3000/preview-resume \
  -H "Content-Type: application/json" \
  -d '{
    "template": "modern-pro",
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "555-1234"
    },
    "summary": "Test summary"
  }'
```

**Expected:** HTML response with template

## Success Criteria

✅ All 10 templates preview correctly  
✅ Backend-generated HTML renders properly  
✅ Loading states work smoothly  
✅ Error handling shows user-friendly messages  
✅ Modal controls (close, use template) work  
✅ No console errors  
✅ Preview matches final PDF styling  

## Next: Generate Full Resume

After template preview works:
1. Click "Use This Template"
2. Fill form with data (or click "Fill Sample Data")
3. Click "Preview Resume"
4. Verify final resume matches template preview

---

**Note:** If backend is not running, previews will show error message but users can still select template and proceed.
