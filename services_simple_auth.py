"""
Alternative DriveService using Service Account authentication.
Simpler than OAuth - no browser interaction needed.
"""
import os
import tempfile
import logging
from typing import List, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

from models import DriveFileInfo

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

class DriveServiceAccount:
    """Google Drive service using Service Account authentication."""
    
    def __init__(self):
        self.service = None
        self.authenticated = False
    
    def authenticate(self, service_account_file: str) -> bool:
        """
        Authenticate using service account key file.
        Much simpler than OAuth - no browser needed!
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
            
            # Build Drive service
            self.service = build('drive', 'v3', credentials=credentials)
            self.authenticated = True
            
            # Test authentication
            try:
                about = self.service.about().get(fields="user").execute()
                user_email = about.get('user', {}).get('emailAddress', 'Service Account')
                logger.info(f"Successfully authenticated as: {user_email}")
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
        """Download a file to temporary location."""
        if not self.authenticated:
            logger.error("Drive service not authenticated")
            return None
        
        try:
            # Create temporary file
            temp_fd, temp_path = tempfile.mkstemp(suffix=f"_{file_info.name}")
            
            # Download file content
            request = self.service.files().get_media(fileId=file_info.id)
            
            with os.fdopen(temp_fd, 'wb') as temp_file:
                downloader = MediaIoBaseDownload(temp_file, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
            
            logger.debug(f"Downloaded {file_info.name} to {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Failed to download file {file_info.name}: {e}")
            if 'temp_path' in locals():
                try:
                    os.unlink(temp_path)
                except:
                    pass
            return None 