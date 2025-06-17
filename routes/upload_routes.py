"""
Upload routes for Google Drive to GCS file transfers.
"""
import logging
import time
from typing import Dict, List
from fastapi import APIRouter, HTTPException

from models import UploadRequest, UploadProcessRequest, UploadResult, FileProcessingStep
from services import FileUploadService, DriveService
from services.mongo_service import mongo_service
from config import config

logger = logging.getLogger(__name__)

# Create router
upload_router = APIRouter()

# Global variables (will be set by main app)
upload_service: FileUploadService = None
drive_service: DriveService = None  # Main service for discovery only
storage_client = None
mongo_service = None


@upload_router.post(
    "/discover", 
    response_model=Dict,
    summary="🔍 Discover Files",
    description="""
    **Phase 1: Discovery**
    
    Scan a Google Drive folder and catalog all files in MongoDB for later processing.
    
    - Filters files by size (eligible vs too-large)
    - Creates invoices in MongoDB with status tracking
    - Handles duplicate files gracefully
    - Returns summary of discovered files
    
    **Example folder names:** "test-myvat", "Documents", "Invoices"
    """,
    response_description="Summary of files discovered and cataloged",
    tags=["File Upload Process"]
)
async def discover_files_from_drive(request: UploadRequest):
    """Discover files from Google Drive folder and catalog them in MongoDB."""
    start_time = time.time()
    
    try:
        # Validate services
        if not drive_service or not drive_service.authenticated:
            raise HTTPException(
                status_code=503,
                detail="Google Drive service not authenticated"
            )
        
        if not mongo_service or not mongo_service.is_connected:
            raise HTTPException(
                status_code=503,
                detail="MongoDB service not connected"
            )
        
        logger.info(f"Starting discovery from Drive folder '{request.drive_folder_name}'")
        
        # Find folder ID by name
        folder_id = drive_service.find_folder_by_name(request.drive_folder_name)
        if not folder_id:
            raise HTTPException(
                status_code=404,
                detail=f"Google Drive folder '{request.drive_folder_name}' not found or not accessible"
            )
        
        logger.info(f"Found folder '{request.drive_folder_name}' with ID: {folder_id}")
        
        # Get files from Google Drive folder
        all_files = drive_service.get_files_in_folder(
            folder_id, 
            request.include_subfolders
        )
        
        if not all_files:
            logger.warning(f"No files found in Drive folder '{request.drive_folder_name}'")
            return {
                "total_files_found": 0,
                "eligible_files": 0,
                "rejected_files": 0,
                "processing_time_seconds": time.time() - start_time
            }
        
        logger.info(f"Found {len(all_files)} files in Drive folder")
        
        # Filter files by size - returns both eligible and too-large files
        eligible_files, too_large_files = upload_service.filter_files_by_size(all_files)
        
        # Prepare invoice data for all files
        invoices_data = []
        
        # Add eligible files (ready for upload)
        for file_info in eligible_files:
            invoices_data.append({
                "name": file_info.name,
                "source_id": file_info.id,
                "size": file_info.size,
                "account_id": request.account_id,
                "content_type": file_info.mime_type,
                "last_executed_step": FileProcessingStep.DISCOVERED  # Ready for upload
            })
        
        # Add too-large files (rejected)
        for file_info in too_large_files:
            invoices_data.append({
                "name": file_info.name,
                "source_id": file_info.id,
                "size": file_info.size,
                "account_id": request.account_id,
                "content_type": file_info.mime_type,
                "status": "rejected",
                "reason": "too big",
                "last_executed_step": FileProcessingStep.DISCOVERED
            })
        
        # Bulk insert all invoices
        created_invoices = await mongo_service.bulk_create_invoices(invoices_data)
        
        logger.info(f"Cataloged {len(created_invoices)} files: {len(eligible_files)} eligible, {len(too_large_files)} rejected")
        
        return {
            "total_files_found": len(all_files),
            "eligible_files": len(eligible_files),
            "rejected_files": len(too_large_files),
            "invoices_created": len(created_invoices),
            "processing_time_seconds": time.time() - start_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Discovery operation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Discovery operation failed: {str(e)}"
        )


@upload_router.post(
    "/upload", 
    response_model=UploadResult,
    summary="🚀 Upload Files",
    description="""
    **Phase 2: Upload**
    
    Upload files that are ready for upload from MongoDB to Google Cloud Storage.
    
    - Queries MongoDB for files with `last_executed_step=1` and no rejection status
    - **Each worker creates its own DriveService instance** for thread-safety
    - Uploads files concurrently to GCS without SSL conflicts
    - Updates invoice status using efficient ObjectId lookups
    - Tracks success/failure with detailed error reasons
    
    **Run this after the Discovery phase to process cataloged files.**
    """,
    response_description="Detailed upload results with file-by-file status",
    tags=["File Upload Process"]
)
async def upload_ready_files_to_gcs(request: UploadProcessRequest):
    """Upload files that are ready for upload (from MongoDB invoices)."""
    start_time = time.time()
    
    try:
        # Validate services
        if not storage_client:
            raise HTTPException(
                status_code=503,
                detail="Google Cloud Storage client not initialized"
            )
        
        if not upload_service:
            raise HTTPException(
                status_code=503,
                detail="Upload service not initialized"
            )
        
        if not mongo_service or not mongo_service.is_connected:
            raise HTTPException(
                status_code=503,
                detail="MongoDB service not connected"
            )
        
        # Get bucket name from config
        bucket_name = config.GCS_DEFAULT_BUCKET
        if not bucket_name:
            raise HTTPException(
                status_code=500,
                detail="GCS_DEFAULT_BUCKET not configured in environment variables"
            )
        
        logger.info(f"Starting upload for account {request.account_id} to bucket {bucket_name}")
        
        # Get ready invoices from MongoDB
        ready_invoices = await mongo_service.get_invoices_by_step(
            account_id=request.account_id, 
            last_executed_step=FileProcessingStep.DISCOVERED, 
            exclude_failed=True
        )
        
        if not ready_invoices:
            logger.info(f"No files ready for upload for account {request.account_id}")
            return UploadResult(
                total_files_found=0,
                eligible_files=0,
                successful_uploads=0,
                failed_uploads=0,
                processing_time_seconds=time.time() - start_time,
                upload_details=[]
            )
        
        logger.info(f"Found {len(ready_invoices)} files ready for upload")
        
        # Convert invoices to file info objects for upload service
        from models.api_models import DriveFileInfo
        files_for_upload = []
        invoice_map = {}  # Map source_id to invoice ObjectId
        
        for invoice in ready_invoices:
            file_info = DriveFileInfo(
                id=invoice.source_id,
                name=invoice.name,
                size=invoice.size,
                mime_type=invoice.content_type or "application/octet-stream"
            )
            files_for_upload.append(file_info)
            invoice_map[invoice.source_id] = str(invoice.id)
        
        # Upload files concurrently - each worker will create its own DriveService
        result = upload_service.upload_files_concurrently(
            storage_client=storage_client,
            files=files_for_upload,
            bucket_name=bucket_name,
            account_id=request.account_id
        )
        
        # Update invoices based on upload results using ObjectIds
        for upload_detail in result.upload_details:
            drive_file_id = upload_detail['drive_file_id']
            object_id = invoice_map.get(drive_file_id)
            
            if not object_id:
                logger.warning(f"No ObjectId found for source_id: {drive_file_id}")
                continue
            
            try:
                if upload_detail['status'] == 'success':
                    # Update successful uploads to step 2
                    await mongo_service.update_invoice_by_id(
                        object_id=object_id,
                        last_executed_step=FileProcessingStep.UPLOADED
                    )
                    logger.debug(f"Updated invoice {object_id} for successful upload")
                else:
                    # Mark failed uploads
                    error_msg = upload_detail.get('error', '')
                    
                    # Determine reason based on error message
                    if 'Failed to download from Google Drive' in error_msg:
                        reason = "failed to download"
                    else:
                        reason = "failed to upload"
                    
                    await mongo_service.update_invoice_by_id(
                        object_id=object_id,
                        status="failed to upload",
                        reason=reason
                    )
                    logger.debug(f"Updated invoice {object_id} for failed upload - {reason}")
            
            except Exception as e:
                logger.error(f"Failed to update invoice {object_id}: {e}")
        
        logger.info(f"Upload completed: {result.successful_uploads} successful, {result.failed_uploads} failed")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload operation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Upload operation failed: {str(e)}"
        ) 