"""
Authentication service for Google OAuth2 and session management.
"""
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
import jwt

from config import config
from models.account_models import Account, AccountSession

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling authentication and authorization."""
    
    def __init__(self):
        self.jwt_secret = config.JWT_SECRET_KEY
        self.jwt_algorithm = "HS256"
        self.session_duration_hours = 24
        
        # Google OAuth2 configuration
        self.google_client_id = config.GOOGLE_CLIENT_ID
        self.google_client_secret = config.GOOGLE_CLIENT_SECRET
        self.google_redirect_uri = config.GOOGLE_REDIRECT_URI
        
    def create_google_oauth_url(self) -> str:
        """Create Google OAuth2 authorization URL."""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.google_client_id,
                        "client_secret": self.google_client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.google_redirect_uri]
                    }
                },
                scopes=['openid', 'email', 'profile']
            )
            flow.redirect_uri = self.google_redirect_uri
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            return authorization_url
            
        except Exception as e:
            logger.error(f"Failed to create Google OAuth URL: {e}")
            raise
    
    async def register_with_email(self, email: str, password: str, name: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user with email/password."""
        try:
            # Check if user already exists
            existing_account = await Account.find_one(Account.email == email)
            if existing_account:
                raise ValueError("Account with this email already exists")
            
            # Create new account
            account = Account(
                email=email,
                name=name,
                company_name=company_name,
                auth_providers=["email"]
            )
            account.set_password(password)
            await account.insert()
            
            logger.info(f"Created new account with email: {email}")
            
            # Create session
            session_token = await self.create_session(
                account.id,
                provider="email"
            )
            
            return {
                "account": account,
                "session_token": session_token,
                "access_token": self.generate_jwt_token(account)
            }
            
        except Exception as e:
            logger.error(f"Email registration failed: {e}")
            raise
    
    async def login_with_email(self, email: str, password: str) -> Dict[str, Any]:
        """Login user with email/password."""
        try:
            # Find account by email
            account = await Account.find_one(Account.email == email)
            if not account:
                raise ValueError("Invalid email or password")
            
            # Verify password
            if not account.verify_password(password):
                raise ValueError("Invalid email or password")
            
            # Check account status
            if account.status != "active":
                raise ValueError(f"Account is {account.status}")
            
            # Update last login
            account.last_login = datetime.now(timezone.utc)
            account.updated_at = datetime.now(timezone.utc)
            await account.save()
            
            logger.info(f"User logged in with email: {email}")
            
            # Create session
            session_token = await self.create_session(
                account.id,
                provider="email"
            )
            
            return {
                "account": account,
                "session_token": session_token,
                "access_token": self.generate_jwt_token(account)
            }
            
        except Exception as e:
            logger.error(f"Email login failed: {e}")
            raise
    
    async def handle_google_callback(self, code: str, state: str) -> Dict[str, Any]:
        """Handle Google OAuth2 callback and create/update account."""
        try:
            # Exchange authorization code for tokens
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.google_client_id,
                        "client_secret": self.google_client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.google_redirect_uri]
                    }
                },
                scopes=['openid', 'email', 'profile']
            )
            flow.redirect_uri = self.google_redirect_uri
            
            flow.fetch_token(code=code)
            
            # Verify and decode ID token
            credentials = flow.credentials
            id_info = id_token.verify_oauth2_token(
                credentials.id_token,
                requests.Request(),
                self.google_client_id
            )
            
            # Extract user information
            google_user_id = id_info.get('sub')
            email = id_info.get('email')
            name = id_info.get('name')
            verified = id_info.get('email_verified', False)
            
            # Find or create account
            account = await Account.find_one(Account.google_user_id == google_user_id)
            
            if not account:
                # Create new account
                account = Account(
                    email=email,
                    name=name,
                    google_user_id=google_user_id,
                    auth_providers=["google"],
                    verified_at=datetime.now(timezone.utc) if verified else None
                )
                await account.insert()
                logger.info(f"Created new account for {email}")
            else:
                # Update existing account
                account.last_login = datetime.now(timezone.utc)
                account.updated_at = datetime.now(timezone.utc)
                if verified and not account.verified_at:
                    account.verified_at = datetime.now(timezone.utc)
                await account.save()
                logger.info(f"Updated existing account for {email}")
            
            # Create session
            session_token = await self.create_session(
                account.id,
                provider="google",
                oauth_data={
                    "access_token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "id_token": credentials.id_token,
                    "google_user_id": google_user_id
                }
            )
            
            return {
                "account": account,
                "session_token": session_token,
                "access_token": self.generate_jwt_token(account)
            }
            
        except Exception as e:
            logger.error(f"Google OAuth callback failed: {e}")
            raise
    
    async def create_session(
        self,
        account_id: str,
        provider: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        oauth_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new account session."""
        try:
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=self.session_duration_hours)
            
            session = AccountSession(
                account_id=str(account_id),
                session_token=session_token,
                provider=provider,
                user_agent=user_agent,
                ip_address=ip_address,
                expires_at=expires_at,
                oauth_data=oauth_data
            )
            
            await session.insert()
            logger.debug(f"Created session for account {account_id}")
            
            return session_token
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise
    
    async def validate_session(self, session_token: str) -> Optional[Account]:
        """Validate session token and return account if valid."""
        try:
            session = await AccountSession.find_one(
                AccountSession.session_token == session_token,
                AccountSession.is_active == True,
                AccountSession.expires_at > datetime.now(timezone.utc)
            )
            
            if not session:
                return None
            
            # Update last activity
            session.last_activity = datetime.now(timezone.utc)
            await session.save()
            
            # Get account
            account = await Account.get(session.account_id)
            return account
            
        except Exception as e:
            logger.error(f"Session validation failed: {e}")
            return None
    
    def generate_jwt_token(self, account: Account) -> str:
        """Generate JWT access token for API authentication."""
        try:
            payload = {
                "sub": str(account.id),
                "email": account.email,
                "name": account.name,
                "permissions": account.permissions,
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(hours=self.session_duration_hours)
            }
            
            token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
            return token
            
        except Exception as e:
            logger.error(f"JWT token generation failed: {e}")
            raise
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload if valid."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
        except Exception as e:
            logger.error(f"JWT verification failed: {e}")
            return None
    
    async def logout_session(self, session_token: str) -> bool:
        """Logout and deactivate session."""
        try:
            session = await AccountSession.find_one(
                AccountSession.session_token == session_token
            )
            
            if session:
                session.is_active = False
                await session.save()
                logger.info(f"Deactivated session for account {session.account_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Logout failed: {e}")
            return False
    
    async def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions from database."""
        try:
            expired_sessions = await AccountSession.find(
                AccountSession.expires_at < datetime.now(timezone.utc)
            ).to_list()
            
            count = 0
            for session in expired_sessions:
                await session.delete()
                count += 1
            
            if count > 0:
                logger.info(f"Cleaned up {count} expired sessions")
            
            return count
            
        except Exception as e:
            logger.error(f"Session cleanup failed: {e}")
            return 0


# Global auth service instance
auth_service = AuthService() 