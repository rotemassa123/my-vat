"""
Business logic for Invoice operations with advanced filtering and batch processing.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Union
from bson import ObjectId
from beanie import PydanticObjectId

from models.mongo_models import Invoice
from services.mongo_service import mongo_service

logger = logging.getLogger(__name__)


class InvoiceBL:
    """Business logic for Invoice operations."""
    
    def __init__(self):
        self.mongo_service = mongo_service
    
    async def create_invoice(self, invoice_data: Dict[str, Any]) -> Invoice:
        """Create a new invoice with validation."""
        try:
            # Validate required fields
            required_fields = ['name', 'source_id', 'size', 'account_id']
            for field in required_fields:
                if field not in invoice_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create invoice
            invoice = Invoice(**invoice_data)
            await invoice.insert()
            
            logger.info(f"Created invoice {invoice.id} for account {invoice.account_id}")
            return invoice
            
        except Exception as e:
            logger.error(f"Failed to create invoice: {e}")
            raise
    
    async def batch_create_invoices(self, invoices_data: List[Dict[str, Any]]) -> List[Invoice]:
        """Create multiple invoices in batch with validation."""
        try:
            if not invoices_data:
                return []
            
            # Validate all invoices first
            validated_invoices = []
            for data in invoices_data:
                required_fields = ['name', 'source_id', 'size', 'account_id']
                for field in required_fields:
                    if field not in data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Set defaults
                data['last_executed_step'] = data.get('last_executed_step', 1)
                data['source'] = data.get('source', 'google_drive')
                
                validated_invoices.append(Invoice(**data))
            
            # Batch insert
            await Invoice.insert_many(validated_invoices)
            
            logger.info(f"Created {len(validated_invoices)} invoices in batch")
            return validated_invoices
            
        except Exception as e:
            logger.error(f"Batch invoice creation failed: {e}")
            raise
    
    async def get_invoice_by_id(self, invoice_id: str) -> Optional[Invoice]:
        """Get invoice by ID."""
        try:
            return await Invoice.get(PydanticObjectId(invoice_id))
        except Exception as e:
            logger.error(f"Failed to get invoice {invoice_id}: {e}")
            return None
    
    async def update_invoice(self, invoice_id: str, update_data: Dict[str, Any]) -> Optional[Invoice]:
        """Update invoice with validation."""
        try:
            invoice = await Invoice.get(PydanticObjectId(invoice_id))
            if not invoice:
                return None
            
            # Update fields
            for field, value in update_data.items():
                if hasattr(invoice, field):
                    setattr(invoice, field, value)
            
            invoice.updated_at = datetime.now(timezone.utc)
            await invoice.save()
            
            logger.info(f"Updated invoice {invoice_id}")
            return invoice
            
        except Exception as e:
            logger.error(f"Failed to update invoice {invoice_id}: {e}")
            return None
    
    async def delete_invoice(self, invoice_id: str) -> bool:
        """Delete invoice by ID."""
        try:
            invoice = await Invoice.get(PydanticObjectId(invoice_id))
            if not invoice:
                return False
            
            await invoice.delete()
            logger.info(f"Deleted invoice {invoice_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete invoice {invoice_id}: {e}")
            return False
    
    async def batch_update_invoices(self, updates: List[Dict[str, Any]]) -> List[str]:
        """Update multiple invoices in batch."""
        try:
            updated_ids = []
            
            for update in updates:
                invoice_id = update.get('id')
                update_data = update.get('data', {})
                
                if not invoice_id:
                    continue
                
                invoice = await self.update_invoice(invoice_id, update_data)
                if invoice:
                    updated_ids.append(str(invoice.id))
            
            logger.info(f"Batch updated {len(updated_ids)} invoices")
            return updated_ids
            
        except Exception as e:
            logger.error(f"Batch invoice update failed: {e}")
            raise
    
    async def batch_delete_invoices(self, invoice_ids: List[str]) -> int:
        """Delete multiple invoices in batch."""
        try:
            deleted_count = 0
            
            for invoice_id in invoice_ids:
                if await self.delete_invoice(invoice_id):
                    deleted_count += 1
            
            logger.info(f"Batch deleted {deleted_count} invoices")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Batch invoice deletion failed: {e}")
            raise
    
    async def get_invoices_with_filters(
        self,
        account_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        skip: int = 0,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> Dict[str, Any]:
        """Get invoices with advanced filtering, pagination, and sorting."""
        try:
            # Build query conditions
            query_conditions = [Invoice.account_id == account_id]
            
            if filters:
                # Status filter
                if 'status' in filters and filters['status']:
                    if filters['status'] == 'active':
                        query_conditions.append(Invoice.status == None)
                    else:
                        query_conditions.append(Invoice.status == filters['status'])
                
                # Date range filter
                if 'date_from' in filters and filters['date_from']:
                    query_conditions.append(Invoice.created_at >= filters['date_from'])
                
                if 'date_to' in filters and filters['date_to']:
                    query_conditions.append(Invoice.created_at <= filters['date_to'])
                
                # Source filter
                if 'source' in filters and filters['source']:
                    query_conditions.append(Invoice.source == filters['source'])
                
                # Size range filter
                if 'min_size' in filters and filters['min_size']:
                    query_conditions.append(Invoice.size >= filters['min_size'])
                
                if 'max_size' in filters and filters['max_size']:
                    query_conditions.append(Invoice.size <= filters['max_size'])
                
                # Processing step filter
                if 'step' in filters and filters['step'] is not None:
                    query_conditions.append(Invoice.last_executed_step == filters['step'])
                
                # Content type filter
                if 'content_type' in filters and filters['content_type']:
                    query_conditions.append(Invoice.content_type.contains(filters['content_type']))
                
                # Name search
                if 'name_contains' in filters and filters['name_contains']:
                    query_conditions.append(Invoice.name.contains(filters['name_contains']))
            
            # Execute query with pagination and sorting
            query = Invoice.find(*query_conditions)
            
            # Get total count for pagination
            total_count = await query.count()
            
            # Apply sorting
            if sort_order == 1:
                query = query.sort(f"+{sort_by}")
            else:
                query = query.sort(f"-{sort_by}")
            
            # Apply pagination
            invoices = await query.skip(skip).limit(limit).to_list()
            
            logger.debug(f"Found {len(invoices)} invoices for account {account_id} with filters")
            
            return {
                "invoices": invoices,
                "total_count": total_count,
                "page_size": limit,
                "current_page": (skip // limit) + 1,
                "total_pages": (total_count + limit - 1) // limit,
                "has_next": skip + limit < total_count,
                "has_previous": skip > 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get invoices with filters: {e}")
            raise
    
    async def get_invoice_statistics(self, account_id: int) -> Dict[str, Any]:
        """Get invoice statistics for an account."""
        try:
            # Get all invoices for account
            invoices = await Invoice.find(Invoice.account_id == account_id).to_list()
            
            # Calculate statistics
            total_count = len(invoices)
            total_size = sum(invoice.size for invoice in invoices)
            
            # Status breakdown
            status_counts = {}
            for invoice in invoices:
                status = invoice.status or 'active'
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Step breakdown
            step_counts = {}
            for invoice in invoices:
                step = invoice.last_executed_step
                step_counts[step] = step_counts.get(step, 0) + 1
            
            # Source breakdown
            source_counts = {}
            for invoice in invoices:
                source = invoice.source
                source_counts[source] = source_counts.get(source, 0) + 1
            
            return {
                "total_count": total_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "status_breakdown": status_counts,
                "step_breakdown": step_counts,
                "source_breakdown": source_counts,
                "average_file_size_mb": round((total_size / total_count) / (1024 * 1024), 2) if total_count > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get invoice statistics: {e}")
            raise
    
    async def update_invoice_step(self, invoice_id: str, new_step: int) -> Optional[Invoice]:
        """Update invoice processing step."""
        try:
            return await self.update_invoice(invoice_id, {"last_executed_step": new_step})
        except Exception as e:
            logger.error(f"Failed to update invoice step: {e}")
            return None
    
    async def mark_invoice_failed(self, invoice_id: str, reason: str) -> Optional[Invoice]:
        """Mark invoice as failed with reason."""
        try:
            return await self.update_invoice(invoice_id, {
                "status": "failed",
                "reason": reason
            })
        except Exception as e:
            logger.error(f"Failed to mark invoice as failed: {e}")
            return None


# Global business logic instance
invoice_bl = InvoiceBL() 