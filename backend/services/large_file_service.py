"""
Service for handling large file uploads with chunked upload support.
"""
import os
import logging
import asyncio
import hashlib
import uuid
from typing import Optional, Dict, Any, BinaryIO, List
from datetime import datetime, timezone, timedelta
from google.cloud import storage
from google.cloud.storage import Blob

from config import config
from models.mongo_models import Invoice

logger = logging.getLogger(__name__)


class LargeFileUploadService:
    """Service for handling large file uploads with streaming and chunked upload."""
    
    def __init__(self, storage_client: storage.Client):
        self.storage_client = storage_client
        self.bucket_name = config.GCS_DEFAULT_BUCKET
        self.chunk_size = 5 * 1024 * 1024  # 5MB chunks
        
        # In-memory storage for upload sessions (in production, use Redis or MongoDB)
        self.upload_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Temporary directory for file chunks
        self.temp_dir = os.path.join(os.getcwd(), "temp_uploads")
        os.makedirs(self.temp_dir, exist_ok=True)
    
    async def initiate_upload(
        self,
        filename: str,
        content_type: str,
        size: int,
        account_id: int,
        chunk_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """Initiate a large file upload session."""
        try:
            upload_id = str(uuid.uuid4())
            chunk_size = chunk_size or self.chunk_size
            
            # Calculate total chunks needed
            total_chunks = (size + chunk_size - 1) // chunk_size
            
            # Create upload session
            session = {
                "upload_id": upload_id,
                "filename": filename,
                "content_type": content_type,
                "total_size": size,
                "account_id": account_id,
                "chunk_size": chunk_size,
                "total_chunks": total_chunks,
                "uploaded_chunks": 0,
                "chunks_received": [],
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),  # 24-hour expiry
                "completed": False,
                "final_blob_name": None,
                "temp_files": []
            }
            
            self.upload_sessions[upload_id] = session
            
            logger.info(f"Initiated upload session {upload_id} for file {filename} ({size} bytes, {total_chunks} chunks)")
            
            return {
                "upload_id": upload_id,
                "chunk_size": chunk_size,
                "total_chunks": total_chunks,
                "expires_at": session["expires_at"]
            }
            
        except Exception as e:
            logger.error(f"Failed to initiate upload: {e}")
            raise
    
    async def upload_chunk(
        self,
        upload_id: str,
        chunk_number: int,
        chunk_data: bytes,
        is_final_chunk: bool = False
    ) -> Dict[str, Any]:
        """Upload a file chunk."""
        try:
            # Get upload session
            session = self.upload_sessions.get(upload_id)
            if not session:
                raise ValueError(f"Upload session {upload_id} not found")
            
            # Check if session has expired
            if datetime.now(timezone.utc) > session["expires_at"]:
                await self.cleanup_upload_session(upload_id)
                raise ValueError(f"Upload session {upload_id} has expired")
            
            # Validate chunk number
            if chunk_number >= session["total_chunks"]:
                raise ValueError(f"Invalid chunk number {chunk_number}")
            
            if chunk_number in session["chunks_received"]:
                logger.warning(f"Chunk {chunk_number} already received for upload {upload_id}")
                return {
                    "upload_id": upload_id,
                    "chunk_number": chunk_number,
                    "already_received": True,
                    "uploaded_chunks": session["uploaded_chunks"],
                    "total_chunks": session["total_chunks"]
                }
            
            # Save chunk to temporary file
            chunk_filename = f"{upload_id}_chunk_{chunk_number:06d}"
            chunk_path = os.path.join(self.temp_dir, chunk_filename)
            
            with open(chunk_path, "wb") as f:
                f.write(chunk_data)
            
            # Update session
            session["chunks_received"].append(chunk_number)
            session["chunks_received"].sort()
            session["uploaded_chunks"] = len(session["chunks_received"])
            session["temp_files"].append(chunk_path)
            
            logger.debug(f"Saved chunk {chunk_number} for upload {upload_id} to {chunk_path}")
            
            # Check if all chunks are received
            all_chunks_received = session["uploaded_chunks"] == session["total_chunks"]
            
            if all_chunks_received or is_final_chunk:
                # Assemble the file and upload to GCS
                final_file_path = await self._assemble_chunks(session)
                gcs_blob_name = await self._upload_to_gcs(session, final_file_path)
                
                # Create invoice record
                invoice = await self._create_invoice_record(session, gcs_blob_name)
                
                # Mark session as completed
                session["completed"] = True
                session["final_blob_name"] = gcs_blob_name
                session["invoice_id"] = str(invoice.id)
                
                # Clean up temporary files
                await self._cleanup_temp_files(session)
                
                logger.info(f"Completed upload {upload_id}: {gcs_blob_name}")
                
                return {
                    "upload_id": upload_id,
                    "chunk_number": chunk_number,
                    "uploaded_chunks": session["uploaded_chunks"],
                    "total_chunks": session["total_chunks"],
                    "completed": True,
                    "file_url": f"gs://{self.bucket_name}/{gcs_blob_name}",
                    "invoice_id": session["invoice_id"]
                }
            
            return {
                "upload_id": upload_id,
                "chunk_number": chunk_number,
                "uploaded_chunks": session["uploaded_chunks"],
                "total_chunks": session["total_chunks"],
                "completed": False
            }
            
        except Exception as e:
            logger.error(f"Failed to upload chunk {chunk_number} for upload {upload_id}: {e}")
            raise
    
    async def _assemble_chunks(self, session: Dict[str, Any]) -> str:
        """Assemble all chunks into a single file."""
        try:
            upload_id = session["upload_id"]
            filename = session["filename"]
            
            # Create final file path
            final_filename = f"{upload_id}_{filename}"
            final_path = os.path.join(self.temp_dir, final_filename)
            
            # Sort chunks by number and assemble
            chunk_files = []
            for chunk_num in sorted(session["chunks_received"]):
                chunk_filename = f"{upload_id}_chunk_{chunk_num:06d}"
                chunk_path = os.path.join(self.temp_dir, chunk_filename)
                chunk_files.append(chunk_path)
            
            # Assemble file
            with open(final_path, "wb") as final_file:
                for chunk_path in chunk_files:
                    with open(chunk_path, "rb") as chunk_file:
                        while True:
                            data = chunk_file.read(1024 * 1024)  # 1MB buffer
                            if not data:
                                break
                            final_file.write(data)
            
            logger.debug(f"Assembled file {final_path} from {len(chunk_files)} chunks")
            return final_path
            
        except Exception as e:
            logger.error(f"Failed to assemble chunks for upload {session['upload_id']}: {e}")
            raise
    
    async def _upload_to_gcs(self, session: Dict[str, Any], file_path: str) -> str:
        """Upload assembled file to Google Cloud Storage."""
        try:
            account_id = session["account_id"]
            filename = session["filename"]
            content_type = session["content_type"]
            
            # Generate GCS blob name
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            blob_name = f"account_{account_id}/uploads/{timestamp}_{filename}"
            
            # Get bucket and blob
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(blob_name)
            
            # Set content type
            blob.content_type = content_type
            
            # Upload file with streaming
            with open(file_path, "rb") as file_obj:
                blob.upload_from_file(
                    file_obj,
                    content_type=content_type,
                    timeout=300  # 5 minute timeout
                )
            
            logger.info(f"Uploaded file to GCS: gs://{self.bucket_name}/{blob_name}")
            return blob_name
            
        except Exception as e:
            logger.error(f"Failed to upload to GCS: {e}")
            raise
    
    async def _create_invoice_record(self, session: Dict[str, Any], gcs_blob_name: str) -> Invoice:
        """Create invoice record for the uploaded file."""
        try:
            invoice = Invoice(
                name=session["filename"],
                source_id=session["upload_id"],  # Use upload_id as source_id
                size=session["total_size"],
                account_id=session["account_id"],
                content_type=session["content_type"],
                source="large_file_upload",
                last_executed_step=2,  # Mark as uploaded
                # Add GCS path as additional metadata
                gcs_path=gcs_blob_name
            )
            
            await invoice.insert()
            logger.info(f"Created invoice record {invoice.id} for uploaded file")
            return invoice
            
        except Exception as e:
            logger.error(f"Failed to create invoice record: {e}")
            raise
    
    async def _cleanup_temp_files(self, session: Dict[str, Any]):
        """Clean up temporary files for an upload session."""
        try:
            for file_path in session.get("temp_files", []):
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.debug(f"Removed temp file {file_path}")
            
            # Also remove assembled file
            upload_id = session["upload_id"]
            filename = session["filename"]
            final_filename = f"{upload_id}_{filename}"
            final_path = os.path.join(self.temp_dir, final_filename)
            
            if os.path.exists(final_path):
                os.remove(final_path)
                logger.debug(f"Removed assembled file {final_path}")
                
        except Exception as e:
            logger.error(f"Failed to cleanup temp files: {e}")
    
    async def get_upload_status(self, upload_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of an upload session."""
        try:
            session = self.upload_sessions.get(upload_id)
            if not session:
                return None
            
            return {
                "upload_id": upload_id,
                "filename": session["filename"],
                "total_size": session["total_size"],
                "uploaded_chunks": session["uploaded_chunks"],
                "total_chunks": session["total_chunks"],
                "completed": session["completed"],
                "created_at": session["created_at"],
                "expires_at": session["expires_at"],
                "progress_percent": (session["uploaded_chunks"] / session["total_chunks"] * 100) if session["total_chunks"] > 0 else 0,
                "file_url": f"gs://{self.bucket_name}/{session['final_blob_name']}" if session.get("final_blob_name") else None,
                "invoice_id": session.get("invoice_id")
            }
            
        except Exception as e:
            logger.error(f"Failed to get upload status for {upload_id}: {e}")
            return None
    
    async def cancel_upload(self, upload_id: str) -> bool:
        """Cancel an upload session and clean up resources."""
        try:
            session = self.upload_sessions.get(upload_id)
            if not session:
                return False
            
            # Clean up temp files
            await self._cleanup_temp_files(session)
            
            # Remove session
            del self.upload_sessions[upload_id]
            
            logger.info(f"Cancelled upload session {upload_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel upload {upload_id}: {e}")
            return False
    
    async def cleanup_upload_session(self, upload_id: str) -> bool:
        """Clean up an upload session (same as cancel for now)."""
        return await self.cancel_upload(upload_id)
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired upload sessions."""
        try:
            current_time = datetime.now(timezone.utc)
            expired_sessions = []
            
            for upload_id, session in self.upload_sessions.items():
                if current_time > session["expires_at"]:
                    expired_sessions.append(upload_id)
            
            cleaned_count = 0
            for upload_id in expired_sessions:
                if await self.cleanup_upload_session(upload_id):
                    cleaned_count += 1
            
            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} expired upload sessions")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired sessions: {e}")
            return 0
    
    async def get_active_uploads_for_account(self, account_id: int) -> List[Dict[str, Any]]:
        """Get all active upload sessions for an account."""
        try:
            active_uploads = []
            
            for upload_id, session in self.upload_sessions.items():
                if session["account_id"] == account_id and not session["completed"]:
                    status = await self.get_upload_status(upload_id)
                    if status:
                        active_uploads.append(status)
            
            return active_uploads
            
        except Exception as e:
            logger.error(f"Failed to get active uploads for account {account_id}: {e}")
            return []


# Global service instance (will be initialized with storage client)
large_file_service: Optional[LargeFileUploadService] = None 