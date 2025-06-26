"""
Authentication routes for login, registration, and OAuth.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, status, Depends
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

from models.api_models import LoginRequest, RegisterRequest, AuthResponse, GoogleAuthRequest
from services.auth_service import auth_service
from middleware.auth_middleware import get_current_account, get_optional_account
from models.account_models import Account
from config import config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def set_auth_cookie(response: Response, token: str) -> None:
    """Helper function to set authentication cookie with consistent settings."""
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=24 * 60 * 60,  # 24 hours
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        domain=config.COOKIE_DOMAIN
    )


def clear_auth_cookie(response: Response) -> None:
    """Helper function to clear authentication cookie."""
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        domain=config.COOKIE_DOMAIN
    )


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, response: Response):
    """Register a new user with email/password."""
    try:
        result = await auth_service.register_with_email(
            email=request.email,
            password=request.password,
            name=request.name,
            company_name=request.company_name
        )
        
        account = result["account"]
        session_token = result["session_token"]
        
        # Set secure cookie with session token
        set_auth_cookie(response, session_token)
        
        return AuthResponse(
            account_id=str(account.id),
            email=account.email,
            name=account.name,
            permissions=account.permissions,
            auth_providers=account.auth_providers,
            message="Registration successful"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, response: Response):
    """Login with email/password."""
    try:
        result = await auth_service.login_with_email(
            email=request.email,
            password=request.password
        )
        
        account = result["account"]
        session_token = result["session_token"]
        
        # Set secure cookie with session token
        set_auth_cookie(response, session_token)
        
        return AuthResponse(
            account_id=str(account.id),
            email=account.email,
            name=account.name,
            permissions=account.permissions,
            auth_providers=account.auth_providers,
            message="Login successful"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/google")
async def google_auth():
    """Redirect to Google OAuth2 authorization."""
    try:
        auth_url = auth_service.create_google_oauth_url()
        return RedirectResponse(url=auth_url)
        
    except Exception as e:
        logger.error(f"Google auth URL generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication not available"
        )


@router.get("/google/callback")
async def google_callback(code: str, state: Optional[str] = None, response: Response = None):
    """Handle Google OAuth2 callback."""
    try:
        result = await auth_service.handle_google_callback(code, state)
        
        account = result["account"]
        session_token = result["session_token"]
        
        # Set secure cookie with session token
        set_auth_cookie(response, session_token)
        
        # Redirect to frontend with success message
        frontend_url = "http://localhost:5176"  # Updated to match current frontend port
        redirect_url = f"{frontend_url}/dashboard?login=success"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"Google OAuth callback failed: {e}")
        
        # Redirect to frontend with error
        frontend_url = "http://localhost:5176"  # Updated to match current frontend port
        error_params = urlencode({"error": "google_auth_failed"})
        redirect_url = f"{frontend_url}/login?{error_params}"
        return RedirectResponse(url=redirect_url)


@router.post("/logout")
async def logout(request: Request, response: Response, account: Account = Depends(get_current_account)):
    """Logout current user."""
    try:
        # Get session token from cookie
        session_token = request.cookies.get("auth_token")
        
        if session_token:
            # Deactivate session
            await auth_service.logout_session(session_token)
        
        # Clear cookie
        clear_auth_cookie(response)
        
        return {"message": "Logout successful"}
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        # Still clear the cookie even if logout fails
        clear_auth_cookie(response)
        return {"message": "Logout completed"}


@router.get("/me", response_model=AuthResponse)
async def get_current_user(account: Account = Depends(get_current_account)):
    """Get current authenticated user information."""
    return AuthResponse(
        account_id=str(account.id),
        email=account.email,
        name=account.name,
        permissions=account.permissions,
        auth_providers=account.auth_providers,
        message="User information retrieved"
    )


@router.post("/refresh")
async def refresh_token(request: Request, response: Response, account: Account = Depends(get_current_account)):
    """Refresh authentication token."""
    try:
        # Create new session
        session_token = await auth_service.create_session(
            account.id,
            provider="refresh"
        )
        
        # Set new cookie
        set_auth_cookie(response, session_token)
        
        return {"message": "Token refreshed successfully"}
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        ) 