"""
User service for managing users and authentication.
"""
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import jwt

from config import config
from models.user_models import User, UserSession
from models.account_models import Account

logger = logging.getLogger(__name__)


class UserService:
    """Service for handling user operations and authentication."""
    
    def __init__(self):
        self.jwt_secret = config.JWT_SECRET_KEY
        self.jwt_algorithm = "HS256"
        self.session_duration_hours = 24
        self.max_login_attempts = 5
        self.lockout_duration_minutes = 30
    
    async def create_user(
        self,
        email: str,
        password: str,
        full_name: str,
        account_id: str,
        role: str = "viewer",
        permissions: Optional[List[str]] = None
    ) -> User:
        """Create a new user."""
        try:
            # Check if user already exists
            existing_user = await User.find_one(User.email == email)
            if existing_user:
                raise ValueError("User with this email already exists")
            
            # Verify account exists
            account = await Account.get(account_id)
            if not account:
                raise ValueError("Account not found")
            
            # Hash password
            password_hash = User.hash_password(password)
            
            # Create user
            user = User(
                email=email,
                password_hash=password_hash,
                full_name=full_name,
                account=account,
                role=role,
                permissions=permissions or ["view"]
            )
            
            await user.insert()
            logger.info(f"Created new user: {email}")
            
            return user
            
        except Exception as e:
            logger.error(f"Failed to create user {email}: {e}")
            raise
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password."""
        try:
            user = await User.find_one(User.email == email)
            if not user:
                return None
            
            # Check if account is locked
            if user.is_locked():
                logger.warning(f"Authentication attempt for locked user: {email}")
                return None
            
            # Verify password
            if not user.verify_password(password):
                # Increment failed attempts
                user.login_attempts += 1
                
                # Lock account if too many attempts
                if user.login_attempts >= self.max_login_attempts:
                    user.locked_until = datetime.now(timezone.utc) + timedelta(
                        minutes=self.lockout_duration_minutes
                    )
                    logger.warning(f"User account locked due to failed attempts: {email}")
                
                user.updated_at = datetime.now(timezone.utc)
                await user.save()
                return None
            
            # Successful authentication
            user.login_attempts = 0
            user.locked_until = None
            user.last_login = datetime.now(timezone.utc)
            user.updated_at = datetime.now(timezone.utc)
            await user.save()
            
            # Create session
            session_token = await self.create_session(user)
            
            # Generate JWT token
            jwt_token = self.generate_jwt_token(user)
            
            logger.info(f"User authenticated successfully: {email}")
            
            return {
                "user": user,
                "session_token": session_token,
                "access_token": jwt_token
            }
            
        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            return None
    
    async def create_session(
        self,
        user: User,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """Create a new user session."""
        try:
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=self.session_duration_hours)
            
            session = UserSession(
                user=user,
                session_token=session_token,
                user_agent=user_agent,
                ip_address=ip_address,
                expires_at=expires_at
            )
            
            await session.insert()
            logger.debug(f"Created session for user {user.email}")
            
            return session_token
            
        except Exception as e:
            logger.error(f"Failed to create session for user {user.email}: {e}")
            raise
    
    async def validate_session(self, session_token: str) -> Optional[User]:
        """Validate session token and return user if valid."""
        try:
            session = await UserSession.find_one(
                UserSession.session_token == session_token,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc)
            ).populate(UserSession.user)
            
            if not session:
                return None
            
            # Update last activity
            session.last_activity = datetime.now(timezone.utc)
            await session.save()
            
            return session.user
            
        except Exception as e:
            logger.error(f"Session validation failed: {e}")
            return None
    
    def generate_jwt_token(self, user: User) -> str:
        """Generate JWT access token for API authentication."""
        try:
            payload = {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "account_id": str(user.account.id),
                "exp": datetime.now(timezone.utc) + timedelta(hours=self.session_duration_hours),
                "iat": datetime.now(timezone.utc)
            }
            
            return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
            
        except Exception as e:
            logger.error(f"Failed to generate JWT token for user {user.email}: {e}")
            raise
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload if valid."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.debug("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid JWT token: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        try:
            return await User.get(user_id)
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {e}")
            return None
    
    async def get_users_by_account(self, account_id: str) -> List[User]:
        """Get all users for an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return []
            
            users = await User.find(User.account == account).to_list()
            return users
            
        except Exception as e:
            logger.error(f"Failed to get users for account {account_id}: {e}")
            return []
    
    async def update_user(
        self,
        user_id: str,
        **updates
    ) -> Optional[User]:
        """Update user information."""
        try:
            user = await User.get(user_id)
            if not user:
                return None
            
            # Update allowed fields
            allowed_fields = {
                'full_name', 'role', 'permissions', 'status'
            }
            
            for field, value in updates.items():
                if field in allowed_fields:
                    setattr(user, field, value)
            
            user.updated_at = datetime.now(timezone.utc)
            await user.save()
            
            logger.info(f"Updated user {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {e}")
            return None
    
    async def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Change user password."""
        try:
            user = await User.get(user_id)
            if not user:
                return False
            
            # Verify old password
            if not user.verify_password(old_password):
                return False
            
            # Set new password
            user.password_hash = User.hash_password(new_password)
            user.updated_at = datetime.now(timezone.utc)
            await user.save()
            
            logger.info(f"Password changed for user {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to change password for user {user_id}: {e}")
            return False
    
    async def generate_password_reset_token(self, email: str) -> Optional[str]:
        """Generate password reset token for user."""
        try:
            user = await User.find_one(User.email == email)
            if not user:
                return None
            
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = reset_token
            user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
            user.updated_at = datetime.now(timezone.utc)
            await user.save()
            
            logger.info(f"Generated password reset token for {email}")
            return reset_token
            
        except Exception as e:
            logger.error(f"Failed to generate reset token for {email}: {e}")
            return None
    
    async def reset_password(self, reset_token: str, new_password: str) -> bool:
        """Reset password using reset token."""
        try:
            user = await User.find_one(
                User.reset_token == reset_token,
                User.reset_token_expires > datetime.now(timezone.utc)
            )
            
            if not user:
                return False
            
            # Set new password and clear reset token
            user.password_hash = User.hash_password(new_password)
            user.reset_token = None
            user.reset_token_expires = None
            user.updated_at = datetime.now(timezone.utc)
            await user.save()
            
            logger.info(f"Password reset for user {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset password: {e}")
            return False
    
    async def logout_session(self, session_token: str) -> bool:
        """Logout user session."""
        try:
            session = await UserSession.find_one(
                UserSession.session_token == session_token
            )
            
            if session:
                session.is_active = False
                await session.save()
                logger.debug("User session logged out")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to logout session: {e}")
            return False
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        try:
            expired_sessions = await UserSession.find(
                UserSession.expires_at < datetime.now(timezone.utc)
            ).to_list()
            
            count = len(expired_sessions)
            
            for session in expired_sessions:
                await session.delete()
            
            logger.info(f"Cleaned up {count} expired user sessions")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired sessions: {e}")
            return 0 