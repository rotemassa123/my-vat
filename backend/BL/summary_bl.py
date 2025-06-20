"""
Business logic for Summary operations with CRUD and batch processing.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId

from models.mongo_models import Summary, Invoice
from services.mongo_service import mongo_service

logger = logging.getLogger(__name__)


class SummaryBL:
    """Business logic for Summary operations."""
    
    def __init__(self):
        self.mongo_service = mongo_service
    
    async def create_summary(self, summary_data: Dict[str, Any]) -> Summary:
        """Create a new summary with validation."""
        try:
            # Validate required fields
            required_fields = ['file_id', 'file_name', 'account_id', 'model_used', 
                             'tokens_used', 'cost_usd', 'is_invoice', 'summary_content']
            for field in required_fields:
                if field not in summary_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Verify the invoice exists
            invoice = await Invoice.get(PydanticObjectId(summary_data['file_id']))
            if not invoice:
                raise ValueError(f"Invoice {summary_data['file_id']} not found")
            
            # Create summary
            summary = Summary(**summary_data)
            await summary.insert()
            
            logger.info(f"Created summary {summary.id} for file {summary.file_name}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to create summary: {e}")
            raise
    
    async def batch_create_summaries(self, summaries_data: List[Dict[str, Any]]) -> List[Summary]:
        """Create multiple summaries in batch with validation."""
        try:
            if not summaries_data:
                return []
            
            # Validate all summaries first
            validated_summaries = []
            for data in summaries_data:
                required_fields = ['file_id', 'file_name', 'account_id', 'model_used', 
                                 'tokens_used', 'cost_usd', 'is_invoice', 'summary_content']
                for field in required_fields:
                    if field not in data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Set defaults
                data['success'] = data.get('success', True)
                data['processing_time_seconds'] = data.get('processing_time_seconds', 0.0)
                
                validated_summaries.append(Summary(**data))
            
            # Batch insert
            await Summary.insert_many(validated_summaries)
            
            logger.info(f"Created {len(validated_summaries)} summaries in batch")
            return validated_summaries
            
        except Exception as e:
            logger.error(f"Batch summary creation failed: {e}")
            raise
    
    async def get_summary_by_id(self, summary_id: str) -> Optional[Summary]:
        """Get summary by ID."""
        try:
            return await Summary.get(PydanticObjectId(summary_id))
        except Exception as e:
            logger.error(f"Failed to get summary {summary_id}: {e}")
            return None
    
    async def get_summary_by_file_id(self, file_id: str) -> Optional[Summary]:
        """Get summary by file ID."""
        try:
            return await Summary.find_one(Summary.file_id == file_id)
        except Exception as e:
            logger.error(f"Failed to get summary for file {file_id}: {e}")
            return None
    
    async def update_summary(self, summary_id: str, update_data: Dict[str, Any]) -> Optional[Summary]:
        """Update summary with validation."""
        try:
            summary = await Summary.get(PydanticObjectId(summary_id))
            if not summary:
                return None
            
            # Update fields
            for field, value in update_data.items():
                if hasattr(summary, field):
                    setattr(summary, field, value)
            
            await summary.save()
            
            logger.info(f"Updated summary {summary_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to update summary {summary_id}: {e}")
            return None
    
    async def delete_summary(self, summary_id: str) -> bool:
        """Delete summary by ID."""
        try:
            summary = await Summary.get(PydanticObjectId(summary_id))
            if not summary:
                return False
            
            await summary.delete()
            logger.info(f"Deleted summary {summary_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete summary {summary_id}: {e}")
            return False
    
    async def batch_update_summaries(self, updates: List[Dict[str, Any]]) -> List[str]:
        """Update multiple summaries in batch."""
        try:
            updated_ids = []
            
            for update in updates:
                summary_id = update.get('id')
                update_data = update.get('data', {})
                
                if not summary_id:
                    continue
                
                summary = await self.update_summary(summary_id, update_data)
                if summary:
                    updated_ids.append(str(summary.id))
            
            logger.info(f"Batch updated {len(updated_ids)} summaries")
            return updated_ids
            
        except Exception as e:
            logger.error(f"Batch summary update failed: {e}")
            raise
    
    async def batch_delete_summaries(self, summary_ids: List[str]) -> int:
        """Delete multiple summaries in batch."""
        try:
            deleted_count = 0
            
            for summary_id in summary_ids:
                if await self.delete_summary(summary_id):
                    deleted_count += 1
            
            logger.info(f"Batch deleted {deleted_count} summaries")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Batch summary deletion failed: {e}")
            raise
    
    async def get_summaries_with_filters(
        self,
        account_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        skip: int = 0,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> Dict[str, Any]:
        """Get summaries with advanced filtering, pagination, and sorting."""
        try:
            # Build query conditions
            query_conditions = [Summary.account_id == account_id]
            
            if filters:
                # Invoice type filter
                if 'is_invoice' in filters and filters['is_invoice'] is not None:
                    query_conditions.append(Summary.is_invoice == filters['is_invoice'])
                
                # Date range filter
                if 'date_from' in filters and filters['date_from']:
                    query_conditions.append(Summary.created_at >= filters['date_from'])
                
                if 'date_to' in filters and filters['date_to']:
                    query_conditions.append(Summary.created_at <= filters['date_to'])
                
                # Success filter
                if 'success' in filters and filters['success'] is not None:
                    query_conditions.append(Summary.success == filters['success'])
                
                # Model used filter
                if 'model_used' in filters and filters['model_used']:
                    query_conditions.append(Summary.model_used == filters['model_used'])
                
                # Cost range filter
                if 'min_cost' in filters and filters['min_cost']:
                    query_conditions.append(Summary.cost_usd >= filters['min_cost'])
                
                if 'max_cost' in filters and filters['max_cost']:
                    query_conditions.append(Summary.cost_usd <= filters['max_cost'])
                
                # Token usage range filter
                if 'min_tokens' in filters and filters['min_tokens']:
                    query_conditions.append(Summary.tokens_used >= filters['min_tokens'])
                
                if 'max_tokens' in filters and filters['max_tokens']:
                    query_conditions.append(Summary.tokens_used <= filters['max_tokens'])
                
                # File name search
                if 'file_name_contains' in filters and filters['file_name_contains']:
                    query_conditions.append(Summary.file_name.contains(filters['file_name_contains']))
                
                # Content search
                if 'content_contains' in filters and filters['content_contains']:
                    query_conditions.append(Summary.summary_content.contains(filters['content_contains']))
            
            # Execute query with pagination and sorting
            query = Summary.find(*query_conditions)
            
            # Get total count for pagination
            total_count = await query.count()
            
            # Apply sorting
            if sort_order == 1:
                query = query.sort(f"+{sort_by}")
            else:
                query = query.sort(f"-{sort_by}")
            
            # Apply pagination
            summaries = await query.skip(skip).limit(limit).to_list()
            
            logger.debug(f"Found {len(summaries)} summaries for account {account_id} with filters")
            
            return {
                "summaries": summaries,
                "total_count": total_count,
                "page_size": limit,
                "current_page": (skip // limit) + 1,
                "total_pages": (total_count + limit - 1) // limit,
                "has_next": skip + limit < total_count,
                "has_previous": skip > 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get summaries with filters: {e}")
            raise
    
    async def get_summary_statistics(self, account_id: int) -> Dict[str, Any]:
        """Get summary statistics for an account."""
        try:
            # Get all summaries for account
            summaries = await Summary.find(Summary.account_id == account_id).to_list()
            
            # Calculate statistics
            total_count = len(summaries)
            total_cost = sum(summary.cost_usd for summary in summaries)
            total_tokens = sum(summary.tokens_used for summary in summaries)
            
            # Success rate
            successful_summaries = [s for s in summaries if s.success]
            success_rate = (len(successful_summaries) / total_count * 100) if total_count > 0 else 0
            
            # Invoice detection rate
            invoice_summaries = [s for s in summaries if s.is_invoice]
            invoice_rate = (len(invoice_summaries) / total_count * 100) if total_count > 0 else 0
            
            # Model usage breakdown
            model_counts = {}
            for summary in summaries:
                model = summary.model_used
                model_counts[model] = model_counts.get(model, 0) + 1
            
            # Average processing time
            processing_times = [s.processing_time_seconds for s in summaries if s.processing_time_seconds > 0]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
            
            return {
                "total_count": total_count,
                "total_cost_usd": round(total_cost, 4),
                "total_tokens_used": total_tokens,
                "success_rate_percent": round(success_rate, 2),
                "invoice_detection_rate_percent": round(invoice_rate, 2),
                "model_usage_breakdown": model_counts,
                "average_processing_time_seconds": round(avg_processing_time, 2),
                "average_cost_per_summary": round(total_cost / total_count, 4) if total_count > 0 else 0,
                "average_tokens_per_summary": round(total_tokens / total_count, 0) if total_count > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get summary statistics: {e}")
            raise
    
    async def get_invoice_summaries(self, account_id: int, limit: int = 100) -> List[Summary]:
        """Get summaries that were identified as invoices."""
        try:
            summaries = await Summary.find(
                Summary.account_id == account_id,
                Summary.is_invoice == True,
                Summary.success == True
            ).limit(limit).to_list()
            
            logger.debug(f"Found {len(summaries)} invoice summaries for account {account_id}")
            return summaries
            
        except Exception as e:
            logger.error(f"Failed to get invoice summaries: {e}")
            raise
    
    async def get_extracted_invoice_data(self, account_id: int) -> List[Dict[str, Any]]:
        """Get extracted invoice data from summaries."""
        try:
            summaries = await self.get_invoice_summaries(account_id)
            
            extracted_data = []
            for summary in summaries:
                if summary.extracted_data:
                    data = {
                        "summary_id": str(summary.id),
                        "file_name": summary.file_name,
                        "created_at": summary.created_at,
                        **summary.extracted_data
                    }
                    extracted_data.append(data)
            
            logger.debug(f"Extracted data from {len(extracted_data)} invoice summaries")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Failed to get extracted invoice data: {e}")
            raise


# Global business logic instance
summary_bl = SummaryBL() 