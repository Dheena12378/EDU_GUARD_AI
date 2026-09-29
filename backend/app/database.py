"""
EDU CARD AI — Database Engine & Session

Supports SQLite (default) and PostgreSQL (via DATABASE_URL env var).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


# ---------------------------------------------------------------------------
# Engine setup — auto-detect SQLite vs PostgreSQL
# ---------------------------------------------------------------------------

db_url = settings.sqlalchemy_database_url

_connect_args = {}
_engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,  # Auto-reconnect on dropped cloud connections
}

if db_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
    _engine_kwargs["connect_args"] = _connect_args
else:
    # Cloud-hosted PostgreSQL (Neon, Supabase, Render, Railway, AWS RDS)
    # pool_recycle avoids stale connections closed by cloud load balancers
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20
    _engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, **_engine_kwargs)

# Enable WAL mode and foreign keys ONLY for SQLite
if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Declarative base for all ORM models
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Dependency for FastAPI route injection
# ---------------------------------------------------------------------------

def get_db():
    """Yield a database session, auto-close on request completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# DB initialization (create all tables)
# ---------------------------------------------------------------------------

def init_db():
    """Import all models and create tables that don't exist yet."""
    # This import registers every model with Base.metadata
    from .models import (  # noqa: F401
        User, Student, WeeklyRecord, Feature,
        Prediction, Alert, Intervention, AuditLog, SensitiveData,
    )
    Base.metadata.create_all(bind=engine)
