# User and Entity Management API

This document describes the new User and Entity management endpoints added to the VAT processing system.

## Overview

The system now supports:
- **Users**: Individual users with email/password authentication connected to accounts
- **Entities**: Sub-accounts representing different subsidiaries or business entities (e.g., "Lego Belgium", "Lego Poland")

## Authentication

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

## User Management Endpoints

### Register User
```http
POST /api/v1/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "account_id": "account_id_here",
  "role": "member",
  "permissions": ["view", "create"]
}
```

### Login User
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "account_id": "account_id",
    "role": "member",
    "permissions": ["view", "create"],
    "status": "active",
    "email_verified": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "access_token": "jwt_token_here",
  "session_token": "session_token_here"
}
```

### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <jwt_token>
```

### Get Users (Admin only)
```http
GET /api/v1/users/
Authorization: Bearer <jwt_token>
```

### Update User
```http
PUT /api/v1/users/{user_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "John Smith",
  "role": "admin"
}
```

### Change Password
```http
POST /api/v1/users/{user_id}/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

### Request Password Reset
```http
POST /api/v1/users/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Confirm Password Reset
```http
POST /api/v1/users/password-reset/confirm
Content-Type: application/json

{
  "reset_token": "reset_token_here",
  "new_password": "newpassword123"
}
```

### Logout
```http
POST /api/v1/users/logout
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "session_token": "session_token_here"
}
```

## Entity Management Endpoints

### Create Entity
```http
POST /api/v1/entities/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Lego Belgium",
  "country": "BE",
  "description": "Belgian subsidiary",
  "entity_code": "BE001",
  "tax_id": "BE123456789",
  "vat_number": "BE987654321",
  "address": {
    "street": "123 Main St",
    "city": "Brussels",
    "postal_code": "1000"
  },
  "currency": "EUR",
  "vat_rate": 21.0,
  "language": "en",
  "is_default": true,
  "auto_process_invoices": false,
  "monthly_processing_limit": 1000
}
```

### Get Entities
```http
GET /api/v1/entities/
Authorization: Bearer <jwt_token>

# Optional: Filter by country
GET /api/v1/entities/?country=BE
```

### Get Default Entity
```http
GET /api/v1/entities/default
Authorization: Bearer <jwt_token>
```

### Get Entity by ID
```http
GET /api/v1/entities/{entity_id}
Authorization: Bearer <jwt_token>
```

### Update Entity
```http
PUT /api/v1/entities/{entity_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Lego Belgium Updated",
  "vat_rate": 22.0,
  "is_default": false
}
```

### Delete Entity
```http
DELETE /api/v1/entities/{entity_id}
Authorization: Bearer <jwt_token>
```

### Get Entity Statistics
```http
GET /api/v1/entities/{entity_id}/statistics
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "entity_id": "entity_id",
  "name": "Lego Belgium",
  "country": "BE",
  "currency": "EUR",
  "current_month_processed": 45,
  "monthly_processing_limit": 1000,
  "processing_limit_reached": false,
  "is_default": true,
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Get Account Statistics
```http
GET /api/v1/entities/account/statistics
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "account_id": "account_id",
  "total_entities": 3,
  "active_entities": 2,
  "total_processed_this_month": 125,
  "countries": ["BE", "PL", "DE"],
  "currencies": ["EUR", "PLN"],
  "entities": [
    {
      "id": "entity_id_1",
      "name": "Lego Belgium",
      "country": "BE",
      "status": "active",
      "is_default": true,
      "current_month_processed": 45
    }
  ]
}
```

### Increment Processing Count
```http
POST /api/v1/entities/{entity_id}/increment-processing
Authorization: Bearer <jwt_token>
```

### Reset Monthly Processing Counts (Admin only)
```http
POST /api/v1/entities/account/reset-processing-counts
Authorization: Bearer <jwt_token>
```

## User Roles and Permissions

### Roles
- **admin**: Full access to all operations including user and entity management
- **member**: Can view, create, and edit content but cannot manage users/entities
- **viewer**: Read-only access

### Permission Actions
- `view`: Basic read access
- `create`: Create new content
- `edit`: Modify existing content
- `delete`: Delete content
- `manage_users`: Create, update, delete users
- `manage_entities`: Create, update, delete entities

## Example Workflow

1. **Setup Account Structure**:
   ```bash
   # Create entities for different subsidiaries
   POST /api/v1/entities/ - Create "Lego Belgium" entity
   POST /api/v1/entities/ - Create "Lego Poland" entity
   ```

2. **Add Users**:
   ```bash
   # Register users for the account
   POST /api/v1/users/register - Create admin user
   POST /api/v1/users/register - Create member users
   ```

3. **Process VAT by Entity**:
   ```bash
   # Upload and process invoices for specific entities
   # Use entity_id in VAT processing endpoints
   ```

## Error Responses

All endpoints return standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/expired token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "detail": "Error message here"
}
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Failed login attempts result in account locking
- Password reset tokens expire after 1 hour
- All sensitive operations require proper authentication and authorization 