import requests

# Test the exercises endpoint
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

        # Test exercises for the course that has exercises
        headers = {"Authorization": f"Bearer {token}"}
        exercises_response = requests.get(f"{API_BASE_URL}/exercises/course/e5f122e7-089e-42f9-96cf-ff05833891fa", headers=headers)
        print(f"Exercises API status: {exercises_response.status_code}")
        if exercises_response.status_code == 200:
            data = exercises_response.json()
            exercises = data.get('exercises', [])
            print(f"Exercises found: {len(exercises)} (count: {data.get('count', 0)})")
            for ex in exercises:
                print(f"- {ex.get('title', 'No title')}")
        else:
            print(f"Exercises API error: {exercises_response.text}")

        # Test exercises for a course without exercises
        exercises_response2 = requests.get(f"{API_BASE_URL}/exercises/course/df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef", headers=headers)
        print(f"Empty course exercises API status: {exercises_response2.status_code}")
        if exercises_response2.status_code == 200:
            data2 = exercises_response2.json()
            exercises2 = data2.get('exercises', [])
            print(f"Exercises found: {len(exercises2)} (count: {data2.get('count', 0)})")
        else:
            print(f"Empty course exercises API error: {exercises_response2.text}")

    else:
        print(f"Login failed: {login_response.json()}")

except Exception as e:
    print(f"Error: {e}")