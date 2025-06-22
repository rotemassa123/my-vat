"""
Data models for the upload server - Google Drive to GCS.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, EmailStr


class UploadRequest(BaseModel):
    """Request model for file upload endpoint."""
    drive_folder_name: str = Field(
        ..., 
        description="Name of the Google Drive folder to scan", 
        example="test-myvat"
    )
    account_id: int = Field(
        ..., 
        description="Unique identifier for the account", 
        example=123
    )
    include_subfolders: bool = Field(
        True, 
        description="Whether to include files in subfolders", 
        example=False
    )


class UploadProcessRequest(BaseModel):
    """Request model for processing ready uploads from MongoDB."""
    account_id: int = Field(
        ..., 
        description="Account ID to process uploads for", 
        example=123
    )


class DriveFileInfo(BaseModel):
    """Information about a Google Drive file."""
    id: str = Field(..., description="Google Drive file ID")
    name: str = Field(..., description="File name")
    size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")


class UploadResult(BaseModel):
    """Result of upload operation."""
    total_files_found: int = Field(..., description="Total number of files found for upload")
    eligible_files: int = Field(..., description="Number of files eligible for upload")
    successful_uploads: int = Field(..., description="Number of successful uploads")
    failed_uploads: int = Field(..., description="Number of failed uploads")
    processing_time_seconds: float = Field(..., description="Total processing time in seconds")
    upload_details: List[dict] = Field(..., description="Detailed results for each file")


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    gcs_client: str
    drive_client: str
    mongodb_client: str
    openai_client: str
    max_file_size_mb: float
    max_workers: int


# OpenAI Processing Models
class ProcessRequest(BaseModel):
    """Request model for OpenAI processing operations."""
    account_id: int = Field(
        ..., 
        description="Account ID to process files for", 
        example=123
    )


class ChatRequest(BaseModel):
    """Request model for OpenAI chat completion."""
    message: str = Field(
        ...,
        description="User message for chat completion",
        example="Analyze this invoice data"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Conversation ID for maintaining context"
    )
    system_prompt: Optional[str] = Field(
        None,
        description="Custom system prompt"
    )
    account_id: int = Field(
        ...,
        description="Account ID",
        example=123
    )


class FileAnalysisRequest(BaseModel):
    """Request model for file analysis with OpenAI."""
    file_id: str = Field(
        ...,
        description="MongoDB file ID to analyze"
    )
    analysis_type: str = Field(
        ...,
        description="Type of analysis to perform",
        example="invoice_extraction"
    )
    account_id: int = Field(
        ...,
        description="Account ID",
        example=123
    )


class ProcessResult(BaseModel):
    """Result of OpenAI processing operation."""
    success: bool = Field(..., description="Whether processing was successful")
    processed_files: int = Field(..., description="Number of files processed")
    failed_files: int = Field(..., description="Number of files that failed processing")
    processing_time_seconds: float = Field(..., description="Total processing time")
    results: List[Dict[str, Any]] = Field(..., description="Detailed processing results")
    total_tokens_used: int = Field(..., description="Total OpenAI tokens consumed")
    total_cost_usd: float = Field(..., description="Estimated cost in USD")


class ChatResponse(BaseModel):
    """Response model for chat completion."""
    response: str = Field(..., description="OpenAI response message")
    conversation_id: str = Field(..., description="Conversation ID for context")
    tokens_used: int = Field(..., description="Tokens used in this request")
    cost_usd: float = Field(..., description="Estimated cost for this request")
    model_used: str = Field(..., description="OpenAI model used")


class FileAnalysisResult(BaseModel):
    """Result of file analysis."""
    file_id: str = Field(..., description="File ID that was analyzed")
    file_name: str = Field(..., description="Original file name")
    analysis_type: str = Field(..., description="Type of analysis performed")
    success: bool = Field(..., description="Whether analysis was successful")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted data from the file")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    tokens_used: int = Field(..., description="Tokens used for this analysis")
    cost_usd: float = Field(..., description="Estimated cost for this analysis")
    processing_time_seconds: float = Field(..., description="Processing time")
    error_message: Optional[str] = Field(None, description="Error message if failed")


# Authentication Models
class LoginRequest(BaseModel):
    """Request model for email/password login."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str
    name: str
    company_name: Optional[str] = None


class AuthResponse(BaseModel):
    """Response model for successful authentication."""
    account_id: str
    email: str
    name: str
    permissions: List[str]
    auth_providers: List[str]
    message: str = "Authentication successful"


class GoogleAuthRequest(BaseModel):
    """Request model for Google OAuth callback."""
    code: str
    state: Optional[str] = None 