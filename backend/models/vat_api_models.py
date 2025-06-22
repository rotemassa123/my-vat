"""
Enhanced API models for VAT processing system with CRUD operations.
"""
from typing import List, Dict, Any, Optional, Union, TypeVar, Generic
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

# Generic type for API responses
T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper."""
    data: T = Field(..., description="Response data")
    message: Optional[str] = Field(None, description="Response message")
    status: str = Field(default="success", description="Response status")


class AccountType(str, Enum):
    """Account type enumeration."""
    INDIVIDUAL = "individual"
    COMPANY = "company"
    ORGANIZATION = "organization"


class AccountStatus(str, Enum):
    """Account status enumeration."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class InvoiceStatus(str, Enum):
    """Invoice status enumeration."""
    ACTIVE = "active"
    FAILED = "failed"
    REJECTED = "rejected"
    PROCESSED = "processed"


# Account API Models
class AccountCreateRequest(BaseModel):
    """Request model for creating an account."""
    email: EmailStr = Field(..., description="Primary email address")
    name: str = Field(..., description="Account holder name or company name")
    account_type: AccountType = Field(default=AccountType.INDIVIDUAL, description="Account type")
    company_name: Optional[str] = Field(None, description="Legal company name")
    tax_id: Optional[str] = Field(None, description="Tax identification number")
    vat_number: Optional[str] = Field(None, description="VAT registration number")
    registration_number: Optional[str] = Field(None, description="Company registration number")
    address: Optional[Dict[str, str]] = Field(None, description="Address information")
    phone: Optional[str] = Field(None, description="Phone number")
    website: Optional[str] = Field(None, description="Company website")
    vat_settings: Optional[Dict[str, Any]] = Field(None, description="VAT processing configuration")


class AccountUpdateRequest(BaseModel):
    """Request model for updating an account."""
    name: Optional[str] = Field(None, description="Account holder name or company name")
    company_name: Optional[str] = Field(None, description="Legal company name")
    tax_id: Optional[str] = Field(None, description="Tax identification number")
    vat_number: Optional[str] = Field(None, description="VAT registration number")
    registration_number: Optional[str] = Field(None, description="Company registration number")
    address: Optional[Dict[str, str]] = Field(None, description="Address information")
    phone: Optional[str] = Field(None, description="Phone number")
    website: Optional[str] = Field(None, description="Company website")
    vat_settings: Optional[Dict[str, Any]] = Field(None, description="VAT processing configuration")
    monthly_upload_limit_mb: Optional[int] = Field(None, description="Monthly upload limit in MB")


class AccountResponse(BaseModel):
    """Response model for account operations."""
    id: str = Field(..., description="Account ID")
    email: EmailStr = Field(..., description="Primary email address")
    name: str = Field(..., description="Account holder name or company name")
    account_type: str = Field(..., description="Account type")
    status: str = Field(..., description="Account status")
    company_name: Optional[str] = Field(None, description="Legal company name")
    vat_number: Optional[str] = Field(None, description="VAT registration number")
    address: Optional[Dict[str, str]] = Field(None, description="Address information")
    vat_settings: Optional[Dict[str, Any]] = Field(None, description="VAT processing configuration")
    monthly_upload_limit_mb: int = Field(..., description="Monthly upload limit in MB")
    current_month_usage_mb: int = Field(..., description="Current month usage in MB")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")


# Invoice API Models
class InvoiceCreateRequest(BaseModel):
    """Request model for creating an invoice."""
    name: str = Field(..., description="File name")
    source_id: str = Field(..., description="Source file ID")
    size: int = Field(..., description="File size in bytes")
    account_id: int = Field(..., description="Account ID")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    source: str = Field(default="google_drive", description="Source of the file")


class InvoiceUpdateRequest(BaseModel):
    """Request model for updating an invoice."""
    name: Optional[str] = Field(None, description="File name")
    status: Optional[str] = Field(None, description="File status")
    reason: Optional[str] = Field(None, description="Reason for status change")
    last_executed_step: Optional[int] = Field(None, description="Last processing step executed")
    content_type: Optional[str] = Field(None, description="MIME type of the file")


class InvoiceBatchCreateRequest(BaseModel):
    """Request model for batch creating invoices."""
    invoices: List[InvoiceCreateRequest] = Field(..., description="List of invoices to create")


class InvoiceBatchUpdateRequest(BaseModel):
    """Request model for batch updating invoices."""
    updates: List[Dict[str, Any]] = Field(..., description="List of invoice updates")


class InvoiceFilterRequest(BaseModel):
    """Request model for filtering invoices."""
    status: Optional[str] = Field(None, description="Filter by status")
    date_from: Optional[datetime] = Field(None, description="Filter by date from")
    date_to: Optional[datetime] = Field(None, description="Filter by date to")
    source: Optional[str] = Field(None, description="Filter by source")
    min_size: Optional[int] = Field(None, description="Minimum file size")
    max_size: Optional[int] = Field(None, description="Maximum file size")
    step: Optional[int] = Field(None, description="Filter by processing step")
    content_type: Optional[str] = Field(None, description="Filter by content type")
    name_contains: Optional[str] = Field(None, description="Search in file names")
    limit: int = Field(default=100, description="Page size", ge=1, le=1000)
    skip: int = Field(default=0, description="Number of records to skip", ge=0)
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: int = Field(default=-1, description="Sort order: 1 for ascending, -1 for descending")


class InvoiceResponse(BaseModel):
    """Response model for invoice operations."""
    id: str = Field(..., description="Invoice ID")
    file_name: str = Field(..., description="File name")
    file_size: int = Field(..., description="File size in bytes")
    upload_date: str = Field(..., description="Upload date")
    account_id: str = Field(..., description="Account ID")
    source: str = Field(..., description="Source of the file")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    status: Optional[str] = Field(None, description="File status")
    
    # VAT related fields
    invoice_number: Optional[str] = Field(None, description="Invoice number")
    supplier_name: Optional[str] = Field(None, description="Supplier name")
    supplier_vat_number: Optional[str] = Field(None, description="Supplier VAT number")
    invoice_date: Optional[str] = Field(None, description="Invoice date")
    currency: Optional[str] = Field(None, description="Currency")
    net_amount: Optional[float] = Field(None, description="Net amount")
    vat_amount: Optional[float] = Field(None, description="VAT amount")
    total_amount: Optional[float] = Field(None, description="Total amount")
    vat_rate: Optional[float] = Field(None, description="VAT rate")
    vat_scheme: Optional[str] = Field(None, description="VAT scheme")
    
    # Claim related fields
    claimant: Optional[str] = Field(None, description="Claimant name")
    submitted_date: Optional[str] = Field(None, description="Submission date")
    claim_amount: Optional[float] = Field(None, description="Claim amount")
    refund_amount: Optional[float] = Field(None, description="Refund amount")
    
    # Processing fields
    processed_at: Optional[str] = Field(None, description="Processing timestamp")
    error_message: Optional[str] = Field(None, description="Error message")
    
    # Metadata
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Update timestamp")


# Summary API Models
class SummaryCreateRequest(BaseModel):
    """Request model for creating a summary."""
    file_id: str = Field(..., description="Reference to file ID")
    file_name: str = Field(..., description="Original file name")
    account_id: int = Field(..., description="Account ID")
    model_used: str = Field(..., description="OpenAI model used")
    tokens_used: int = Field(..., description="Tokens consumed")
    cost_usd: float = Field(..., description="Cost for this summary")
    is_invoice: bool = Field(..., description="Whether content was determined to be an invoice")
    summary_content: str = Field(..., description="Raw response from OpenAI")
    extracted_data: Optional[Dict[str, Any]] = Field(None, description="Parsed invoice data as JSON")
    processing_time_seconds: float = Field(..., description="Processing time")
    success: bool = Field(default=True, description="Whether processing was successful")
    processing_job_id: Optional[str] = Field(None, description="Reference to processing job")


class SummaryUpdateRequest(BaseModel):
    """Request model for updating a summary."""
    summary_content: Optional[str] = Field(None, description="Raw response from OpenAI")
    extracted_data: Optional[Dict[str, Any]] = Field(None, description="Parsed invoice data as JSON")
    success: Optional[bool] = Field(None, description="Whether processing was successful")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class SummaryBatchCreateRequest(BaseModel):
    """Request model for batch creating summaries."""
    summaries: List[SummaryCreateRequest] = Field(..., description="List of summaries to create")


class SummaryFilterRequest(BaseModel):
    """Request model for filtering summaries."""
    is_invoice: Optional[bool] = Field(None, description="Filter by invoice type")
    date_from: Optional[datetime] = Field(None, description="Filter by date from")
    date_to: Optional[datetime] = Field(None, description="Filter by date to")
    success: Optional[bool] = Field(None, description="Filter by success status")
    model_used: Optional[str] = Field(None, description="Filter by model used")
    min_cost: Optional[float] = Field(None, description="Minimum cost")
    max_cost: Optional[float] = Field(None, description="Maximum cost")
    min_tokens: Optional[int] = Field(None, description="Minimum tokens used")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens used")
    file_name_contains: Optional[str] = Field(None, description="Search in file names")
    content_contains: Optional[str] = Field(None, description="Search in summary content")
    limit: int = Field(default=100, description="Page size", ge=1, le=1000)
    skip: int = Field(default=0, description="Number of records to skip", ge=0)
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: int = Field(default=-1, description="Sort order: 1 for ascending, -1 for descending")


class SummaryResponse(BaseModel):
    """Response model for summary operations."""
    id: str = Field(..., description="Summary ID")
    file_id: str = Field(..., description="Reference to file ID")
    file_name: str = Field(..., description="Original file name")
    account_id: int = Field(..., description="Account ID")
    model_used: str = Field(..., description="OpenAI model used")
    tokens_used: int = Field(..., description="Tokens consumed")
    cost_usd: float = Field(..., description="Cost for this summary")
    is_invoice: bool = Field(..., description="Whether content was determined to be an invoice")
    summary_content: str = Field(..., description="Raw response from OpenAI")
    extracted_data: Optional[Dict[str, Any]] = Field(None, description="Parsed invoice data as JSON")
    processing_time_seconds: float = Field(..., description="Processing time")
    success: bool = Field(..., description="Whether processing was successful")
    created_at: datetime = Field(..., description="Creation timestamp")


# File Upload Models
class LargeFileUploadRequest(BaseModel):
    """Request model for large file uploads."""
    filename: str = Field(..., description="Name of the file")
    content_type: str = Field(..., description="MIME type of the file")
    size: int = Field(..., description="File size in bytes")
    account_id: int = Field(..., description="Account ID")
    chunk_size: int = Field(default=5242880, description="Chunk size in bytes (5MB default)")


class FileUploadChunkRequest(BaseModel):
    """Request model for file chunk uploads."""
    upload_id: str = Field(..., description="Upload session ID")
    chunk_number: int = Field(..., description="Chunk number (0-based)")
    is_final_chunk: bool = Field(default=False, description="Whether this is the final chunk")


class FileUploadResponse(BaseModel):
    """Response model for file upload operations."""
    upload_id: str = Field(..., description="Upload session ID")
    filename: str = Field(..., description="Name of the file")
    total_chunks: int = Field(..., description="Total number of chunks")
    uploaded_chunks: int = Field(..., description="Number of uploaded chunks")
    completed: bool = Field(..., description="Whether upload is completed")
    file_url: Optional[str] = Field(None, description="URL of the uploaded file")


# Authentication Models
class LoginRequest(BaseModel):
    """Request model for login."""
    provider: str = Field(default="google", description="Authentication provider")


class LoginResponse(BaseModel):
    """Response model for login."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    account: AccountResponse = Field(..., description="Account information")


class LogoutRequest(BaseModel):
    """Request model for logout."""
    session_token: Optional[str] = Field(None, description="Session token to logout")


# Paginated Response Models
class PaginatedInvoiceResponse(BaseModel):
    """Paginated response for invoices."""
    items: List[InvoiceResponse] = Field(..., description="List of invoices")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Page size")
    total: int = Field(..., description="Total number of invoices")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there's a next page")
    has_prev: bool = Field(..., description="Whether there's a previous page")


class PaginatedSummaryResponse(BaseModel):
    """Paginated response for summaries."""
    summaries: List[SummaryResponse] = Field(..., description="List of summaries")
    total_count: int = Field(..., description="Total number of summaries")
    page_size: int = Field(..., description="Page size")
    current_page: int = Field(..., description="Current page number")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there's a next page")
    has_previous: bool = Field(..., description="Whether there's a previous page")


class PaginatedAccountResponse(BaseModel):
    """Paginated response for accounts."""
    accounts: List[AccountResponse] = Field(..., description="List of accounts")
    total_count: int = Field(..., description="Total number of accounts")
    page_size: int = Field(..., description="Page size")
    current_page: int = Field(..., description="Current page number")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there's a next page")
    has_previous: bool = Field(..., description="Whether there's a previous page")


# Statistics Models
class InvoiceStatisticsResponse(BaseModel):
    """Response model for invoice statistics."""
    total_count: int = Field(..., description="Total number of invoices")
    total_size_bytes: int = Field(..., description="Total size in bytes")
    total_size_mb: float = Field(..., description="Total size in MB")
    status_breakdown: Dict[str, int] = Field(..., description="Count by status")
    step_breakdown: Dict[str, int] = Field(..., description="Count by processing step")
    source_breakdown: Dict[str, int] = Field(..., description="Count by source")
    average_file_size_mb: float = Field(..., description="Average file size in MB")


class SummaryStatisticsResponse(BaseModel):
    """Response model for summary statistics."""
    total_count: int = Field(..., description="Total number of summaries")
    total_cost_usd: float = Field(..., description="Total cost in USD")
    total_tokens_used: int = Field(..., description="Total tokens used")
    success_rate_percent: float = Field(..., description="Success rate percentage")
    invoice_detection_rate_percent: float = Field(..., description="Invoice detection rate percentage")
    model_usage_breakdown: Dict[str, int] = Field(..., description="Count by model used")
    average_processing_time_seconds: float = Field(..., description="Average processing time")
    average_cost_per_summary: float = Field(..., description="Average cost per summary")
    average_tokens_per_summary: float = Field(..., description="Average tokens per summary")


class AccountStatisticsResponse(BaseModel):
    """Response model for account statistics."""
    total_accounts: int = Field(..., description="Total number of accounts")
    status_breakdown: Dict[str, int] = Field(..., description="Count by account status")
    account_type_breakdown: Dict[str, int] = Field(..., description="Count by account type")
    verification_rate_percent: float = Field(..., description="Email verification rate percentage")
    google_auth_rate_percent: float = Field(..., description="Google authentication rate percentage")
    total_monthly_usage_mb: int = Field(..., description="Total monthly usage in MB")
    average_monthly_usage_mb: float = Field(..., description="Average monthly usage per account")


# Batch Operation Models
class BatchOperationResponse(BaseModel):
    """Response model for batch operations."""
    success: bool = Field(..., description="Whether batch operation was successful")
    total_count: int = Field(..., description="Total number of items processed")
    successful_count: int = Field(..., description="Number of successful operations")
    failed_count: int = Field(..., description="Number of failed operations")
    errors: List[str] = Field(default_factory=list, description="List of error messages")
    created_ids: List[str] = Field(default_factory=list, description="List of created item IDs")
    updated_ids: List[str] = Field(default_factory=list, description="List of updated item IDs")
    processing_time_seconds: float = Field(..., description="Total processing time")


# Error Response Models
class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp") 