import pytest
from fastapi.testclient import TestClient
from app import app  
from unittest.mock import patch

client = TestClient(app)

# Global token for authenticated endpoints
auth_token = None

def test_signup_and_login():
    global auth_token
    signup_data = {
        "email": "testrahul@example.com",
        "password": "testpass123"
    }

    # Signup
    response = client.post("/api/signup", json=signup_data)
    assert response.status_code == 200 or response.status_code == 400  # 400 if user already exists

    # Login
    response = client.post("/api/login", json=signup_data)
    assert response.status_code == 200
    auth_token = response.json()["access_token"]
    assert auth_token is not None


def test_setup_interview():
    headers = {"Authorization": f"Bearer {auth_token}"}
    dummy_resume = b"My resume content"
    files = {"resume": ("resume.pdf", dummy_resume, "application/pdf")}
    data = {
        "role": "Data Scientist",
        "interview_type": "full"
    }

    response = client.post("/api/setup", data=data, files=files, headers=headers)
    assert response.status_code == 200



def test_submit_code():
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "language": "python",
        "code": "def solve(): pass"
    }
    response = client.post("/api/submit-code", json=payload, headers=headers)
    assert response.status_code == 200
    assert "problem" in response.json()



def test_feedback_generation():
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/feedback", headers=headers)
    assert response.status_code == 200
    assert "average_confidence" in response.json()

def test_interview_history_fetch():
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/interviews", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
