"""
Configuration settings for the upload server.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Google Cloud Storage settings
    # Uses GOOGLE_APPLICATION_CREDENTIALS environment variable automatically
    
    # Google Drive Service Account settings (simpler than OAuth - no web interaction!)
    DRIVE_SERVICE_ACCOUNT_FILE: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "drive-service-account.json")
    
    # Default GCS bucket (optional)
    GCS_DEFAULT_BUCKET: Optional[str] = os.getenv("GCS_DEFAULT_BUCKET")
    
    # Upload settings
    MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "5"))  # Can increase back to optimal level
    MAX_FILE_SIZE_MB: float = float(os.getenv("MAX_FILE_SIZE_MB", "100"))
    
    # Download retry settings
    MAX_DOWNLOAD_RETRIES: int = int(os.getenv("MAX_DOWNLOAD_RETRIES", "3"))
    CHUNK_SIZE_BYTES: int = int(os.getenv("CHUNK_SIZE_BYTES", "1048576"))  # 1MB
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "upload_tracker")
    
    # MongoDB SSL settings (for Atlas and other SSL-enabled MongoDB instances)
    MONGODB_SSL_ENABLED: bool = os.getenv("MONGODB_SSL_ENABLED", "true").lower() == "true"
    MONGODB_SSL_INSECURE: bool = os.getenv("MONGODB_SSL_INSECURE", "true").lower() == "true"  # For development
    
    # Environment detection
    IS_CLOUD_RUN: bool = os.getenv("K_SERVICE") is not None

    # OpenAI API settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "2048"))
    OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "60"))

    # Added for the new config
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # Authentication settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "24"))
    
    # Cookie settings
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"  # Set to true in production with HTTPS
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")  # lax, strict, none
    COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")  # Set for cross-subdomain cookies
    
    # Google OAuth2 settings
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    # File upload settings
    MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", str(500 * 1024 * 1024)))  # 500MB default
    LARGE_FILE_THRESHOLD_BYTES = int(os.getenv("LARGE_FILE_THRESHOLD_BYTES", str(100 * 1024 * 1024)))  # 100MB threshold

config = Config() 