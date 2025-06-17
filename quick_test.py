#!/usr/bin/env python3
"""
Quick test script to verify Google Drive to GCS functionality.
Run this after setting up credentials to verify everything works.
"""
import requests
import json
import time
import os
from pathlib import Path

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_step(step, message):
    print(f"{Colors.BLUE}{Colors.BOLD}[{step}]{Colors.END} {message}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def check_credentials():
    """Check if credential files exist."""
    print_step("1", "Checking credential files...")
    
    credentials_exist = Path("credentials.json").exists()
    if credentials_exist:
        print_success("credentials.json found")
    else:
        print_error("credentials.json not found")
        print("   Create OAuth credentials in Google Cloud Console")
        print("   Download as 'credentials.json' in project root")
    
    gcs_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if gcs_env and Path(gcs_env).exists():
        print_success(f"GCS credentials found: {gcs_env}")
    else:
        print_warning("GCS credentials not set or file missing")
        print("   Set GOOGLE_APPLICATION_CREDENTIALS environment variable")
    
    return credentials_exist

def test_server_running():
    """Test if server is running."""
    print_step("2", "Testing server connection...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_success("Server is running")
            return True
        else:
            print_error(f"Server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Server is not running")
        print("   Start server with: python3 run.py")
        return False
    except Exception as e:
        print_error(f"Error connecting to server: {e}")
        return False

def test_authentication():
    """Test authentication status."""
    print_step("3", "Checking authentication status...")
    
    try:
        # Check health
        health_response = requests.get("http://localhost:8000/health")
        health_data = health_response.json()
        
        gcs_status = health_data.get('gcs_client', 'unknown')
        drive_status = health_data.get('drive_client', 'unknown')
        
        print(f"   GCS Client: {gcs_status}")
        print(f"   Drive Client: {drive_status}")
        
        # Check Drive auth specifically
        auth_response = requests.get("http://localhost:8000/drive/auth")
        auth_data = auth_response.json()
        
        if auth_data.get('authenticated'):
            user_email = auth_data.get('user_email', 'Unknown')
            print_success(f"Google Drive authenticated for: {user_email}")
            return True
        else:
            error_msg = auth_data.get('error', 'Unknown error')
            print_error(f"Google Drive not authenticated: {error_msg}")
            print("   If first time: restart server to trigger OAuth flow")
            print("   If token expired: delete token.json and restart")
            return False
            
    except Exception as e:
        print_error(f"Error checking authentication: {e}")
        return False

def get_test_folder_id():
    """Get test folder ID from user."""
    print_step("4", "Getting test Drive folder...")
    
    folder_id = input("Enter Google Drive folder ID (or press Enter to skip): ").strip()
    
    if not folder_id:
        print_warning("No folder ID provided - will use example ID")
        print("   To get real folder ID:")
        print("   1. Open folder in Google Drive")
        print("   2. Copy ID from URL: drive.google.com/drive/folders/{FOLDER_ID}")
        return "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"  # Example
    
    return folder_id

def get_test_bucket():
    """Get test bucket name from user."""
    bucket_name = input("Enter GCS bucket name (or press Enter for default): ").strip()
    
    if not bucket_name:
        print_warning("No bucket name provided - using default")
        return "my-test-bucket"
    
    return bucket_name

def test_upload(folder_id, bucket_name):
    """Test the upload functionality."""
    print_step("5", "Testing upload functionality...")
    
    payload = {
        "drive_folder_id": folder_id,
        "account_id": 123,
        "bucket_name": bucket_name,
        "include_subfolders": True
    }
    
    print(f"   Testing with folder ID: {folder_id}")
    print(f"   Testing with bucket: {bucket_name}")
    
    try:
        response = requests.post(
            "http://localhost:8000/upload",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Upload request processed successfully!")
            print(f"   📁 Total files found: {result.get('total_files_found', 0)}")
            print(f"   ✨ Eligible files: {result.get('eligible_files', 0)}")
            print(f"   ✅ Successful uploads: {result.get('successful_uploads', 0)}")
            print(f"   ❌ Failed uploads: {result.get('failed_uploads', 0)}")
            print(f"   ⏱️  Processing time: {result.get('processing_time_seconds', 0):.2f}s")
            
            # Show some upload details
            upload_details = result.get('upload_details', [])
            if upload_details:
                print("   📋 First few results:")
                for detail in upload_details[:3]:
                    status = "✅" if detail['status'] == 'success' else "❌"
                    print(f"      {status} {detail['drive_file_name']}: {detail['status']}")
                    if detail.get('error'):
                        print(f"         Error: {detail['error']}")
            
            return result.get('successful_uploads', 0) > 0
            
        else:
            print_error(f"Upload failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Upload request timed out")
        print("   This might be normal for large folders")
        return False
    except Exception as e:
        print_error(f"Upload test failed: {e}")
        return False

def main():
    print(f"{Colors.BOLD}🚀 Drive to Cloud - Quick Test{Colors.END}")
    print("=" * 50)
    
    # Run tests
    creds_ok = check_credentials()
    if not creds_ok:
        print("\n❌ Missing credentials - please set up authentication first")
        return
    
    server_ok = test_server_running()
    if not server_ok:
        return
    
    auth_ok = test_authentication()
    if not auth_ok:
        print("\n❌ Authentication failed - please check setup")
        return
    
    # Get test parameters
    folder_id = get_test_folder_id()
    bucket_name = get_test_bucket()
    
    # Test upload
    upload_ok = test_upload(folder_id, bucket_name)
    
    print("\n" + "=" * 50)
    if upload_ok:
        print_success("🎉 All tests passed! System is working correctly.")
    else:
        print_warning("⚠️  Upload test had issues - check configuration")
    
    print("\n💡 Next steps:")
    print("   - Update test_upload.py with your real folder ID and bucket")
    print("   - Check Cloud Run deployment guide for production")
    print("   - Review SETUP_TESTING.md for detailed configuration")

if __name__ == "__main__":
    main() 