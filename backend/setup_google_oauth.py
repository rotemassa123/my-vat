#!/usr/bin/env python3
"""
Google OAuth2 Setup Helper Script for My VAT System

This script helps you set up Google OAuth2 credentials for Gmail login functionality.
Run this script and follow the prompts to configure your environment.
"""

import os
import sys
from pathlib import Path

def print_header():
    print("=" * 60)
    print("🔐 MY VAT - GOOGLE OAUTH2 SETUP")
    print("=" * 60)
    print()

def print_step(step_num, title):
    print(f"\n📋 STEP {step_num}: {title}")
    print("-" * 40)

def create_env_file():
    """Create or update .env file with Google OAuth credentials."""
    env_path = Path(__file__).parent / '.env'
    
    print(f"Creating/updating .env file at: {env_path}")
    
    # Read existing .env if it exists
    existing_vars = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    existing_vars[key] = value
    
    # Get Google OAuth credentials from user
    print("\nPlease enter your Google OAuth2 credentials:")
    
    client_id = input(f"Google Client ID [{existing_vars.get('GOOGLE_CLIENT_ID', '')}]: ").strip()
    if not client_id and 'GOOGLE_CLIENT_ID' in existing_vars:
        client_id = existing_vars['GOOGLE_CLIENT_ID']
    
    client_secret = input(f"Google Client Secret [{existing_vars.get('GOOGLE_CLIENT_SECRET', '')}]: ").strip()
    if not client_secret and 'GOOGLE_CLIENT_SECRET' in existing_vars:
        client_secret = existing_vars['GOOGLE_CLIENT_SECRET']
    
    # Set default values for other variables if not provided
    env_vars = {
        'GOOGLE_CLIENT_ID': client_id,
        'GOOGLE_CLIENT_SECRET': client_secret,
        'GOOGLE_REDIRECT_URI': existing_vars.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback'),
        'JWT_SECRET_KEY': existing_vars.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production'),
        'JWT_ALGORITHM': existing_vars.get('JWT_ALGORITHM', 'HS256'),
        'JWT_EXPIRES_HOURS': existing_vars.get('JWT_EXPIRES_HOURS', '24'),
        'COOKIE_SECURE': existing_vars.get('COOKIE_SECURE', 'false'),
        'COOKIE_SAMESITE': existing_vars.get('COOKIE_SAMESITE', 'lax'),
        'HOST': existing_vars.get('HOST', '0.0.0.0'),
        'PORT': existing_vars.get('PORT', '8000'),
        'LOG_LEVEL': existing_vars.get('LOG_LEVEL', 'INFO'),
    }
    
    # Add existing variables that we don't override
    for key, value in existing_vars.items():
        if key not in env_vars:
            env_vars[key] = value
    
    # Write .env file
    with open(env_path, 'w') as f:
        f.write("# Google OAuth2 Configuration\n")
        f.write(f"GOOGLE_CLIENT_ID={env_vars['GOOGLE_CLIENT_ID']}\n")
        f.write(f"GOOGLE_CLIENT_SECRET={env_vars['GOOGLE_CLIENT_SECRET']}\n")
        f.write(f"GOOGLE_REDIRECT_URI={env_vars['GOOGLE_REDIRECT_URI']}\n\n")
        
        f.write("# JWT Configuration\n")
        f.write(f"JWT_SECRET_KEY={env_vars['JWT_SECRET_KEY']}\n")
        f.write(f"JWT_ALGORITHM={env_vars['JWT_ALGORITHM']}\n")
        f.write(f"JWT_EXPIRES_HOURS={env_vars['JWT_EXPIRES_HOURS']}\n\n")
        
        f.write("# Cookie Settings\n")
        f.write(f"COOKIE_SECURE={env_vars['COOKIE_SECURE']}\n")
        f.write(f"COOKIE_SAMESITE={env_vars['COOKIE_SAMESITE']}\n\n")
        
        f.write("# Server Configuration\n")
        f.write(f"HOST={env_vars['HOST']}\n")
        f.write(f"PORT={env_vars['PORT']}\n")
        f.write(f"LOG_LEVEL={env_vars['LOG_LEVEL']}\n\n")
        
        # Add other existing variables
        other_vars = {k: v for k, v in env_vars.items() 
                     if k not in ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI',
                                 'JWT_SECRET_KEY', 'JWT_ALGORITHM', 'JWT_EXPIRES_HOURS',
                                 'COOKIE_SECURE', 'COOKIE_SAMESITE', 'HOST', 'PORT', 'LOG_LEVEL']}
        
        if other_vars:
            f.write("# Other Configuration\n")
            for key, value in other_vars.items():
                f.write(f"{key}={value}\n")
    
    print(f"✅ .env file created/updated successfully!")
    return client_id and client_secret

def main():
    print_header()
    
    print("This script will help you set up Google OAuth2 for Gmail login functionality.")
    print("You'll need to have Google OAuth2 credentials from Google Cloud Console.")
    print()
    
    # Step 1: Google Cloud Console Setup
    print_step(1, "Google Cloud Console Setup")
    print("1. Go to https://console.cloud.google.com/")
    print("2. Create a new project or select an existing one")
    print("3. Enable the Google+ API and Google Identity API")
    print("4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs")
    print("5. Configure OAuth consent screen with your app details")
    print("6. Create OAuth 2.0 Client ID:")
    print("   - Application type: Web application")
    print("   - Name: My VAT Web Client")
    print("   - Authorized redirect URIs: http://localhost:8000/api/auth/google/callback")
    print()
    
    response = input("Have you completed the Google Cloud Console setup? (y/n): ").lower()
    if response != 'y':
        print("Please complete the Google Cloud Console setup first, then run this script again.")
        sys.exit(1)
    
    # Step 2: Configure Environment
    print_step(2, "Configure Environment Variables")
    success = create_env_file()
    
    if not success:
        print("❌ Missing Google OAuth credentials. Please provide both Client ID and Client Secret.")
        sys.exit(1)
    
    # Step 3: Test Setup
    print_step(3, "Test Your Setup")
    print("1. Restart your backend server:")
    print("   cd backend && python3 run.py")
    print()
    print("2. Start your frontend server:")
    print("   cd frontend && npm run dev")
    print()
    print("3. Go to http://localhost:5176/login")
    print("4. Click 'Continue with Google' to test the Gmail login")
    print()
    
    print("🎉 Google OAuth2 setup complete!")
    print("Your users can now log in with their Gmail accounts.")
    print()
    print("📝 Note: In production, make sure to:")
    print("   - Update redirect URI to your production domain")
    print("   - Set COOKIE_SECURE=true for HTTPS")
    print("   - Use a strong JWT_SECRET_KEY")

if __name__ == "__main__":
    main() 