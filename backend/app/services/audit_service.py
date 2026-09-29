"""
EDU CARD AI — Audit Logging Service

Logs data access, profile views, export actions, and state transitions.
Ensures compliance with DPDP Act 2023, FERPA, and GDPR principles.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import Request

from ..models.audit_log import AuditLog
from ..models.user import User


def log_audit(
    db: Session,
    action: str,
    user: Optional[User] = None,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
):
    """
    Creates an immutable audit log record for security, access compliance and privacy verification.
    """
    resolved_user_id = user.id if user else user_id
    client_ip = request.client.host if request and request.client else "127.0.0.1"

    audit_entry = AuditLog(
        user_id=resolved_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details or {},
        ip_address=client_ip,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    db.commit()
    return audit_entry
