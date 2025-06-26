# 🔐 Gmail Login Setup Guide

This guide will help you set up Gmail (Google OAuth2) login functionality for your VAT processing system.

## ✅ What's Already Implemented

Your system already has complete Gmail login functionality built-in:

### Backend Features ✅
- **Google OAuth2 Flow**: Complete OAuth2 implementation with Google
- **Session Management**: Secure session handling with JWT tokens
- **Account Creation**: Automatic account creation for new Google users
- **Account Linking**: Links existing accounts with Google authentication
- **Security**: Secure cookie handling and token validation

### Frontend Features ✅
- **Gmail Login Button**: Beautiful "Continue with Google" button
- **Loading States**: Visual feedback during authentication
- **Error Handling**: Proper error messages for failed logins
- **Redirect Handling**: Seamless post-login navigation

## 🛠 Setup Steps

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select Project**
   - Create a new project or select an existing one
   - Note the project ID for reference

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Enable the following APIs:
     - **Google+ API** (for user profile information)
     - **Google Identity API** (for authentication)

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type (unless you have Google Workspace)
   - Fill in required information:
     - **App name**: "My VAT System"
     - **User support email**: Your email address
     - **App logo**: (optional) Upload your app logo
     - **App domain**: `http://localhost:8000` (for development)
     - **Developer contact**: Your email address
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email and any others you want to test with)

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Configure the client:
     - **Application type**: Web application
     - **Name**: "My VAT Web Client"
     - **Authorized JavaScript origins**: 
       - `http://localhost:5176` (frontend URL)
       - `http://localhost:8000` (backend URL)
     - **Authorized redirect URIs**: 
       - `http://localhost:8000/api/auth/google/callback`
   - Click "Create"
   - **Save the Client ID and Client Secret** - you'll need these!

### Step 2: Configure Environment Variables

You have two options to configure your environment:

#### Option A: Use the Setup Script (Recommended)
```bash
cd backend
python3 setup_google_oauth.py
```
Follow the prompts to enter your Google OAuth credentials.

#### Option B: Manual Configuration
Create a `.env` file in the `backend` directory:

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRES_HOURS=24

# Cookie Settings
COOKIE_SECURE=false  # Set to true in production with HTTPS
COOKIE_SAMESITE=lax

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

**Important**: Replace the placeholder values with your actual Google OAuth credentials.

### Step 3: Install Dependencies

Dependencies are already included in `requirements.txt`:
```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Test Your Setup

1. **Start the Backend Server**
   ```bash
   cd backend
   python3 run.py
   ```

2. **Start the Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Gmail Login**
   - Open [http://localhost:5176/login](http://localhost:5176/login)
   - Click the "Continue with Google" button
   - You should be redirected to Google's login page
   - After successful authentication, you'll be redirected back to your app

## 🔧 How It Works

### Authentication Flow

1. **User clicks "Continue with Google"**
   - Frontend redirects to `/api/auth/google`
   - Backend generates Google OAuth URL and redirects user

2. **Google Authentication**
   - User logs in with Google credentials
   - Google redirects back to `/api/auth/google/callback`

3. **Account Creation/Login**
   - Backend exchanges authorization code for user info
   - Creates new account or logs in existing user
   - Generates JWT token and session
   - Sets secure authentication cookie

4. **Frontend Redirect**
   - User is redirected to dashboard with success message
   - Frontend checks authentication status
   - User is now logged in

### Database Integration

The system automatically:
- **Creates new accounts** for first-time Google users
- **Links Google accounts** to existing email accounts
- **Stores user information** (email, name, Google user ID)
- **Manages sessions** with secure tokens

## 🚀 Production Deployment

For production deployment, update these settings:

### Environment Variables
```env
# Production Google OAuth settings
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Security settings for HTTPS
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
COOKIE_DOMAIN=.yourdomain.com

# Strong JWT secret
JWT_SECRET_KEY=your-very-strong-random-secret-key
```

### Google Cloud Console
- Add your production domain to authorized origins
- Update redirect URI to your production callback URL
- Remove localhost URLs from production credentials

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid Client ID" Error**
   - Check that `GOOGLE_CLIENT_ID` is correctly set in `.env`
   - Verify the client ID matches what's in Google Cloud Console

2. **"Redirect URI Mismatch" Error**
   - Ensure redirect URI in Google Cloud Console exactly matches your backend URL
   - Check for trailing slashes or protocol mismatches

3. **"Google login failed" Message**
   - Check backend logs for detailed error messages
   - Verify Google APIs are enabled in Cloud Console
   - Ensure OAuth consent screen is properly configured

4. **Session/Cookie Issues**
   - Check that cookies are being set (browser dev tools)
   - Verify CORS settings allow credentials
   - Ensure frontend and backend URLs match

### Debug Steps

1. **Check Backend Logs**
   ```bash
   cd backend
   python3 run.py
   # Look for authentication-related log messages
   ```

2. **Test OAuth Endpoint**
   ```bash
   curl -i "http://localhost:8000/api/auth/google"
   # Should return redirect to Google
   ```

3. **Verify Environment Variables**
   ```bash
   cd backend
   python3 -c "from config import config; print(f'Client ID: {config.GOOGLE_CLIENT_ID[:10]}...')"
   ```

## 📝 Additional Features

### User Management
- Users can have both email/password AND Google authentication
- Account linking happens automatically by email address
- Users can log in with either method

### Security Features
- Secure JWT tokens with configurable expiration
- HTTP-only cookies for session management
- CSRF protection with SameSite cookies
- Proper OAuth2 state parameter validation

### Frontend Integration
- Beautiful Google login button with loading states
- Error handling and user feedback
- Seamless integration with existing auth system
- Mobile-responsive design

## 🎉 Success!

Once configured, your users can:
- ✅ Log in with their Gmail accounts
- ✅ Create accounts automatically on first login
- ✅ Link existing accounts with Google authentication
- ✅ Enjoy seamless authentication experience

Your VAT processing system now supports modern, secure Gmail login functionality! 