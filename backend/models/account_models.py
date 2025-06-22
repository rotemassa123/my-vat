"""
Account models for VAT processing system.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, EmailStr
import bcrypt


class Account(Document):
    """Account entity representing user/company for VAT reclaim processing."""
    
    # Basic account information
    email: Indexed(EmailStr) = Field(..., description="Primary email address")
    name: str = Field(..., description="Account holder name or company name")
    account_type: str = Field(default="individual", description="Type: individual, company, organization")
    status: str = Field(default="active", description="Account status: active, suspended, closed")
    
    # Company information (for VAT reclaim)
    company_name: Optional[str] = Field(default=None, description="Legal company name")
    tax_id: Optional[str] = Field(default=None, description="Tax identification number")
    vat_number: Optional[str] = Field(default=None, description="VAT registration number")
    registration_number: Optional[str] = Field(default=None, description="Company registration number")
    
    # Address information
    address: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="Address information: street, city, state, postal_code, country"
    )
    
    # Contact information
    phone: Optional[str] = Field(default=None, description="Phone number")
    website: Optional[str] = Field(default=None, description="Company website")
    
    # VAT reclaim specific settings
    vat_settings: Dict[str, Any] = Field(
        default_factory=lambda: {
            "default_currency": "USD",
            "vat_rate": 20.0,
            "reclaim_threshold": 100.0,
            "auto_process": False
        },
        description="VAT processing configuration"
    )
    
    # Authentication info
    password_hash: Optional[str] = Field(default=None, description="Hashed password for email/password auth")
    google_user_id: Optional[str] = Field(default=None, description="Google OAuth user ID")
    auth_providers: List[str] = Field(default_factory=list, description="Enabled auth providers")
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    
    # Account limits and permissions
    monthly_upload_limit_mb: int = Field(default=10000, description="Monthly upload limit in MB")
    current_month_usage_mb: int = Field(default=0, description="Current month usage in MB")
    permissions: List[str] = Field(
        default_factory=lambda: ["upload", "process", "view"],
        description="Account permissions"
    )
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified_at: Optional[datetime] = Field(default=None, description="Email verification timestamp")
    
    def set_password(self, password: str) -> None:
        """Hash and set password."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash."""
        if not self.password_hash:
            return False
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    
    class Settings:
        name = "accounts"
        indexes = [
            "email",
            "google_user_id",
            "status",
            "created_at",
            "company_name",
            "vat_number"
        ]


class AccountSession(Document):
    """Account session tracking for authentication."""
    
    account_id: Indexed(str) = Field(..., description="Reference to Account ID")
    session_token: str = Field(..., description="Session token")
    provider: str = Field(..., description="Auth provider: google, local")
    user_agent: Optional[str] = Field(default=None, description="User agent string")
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    
    # Session lifecycle
    expires_at: datetime = Field(..., description="Session expiration time")
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = Field(default=True, description="Whether session is active")
    
    # OAuth specific data
    oauth_data: Optional[Dict[str, Any]] = Field(default=None, description="OAuth provider data")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "account_sessions"
        indexes = [
            "account_id",
            "session_token",
            "expires_at",
            "is_active"
        ] 