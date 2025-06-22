#!/usr/bin/env python3
"""
Simple test script for authentication system.
"""
import asyncio
import httpx
import json
from datetime import datetime


async def test_auth_system():
    """Test the authentication system endpoints."""
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Authentication System")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Register a new user
        print("\n1. Testing user registration...")
        register_data = {
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "testpassword123",
            "name": "Test User",
            "company_name": "Test Company"
        }
        
        try:
            response = await client.post(
                f"{base_url}/api/auth/register",
                json=register_data
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Registration successful for: {data['email']}")
                print(f"Account ID: {data['account_id']}")
                
                # Save cookies for next requests
                cookies = response.cookies
                
                # Test 2: Get user info using cookie authentication
                print("\n2. Testing authenticated request...")
                user_response = await client.get(
                    f"{base_url}/api/auth/me",
                    cookies=cookies
                )
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    print(f"✅ Authenticated request successful")
                    print(f"User: {user_data['name']} ({user_data['email']})")
                else:
                    print(f"❌ Authenticated request failed: {user_response.status_code}")
                    print(user_response.text)
                
                # Test 3: Test logout
                print("\n3. Testing logout...")
                logout_response = await client.post(
                    f"{base_url}/api/auth/logout",
                    cookies=cookies
                )
                
                if logout_response.status_code == 200:
                    print("✅ Logout successful")
                else:
                    print(f"❌ Logout failed: {logout_response.status_code}")
                
                # Test 4: Test login with email/password
                print("\n4. Testing login...")
                login_data = {
                    "email": register_data["email"],
                    "password": register_data["password"]
                }
                
                login_response = await client.post(
                    f"{base_url}/api/auth/login",
                    json=login_data
                )
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    print(f"✅ Login successful for: {login_result['email']}")
                else:
                    print(f"❌ Login failed: {login_response.status_code}")
                    print(login_response.text)
                    
            else:
                print(f"❌ Registration failed: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Authentication test completed")


if __name__ == "__main__":
    asyncio.run(test_auth_system()) 