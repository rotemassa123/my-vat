#!/usr/bin/env python3
"""
Test script for OpenAI processing functionality.
"""

import requests
import json
import os
from pathlib import Path

# Configuration
SERVER_URL = "http://localhost:8000/api"
TEST_ACCOUNT_ID = 123

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")


def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")


def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")


def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")


def print_header(message):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"🤖 {message}")
    print(f"{'='*60}{Colors.END}\n")


def test_health_check():
    """Test basic health check including OpenAI status."""
    print_header("Testing Health Check")
    
    try:
        response = requests.get(f"{SERVER_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print_success("Health check successful")
            
            # Show service status
            services = {
                "GCS Client": result.get('gcs_client', 'unknown'),
                "Drive Client": result.get('drive_client', 'unknown'),
                "MongoDB Client": result.get('mongodb_client', 'unknown'),
                "OpenAI Client": result.get('openai_client', 'unknown')
            }
            
            for service, status in services.items():
                status_emoji = "🟢" if status == 'connected' else "🔴"
                print(f"   {service}: {status_emoji} {status}")
            
            return result.get('openai_client') == 'connected'
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False


def test_openai_status():
    """Test OpenAI service status endpoint."""
    print_header("Testing OpenAI Service Status")
    
    try:
        response = requests.get(f"{SERVER_URL}/process/status")
        if response.status_code == 200:
            result = response.json()
            print_success("OpenAI status check successful")
            
            openai_status = result.get('openai_status', {})
            print(f"   Authenticated: {'✅' if openai_status.get('authenticated') else '❌'}")
            print(f"   API Key Configured: {'✅' if openai_status.get('api_key_configured') else '❌'}")
            print(f"   Model: {openai_status.get('model', 'unknown')}")
            print(f"   Max Tokens: {openai_status.get('max_tokens', 'unknown')}")
            
            available_tasks = result.get('available_tasks', [])
            print(f"   Available Tasks: {', '.join(available_tasks)}")
            
            return openai_status.get('authenticated', False)
        else:
            print_error(f"OpenAI status check failed: {response.status_code}")
            if response.status_code == 503:
                print_warning("OpenAI service not initialized - check API key configuration")
            return False
            
    except Exception as e:
        print_error(f"OpenAI status error: {e}")
        return False


def test_chat_functionality():
    """Test OpenAI chat functionality."""
    print_header("Testing Chat Functionality")
    
    try:
        payload = {
            "message": "Hello! Can you help me understand how document processing works?",
            "account_id": TEST_ACCOUNT_ID,
            "system_prompt": "You are a helpful assistant for document processing tasks."
        }
        
        response = requests.post(
            f"{SERVER_URL}/process/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Chat request successful")
            
            print(f"   Response: {result.get('response', '')[:100]}...")
            print(f"   Conversation ID: {result.get('conversation_id', 'unknown')}")
            print(f"   Tokens Used: {result.get('tokens_used', 0)}")
            print(f"   Cost: ${result.get('cost_usd', 0):.4f}")
            print(f"   Model: {result.get('model_used', 'unknown')}")
            
            return result.get('conversation_id')
        else:
            print_error(f"Chat request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Chat test error: {e}")
        return None


def test_get_processing_jobs():
    """Test getting processing jobs for account."""
    print_header("Testing Processing Jobs Retrieval")
    
    try:
        response = requests.get(f"{SERVER_URL}/process/jobs/{TEST_ACCOUNT_ID}")
        
        if response.status_code == 200:
            result = response.json()
            print_success("Processing jobs retrieval successful")
            
            jobs = result.get('jobs', [])
            print(f"   Total Jobs: {result.get('total_jobs', 0)}")
            
            if jobs:
                print("   Recent Jobs:")
                for job in jobs[:3]:  # Show first 3 jobs
                    status_emoji = "✅" if job['status'] == 'completed' else "🔄" if job['status'] == 'processing' else "❌"
                    print(f"     {status_emoji} {job['task_type']} - {job['status']} (${job['total_cost_usd']:.4f})")
            else:
                print_info("No processing jobs found for this account")
            
            return True
        else:
            print_error(f"Jobs retrieval failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Jobs retrieval error: {e}")
        return False


def test_get_conversations():
    """Test getting conversations for account."""
    print_header("Testing Conversations Retrieval")
    
    try:
        response = requests.get(f"{SERVER_URL}/process/conversations/{TEST_ACCOUNT_ID}")
        
        if response.status_code == 200:
            result = response.json()
            print_success("Conversations retrieval successful")
            
            conversations = result.get('conversations', [])
            print(f"   Total Conversations: {result.get('total_conversations', 0)}")
            
            if conversations:
                print("   Recent Conversations:")
                for conv in conversations[:3]:  # Show first 3 conversations
                    print(f"     💬 {conv['conversation_id'][:8]}... - {conv['message_count']} messages (${conv['total_cost_usd']:.4f})")
            else:
                print_info("No conversations found for this account")
            
            return True
        else:
            print_error(f"Conversations retrieval failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Conversations retrieval error: {e}")
        return False


def main():
    """Run all OpenAI processing tests."""
    print_header("OpenAI Processing Test Suite")
    print(f"Testing server: {SERVER_URL}")
    print(f"Test account ID: {TEST_ACCOUNT_ID}")
    
    # Test basic health
    health_ok = test_health_check()
    if not health_ok:
        print_error("Basic health check failed - server may not be running")
        return
    
    # Test OpenAI status
    openai_ok = test_openai_status()
    if not openai_ok:
        print_warning("OpenAI service not available - some tests will be skipped")
        print_info("To enable OpenAI functionality, set OPENAI_API_KEY in your environment")
    
    # Test chat (only if OpenAI is available)
    if openai_ok:
        conversation_id = test_chat_functionality()
        if conversation_id:
            print_info(f"Created conversation: {conversation_id}")
    
    # Test data retrieval endpoints
    test_get_processing_jobs()
    test_get_conversations()
    
    print_header("Test Suite Completed")
    
    if openai_ok:
        print_success("All OpenAI processing features are working!")
        print_info("You can now:")
        print("   - Process files with AI: POST /api/process/batch")
        print("   - Analyze single files: POST /api/process/file") 
        print("   - Chat with AI: POST /api/process/chat")
        print("   - View processing history: GET /api/process/jobs/{account_id}")
    else:
        print_warning("OpenAI features not available - configure API key to enable")


if __name__ == "__main__":
    main() 