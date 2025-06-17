"""
Health check routes for monitoring service status.
"""

import logging
from fastapi import APIRouter

from models import HealthResponse
from services.drive_service import DriveService
from services.mongo_service import MongoService
from services.openai_service import OpenAIService
from config import config

logger = logging.getLogger(__name__)

# Create router
health_router = APIRouter()

# Global variables (will be set by main app)
drive_service: DriveService = None
storage_client = None
mongo_service: MongoService = None
openai_service: OpenAIService = None


@health_router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic health check",
    description="Check the health status of all core services.",
    response_description="Service health status information",
    tags=["Health"]
)
async def health_check():
    """Basic health check endpoint."""
    try:
        # Check GCS client
        gcs_status = "connected" if storage_client else "not_initialized"
        
        # Check Drive service
        drive_status = "connected" if drive_service and drive_service.authenticated else "not_authenticated"
        
        # Check MongoDB
        mongo_status = "connected" if mongo_service and mongo_service.is_connected else "not_connected"
        
        # Check OpenAI service
        openai_status = "connected" if openai_service and openai_service.authenticated else "not_authenticated"
        
        return HealthResponse(
            status="healthy",
            gcs_client=gcs_status,
            drive_client=drive_status,
            mongodb_client=mongo_status,
            openai_client=openai_status,
            max_file_size_mb=config.MAX_FILE_SIZE_MB,
            max_workers=config.MAX_WORKERS
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            gcs_client="error",
            drive_client="error",
            mongodb_client="error",
            openai_client="error",
            max_file_size_mb=config.MAX_FILE_SIZE_MB,
            max_workers=config.MAX_WORKERS
        )


@health_router.get(
    "/health/mongodb",
    summary="MongoDB health check",
    description="Detailed MongoDB connection and database health check.",
    response_description="MongoDB health status and statistics",
    tags=["Health"]
)
async def mongodb_health():
    """Detailed MongoDB health check endpoint."""
    if not mongo_service:
        return {
            "status": "not_initialized",
            "error": "MongoDB service not initialized"
        }
    
    try:
        return await mongo_service.health_check()
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@health_router.get(
    "/health/drive",
    summary="Google Drive authentication check",
    description="Check Google Drive service authentication status and user information.",
    response_description="Drive authentication status and user details",
    tags=["Health"]
)
async def drive_auth_check():
    """Check Google Drive authentication status."""
    try:
        if not drive_service:
            return {
                "authenticated": False,
                "error": "Drive service not initialized"
            }
        
        user_info = drive_service.get_user_info()
        
        if user_info.get('authenticated'):
            return {
                "authenticated": True,
                "user_email": user_info.get('user_email', 'Service Account'),
                "auth_type": user_info.get('auth_type', 'service_account')
            }
        else:
            return {
                "authenticated": False,
                "error": user_info.get('error', 'Authentication failed')
            }
            
    except Exception as e:
        logger.error(f"Error checking drive authentication: {e}")
        return {
            "authenticated": False,
            "error": f"Authentication check failed: {str(e)}"
        }


@health_router.get(
    "/health/openai",
    summary="OpenAI service health check",
    description="Check OpenAI service status and configuration.",
    response_description="OpenAI service status and configuration details",
    tags=["Health"]
)
async def openai_health_check():
    """Check OpenAI service health and configuration."""
    try:
        if not openai_service:
            return {
                "status": "not_initialized",
                "error": "OpenAI service not initialized"
            }
        
        status = openai_service.get_client_status()
        return {
            "status": "healthy" if status["authenticated"] else "not_authenticated",
            "client_status": status
        }
        
    except Exception as e:
        logger.error(f"OpenAI health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        } 