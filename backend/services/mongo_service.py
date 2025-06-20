"""
MongoDB service for managing database connections and operations.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, PydanticObjectId
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

from config import config
from models.mongo_models import (
    Invoice,
    UploadSession, 
    FileUploadRecord, 
    DriveFolder, 
    SystemMetrics,
    ProcessingJob,
    FileAnalysis,
    Conversation,
    Summary
)
from models.account_models import Account, AccountSession
from models.user_models import User, Entity, UserSession

logger = logging.getLogger(__name__)


class MongoService:
    """Service for MongoDB operations using Beanie ODM."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
        self.is_connected = False
        
    async def connect(self) -> bool:
        """Connect to MongoDB and initialize Beanie."""
        try:
            logger.info(f"Connecting to MongoDB at {config.MONGODB_URL}")
            
            # Create MongoDB client with SSL configuration for Atlas
            self.client = AsyncIOMotorClient(
                config.MONGODB_URL,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,         # 10 second connection timeout
                maxPoolSize=50,                 # Maximum connections in pool
                retryWrites=True,
                # SSL configuration for MongoDB Atlas
                tls=True,                       # Enable TLS/SSL
                tlsInsecure=True               # Skip hostname and certificate verification (fixes macOS SSL issues)
            )
            
            # Test the connection
            await self.client.admin.command('ping')
            logger.info("MongoDB connection successful")
            
            # Get database
            self.database = self.client[config.MONGODB_DATABASE]
            
            # Initialize Beanie with document models
            await init_beanie(
                database=self.database,
                document_models=[
                    Invoice,
                    UploadSession,
                    FileUploadRecord, 
                    DriveFolder,
                    SystemMetrics,
                    ProcessingJob,
                    FileAnalysis,
                    Conversation,
                    Summary,
                    Account,
                    AccountSession,
                    User,
                    Entity,
                    UserSession
                ]
            )
            
            self.is_connected = True
            logger.info(f"Beanie ODM initialized with database '{config.MONGODB_DATABASE}'")
            return True
            
        except (ServerSelectionTimeoutError, ConnectionFailure) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.is_connected = False
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("Disconnected from MongoDB")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check MongoDB connection health."""
        if not self.is_connected or not self.client:
            return {
                "status": "disconnected",
                "database": config.MONGODB_DATABASE,
                "error": "Not connected to MongoDB"
            }
        
        try:
            # Ping the database
            await self.client.admin.command('ping')
            
            # Get database stats
            stats = await self.database.command("dbStats")
            
            return {
                "status": "connected",
                "database": config.MONGODB_DATABASE,
                "collections": stats.get("collections", 0),
                "data_size": stats.get("dataSize", 0),
                "index_size": stats.get("indexSize", 0)
            }
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return {
                "status": "error", 
                "database": config.MONGODB_DATABASE,
                "error": str(e)
            }
    
    # Invoice Operations
    async def create_invoice(
        self,
        name: str,
        source_id: str,
        size: int,
        account_id: int,
        content_type: Optional[str] = None,
        status: Optional[str] = None,
        reason: Optional[str] = None
    ) -> Invoice:
        """Create a new invoice for a file."""
        invoice = Invoice(
            name=name,
            source_id=source_id,
            size=size,
            account_id=account_id,
            last_executed_step=1,
            source="google_drive",
            content_type=content_type,
            status=status,
            reason=reason
        )
        await invoice.insert()
        logger.debug(f"Created invoice for file {name} (source_id: {source_id})")
        return invoice
    
    async def bulk_create_invoices(self, invoices_data: List[Dict[str, Any]]) -> List[Invoice]:
        """Create multiple invoices in a batch operation."""
        if not invoices_data:
            return []
        
        invoices = []
        for data in invoices_data:
            invoice = Invoice(
                name=data["name"],
                source_id=data["source_id"],
                size=data["size"],
                account_id=data["account_id"],
                last_executed_step=1,
                source="google_drive",
                content_type=data.get("content_type"),
                status=data.get("status"),
                reason=data.get("reason")
            )
            invoices.append(invoice)
        
        # Bulk insert for better performance
        await Invoice.insert_many(invoices)
        logger.info(f"Created {len(invoices)} invoices in bulk operation")
        return invoices
    
    async def get_invoices_by_step(self, account_id: int, last_executed_step: int, exclude_failed: bool = False) -> List[Invoice]:
        """Get invoices for a specific account and processing step."""
        query_conditions = [
            Invoice.account_id == account_id,
            Invoice.last_executed_step == last_executed_step
        ]
        
        if exclude_failed:
            query_conditions.append(Invoice.status == None)  # Not rejected or failed
        
        invoices = await Invoice.find(*query_conditions).to_list()
        
        logger.debug(f"Found {len(invoices)} invoices for account {account_id} at step {last_executed_step}")
        return invoices
    
    async def update_invoice_by_id(
        self,
        object_id: str,
        **updates
    ) -> Optional[Invoice]:
        """Update invoice by ObjectId (most efficient method)."""
        try:
            # Convert string to PydanticObjectId
            oid = PydanticObjectId(object_id)
            invoice = await Invoice.get(oid)
            
            if invoice:
                for key, value in updates.items():
                    if hasattr(invoice, key):
                        setattr(invoice, key, value)
                await invoice.save()
                logger.debug(f"Updated invoice {object_id}: {updates}")
                return invoice
            else:
                logger.warning(f"Invoice not found for ObjectId: {object_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error updating invoice by ObjectId {object_id}: {e}")
            return None
    
    async def update_invoice_by_source(
        self,
        source_id: str,
        account_id: int,
        **updates
    ) -> Optional[Invoice]:
        """Update invoice by source_id and account_id."""
        invoice = await Invoice.find_one(
            Invoice.source_id == source_id,
            Invoice.account_id == account_id
        )
        
        if invoice:
            for key, value in updates.items():
                setattr(invoice, key, value)
            
            await invoice.save()
            logger.debug(f"Updated invoice {invoice.name} (source_id: {source_id})")
            return invoice
        else:
            logger.warning(f"Invoice not found for source_id: {source_id}, account_id: {account_id}")
            return None

    async def update_invoice_step(
        self,
        object_id: str,
        new_step: int
    ) -> Optional[Invoice]:
        """Update invoice processing step by ObjectId."""
        try:
            # Convert string to PydanticObjectId
            oid = PydanticObjectId(object_id)
            invoice = await Invoice.get(oid)
            
            if invoice:
                invoice.last_executed_step = new_step
                await invoice.save()
                logger.debug(f"Updated invoice {invoice.name} processing step to {new_step}")
                return invoice
            else:
                logger.warning(f"Invoice not found for ObjectId: {object_id}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to update invoice step for {object_id}: {e}")
            return None

# Global MongoDB service instance
mongo_service = MongoService() 