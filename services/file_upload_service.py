"""
File upload service for handling Google Drive to Google Cloud Storage transfers.
"""
import os
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Tuple
from google.cloud import storage

from models import DriveFileInfo, UploadResult
from services.drive_service import get_thread_drive_service
from config import config

logger = logging.getLogger(__name__)

class FileUploadService:
    """Service for handling file uploads from Google Drive to Google Cloud Storage."""
    
    def __init__(self):
        self.max_workers = config.MAX_WORKERS
        self.max_file_size_bytes = int(config.MAX_FILE_SIZE_MB * 1024 * 1024)
    
    def filter_files_by_size(self, files: List[DriveFileInfo]) -> Tuple[List[DriveFileInfo], List[DriveFileInfo]]:
        """Filter files by size and return both eligible and too-large files."""
        eligible_files = []
        too_large_files = []
        
        for file_info in files:
            if file_info.size <= self.max_file_size_bytes:
                eligible_files.append(file_info)
            else:
                too_large_files.append(file_info)
                logger.debug(f"File too large: {file_info.name} ({file_info.size} bytes)")
        
        logger.info(f"Filtered {len(eligible_files)} eligible files and {len(too_large_files)} too-large files from {len(files)} total")
        return eligible_files, too_large_files
    
    def upload_file_to_gcs(self, 
                          storage_client: storage.Client,
                          file_info: DriveFileInfo,
                          bucket_name: str,
                          account_id: int) -> dict:
        """Upload a single file from Google Drive to GCS using thread-local drive service."""
        temp_path = None
        try:
            # Get thread-local drive service (one per worker)
            drive_service = get_thread_drive_service()
            if not drive_service or not drive_service.authenticated:
                return {
                    'drive_file_id': file_info.id,
                    'drive_file_name': file_info.name,
                    'status': 'failed',
                    'error': 'Failed to get authenticated drive service for worker thread'
                }
            
            # Download file from Drive to temporary location
            temp_path = drive_service.download_file(file_info)
            if not temp_path:
                return {
                    'drive_file_id': file_info.id,
                    'drive_file_name': file_info.name,
                    'status': 'failed',
                    'error': 'Failed to download from Google Drive'
                }
            
            # Upload to GCS
            bucket = storage_client.bucket(bucket_name)
            
            # Clean account_id (convert to string and remove trailing slashes)
            clean_account_id = str(account_id).rstrip('/')
            
            # Create object path: account_id/filesize_filename
            blob_name = f"{clean_account_id}/{file_info.size}_{file_info.name}"
            blob = bucket.blob(blob_name)
            
            # Upload file
            with open(temp_path, 'rb') as file_data:
                blob.upload_from_file(file_data)
            
            logger.info(f"Successfully uploaded {file_info.name} to gs://{bucket_name}/{blob_name}")
            
            return {
                'drive_file_id': file_info.id,
                'drive_file_name': file_info.name,
                'gcs_path': f"gs://{bucket_name}/{blob_name}",
                'file_size_bytes': file_info.size,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Failed to upload {file_info.name}: {e}")
            return {
                'drive_file_id': file_info.id,
                'drive_file_name': file_info.name,
                'status': 'failed',
                'error': str(e)
            }
        finally:
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {e}")
    
    def upload_files_concurrently(self,
                                 storage_client: storage.Client,
                                 files: List[DriveFileInfo],
                                 bucket_name: str,
                                 account_id: int) -> UploadResult:
        """Upload multiple files concurrently with thread-local drive services."""
        start_time = time.time()
        
        upload_details = []
        successful_uploads = 0
        failed_uploads = 0
        
        logger.info(f"Starting concurrent upload with {self.max_workers} workers, each will get its own DriveService instance")
        
        # Use ThreadPoolExecutor for concurrent uploads
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all upload tasks - each worker will create its own drive service
            future_to_file = {
                executor.submit(
                    self.upload_file_to_gcs,
                    storage_client,
                    file_info,
                    bucket_name,
                    account_id
                ): file_info for file_info in files
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_file):
                try:
                    result = future.result()
                    upload_details.append(result)
                    
                    if result['status'] == 'success':
                        successful_uploads += 1
                    else:
                        failed_uploads += 1
                        
                except Exception as e:
                    file_info = future_to_file[future]
                    logger.error(f"Upload task failed for {file_info.name}: {e}")
                    upload_details.append({
                        'drive_file_id': file_info.id,
                        'drive_file_name': file_info.name,
                        'status': 'failed',
                        'error': f"Task execution failed: {str(e)}"
                    })
                    failed_uploads += 1
        
        processing_time = time.time() - start_time
        logger.info(f"Completed concurrent upload: {successful_uploads} successful, {failed_uploads} failed")
        
        return UploadResult(
            total_files_found=len(files),
            eligible_files=len(files),
            successful_uploads=successful_uploads,
            failed_uploads=failed_uploads,
            processing_time_seconds=processing_time,
            upload_details=upload_details
        ) 