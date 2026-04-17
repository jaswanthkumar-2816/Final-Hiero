const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const nodemailer = require('nodemailer');
const multer = require('multer');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Browser instance pool for faster PDF generation
let browserInstance = null;
let browserPromise = null;

// Get or create browser instance (singleton pattern)
async function getBrowserInstance() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // If browser is already being launched, wait for it
  if (browserPromise) {
    return browserPromise;
  }

  // Launch new browser
  browserPromise = puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--no-first-run'
    ]
  }).then(browser => {
    browserInstance = browser;
    browserPromise = null;
    console.log('✅ Browser instance created and ready');
    return browser;
  }).catch(error => {
    browserPromise = null;
    throw error;
  });

  return browserPromise;
}

// Cleanup on exit
process.on('exit', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
});

dotenv.config();

console.log('🔐 OAuth configuration:');
console.log('   GOOGLE_CLIENT_ID       =', process.env.GOOGLE_CLIENT_ID ? 'loaded' : 'missing');
console.log('   GOOGLE_CALLBACK_URL    =', process.env.LOCAL_GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || '(not set)');
console.log('   GITHUB_CALLBACK_URL    =', process.env.LOCAL_GITHUB_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL || '(not set)');
console.log('   PUBLIC_URL             =', process.env.PUBLIC_URL || '(default http://localhost:2816)');

const app = express();
app.use(express.json());
// Trust proxy (gateway) so protocol/host are correct behind proxy
app.set('trust proxy', 1);

// Public URL for redirects (set via .env for ngrok/production)
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:2816';
function originOf(u) { try { return new URL(u).origin; } catch { return undefined; } }

// Enhanced CORS configuration to allow multiple origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8082',
  'http://localhost:8085',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:8085',
  'http://127.0.0.1:5504',
  'http://localhost:5504',
  'http://localhost:2816',
  'http://127.0.0.1:2816',
  'https://85692af7a6b1.ngrok-free.app', // ngrok URL for phone testing
  originOf(PUBLIC_URL),
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(passport.initialize());

// Serve static files from the login system directory
app.use(express.static(path.join(__dirname)));

// Serve static files from the resume builder directory
const resumeBuilderPath = path.join(__dirname, '..', 'hiero last prtotype', 'jss', 'hiero', 'hiero last', 'public');
app.use(express.static(resumeBuilderPath));

// Root route - serve the professional index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'jss', 'hiero', 'hiero last', 'public', 'index.html'));
});

// Serve the professional index.html for SPA client routes
app.get(['/login', '/signup', '/verify-email', '/profile', '/resume', '/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'jss', 'hiero', 'hiero last', 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hiero-login' });
});

// Users store
const USERS_FILE = path.join(__dirname, 'users.json');
let users = [];
let userIdCounter = 1;

// Helper: Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      if (users.length > 0) {
        userIdCounter = Math.max(...users.map(u => u.id)) + 1;
      }
      console.log(`✅ Loaded ${users.length} users from persistence`);
    }
  } catch (error) {
    console.error('❌ Failed to load users:', error.message);
  }
}

// Helper: Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('❌ Failed to save users:', error.message);
  }
}

// Helper: Generate unique referral code
function generateReferralCode(name) {
  const prefix = name ? name.substring(0, 3).toUpperCase() : 'HIERO';
  const random = Math.floor(1000 + Math.random() * 9000);
  let code = `${prefix}${random}`;
  // Ensure uniqueness
  while (users.some(u => u.referralCode === code)) {
    code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return code;
}

// Initial load
loadUsers();

// Multer upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// 📧 Enhanced Email Configuration with Better Error Handling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// NOTE: SMTP verification is disabled in production to avoid noisy connection timeout logs on Render.
// The app will still attempt to send emails when needed.
/*
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Authentication Failed!');
    console.log('🔧 Error Details:', error.message);
    console.log('');
    console.log('💡 SOLUTION STEPS:');
    console.log('1️⃣  Go to: https://myaccount.google.com/');
    console.log('2️⃣  Click "Security" → Enable 2-Step Verification');
    console.log('3️⃣  Go back to Security → "App passwords"');
    console.log('4️⃣  Generate new app password for "Mail"');
    console.log('5️⃣  Copy the 16-character password');
    console.log('6️⃣  Replace EMAIL_PASS in .env with this app password');
    console.log('');
  } else {
    console.log('✅ Email service ready to send messages');
  }
});
*/

// Google Auth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.LOCAL_GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.googleId === profile.id);
  const email = profile.emails?.[0]?.value || 'default@example.com';
  const picture = profile.photos?.[0]?.value || null; // Capture profile picture

  if (!user) {
    user = {
      id: userIdCounter++,
      googleId: profile.id,
      email,
      name: profile.displayName,
      picture, // Store profile picture
      emailVerified: true,
      signupMethod: 'google',
      referralCode: generateReferralCode(profile.displayName),
      referredBy: null, // OAuth signups can't easily provide referral code in current flow
      referralCount: 0,
      hasCreatedResume: false,
      rewards: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers();
  } else {
    // Update picture if user exists (in case it changed)
    user.picture = picture;
    saveUsers();
  }
  return done(null, user);
}));

// GitHub Auth
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.LOCAL_GITHUB_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.githubId === profile.id);
  const email = profile.emails?.[0]?.value || 'default@example.com';
  const picture = profile.photos?.[0]?.value || null; // GitHub profile picture

  if (!user) {
    user = {
      id: userIdCounter++,
      githubId: profile.id,
      email,
      name: profile.displayName || profile.username,
      picture, // Store profile picture
      emailVerified: true,
      signupMethod: 'github',
      referralCode: generateReferralCode(profile.displayName || profile.username),
      referredBy: null,
      referralCount: 0,
      hasCreatedResume: false,
      rewards: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers();
  } else {
    // Update picture if user exists (in case it changed)
    user.picture = picture;
    saveUsers();
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = { id: decoded.userId }; // Fix: use decoded.userId instead of decoded.id
    next();
  });
};

// Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  // Check if user already exists by email
  const existingUser = users.find(u => u.email === email.trim().toLowerCase());
  if (existingUser) return res.status(400).json({ error: 'User already exists with this email' });

  // Handle referral code
  let referredBy = null;
  if (req.body.referralCode) {
    const referrer = users.find(u => u.referralCode === req.body.referralCode.trim().toUpperCase());
    if (referrer) {
      referredBy = referrer.id;
      console.log(`🤝 User ${email} referred by ${referrer.email}`);
    }
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  const user = {
    id: userIdCounter++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    emailVerified: false,
    signupMethod: 'email',
    referralCode: generateReferralCode(name.trim()),
    referredBy: referredBy,
    referralCount: 0,
    hasCreatedResume: false,
    rewards: [],
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(); // Save to persistence

  const token = jwt.sign({ email: user.email, userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const link = `${PUBLIC_URL}/verify-email?token=${token}`;

  try {
    console.log(`📧 Sending verification email to: ${user.email}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Verify Your Hiero Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1D4ED8;">Welcome to Hiero, ${user.name}!</h2>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: #1D4ED8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #666;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #1D4ED8;">${link}</p>
          <p style="color: #999; font-size: 12px;">This link will expire in 1 hour for security purposes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't create an account with Hiero, please ignore this email.</p>
        </div>
      `
    });

    console.log(`✅ Verification email sent successfully to: ${user.email}`);
    res.status(201).json({
      message: 'Account created! Please check your email (including spam folder) to verify your account.',
      email: user.email
    });
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    console.error('Full error:', err);

    // Even if email fails, account is created
    res.status(201).json({
      message: `Account created! However, we couldn't send the verification email to ${user.email}. Please contact support or try again.`,
      warning: 'Email verification required for login',
      email: user.email,
      verificationLink: link // Include the link in response for development
    });
  }
});

// Verify Email
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  try {
    const { email, userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u.id === userId && u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    user.emailVerified = true;
    saveUsers();
    // Redirect to login via gateway (uses forwarded host from ngrok/gateway)
    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    const baseUrl = forwardedHost
      ? `${(forwardedProto || 'https').split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`
      : 'http://localhost:8082';
    res.redirect(`${baseUrl}/login?verified=true`);
  } catch {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Find user by email (ensure user.email exists before calling trim)
  const user = users.find(u => u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (!user) return res.status(400).json({ error: 'No account found with this email' });

  // Check if this is a social login user
  if (!user.password) {
    return res.status(400).json({
      error: `This account was created using ${user.signupMethod}. Please use ${user.signupMethod} login.`
    });
  }

  const match = await bcrypt.compare(password.trim(), user.password);
  if (!match) return res.status(400).json({ error: 'Incorrect password' });

  if (!user.emailVerified) {
    return res.status(400).json({
      error: 'Email not verified. Please check your inbox and click the verification link.'
    });
  }

  // Enhanced JWT token with user info for persistent login
  const token = jwt.sign({
    userId: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture || null
  }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Extended to 7 days like Instagram/LinkedIn

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null,
      signupMethod: user.signupMethod
    }
  });
});

// Google & GitHub OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', (req, res, next) => {
  if (!req.query.code) {
    console.warn('⚠️  /auth/google/callback hit without ?code param. Restarting OAuth flow so Google receives scope.');
    return res.redirect('/auth/google');
  }

  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      console.error('❌ Google OAuth failed:', err?.message || 'No user returned');
      return res.redirect('/login?error=google_oauth_failed');
    }

    const token = jwt.sign({
      userId: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null,
      signupMethod: user.signupMethod
    }));

    console.log(`✅ google login success for ${user.email}`);

    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    const baseUrl = forwardedHost
      ? `${(forwardedProto || 'https').split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`
      : 'http://localhost:8082';

    console.log(`🔄 Redirecting to: ${baseUrl}/dashboard`);
    res.redirect(`${baseUrl}/dashboard?token=${token}&user=${userData}`);
  })(req, res, next);
});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', (req, res, next) => {
  if (!req.query.code) {
    console.warn('⚠️  /auth/github/callback hit without ?code param. Restarting GitHub OAuth flow.');
    return res.redirect('/auth/github');
  }

  passport.authenticate('github', { session: false }, (err, user) => {
    if (err || !user) {
      console.error('❌ GitHub OAuth failed:', err?.message || 'No user returned');
      return res.redirect('/login?error=github_oauth_failed');
    }

    const token = jwt.sign({
      userId: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null,
      signupMethod: user.signupMethod
    }));

    console.log(`✅ github login success for ${user.email}`);

    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    const baseUrl = forwardedHost
      ? `${(forwardedProto || 'https').split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`
      : 'https://hiero-8082-server.onrender.com';

    console.log(`🔄 Redirecting to: ${baseUrl}/dashboard`);
    res.redirect(`${baseUrl}/dashboard?token=${token}&user=${userData}`);
  })(req, res, next);
});

// Protected Dashboard - Enhanced for Instagram/LinkedIn-like experience
app.get('/dashboard', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    message: `Welcome back, ${user.name}!`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture || null,
      signupMethod: user.signupMethod,
      emailVerified: user.emailVerified,
      joinedDate: user.createdAt || new Date().toISOString(),
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      rewards: user.rewards || []
    }
  });
});

// Get current user profile (for persistent login check)
// Get current user profile (for persistent login check)
app.get('/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture || null,
    signupMethod: user.signupMethod,
    emailVerified: user.emailVerified,
    referralCode: user.referralCode,
    referralCount: user.referralCount || 0
  });
});

// Get profile details (Alias for /me or specific profile fetch)
app.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture || null,
    signupMethod: user.signupMethod,
    emailVerified: user.emailVerified,
    referralCode: user.referralCode,
    referralCount: user.referralCount || 0,
    hasCreatedResume: user.hasCreatedResume || false,
    joinedDate: user.createdAt || new Date().toISOString()
  });
});

// Claim a referral code for an existing user (Social Login flow)
app.post('/api/claim-referral', authenticateToken, (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) return res.status(400).json({ error: 'Referral code required' });

  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.referredBy) return res.status(400).json({ error: 'Referral already claimed' });

  const referrer = users.find(u => u.referralCode === referralCode.trim().toUpperCase());
  if (!referrer) return res.status(400).json({ error: 'Invalid or expired referral code' });

  if (referrer.id === user.id) return res.status(400).json({ error: 'You cannot refer yourself' });

  user.referredBy = referrer.id;
  saveUsers();

  console.log(`🤝 Referral claimed: ${user.email} referred by ${referrer.email}`);
  res.json({ message: 'Referral successfully linked! Perks applied.' });
});

// Template HTML generators
function generateTemplateHTML(templateId, data) {
  const templates = {
    'classic': generateClassicTemplate,
    'minimal': generateMinimalTemplate,
    'modern-pro': generateModernProTemplate,
    'tech-focus': generateTechFocusTemplate,
    'creative-bold': generateCreativeBoldTemplate,
    'portfolio-style': generatePortfolioStyleTemplate,
    'ats-optimized': generateATSOptimizedTemplate,
    'corporate-ats': generateCorporateATSTemplate,
    'elegant-gradient': generateElegantGradientTemplate,
    'minimalist-mono': generateMinimalistMonoTemplate
  };

  const generator = templates[templateId] || templates['classic'];
  return generator(data);
}

function generateClassicTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.4; color: #000; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
      .name { font-size: 24px; font-weight: bold; margin: 0; }
      .contact { font-size: 14px; margin: 5px 0; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 16px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #333; }
      .experience-item, .education-item { margin-bottom: 15px; }
      .job-title { font-weight: bold; }
      .company { font-style: italic; }
      .period { font-size: 12px; color: #666; }
      .description { margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} to ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school}</div>
          <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.technicalSkills || data.softSkills ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${data.technicalSkills ? `<p><strong>Technical:</strong> ${data.technicalSkills}</p>` : ''}
      ${data.softSkills ? `<p><strong>Soft Skills:</strong> ${data.softSkills}</p>` : ''}
    </div>
    ` : ''}
    
    ${data.projects ? `
    <div class="section">
      <h2 class="section-title">Projects</h2>
      <p>${data.projects}</p>
    </div>
    ` : ''}
    
    ${data.certifications ? `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      <p>${data.certifications}</p>
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` at ${ref.company}` : ''}</div>
          <div class="contact">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

function generateMinimalTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 50px; line-height: 1.6; color: #333; }
      .header { margin-bottom: 40px; }
      .name { font-size: 32px; font-weight: 300; margin: 0 0 10px 0; }
      .contact { color: #666; font-size: 14px; margin: 3px 0; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 20px; font-weight: 400; margin-bottom: 15px; color: #333; }
      .experience-item, .education-item { margin-bottom: 20px; }
      .job-title { font-weight: 500; font-size: 16px; margin-bottom: 3px; }
      .company { color: #666; font-size: 14px; margin-bottom: 2px; }
      .period { color: #999; font-size: 13px; margin-bottom: 8px; }
      .description { color: #555; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company} • ${exp.startDate} to ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school} • ${edu.gradYear}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.technicalSkills || data.softSkills ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${data.technicalSkills ? `<p><strong>Technical:</strong> ${data.technicalSkills}</p>` : ''}
      ${data.softSkills ? `<p><strong>Soft Skills:</strong> ${data.softSkills}</p>` : ''}
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="education-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` • ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` • ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

function generateModernProTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Inter', Arial, sans-serif; margin: 0; line-height: 1.5; color: #333; }
      .header { background: linear-gradient(135deg, #2ae023, #1a8b17); color: white; padding: 30px 40px; }
      .name { font-size: 28px; font-weight: 700; margin: 0; }
      .contact { opacity: 0.9; margin: 5px 0; }
      .content { padding: 30px 40px; }
      .section { margin-bottom: 30px; }
      .section-title { color: #2ae023; font-size: 20px; margin-bottom: 15px; font-weight: 600; }
      .experience-item, .education-item { margin-bottom: 20px; border-left: 3px solid #2ae023; padding-left: 15px; }
      .job-title { font-weight: 600; font-size: 16px; }
      .company { color: #666; margin: 2px 0; }
      .period { color: #999; font-size: 14px; margin-bottom: 8px; }
      .description { margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
    </div>
    
    <div class="content">
      ${data.summary ? `
      <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p>${data.summary}</p>
      </div>
      ` : ''}
      
      ${data.experience && data.experience.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Experience</h2>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <div class="job-title">${exp.jobTitle}</div>
            <div class="company">${exp.company}</div>
            <div class="period">${exp.startDate} to ${exp.endDate}</div>
            <div class="description">${exp.description}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${data.education && data.education.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Education</h2>
        ${data.education.map(edu => `
          <div class="education-item">
            <div class="job-title">${edu.degree}</div>
            <div class="company">${edu.school}</div>
            <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${data.technicalSkills || data.softSkills ? `
      <div class="section">
        <h2 class="section-title">Skills</h2>
        ${data.technicalSkills ? `<p><strong>Technical:</strong> ${data.technicalSkills}</p>` : ''}
        ${data.softSkills ? `<p><strong>Soft Skills:</strong> ${data.softSkills}</p>` : ''}
      </div>
      ` : ''}
      
      ${data.references && data.references.length > 0 ? `
      <div class="section">
        <h2 class="section-title">References</h2>
        ${data.references.map(ref => `
          <div class="experience-item">
            <div class="job-title">${ref.name}</div>
            <div class="company">${ref.title}${ref.company ? ` at ${ref.company}` : ''}</div>
            <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
          <div class="section">
            <h2 class="section-title">${custom.heading}</h2>
            <p>${custom.content}</p>
          </div>
        `).join('') : ''}
    </div>
  </body>
  </html>
  `;
}

function generateTechFocusTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Courier New', monospace; margin: 40px; background: #1e1e1e; color: #e6e6e6; }
      .header { border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
      .name { font-size: 22px; color: #4ade80; margin: 0 0 8px 0; }
      .contact { color: #a3a3a3; font-size: 13px; margin: 2px 0; }
      .section { margin-bottom: 25px; }
      .section-title { color: #4ade80; font-size: 18px; margin-bottom: 12px; font-weight: 600; }
      .experience-item, .education-item { margin-bottom: 18px; background: #2a2a2a; padding: 15px; border-radius: 6px; }
      .job-title { color: #60a5fa; font-weight: 600; }
      .company { color: #a3a3a3; margin: 3px 0; }
      .period { color: #737373; font-size: 12px; margin-bottom: 8px; }
      .description { color: #d4d4d4; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">$ whoami: ${data.personalInfo?.fullName || 'user'}</h1>
      <div class="contact"># ${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact"># ${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact"># ${data.linkedin}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">## About</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} to ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school}</div>
          <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.technicalSkills ? `
    <div class="section">
      <h2 class="section-title">## Tech Stack</h2>
      <p>${data.technicalSkills}</p>
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` @ ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">## ${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

// Add other template generators (creative-bold, portfolio-style, ats-optimized, corporate-ats)
function generateCreativeBoldTemplate(data) {
  return generateModernProTemplate(data).replace(
    'linear-gradient(135deg, #2ae023, #1a8b17)',
    'linear-gradient(135deg, #667eea, #764ba2)'
  ).replace(/#2ae023/g, '#667eea');
}

function generatePortfolioStyleTemplate(data) {
  return generateMinimalTemplate(data);
}

function generateATSOptimizedTemplate(data) {
  return generateClassicTemplate(data);
}

function generateCorporateATSTemplate(data) {
  return generateModernProTemplate(data);
}

// New standout templates
function generateElegantGradientTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: 'Playfair Display', 'Georgia', serif; 
        margin: 0; 
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
        color: #2c3e50; 
        line-height: 1.6; 
      }
      .container { 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
        border-radius: 12px; 
        overflow: hidden; 
      }
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 40px 40px; 
        text-align: center; 
      }
      .name { 
        font-size: 36px; 
        font-weight: 700; 
        margin: 0 0 15px 0; 
        letter-spacing: 1px; 
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2); 
      }
      .contact { 
        opacity: 0.95; 
        margin: 8px 0; 
        font-size: 15px; 
        font-family: 'Inter', sans-serif; 
      }
      .content { padding: 40px; }
      .section { margin-bottom: 35px; }
      .section-title { 
        font-size: 24px; 
        color: #667eea; 
        margin-bottom: 20px; 
        font-weight: 700; 
        border-bottom: 3px solid #667eea; 
        padding-bottom: 10px; 
      }
      .experience-item, .education-item { 
        margin-bottom: 25px; 
        padding: 20px; 
        background: linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%); 
        border-radius: 8px; 
        border-left: 4px solid #667eea; 
      }
      .job-title { 
        font-weight: 700; 
        font-size: 18px; 
        color: #2c3e50; 
        margin-bottom: 5px; 
      }
      .company { 
        color: #5a6c7d; 
        font-size: 15px; 
        font-style: italic; 
        margin-bottom: 5px; 
      }
      .period { 
        color: #8492a6; 
        font-size: 13px; 
        margin-bottom: 12px; 
      }
      .description { 
        color: #3c4858; 
        line-height: 1.7; 
      }
      .skills-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 15px; 
      }
      .skill-item { 
        background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%); 
        padding: 15px; 
        border-radius: 8px; 
        border-left: 3px solid #667eea; 
      }
      .skill-title { font-weight: 700; color: #667eea; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
        <div class="contact">${data.personalInfo?.email || ''} • ${data.personalInfo?.phone || ''}</div>
        ${data.address ? `<div class="contact">${data.address}</div>` : ''}
        ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
        ${data.website ? `<div class="contact">${data.website}</div>` : ''}
      </div>
      
      <div class="content">
        ${data.summary ? `
        <div class="section">
          <h2 class="section-title">Professional Summary</h2>
          <p>${data.summary}</p>
        </div>
        ` : ''}
        
        ${data.experience && data.experience.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Experience</h2>
          ${data.experience.map(exp => `
            <div class="experience-item">
              <div class="job-title">${exp.jobTitle}</div>
              <div class="company">${exp.company}</div>
              <div class="period">${exp.startDate} to ${exp.endDate}</div>
              <div class="description">${exp.description}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${data.education && data.education.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Education</h2>
          ${data.education.map(edu => `
            <div class="education-item">
              <div class="job-title">${edu.degree}</div>
              <div class="company">${edu.school}</div>
              <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${data.technicalSkills || data.softSkills ? `
        <div class="section">
          <h2 class="section-title">Skills</h2>
          <div class="skills-grid">
            ${data.technicalSkills ? `
            <div class="skill-item">
              <div class="skill-title">Technical Skills</div>
              <div>${data.technicalSkills}</div>
            </div>
            ` : ''}
            ${data.softSkills ? `
            <div class="skill-item">
              <div class="skill-title">Soft Skills</div>
              <div>${data.softSkills}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        ${data.projects ? `
        <div class="section">
          <h2 class="section-title">Projects</h2>
          <p>${data.projects}</p>
        </div>
        ` : ''}
        
        ${data.certifications ? `
        <div class="section">
          <h2 class="section-title">Certifications</h2>
          <p>${data.certifications}</p>
        </div>
        ` : ''}
        
        ${data.references && data.references.length > 0 ? `
        <div class="section">
          <h2 class="section-title">References</h2>
          ${data.references.map(ref => `
            <div class="experience-item">
              <div class="job-title">${ref.name}</div>
              <div class="company">${ref.title}${ref.company ? ` at ${ref.company}` : ''}</div>
              <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` • ${ref.email}` : ''}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
            <div class="section">
              <h2 class="section-title">${custom.heading}</h2>
              <p>${custom.content}</p>
            </div>
          `).join('') : ''}
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateMinimalistMonoTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: 'IBM Plex Mono', 'Courier New', monospace; 
        margin: 50px; 
        background: #ffffff; 
        color: #000000; 
        line-height: 1.8; 
        border: 1px solid #000000; 
        padding: 40px; 
      }
      .header { 
        border-bottom: 2px solid #000000; 
        padding-bottom: 25px; 
        margin-bottom: 30px; 
      }
      .name { 
        font-size: 28px; 
        font-weight: 700; 
        margin: 0 0 15px 0; 
        letter-spacing: -0.5px; 
        text-transform: uppercase; 
      }
      .contact { 
        font-size: 12px; 
        margin: 3px 0; 
        letter-spacing: 0.5px; 
      }
      .section { margin-bottom: 30px; }
      .section-title { 
        font-size: 14px; 
        text-transform: uppercase; 
        font-weight: 700; 
        margin-bottom: 15px; 
        letter-spacing: 2px; 
        border-bottom: 1px solid #000000; 
        padding-bottom: 8px; 
      }
      .experience-item, .education-item { 
        margin-bottom: 20px; 
        padding-left: 15px; 
        border-left: 2px solid #000000; 
      }
      .job-title { 
        font-weight: 700; 
        font-size: 14px; 
        text-transform: uppercase; 
        margin-bottom: 5px; 
      }
      .company { 
        font-size: 13px; 
        margin-bottom: 3px; 
      }
      .period { 
        color: #555555; 
        font-size: 12px; 
        font-style: italic; 
        margin-bottom: 10px; 
      }
      .description { 
        font-size: 13px; 
        color: #222222; 
        line-height: 1.7; 
      }
      .divider { 
        border-top: 1px solid #000000; 
        margin: 25px 0; 
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'YOUR NAME'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
      ${data.website ? `<div class="contact">${data.website}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Summary</h2>
      <p>${data.summary}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} — ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school}</div>
          <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.technicalSkills || data.softSkills ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${data.technicalSkills ? `<p><strong>TECHNICAL:</strong> ${data.technicalSkills}</p>` : ''}
      ${data.softSkills ? `<p><strong>SOFT SKILLS:</strong> ${data.softSkills}</p>` : ''}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.projects ? `
    <div class="section">
      <h2 class="section-title">Projects</h2>
      <p>${data.projects}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.certifications ? `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      <p>${data.certifications}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` / ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` / ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ?
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
        <div class="divider"></div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

// Helper: Check and trigger referral logic
async function checkReferralCompletion(userId) {
  const user = users.find(u => u.id === userId);
  if (!user || user.hasCreatedResume) return;

  // Mark this user as having completed a resume
  user.hasCreatedResume = true;
  saveUsers();

  // If this user was referred by someone, increment their count
  if (user.referredBy) {
    const referrer = users.find(u => u.id === user.referredBy);
    if (referrer) {
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      console.log(`📈 Incrementing referral count for ${referrer.email}. New count: ${referrer.referralCount}`);

      // Check if they reached 10 referrals
      if (referrer.referralCount === 10) {
        await generateAndSendReward(referrer);
      }
      saveUsers();
    }
  }
}

// Helper: Generate and send reward
async function generateAndSendReward(user) {
  const rewardCode = `HIERO-REWARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  const reward = {
    code: rewardCode,
    otp: otp,
    isUsed: false,
    createdAt: new Date().toISOString()
  };

  user.rewards = user.rewards || [];
  user.rewards.push(reward);

  try {
    console.log(`🎁 Sending unbreakable table-based reward to ${user.email}`);
    
    // Using Table-based architecture for 100% email client compatibility
    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: none; margin: 0; padding: 0; }
  </style>
</head>
<body style="background-color: #f7f9fa; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f9fa; padding: 60px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td bgcolor="#000000" style="padding: 35px 50px; border-bottom: 2px solid #07e219;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="42">
                    <div style="background-color: #07e219; border-radius: 6px; width: 38px; height: 38px; text-align: center; color: #000000; font-size: 22px; font-weight: 900; line-height: 38px;">H</div>
                  </td>
                  <td style="padding-left: 15px;">
                    <div style="color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: 1.5px; line-height: 1;">HIERO</div>
                    <div style="color: #555555; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Career Assistant</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td bgcolor="#000000" align="center" style="padding: 90px 50px;">
              <div style="font-size: 10px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 25px;">Verified Milestone Unlock</div>
              <h1 style="color: #ffffff; font-size: 38px; font-weight: 900; margin: 0; line-height: 1.1; letter-spacing: -1px;">Your <span style="color: #07e219;">Premium Pass</span><br />is Secured.</h1>
              <div style="color: #777777; font-size: 16px; margin-top: 30px; font-weight: 400;">10/10 successfully confirmed referrals.</div>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 70px 50px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 18px; font-weight: 400; color: #111111; padding-bottom: 20px;">Hello <b>${user.name}</b>,</td>
                </tr>
                <tr>
                  <td style="font-size: 15px; line-height: 1.7; color: #666666; padding-bottom: 50px;">
                    Your commitment to the Hiero ecosystem has reached a major milestone. As one of our top referrers, we are officially granting you this exclusive Premium Pass.
                  </td>
                </tr>

                <!-- MILESTONE BOX -->
                <tr>
                  <td style="padding-bottom: 60px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-left: 5px solid #07e219; border-radius: 6px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="24" valign="top" style="color: #07e219; font-size: 20px; font-weight: 900; line-height: 1;">&checkmark;</td>
                              <td style="padding-left: 15px; color: #333333; font-size: 14px; line-height: 1.5;">
                                <b>Milestone Verified:</b> All 10 referrals have been analyzed and confirmed by our team as genuine and qualified.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- REWARD PASS CARD -->
                <tr>
                  <td style="padding-bottom: 60px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#020202" style="border-radius: 20px; border: 1px solid #1a1a1a;">
                      <tr>
                        <td style="padding: 50px;">
                          <!-- Card Header -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                            <tr>
                              <td style="color: #444444; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">HIERO CORE &middot; 2026</td>
                              <td align="right" style="color: #07e219; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                                <table border="0" cellpadding="0" cellspacing="0" align="right">
                                  <tr>
                                    <td width="8" height="8" bgcolor="#07e219" style="border-radius: 50%;"></td>
                                    <td style="padding-left: 8px;">ACTIVE PASS</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <div style="color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 5px;">Premium Pass</div>
                          <div style="color: #666666; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 50px;">Verified Career Ambassador</div>

                          <!-- Card Data -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="60%">
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Authorization Key</div>
                                <div style="color: #07e219; font-family: 'Courier New', monospace; font-size: 17px; font-weight: 700;">${rewardCode}</div>
                              </td>
                              <td>
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Pass Tier</div>
                                <div style="color: #ffffff; font-size: 15px; font-weight: 700;">Ambassador VIP</div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-top: 50px;">
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Secure Verification OTP</div>
                                <table border="0" cellpadding="0" cellspacing="12">
                                  <tr>
                                    ${otp.split('').map(digit => `
                                      <td width="42" height="55" bgcolor="#080808" align="center" style="border: 1px solid #222222; border-radius: 8px; color: #07e219; font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; line-height: 55px;">${digit}</td>
                                    `).join('')}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Card Footer -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 50px; border-top: 1px solid #111111; padding-top: 30px;">
                            <tr>
                              <td style="color: #333333; font-size: 11px;">${user.email}</td>
                              <td align="right" style="color: #333333; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">ISSUE &middot; 2026</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- REDEMPTION PROTOCOL -->
                <tr>
                  <td style="padding: 50px; border: 1px solid #f0f0f0; border-radius: 12px;">
                    <div style="color: #111111; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 25px;">Redemption Protocol</div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Present this digital pass at the partner front desk</td></tr>
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Provide the OTP only during the final verification</td></tr>
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Each pass is unique and tied to your verified profile</td></tr>
                      <tr><td style="color: #666666; font-size: 14px;">&bullet; Auth Keys are for one-time use and non-transferable</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA BUTTON -->
                <tr>
                  <td align="center" style="padding: 60px 0 40px 0;">
                    <a href="#" style="background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 22px 55px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase;">View Digital Pass</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#000000" style="padding: 90px 40px; text-align: center;">
              <div style="color: #666666; font-weight: 800; font-size: 14px; letter-spacing: 2px; margin-bottom: 30px; text-transform: uppercase;">HIERO CAREER ASSISTANT</div>
              <div style="color: #444444; font-size: 11px; margin-bottom: 25px;">
                <a href="#" style="color: #444444; text-decoration: none;">Security</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Privacy</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Terms</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Support</a>
              </div>
              <div style="color: #444444; font-size: 11px; line-height: 2; opacity: 0.8;">
                Authorized communication sent to ${user.email}<br />
                &copy; 2026 Hiero System. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"Hiero Career Assistant" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🏆 Your Premium Hiero Pass is Ready',
      html: emailHtml
    });
    console.log(`✅ Table-based fixed reward email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send reward email to ${user.email}:`, error.message);
  }
}

// Reward Verification Endpoint (For Hotel Use)
app.post('/verify-reward', async (req, res) => {
  const { rewardCode, otp } = req.body;

  if (!rewardCode || !otp) {
    return res.status(400).json({ error: 'Reward code and OTP are required' });
  }

  // Find user who has this reward
  let foundUser = null;
  let foundReward = null;

  for (const user of users) {
    const reward = (user.rewards || []).find(r => r.code === rewardCode);
    if (reward) {
      foundUser = user;
      foundReward = reward;
      break;
    }
  }

  if (!foundReward) {
    return res.status(404).json({ error: 'Invalid reward code' });
  }

  if (foundReward.isUsed) {
    return res.status(400).json({ error: 'This reward has already been used' });
  }

  if (foundReward.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Success: Mark as used
  foundReward.isUsed = true;
  foundReward.usedAt = new Date().toISOString();
  saveUsers();

  console.log(`✅ Reward ${rewardCode} successfully verified and used for user ${foundUser.email}`);

  res.json({
    success: true,
    message: 'Reward verified successfully!',
    user: {
      name: foundUser.name,
      email: foundUser.email
    }
  });
});

// Resume Generation Endpoints
app.post('/generate-resume', authenticateToken, async (req, res) => {
  try {
    const resumeData = req.body;
    console.log('Generating resume with template:', resumeData.template);

    // Track referral completion
    await checkReferralCompletion(req.user.id);

    res.json({
      success: true,
      message: 'Resume generated successfully',
      template: resumeData.template
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({
      error: 'Failed to generate resume',
      details: error.message
    });
  }
});

app.post('/download-resume', authenticateToken, async (req, res) => {
  let page;
  try {
    const resumeData = req.body;
    const template = resumeData.template || 'classic';
    console.log('Downloading resume with template:', template);

    // Generate HTML based on selected template
    const html = generateTemplateHTML(template, resumeData);

    // Create PDF using Puppeteer with optimizations
    console.time('PDF Generation');

    // Use persistent browser instance (much faster!)
    const browser = await getBrowserInstance();
    page = await browser.newPage();

    // Optimize: Use 'domcontentloaded' instead of 'networkidle0' for faster generation
    // Since we're setting content directly, no external resources to wait for
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: false
    });

    // Close the page but keep browser instance alive for next request
    await page.close();
    page = null;

    console.timeEnd('PDF Generation');

    // Track referral completion
    await checkReferralCompletion(req.user.id);

    const fileName = `${resumeData.personalInfo?.fullName || 'resume'}_${template}_resume.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download error:', error);
    if (page) {
      await page.close().catch(() => { });
    }
    res.status(500).json({
      error: 'Failed to download resume',
      details: error.message
    });
  }
});

app.post('/preview-resume', async (req, res) => {
  try {
    const resumeData = req.body;
    const template = resumeData.template || 'classic';
    console.log('Previewing resume with template:', template);
    console.log('Resume data references:', resumeData.references);
    console.log('Resume data customDetails:', resumeData.customDetails);

    // Generate HTML based on selected template
    const html = generateTemplateHTML(template, resumeData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      error: 'Failed to preview resume',
      details: error.message
    });
  }
});

// Logout endpoint (for completeness, though JWT is stateless)
app.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can add any server-side cleanup here if needed
  res.json({
    message: 'Logged out successfully',
    action: 'clear_token'
  });
});

// Start Server
app.listen(process.env.PORT || 3000, async () => {
  console.log(`✅ Server started on port ${process.env.PORT || 3000}`);

  // Pre-warm browser instance for faster first PDF generation
  console.log('🔥 Pre-warming browser instance...');
  try {
    await getBrowserInstance();
    console.log('✅ Browser instance ready - PDF generation will be fast!');
  } catch (error) {
    console.error('⚠️  Browser pre-warm failed, will launch on-demand:', error.message);
  }
});