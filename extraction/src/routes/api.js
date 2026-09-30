const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const extractController = require('../controllers/extractController');
const config = require('../config');

const router = express.Router();

// Multer storage setup in OS temp directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.upload.allowedExtensions.includes(ext) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file format '${ext}'. Supported formats: PDF, DOCX, DOC, PNG, JPG, WEBP, TXT.`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: config.upload.maxSizeBytes },
    fileFilter
});

// Middleware supporting either 'resume' or 'file' field name
const uploadMiddleware = (req, res, next) => {
    const uploadSingle = upload.fields([
        { name: 'resume', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ]);

    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }

        // Normalize req.file from req.files
        if (req.files) {
            if (req.files.resume && req.files.resume[0]) {
                req.file = req.files.resume[0];
            } else if (req.files.file && req.files.file[0]) {
                req.file = req.files.file[0];
            }
        }
        next();
    });
};

// Compare Middleware supporting two files: 'previous' and 'current'
const compareUploadMiddleware = upload.fields([
    { name: 'previous', maxCount: 1 },
    { name: 'current', maxCount: 1 }
]);

// Main Routes
router.post('/upload', uploadMiddleware, extractController.extractFromFile);
router.post('/text', express.json({ limit: '10mb' }), extractController.extractFromRawText);
router.post('/compare', (req, res, next) => {
    if (req.is('multipart/form-data')) {
        compareUploadMiddleware(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, error: err.message });
            extractController.compareResumesEndpoint(req, res);
        });
    } else {
        express.json({ limit: '15mb' })(req, res, () => {
            extractController.compareResumesEndpoint(req, res);
        });
    }
});
router.get('/health', extractController.checkHealth);

module.exports = router;
