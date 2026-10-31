"""
SignBridge Backend API tests using FastAPI TestClient.
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[2] / "backend"))
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


def test_model_info(client: TestClient):
    response = client.get("/api/model")
    assert response.status_code == 200
    data = response.json()
    assert "model" in data
    assert "classes" in data
    assert "confidence_threshold" in data


def test_predict_base64_invalid(client: TestClient):
    """Sending garbage base64 should return 422 or handled prediction, not crash 500."""
    response = client.post("/api/predict/base64", json={"image": "not_valid_base64!!"})
    assert response.status_code in (200, 422)


def test_predict_base64_empty_string(client: TestClient):
    response = client.post("/api/predict/base64", json={"image": ""})
    assert response.status_code in (200, 422)


def test_conversation(client: TestClient):
    response = client.post("/api/conversation", json={"message": "HELLO HOW ARE YOU"})
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "HELLO HOW ARE YOU"
