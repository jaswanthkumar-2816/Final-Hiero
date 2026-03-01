# Hiero Login System

Authentication and user management system for Hiero Resume Builder with OAuth support (Google, GitHub) and email verification.

## Features

- 🔐 Email/Password Authentication
- 🌐 OAuth 2.0 (Google & GitHub)
- ✉️ Email Verification
- 🔑 JWT Token-based Authentication
- 📄 Resume PDF Generation with Puppeteer
- 📁 File Upload Support

## Tech Stack

- **Backend**: Node.js + Express
- **Authentication**: Passport.js, JWT
- **Email**: Nodemailer
- **PDF Generation**: Puppeteer
- **File Upload**: Multer

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# JWT Secret (use a strong random string)
JWT_SECRET=your_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Configuration (for verification emails)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Public URLs
PUBLIC_URL=https://your-render-app.onrender.com
GOOGLE_CALLBACK_URL=https://your-render-app.onrender.com/auth/google/callback
GITHUB_CALLBACK_URL=https://your-render-app.onrender.com/auth/github/callback

# CORS Configuration
ALLOWED_ORIGINS=https://your-render-app.onrender.com
ADDITIONAL_ORIGINS=https://your-frontend-domain.com

# Frontend Base URL
APP_BASE_URL=https://your-frontend-domain.com
```

## Running Locally

```bash
npm start
```

Server will start on `http://localhost:3000`

## Deployment to Render

### 1. Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `https://github.com/jaswanthkumar-2816/Hiero-Login.git`

### 2. Configure the Service

- **Name**: `hiero-login`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Add Environment Variables

In Render dashboard, add all the environment variables listed above.

**Important for Puppeteer on Render:**

Add these additional environment variables for Puppeteer to work:

```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 4. Deploy

Click "Create Web Service" and Render will automatically deploy your app.

## API Endpoints

### Authentication

- `POST /signup` - Register new user
- `POST /login` - Login with email/password
- `POST /verify-email` - Verify email with token
- `GET /auth/google` - Google OAuth login
- `GET /auth/github` - GitHub OAuth login

### Protected Routes

- `GET /profile` - Get user profile (requires JWT token)
- `POST /generate-resume` - Generate resume PDF
- `POST /upload` - Upload files

## Important Notes

### For Render Deployment

1. **Puppeteer Configuration**: Render doesn't include Chrome by default. The app should use Chromium available on the system.

2. **File Storage**: Render's ephemeral filesystem means uploaded files will be deleted on restart. Consider using external storage (AWS S3, Cloudinary) for production.

3. **Environment URLs**: Update all callback URLs and CORS origins to match your Render deployment URL.

4. **OAuth Credentials**: Update Google and GitHub OAuth apps with your Render production URLs.

## Security Considerations

- Never commit `.env` file to Git
- Use strong JWT secrets
- Keep OAuth credentials secure
- Use HTTPS in production
- Implement rate limiting for API endpoints

## License

MIT

## Support

For issues or questions, contact: jaswanthkumarmuthoju@gmail.com
