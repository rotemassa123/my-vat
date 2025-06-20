#!/usr/bin/env python3
"""
Setup script for MongoDB integration in the upload-to-cloud project.
"""
import asyncio
import logging
import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from config import config
from services.mongo_service import mongo_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_mongodb_connection():
    """Test MongoDB connection and setup."""
    logger.info("Testing MongoDB connection...")
    logger.info(f"MongoDB URL: {config.MONGODB_URL}")
    logger.info(f"Database: {config.MONGODB_DATABASE}")
    
    try:
        # Connect to MongoDB
        connected = await mongo_service.connect()
        
        if not connected:
            logger.error("❌ Failed to connect to MongoDB")
            logger.info("💡 Make sure MongoDB is running and accessible at the configured URL")
            return False
        
        logger.info("✅ Successfully connected to MongoDB")
        
        # Test health check
        health = await mongo_service.health_check()
        logger.info(f"📊 Database health: {health}")
        
        # Test creating sample invoices (and then delete them)
        logger.info("🧪 Testing invoice operations...")
        
        # Create a test invoice for eligible file
        test_invoice_1 = await mongo_service.create_invoice(
            name="test_document.pdf",
            source_id="test-drive-id-123",
            size=500000,  # 500KB - eligible
            account_id=12345
        )
        logger.info(f"✅ Created test invoice 1: {test_invoice_1.id}")
        
        # Create a test invoice for rejected file
        test_invoice_2 = await mongo_service.create_invoice(
            name="large_video.mp4",
            source_id="test-drive-id-456", 
            size=5000000,  # 5MB - too large
            account_id=12345,
            status="rejected",
            reason="too big"
        )
        logger.info(f"✅ Created test invoice 2: {test_invoice_2.id}")
        
        # Test bulk creation
        test_invoices_data = [
            {
                "name": "file1.txt",
                "source_id": "bulk-test-1",
                "size": 1000,
                "account_id": 12345
            },
            {
                "name": "file2.zip",
                "source_id": "bulk-test-2",
                "size": 10000000,  # Too large
                "account_id": 12345,
                "status": "rejected",
                "reason": "too big"
            }
        ]
        
        bulk_invoices = await mongo_service.bulk_create_invoices(test_invoices_data)
        logger.info(f"✅ Created {len(bulk_invoices)} invoices in bulk operation")
        
        # Query invoices to verify
        from models.mongo_models import Invoice
        test_invoices = await Invoice.find(Invoice.account_id == 12345).to_list()
        logger.info(f"✅ Found {len(test_invoices)} test invoices in database")
        
        # Show some details
        for invoice in test_invoices:
            status_info = f" (Status: {invoice.status}, Reason: {invoice.reason})" if invoice.status else ""
            logger.info(f"   📄 {invoice.name} - {invoice.size} bytes{status_info}")
        
        # Clean up - delete test invoices
        for invoice in test_invoices:
            await invoice.delete()
        logger.info("🧹 Cleaned up test invoices")
        
        logger.info("🎉 All MongoDB operations successful!")
        
        # Disconnect
        await mongo_service.disconnect()
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB setup failed: {e}")
        return False


def check_environment():
    """Check if the environment is properly configured."""
    logger.info("🔍 Checking environment configuration...")
    
    # Check if .env file exists
    env_file = project_root / ".env"
    if not env_file.exists():
        logger.warning("⚠️  No .env file found")
        logger.info("💡 Create a .env file based on env.example")
        logger.info("💡 Or set environment variables directly")
    else:
        logger.info("✅ .env file found")
    
    # Check MongoDB configuration
    logger.info(f"📝 MongoDB URL: {config.MONGODB_URL}")
    logger.info(f"📝 MongoDB Database: {config.MONGODB_DATABASE}")
    
    if config.MONGODB_URL == "mongodb://localhost:27017":
        logger.info("💡 Using default MongoDB URL (localhost)")
        logger.info("💡 Make sure MongoDB is running locally, or update MONGODB_URL in .env")
    
    return True


def show_usage_examples():
    """Show examples of how to use the MongoDB integration."""
    logger.info("\n" + "="*60)
    logger.info("📚 MONGODB INTEGRATION USAGE EXAMPLES")
    logger.info("="*60)
    
    logger.info("\n🔗 API ENDPOINTS:")
    logger.info("  GET /health/mongodb - Check MongoDB connection")
    logger.info("  POST /upload - Automatically creates invoices for all files")
    
    logger.info("\n💻 PYTHON CODE EXAMPLES:")
    logger.info("""
# Import the mongo service
from services.mongo_service import mongo_service

# Create an invoice for an eligible file
invoice = await mongo_service.create_invoice(
    name="document.pdf",
    source_id="google-drive-file-id",
    size=500000,  # 500KB
    account_id=123  # Changed to integer
)

# Create an invoice for a rejected file
rejected_invoice = await mongo_service.create_invoice(
    name="large_video.mp4",
    source_id="google-drive-file-id-2", 
    size=10000000,  # 10MB - too large
    account_id=123,  # Changed to integer
    status="rejected",
    reason="too big"
)

# Bulk create invoices (used in upload endpoint)
invoices_data = [
    {
        "name": "file1.txt",
        "source_id": "drive-id-1",
        "size": 1000,
        "account_id": 123  # Changed to integer
    },
    {
        "name": "large_file.zip",
        "source_id": "drive-id-2",
        "size": 5000000,
        "account_id": 123,  # Changed to integer
        "status": "rejected",
        "reason": "too big"
    }
]
invoices = await mongo_service.bulk_create_invoices(invoices_data)
""")
    
    logger.info("\n📊 INVOICE FIELDS:")
    logger.info("  • name: File name")
    logger.info("  • source_id: Google Drive file ID")
    logger.info("  • size: File size in bytes")
    logger.info("  • last_executed_step: Always 1 (constant)")
    logger.info("  • source: Always 'google_drive' (constant)")
    logger.info("  • account_id: User account identifier (integer)")
    logger.info("  • status: 'rejected' for too-large files (optional)")
    logger.info("  • reason: 'too big' for too-large files (optional)")
    logger.info("  • created_at: Timestamp (automatic)")


async def main():
    """Main setup function."""
    logger.info("🚀 MongoDB Setup for Upload-to-Cloud Project")
    logger.info("="*50)
    
    # Check environment
    check_environment()
    
    print("\n")
    
    # Test MongoDB connection
    success = await test_mongodb_connection()
    
    print("\n")
    
    if success:
        logger.info("🎉 MongoDB setup completed successfully!")
        show_usage_examples()
    else:
        logger.error("❌ MongoDB setup failed")
        logger.info("\n💡 TROUBLESHOOTING:")
        logger.info("1. Make sure MongoDB is installed and running")
        logger.info("2. Check your MONGODB_URL in .env file")
        logger.info("3. Ensure MongoDB is accessible from this machine")
        logger.info("4. Check firewall/network settings if using remote MongoDB")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main()) 