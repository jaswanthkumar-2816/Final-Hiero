# ✅ Quick Setup Checklist - Review System

## Before You Start

Follow these steps to set up the review system and admin dashboard:

---

## 🔧 Step 1: Configure Admin Email

**Choose one of these methods:**

### Option A: Using .env file (Recommended)
1. Open: `/hiero backend/.env`
2. Add this line (replace with your email):
   ```env
   ADMIN_EMAIL=your-email@example.com
   ```
3. Save the file

### Option B: Direct Configuration
1. Open: `/hiero backend/routes/reviewRoutes.js`
2. Find line ~204 with `ADMIN_EMAILS` array
3. Replace `'jaswanthkumar@example.com'` with your actual email
4. Save the file

**Example:**
```javascript
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'myemail@gmail.com',      // ← Put your email here
  'admin@hiero.com'
];
```

---

## 🚀 Step 2: Start Your Servers

### Start Backend:
```bash
cd "hiero backend"
npm start
```
✅ Backend should run on: http://localhost:5001

### Start Frontend (if separate):
If you're using a separate frontend server:
```bash
cd "hiero last prtotype/jss/hiero/hiero last/public"
# Use your preferred method to serve static files
```
✅ Frontend should run on: http://localhost:3000

---

## 🧪 Step 3: Test the System

### Test 1: Login as Regular User
1. Go to: http://localhost:3000/login
2. Login with any user account
3. ✅ You should see the dashboard with review section
4. ✅ Review section should be visible below welcome message

### Test 2: Submit a Review
1. Click on stars to rate (1-5)
2. Write feedback in text area
3. Click "Submit Review"
4. ✅ Should see success message
5. ✅ Review should display below with "Edit Review" button

### Test 3: Edit Your Review
1. Click "Edit Review" button
2. Change rating and/or text
3. Click "Update Review"
4. ✅ Should see updated review

### Test 4: Login Again (Same User)
1. Logout
2. Login again with same email
3. ✅ Should see your existing review
4. ✅ Unique visitor count should NOT increase

### Test 5: Admin Access
1. Logout
2. Login with **admin email** (the one you configured)
3. ✅ Should see "🎛️ Admin Dashboard" button (bottom right)
4. Click the admin button
5. ✅ Should load admin dashboard with statistics

### Test 6: Admin Dashboard Features
Check that you can see:
- ✅ Total Users count
- ✅ Unique Visitors count
- ✅ Total Logins count
- ✅ Average Rating
- ✅ Total Reviews count
- ✅ User analytics table
- ✅ All reviews section

### Test 7: Non-Admin Access (Verification)
1. Logout from admin account
2. Login with non-admin email
3. ✅ Should NOT see admin dashboard button
4. Try accessing: http://localhost:3000/admin-dashboard.html directly
5. ✅ Should see "Access Denied" message

---

## ❓ Troubleshooting

### Problem: "Cannot connect to backend"
**Solution:**
```bash
# Check if backend is running
curl http://localhost:5001/health

# If not running, start it:
cd "hiero backend"
npm start
```

### Problem: "Admin dashboard button not showing"
**Solution:**
1. Verify your email in ADMIN_EMAILS array
2. Clear browser cache: `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
3. Clear localStorage:
   - Open browser DevTools (F12)
   - Go to Application tab
   - Click "Local Storage"
   - Delete all items
4. Logout and login again

### Problem: "Access Denied" on admin dashboard
**Solution:**
1. Check your email matches ADMIN_EMAILS exactly
2. Check backend console for errors
3. Verify JWT token is not expired
4. Try logout and login again

### Problem: "Review not submitting"
**Solution:**
1. Select a rating (click on stars)
2. Write some text in review box
3. Check browser console (F12) for errors
4. Verify backend is running
5. Check if token exists: localStorage.getItem('token')

### Problem: "Unique users count seems wrong"
**Check:**
- This is normal! Same user logging in 10 times = 1 unique user
- Count increases only when NEW users login
- Total Logins shows all login attempts
- Unique Visitors shows unique users only

---

## 🔍 Verification Commands

### Check Backend Status:
```bash
curl http://localhost:5001/health
```
Expected response:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2025-11-24T...",
  "port": 5001
}
```

### Check if You're Admin:
1. Login to your account
2. Open browser console (F12)
3. Get your token:
   ```javascript
   const token = localStorage.getItem('token');
   ```
4. Check admin status:
   ```javascript
   fetch('http://localhost:5001/api/admin/check', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   .then(r => r.json())
   .then(data => console.log('Admin:', data.isAdmin));
   ```
5. Should log: `Admin: true` (if you're admin) or `Admin: false`

### Check Your Review:
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:5001/api/review', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## 📊 Understanding Analytics

### Total Users
- All registered users in database
- Includes everyone who signed up

### Unique Visitors ⭐
- Unique users who logged in at least once
- **Same user logging in multiple times = counted once**
- This is what you asked for!

### Total Logins
- All login attempts
- Includes multiple logins from same user
- User logs in 5 times = 5 total logins

### Average Rating
- Average of all review ratings
- Formula: (sum of all ratings) / (total reviews)

### Total Reviews
- Number of reviews submitted
- Maximum one per user

**Example:**
- 10 registered users
- 8 users logged in (some multiple times)
- 25 total login attempts
- → **Unique Visitors = 8** (not 25!)

---

## 🎯 Quick Reference

### URLs:
- **Main Dashboard:** http://localhost:3000/index.html
- **Admin Dashboard:** http://localhost:3000/admin-dashboard.html
- **Login Page:** http://localhost:3000/login
- **Backend Health:** http://localhost:5001/health

### Files to Check:
- **Admin Config:** `/hiero backend/routes/reviewRoutes.js` (line ~204)
- **Environment:** `/hiero backend/.env`
- **User Dashboard:** `/hiero last prtotype/jss/hiero/hiero last/public/index.html`
- **Admin Dashboard:** `/hiero last prtotype/jss/hiero/hiero last/public/admin-dashboard.html`

### Common Ports:
- **Backend API:** 5001
- **Frontend:** 3000 (or your configured port)

---

## ✨ Features Summary

### For Users:
- ⭐ Submit star rating (1-5)
- 📝 Write review (up to 1000 characters)
- ✏️ Edit review anytime
- 👀 View their existing review
- 📊 Character counter

### For Admins:
- 👥 View total users
- ✅ View unique visitors (no duplicates!)
- 🔄 View total logins
- ⭐ View average rating
- 📝 View all reviews
- 📊 User analytics table
- 🕒 Last login timestamps
- 🏷️ Active/Inactive user badges

---

## 🎉 Success Checklist

After setup, verify:
- ✅ Backend running on port 5001
- ✅ Frontend accessible on port 3000
- ✅ Users can login
- ✅ Review section visible after login
- ✅ Users can submit reviews
- ✅ Users can edit their reviews
- ✅ Admin can access admin dashboard
- ✅ Non-admin cannot access admin dashboard
- ✅ Unique visitors count is accurate
- ✅ All statistics showing correctly

---

## 📞 Need Help?

If something doesn't work:

1. Check this checklist again
2. Review troubleshooting section
3. Check browser console (F12)
4. Check backend console logs
5. Verify your admin email is configured correctly
6. Try clearing cache and localStorage
7. Restart backend server

---

**🚀 You're all set! Enjoy your new review system!**

For detailed documentation, see: `REVIEW_SYSTEM_COMPLETE_GUIDE.md`
