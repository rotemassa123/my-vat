# Service Account Setup - Local & Cloud

**Service accounts work perfectly for BOTH local development and cloud deployment!** ✨

## Why Service Accounts Everywhere?

| Scenario | OAuth 2.0 | Service Account |
|----------|-----------|-----------------|
| **Local Dev** | ❌ Browser popups, token refresh | ✅ Simple JSON key |
| **Cloud Run** | ❌ Complex pre-auth setup | ✅ Automatic authentication |
| **CI/CD** | ❌ No browser available | ✅ Perfect for automation |
| **Security** | ⚠️ User tokens can expire | ✅ Long-term credentials |

## Setup Process

### 1. Create Service Accounts in Google Cloud Console

```bash
# 1. Go to Google Cloud Console → IAM & Admin → Service Accounts
# 2. Create TWO service accounts:

# For Google Cloud Storage
gcloud iam service-accounts create gcs-uploader \
  --display-name "GCS Upload Service Account"

# For Google Drive  
gcloud iam service-accounts create drive-reader \
  --display-name "Google Drive Reader Service Account"
```

### 2. Set Permissions

```bash
PROJECT_ID="your-project-id"

# GCS service account - Storage Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gcs-uploader@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Drive service account - just needs Drive API access (set via file sharing)
```

### 3. Download Key Files

```bash
# Download GCS service account key
gcloud iam service-accounts keys create gcs-service-account.json \
  --iam-account=gcs-uploader@$PROJECT_ID.iam.gserviceaccount.com

# Download Drive service account key  
gcloud iam service-accounts keys create drive-service-account.json \
  --iam-account=drive-reader@$PROJECT_ID.iam.gserviceaccount.com
```

### 4. Share Drive Folders

```bash
# 1. Get Drive service account email
DRIVE_SA_EMAIL=$(grep '"client_email"' drive-service-account.json | cut -d '"' -f 4)
echo "Share your Drive folders with: $DRIVE_SA_EMAIL"

# 2. In Google Drive:
#    - Right-click folder → Share
#    - Add service account email with "Viewer" permission
#    - Copy folder ID from URL
```

## Local Development Setup

### Environment Variables
```bash
# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcs-service-account.json"
export GOOGLE_DRIVE_SERVICE_ACCOUNT="$(pwd)/drive-service-account.json"

# Optional: Add to ~/.zshrc or ~/.bashrc for persistence
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcs-service-account.json"' >> ~/.zshrc
echo 'export GOOGLE_DRIVE_SERVICE_ACCOUNT="/path/to/drive-service-account.json"' >> ~/.zshrc
```

### Start Server
```bash
# Install dependencies
source .venv/bin/activate
pip install -r requirements.txt

# Start server
python3 run.py
```

### Test Locally
```bash
# Health check
curl http://localhost:8000/health

# Drive auth status (should show service account email)
curl http://localhost:8000/drive/auth

# Upload test
curl -X POST "http://localhost:8000/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "drive_folder_id": "your_shared_folder_id",
    "account_id": "test_user",
    "bucket_name": "your-test-bucket"
  }'
```

## Cloud Run Deployment

### Updated Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy service account key (for Drive API)
COPY drive-service-account.json .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "run.py"]
```

### Deploy to Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/drive-to-cloud

gcloud run deploy drive-to-cloud \
  --image gcr.io/$PROJECT_ID/drive-to-cloud \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --service-account gcs-uploader@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_DRIVE_SERVICE_ACCOUNT=drive-service-account.json
```

### Cloud Run Benefits
- **GCS authentication**: Automatic via attached service account ✅
- **Drive authentication**: Uses included JSON key file ✅  
- **No browser needed**: Perfect for serverless ✅
- **Scalable**: Handles concurrent requests ✅

## Testing Both Environments

### Local Test Script
```python
# quick_test_service_account.py
import requests
import json

# Test both local and cloud
endpoints = [
    "http://localhost:8000",  # Local
    "https://your-service-url"  # Cloud Run
]

for endpoint in endpoints:
    print(f"\n🧪 Testing {endpoint}")
    
    # Health check
    health = requests.get(f"{endpoint}/health").json()
    print(f"   GCS: {health.get('gcs_client')}")
    print(f"   Drive: {health.get('drive_client')}")
    
    # Auth check  
    auth = requests.get(f"{endpoint}/drive/auth").json()
    print(f"   Authenticated: {auth.get('authenticated')}")
    print(f"   Email: {auth.get('user_email')}")
```

## Advantages of This Approach

✅ **Consistent everywhere** - same auth method local & cloud
✅ **No OAuth complexity** - no browser flows or token refresh  
✅ **Better security** - service accounts vs user tokens
✅ **Easier CI/CD** - works in automated environments
✅ **Simpler deployment** - no pre-authentication needed
✅ **More reliable** - fewer moving parts to break

## File Structure
```
project/
├── gcs-service-account.json      # GCS access
├── drive-service-account.json    # Drive access  
├── app.py                        # Uses service accounts
├── services_simple_auth.py       # Service account Drive service
├── services.py                   # Upload logic
└── routes.py                     # API endpoints
```

This approach eliminates all the OAuth complexity and works seamlessly in both environments! 🚀 