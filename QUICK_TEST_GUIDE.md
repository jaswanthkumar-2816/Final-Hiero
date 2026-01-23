# Quick Testing Guide - Resume Builder

## 🚀 Start Servers

Open 5 terminal windows and run:

```bash
# Terminal 1 - Gateway (Port 2816)
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
node gateway.js

# Terminal 2 - Frontend (Port 8082)  
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
node frontend-server.js

# Terminal 3 - Auth Backend (Port 3000)
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js

# Terminal 4 - Resume API (Port 5003)
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"
npm start

# Terminal 5 - Analysis API (Port 5001) [Optional]
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero backend"
node analysis-server.js
```

## 🌐 Access Application
Open: **http://localhost:2816**

## ✅ Test Checklist

### 1. Login & Session
- [ ] Can login via Google OAuth
- [ ] Can login via email/password
- [ ] After login, dashboard shows with profile
- [ ] Refresh page - still logged in (session persists)
- [ ] Click "Logout" - redirects to login page
- [ ] After logout, cannot access dashboard/resume builder

### 2. Template Selection (Step 1)
- [ ] Opens resume builder - shows Step 1: Choose Your Template
- [ ] Can filter templates by category (All, Simple, Modern, Creative, ATS)
- [ ] **NEW**: Can see "Elegant Gradient" in Modern category
- [ ] **NEW**: Can see "Minimalist Mono" in Simple category  
- [ ] Click "Preview" on any template - modal opens with preview
- [ ] Click "Start Building" - transitions to Step 2

### 3. Form Input (Step 2)
- [ ] Form shows "Step 2: Fill Your Information"
- [ ] Template name displayed in step indicator
- [ ] "Change Template" button visible
- [ ] Can fill all form fields:
  - Personal Info (name, email, phone) - required
  - Address, LinkedIn, Website - optional
  - Professional Summary - optional
  - Work Experience - add multiple
  - Education - add multiple  
  - Technical Skills, Soft Skills
  - References - add multiple
  - Custom Details - add multiple
- [ ] Can skip optional sections
- [ ] Can skip individual optional fields
- [ ] "Clear Form" and "Generate Resume" buttons visible

### 4. Mobile Testing
- [ ] Open on mobile device or use Chrome DevTools (F12 → Toggle Device)
- [ ] Header navigation buttons (Dashboard, Logout) visible and aligned
- [ ] Input fields don't cause zoom on iOS (font-size: 16px)
- [ ] All form sections display properly:
  - [ ] Personal Info fields
  - [ ] Education section (Degree, School, Year, GPA)
  - [ ] Technical Skills textarea
  - [ ] Soft Skills textarea
  - [ ] All sections fit within screen width
- [ ] Template grid shows single column
- [ ] Buttons are touch-friendly
- [ ] "Change Template" button works

### 5. PDF Generation
- [ ] Click "Generate Resume" with valid data
- [ ] See success message
- [ ] Result page shows "Your Resume is Ready!"
- [ ] Three buttons visible: "Edit Details", "Download PDF", "Preview"

### 6. Download & Preview
- [ ] Click "Preview" - PDF opens in new tab/window
- [ ] Preview shows correct template styling
- [ ] All filled data appears in preview
- [ ] Click "Download PDF" - PDF downloads with correct filename
  - Format: `{Name}_{template}_resume.pdf`
  - Example: `John_Doe_elegant-gradient_resume.pdf`
- [ ] Download includes all form data
- [ ] PDF formatting matches preview

### 7. Navigation Flow
- [ ] Click "Change Template" - returns to Step 1
- [ ] Selected template cleared
- [ ] Can select different template
- [ ] Form data NOT preserved (starts fresh)
- [ ] Logout clears all session data

### 8. New Templates Testing

#### Elegant Gradient:
- [ ] Select template from Modern category
- [ ] Fill form and generate PDF
- [ ] Preview shows:
  - Purple/blue gradient header
  - Playfair Display font for headings
  - Gradient background boxes for experience/education
  - Skills in grid layout
  - Professional elegant styling
- [ ] Download PDF looks identical to preview

#### Minimalist Mono:
- [ ] Select template from Simple category  
- [ ] Fill form and generate PDF
- [ ] Preview shows:
  - Black and white design
  - IBM Plex Mono font (monospace)
  - Border around entire resume
  - Section dividers (horizontal lines)
  - Uppercase section titles
  - Left border on experience/education items
  - Ultra-clean minimalist look
- [ ] Download PDF looks identical to preview

### 9. Error Handling
- [ ] Try generating resume without required fields - shows error
- [ ] Invalid email format - shows validation error
- [ ] Invalid phone format - shows validation error  
- [ ] Missing template selection - shows error and redirects to Step 1

### 10. Data Persistence
- [ ] Fill form partially
- [ ] Refresh page - returns to Step 1 (expected)
- [ ] Selected template saved in localStorage
- [ ] Login token persists in localStorage
- [ ] After logout, all data cleared from localStorage

## 🎨 Visual Checks

### Desktop (1920x1080):
- [ ] Header with green gradient background
- [ ] Dashboard and Logout buttons in top right
- [ ] Template grid shows 3-4 columns
- [ ] Form layout: 2 columns (left and right panes)
- [ ] All text readable and properly sized
- [ ] Green buttons with hover effects work

### Tablet (768px):
- [ ] Template grid shows 2 columns
- [ ] Form layout: single column (left pane above right pane)
- [ ] Header buttons properly positioned
- [ ] All inputs accessible

### Mobile (375px):
- [ ] Template grid shows 1 column
- [ ] Form layout: single column
- [ ] Header buttons side-by-side at top
- [ ] Input fields full width
- [ ] No horizontal scrolling
- [ ] Touch targets large enough (min 44x44px)

## 🐛 Common Issues & Solutions

### Issue: "Please login to access the resume builder"
**Solution**: Clear localStorage and login again

### Issue: Template not saving
**Solution**: Check browser console for errors, ensure localStorage is enabled

### Issue: PDF download fails
**Solution**: 
1. Check all 5 servers are running
2. Verify port 3000 (auth backend) is accessible
3. Check terminal logs for errors

### Issue: Mobile zoom on input focus (iOS)
**Solution**: Already fixed - inputs have font-size: 16px

### Issue: Header buttons not visible on mobile
**Solution**: Already fixed - buttons use flex layout with proper spacing

### Issue: Template preview not showing
**Solution**: Check browser console, might be a template name mismatch

## 📊 Performance Metrics

Expected response times:
- Template selection: Instant (<100ms)
- Form validation: Instant (<50ms)
- PDF generation: 2-5 seconds
- PDF download: 1-3 seconds
- Preview: 1-2 seconds

## 🎯 Success Criteria

All tests passing = ✅ **Ready for Production**

- Login/Session: 6/6 ✅
- Template Selection: 6/6 ✅
- Form Input: 12/12 ✅
- Mobile: 10/10 ✅
- PDF Generation: 6/6 ✅
- Download/Preview: 6/6 ✅
- Navigation: 5/5 ✅
- New Templates: 14/14 ✅
- Error Handling: 4/4 ✅
- Data Persistence: 5/5 ✅

**Total: 74 Test Cases**

## 📝 Notes

- Test on multiple browsers: Chrome, Firefox, Safari, Edge
- Test on actual mobile devices if possible
- Test with different screen sizes using DevTools
- Test with slow 3G network simulation
- Test error scenarios (no internet, server down, etc.)

---

**Happy Testing! 🚀**
