"""
MongoDB document models using Beanie ODM for upload tracking and file operations.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import Document, Indexed
from pydantic import Field


class Invoice(Document):
    """Document to track files processed for upload."""
    
    # File identification
    name: str = Field(..., description="File name")
    source_id: str = Field(..., description="Source file ID (Google Drive ID)")
    size: int = Field(..., description="File size in bytes")
    
    # Processing info
    last_executed_step: int = Field(default=1, description="Last processing step executed")
    source: str = Field(default="google_drive", description="Source of the file")
    
    # Account info
    account_id: Indexed(int) = Field(..., description="Account ID")
    
    # File metadata
    content_type: Optional[str] = Field(default=None, description="MIME type of the file")
    
    # Optional status fields (for rejected files)
    status: Optional[str] = Field(default=None, description="File status (e.g., 'rejected', 'failed to upload')")
    reason: Optional[str] = Field(default=None, description="Reason for status (e.g., 'too big', 'failed to download')")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "invoices"
        indexes = [
            "account_id",
            "source_id",
            "source",
            "status",
            "created_at"
        ]


class UploadSession(Document):
    """Document to track file upload sessions."""
    
    # Session identification
    session_id: str = Field(..., description="Unique session identifier")
    account_id: Indexed(int) = Field(..., description="Account ID for the upload")
    drive_folder_name: str = Field(..., description="Google Drive folder name")
    
    # Session configuration
    include_subfolders: bool = Field(default=True, description="Whether subfolders were included")
    
    # Session status and metrics
    status: str = Field(default="started", description="Session status: started, processing, completed, failed")
    total_files_found: int = Field(default=0, description="Total files found in Drive folder")
    eligible_files: int = Field(default=0, description="Files eligible for upload")
    successful_uploads: int = Field(default=0, description="Successfully uploaded files")
    failed_uploads: int = Field(default=0, description="Failed upload attempts")
    processing_time_seconds: Optional[float] = Field(default=None, description="Total processing time")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = Field(default=None, description="When processing started")
    completed_at: Optional[datetime] = Field(default=None, description="When processing completed")
    
    # Error tracking
    error_message: Optional[str] = Field(default=None, description="Error message if session failed")
    
    class Settings:
        name = "upload_sessions"
        indexes = [
            "account_id",
            "session_id", 
            "created_at",
            "status"
        ]


class FileUploadRecord(Document):
    """Document to track individual file upload operations."""
    
    # File identification
    drive_file_id: str = Field(..., description="Google Drive file ID")
    drive_file_name: str = Field(..., description="Original file name in Drive")
    drive_file_path: str = Field(..., description="Full path in Drive folder structure")
    
    # Session reference
    session_id: Indexed(str) = Field(..., description="Reference to upload session")
    account_id: Indexed(int) = Field(..., description="Account ID")
    
    # File metadata
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="File MIME type")
    
    # Upload details
    gcs_bucket: str = Field(..., description="GCS bucket name")
    gcs_object_name: str = Field(..., description="GCS object path/name")
    
    # Status tracking
    status: str = Field(default="pending", description="Upload status: pending, uploading, completed, failed")
    upload_started_at: Optional[datetime] = Field(default=None)
    upload_completed_at: Optional[datetime] = Field(default=None)
    
    # Error tracking
    error_message: Optional[str] = Field(default=None, description="Error message if upload failed")
    retry_count: int = Field(default=0, description="Number of retry attempts")
    
    # Performance metrics
    upload_duration_seconds: Optional[float] = Field(default=None)
    upload_speed_mbps: Optional[float] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "file_upload_records"
        indexes = [
            "session_id",
            "account_id",
            "drive_file_id",
            "status",
            "created_at",
            "gcs_bucket"
        ]


class DriveFolder(Document):
    """Document to cache Google Drive folder information."""
    
    # Folder identification
    drive_folder_id: str = Field(..., description="Google Drive folder ID")
    folder_name: Indexed(str) = Field(..., description="Folder name")
    folder_path: str = Field(..., description="Full folder path")
    account_id: Indexed(int) = Field(..., description="Account ID that has access")
    
    # Folder metadata
    parent_folder_id: Optional[str] = Field(default=None, description="Parent folder ID")
    file_count: int = Field(default=0, description="Number of files in folder")
    total_size: int = Field(default=0, description="Total size of files in bytes")
    
    # Cache management
    last_scanned_at: Optional[datetime] = Field(default=None, description="Last time folder was scanned")
    is_active: bool = Field(default=True, description="Whether folder is still accessible")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "drive_folders"
        indexes = [
            "account_id",
            "folder_name",
            "drive_folder_id",
            "last_scanned_at"
        ]


class SystemMetrics(Document):
    """Document to track system performance and usage metrics."""
    
    # Metric identification
    metric_type: str = Field(..., description="Type of metric: upload_performance, error_rate, etc.")
    account_id: Optional[int] = Field(default=None, description="Account ID if metric is account-specific")
    
    # Metric data
    value: float = Field(..., description="Metric value")
    unit: str = Field(..., description="Unit of measurement")
    tags: Dict[str, Any] = Field(default_factory=dict, description="Additional metric tags")
    
    # Timestamp
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "system_metrics"
        indexes = [
            "metric_type",
            "account_id", 
            "timestamp"
        ]


# OpenAI Processing Models
class ProcessingJob(Document):
    """Document to track OpenAI processing jobs."""
    
    # Job identification
    job_id: str = Field(..., description="Unique job identifier")
    account_id: Indexed(int) = Field(..., description="Account ID")
    task_type: str = Field(..., description="Type of processing task")
    
    # Job configuration
    file_ids: List[str] = Field(..., description="List of file IDs to process")
    custom_prompt: Optional[str] = Field(default=None, description="Custom prompt used")
    model_used: str = Field(..., description="OpenAI model used")
    
    # Job status
    status: str = Field(
        default="pending", 
        description="Job status: pending, processing, completed, failed"
    )
    progress: int = Field(default=0, description="Progress percentage (0-100)")
    
    # Results
    processed_files: int = Field(default=0, description="Number of files processed")
    failed_files: int = Field(default=0, description="Number of files that failed")
    total_tokens_used: int = Field(default=0, description="Total tokens consumed")
    total_cost_usd: float = Field(default=0.0, description="Total cost in USD")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = Field(default=None, description="When processing started")
    completed_at: Optional[datetime] = Field(default=None, description="When processing completed")
    processing_time_seconds: Optional[float] = Field(default=None, description="Total processing time")
    
    # Error tracking
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    
    class Settings:
        name = "processing_jobs"
        indexes = [
            "account_id",
            "job_id",
            "status",
            "task_type",
            "created_at"
        ]


class FileAnalysis(Document):
    """Document to store OpenAI analysis results for individual files."""
    
    # File identification
    file_id: str = Field(..., description="Reference to file ID (Invoice ObjectId)")
    file_name: str = Field(..., description="Original file name")
    account_id: Indexed(int) = Field(..., description="Account ID")
    
    # Analysis details
    analysis_type: str = Field(..., description="Type of analysis performed")
    job_id: Optional[str] = Field(default=None, description="Reference to processing job")
    
    # OpenAI interaction
    model_used: str = Field(..., description="OpenAI model used")
    prompt_used: str = Field(..., description="Prompt sent to OpenAI")
    tokens_used: int = Field(..., description="Tokens consumed")
    cost_usd: float = Field(..., description="Cost for this analysis")
    
    # Results
    success: bool = Field(..., description="Whether analysis was successful")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted data")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_time_seconds: float = Field(..., description="Processing time")
    
    # Error tracking
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    
    class Settings:
        name = "file_analyses"
        indexes = [
            "account_id",
            "file_id",
            "analysis_type",
            "job_id",
            "created_at",
            "success"
        ]


class Conversation(Document):
    """Document to store OpenAI conversation history."""
    
    # Conversation identification
    conversation_id: str = Field(..., description="Unique conversation identifier")
    account_id: Indexed(int) = Field(..., description="Account ID")
    
    # Conversation metadata
    title: Optional[str] = Field(default=None, description="Conversation title")
    system_prompt: Optional[str] = Field(default=None, description="System prompt used")
    
    # Messages in the conversation
    messages: List[Dict[str, Any]] = Field(
        default_factory=list, 
        description="List of messages in conversation"
    )
    
    # Usage tracking
    total_tokens_used: int = Field(default=0, description="Total tokens used in conversation")
    total_cost_usd: float = Field(default=0.0, description="Total cost for conversation")
    message_count: int = Field(default=0, description="Number of messages in conversation")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_message_at: Optional[datetime] = Field(default=None, description="Timestamp of last message")
    
    class Settings:
        name = "conversations"
        indexes = [
            "account_id",
            "conversation_id",
            "created_at",
            "updated_at"
        ]


class Summary(Document):
    """Document to store OpenAI-generated summaries for invoices."""
    
    # File identification
    file_id: str = Field(..., description="Reference to file ID (Invoice ObjectId)")
    file_name: str = Field(..., description="Original file name")
    account_id: Indexed(int) = Field(..., description="Account ID")
    
    # Processing info
    processing_job_id: Optional[str] = Field(default=None, description="Reference to processing job if applicable")
    
    # OpenAI interaction
    model_used: str = Field(..., description="OpenAI model used")
    tokens_used: int = Field(..., description="Tokens consumed")
    cost_usd: float = Field(..., description="Cost for this summary")
    
    # Summary results
    is_invoice: bool = Field(..., description="Whether content was determined to be an invoice")
    summary_content: str = Field(..., description="Raw response from OpenAI")
    
    # Extracted invoice data (if applicable)
    extracted_data: Optional[Dict[str, Any]] = Field(default=None, description="Parsed invoice data as JSON")
    
    # Processing metadata
    processing_time_seconds: float = Field(..., description="Processing time")
    success: bool = Field(..., description="Whether processing was successful")
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "summaries"
        indexes = [
            "account_id",
            "file_id",
            "is_invoice",
            "created_at"
        ] 