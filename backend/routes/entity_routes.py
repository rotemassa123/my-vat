"""
Entity management API routes.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from services.entity_service import EntityService
from services.user_service import UserService
from models.user_models import User, Entity

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/entities", tags=["entities"])
security = HTTPBearer()

# Initialize services
entity_service = EntityService()
user_service = UserService()


# Request/Response models
class EntityCreateRequest(BaseModel):
    name: str
    country: str
    description: Optional[str] = None
    entity_code: Optional[str] = None
    tax_id: Optional[str] = None
    vat_number: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    currency: str = "EUR"
    vat_rate: float = 20.0
    language: str = "en"
    is_default: bool = False
    auto_process_invoices: bool = False
    monthly_processing_limit: Optional[int] = None


class EntityUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    entity_code: Optional[str] = None
    tax_id: Optional[str] = None
    vat_number: Optional[str] = None
    registration_number: Optional[str] = None
    country: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    currency: Optional[str] = None
    vat_rate: Optional[float] = None
    language: Optional[str] = None
    status: Optional[str] = None
    is_default: Optional[bool] = None
    auto_process_invoices: Optional[bool] = None
    monthly_processing_limit: Optional[int] = None


class EntityResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    account_id: str
    entity_code: Optional[str]
    tax_id: Optional[str]
    vat_number: Optional[str]
    registration_number: Optional[str]
    country: str
    address: Dict[str, str]
    currency: str
    vat_rate: float
    language: str
    status: str
    is_default: bool
    auto_process_invoices: bool
    monthly_processing_limit: Optional[int]
    current_month_processed: int
    created_at: str
    updated_at: str


class EntityStatisticsResponse(BaseModel):
    entity_id: str
    name: str
    country: str
    currency: str
    current_month_processed: int
    monthly_processing_limit: Optional[int]
    processing_limit_reached: bool
    is_default: bool
    status: str
    created_at: str
    updated_at: str


class AccountStatisticsResponse(BaseModel):
    account_id: str
    total_entities: int
    active_entities: int
    total_processed_this_month: int
    countries: List[str]
    currencies: List[str]
    entities: List[Dict[str, Any]]


# Dependency to get current user from JWT token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from JWT token."""
    try:
        payload = user_service.verify_jwt_token(credentials.credentials)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user = await user_service.get_user_by_id(payload["sub"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


# Helper function to convert Entity to EntityResponse
def entity_to_response(entity: Entity) -> EntityResponse:
    """Convert Entity model to EntityResponse."""
    return EntityResponse(
        id=str(entity.id),
        name=entity.name,
        description=entity.description,
        account_id=str(entity.account.id),
        entity_code=entity.entity_code,
        tax_id=entity.tax_id,
        vat_number=entity.vat_number,
        registration_number=entity.registration_number,
        country=entity.country,
        address=entity.address,
        currency=entity.currency,
        vat_rate=entity.vat_rate,
        language=entity.language,
        status=entity.status,
        is_default=entity.is_default,
        auto_process_invoices=entity.auto_process_invoices,
        monthly_processing_limit=entity.monthly_processing_limit,
        current_month_processed=entity.current_month_processed,
        created_at=entity.created_at.isoformat(),
        updated_at=entity.updated_at.isoformat()
    )


@router.post("/", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
async def create_entity(
    request: EntityCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new entity."""
    try:
        # Check permissions
        if not current_user.can_perform_action("manage_entities"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create entities"
            )
        
        entity = await entity_service.create_entity(
            name=request.name,
            account_id=str(current_user.account.id),
            country=request.country,
            description=request.description,
            entity_code=request.entity_code,
            tax_id=request.tax_id,
            vat_number=request.vat_number,
            registration_number=request.registration_number,
            address=request.address,
            currency=request.currency,
            vat_rate=request.vat_rate,
            language=request.language,
            is_default=request.is_default,
            auto_process_invoices=request.auto_process_invoices,
            monthly_processing_limit=request.monthly_processing_limit
        )
        
        return entity_to_response(entity)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Entity creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entity creation failed"
        )


@router.get("/", response_model=List[EntityResponse])
async def get_entities(
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get entities for the current user's account."""
    try:
        account_id = str(current_user.account.id)
        
        if country:
            entities = await entity_service.get_entities_by_country(account_id, country)
        else:
            entities = await entity_service.get_entities_by_account(account_id)
        
        return [entity_to_response(entity) for entity in entities]
        
    except Exception as e:
        logger.error(f"Failed to get entities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entities"
        )


@router.get("/default", response_model=EntityResponse)
async def get_default_entity(current_user: User = Depends(get_current_user)):
    """Get the default entity for the current user's account."""
    try:
        account_id = str(current_user.account.id)
        entity = await entity_service.get_default_entity(account_id)
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No default entity found"
            )
        
        return entity_to_response(entity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get default entity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve default entity"
        )


@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get entity by ID."""
    try:
        entity = await entity_service.get_entity_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        # Check if entity belongs to user's account
        if str(entity.account.id) != str(current_user.account.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Entity does not belong to your account"
            )
        
        return entity_to_response(entity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get entity {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entity"
        )


@router.put("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: str,
    request: EntityUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update entity information."""
    try:
        # Check permissions
        if not current_user.can_perform_action("manage_entities"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update entities"
            )
        
        # Check if entity exists and belongs to user's account
        existing_entity = await entity_service.get_entity_by_id(entity_id)
        if not existing_entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        if str(existing_entity.account.id) != str(current_user.account.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Entity does not belong to your account"
            )
        
        # Convert request to dict, excluding None values
        updates = {k: v for k, v in request.dict().items() if v is not None}
        
        entity = await entity_service.update_entity(entity_id, **updates)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        return entity_to_response(entity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update entity {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update entity"
        )


@router.delete("/{entity_id}")
async def delete_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete (archive) an entity."""
    try:
        # Check permissions
        if not current_user.can_perform_action("manage_entities"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete entities"
            )
        
        # Check if entity exists and belongs to user's account
        existing_entity = await entity_service.get_entity_by_id(entity_id)
        if not existing_entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        if str(existing_entity.account.id) != str(current_user.account.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Entity does not belong to your account"
            )
        
        success = await entity_service.delete_entity(entity_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete entity"
            )
        
        return {"message": "Entity deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete entity {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete entity"
        )


@router.get("/{entity_id}/statistics", response_model=EntityStatisticsResponse)
async def get_entity_statistics(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get statistics for an entity."""
    try:
        # Check if entity exists and belongs to user's account
        entity = await entity_service.get_entity_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        if str(entity.account.id) != str(current_user.account.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Entity does not belong to your account"
            )
        
        stats = await entity_service.get_entity_statistics(entity_id)
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statistics not found"
            )
        
        return EntityStatisticsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get entity statistics {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entity statistics"
        )


@router.get("/account/statistics", response_model=AccountStatisticsResponse)
async def get_account_statistics(current_user: User = Depends(get_current_user)):
    """Get aggregated statistics for all entities in the current user's account."""
    try:
        account_id = str(current_user.account.id)
        stats = await entity_service.get_account_statistics(account_id)
        
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statistics not found"
            )
        
        return AccountStatisticsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get account statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account statistics"
        )


@router.post("/{entity_id}/increment-processing")
async def increment_processing_count(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Increment the monthly processing count for an entity."""
    try:
        # Check if entity exists and belongs to user's account
        entity = await entity_service.get_entity_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        if str(entity.account.id) != str(current_user.account.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Entity does not belong to your account"
            )
        
        success = await entity_service.increment_processing_count(entity_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to increment processing count or limit reached"
            )
        
        return {"message": "Processing count incremented successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment processing count for entity {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to increment processing count"
        )


@router.post("/account/reset-processing-counts")
async def reset_monthly_processing_counts(current_user: User = Depends(get_current_user)):
    """Reset monthly processing counts for all entities in the current user's account."""
    try:
        # Check permissions
        if not current_user.can_perform_action("manage_entities"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to reset processing counts"
            )
        
        account_id = str(current_user.account.id)
        count = await entity_service.reset_monthly_processing_counts(account_id)
        
        return {"message": f"Reset processing counts for {count} entities"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset processing counts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset processing counts"
        ) 