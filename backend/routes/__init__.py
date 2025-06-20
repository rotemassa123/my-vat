"""
Routes package for the upload server.

This package contains all API routes organized by functionality:
- upload_routes: File upload operations from Google Drive to GCS
- health_routes: Health checks and service status endpoints
- process_routes: AI processing operations
- user_routes: User management and authentication
- entity_routes: Entity (sub-account) management
"""

from .upload_routes import upload_router
from .health_routes import health_router
from .process_routes import process_router
from .user_routes import router as user_router
from .entity_routes import router as entity_router

__all__ = [
    "upload_router",
    "health_router",
    "process_router",
    "user_router",
    "entity_router",
] 