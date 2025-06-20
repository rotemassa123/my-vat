"""
User management API routes.
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import logging

from services.user_service import UserService
from services.auth_service import AuthService
from models.user_models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])
security = HTTPBearer()

# Initialize services
user_service = UserService()
auth_service = AuthService()


# Request/Response models
class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    account_id: str
    role: str = "viewer"
    permissions: Optional[List[str]] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    reset_token: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    account_id: str
    role: str
    permissions: List[str]
    status: str
    email_verified: bool
    last_login: Optional[str] = None
    created_at: str
    updated_at: str


class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    session_token: str


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


# Helper function to convert User to UserResponse
def user_to_response(user: User) -> UserResponse:
    """Convert User model to UserResponse."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        account_id=str(user.account.id),
        role=user.role,
        permissions=user.permissions,
        status=user.status,
        email_verified=user.email_verified,
        last_login=user.last_login.isoformat() if user.last_login else None,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat()
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(request: UserCreateRequest):
    """Register a new user."""
    try:
        user = await user_service.create_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            account_id=request.account_id,
            role=request.role,
            permissions=request.permissions
        )
        
        return user_to_response(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"User registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=LoginResponse)
async def login_user(request: UserLoginRequest, http_request: Request):
    """Authenticate user and return tokens."""
    try:
        result = await user_service.authenticate_user(request.email, request.password)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        return LoginResponse(
            user=user_to_response(result["user"]),
            access_token=result["access_token"],
            session_token=result["session_token"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/logout")
async def logout_user(
    session_token: str,
    current_user: User = Depends(get_current_user)
):
    """Logout user session."""
    try:
        success = await user_service.logout_session(session_token)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session token"
            )
        
        return {"message": "Logged out successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return user_to_response(current_user)


@router.get("/", response_model=List[UserResponse])
async def get_users(
    account_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get users. If account_id is provided, get users for that account."""
    try:
        # Check permissions
        if not current_user.can_perform_action("manage_users"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Use current user's account if no account_id provided
        target_account_id = account_id or str(current_user.account.id)
        
        users = await user_service.get_users_by_account(target_account_id)
        return [user_to_response(user) for user in users]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user by ID."""
    try:
        # Check if user is requesting their own info or has permission
        if str(current_user.id) != user_id and not current_user.can_perform_action("manage_users"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_to_response(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user information."""
    try:
        # Check permissions
        if str(current_user.id) != user_id and not current_user.can_perform_action("manage_users"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Convert request to dict, excluding None values
        updates = {k: v for k, v in request.dict().items() if v is not None}
        
        user = await user_service.update_user(user_id, **updates)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_to_response(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.post("/{user_id}/change-password")
async def change_user_password(
    user_id: str,
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password."""
    try:
        # Users can only change their own password
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only change your own password"
            )
        
        success = await user_service.change_password(
            user_id,
            request.old_password,
            request.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid old password or user not found"
            )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to change password for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.post("/password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request password reset token."""
    try:
        reset_token = await user_service.generate_password_reset_token(request.email)
        
        # Always return success for security (don't reveal if email exists)
        return {"message": "If the email exists, a reset token has been sent"}
        
    except Exception as e:
        logger.error(f"Password reset request failed: {e}")
        # Still return success for security
        return {"message": "If the email exists, a reset token has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(request: PasswordResetConfirmRequest):
    """Confirm password reset with token."""
    try:
        success = await user_service.reset_password(
            request.reset_token,
            request.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        ) 