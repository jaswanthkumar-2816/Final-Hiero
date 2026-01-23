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

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(passport.initialize());

// Users store
let users = [];
let userIdCounter = 1;

// Multer upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ✅ Nodemailer setup (using Gmail app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) console.error('Email config error:', error);
  else console.log('✅ Email ready');
});

// Google Auth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.googleId === profile.id);
  const email = profile.emails?.[0]?.value || 'default@example.com';
  if (!user) {
    user = {
      id: userIdCounter++,
      googleId: profile.id,
      email,
      name: profile.displayName,
      emailVerified: true,
      signupMethod: 'google',
    };
    users.push(user);
  }
  return done(null, user);
}));

// GitHub Auth
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/github/callback',
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.githubId === profile.id);
  const email = profile.emails?.[0]?.value || 'default@example.com';
  if (!user) {
    user = {
      id: userIdCounter++,
      githubId: profile.id,
      email,
      name: profile.displayName || profile.username,
      emailVerified: true,
      signupMethod: 'github',
    };
    users.push(user);
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
    req.user = { id: decoded.id };
    next();
  });
};

// ✅ Signup Route
app.post('/signup', async (req, res) => {
  const { name, password } = req.body;
  const email = process.env.EMAIL_USER; // For demo, using fixed email

  if (!name || !password) return res.status(400).json({ error: 'All fields required' });

  const existingUser = users.find(u => u.email === email && u.name === name.trim().toLowerCase());
  if (existingUser) return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  const user = {
    id: userIdCounter++,
    name: name.trim().toLowerCase(),
    email,
    password: hashedPassword,
    emailVerified: false,
    signupMethod: 'email',
  };
  users.push(user);

  const token = jwt.sign({ email, userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const link = `http://localhost:3000/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Verify Hiero Account for ${name}`,
      html: `<p>User: ${name}</p><p>Click <a href="${link}">here</a> to verify your email.</p>`
    });
    res.status(201).json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Email send failed' });
  }
});

// ✅ Verify Email
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  try {
    const { email, userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u.id === userId && u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    user.emailVerified = true;
    res.redirect('http://localhost:8080?verified=true');
  } catch {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const email = process.env.EMAIL_USER; // Fixed demo email

  const user = users.find(u => u.email === email && u.name === name.trim().toLowerCase());
  if (!user) return res.status(400).json({ error: 'User not found' });

  const match = await bcrypt.compare(password.trim(), user.password);
  if (!match) return res.status(400).json({ error: 'Incorrect password' });
  if (!user.emailVerified) return res.status(400).json({ error: 'Email not verified' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Google & GitHub OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`http://localhost:8082?token=${token}`);
});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`http://localhost:8082?token=${token}`);
});

// ✅ Protected Dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    message: `Welcome to your dashboard, ${user.name}!`,
    name: user.name,
    email: user.email,
  });
});

// ✅ Start Server
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Server started on port ${process.env.PORT || 3000}`);
});

const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
  localStorage.setItem('token', token); // Save token for resume-builder.html
  window.location.href = '/resume-builder.html';
}