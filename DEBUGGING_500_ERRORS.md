# 🔍 Review System - Debugging 500 Errors

## 🎯 Current Status

### **Progress:**
- ✅ Server is running (returns 200 on `/health`)
- ✅ Routes exist (no more 404)
- ❌ Getting 500 Internal Server Error on:
  - `GET /api/review`
  - `POST /api/login-track`

### **What 500 Means:**
Server is running, but something is crashing inside the route handler:
- MongoDB connection issue
- User not found in database
- JWT userId doesn't match MongoDB _id format

---

## 🔧 What I Just Fixed

### **Added Detailed Logging:**
Now the backend will log:
```javascript
[Review] GET /api/review - userId: <userId>
[Review] Finding user by ID: <userId>
[Review] User found: <email>
[Login Track] userId: <userId>
[Login Track] User found: <email>
```

And errors will show:
```javascript
Error message: <actual error>
Error stack: <full stack trace>
```

### **Deployed:**
- ✅ Commit: `e28020c` - Added detailed logging
- ⏳ Render is deploying now (~2-3 minutes)

---

## 🧪 Next Steps

### **After 2-3 minutes:**

**1. Check Render Logs**
Go to: https://dashboard.render.com
- Click on `hiero-resume-backend`
- Click "Logs" tab
- Try to submit a review on your website
- Watch for logs like:
  ```
  [Review] GET /api/review - userId: 507f1f77bcf86cd799439011
  [Review] User not found: 507f1f77bcf86cd799439011
  ```

**2. Share the Error**
Once you see the error logs, copy and share:
- The `[Review]` log lines
- The error message
- Any MongoDB connection errors

---

## 🎯 Likely Issues & Solutions

### **Issue 1: MongoDB Not Connected**
**Symptoms:**
- Logs show: `MongoDB connection error`
- All database queries fail

**Solution:**
- Check `MONGODB_URI` in Render environment variables
- Verify MongoDB Atlas allows Render's IP (or allow all IPs)
- Check if MongoDB cluster is running

---

### **Issue 2: User Not in Database**
**Symptoms:**
- Logs show: `[Review] User not found: <userId>`
- userId looks valid

**Solution:**
The userId from JWT doesn't exist in the User collection. This happens when:
- User logs in via OAuth (Google)
- OAuth creates a session but doesn't create User document
- Need to create User document on first OAuth login

**Fix:** Update OAuth login to create User if not exists

---

### **Issue 3: JWT userId Format Wrong**
**Symptoms:**
- Logs show: `Cast to ObjectId failed`
- userId is email or string, not MongoDB ObjectId

**Solution:**
JWT should contain MongoDB `_id`, not email or custom ID

---

## 📊 What to Look For in Logs

### **Good Logs (Working):**
```
[Review] GET /api/review - userId: 507f1f77bcf86cd799439011
[Review] Finding user by ID: 507f1f77bcf86cd799439011
[Review] User found: user@example.com
[Review] No review found for user: 507f1f77bcf86cd799439011
```

### **Bad Logs (Failing):**
```
[Review] GET /api/review - userId: user@example.com  ❌ (email, not ObjectId)
[Review] User not found: 507f1f77bcf86cd799439011    ❌ (user doesn't exist)
MongoDB connection error: ...                          ❌ (DB not connected)
```

---

## 🚀 Action Plan

### **Step 1: Wait for Deployment (2-3 min)**
Current deployment with logging improvements

### **Step 2: Test & Check Logs**
1. Refresh your website
2. Try to submit a review
3. Check Render logs immediately
4. Look for `[Review]` log lines

### **Step 3: Share Logs**
Copy and share:
- The full error message
- The `[Review]` or `[Login Track]` logs
- Any MongoDB errors

### **Step 4: I'll Fix the Root Cause**
Based on logs, I'll implement the proper fix:
- Create User on OAuth login
- Fix JWT userId format
- Fix MongoDB connection
- Or whatever the logs reveal

---

## 📞 When Ready

**After 2-3 minutes:**
1. Try the review feature
2. Check Render logs
3. Share the error logs with me
4. I'll implement the fix immediately

---

**Status:** ⏳ Deploying with logging... ETA 2-3 min

Once deployed, we'll see exactly what's failing and fix it! 🔍
