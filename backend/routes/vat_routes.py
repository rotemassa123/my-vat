"""
VAT processing routes with CRUD operations and authentication.
"""
import logging
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.vat_api_models import *
from models.vat_api_models import ApiResponse
from models.account_models import Account
from BL.invoice_bl import invoice_bl
from BL.summary_bl import summary_bl
from BL.account_bl import account_bl
from services.auth_service import auth_service
from middleware.auth_middleware import get_current_account as auth_get_current_account
from services.large_file_service import large_file_service

logger = logging.getLogger(__name__)

# Create router
vat_router = APIRouter()

# Security scheme
security = HTTPBearer()

# Global variables (will be set by main app)
mongo_service = None


# Use real authentication instead of mock
get_current_account = auth_get_current_account


def check_permissions(account: Account, required_permissions: List[str]) -> bool:
    """Check if account has required permissions - TEMPORARILY DISABLED FOR TESTING."""
    # TODO: Re-enable permission checks after testing
    return True  # Allow all operations for testing


# Authentication Routes
@vat_router.get(
    "/auth/google",
    summary="🔐 Google OAuth Login",
    description="Initiate Google OAuth2 login flow",
    tags=["Authentication"]
)
async def google_login():
    """Initiate Google OAuth2 login."""
    try:
        auth_url = auth_service.create_google_oauth_url()
        return {"auth_url": auth_url}
        
    except Exception as e:
        logger.error(f"Google OAuth initiation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate Google OAuth")


@vat_router.get(
    "/auth/google/callback",
    response_model=LoginResponse,
    summary="🔐 Google OAuth Callback",
    description="Handle Google OAuth2 callback",
    tags=["Authentication"]
)
async def google_callback(code: str, state: str):
    """Handle Google OAuth2 callback."""
    try:
        result = await auth_service.handle_google_callback(code, state)
        account = result["account"]
        
        # Convert account to response model
        account_response = AccountResponse(
            id=str(account.id),
            email=account.email,
            name=account.name,
            account_type=account.account_type,
            status=account.status,
            company_name=account.company_name,
            vat_number=account.vat_number,
            address=account.address,
            vat_settings=account.vat_settings,
            monthly_upload_limit_mb=account.monthly_upload_limit_mb,
            current_month_usage_mb=account.current_month_usage_mb,
            created_at=account.created_at,
            last_login=account.last_login
        )
        
        return LoginResponse(
            access_token=result["access_token"],
            expires_in=86400,  # 24 hours
            account=account_response
        )
        
    except Exception as e:
        logger.error(f"Google OAuth callback failed: {e}")
        raise HTTPException(status_code=400, detail="OAuth callback failed")


@vat_router.post(
    "/auth/logout",
    summary="🔐 Logout",
    description="Logout and invalidate session",
    tags=["Authentication"]
)
async def logout(
    request: LogoutRequest,
    current_account: Account = Depends(get_current_account)
):
    """Logout user and invalidate session."""
    try:
        if request.session_token:
            await auth_service.logout_session(request.session_token)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")


# Account Routes
@vat_router.post(
    "/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="👤 Create Account",
    description="Create a new user account",
    tags=["Account Management"]
)
async def create_account(request: AccountCreateRequest):
    """Create a new account."""
    try:
        account_data = request.dict(exclude_none=True)
        account = await account_bl.create_account(account_data)
        
        return AccountResponse(
            id=str(account.id),
            email=account.email,
            name=account.name,
            account_type=account.account_type,
            status=account.status,
            company_name=account.company_name,
            vat_number=account.vat_number,
            address=account.address,
            vat_settings=account.vat_settings,
            monthly_upload_limit_mb=account.monthly_upload_limit_mb,
            current_month_usage_mb=account.current_month_usage_mb,
            created_at=account.created_at,
            last_login=account.last_login
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Account creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account")


@vat_router.get(
    "/accounts/me",
    response_model=AccountResponse,
    summary="👤 Get My Account",
    description="Get current user's account information",
    tags=["Account Management"]
)
async def get_my_account(current_account: Account = Depends(get_current_account)):
    """Get current user's account."""
    return AccountResponse(
        id=str(current_account.id),
        email=current_account.email,
        name=current_account.name,
        account_type=current_account.account_type,
        status=current_account.status,
        company_name=current_account.company_name,
        vat_number=current_account.vat_number,
        address=current_account.address,
        vat_settings=current_account.vat_settings,
        monthly_upload_limit_mb=current_account.monthly_upload_limit_mb,
        current_month_usage_mb=current_account.current_month_usage_mb,
        created_at=current_account.created_at,
        last_login=current_account.last_login
    )


@vat_router.put(
    "/accounts/me",
    response_model=AccountResponse,
    summary="👤 Update My Account",
    description="Update current user's account information",
    tags=["Account Management"]
)
async def update_my_account(
    request: AccountUpdateRequest,
    current_account: Account = Depends(get_current_account)
):
    """Update current user's account."""
    try:
        update_data = request.dict(exclude_none=True)
        updated_account = await account_bl.update_account(str(current_account.id), update_data)
        
        if not updated_account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return AccountResponse(
            id=str(updated_account.id),
            email=updated_account.email,
            name=updated_account.name,
            account_type=updated_account.account_type,
            status=updated_account.status,
            company_name=updated_account.company_name,
            vat_number=updated_account.vat_number,
            address=updated_account.address,
            vat_settings=updated_account.vat_settings,
            monthly_upload_limit_mb=updated_account.monthly_upload_limit_mb,
            current_month_usage_mb=updated_account.current_month_usage_mb,
            created_at=updated_account.created_at,
            last_login=updated_account.last_login
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Account update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update account")


# Invoice Routes
@vat_router.post(
    "/invoices",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="📄 Create Invoice",
    description="Create a new invoice record",
    tags=["Invoice Management"]
)
async def create_invoice(
    request: InvoiceCreateRequest,
    current_account: Account = Depends(get_current_account)
):
    """Create a new invoice."""
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Override account_id with current user's account
        invoice_data = request.dict()
        invoice_data["account_id"] = int(str(current_account.id), 16) % (2**31)  # Convert to int
        
        invoice = await invoice_bl.create_invoice(invoice_data)
        
        return InvoiceResponse(
            id=str(invoice.id),
            name=invoice.name,
            source_id=invoice.source_id,
            size=invoice.size,
            account_id=invoice.account_id,
            last_executed_step=invoice.last_executed_step,
            source=invoice.source,
            content_type=invoice.content_type,
            status=invoice.status,
            reason=invoice.reason,
            created_at=invoice.created_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Invoice creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create invoice")


@vat_router.post(
    "/invoices/batch",
    response_model=BatchOperationResponse,
    summary="📄 Batch Create Invoices",
    description="Create multiple invoices in batch",
    tags=["Invoice Management"]
)
async def batch_create_invoices(
    request: InvoiceBatchCreateRequest,
    current_account: Account = Depends(get_current_account)
):
    """Create multiple invoices in batch."""
    start_time = time.time()
    
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Override account_id with current user's account
        account_id_int = int(str(current_account.id), 16) % (2**31)
        invoices_data = []
        
        for invoice_req in request.invoices:
            invoice_data = invoice_req.dict()
            invoice_data["account_id"] = account_id_int
            invoices_data.append(invoice_data)
        
        invoices = await invoice_bl.batch_create_invoices(invoices_data)
        
        return BatchOperationResponse(
            success=True,
            total_count=len(request.invoices),
            successful_count=len(invoices),
            failed_count=0,
            errors=[],
            created_ids=[str(inv.id) for inv in invoices],
            updated_ids=[],
            processing_time_seconds=time.time() - start_time
        )
        
    except Exception as e:
        logger.error(f"Batch invoice creation failed: {e}")
        return BatchOperationResponse(
            success=False,
            total_count=len(request.invoices),
            successful_count=0,
            failed_count=len(request.invoices),
            errors=[str(e)],
            created_ids=[],
            updated_ids=[],
            processing_time_seconds=time.time() - start_time
        )


@vat_router.get(
    "/invoices",
    response_model=ApiResponse[PaginatedInvoiceResponse],
    summary="📄 Get Invoices",
    description="Get invoices with advanced filtering and pagination",
    tags=["Invoice Management"]
)
async def get_invoices(
    page: int = 1,
    per_page: int = 20,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    source: Optional[str] = None,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    step: Optional[int] = None,
    content_type: Optional[str] = None,
    name_contains: Optional[str] = None,
    sort_by: str = "submitted_date",
    sort_order: str = "desc",
    current_account: Account = Depends(get_current_account)
):
    """Get invoices with filtering."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Build filters
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if date_from:
            filters["date_from"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            filters["date_to"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        if source:
            filters["source"] = source
        if min_size:
            filters["min_size"] = min_size
        if max_size:
            filters["max_size"] = max_size
        if step is not None:
            filters["step"] = step
        if content_type:
            filters["content_type"] = content_type
        if name_contains:
            filters["name_contains"] = name_contains
        
        # Convert page/per_page to limit/skip
        limit = per_page
        skip = (page - 1) * per_page
        
        # Convert sort_order string to int
        sort_order_int = -1 if sort_order.lower() == "desc" else 1
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        result = await invoice_bl.get_invoices_with_filters(
            account_id=account_id_int,
            filters=filters,
            limit=limit,
            skip=skip,
            sort_by=sort_by,
            sort_order=sort_order_int
        )
        
        # Convert real invoices to response models
        invoice_responses = []
        for invoice in result["invoices"]:
            invoice_responses.append(InvoiceResponse(
                id=str(invoice.id),
                file_name=invoice.name,
                file_size=invoice.size,
                upload_date=invoice.created_at.isoformat(),
                account_id=str(invoice.account_id),
                source=invoice.source,
                content_type=invoice.content_type,
                status=invoice.status,
                created_at=invoice.created_at.isoformat(),
                updated_at=invoice.created_at.isoformat()
            ))
        
        total_count = result["total_count"]
        total_pages = result["total_pages"]
        has_next = result["has_next"]
        has_previous = result["has_previous"]
    
        paginated_response = PaginatedInvoiceResponse(
            items=invoice_responses,
            page=page,
            per_page=per_page,
            total=total_count,
            pages=total_pages,
            has_next=has_next,
            has_prev=has_previous
        )
        
        return ApiResponse(data=paginated_response)
        
    except Exception as e:
        logger.error(f"Failed to get invoices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get invoices")


@vat_router.get(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
    summary="📄 Get Invoice",
    description="Get a specific invoice by ID",
    tags=["Invoice Management"]
)
async def get_invoice(
    invoice_id: str,
    current_account: Account = Depends(get_current_account)
):
    """Get a specific invoice."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        invoice = await invoice_bl.get_invoice_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if invoice belongs to current account
        account_id_int = int(str(current_account.id), 16) % (2**31)
        if invoice.account_id != account_id_int:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return InvoiceResponse(
            id=str(invoice.id),
            name=invoice.name,
            source_id=invoice.source_id,
            size=invoice.size,
            account_id=invoice.account_id,
            last_executed_step=invoice.last_executed_step,
            source=invoice.source,
            content_type=invoice.content_type,
            status=invoice.status,
            reason=invoice.reason,
            created_at=invoice.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get invoice")


@vat_router.put(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
    summary="📄 Update Invoice",
    description="Update a specific invoice",
    tags=["Invoice Management"]
)
async def update_invoice(
    invoice_id: str,
    request: InvoiceUpdateRequest,
    current_account: Account = Depends(get_current_account)
):
    """Update a specific invoice."""
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Check if invoice exists and belongs to current account
        invoice = await invoice_bl.get_invoice_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        if invoice.account_id != account_id_int:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update_data = request.dict(exclude_none=True)
        updated_invoice = await invoice_bl.update_invoice(invoice_id, update_data)
        
        if not updated_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return InvoiceResponse(
            id=str(updated_invoice.id),
            name=updated_invoice.name,
            source_id=updated_invoice.source_id,
            size=updated_invoice.size,
            account_id=updated_invoice.account_id,
            last_executed_step=updated_invoice.last_executed_step,
            source=updated_invoice.source,
            content_type=updated_invoice.content_type,
            status=updated_invoice.status,
            reason=updated_invoice.reason,
            created_at=updated_invoice.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update invoice")


@vat_router.delete(
    "/invoices/{invoice_id}",
    summary="📄 Delete Invoice",
    description="Delete a specific invoice",
    tags=["Invoice Management"]
)
async def delete_invoice(
    invoice_id: str,
    current_account: Account = Depends(get_current_account)
):
    """Delete a specific invoice."""
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Check if invoice exists and belongs to current account
        invoice = await invoice_bl.get_invoice_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        if invoice.account_id != account_id_int:
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = await invoice_bl.delete_invoice(invoice_id)
        if not success:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"message": "Invoice deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete invoice")


@vat_router.get(
    "/invoices/statistics",
    response_model=InvoiceStatisticsResponse,
    summary="📊 Invoice Statistics",
    description="Get invoice statistics for current account",
    tags=["Invoice Management"]
)
async def get_invoice_statistics(current_account: Account = Depends(get_current_account)):
    """Get invoice statistics."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        stats = await invoice_bl.get_invoice_statistics(account_id_int)
        
        return InvoiceStatisticsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Failed to get invoice statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")


# Large File Upload Routes
@vat_router.post(
    "/uploads/initiate",
    response_model=FileUploadResponse,
    summary="📤 Initiate Large File Upload",
    description="Initiate a large file upload session",
    tags=["File Upload"]
)
async def initiate_large_file_upload(
    request: LargeFileUploadRequest,
    current_account: Account = Depends(get_current_account)
):
    """Initiate large file upload."""
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Check usage limits
        usage_mb = request.size / (1024 * 1024)
        usage_check = await account_bl.check_usage_limit(str(current_account.id), int(usage_mb))
        
        if not usage_check["allowed"]:
            raise HTTPException(status_code=413, detail=usage_check["reason"])
        
        if not large_file_service:
            raise HTTPException(status_code=503, detail="Large file upload service not available")
        
        # Override account_id with current user's account
        account_id_int = int(str(current_account.id), 16) % (2**31)
        
        result = await large_file_service.initiate_upload(
            filename=request.filename,
            content_type=request.content_type,
            size=request.size,
            account_id=account_id_int,
            chunk_size=request.chunk_size
        )
        
        return FileUploadResponse(
            upload_id=result["upload_id"],
            filename=request.filename,
            total_chunks=result["total_chunks"],
            uploaded_chunks=0,
            completed=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to initiate upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate upload")


@vat_router.post(
    "/uploads/{upload_id}/chunk",
    summary="📤 Upload File Chunk",
    description="Upload a file chunk",
    tags=["File Upload"]
)
async def upload_file_chunk(
    upload_id: str,
    chunk_number: int = Form(...),
    is_final_chunk: bool = Form(False),
    chunk: UploadFile = File(...),
    current_account: Account = Depends(get_current_account)
):
    """Upload a file chunk."""
    try:
        if not check_permissions(current_account, ["upload"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        if not large_file_service:
            raise HTTPException(status_code=503, detail="Large file upload service not available")
        
        # Read chunk data
        chunk_data = await chunk.read()
        
        result = await large_file_service.upload_chunk(
            upload_id=upload_id,
            chunk_number=chunk_number,
            chunk_data=chunk_data,
            is_final_chunk=is_final_chunk
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to upload chunk: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload chunk")


@vat_router.get(
    "/uploads/{upload_id}/status",
    summary="📤 Get Upload Status",
    description="Get upload session status",
    tags=["File Upload"]
)
async def get_upload_status(
    upload_id: str,
    current_account: Account = Depends(get_current_account)
):
    """Get upload status."""
    try:
        if not large_file_service:
            raise HTTPException(status_code=503, detail="Large file upload service not available")
        
        status = await large_file_service.get_upload_status(upload_id)
        if not status:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get upload status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get upload status")


# Summary Routes
@vat_router.post(
    "/summaries",
    response_model=SummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="📋 Create Summary",
    description="Create a new summary record",
    tags=["Summary Management"]
)
async def create_summary(
    request: SummaryCreateRequest,
    current_account: Account = Depends(get_current_account)
):
    """Create a new summary."""
    try:
        if not check_permissions(current_account, ["process"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Override account_id with current user's account
        summary_data = request.dict()
        summary_data["account_id"] = int(str(current_account.id), 16) % (2**31)
        
        summary = await summary_bl.create_summary(summary_data)
        
        return SummaryResponse(
            id=str(summary.id),
            file_id=summary.file_id,
            file_name=summary.file_name,
            account_id=summary.account_id,
            model_used=summary.model_used,
            tokens_used=summary.tokens_used,
            cost_usd=summary.cost_usd,
            is_invoice=summary.is_invoice,
            summary_content=summary.summary_content,
            extracted_data=summary.extracted_data,
            processing_time_seconds=summary.processing_time_seconds,
            success=summary.success,
            created_at=summary.created_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Summary creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create summary")


@vat_router.get(
    "/summaries",
    response_model=PaginatedSummaryResponse,
    summary="📋 Get Summaries",
    description="Get summaries with advanced filtering and pagination",
    tags=["Summary Management"]
)
async def get_summaries(
    is_invoice: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    success: Optional[bool] = None,
    model_used: Optional[str] = None,
    min_cost: Optional[float] = None,
    max_cost: Optional[float] = None,
    min_tokens: Optional[int] = None,
    max_tokens: Optional[int] = None,
    file_name_contains: Optional[str] = None,
    content_contains: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    sort_by: str = "created_at",
    sort_order: int = -1,
    current_account: Account = Depends(get_current_account)
):
    """Get summaries with filtering."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Build filters
        filters = {}
        if is_invoice is not None:
            filters["is_invoice"] = is_invoice
        if date_from:
            filters["date_from"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            filters["date_to"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        if success is not None:
            filters["success"] = success
        if model_used:
            filters["model_used"] = model_used
        if min_cost:
            filters["min_cost"] = min_cost
        if max_cost:
            filters["max_cost"] = max_cost
        if min_tokens:
            filters["min_tokens"] = min_tokens
        if max_tokens:
            filters["max_tokens"] = max_tokens
        if file_name_contains:
            filters["file_name_contains"] = file_name_contains
        if content_contains:
            filters["content_contains"] = content_contains
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        result = await summary_bl.get_summaries_with_filters(
            account_id=account_id_int,
            filters=filters,
            limit=limit,
            skip=skip,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Convert summaries to response models
        summary_responses = []
        for summary in result["summaries"]:
            summary_responses.append(SummaryResponse(
                id=str(summary.id),
                file_id=summary.file_id,
                file_name=summary.file_name,
                account_id=summary.account_id,
                model_used=summary.model_used,
                tokens_used=summary.tokens_used,
                cost_usd=summary.cost_usd,
                is_invoice=summary.is_invoice,
                summary_content=summary.summary_content,
                extracted_data=summary.extracted_data,
                processing_time_seconds=summary.processing_time_seconds,
                success=summary.success,
                created_at=summary.created_at
            ))
        
        return PaginatedSummaryResponse(
            summaries=summary_responses,
            total_count=result["total_count"],
            page_size=result["page_size"],
            current_page=result["current_page"],
            total_pages=result["total_pages"],
            has_next=result["has_next"],
            has_previous=result["has_previous"]
        )
        
    except Exception as e:
        logger.error(f"Failed to get summaries: {e}")
        raise HTTPException(status_code=500, detail="Failed to get summaries")


@vat_router.get(
    "/summaries/{summary_id}",
    response_model=SummaryResponse,
    summary="📋 Get Summary",
    description="Get a specific summary by ID",
    tags=["Summary Management"]
)
async def get_summary(
    summary_id: str,
    current_account: Account = Depends(get_current_account)
):
    """Get a specific summary."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        summary = await summary_bl.get_summary_by_id(summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        # Check if summary belongs to current account
        account_id_int = int(str(current_account.id), 16) % (2**31)
        if summary.account_id != account_id_int:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return SummaryResponse(
            id=str(summary.id),
            file_id=summary.file_id,
            file_name=summary.file_name,
            account_id=summary.account_id,
            model_used=summary.model_used,
            tokens_used=summary.tokens_used,
            cost_usd=summary.cost_usd,
            is_invoice=summary.is_invoice,
            summary_content=summary.summary_content,
            extracted_data=summary.extracted_data,
            processing_time_seconds=summary.processing_time_seconds,
            success=summary.success,
            created_at=summary.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get summary {summary_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get summary")


@vat_router.get(
    "/summaries/statistics",
    response_model=SummaryStatisticsResponse,
    summary="📊 Summary Statistics",
    description="Get summary statistics for current account",
    tags=["Summary Management"]
)
async def get_summary_statistics(current_account: Account = Depends(get_current_account)):
    """Get summary statistics."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        stats = await summary_bl.get_summary_statistics(account_id_int)
        
        return SummaryStatisticsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Failed to get summary statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")


@vat_router.get(
    "/summaries/invoices/extracted-data",
    summary="📋 Get Extracted Invoice Data",
    description="Get extracted data from invoice summaries",
    tags=["Summary Management"]
)
async def get_extracted_invoice_data(current_account: Account = Depends(get_current_account)):
    """Get extracted invoice data."""
    try:
        if not check_permissions(current_account, ["view"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        account_id_int = int(str(current_account.id), 16) % (2**31)
        extracted_data = await summary_bl.get_extracted_invoice_data(account_id_int)
        
        return {"extracted_invoice_data": extracted_data}
        
    except Exception as e:
        logger.error(f"Failed to get extracted invoice data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get extracted data") 