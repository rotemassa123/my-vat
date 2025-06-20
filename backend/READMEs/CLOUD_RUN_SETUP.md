# Google Cloud Run Deployment Guide

## Key Differences for Cloud Run

### Authentication Changes:

1. **GCS Authentication**: ✅ Simplified (uses attached service account)
2. **Google Drive Authentication**: ⚠️ Requires modification (no browser in Cloud Run)

## Solution: Pre-authenticated Token Approach

Since Cloud Run can't open browsers for OAuth, we need to pre-authenticate locally and deploy the token.

### Setup Process

#### 1. Local Pre-Authentication

```bash
# 1. Set up locally first (follow SETUP_TESTING.md)
python3 run.py
# Complete OAuth flow in browser
# This creates token.json

# 2. Verify authentication works
curl http://localhost:8000/drive/auth
```

#### 2. Modified Service for Cloud Run

Create `services_cloudrun.py` with non-interactive auth:

```python
def authenticate(self, token_file: str = 'token.json') -> bool:
    """Cloud Run compatible authentication - no browser interaction."""
    try:
        # Only try to load existing token
        if os.path.exists(token_file):
            self.creds = Credentials.from_authorized_user_file(token_file, SCOPES)
            
            # Try to refresh if expired
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
                
                # Save refreshed token
                with open(token_file, 'w') as token:
                    token.write(self.creds.to_json())
            
            if self.creds and self.creds.valid:
                self.service = build('drive', 'v3', credentials=self.creds)
                logger.info("Successfully authenticated with Google Drive API")
                return True
        
        logger.error("No valid token found for Cloud Run environment")
        return False
        
    except Exception as e:
        logger.error(f"Failed to authenticate with Google Drive: {e}")
        return False
```

#### 3. Cloud Run Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Copy pre-authenticated token (build-time)
COPY token.json .
COPY credentials.json .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Use non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["python", "run.py"]
```

#### 4. Environment Configuration

```bash
# Set environment variables for Cloud Run
export CLOUD_RUN_MODE=true
export LOG_LEVEL=INFO
# GCS authentication will use attached service account
```

#### 5. Cloud Run Deployment

```bash
# 1. Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/drive-to-cloud

# 2. Deploy to Cloud Run
gcloud run deploy drive-to-cloud \
  --image gcr.io/YOUR_PROJECT_ID/drive-to-cloud \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 10 \
  --max-instances 5 \
  --port 8000 \
  --service-account YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### 6. Service Account Setup

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create drive-to-cloud-runner

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:drive-to-cloud-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

## Alternative: Service Account for Drive API

For production use, consider using a service account for Drive API instead of OAuth:

### 1. Domain-Wide Delegation (Enterprise)

If you have a Google Workspace domain:

```python
# Service account with domain-wide delegation
from google.oauth2 import service_account

def authenticate_service_account(self, service_account_file: str, user_email: str):
    """Authenticate using service account with domain-wide delegation."""
    credentials = service_account.Credentials.from_service_account_file(
        service_account_file,
        scopes=SCOPES,
        subject=user_email  # Impersonate this user
    )
    self.service = build('drive', 'v3', credentials=credentials)
    return True
```

### 2. Shared Drive Access

Use a service account that has access to a shared drive:

```bash
# 1. Create service account
gcloud iam service-accounts create drive-reader

# 2. Get service account email
SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list \
  --filter="name:drive-reader" --format="value(email)")

# 3. Share your Drive folder with this service account email
# In Drive: Right-click folder → Share → Add SERVICE_ACCOUNT_EMAIL
```

## Production Deployment Checklist

### Security:
- [ ] Use least-privilege service accounts
- [ ] Enable VPC connector if needed
- [ ] Set up proper IAM roles
- [ ] Use Secret Manager for sensitive tokens
- [ ] Enable audit logging

### Reliability:
- [ ] Set appropriate memory/CPU limits
- [ ] Configure health checks
- [ ] Set up monitoring and alerting
- [ ] Implement graceful shutdown
- [ ] Handle token refresh properly

### Configuration:
- [ ] Environment-specific settings
- [ ] Proper logging configuration
- [ ] Error handling for Cloud Run limitations
- [ ] Timeout configurations

## Example Cloud Run YAML

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: drive-to-cloud
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/service-account: drive-to-cloud-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com
    spec:
      containerConcurrency: 10
      timeoutSeconds: 300
      containers:
      - image: gcr.io/YOUR_PROJECT_ID/drive-to-cloud
        ports:
        - containerPort: 8000
        env:
        - name: CLOUD_RUN_MODE
          value: "true"
        - name: LOG_LEVEL
          value: "INFO"
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
```

## Testing in Cloud Run

Once deployed:

```bash
# Get Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe drive-to-cloud \
  --region=us-central1 --format="value(status.url)")

# Test endpoints
curl $CLOUD_RUN_URL/health
curl $CLOUD_RUN_URL/drive/auth

# Test upload
curl -X POST "$CLOUD_RUN_URL/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "drive_folder_id": "your_folder_id",
    "account_id": "test_user",
    "bucket_name": "your-bucket"
  }'
```

The key insight is that Cloud Run requires **pre-authentication** for Google Drive since there's no browser available for the OAuth flow. 