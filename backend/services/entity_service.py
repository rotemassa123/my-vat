"""
Entity service for managing entities (sub-accounts).
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from models.user_models import Entity
from models.account_models import Account

logger = logging.getLogger(__name__)


class EntityService:
    """Service for handling entity operations."""
    
    async def create_entity(
        self,
        name: str,
        account_id: str,
        country: str,
        description: Optional[str] = None,
        entity_code: Optional[str] = None,
        tax_id: Optional[str] = None,
        vat_number: Optional[str] = None,
        registration_number: Optional[str] = None,
        address: Optional[Dict[str, str]] = None,
        currency: str = "EUR",
        vat_rate: float = 20.0,
        language: str = "en",
        is_default: bool = False,
        auto_process_invoices: bool = False,
        monthly_processing_limit: Optional[int] = None
    ) -> Entity:
        """Create a new entity."""
        try:
            # Verify account exists
            account = await Account.get(account_id)
            if not account:
                raise ValueError("Account not found")
            
            # Check if entity code is unique within account (if provided)
            if entity_code:
                existing_entity = await Entity.find_one(
                    Entity.account == account,
                    Entity.entity_code == entity_code
                )
                if existing_entity:
                    raise ValueError("Entity code already exists in this account")
            
            # If this is set as default, unset other defaults
            if is_default:
                await self._unset_default_entities(account)
            
            # Create entity
            entity = Entity(
                name=name,
                description=description,
                account=account,
                entity_code=entity_code,
                tax_id=tax_id,
                vat_number=vat_number,
                registration_number=registration_number,
                country=country,
                address=address or {},
                currency=currency,
                vat_rate=vat_rate,
                language=language,
                is_default=is_default,
                auto_process_invoices=auto_process_invoices,
                monthly_processing_limit=monthly_processing_limit
            )
            
            await entity.insert()
            logger.info(f"Created new entity: {name} for account {account_id}")
            
            return entity
            
        except Exception as e:
            logger.error(f"Failed to create entity {name}: {e}")
            raise
    
    async def get_entity_by_id(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID."""
        try:
            return await Entity.get(entity_id)
        except Exception as e:
            logger.error(f"Failed to get entity {entity_id}: {e}")
            return None
    
    async def get_entities_by_account(self, account_id: str) -> List[Entity]:
        """Get all entities for an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return []
            
            entities = await Entity.find(Entity.account == account).to_list()
            return entities
            
        except Exception as e:
            logger.error(f"Failed to get entities for account {account_id}: {e}")
            return []
    
    async def get_default_entity(self, account_id: str) -> Optional[Entity]:
        """Get the default entity for an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return None
            
            entity = await Entity.find_one(
                Entity.account == account,
                Entity.is_default == True
            )
            
            return entity
            
        except Exception as e:
            logger.error(f"Failed to get default entity for account {account_id}: {e}")
            return None
    
    async def get_entities_by_country(self, account_id: str, country: str) -> List[Entity]:
        """Get entities by country for an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return []
            
            entities = await Entity.find(
                Entity.account == account,
                Entity.country == country
            ).to_list()
            
            return entities
            
        except Exception as e:
            logger.error(f"Failed to get entities by country {country} for account {account_id}: {e}")
            return []
    
    async def update_entity(
        self,
        entity_id: str,
        **updates
    ) -> Optional[Entity]:
        """Update entity information."""
        try:
            entity = await Entity.get(entity_id)
            if not entity:
                return None
            
            # Handle default entity change
            if 'is_default' in updates and updates['is_default']:
                await self._unset_default_entities(entity.account)
            
            # Update allowed fields
            allowed_fields = {
                'name', 'description', 'entity_code', 'tax_id', 'vat_number',
                'registration_number', 'country', 'address', 'currency',
                'vat_rate', 'language', 'status', 'is_default',
                'auto_process_invoices', 'monthly_processing_limit'
            }
            
            for field, value in updates.items():
                if field in allowed_fields:
                    setattr(entity, field, value)
            
            entity.updated_at = datetime.now(timezone.utc)
            await entity.save()
            
            logger.info(f"Updated entity {entity.name}")
            return entity
            
        except Exception as e:
            logger.error(f"Failed to update entity {entity_id}: {e}")
            return None
    
    async def delete_entity(self, entity_id: str) -> bool:
        """Delete an entity (soft delete by setting status to archived)."""
        try:
            entity = await Entity.get(entity_id)
            if not entity:
                return False
            
            # Don't allow deletion of default entity if it's the only one
            if entity.is_default:
                other_entities = await Entity.find(
                    Entity.account == entity.account,
                    Entity.id != entity.id,
                    Entity.status == "active"
                ).to_list()
                
                if not other_entities:
                    raise ValueError("Cannot delete the only entity in an account")
                
                # Set another entity as default
                other_entities[0].is_default = True
                await other_entities[0].save()
            
            entity.status = "archived"
            entity.updated_at = datetime.now(timezone.utc)
            await entity.save()
            
            logger.info(f"Archived entity {entity.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete entity {entity_id}: {e}")
            return False
    
    async def increment_processing_count(self, entity_id: str) -> bool:
        """Increment the monthly processing count for an entity."""
        try:
            entity = await Entity.get(entity_id)
            if not entity:
                return False
            
            if not entity.can_process_more():
                raise ValueError("Monthly processing limit reached")
            
            entity.current_month_processed += 1
            entity.updated_at = datetime.now(timezone.utc)
            await entity.save()
            
            logger.debug(f"Incremented processing count for entity {entity.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to increment processing count for entity {entity_id}: {e}")
            return False
    
    async def reset_monthly_processing_counts(self, account_id: str) -> int:
        """Reset monthly processing counts for all entities in an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return 0
            
            entities = await Entity.find(Entity.account == account).to_list()
            
            count = 0
            for entity in entities:
                entity.current_month_processed = 0
                entity.updated_at = datetime.now(timezone.utc)
                await entity.save()
                count += 1
            
            logger.info(f"Reset monthly processing counts for {count} entities in account {account_id}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to reset processing counts for account {account_id}: {e}")
            return 0
    
    async def get_entity_statistics(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get statistics for an entity."""
        try:
            entity = await Entity.get(entity_id)
            if not entity:
                return None
            
            # Basic statistics
            stats = {
                "entity_id": str(entity.id),
                "name": entity.name,
                "country": entity.country,
                "currency": entity.currency,
                "current_month_processed": entity.current_month_processed,
                "monthly_processing_limit": entity.monthly_processing_limit,
                "processing_limit_reached": not entity.can_process_more(),
                "is_default": entity.is_default,
                "status": entity.status,
                "created_at": entity.created_at,
                "updated_at": entity.updated_at
            }
            
            # TODO: Add more statistics like:
            # - Total invoices processed
            # - Total VAT reclaimed
            # - Average processing time
            # - Success rate
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get statistics for entity {entity_id}: {e}")
            return None
    
    async def get_account_statistics(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get aggregated statistics for all entities in an account."""
        try:
            account = await Account.get(account_id)
            if not account:
                return None
            
            entities = await Entity.find(Entity.account == account).to_list()
            
            # Aggregate statistics
            total_entities = len(entities)
            active_entities = len([e for e in entities if e.status == "active"])
            total_processed_this_month = sum(e.current_month_processed for e in entities)
            
            countries = list(set(e.country for e in entities))
            currencies = list(set(e.currency for e in entities))
            
            stats = {
                "account_id": str(account.id),
                "total_entities": total_entities,
                "active_entities": active_entities,
                "total_processed_this_month": total_processed_this_month,
                "countries": countries,
                "currencies": currencies,
                "entities": [
                    {
                        "id": str(e.id),
                        "name": e.name,
                        "country": e.country,
                        "status": e.status,
                        "is_default": e.is_default,
                        "current_month_processed": e.current_month_processed
                    }
                    for e in entities
                ]
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get account statistics for {account_id}: {e}")
            return None
    
    async def _unset_default_entities(self, account: Account) -> None:
        """Helper method to unset all default entities for an account."""
        try:
            default_entities = await Entity.find(
                Entity.account == account,
                Entity.is_default == True
            ).to_list()
            
            for entity in default_entities:
                entity.is_default = False
                await entity.save()
                
        except Exception as e:
            logger.error(f"Failed to unset default entities for account {account.id}: {e}")
            raise 