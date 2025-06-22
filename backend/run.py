#!/usr/bin/env python3
"""
Server startup script for Google Drive to Cloud Storage upload service.
"""
import os
import uvicorn

if __name__ == "__main__":
    # Use PORT environment variable for Cloud Run compatibility
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app:app",  # Use the app instance from app.py
        host=host,
        port=port,
        reload=True
    ) 