"""
Routes package for the upload server.

This package contains all API routes organized by functionality:
- upload_routes: File upload operations from Google Drive to GCS
- health_routes: Health checks and service status endpoints
"""

from .upload_routes import upload_router
from .health_routes import health_router
from .process_routes import process_router

__all__ = [
    "upload_router",
    "health_router",
    "process_router",
] 