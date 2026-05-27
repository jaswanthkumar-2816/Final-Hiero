# PDF Analysis Troubleshooting Guide

## Current Error: "bad XRef entry"

This means your PDF file has internal corruption in its cross-reference table.

## Solutions (Try in Order)

### 1. **Use a Different PDF** (Quickest)
If you have another resume PDF, try that first.

### 2. **Repair Your PDF**

#### On Mac:
1. Open the PDF in **Preview**
2. Go to **File → Export as PDF**
3. Save with a new name
4. Use the new file

#### On Windows:
1. Open in **Adobe Reader** or **Edge**
2. **Print → Save as PDF**
3. Use the new file

#### Online Tools:
- [iLovePDF](https://www.ilovepdf.com/repair-pdf) - Free PDF repair
- [PDF2Go](https://www.pdf2go.com/repair-pdf) - Another repair tool

### 3. **Recreate the PDF**

If you have the original document (Word, Google Docs, etc.):
1. Open the original document
2. Export/Save as PDF again
3. Use a different PDF converter if needed

### 4. **Create a Test PDF**

To verify the system works, create a simple test file:

```bash
# On Mac/Linux terminal:
cat > test-resume.txt << 'EOF'
John Doe
Software Developer

Skills:
- Python
- JavaScript
- React
- SQL
- Machine Learning

Experience:
Software Developer at Tech Company (2020-2023)
- Developed web applications using React and Node.js
- Built machine learning models for data analysis
- Worked with SQL databases

Education:
Bachelor of Computer Science
EOF

# Then convert to PDF using Preview or online converter
```

Or use this content in a Word doc and save as PDF:
```
Name: John Doe
Title: Software Developer

Skills: Python, JavaScript, React, Node.js, SQL, Machine Learning, Data Analysis

Experience:
- Developed web applications
- Built REST APIs
- Database design and optimization

Education:
BS Computer Science, 2019
```

## Why This Happens

PDFs can become corrupted due to:
- Incomplete downloads
- Conversion issues from different formats
- Old or non-standard PDF creation tools
- File transfer errors
- Editing with incompatible software

## Backend Improvements Made

The backend now:
1. ✅ Tries standard PDF parsing first
2. ✅ Falls back to text extraction for partially damaged PDFs
3. ✅ Returns clear error messages about which file failed
4. ✅ Cleans up uploaded files even on error

## Testing the Fix

After restarting the backend:

```bash
# 1. Verify backend is running
curl http://localhost:5001/health

# 2. Check logs for detailed errors
tail -f "/Users/jaswanthkumar/Desktop/shared folder/hiero backend/hiero analysis part/analysis-server.log"

# 3. Try the analysis with a new/repaired PDF
```

## Still Having Issues?

If you continue to see errors:

1. **Check the backend logs** for the exact error message
2. **Try the test PDF** above to confirm the system works
3. **Ensure your PDF**:
   - Is not password-protected
   - Is not scanned/image-only (needs actual text)
   - Is under 10MB
   - Was created recently with modern tools

---

**Quick Fix Summary:**
1. Open your resume PDF in Preview/Adobe
2. Export/Save As → new PDF file
3. Upload the new file
4. Done! ✅
