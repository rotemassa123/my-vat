"""
Unit and integration tests for VAT processing system.
"""
import pytest
import asyncio
from datetime import datetime, timezone
from httpx import AsyncClient
from unittest.mock import Mock, patch, AsyncMock

from app import create_app
from models.account_models import Account, AccountSession
from models.mongo_models import Invoice, Summary
from BL.invoice_bl import invoice_bl
from BL.summary_bl import summary_bl
from BL.account_bl import account_bl
from services.auth_service import auth_service


@pytest.fixture
def app():
    """Create test app."""
    return create_app()


@pytest.fixture
async def client(app):
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def mock_account():
    """Create mock account for testing."""
    account = Mock(spec=Account)
    account.id = "507f1f77bcf86cd799439011"
    account.email = "test@example.com"
    account.name = "Test User"
    account.account_type = "individual"
    account.status = "active"
    account.permissions = ["upload", "view", "process"]
    account.monthly_upload_limit_mb = 1000
    account.current_month_usage_mb = 100
    account.vat_settings = {"default_currency": "USD", "vat_rate": 20.0}
    account.created_at = datetime.now(timezone.utc)
    account.last_login = datetime.now(timezone.utc)
    return account


@pytest.fixture
async def mock_invoice():
    """Create mock invoice for testing."""
    invoice = Mock(spec=Invoice)
    invoice.id = "507f1f77bcf86cd799439012"
    invoice.name = "test_invoice.pdf"
    invoice.source_id = "drive_file_123"
    invoice.size = 1024000
    invoice.account_id = 123456
    invoice.last_executed_step = 1
    invoice.source = "google_drive"
    invoice.content_type = "application/pdf"
    invoice.status = None
    invoice.reason = None
    invoice.created_at = datetime.now(timezone.utc)
    return invoice


@pytest.fixture
async def mock_summary():
    """Create mock summary for testing."""
    summary = Mock(spec=Summary)
    summary.id = "507f1f77bcf86cd799439013"
    summary.file_id = "507f1f77bcf86cd799439012"
    summary.file_name = "test_invoice.pdf"
    summary.account_id = 123456
    summary.model_used = "gpt-4o-mini"
    summary.tokens_used = 1500
    summary.cost_usd = 0.15
    summary.is_invoice = True
    summary.summary_content = "Invoice from Acme Corp for $500"
    summary.extracted_data = {"total": 500, "vendor": "Acme Corp"}
    summary.processing_time_seconds = 2.5
    summary.success = True
    summary.created_at = datetime.now(timezone.utc)
    return summary


class TestAccountBL:
    """Test Account business logic."""
    
    @pytest.mark.asyncio
    async def test_create_account(self):
        """Test account creation."""
        with patch.object(account_bl, 'create_account') as mock_create:
            # Setup mock
            account_data = {
                "email": "test@example.com",
                "name": "Test User",
                "account_type": "individual"
            }
            mock_account = Mock(spec=Account)
            mock_account.id = "507f1f77bcf86cd799439011"
            mock_account.email = "test@example.com"
            mock_create.return_value = mock_account
            
            # Test
            result = await account_bl.create_account(account_data)
            
            # Verify
            mock_create.assert_called_once_with(account_data)
            assert result.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_create_account_duplicate_email(self):
        """Test account creation with duplicate email."""
        with patch.object(account_bl, 'create_account') as mock_create:
            # Setup mock to raise ValueError
            account_data = {
                "email": "test@example.com",
                "name": "Test User"
            }
            mock_create.side_effect = ValueError("Account with email test@example.com already exists")
            
            # Test and verify exception
            with pytest.raises(ValueError, match="already exists"):
                await account_bl.create_account(account_data)
    
    @pytest.mark.asyncio
    async def test_get_account_by_id(self, mock_account):
        """Test getting account by ID."""
        with patch.object(account_bl, 'get_account_by_id') as mock_get:
            mock_get.return_value = mock_account
            
            result = await account_bl.get_account_by_id("507f1f77bcf86cd799439011")
            
            assert result.email == "test@example.com"
            mock_get.assert_called_once_with("507f1f77bcf86cd799439011")
    
    @pytest.mark.asyncio
    async def test_update_account(self, mock_account):
        """Test account update."""
        with patch.object(account_bl, 'update_account') as mock_update:
            update_data = {"name": "Updated Name"}
            mock_account.name = "Updated Name"
            mock_update.return_value = mock_account
            
            result = await account_bl.update_account("507f1f77bcf86cd799439011", update_data)
            
            assert result.name == "Updated Name"
            mock_update.assert_called_once_with("507f1f77bcf86cd799439011", update_data)


class TestInvoiceBL:
    """Test Invoice business logic."""
    
    @pytest.mark.asyncio
    async def test_create_invoice(self, mock_invoice):
        """Test invoice creation."""
        with patch.object(invoice_bl, 'create_invoice') as mock_create:
            invoice_data = {
                "name": "test_invoice.pdf",
                "source_id": "drive_file_123",
                "size": 1024000,
                "account_id": 123456
            }
            mock_create.return_value = mock_invoice
            
            result = await invoice_bl.create_invoice(invoice_data)
            
            assert result.name == "test_invoice.pdf"
            mock_create.assert_called_once_with(invoice_data)
    
    @pytest.mark.asyncio
    async def test_batch_create_invoices(self, mock_invoice):
        """Test batch invoice creation."""
        with patch.object(invoice_bl, 'batch_create_invoices') as mock_batch_create:
            invoices_data = [
                {
                    "name": "invoice1.pdf",
                    "source_id": "file1",
                    "size": 1000,
                    "account_id": 123456
                },
                {
                    "name": "invoice2.pdf",
                    "source_id": "file2",
                    "size": 2000,
                    "account_id": 123456
                }
            ]
            mock_batch_create.return_value = [mock_invoice, mock_invoice]
            
            result = await invoice_bl.batch_create_invoices(invoices_data)
            
            assert len(result) == 2
            mock_batch_create.assert_called_once_with(invoices_data)
    
    @pytest.mark.asyncio
    async def test_get_invoices_with_filters(self, mock_invoice):
        """Test getting invoices with filters."""
        with patch.object(invoice_bl, 'get_invoices_with_filters') as mock_get:
            filters = {"status": "active", "source": "google_drive"}
            mock_result = {
                "invoices": [mock_invoice],
                "total_count": 1,
                "page_size": 100,
                "current_page": 1,
                "total_pages": 1,
                "has_next": False,
                "has_previous": False
            }
            mock_get.return_value = mock_result
            
            result = await invoice_bl.get_invoices_with_filters(
                account_id=123456,
                filters=filters,
                limit=100,
                skip=0
            )
            
            assert result["total_count"] == 1
            assert len(result["invoices"]) == 1
            mock_get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_invoice_statistics(self):
        """Test getting invoice statistics."""
        with patch.object(invoice_bl, 'get_invoice_statistics') as mock_stats:
            mock_stats.return_value = {
                "total_count": 100,
                "total_size_bytes": 1024000000,
                "total_size_mb": 1000.0,
                "status_breakdown": {"active": 90, "failed": 10},
                "step_breakdown": {1: 20, 2: 80},
                "source_breakdown": {"google_drive": 100},
                "average_file_size_mb": 10.0
            }
            
            result = await invoice_bl.get_invoice_statistics(123456)
            
            assert result["total_count"] == 100
            assert result["average_file_size_mb"] == 10.0
            mock_stats.assert_called_once_with(123456)


class TestSummaryBL:
    """Test Summary business logic."""
    
    @pytest.mark.asyncio
    async def test_create_summary(self, mock_summary):
        """Test summary creation."""
        with patch.object(summary_bl, 'create_summary') as mock_create:
            summary_data = {
                "file_id": "507f1f77bcf86cd799439012",
                "file_name": "test_invoice.pdf",
                "account_id": 123456,
                "model_used": "gpt-4o-mini",
                "tokens_used": 1500,
                "cost_usd": 0.15,
                "is_invoice": True,
                "summary_content": "Test summary",
                "processing_time_seconds": 2.5
            }
            mock_create.return_value = mock_summary
            
            result = await summary_bl.create_summary(summary_data)
            
            assert result.is_invoice == True
            assert result.cost_usd == 0.15
            mock_create.assert_called_once_with(summary_data)
    
    @pytest.mark.asyncio
    async def test_get_summaries_with_filters(self, mock_summary):
        """Test getting summaries with filters."""
        with patch.object(summary_bl, 'get_summaries_with_filters') as mock_get:
            filters = {"is_invoice": True, "success": True}
            mock_result = {
                "summaries": [mock_summary],
                "total_count": 1,
                "page_size": 100,
                "current_page": 1,
                "total_pages": 1,
                "has_next": False,
                "has_previous": False
            }
            mock_get.return_value = mock_result
            
            result = await summary_bl.get_summaries_with_filters(
                account_id=123456,
                filters=filters
            )
            
            assert result["total_count"] == 1
            assert len(result["summaries"]) == 1
            mock_get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_summary_statistics(self):
        """Test getting summary statistics."""
        with patch.object(summary_bl, 'get_summary_statistics') as mock_stats:
            mock_stats.return_value = {
                "total_count": 50,
                "total_cost_usd": 10.5,
                "total_tokens_used": 75000,
                "success_rate_percent": 96.0,
                "invoice_detection_rate_percent": 80.0,
                "model_usage_breakdown": {"gpt-4o-mini": 50},
                "average_processing_time_seconds": 2.1,
                "average_cost_per_summary": 0.21,
                "average_tokens_per_summary": 1500.0
            }
            
            result = await summary_bl.get_summary_statistics(123456)
            
            assert result["total_count"] == 50
            assert result["success_rate_percent"] == 96.0
            mock_stats.assert_called_once_with(123456)


class TestAuthService:
    """Test Authentication service."""
    
    @pytest.mark.asyncio
    async def test_create_google_oauth_url(self):
        """Test Google OAuth URL creation."""
        with patch.object(auth_service, 'create_google_oauth_url') as mock_create_url:
            mock_create_url.return_value = "https://accounts.google.com/oauth2/auth?..."
            
            result = auth_service.create_google_oauth_url()
            
            assert "accounts.google.com" in result
            mock_create_url.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_google_callback(self, mock_account):
        """Test Google OAuth callback handling."""
        with patch.object(auth_service, 'handle_google_callback') as mock_callback:
            mock_callback.return_value = {
                "account": mock_account,
                "session_token": "session_123",
                "access_token": "jwt_token_123"
            }
            
            result = await auth_service.handle_google_callback("auth_code", "state")
            
            assert result["account"].email == "test@example.com"
            assert "session_token" in result
            assert "access_token" in result
            mock_callback.assert_called_once_with("auth_code", "state")
    
    def test_generate_jwt_token(self, mock_account):
        """Test JWT token generation."""
        with patch.object(auth_service, 'generate_jwt_token') as mock_generate:
            mock_generate.return_value = "jwt_token_123"
            
            result = auth_service.generate_jwt_token(mock_account)
            
            assert result == "jwt_token_123"
            mock_generate.assert_called_once_with(mock_account)
    
    def test_verify_jwt_token(self):
        """Test JWT token verification."""
        with patch.object(auth_service, 'verify_jwt_token') as mock_verify:
            mock_verify.return_value = {
                "sub": "507f1f77bcf86cd799439011",
                "email": "test@example.com",
                "permissions": ["upload", "view"]
            }
            
            result = auth_service.verify_jwt_token("jwt_token_123")
            
            assert result["email"] == "test@example.com"
            assert "upload" in result["permissions"]
            mock_verify.assert_called_once_with("jwt_token_123")


class TestVATRoutes:
    """Test VAT API routes."""
    
    @pytest.mark.asyncio
    async def test_create_account_endpoint(self, client):
        """Test account creation endpoint."""
        with patch('routes.vat_routes.account_bl.create_account') as mock_create:
            mock_account = Mock(spec=Account)
            mock_account.id = "507f1f77bcf86cd799439011"
            mock_account.email = "test@example.com"
            mock_account.name = "Test User"
            mock_account.account_type = "individual"
            mock_account.status = "active"
            mock_account.company_name = None
            mock_account.vat_number = None
            mock_account.address = {}
            mock_account.vat_settings = {}
            mock_account.monthly_upload_limit_mb = 1000
            mock_account.current_month_usage_mb = 0
            mock_account.created_at = datetime.now(timezone.utc)
            mock_account.last_login = None
            mock_create.return_value = mock_account
            
            response = await client.post("/api/vat/accounts", json={
                "email": "test@example.com",
                "name": "Test User"
            })
            
            assert response.status_code == 201
            data = response.json()
            assert data["email"] == "test@example.com"
            assert data["name"] == "Test User"
    
    @pytest.mark.asyncio
    async def test_get_invoices_unauthorized(self, client):
        """Test getting invoices without authentication."""
        response = await client.get("/api/vat/invoices")
        
        assert response.status_code == 403  # No authorization header
    
    @pytest.mark.asyncio
    async def test_create_invoice_with_auth(self, client, mock_account):
        """Test creating invoice with authentication."""
        with patch('routes.vat_routes.get_current_account') as mock_auth:
            with patch('routes.vat_routes.invoice_bl.create_invoice') as mock_create:
                # Setup mocks
                mock_auth.return_value = mock_account
                mock_invoice = Mock(spec=Invoice)
                mock_invoice.id = "507f1f77bcf86cd799439012"
                mock_invoice.name = "test.pdf"
                mock_invoice.source_id = "file123"
                mock_invoice.size = 1000
                mock_invoice.account_id = 123456
                mock_invoice.last_executed_step = 1
                mock_invoice.source = "google_drive"
                mock_invoice.content_type = "application/pdf"
                mock_invoice.status = None
                mock_invoice.reason = None
                mock_invoice.created_at = datetime.now(timezone.utc)
                mock_create.return_value = mock_invoice
                
                response = await client.post("/api/vat/invoices", 
                    json={
                        "name": "test.pdf",
                        "source_id": "file123",
                        "size": 1000,
                        "account_id": 123456
                    },
                    headers={"Authorization": "Bearer test_token"}
                )
                
                assert response.status_code == 201
                data = response.json()
                assert data["name"] == "test.pdf"


class TestLargeFileUpload:
    """Test large file upload functionality."""
    
    @pytest.mark.asyncio
    async def test_initiate_upload(self):
        """Test upload initiation."""
        from services.large_file_service import LargeFileUploadService
        from unittest.mock import Mock
        
        # Mock storage client
        storage_client = Mock()
        service = LargeFileUploadService(storage_client)
        
        result = await service.initiate_upload(
            filename="large_file.pdf",
            content_type="application/pdf",
            size=100 * 1024 * 1024,  # 100MB
            account_id=123456
        )
        
        assert "upload_id" in result
        assert result["total_chunks"] > 0
        assert "expires_at" in result
    
    @pytest.mark.asyncio
    async def test_upload_chunk(self):
        """Test chunk upload."""
        from services.large_file_service import LargeFileUploadService
        from unittest.mock import Mock
        
        # Mock storage client
        storage_client = Mock()
        service = LargeFileUploadService(storage_client)
        
        # First initiate upload
        init_result = await service.initiate_upload(
            filename="test.pdf",
            content_type="application/pdf",
            size=1024,
            account_id=123456
        )
        upload_id = init_result["upload_id"]
        
        # Test uploading a chunk
        chunk_data = b"test data chunk"
        result = await service.upload_chunk(
            upload_id=upload_id,
            chunk_number=0,
            chunk_data=chunk_data,
            is_final_chunk=True
        )
        
        assert result["upload_id"] == upload_id
        assert result["chunk_number"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 