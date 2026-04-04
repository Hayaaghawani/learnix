"""Test the login function directly"""
import sys
sys.path.append('.')

from app.api.v1.router_auth import login
from app.schemas import LoginRequest

# Test the login function directly
try:
    request = LoginRequest(email="anas.abu@example.com", password="password123")
    result = login(request)
    print("✅ Login successful!")
    print(f"Result: {result}")
except Exception as e:
    print(f"❌ Login failed: {e}")
    import traceback
    traceback.print_exc()