"""
EDU CARD AI — SQLite to PostgreSQL Migration Tool

Transfers all records, users, students, engagement timelines, engineered features,
predictions, alerts, interventions, and audit logs from local SQLite into Cloud PostgreSQL.
Automatically resets PostgreSQL auto-increment primary key sequences.

Usage:
    python migrate_sqlite_to_postgres.py
    # Or specify custom database URL:
    python migrate_sqlite_to_postgres.py "postgresql://user:pass@host:5432/dbname"
"""

import sys
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, text

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings
from backend.app.database import Base
from backend.app.models import (  # Registers all models with Base.metadata
    User, Student, WeeklyRecord, Feature,
    Prediction, Alert, Intervention, AuditLog, SensitiveData,
)


def migrate_to_postgres(target_pg_url: str = None):
    sqlite_path = ROOT_DIR / "edu_card_ai.db"
    if not sqlite_path.exists():
        print(f"Error: Source SQLite database not found at {sqlite_path}")
        return False

    pg_url = target_pg_url or settings.sqlalchemy_database_url
    if not pg_url.startswith("postgresql"):
        print(f"Error: Target DATABASE_URL is not PostgreSQL! Found: {settings.masked_database_url}")
        print("Please configure DATABASE_URL=postgresql://... in your .env or pass it as an argument.")
        return False

    print("=" * 65)
    print("EDU CARD AI — SQLite -> Cloud PostgreSQL Migration")
    print("=" * 65)
    print(f"Source SQLite:     {sqlite_path}")
    print(f"Target PostgreSQL: {settings.masked_database_url}")
    print("-" * 65)

    pg_engine = create_engine(pg_url, pool_pre_ping=True)

    # 1. Create all tables in PostgreSQL
    print("1. Creating schema tables in PostgreSQL if not already present...")
    Base.metadata.create_all(bind=pg_engine)
    print("   Schema tables verified successfully.")

    # 2. Ordered migration sequence
    tables_order = [
        "users",
        "students",
        "sensitive_data",
        "weekly_records",
        "features",
        "predictions",
        "alerts",
        "interventions",
        "audit_logs",
    ]

    sqlite_conn = sqlite3.connect(str(sqlite_path))
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    total_migrated = 0

    with pg_engine.begin() as pg_conn:
        for tbl in tables_order:
            # Check source count
            sqlite_cur.execute(f"SELECT count(*) FROM {tbl};")
            src_count = sqlite_cur.fetchone()[0]

            # Check target count
            tgt_count = pg_conn.execute(text(f'SELECT count(*) FROM "{tbl}";')).scalar() or 0

            if tgt_count > 0:
                print(f"   * Table '{tbl}': already has {tgt_count} rows in PostgreSQL. Skipping.")
                continue

            # Fetch rows from SQLite
            sqlite_cur.execute(f"SELECT * FROM {tbl};")
            rows = sqlite_cur.fetchall()
            if not rows:
                print(f"   * Table '{tbl}': 0 rows in SQLite.")
                continue

            col_names = [d[0] for d in sqlite_cur.description]
            cols_clause = ", ".join([f'"{c}"' for c in col_names])
            params_clause = ", ".join([f":{c}" for c in col_names])
            insert_stmt = text(f'INSERT INTO "{tbl}" ({cols_clause}) VALUES ({params_clause});')

            # Convert rows to dicts
            data = [dict(r) for r in rows]
            pg_conn.execute(insert_stmt, data)
            total_migrated += len(data)
            print(f"   * Migrated {len(data):<4} rows into '{tbl}'")

            # Reset sequence for table id
            try:
                seq_query = text(f"SELECT setval(pg_get_serial_sequence('\"{tbl}\"', 'id'), coalesce(max(id), 1)) FROM \"{tbl}\";")
                pg_conn.execute(seq_query)
            except Exception:
                pass

    sqlite_conn.close()
    print("-" * 65)
    print(f"Migration completed successfully! Total records migrated: {total_migrated}")
    print("All tables and relationships are now permanently in Cloud PostgreSQL.")
    print("=" * 65)
    return True


if __name__ == "__main__":
    custom_url = sys.argv[1] if len(sys.argv) > 1 else None
    migrate_to_postgres(custom_url)
