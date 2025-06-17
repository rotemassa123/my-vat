#!/usr/bin/env python3
"""
Test script for the Google Drive to GCS upload server.
"""
import requests
import json
import os
from pathlib import Path

# Configuration
SERVER_URL = "http://localhost:8000"
TEST_DRIVE_FOLDER_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"  # Replace with your Drive folder ID
TEST_ACCOUNT_ID = 123  # Changed from string to integer
TEST_BUCKET_NAME = "my-test-bucket"

def test_health_endpoint():
    """Test the health endpoint."""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/health")
        print(f"✅ Health check status: {response.status_code}")
        result = response.json()
        print(f"   Response: {result}")
        
        # Show service status
        gcs_status = "🟢" if result.get('gcs_client') == 'connected' else "🔴"
        drive_status = "🟢" if result.get('drive_client') == 'connected' else "🔴"
        print(f"   GCS Client: {gcs_status} {result.get('gcs_client', 'unknown')}")
        print(f"   Drive Client: {drive_status} {result.get('drive_client', 'unknown')}")
        
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running!")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_drive_auth():
    """Test the Google Drive authentication endpoint."""
    print("\n🔐 Testing Drive authentication...")
    try:
        response = requests.get(f"{SERVER_URL}/drive/auth")
        print(f"   Auth check status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('authenticated'):
                print(f"✅ Drive authenticated for: {result.get('user_email', 'Unknown user')}")
                return True
            else:
                print(f"❌ Drive not authenticated: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Auth check failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Drive auth test failed: {e}")
        return False

def test_upload_endpoint():
    """Test the upload endpoint."""
    print("\n📤 Testing upload endpoint...")
    
    payload = {
        "drive_folder_id": TEST_DRIVE_FOLDER_ID,
        "account_id": TEST_ACCOUNT_ID,
        "bucket_name": TEST_BUCKET_NAME,
        "include_subfolders": True
    }
    
    print(f"   Drive Folder ID: {payload['drive_folder_id']}")
    print(f"   Account ID: {payload['account_id']}")
    print(f"   Bucket: {payload['bucket_name']}")
    print(f"   Include Subfolders: {payload['include_subfolders']}")
    
    try:
        response = requests.post(
            f"{SERVER_URL}/upload",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Upload response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload request processed successfully!")
            print(f"   📁 Total files found: {result['total_files_found']}")
            print(f"   ✨ Eligible files (≤1MB): {result['eligible_files']}")
            print(f"   ✅ Successful uploads: {result['successful_uploads']}")
            print(f"   ❌ Failed uploads: {result['failed_uploads']}")
            print(f"   ⏱️  Processing time: {result['processing_time_seconds']:.2f}s")
            
            # Show details of first few uploads
            if result['upload_details']:
                print("\n📋 Upload details (first 3):")
                for i, detail in enumerate(result['upload_details'][:3]):
                    status_emoji = "✅" if detail['status'] == 'success' else "❌"
                    print(f"   {status_emoji} {detail['drive_file_name']}: {detail['status']}")
                    if detail['error']:
                        print(f"      Error: {detail['error']}")
                    if detail['gcs_path']:
                        print(f"      GCS path: {detail['gcs_path']}")
                    print(f"      Size: {detail['file_size_bytes']} bytes")
                        
        else:
            print(f"❌ Upload failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Upload test failed: {e}")

def show_test_info():
    """Show information about the test setup."""
    print("\n📂 Test Configuration:")
    print(f"   Drive Folder ID: {TEST_DRIVE_FOLDER_ID}")
    print(f"   Account ID: {TEST_ACCOUNT_ID}")
    print(f"   Test Bucket: {TEST_BUCKET_NAME}")
    print(f"   Server URL: {SERVER_URL}")
    print("")
    print("💡 To use this test:")
    print("   1. Replace TEST_DRIVE_FOLDER_ID with your actual Google Drive folder ID")
    print("   2. Ensure you have proper Google Drive and GCS authentication")
    print("   3. Update TEST_BUCKET_NAME with your actual GCS bucket")

def main():
    print("🚀 Google Drive to GCS Upload Test Suite")
    print("=" * 50)
    
    # Show test configuration
    show_test_info()
    
    # Test health endpoint
    if not test_health_endpoint():
        print("\n💡 Start the server with: python3 run.py")
        return
    
    # Test Drive authentication
    drive_auth_ok = test_drive_auth()
    
    # Test upload endpoint
    test_upload_endpoint()
    
    print("\n🎯 Test completed!")
    print("\n💡 Notes:")
    if not drive_auth_ok:
        print("   - Google Drive authentication failed")
        print("   - Make sure credentials.json is in the project root")
        print("   - Follow the OAuth flow when starting the server")
    print("   - Upload requests will fail without valid GCS authentication")
    print("   - Make sure the Drive folder ID exists and is accessible")

if __name__ == "__main__":
    main() 