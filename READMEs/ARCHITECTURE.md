# Architecture: Drive to Cloud

## Overview

This server provides a clean, modular architecture for transferring files from Google Drive to Google Cloud Storage with concurrent processing.

## Core Components

### 1. **Data Models** (`models.py`)
- `UploadRequest`: Request payload for Drive folder upload
- `DriveFileInfo`: Metadata for Google Drive files
- `UploadResult`: Response with upload statistics and details
- `HealthResponse`: System health status
- `DriveAuthResponse`: Google Drive authentication status

### 2. **Services Layer** (`services.py`)

#### `DriveService`
- **Authentication**: OAuth 2.0 flow with Google Drive API
- **File Discovery**: Recursive scanning of Drive folders
- **File Download**: Temporary download from Drive to local storage
- **Token Management**: Automatic token refresh and storage

#### `FileUploadService`
- **File Filtering**: Size-based eligibility checking
- **Concurrent Processing**: ThreadPoolExecutor-based uploads
- **GCS Integration**: File upload to Google Cloud Storage
- **Error Handling**: Comprehensive error tracking and reporting
- **Cleanup**: Automatic temporary file deletion

### 3. **API Routes** (`routes.py`)
- `POST /upload`: Drive folder to GCS transfer
- `GET /health`: System health and service status
- `GET /drive/auth`: Google Drive authentication status

### 4. **Configuration** (`config.py`)
- Environment variable management
- Service configuration
- Upload parameters
- Server settings

### 5. **Application Bootstrap** (`app.py`)
- Service initialization
- Dependency injection
- Error handling
- Logging configuration

## Data Flow

```
Google Drive Folder
        ↓
    DriveService (authenticate & list files)
        ↓
    File Filtering (size check)
        ↓
    Concurrent Processing:
    ┌─ Download from Drive ─┐
    │                      │
    ├─ Upload to GCS ──────┤
    │                      │
    └─ Cleanup temp files ─┘
        ↓
    Response with Results
```

## Authentication Flow

### Google Drive API
1. **Initial Setup**: OAuth 2.0 credentials from Google Cloud Console
2. **First Run**: Browser-based consent flow
3. **Token Storage**: Credentials saved to `token.json`
4. **Automatic Refresh**: Token refreshed when expired
5. **Scope**: Read-only access to Google Drive

### Google Cloud Storage
1. **Service Account**: JSON key file authentication
2. **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`
3. **Automatic Detection**: Uses Application Default Credentials

## Processing Workflow

1. **Request Validation**: Validate Drive folder ID, account ID, bucket name
2. **Authentication Check**: Verify both Drive and GCS authentication
3. **File Discovery**: 
   - List files in Drive folder (with optional subfolders)
   - Extract file metadata (size, name, ID, etc.)
4. **Filtering**: Apply size limits to determine eligible files
5. **Concurrent Upload**:
   - Create ThreadPoolExecutor with configurable workers
   - For each file: Download → Upload → Cleanup
   - Track success/failure for each operation
6. **Response Generation**: Compile detailed results

## Error Handling Strategy

### Service Level
- **DriveService**: Handle API quotas, authentication, network issues
- **FileUploadService**: Handle GCS errors, file I/O, concurrent execution
- **Configuration**: Validate environment variables and settings

### API Level
- **Input Validation**: Pydantic models for request validation
- **HTTP Status Codes**: Appropriate error responses
- **Error Details**: Structured error information in responses

### Logging Strategy
- **Structured Logging**: Consistent log format across components
- **Log Levels**: DEBUG, INFO, WARNING, ERROR
- **Context**: Request IDs, file names, operation details

## Scalability Considerations

### Concurrent Processing
- **ThreadPoolExecutor**: Configurable worker count (default: 10)
- **I/O Bound Operations**: Optimal for network operations
- **Resource Management**: Automatic cleanup and connection pooling

### Memory Management
- **Temporary Files**: Stream-based processing where possible
- **File Cleanup**: Automatic removal of temporary downloads
- **Connection Pooling**: Reuse of HTTP connections

### Rate Limiting
- **Google Drive API**: Built-in retry logic with exponential backoff
- **Google Cloud Storage**: Automatic retry and rate limiting

## Configuration Management

### Environment Variables
```bash
# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-key.json
GCS_DEFAULT_BUCKET=default-bucket

# Google Drive API
GOOGLE_DRIVE_CREDENTIALS=credentials.json
DRIVE_TOKEN_FILE=token.json

# Processing
MAX_FILE_SIZE_MB=1
MAX_WORKERS=10

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

### Dependency Injection
```python
# app.py initializes services
storage_client = storage.Client()
drive_service = DriveService()
upload_service = FileUploadService(storage_client, drive_service)

# Routes receive services via global variables
routes.storage_client = storage_client
routes.drive_service = drive_service
routes.upload_service = upload_service
```

## Security Architecture

### Authentication
- **OAuth 2.0**: Standard Google authentication flow
- **Service Account**: GCS access with minimal permissions
- **Token Storage**: Local file storage (secure in production)

### Data Handling
- **Temporary Files**: Automatic cleanup after processing
- **Read-Only Access**: Drive API limited to read operations
- **Least Privilege**: Minimal required permissions for all services

### Network Security
- **HTTPS**: All API calls use encrypted connections
- **Token Refresh**: Automatic handling of expired credentials
- **Error Sanitization**: No sensitive data in error responses

## Testing Strategy

### Unit Tests
- Service methods with mocked dependencies
- Configuration validation
- Error handling scenarios

### Integration Tests
- End-to-end upload workflow
- Authentication flows
- Health check endpoints

### Manual Testing
- `test_upload.py`: Comprehensive test script
- Health endpoints for service verification
- Sample Drive folder for testing

## Monitoring & Observability

### Health Checks
- `/health`: Overall system status
- `/drive/auth`: Drive authentication status
- Service initialization logs

### Metrics
- Upload success/failure rates
- Processing times
- File size statistics
- Concurrent operation counts

### Logging
- Request/response logging
- Operation tracing
- Error reporting with context
- Performance metrics

## Future Enhancements

### Immediate Improvements
- **Chunked Uploads**: Support for files >1MB
- **Progress Tracking**: Real-time upload status
- **Resume Capability**: Handle interrupted transfers

### Advanced Features
- **Batch Operations**: Multiple folders in single request
- **File Deduplication**: Skip already uploaded files
- **Webhook Notifications**: Success/failure callbacks
- **Dashboard**: Web interface for monitoring

### Infrastructure
- **Database**: Persistent operation tracking
- **Message Queue**: Asynchronous processing
- **Container Deployment**: Docker/Kubernetes support
- **Multi-Cloud**: Support for additional storage backends

This architecture provides a solid foundation for reliable, scalable file transfer operations while maintaining clean separation of concerns and comprehensive error handling. 