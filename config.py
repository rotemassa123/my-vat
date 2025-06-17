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

config = Config() 