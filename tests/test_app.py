from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    """Restore the in-memory activities dict after each test."""
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(deepcopy(original))


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success():
    activity = "Math Club"
    email = "test.student@mergington.edu"

    # ensure not already signed up
    assert email not in activities[activity]["participants"]

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # verify participant present
    resp2 = client.get("/activities")
    assert email in resp2.json()[activity]["participants"]


def test_signup_already_signed():
    activity = "Chess Club"
    existing = activities[activity]["participants"][0]

    resp = client.post(f"/activities/{activity}/signup?email={existing}")
    assert resp.status_code == 400


def test_signup_activity_not_found():
    resp = client.post("/activities/NoSuchActivity/signup?email=foo@bar.com")
    assert resp.status_code == 404


def test_unregister_success():
    activity = "Chess Club"
    email = activities[activity]["participants"][0]

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # verify removed
    resp2 = client.get("/activities")
    assert email not in resp2.json()[activity]["participants"]


def test_unregister_participant_not_found():
    resp = client.delete("/activities/Chess Club/participants?email=notfound@mergington.edu")
    assert resp.status_code == 404


def test_unregister_activity_not_found():
    resp = client.delete("/activities/NoActivity/participants?email=foo@bar.com")
    assert resp.status_code == 404
