import requests

# Test the /courses/my endpoint
API_BASE_URL = "http://localhost:8000"

# First, let's login to get a token
login_data = {
    "email": "anas.abu@example.com",
    "password": "password123"  # Assuming default password
}

try:
    # Login
    login_response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print(f"Got token: {token[:20]}...")

        # Now test the courses endpoint
        headers = {"Authorization": f"Bearer {token}"}
        courses_response = requests.get(f"{API_BASE_URL}/courses/my", headers=headers)
        print(f"Courses API status: {courses_response.status_code}")
        print(f"Courses response: {courses_response.json()}")
    else:
        print(f"Login failed: {login_response.json()}")

except Exception as e:
    print(f"Error: {e}")