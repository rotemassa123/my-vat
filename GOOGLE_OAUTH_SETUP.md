# Google OAuth Setup Instructions (Google Workspace)

This guide will help you set up Google OAuth authentication for your VAT processing application using your existing Google Workspace account.

## Prerequisites

- ✅ Google Workspace account (you already have this!)
- ✅ Google Cloud Console access (you're already using this for email!)
- ✅ Admin access to your application environment

## Step 1: Use Your Existing Google Cloud Project

**Since you're already sending emails successfully using Google Workspace:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Use your existing project** (the one you're using for email services)
   - OR create a new project if you prefer to keep OAuth separate:
     - Click on the project dropdown at the top
     - Click "NEW PROJECT" 
     - Enter a project name (e.g., "MyVAT OAuth")
     - Click "CREATE"

> **💡 Recommendation**: Since you already have a working Google Cloud project with email services, it's easier to add OAuth to the same project to keep everything centralized.

## Step 2: Enable Google APIs

1. In your Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" and click on it
3. Click **ENABLE**
4. Search for "People API" and click on it  
5. Click **ENABLE**

## Step 3: Configure OAuth Consent Screen

**Since you have a Google Workspace account:**

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **Internal** (this is available because you have a Google Workspace account)
3. Click **CREATE**
4. Fill out the required fields:
   - **App name**: MyVAT Application
   - **User support email**: Your workspace email address
   - **Developer contact information**: Your workspace email address
5. Click **SAVE AND CONTINUE**
6. On the "Scopes" page, click **SAVE AND CONTINUE** (no additional scopes needed)
7. Click **SAVE AND CONTINUE** (no test users needed for internal apps)
8. Review and click **BACK TO DASHBOARD**

> **✅ Advantage**: Since you're using Google Workspace with "Internal" apps, your OAuth app will automatically be trusted for all users in your workspace domain without requiring verification or showing "unverified app" warnings.

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. Choose **Web application** as the application type
4. Name it "MyVAT Web Client"
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:8000/api/auth/google/callback` (for development)
   - `https://your-production-domain.com/api/auth/google/callback` (for production)
6. Click **CREATE**
7. **Important**: Copy and save the **Client ID** and **Client Secret** - you'll need these!

## Step 5: Backend Environment Configuration

**Add the OAuth variables to your existing `.env` file** in the `my-vat/backend/` directory (you likely already have some Google configuration from your email setup):

```bash
# ====================================
# Google OAuth Configuration
# ====================================
GOOGLE_CLIENT_ID=your-google-client-id-from-step-4
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-4
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# ====================================
# Application Configuration  
# ====================================
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here

# ====================================
# Database Configuration
# ====================================
MONGODB_URI=mongodb://localhost:27017/myvat
# Alternative individual DB settings:
# DB_HOST=localhost
# DB_PORT=27017
# DB_DATABASE=myvat
# DB_USERNAME=
# DB_PASSWORD=
# DB_AUTH_SOURCE=admin

# ====================================
# Optional: Disable Authentication (Development Only)
# ====================================
# DISABLE_AUTH=false
```

> **💡 Pro Tip**: Copy the above configuration to a new `.env` file in your `my-vat/backend/` directory and replace the placeholder values with your actual Google OAuth credentials.

### Environment Variables Explanation

- **`GOOGLE_CLIENT_ID`**: The Client ID from Google Cloud Console
- **`GOOGLE_CLIENT_SECRET`**: The Client Secret from Google Cloud Console  
- **`GOOGLE_REDIRECT_URI`**: Where Google redirects after authentication (must match what you configured in Step 4)
- **`FRONTEND_URL`**: Your frontend URL for final redirects after OAuth completion

## Step 6: Production Setup

For production deployment, you'll need to:

1. **Update OAuth Credentials**:
   - Go back to Google Cloud Console > APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your production redirect URI: `https://your-domain.com/api/auth/google/callback`

2. **Update Environment Variables**:
   ```bash
   GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **OAuth App Publishing** (Not needed for your setup):
   - Since you chose "Internal" for Google Workspace, your app is automatically trusted
   - No verification or publishing required - your app is ready to use in production
   - All users in your workspace domain can use Google OAuth without warnings

## Step 7: Testing the Setup

1. **Start your backend server**:
   ```bash
   cd my-vat/backend
   npm run start:dev
   ```

2. **Start your frontend**:
   ```bash
   cd my-vat/frontend  
   npm run dev
   ```

3. **Test the OAuth flow**:
   - Go to `http://localhost:5173/login`
   - Click "Continue with Google"
   - You should be redirected to Google's OAuth screen
   - After authentication, you should be redirected back to your app

## Step 8: User Management

**Important**: Google OAuth will only work for users that already exist in your system. Here's how it works:

1. **User Invitation Required**: Users must first be invited through your existing user management system
2. **Email Matching**: Google OAuth matches users by email address
3. **Account Status**: Only users with "active" status can log in via Google OAuth
4. **Profile Updates**: The system will automatically update the user's profile picture from Google
5. **Domain Restriction**: With Google Workspace Internal apps, only users from your workspace domain can attempt OAuth (extra security)

### Adding Users for Google OAuth

1. Use your existing user management interface to invite users
2. Users will receive an invitation email (sent through your existing Google Workspace email system)
3. Once their status is "active", they can use Google OAuth with their workspace email address

> **🔐 Google Workspace Security**: Even if someone from outside your workspace domain tries to use Google OAuth, Google will automatically reject them because your app is configured as "Internal" to your workspace.

## Troubleshooting

### Common Issues

1. **"OAuth Error" or redirect to login with error**:
   - Check that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Verify the redirect URI matches exactly what's configured in Google Cloud Console

2. **"User not found" error**:
   - The user needs to be invited and activated in your system first
   - Email addresses must match exactly between Google account and your system

3. **"Account pending" error**:
   - User exists but their status is still "pending"
   - Complete the user invitation process first

4. **CORS errors**:
   - Backend CORS is already configured for `localhost:3000` and `localhost:5173`
   - For production, update CORS settings in `my-vat/backend/src/Common/API/REST/rest.bootstrap.ts`

### Debugging

Check the backend logs for detailed OAuth flow information:
- Authentication attempts
- User lookup results  
- Token generation success/failure
- Redirect decisions

## Security Notes

1. **Environment Variables**: Never commit your `.env` file to version control
2. **HTTPS in Production**: Always use HTTPS for production OAuth flows
3. **Client Secret**: Keep your Google Client Secret secure and never expose it to the frontend
4. **Redirect URI Validation**: Google validates redirect URIs exactly, including protocols and ports
5. **Google Workspace Advantage**: Your internal OAuth app automatically inherits your workspace's security policies and user management
6. **Domain Restriction**: Only users from your Google Workspace domain can authenticate (additional security layer)

## API Endpoints

The following OAuth endpoints are now available:

- **`GET /api/auth/google`**: Initiates Google OAuth flow
- **`GET /api/auth/google/callback`**: Handles Google OAuth callback
- **`POST /api/auth/login`**: Existing email/password login (unchanged)
- **`GET /api/auth/me`**: Get current user info (unchanged)
- **`POST /api/auth/logout`**: Logout (unchanged)

The frontend automatically uses these endpoints through the existing authentication flow. 