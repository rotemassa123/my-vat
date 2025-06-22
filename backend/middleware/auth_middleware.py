"""
Authentication middleware for FastAPI.
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from services.auth_service import auth_service
from models.account_models import Account

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to handle authentication for all requests."""
    
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/api/auth/",
            "/api/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request and check authentication."""
        path = request.url.path
        
        # Skip authentication for excluded paths
        if any(path.startswith(excluded_path) for excluded_path in self.exclude_paths):
            return await call_next(request)
        
        # Extract token from cookie or Authorization header
        token = self._extract_token(request)
        
        if not token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authentication required"}
            )
        
        # Validate token
        account = await self._validate_token(token)
        
        if not account:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired token"}
            )
        
        # Add account to request state
        request.state.current_account = account
        
        return await call_next(request)
    
    def _extract_token(self, request: Request) -> Optional[str]:
        """Extract auth token from cookie or Authorization header."""
        # Check for token in cookie first
        token = request.cookies.get("auth_token")
        if token:
            return token
        
        # Check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        
        return None
    
    async def _validate_token(self, token: str) -> Optional[Account]:
        """Validate JWT token or session token."""
        try:
            # First try as JWT token
            payload = auth_service.verify_jwt_token(token)
            if payload:
                # Get account from JWT payload
                account_id = payload.get("sub")
                if account_id:
                    account = await Account.get(account_id)
                    return account
            
            # If JWT validation fails, try as session token
            account = await auth_service.validate_session(token)
            return account
            
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            return None


# Security dependency for manual auth checking
security = HTTPBearer(auto_error=False)


async def get_current_account(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = None
) -> Account:
    """Dependency to get current authenticated account."""
    # Check if account is already set by middleware
    if hasattr(request.state, "current_account"):
        return request.state.current_account
    
    # Manual token extraction and validation
    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Check cookie
        token = request.cookies.get("auth_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Validate token
    try:
        # Try JWT first
        payload = auth_service.verify_jwt_token(token)
        if payload:
            account_id = payload.get("sub")
            if account_id:
                account = await Account.get(account_id)
                if account:
                    return account
        
        # Try session token
        account = await auth_service.validate_session(token)
        if account:
            return account
            
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token"
    )


async def get_optional_account(request: Request) -> Optional[Account]:
    """Dependency to optionally get current authenticated account."""
    try:
        return await get_current_account(request)
    except HTTPException:
        return None 