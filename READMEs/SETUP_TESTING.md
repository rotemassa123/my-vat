# Testing Setup Guide

## Prerequisites for Real Testing

### 1. Google Cloud Console Setup

#### For Google Drive API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Desktop Application**
6. Download the JSON file and save as `credentials.json` in project root

#### For Google Cloud Storage:
1. In the same project, enable **Cloud Storage API**
2. Go to **IAM & Admin** → **Service Accounts**
3. Create a service account with **Storage Admin** role
4. Download the JSON key file
5. Set environment variable: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"`

### 2. Create Test Resources

#### Google Drive Test Folder:
1. Create a folder in your Google Drive
2. Add some test files (mix of small <1MB and larger files)
3. Get the folder ID from URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`

#### GCS Test Bucket:
```bash
# Create a test bucket
gsutil mb gs://your-test-bucket-name-unique

# Or via Cloud Console: Storage → Buckets → Create
```

### 3. Local Testing Setup

```bash
# 1. Install dependencies
source .venv/bin/activate
pip install -r requirements.txt

# 2. Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/gcs-service-account.json"
export GOOGLE_DRIVE_CREDENTIALS="credentials.json"

# 3. Start server
python3 run.py
```

### 4. First Run Authentication

When you start the server the first time:
1. Server will open browser automatically
2. Login with your Google account
3. Grant permissions to access Google Drive
4. Browser will show "The authentication flow has completed"
5. `token.json` file will be created automatically

### 5. Test with Real Data

Update `test_upload.py` with your real values:

```python
TEST_DRIVE_FOLDER_ID = "your_actual_folder_id_here"
TEST_BUCKET_NAME = "your-test-bucket-name"
```

Then run:
```bash
python3 test_upload.py
```

### 6. Manual API Testing

```bash
# Health check
curl http://localhost:8000/health

# Drive auth status
curl http://localhost:8000/drive/auth

# Real upload test
curl -X POST "http://localhost:8000/upload" \
     -H "Content-Type: application/json" \
     -d '{
       "drive_folder_id": "your_folder_id",
       "account_id": "test_user",
       "bucket_name": "your-test-bucket"
     }'
```

### 7. Docker Testing (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "run.py"]
```

Build and run:
```bash
# Build
docker build -t drive-to-cloud .

# Run with credentials mounted
docker run -p 8000:8000 \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  -v $(pwd)/gcs-key.json:/app/gcs-key.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/gcs-key.json \
  -e GOOGLE_DRIVE_CREDENTIALS=/app/credentials.json \
  drive-to-cloud
```

## Troubleshooting

### Common Issues:

1. **"Drive service not authenticated"**
   - Make sure `credentials.json` exists
   - Delete `token.json` and restart to re-authenticate

2. **"GCS client not initialized"**
   - Check `GOOGLE_APPLICATION_CREDENTIALS` path
   - Verify service account has Storage Admin role

3. **"Invalid folder ID"**
   - Extract folder ID from Drive URL correctly
   - Ensure folder is accessible by authenticated account

4. **Permission errors**
   - Make sure authenticated Google account has access to the Drive folder
   - Check GCS bucket permissions

### Debug Mode:
Set `LOG_LEVEL=DEBUG` in environment for detailed logging. 