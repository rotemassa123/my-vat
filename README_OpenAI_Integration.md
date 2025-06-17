# OpenAI Process Controller Integration

## Overview

This document describes the comprehensive OpenAI integration added to the Google Drive to Google Cloud Storage upload server. The new "Process Controller" provides AI-powered file processing capabilities using OpenAI's API.

## ✨ New Features Added

### 🤖 AI Processing Capabilities
- **Batch File Processing**: Process multiple uploaded files with AI
- **Individual File Analysis**: Analyze specific files with customizable prompts
- **Chat Interface**: Interactive conversation with AI about documents
- **Multiple Analysis Types**: Invoice extraction, document summarization, data extraction

### 📊 Comprehensive Tracking
- **Processing Jobs**: Track batch processing operations with progress monitoring
- **File Analyses**: Store detailed analysis results with confidence scoring
- **Conversations**: Maintain chat history with context preservation
- **Cost Tracking**: Monitor OpenAI token usage and estimated costs

## 🏗️ Architecture Components

### 1. Services Layer (`services/openai_service.py`)
**OpenAIService Class** - Core service for OpenAI API interactions
- Client initialization and authentication
- Batch file processing with progress tracking
- Individual file analysis with custom prompts
- Chat completion with conversation history
- Cost calculation and token usage tracking

### 2. Routes Layer (`routes/process_routes.py`)
**Process Router** - RESTful API endpoints for AI processing
- `GET /api/process/status` - Service status and configuration
- `POST /api/process/batch` - Batch file processing
- `POST /api/process/file` - Single file analysis
- `POST /api/process/chat` - Interactive chat interface
- `GET /api/process/jobs/{account_id}` - Processing job history
- `GET /api/process/analyses/{account_id}` - Analysis results
- `GET /api/process/conversations/{account_id}` - Chat history

### 3. Data Models (`models/`)
**API Models** (`api_models.py`)
- `ProcessRequest` - Batch processing configuration
- `ChatRequest` - Chat interaction parameters
- `FileAnalysisRequest` - Single file analysis setup
- `ProcessResult` - Batch processing results
- `ChatResponse` - AI conversation response
- `FileAnalysisResult` - Individual analysis outcome

**MongoDB Models** (`mongo_models.py`)
- `ProcessingJob` - Batch job tracking and status
- `FileAnalysis` - Individual file analysis records
- `Conversation` - Chat conversation history

### 4. Configuration (`config.py`)
**OpenAI Settings**
```python
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "2048"))
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "60"))
```

## 🚀 API Endpoints

### Service Status
```http
GET /api/process/status
```
Check OpenAI service health and available tasks.

### Batch Processing
```http
POST /api/process/batch
Content-Type: application/json

{
  "account_id": 123,
  "task_type": "invoice_extraction",
  "file_ids": ["file1", "file2"],  // optional
  "custom_prompt": "Extract data from invoices"  // optional
}
```

### Single File Analysis
```http
POST /api/process/file
Content-Type: application/json

{
  "file_id": "507f1f77bcf86cd799439011",
  "analysis_type": "document_summary",
  "account_id": 123
}
```

### Chat Interface
```http
POST /api/process/chat
Content-Type: application/json

{
  "message": "Analyze the invoice data",
  "account_id": 123,
  "conversation_id": "uuid-optional",
  "system_prompt": "You are a document expert"
}
```

### Data Retrieval
```http
GET /api/process/jobs/{account_id}?limit=10&skip=0
GET /api/process/analyses/{account_id}?analysis_type=invoice_extraction
GET /api/process/conversations/{account_id}
```

## 💡 Analysis Types

### 1. Invoice Extraction (`invoice_extraction`)
Extracts structured data from invoices:
- Invoice number and date
- Vendor information
- Total amounts and currency
- Line items and tax details

### 2. Document Summary (`document_summary`)
Generates comprehensive summaries:
- Document type identification
- Key topics and themes
- Important dates and participants
- Main conclusions

### 3. Data Extraction (`data_extraction`)
Extracts all structured data:
- Dates and numbers
- Names and entities
- Key-value pairs
- Tables and lists

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
pip install openai==1.54.4
```

### 2. Environment Configuration
Add to your `.env` file:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT_SECONDS=60
```

### 3. MongoDB Collections
The integration automatically creates these new collections:
- `processing_jobs` - Batch processing job records
- `file_analyses` - Individual analysis results
- `conversations` - Chat conversation history

### 4. Health Checks
Monitor service health through:
- `/api/health` - Overall service status including OpenAI
- `/api/health/openai` - Detailed OpenAI service status

## 🧪 Testing

### Automated Test Suite
Run the comprehensive test suite:
```bash
python test_process.py
```

Test coverage includes:
- ✅ Service health checks
- ✅ OpenAI authentication status
- ✅ Chat functionality
- ✅ Job and conversation retrieval
- ✅ Error handling and validation

### Manual Testing Examples
```bash
# Check service status
curl http://localhost:8000/api/process/status

# Start a chat conversation
curl -X POST http://localhost:8000/api/process/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "account_id": 123}'

# Get processing history
curl http://localhost:8000/api/process/jobs/123
```

## 💰 Cost Management

### Token Usage Tracking
- All API calls track token consumption
- Cost estimation based on current OpenAI pricing
- Per-request and cumulative cost tracking

### Pricing Information (as of 2024)
- **GPT-4o**: $5 per 1M tokens
- **GPT-4o-mini**: $0.15 per 1M tokens  
- **GPT-4**: $30 per 1M tokens
- **GPT-3.5-turbo**: $1 per 1M tokens

### Cost Optimization
- Use `gpt-4o-mini` for most tasks (default)
- Implement token limits to control costs
- Monitor usage through the tracking endpoints

## 🔒 Security Considerations

### API Key Management
- Store OpenAI API key in environment variables
- Never commit API keys to version control
- Rotate keys regularly for production

### Access Control
- Account-based isolation for all operations
- File access validation before processing
- Error message sanitization

## 🚦 Error Handling

### Service Level Errors
- OpenAI API connectivity issues
- Authentication failures
- Rate limiting and quota exceeded

### Request Level Errors
- Invalid file IDs or formats
- Insufficient permissions
- Processing timeouts

### Graceful Degradation
- Services continue operating if OpenAI is unavailable
- Clear error messages for troubleshooting
- Comprehensive logging for debugging

## 📈 Monitoring and Analytics

### Health Monitoring
- Service status endpoints
- MongoDB connection health
- OpenAI API authentication status

### Usage Analytics
- Processing job statistics
- Token usage trends
- Cost analysis by account
- Analysis type popularity

### Performance Metrics
- Processing time per file
- Batch job completion rates
- API response times
- Error rates and patterns

## 🔄 Integration with Existing System

### Seamless Integration
- Follows existing architectural patterns
- Uses same MongoDB service and models
- Consistent error handling and logging
- Compatible with existing authentication

### Workflow Enhancement
1. **Upload Phase**: Files uploaded via existing `/api/discover` and `/api/upload`
2. **Processing Phase**: AI analysis via new `/api/process/*` endpoints
3. **Monitoring Phase**: Track progress and results via history endpoints

### Data Flow
```
Drive Files → Upload to GCS → AI Processing → Analysis Results → Storage in MongoDB
```

## 🎯 Use Cases

### Invoice Processing Workflow
1. Upload invoices from Google Drive
2. Batch process with `invoice_extraction` 
3. Review extracted data and confidence scores
4. Export structured data for accounting systems

### Document Analysis Pipeline
1. Upload various document types
2. Generate summaries with `document_summary`
3. Extract key information with `data_extraction`
4. Use chat interface for clarifications

### Interactive Document Assistant
1. Process documents with AI
2. Start conversations about content
3. Ask specific questions about data
4. Get explanations and insights

## 🚀 Future Enhancements

### Planned Features
- **File Upload Integration**: Direct file content analysis
- **Custom Prompt Templates**: Reusable analysis configurations
- **Webhook Notifications**: Real-time processing updates
- **Batch Export**: Export analysis results in various formats
- **Advanced Analytics**: Detailed usage and performance insights

### Potential Integrations
- **Document Classification**: Automatic file type detection
- **OCR Integration**: Text extraction from images
- **Multi-language Support**: Analysis in multiple languages
- **Custom Model Fine-tuning**: Domain-specific optimizations

---

## 📞 Support

For questions or issues with the OpenAI integration:
1. Check the health endpoints for service status
2. Review logs for detailed error information
3. Verify OpenAI API key configuration
4. Test with the provided test suite

The integration follows the same high-quality standards as the existing codebase with comprehensive error handling, logging, and documentation. 