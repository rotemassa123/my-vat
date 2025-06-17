"""
Google Drive service using Service Account authentication.
"""
import os
import tempfile
import logging
import time
import ssl
import threading
from http.client import IncompleteRead
from typing import List, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError
import io

from models import DriveFileInfo
from config import config

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Thread-local storage for drive services
_thread_local = threading.local()

def create_drive_service(service_account_file: str = None) -> Optional['DriveService']:
    """
    Factory function to create a new DriveService instance for each worker.
    This ensures thread-safety by avoiding shared httplib2 connections.
    """
    if service_account_file is None:
        service_account_file = config.DRIVE_SERVICE_ACCOUNT_FILE
    
    try:
        if not os.path.exists(service_account_file):
            logger.error(f"Service account file not found: {service_account_file}")
            return None
        
        # Create new service instance for this worker
        drive_service = DriveService()
        if drive_service.authenticate(service_account_file):
            logger.debug(f"Created new DriveService instance for worker thread {threading.current_thread().name}")
            return drive_service
        else:
            logger.error("Failed to authenticate new DriveService instance")
            return None
            
    except Exception as e:
        logger.error(f"Failed to create DriveService instance: {e}")
        return None

def get_thread_drive_service(service_account_file: str = None) -> Optional['DriveService']:
    """
    Get a thread-local DriveService instance. Creates one per worker thread.
    This ensures each worker has its own service without sharing httplib2 connections.
    """
    # Check if this thread already has a drive service
    if not hasattr(_thread_local, 'drive_service'):
        # Create new service for this worker thread
        _thread_local.drive_service = create_drive_service(service_account_file)
        if _thread_local.drive_service:
            logger.debug(f"Initialized thread-local DriveService for worker {threading.current_thread().name}")
    
    return getattr(_thread_local, 'drive_service', None)

class DriveService:
    """Google Drive service using Service Account authentication - no OAuth needed!"""
    
    def __init__(self):
        self.service = None
        self.authenticated = False
    
    def authenticate(self, service_account_file: str) -> bool:
        """
        Authenticate using service account key file.
        Much simpler than OAuth - no browser interaction needed!
        """
        try:
            if not os.path.exists(service_account_file):
                logger.error(f"Service account file not found: {service_account_file}")
                return False
            
            # Load service account credentials
            credentials = service_account.Credentials.from_service_account_file(
                service_account_file,
                scopes=SCOPES
            )
            
            # Build Drive service - each instance gets its own httplib2 client
            self.service = build('drive', 'v3', credentials=credentials)
            self.authenticated = True
            
            # Test authentication
            try:
                about = self.service.about().get(fields="user").execute()
                user_email = about.get('user', {}).get('emailAddress', 'Service Account')
                logger.debug(f"Successfully authenticated DriveService as: {user_email}")
                return True
            except Exception as e:
                logger.error(f"Service account authentication test failed: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to authenticate with service account: {e}")
            return False
    
    def get_user_info(self) -> dict:
        """Get service account info."""
        if not self.authenticated or not self.service:
            return {"authenticated": False, "error": "Service not authenticated"}
        
        try:
            about = self.service.about().get(fields="user").execute()
            return {
                "authenticated": True,
                "user_email": about.get('user', {}).get('emailAddress', 'Service Account'),
                "auth_type": "service_account"
            }
        except Exception as e:
            return {"authenticated": False, "error": str(e)}
    
    def find_folder_by_name(self, folder_name: str) -> Optional[str]:
        """Find folder ID by folder name. Returns the first match."""
        if not self.authenticated:
            logger.error("Drive service not authenticated")
            return None
        
        try:
            # Search for folders with the exact name
            query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            
            results = self.service.files().list(
                q=query,
                pageSize=10,
                fields="files(id, name, parents)"
            ).execute()
            
            items = results.get('files', [])    
            
            if not items:
                logger.warning(f"No folder found with name: {folder_name}")
                return None
            
            if len(items) > 1:
                logger.warning(f"Multiple folders found with name '{folder_name}'. Using the first one.")
                for i, item in enumerate(items):
                    logger.info(f"  {i+1}. Folder ID: {item['id']}, Name: {item['name']}")
            
            folder_id = items[0]['id']
            logger.info(f"Found folder '{folder_name}' with ID: {folder_id}")
            return folder_id
            
        except Exception as e:
            logger.error(f"Error searching for folder '{folder_name}': {e}")
            return None
    
    def get_files_in_folder(self, folder_id: str, include_subfolders: bool = True) -> List[DriveFileInfo]:
        """Get all files in a Drive folder using service account."""
        if not self.authenticated:
            logger.error("Drive service not authenticated")
            return []
        
        files = []
        try:
            files.extend(self._get_files_recursive(folder_id, include_subfolders))
            logger.info(f"Found {len(files)} files in Drive folder {folder_id}")
            return files
        except Exception as e:
            logger.error(f"Error getting files from folder {folder_id}: {e}")
            return []
    
    def _get_files_recursive(self, folder_id: str, include_subfolders: bool) -> List[DriveFileInfo]:
        """Recursively get files from folder."""
        files = []
        page_token = None
        
        while True:
            try:
                query = f"'{folder_id}' in parents and trashed=false"
                
                results = self.service.files().list(
                    q=query,
                    pageSize=100,
                    pageToken=page_token,
                    fields="nextPageToken, files(id, name, size, mimeType, parents)"
                ).execute()
                
                items = results.get('files', [])
                
                for item in items:
                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        # It's a folder
                        if include_subfolders:
                            files.extend(self._get_files_recursive(item['id'], True))
                    else:
                        # It's a file
                        size = int(item.get('size', 0)) if item.get('size') else 0
                        files.append(DriveFileInfo(
                            id=item['id'],
                            name=item['name'],
                            size=size,
                            mime_type=item['mimeType']
                        ))
                
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
                    
            except Exception as e:
                logger.error(f"Error in recursive file listing: {e}")
                break
        
        return files
    
    def download_file(self, file_info: DriveFileInfo) -> Optional[str]:
        """Download a file to temporary location with retry logic and chunked downloads."""
        if not self.authenticated:
            logger.error("Drive service not authenticated")
            return None
        
        temp_path = None
        
        for attempt in range(config.MAX_DOWNLOAD_RETRIES):
            try:
                # Create temporary file
                temp_fd, temp_path = tempfile.mkstemp(suffix=f"_{file_info.name}")
                
                # Download file content with chunking
                request = self.service.files().get_media(fileId=file_info.id)
                
                with os.fdopen(temp_fd, 'wb') as temp_file:
                    downloader = MediaIoBaseDownload(
                        temp_file, 
                        request,
                        chunksize=config.CHUNK_SIZE_BYTES
                    )
                    done = False
                    while done is False:
                        status, done = downloader.next_chunk()
                        if status:
                            progress = int(status.progress() * 100)
                            if progress % 25 == 0:  # Log every 25%
                                logger.debug(f"Download progress for {file_info.name}: {progress}%")
                
                logger.debug(f"Downloaded {file_info.name} to {temp_path}")
                return temp_path
                
            except (ConnectionError, OSError, TimeoutError, HttpError, IncompleteRead, ssl.SSLError) as e:
                attempt_num = attempt + 1
                if attempt_num < config.MAX_DOWNLOAD_RETRIES:
                    # Exponential backoff: 1s, 2s, 4s
                    wait_time = 2 ** attempt
                    logger.warning(f"Download attempt {attempt_num} failed for {file_info.name}: {e}")
                    logger.info(f"Retrying in {wait_time} seconds... (attempt {attempt_num + 1}/{config.MAX_DOWNLOAD_RETRIES})")
                    
                    # Clean up failed temp file
                    if temp_path and os.path.exists(temp_path):
                        try:
                            os.unlink(temp_path)
                        except:
                            pass
                    
                    time.sleep(wait_time)
                else:
                    logger.error(f"Failed to download file {file_info.name} after {config.MAX_DOWNLOAD_RETRIES} attempts: {e}")
                    
            except Exception as e:
                logger.error(f"Unexpected error downloading file {file_info.name}: {e}")
                break
        
        # Clean up on final failure
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        
        return None 