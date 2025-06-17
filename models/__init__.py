"""
Models package for the upload to cloud application.
"""

# Import API models (always required)
from .api_models import (
    UploadRequest,
    UploadProcessRequest,
    DriveFileInfo,
    UploadResult,
    HealthResponse,
    # OpenAI Processing Models
    ProcessRequest,
    ChatRequest,
    FileAnalysisRequest,
    ProcessResult,
    ChatResponse,
    FileAnalysisResult
)

# MongoDB models (optional - import only if available)
try:
    from .mongo_models import (
        Invoice,
        UploadSession,
        FileUploadRecord,
        DriveFolder,
        SystemMetrics,
        # OpenAI Processing Models
        ProcessingJob,
        FileAnalysis,
        Conversation,
        Summary
    )
    
    # If successful, export all models
    __all__ = [
        # API models
        'UploadRequest',
        'UploadProcessRequest',
        'DriveFileInfo', 
        'UploadResult',
        'HealthResponse',
        # OpenAI API models
        'ProcessRequest',
        'ChatRequest',
        'FileAnalysisRequest',
        'ProcessResult',
        'ChatResponse',
        'FileAnalysisResult',
        # MongoDB models
        'Invoice',
        'UploadSession',
        'FileUploadRecord',
        'DriveFolder', 
        'SystemMetrics',
        # OpenAI MongoDB models
        'ProcessingJob',
        'FileAnalysis',
        'Conversation',
        'Summary'
    ]
    
except ImportError as e:
    # MongoDB dependencies not available, only export API models
    __all__ = [
        # API models only
        'UploadRequest',
        'UploadProcessRequest',
        'DriveFileInfo', 
        'UploadResult',
        'HealthResponse',
        # OpenAI API models
        'ProcessRequest',
        'ChatRequest',
        'FileAnalysisRequest',
        'ProcessResult',
        'ChatResponse',
        'FileAnalysisResult'
    ]
    
    print(f"Warning: MongoDB models not available: {e}")
    print("The application will work without MongoDB functionality.")

from .enums import FileProcessingStep

__all__ = [
    # API Models
    "UploadRequest",
    "UploadProcessRequest", 
    "DriveFileInfo",
    "UploadResult",
    "HealthResponse",
    "ProcessRequest",
    "ChatRequest", 
    "FileAnalysisRequest",
    "ProcessResult",
    "ChatResponse",
    "FileAnalysisResult",
    # MongoDB models
    "Invoice",
    "ProcessingJob",
    "FileAnalysis", 
    "Conversation",
    "Summary",
    # Enums
    "FileProcessingStep"
] 