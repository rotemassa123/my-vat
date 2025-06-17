# Simple Authentication Setup (Service Account)

## Why Service Account vs OAuth?

| Method | OAuth 2.0 | Service Account |
|--------|-----------|-----------------|
| **Setup** | Complex (browser flow) | Simple (JSON key file) |
| **User Interaction** | Required (browser) | None needed |
| **Access** | User's personal files | Shared files only |
| **Best For** | Personal Drive access | Automation/shared drives |

## Service Account Setup (Recommended for Local Dev)

### 1. Create Service Account

```bash
# 1. Go to Google Cloud Console
# 2. APIs & Services → Credentials
# 3. Create Credentials → Service Account
# 4. Download JSON key file
```

### 2. Share Drive Folder with Service Account

```bash
# 1. Get service account email from JSON file (looks like: xyz@project.iam.gserviceaccount.com)
# 2. In Google Drive: Right-click folder → Share
# 3. Add service account email with "Viewer" permissions
# 4. Copy folder ID from Drive URL
```

### 3. Environment Setup

```bash
# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcs-service-account.json"
export GOOGLE_DRIVE_SERVICE_ACCOUNT="/path/to/drive-service-account.json"
```

### 4. Use Service Account Version

Modify `app.py` to use the simpler service account:

```python
# Replace OAuth DriveService with Service Account version
from services_simple_auth import DriveServiceAccount

# In app.py initialization:
drive_service = DriveServiceAccount()
if drive_service.authenticate(config.DRIVE_SERVICE_ACCOUNT_FILE):
    logger.info("Drive service account authenticated successfully")
else:
    logger.warning("Drive service account authentication failed")
```

### 5. Update Config

Add to `config.py`:

```python
DRIVE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_DRIVE_SERVICE_ACCOUNT", "drive-service-account.json")
```

## Benefits of Service Account Approach

✅ **No browser needed** - perfect for automation
✅ **Simpler setup** - just JSON key files  
✅ **No token refresh** - credentials don't expire
✅ **Better for CI/CD** - no interactive flow
✅ **More secure** - no user tokens stored

## Limitations

⚠️ **Only shared files** - can't access user's private files  
⚠️ **Must share folders** - service account needs explicit access  
⚠️ **No personal Drive** - can't browse user's personal files

## Quick Test

```bash
# 1. Share a Drive folder with your service account email
# 2. Set environment variables
# 3. Start server with service account version
python3 run.py

# 4. Test
curl -X POST "http://localhost:8000/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "drive_folder_id": "your_shared_folder_id",
    "account_id": "test_user", 
    "bucket_name": "your-bucket"
  }'
```

This approach is **much simpler** and better for automation! 🚀 