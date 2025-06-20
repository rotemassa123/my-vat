#!/bin/bash

echo "🚀 Upload to Cloud - Setup Script"
echo "=================================="

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✅ Python 3 found"

# Install dependencies
echo "📦 Installing dependencies..."
python3 -m pip install -r requirements.txt

# Create test files if they don't exist
if [ ! -d "test_files" ]; then
    echo "📁 Creating test files..."
    mkdir -p test_files/small_files test_files/large_files
    
    # Small files (eligible for upload)
    echo "This is a small test file" > test_files/small_files/test1.txt
    echo "Another small file content" > test_files/small_files/test2.txt
    echo "Third small file" > test_files/small_files/test3.txt
    
    # Large file (will be skipped)
    dd if=/dev/zero of=test_files/large_files/large_file.bin bs=1024 count=2048 2>/dev/null
    
    echo "✅ Test files created"
else
    echo "✅ Test files already exist"
fi

echo ""
echo "🎯 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Google Cloud credentials (optional for testing):"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
echo ""
echo "2. Start the server:"
echo "   python3 run.py"
echo ""
echo "3. Test the server:"
echo "   python3 test_upload.py"
echo ""
echo "4. View API docs:"
echo "   http://localhost:8000/docs"
echo ""
echo "5. Health check:"
echo "   curl http://localhost:8000/health" 