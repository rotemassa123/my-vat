"""
Tests for User and Entity system.
"""
import pytest
import asyncio
from datetime import datetime, timezone
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from models.account_models import Account
from models.user_models import User, Entity
from services.user_service import UserService
from services.entity_service import EntityService


class TestUserEntitySystem:
    """Test cases for User and Entity system."""
    
    @pytest.fixture(scope="class")
    async def setup_database(self):
        """Setup test database."""
        # Use a test database
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        database = client.test_vat_system
        
        # Initialize Beanie with test database
        await init_beanie(
            database=database,
            document_models=[Account, User, Entity]
        )
        
        yield database
        
        # Cleanup
        await database.drop_collection("accounts")
        await database.drop_collection("users")
        await database.drop_collection("entities")
        client.close()
    
    @pytest.fixture
    async def test_account(self, setup_database):
        """Create a test account."""
        account = Account(
            email="test@example.com",
            name="Test Company",
            company_name="Test Company Ltd"
        )
        await account.insert()
        return account
    
    @pytest.fixture
    async def user_service(self):
        """Create user service instance."""
        return UserService()
    
    @pytest.fixture
    async def entity_service(self):
        """Create entity service instance."""
        return EntityService()
    
    async def test_create_user(self, test_account, user_service):
        """Test user creation."""
        user = await user_service.create_user(
            email="user@example.com",
            password="testpassword123",
            full_name="Test User",
            account_id=str(test_account.id),
            role="member"
        )
        
        assert user.email == "user@example.com"
        assert user.full_name == "Test User"
        assert user.role == "member"
        assert user.verify_password("testpassword123")
        assert not user.verify_password("wrongpassword")
    
    async def test_user_authentication(self, test_account, user_service):
        """Test user authentication."""
        # Create user
        await user_service.create_user(
            email="auth@example.com",
            password="password123",
            full_name="Auth User",
            account_id=str(test_account.id)
        )
        
        # Test successful authentication
        result = await user_service.authenticate_user("auth@example.com", "password123")
        assert result is not None
        assert result["user"].email == "auth@example.com"
        assert "access_token" in result
        assert "session_token" in result
        
        # Test failed authentication
        result = await user_service.authenticate_user("auth@example.com", "wrongpassword")
        assert result is None
    
    async def test_create_entity(self, test_account, entity_service):
        """Test entity creation."""
        entity = await entity_service.create_entity(
            name="Test Belgium",
            account_id=str(test_account.id),
            country="BE",
            entity_code="BE001",
            vat_number="BE123456789",
            currency="EUR",
            is_default=True
        )
        
        assert entity.name == "Test Belgium"
        assert entity.country == "BE"
        assert entity.entity_code == "BE001"
        assert entity.vat_number == "BE123456789"
        assert entity.currency == "EUR"
        assert entity.is_default is True
    
    async def test_get_entities_by_account(self, test_account, entity_service):
        """Test getting entities for an account."""
        # Create multiple entities
        await entity_service.create_entity(
            name="Test Belgium",
            account_id=str(test_account.id),
            country="BE",
            is_default=True
        )
        
        await entity_service.create_entity(
            name="Test Poland",
            account_id=str(test_account.id),
            country="PL"
        )
        
        entities = await entity_service.get_entities_by_account(str(test_account.id))
        assert len(entities) == 2
        
        entity_names = [e.name for e in entities]
        assert "Test Belgium" in entity_names
        assert "Test Poland" in entity_names
    
    async def test_default_entity_management(self, test_account, entity_service):
        """Test default entity management."""
        # Create first entity as default
        entity1 = await entity_service.create_entity(
            name="Entity 1",
            account_id=str(test_account.id),
            country="BE",
            is_default=True
        )
        
        # Create second entity as default (should unset first)
        entity2 = await entity_service.create_entity(
            name="Entity 2",
            account_id=str(test_account.id),
            country="PL",
            is_default=True
        )
        
        # Refresh entities from database
        entity1_refreshed = await entity_service.get_entity_by_id(str(entity1.id))
        entity2_refreshed = await entity_service.get_entity_by_id(str(entity2.id))
        
        assert entity1_refreshed.is_default is False
        assert entity2_refreshed.is_default is True
        
        # Get default entity
        default_entity = await entity_service.get_default_entity(str(test_account.id))
        assert default_entity.id == entity2.id
    
    async def test_user_permissions(self, test_account, user_service):
        """Test user permission system."""
        # Create admin user
        admin_user = await user_service.create_user(
            email="admin@example.com",
            password="password123",
            full_name="Admin User",
            account_id=str(test_account.id),
            role="admin"
        )
        
        # Create viewer user
        viewer_user = await user_service.create_user(
            email="viewer@example.com",
            password="password123",
            full_name="Viewer User",
            account_id=str(test_account.id),
            role="viewer"
        )
        
        # Test admin permissions
        assert admin_user.can_perform_action("manage_users")
        assert admin_user.can_perform_action("manage_entities")
        assert admin_user.can_perform_action("view")
        
        # Test viewer permissions
        assert not viewer_user.can_perform_action("manage_users")
        assert not viewer_user.can_perform_action("manage_entities")
        assert viewer_user.can_perform_action("view")
    
    async def test_entity_processing_limits(self, test_account, entity_service):
        """Test entity processing limits."""
        entity = await entity_service.create_entity(
            name="Limited Entity",
            account_id=str(test_account.id),
            country="BE",
            monthly_processing_limit=5
        )
        
        # Test initial state
        assert entity.can_process_more() is True
        assert entity.current_month_processed == 0
        
        # Increment processing count
        for i in range(5):
            success = await entity_service.increment_processing_count(str(entity.id))
            assert success is True
        
        # Refresh entity
        entity_refreshed = await entity_service.get_entity_by_id(str(entity.id))
        assert entity_refreshed.current_month_processed == 5
        assert entity_refreshed.can_process_more() is False
        
        # Try to increment beyond limit
        success = await entity_service.increment_processing_count(str(entity.id))
        assert success is False


if __name__ == "__main__":
    # Run a simple test
    def simple_test():
        print("Testing User and Entity models...")
        
        # Test password hashing
        password = "testpassword123"
        hashed = User.hash_password(password)
        print(f"Password hashed: {hashed[:20]}...")
        
        # Test password verification directly
        import bcrypt
        assert bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        assert not bcrypt.checkpw("wrongpassword".encode('utf-8'), hashed.encode('utf-8'))
        print("Password verification works!")
        
        print("Basic tests passed!")
    
    simple_test() 