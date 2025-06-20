# MongoDB Setup Guide

## Quick Setup Options

### Option 1: Local MongoDB (Easiest)
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb/brew/mongodb-community

# Or via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 2: MongoDB Atlas (Cloud)
```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Set environment variable:
export MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net"
```

## Environment Variables
```bash
# Set these environment variables:
export MONGODB_URL="mongodb://localhost:27017"  # or your Atlas URL
export MONGODB_DB_NAME="file_uploads"           # database name
```

## Test the Setup
```bash
# Start the server
python3 run.py

# Test upload (this will now also insert MongoDB records)
curl -X POST "http://localhost:8000/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "drive_folder_id": "your_folder_id",
    "account_id": 123,
    "bucket_name": "your-bucket"
  }'
```

## What Gets Stored in MongoDB

Each file from Google Drive creates a record in the `invoices` collection:

```json
{
  "_id": "ObjectId(...)",
  "name": "document.pdf",
  "source_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "size": 1048576,
  "last_executed_step": 1,
  "account_id": 123,
  "source": "google_drive",
  "created_at": "2024-01-15T10:30:00.123456"
}
```

## Check Your Data
```bash
# Connect to MongoDB and see your data
mongosh
use file_uploads
db.invoices.find().pretty()
```

That's it! The system now automatically creates invoice records for every file discovered in Google Drive! 🚀