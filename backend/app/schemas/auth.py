"""
EDU CARD AI — Auth Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr
from ..models.user import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    role: UserRole  # UserRole.STUDENT or UserRole.FACULTY
    department: str
    # Specific to Student registration:
    student_id: Optional[str] = None  # e.g. "ST129"
    year: Optional[int] = 1
    semester: Optional[int] = 1
    course_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    role: UserRole
    department: Optional[str] = None
    linked_student_id: Optional[int] = None

    class Config:
        from_attributes = True


TokenResponse.update_forward_refs()
