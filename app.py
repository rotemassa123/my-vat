"""
Main FastAPI application for Google Drive to Google Cloud Storage upload server.
"""
import logging
from fastapi import FastAPI
from google.cloud import storage

from config import config
from models import *
from services import FileUploadService, DriveService, OpenAIService
from services.mongo_service import mongo_service
from services.openai_service import openai_service
from routes import upload_router, health_router, process_router
import routes.upload_routes as upload_routes_module
import routes.health_routes as health_routes_module
import routes.process_routes as process_routes_module

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    try:
        logger.info("Starting FastAPI application...")
        
        # Initialize Google Cloud Storage client
        storage_client = storage.Client()
        logger.info("Google Cloud Storage client initialized")
        
        # Initialize Drive service
        credentials_file = config.GOOGLE_APPLICATION_CREDENTIALS
        if not credentials_file:
            logger.warning("Google credentials not configured - Drive service will be unavailable")
            drive_service_instance = None
        else:
            from services.drive_service import create_drive_service
            drive_service_instance = create_drive_service(credentials_file)
            if drive_service_instance and drive_service_instance.authenticated:
                logger.info("Google Drive service initialized and authenticated")
            else:
                logger.warning("Google Drive service failed to authenticate")
        
        # Initialize MongoDB connection
        await mongo_service.connect()
        logger.info("MongoDB service connected")
        
        # Initialize file upload service
        upload_service_instance = FileUploadService()
        logger.info("File upload service initialized")
        
        # Check OpenAI service status
        if openai_service.authenticated:
            logger.info("OpenAI service initialized and authenticated")
        else:
            logger.warning("OpenAI service not authenticated - AI processing will be unavailable")
            if not config.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not configured")
            else:
                logger.warning("OpenAI authentication failed despite API key being configured")
        
        # Set global service references in route modules
        upload_routes_module.upload_service = upload_service_instance
        upload_routes_module.drive_service = drive_service_instance
        upload_routes_module.storage_client = storage_client
        upload_routes_module.mongo_service = mongo_service
        
        health_routes_module.drive_service = drive_service_instance
        health_routes_module.storage_client = storage_client
        health_routes_module.mongo_service = mongo_service
        health_routes_module.openai_service = openai_service
        
        # Set global service references for process routes
        process_routes_module.openai_service = openai_service
        process_routes_module.mongo_service = mongo_service
        
        logger.info("All services initialized successfully")
        
        yield
        
    finally:
        # Cleanup
        logger.info("Shutting down FastAPI application...")
        
        # Disconnect from MongoDB
        await mongo_service.disconnect()
        logger.info("FastAPI server stopped and resources cleaned up")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        lifespan=lifespan,
        title="Drive to Cloud Storage API", 
        description="Upload files from Google Drive to Google Cloud Storage with AI processing",
        version="2.0.0"
    )
    
    # Include routers
    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(upload_router, prefix="/api", tags=["Upload"])
    app.include_router(process_router, prefix="/api", tags=["AI Processing"])
    
    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT) 