"""
User and Entity models for VAT processing system.
"""
from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed, Link
from pydantic import Field, EmailStr
import bcrypt

from .account_models import Account


class User(Document):
    """User entity with email/password authentication connected to an account."""
    
    # Basic user information
    email: Indexed(EmailStr) = Field(..., description="User email address")
    password_hash: str = Field(..., description="Bcrypt hashed password")
    full_name: str = Field(..., description="User's full name")
    
    # Account relationship
    account: Link[Account] = Field(..., description="Reference to the account this user belongs to")
    
    # User status and permissions
    status: str = Field(default="active", description="User status: active, inactive, suspended")
    role: str = Field(default="viewer", description="User role: admin, member, viewer")
    permissions: List[str] = Field(
        default_factory=lambda: ["view"],
        description="Specific permissions for this user"
    )
    
    # Authentication tracking
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    login_attempts: int = Field(default=0, description="Failed login attempts counter")
    locked_until: Optional[datetime] = Field(default=None, description="Account lock expiration")
    
    # Email verification
    email_verified: bool = Field(default=False, description="Whether email is verified")
    verification_token: Optional[str] = Field(default=None, description="Email verification token")
    verified_at: Optional[datetime] = Field(default=None, description="Email verification timestamp")
    
    # Password reset
    reset_token: Optional[str] = Field(default=None, description="Password reset token")
    reset_token_expires: Optional[datetime] = Field(default=None, description="Reset token expiration")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "account",
            "status",
            "role",
            "created_at",
            "email_verified"
        ]
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def is_locked(self) -> bool:
        """Check if the user account is locked."""
        if self.locked_until is None:
            return False
        return datetime.now(timezone.utc) < self.locked_until
    
    def can_perform_action(self, action: str) -> bool:
        """Check if user can perform a specific action based on role and permissions."""
        role_permissions = {
            "admin": ["view", "create", "edit", "delete", "manage_users", "manage_entities"],
            "member": ["view", "create", "edit"],
            "viewer": ["view"]
        }
        
        # Check role-based permissions
        if action in role_permissions.get(self.role, []):
            return True
        
        # Check specific permissions
        return action in self.permissions


class Entity(Document):
    """Entity representing a sub-account within an account (e.g., different subsidiaries)."""
    
    # Basic entity information
    name: str = Field(..., description="Entity name (e.g., 'Lego Belgium', 'Lego Poland')")
    description: Optional[str] = Field(default=None, description="Entity description")
    
    # Account relationship
    account: Link[Account] = Field(..., description="Reference to the parent account")
    
    # Entity identification
    entity_code: Optional[str] = Field(default=None, description="Unique entity code within account")
    tax_id: Optional[str] = Field(default=None, description="Entity-specific tax ID")
    vat_number: Optional[str] = Field(default=None, description="Entity-specific VAT number")
    registration_number: Optional[str] = Field(default=None, description="Entity registration number")
    
    # Location information
    country: str = Field(..., description="Entity country")
    address: Optional[dict] = Field(
        default_factory=dict,
        description="Entity address: street, city, state, postal_code"
    )
    
    # Entity settings
    currency: str = Field(default="EUR", description="Default currency for this entity")
    vat_rate: float = Field(default=20.0, description="Default VAT rate for this entity")
    language: str = Field(default="en", description="Default language for this entity")
    
    # Status and permissions
    status: str = Field(default="active", description="Entity status: active, inactive, archived")
    is_default: bool = Field(default=False, description="Whether this is the default entity for the account")
    
    # Processing settings
    auto_process_invoices: bool = Field(default=False, description="Auto-process uploaded invoices")
    monthly_processing_limit: Optional[int] = Field(default=None, description="Monthly processing limit")
    current_month_processed: int = Field(default=0, description="Current month processed count")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "entities"
        indexes = [
            "account",
            "name",
            "country",
            "status",
            "entity_code",
            "vat_number",
            "is_default",
            "created_at"
        ]
    
    async def get_users(self) -> List[User]:
        """Get all users who have access to this entity."""
        # Users have access to entities through their account
        users = await User.find(User.account == self.account).to_list()
        return users
    
    def can_process_more(self) -> bool:
        """Check if entity can process more invoices this month."""
        if self.monthly_processing_limit is None:
            return True
        return self.current_month_processed < self.monthly_processing_limit


class UserSession(Document):
    """User session tracking for email/password authentication."""
    
    user: Link[User] = Field(..., description="Reference to User")
    session_token: str = Field(..., description="Session token")
    user_agent: Optional[str] = Field(default=None, description="User agent string")
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    
    # Session lifecycle
    expires_at: datetime = Field(..., description="Session expiration time")
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = Field(default=True, description="Whether session is active")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "user_sessions"
        indexes = [
            "user",
            "session_token",
            "expires_at",
            "is_active"
        ] 