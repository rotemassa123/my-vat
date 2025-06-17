# Google Drive to Cloud Storage Upload Server

A FastAPI server that uploads files from Google Drive folders to Google Cloud Storage buckets with concurrent processing using **Service Account authentication** (no OAuth web flow needed!).

## Features

- 🚀 **Google Drive Integration**: Upload files directly from Google Drive folders
- ☁️ **Google Cloud Storage**: Secure upload to GCS buckets
- ⚡ **Concurrent Processing**: Upload multiple files simultaneously (configurable workers)
- 📏 **File Size Filtering**: Only process files under specified size limit
- 🔐 **Service Account Authentication**: No browser interaction needed - fully automated!
- 📊 **Detailed Reporting**: Complete upload status and error reporting
- 🏥 **Health Monitoring**: Built-in health check endpoints

## Quick Start

### 1. Setup Google APIs

#### Google Cloud Storage
1. Create a service account in Google Cloud Console
2. Grant it **Storage Admin** role
3. Download the service account key JSON file
4. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

#### Google Drive API (Service Account)
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create a **Service Account** (not OAuth 2.0!)
3. Download the service account key JSON file
4. Enable Google Drive API for your project
5. **Important**: Share your Google Drive folders with the service account email

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `env.example` to `.env` and update:

```bash
cp env.example .env
```

Edit `.env` with your settings:
```env
# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=path/to/gcs-service-account.json
GCS_DEFAULT_BUCKET=your-bucket-name

# Google Drive Service Account (no OAuth needed!)
GOOGLE_DRIVE_SERVICE_ACCOUNT=path/to/drive-service-account.json

# Upload settings
MAX_FILE_SIZE_MB=1
MAX_WORKERS=10
```

### 4. Share Drive Folders

**Critical Step**: Share your Google Drive folders with the service account email:
1. Open your Google Drive folder
2. Click "Share" 
3. Add the service account email (found in the JSON key file)
4. Give it "Viewer" permissions

### 5. Run Server

```bash
python run.py
```

Or with uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

**No authentication flow needed!** The server automatically authenticates using the service account.

## API Endpoints

### Upload Files
```http
POST /upload
Content-Type: application/json

{
    "drive_folder_id": "1ABC123...",
    "account_id": 123,
    "bucket_name": "my-gcs-bucket",
    "include_subfolders": true
}
```

### Health Check
```http
GET /health
```

### Drive Authentication Status
```http
GET /drive/auth
```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCS service account key | Required |
| `GCS_DEFAULT_BUCKET` | Default GCS bucket name | Optional |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | Path to Drive service account key | Required |
| `MAX_FILE_SIZE_MB` | Maximum file size to process | `1` |
| `MAX_WORKERS` | Concurrent upload workers | `10` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Service Account Setup

### Why Service Accounts?
- ✅ **No browser interaction** - perfect for servers and automation
- ✅ **No OAuth flow** - authenticate directly with JSON key
- ✅ **More secure** - no user tokens to manage
- ✅ **Programmatic access** - ideal for production environments

### Setup Steps:
1. **Create Service Account**: Google Cloud Console → IAM & Admin → Service Accounts
2. **Download JSON Key**: Create and download the private key
3. **Enable APIs**: Enable Google Drive API and Google Cloud Storage API
4. **Share Folders**: Share Drive folders with the service account email
5. **Set Permissions**: Grant appropriate GCS bucket permissions

## File Processing

- Only files under `MAX_FILE_SIZE_MB` are processed
- Files are uploaded to: `gs://bucket-name/account-id/filename`
- Concurrent processing with configurable worker threads
- Automatic cleanup of temporary files
- Detailed success/failure reporting

## Error Handling

- Comprehensive error logging
- Graceful handling of authentication failures
- Automatic retry logic for transient failures
- Detailed error reporting in API responses

## Development

### Project Structure
```
├── app.py              # FastAPI application setup
├── routes.py           # API endpoints
├── services.py         # Business logic (with DriveService)
├── models.py           # Data models
├── config.py           # Configuration
├── requirements.txt    # Dependencies
└── tests/
    └── test_upload.py  # Test utilities
```

### Testing

```bash
python test_upload.py
```

## Security Notes

- Service account keys should be kept secure and never committed to version control
- Use IAM roles with minimal required permissions
- Consider using Google Cloud Run for production deployment
- Regularly rotate service account keys

## Troubleshooting

### Authentication Issues
- Ensure service account JSON key is valid
- Check that Google Drive API is enabled
- Verify service account has necessary permissions
- **Make sure Drive folders are shared with service account email**

### Upload Failures
- Check GCS bucket permissions
- Verify file size limits
- Review server logs for detailed error messages
- Ensure service account has Storage Admin role

### Performance
- Adjust `MAX_WORKERS` based on your system capabilities
- Monitor memory usage with large files
- Consider implementing file streaming for very large files

## Advantages of Service Account Authentication

| Feature | OAuth 2.0 | Service Account |
|---------|-----------|-----------------|
| Browser needed | ✅ Yes | ❌ No |
| User interaction | ✅ Required | ❌ None |
| Token management | ✅ Complex | ❌ Simple |
| Server automation | ❌ Difficult | ✅ Perfect |
| Production ready | ⚠️ Challenging | ✅ Ideal |