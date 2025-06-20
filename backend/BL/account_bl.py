"""
Business logic for Account operations with CRUD capabilities.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId

from models.account_models import Account, AccountSession
from services.mongo_service import mongo_service

logger = logging.getLogger(__name__)


class AccountBL:
    """Business logic for Account operations."""
    
    def __init__(self):
        self.mongo_service = mongo_service
    
    async def create_account(self, account_data: Dict[str, Any]) -> Account:
        """Create a new account with validation."""
        try:
            # Validate required fields
            required_fields = ['email', 'name']
            for field in required_fields:
                if field not in account_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Check if account with email already exists
            existing_account = await Account.find_one(Account.email == account_data['email'])
            if existing_account:
                raise ValueError(f"Account with email {account_data['email']} already exists")
            
            # Set defaults
            account_data['status'] = account_data.get('status', 'active')
            account_data['account_type'] = account_data.get('account_type', 'individual')
            
            # Create account
            account = Account(**account_data)
            await account.insert()
            
            logger.info(f"Created account {account.id} for email {account.email}")
            return account
            
        except Exception as e:
            logger.error(f"Failed to create account: {e}")
            raise
    
    async def get_account_by_id(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        try:
            return await Account.get(PydanticObjectId(account_id))
        except Exception as e:
            logger.error(f"Failed to get account {account_id}: {e}")
            return None
    
    async def get_account_by_email(self, email: str) -> Optional[Account]:
        """Get account by email."""
        try:
            return await Account.find_one(Account.email == email)
        except Exception as e:
            logger.error(f"Failed to get account by email {email}: {e}")
            return None
    
    async def get_account_by_google_id(self, google_user_id: str) -> Optional[Account]:
        """Get account by Google user ID."""
        try:
            return await Account.find_one(Account.google_user_id == google_user_id)
        except Exception as e:
            logger.error(f"Failed to get account by Google ID {google_user_id}: {e}")
            return None
    
    async def update_account(self, account_id: str, update_data: Dict[str, Any]) -> Optional[Account]:
        """Update account with validation."""
        try:
            account = await Account.get(PydanticObjectId(account_id))
            if not account:
                return None
            
            # Check if email is being changed and if it's already taken
            if 'email' in update_data and update_data['email'] != account.email:
                existing_account = await Account.find_one(Account.email == update_data['email'])
                if existing_account:
                    raise ValueError(f"Account with email {update_data['email']} already exists")
            
            # Update fields
            for field, value in update_data.items():
                if hasattr(account, field) and field != 'id':
                    setattr(account, field, value)
            
            account.updated_at = datetime.now(timezone.utc)
            await account.save()
            
            logger.info(f"Updated account {account_id}")
            return account
            
        except Exception as e:
            logger.error(f"Failed to update account {account_id}: {e}")
            raise
    
    async def delete_account(self, account_id: str) -> bool:
        """Delete account by ID (soft delete by setting status to closed)."""
        try:
            account = await Account.get(PydanticObjectId(account_id))
            if not account:
                return False
            
            # Soft delete by setting status to closed
            account.status = "closed"
            account.updated_at = datetime.now(timezone.utc)
            await account.save()
            
            # Deactivate all sessions for this account
            sessions = await AccountSession.find(AccountSession.account_id == str(account_id)).to_list()
            for session in sessions:
                session.is_active = False
                await session.save()
            
            logger.info(f"Deleted (closed) account {account_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete account {account_id}: {e}")
            return False
    
    async def get_accounts_with_filters(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        skip: int = 0,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> Dict[str, Any]:
        """Get accounts with filtering, pagination, and sorting."""
        try:
            # Build query conditions
            query_conditions = []
            
            if filters:
                # Status filter
                if 'status' in filters and filters['status']:
                    query_conditions.append(Account.status == filters['status'])
                
                # Account type filter
                if 'account_type' in filters and filters['account_type']:
                    query_conditions.append(Account.account_type == filters['account_type'])
                
                # Date range filter
                if 'date_from' in filters and filters['date_from']:
                    query_conditions.append(Account.created_at >= filters['date_from'])
                
                if 'date_to' in filters and filters['date_to']:
                    query_conditions.append(Account.created_at <= filters['date_to'])
                
                # Verified accounts only
                if 'verified_only' in filters and filters['verified_only']:
                    query_conditions.append(Account.verified_at != None)
                
                # Has Google auth
                if 'has_google_auth' in filters and filters['has_google_auth']:
                    query_conditions.append(Account.google_user_id != None)
                
                # Company name search
                if 'company_name_contains' in filters and filters['company_name_contains']:
                    query_conditions.append(Account.company_name.contains(filters['company_name_contains']))
                
                # Email search
                if 'email_contains' in filters and filters['email_contains']:
                    query_conditions.append(Account.email.contains(filters['email_contains']))
            
            # Execute query with pagination and sorting
            query = Account.find(*query_conditions) if query_conditions else Account.find()
            
            # Get total count for pagination
            total_count = await query.count()
            
            # Apply sorting
            if sort_order == 1:
                query = query.sort(f"+{sort_by}")
            else:
                query = query.sort(f"-{sort_by}")
            
            # Apply pagination
            accounts = await query.skip(skip).limit(limit).to_list()
            
            logger.debug(f"Found {len(accounts)} accounts with filters")
            
            return {
                "accounts": accounts,
                "total_count": total_count,
                "page_size": limit,
                "current_page": (skip // limit) + 1,
                "total_pages": (total_count + limit - 1) // limit,
                "has_next": skip + limit < total_count,
                "has_previous": skip > 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get accounts with filters: {e}")
            raise
    
    async def update_vat_settings(self, account_id: str, vat_settings: Dict[str, Any]) -> Optional[Account]:
        """Update VAT-specific settings for an account."""
        try:
            account = await Account.get(PydanticObjectId(account_id))
            if not account:
                return None
            
            # Merge with existing settings
            current_settings = account.vat_settings or {}
            current_settings.update(vat_settings)
            
            account.vat_settings = current_settings
            account.updated_at = datetime.now(timezone.utc)
            await account.save()
            
            logger.info(f"Updated VAT settings for account {account_id}")
            return account
            
        except Exception as e:
            logger.error(f"Failed to update VAT settings for account {account_id}: {e}")
            return None
    
    async def update_usage_stats(self, account_id: str, usage_mb: int) -> Optional[Account]:
        """Update monthly usage statistics for an account."""
        try:
            account = await Account.get(PydanticObjectId(account_id))
            if not account:
                return None
            
            # Reset monthly usage if it's a new month
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            if not hasattr(account, '_last_usage_month') or account._last_usage_month != current_month:
                account.current_month_usage_mb = 0
                account._last_usage_month = current_month
            
            # Add usage
            account.current_month_usage_mb += usage_mb
            account.updated_at = datetime.now(timezone.utc)
            await account.save()
            
            logger.debug(f"Updated usage stats for account {account_id}: +{usage_mb}MB")
            return account
            
        except Exception as e:
            logger.error(f"Failed to update usage stats for account {account_id}: {e}")
            return None
    
    async def check_usage_limit(self, account_id: str, requested_mb: int) -> Dict[str, Any]:
        """Check if account can upload the requested amount without exceeding limits."""
        try:
            account = await Account.get(PydanticObjectId(account_id))
            if not account:
                return {"allowed": False, "reason": "Account not found"}
            
            # Check current usage against limit
            current_usage = account.current_month_usage_mb
            monthly_limit = account.monthly_upload_limit_mb
            
            if current_usage + requested_mb > monthly_limit:
                return {
                    "allowed": False,
                    "reason": "Monthly upload limit exceeded",
                    "current_usage_mb": current_usage,
                    "monthly_limit_mb": monthly_limit,
                    "requested_mb": requested_mb,
                    "available_mb": max(0, monthly_limit - current_usage)
                }
            
            return {
                "allowed": True,
                "current_usage_mb": current_usage,
                "monthly_limit_mb": monthly_limit,
                "requested_mb": requested_mb,
                "remaining_mb": monthly_limit - current_usage - requested_mb
            }
            
        except Exception as e:
            logger.error(f"Failed to check usage limit for account {account_id}: {e}")
            return {"allowed": False, "reason": "Internal error"}
    
    async def get_account_statistics(self) -> Dict[str, Any]:
        """Get overall account statistics."""
        try:
            # Get all accounts
            accounts = await Account.find().to_list()
            
            total_accounts = len(accounts)
            
            # Status breakdown
            status_counts = {}
            for account in accounts:
                status = account.status
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Account type breakdown
            type_counts = {}
            for account in accounts:
                account_type = account.account_type
                type_counts[account_type] = type_counts.get(account_type, 0) + 1
            
            # Verified accounts
            verified_count = len([a for a in accounts if a.verified_at])
            verification_rate = (verified_count / total_accounts * 100) if total_accounts > 0 else 0
            
            # Google auth accounts
            google_auth_count = len([a for a in accounts if a.google_user_id])
            google_auth_rate = (google_auth_count / total_accounts * 100) if total_accounts > 0 else 0
            
            # Usage statistics
            total_usage = sum(a.current_month_usage_mb for a in accounts)
            avg_usage = total_usage / total_accounts if total_accounts > 0 else 0
            
            return {
                "total_accounts": total_accounts,
                "status_breakdown": status_counts,
                "account_type_breakdown": type_counts,
                "verification_rate_percent": round(verification_rate, 2),
                "google_auth_rate_percent": round(google_auth_rate, 2),
                "total_monthly_usage_mb": total_usage,
                "average_monthly_usage_mb": round(avg_usage, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get account statistics: {e}")
            raise


# Global business logic instance
account_bl = AccountBL() 