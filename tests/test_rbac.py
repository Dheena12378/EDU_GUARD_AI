"""
EDU CARD AI — Role-Based Access Control (RBAC) Automated Test Suite
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.auth_service import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


def test_unauthenticated_request_rejected(client):
    response = client.get("/api/students")
    assert response.status_code == 401


def test_student_role_cannot_view_other_students(client):
    # Student ST101 (id=1)
    token = create_access_token({"sub": "student", "role": "student"})
    headers = {"Authorization": f"Bearer {token}"}

    # Student should succeed viewing own profile (ST101 is id=1)
    res_own = client.get("/api/students/1", headers=headers)
    assert res_own.status_code == 200

    # Student trying to view ST102 (id=2) must be FORBIDDEN (403)
    res_other = client.get("/api/students/2", headers=headers)
    assert res_other.status_code == 403
    assert "only permitted to view your own" in res_other.json()["detail"]


def test_faculty_role_cannot_view_other_department_student(client):
    # faculty_cs is in "Computer Science"
    token = create_access_token({"sub": "faculty_cs", "role": "faculty"})
    headers = {"Authorization": f"Bearer {token}"}

    # Student ST102 is in "Data Science" (id=2)
    res = client.get("/api/students/2", headers=headers)
    assert res.status_code == 403
    assert "another department" in res.json()["detail"]


def test_admin_only_endpoints(client):
    # Faculty attempting to access audit logs must get 403
    faculty_token = create_access_token({"sub": "faculty_cs", "role": "faculty"})
    res_fac = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res_fac.status_code == 403

    # Admin should succeed
    admin_token = create_access_token({"sub": "admin", "role": "admin"})
    res_admin = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)
