"""
Process routes for OpenAI-powered file processing and chat functionality.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List
from fastapi import APIRouter, HTTPException
from google.cloud import storage

from models import ProcessRequest, FileProcessingStep
from services.mongo_service import mongo_service
from services.openai_service import openai_service
from config import config

logger = logging.getLogger(__name__)

process_router = APIRouter()

def is_image_file(file_name: str) -> bool:
    """Check if a file is an image based on its extension."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'}
    return any(file_name.lower().endswith(ext) for ext in image_extensions)

def download_file_from_gcs(storage_client: storage.Client, 
                          invoice, 
                          bucket_name: str, 
                          account_id: int) -> dict:
    """Download a single file from GCS and return content for summarization."""
    try:
        # Determine file type and construct appropriate blob path
        if is_image_file(invoice.name):
            # For images, download the OCR-processed .txt file
            base_name = '.'.join(invoice.name.split('.')[:-1])  # Remove extension
            ocr_filename = f"{base_name}.txt"
            blob_name = f"{account_id}/{invoice.size}_{ocr_filename}"  # Look for the .txt version
            download_filename = ocr_filename
            file_type = "image_ocr"
            
        elif invoice.name.lower().endswith('.pdf'):
            # For PDFs, use original file (will need text extraction)
            blob_name = f"{account_id}/{invoice.size}_{invoice.name}"
            download_filename = invoice.name
            file_type = "pdf"
            
        else:
            # For textual files, use original file
            blob_name = f"{account_id}/{invoice.size}_{invoice.name}"
            download_filename = invoice.name
            file_type = "textual"
        
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        # Check if file exists
        if not blob.exists():
            return {
                'file_id': str(invoice.id),
                'file_name': invoice.name,
                'status': 'failed',
                'error': f'File not found in GCS: {blob_name}',
                'content_text': None
            }
        
        # Download file content as bytes first
        file_bytes = blob.download_as_bytes()
        
        # Process content based on file type
        content_text = None
        
        if file_type == "image_ocr":
            # OCR-processed text file - decode as UTF-8
            try:
                content_text = file_bytes.decode('utf-8')
            except UnicodeDecodeError as e:
                return {
                    'file_id': str(invoice.id),
                    'file_name': invoice.name,
                    'status': 'failed',
                    'error': f"Could not decode OCR text file: {str(e)}",
                    'content_text': None
                }
                
        elif file_type == "pdf":
            # For PDFs, we'll skip summarization for now (needs text extraction)
            logger.warning(f"PDF text extraction not implemented for {invoice.name}")
            return {
                'file_id': str(invoice.id),
                'file_name': invoice.name,
                'download_filename': download_filename,
                'file_type': file_type,
                'content_length': len(file_bytes),
                'status': 'success',
                'content_text': None,
                'skip_reason': 'PDF text extraction not implemented'
            }
            
        else:
            # For textual files, try to decode as UTF-8
            try:
                content_text = file_bytes.decode('utf-8')
            except UnicodeDecodeError as e:
                # If it fails to decode, skip summarization
                return {
                    'file_id': str(invoice.id),
                    'file_name': invoice.name,
                    'download_filename': download_filename,
                    'file_type': file_type,
                    'content_length': len(file_bytes),
                    'status': 'success',
                    'content_text': None,
                    'skip_reason': f'Could not decode as text: {str(e)}'
                }
        
        logger.info(f"Successfully downloaded {file_type} file {blob_name} (original: {invoice.name}) from GCS")
        
        return {
            'file_id': str(invoice.id),
            'file_name': invoice.name,
            'download_filename': download_filename,
            'file_type': file_type,
            'content_length': len(file_bytes),
            'text_length': len(content_text) if content_text else 0,
            'status': 'success',
            'content_preview': content_text[:200] + "..." if content_text and len(content_text) > 200 else content_text[:200] if content_text else None,
            'content_text': content_text  # Full content for summarization
        }
        
    except Exception as e:
        logger.error(f"Failed to download {invoice.name}: {e}")
        return {
            'file_id': str(invoice.id),
            'file_name': invoice.name,
            'status': 'failed',
            'error': str(e),
            'content_text': None
        }

@process_router.post(
    "/process",
    summary="Process all uploaded files for an account",
    description="Download and process all files for an account with last_executed_step == UPLOADED, then send to OpenAI for summarization.",
    response_description="Downloads files concurrently, processes them with OpenAI, and stores summaries."
)
async def process_files(request: ProcessRequest):
    """Download and process all files for an account with last_executed_step == UPLOADED."""
    start_time = time.time()
    account_id = request.account_id
    
    # Validate services
    if not mongo_service or not mongo_service.is_connected:
        raise HTTPException(status_code=503, detail="MongoDB service not connected")
    
    if not openai_service.authenticated:
        raise HTTPException(status_code=503, detail="OpenAI service not authenticated")
    
    # Get bucket name from config
    bucket_name = config.GCS_DEFAULT_BUCKET
    if not bucket_name:
        raise HTTPException(status_code=500, detail="GCS_DEFAULT_BUCKET not configured")
    
    # Initialize storage client
    storage_client = storage.Client()
    
    # Get uploaded files
    files = await mongo_service.get_invoices_by_step(account_id, FileProcessingStep.UPLOADED)
    
    if not files:
        logger.info(f"No uploaded files found for account {account_id}")
        return {
            "found_files": 0,
            "downloaded_files": 0,
            "failed_downloads": 0,
            "summarized_files": 0,
            "failed_summarizations": 0,
            "processing_time_seconds": time.time() - start_time,
            "results": []
        }
    
    logger.info(f"Found {len(files)} uploaded files for account {account_id}, starting concurrent download")
    
    # Phase 1: Download files concurrently
    download_results = []
    successful_downloads = 0
    failed_downloads = 0
    
    max_workers = config.MAX_WORKERS
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all download tasks
        future_to_file = {
            executor.submit(
                download_file_from_gcs,
                storage_client,
                invoice,
                bucket_name,
                account_id
            ): invoice for invoice in files
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_file):
            try:
                result = future.result()
                download_results.append(result)
                
                if result['status'] == 'success':
                    successful_downloads += 1
                    logger.info(f"Downloaded {result.get('file_type', 'unknown')} file: {result['file_name']}")
                else:
                    failed_downloads += 1
                    logger.error(f"Failed to download {result['file_name']}: {result['error']}")
                    
            except Exception as e:
                invoice = future_to_file[future]
                logger.error(f"Download task failed for {invoice.name}: {e}")
                download_results.append({
                    'file_id': str(invoice.id),
                    'file_name': invoice.name,
                    'status': 'failed',
                    'error': f"Task execution failed: {str(e)}",
                    'content_text': None
                })
                failed_downloads += 1
    
    # Phase 2: Process downloaded files with OpenAI (async)
    logger.info(f"Starting OpenAI summarization for {successful_downloads} downloaded files")
    
    successful_summarizations = 0
    failed_summarizations = 0
    
    for result in download_results:
        if result['status'] == 'success' and result.get('content_text'):
            try:
                # Call OpenAI service for summarization
                summary = await openai_service.summarize_invoice_content(
                    content=result['content_text'],
                    file_id=result['file_id'],
                    file_name=result['file_name'],
                    account_id=account_id
                )
                
                # Add summarization results to the download result
                result['summarization_status'] = 'completed' if summary.success else 'failed'
                result['summarization_result'] = {
                    'is_invoice': summary.is_invoice,
                    'summary_content': summary.summary_content,
                    'extracted_data': summary.extracted_data,
                    'tokens_used': summary.tokens_used,
                    'cost_usd': summary.cost_usd,
                    'success': summary.success
                }
                
                if summary.success:
                    successful_summarizations += 1
                    logger.info(f"Summarized file: {result['file_name']} - is_invoice: {summary.is_invoice}")
                    
                    # Update the invoice processing step to SUMMARIZED
                    try:
                        await mongo_service.update_invoice_step(result['file_id'], FileProcessingStep.SUMMARIZED)
                        logger.info(f"Updated {result['file_name']} processing step to SUMMARIZED")
                    except Exception as e:
                        logger.error(f"Failed to update processing step for {result['file_name']}: {e}")
                else:
                    failed_summarizations += 1
                    logger.error(f"Failed to summarize {result['file_name']}: {summary.error_message}")
                
                # Remove the full content text from the response to keep it clean
                result.pop('content_text', None)
                
            except Exception as e:
                logger.error(f"Failed to summarize content for {result['file_name']}: {e}")
                result['summarization_status'] = 'failed'
                result['summarization_result'] = {'error': str(e)}
                result.pop('content_text', None)
                failed_summarizations += 1
        else:
            # File was downloaded but has no content to summarize
            if result['status'] == 'success':
                result['summarization_status'] = 'skipped'
                result['summarization_reason'] = result.get('skip_reason', 'No content available')
            else:
                result['summarization_status'] = 'skipped'
            result.pop('content_text', None)
    
    processing_time = time.time() - start_time
    
    logger.info(f"Processing completed: {successful_downloads} downloads successful, {failed_downloads} downloads failed, {successful_summarizations} summarized, {failed_summarizations} summarization failed, {processing_time:.2f}s")
    
    return {
        "found_files": len(files),
        "downloaded_files": successful_downloads,
        "failed_downloads": failed_downloads,
        "summarized_files": successful_summarizations,
        "failed_summarizations": failed_summarizations,
        "processing_time_seconds": processing_time,
        "results": download_results
    } 