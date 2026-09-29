"""
EDU CARD AI — Database Connection & Live Inspection Utility

Supports both Cloud-Hosted PostgreSQL (via DATABASE_URL env var) and local SQLite.
Prints table summaries, column schemas, connection metadata, and row counts.
Can execute custom SQL queries passed as command-line arguments.

Usage:
    python db_connect.py
    python db_connect.py "SELECT student_id, name, department FROM students LIMIT 5;"
    python db_connect.py "SELECT id, username, role FROM users LIMIT 10;"
"""

import sys
from pathlib import Path
from sqlalchemy import create_engine, inspect, text

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings


def connect_and_inspect():
    dialect_name = "postgresql" if settings.is_postgres else "sqlite"

    print("=" * 70)
    if settings.is_postgres:
        print("Connecting to Cloud PostgreSQL Database:")
        print(f"URL: {settings.masked_database_url}")
    else:
        db_file = ROOT_DIR / "edu_card_ai.db"
        print("Connecting to SQLite Database:")
        print(f"File: {db_file.resolve()}")
    print("=" * 70)

    try:
        engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
        inspector = inspect(engine)
        
        with engine.connect() as conn:
            # Check server info
            if settings.is_postgres:
                version = conn.execute(text("SELECT version();")).scalar()
                curr_db = conn.execute(text("SELECT current_database();")).scalar()
                curr_user = conn.execute(text("SELECT current_user;")).scalar()
                print("Connection Status: ACTIVE (Cloud PostgreSQL)")
                print(f"Database:          {curr_db}")
                print(f"User:              {curr_user}")
                print(f"Engine Version:    {version.split(',')[0] if version else 'PostgreSQL'}")
            else:
                journal_mode = conn.execute(text("PRAGMA journal_mode;")).scalar()
                foreign_keys = conn.execute(text("PRAGMA foreign_keys;")).scalar()
                print("Connection Status: ACTIVE (Local SQLite)")
                print(f"Journal Mode:      {str(journal_mode).upper()}")
                print(f"Foreign Keys:      {'ENABLED' if foreign_keys else 'DISABLED'}")

            print("-" * 70)

            # Get tables
            table_names = inspector.get_table_names()
            preferred_order = [
                "users", "students", "weekly_records", "features",
                "predictions", "alerts", "interventions", "audit_logs", "sensitive_data"
            ]
            sorted_tables = sorted(
                table_names,
                key=lambda t: preferred_order.index(t) if t in preferred_order else 99
            )

            print(f"Found {len(sorted_tables)} Tables:\n")
            for tbl in sorted_tables:
                q = text(f'SELECT count(*) FROM "{tbl}";' if settings.is_postgres else f"SELECT count(*) FROM {tbl};")
                cnt = conn.execute(q).scalar() or 0
                cols = inspector.get_columns(tbl)
                col_names = [c["name"] for c in cols]
                cols_preview = ", ".join(col_names[:6]) + ("..." if len(col_names) > 6 else "")
                print(f"  * {tbl:<20} | Rows: {cnt:<5} | Columns ({len(col_names)}): {cols_preview}")

            # Users sample
            print("\n" + "=" * 70)
            print("Recent Registered Users Sample:")
            print("-" * 70)
            u_query = text('SELECT id, username, full_name, role, department FROM "users" LIMIT 8;' if settings.is_postgres else "SELECT id, username, full_name, role, department FROM users LIMIT 8;")
            users = conn.execute(u_query).fetchall()
            print(f"  {'ID':<4} {'Username':<15} {'Role':<10} {'Full Name':<22} {'Department'}")
            for u in users:
                print(f"  {u[0]:<4} {u[1]:<15} {str(u[3]):<10} {u[2]:<22} {u[4] or '—'}")

            # Students sample
            print("-" * 70)
            print("Recent Demo Students Sample:")
            print("-" * 70)
            s_query = text('SELECT id, student_id, name, department, year, semester FROM "students" LIMIT 5;' if settings.is_postgres else "SELECT id, student_id, name, department, year, semester FROM students LIMIT 5;")
            students = conn.execute(s_query).fetchall()
            print(f"  {'ID':<4} {'Code':<8} {'Name':<22} {'Department':<24} {'Term'}")
            for s in students:
                print(f"  {s[0]:<4} {s[1]:<8} {s[2]:<22} {s[3]:<24} Yr {s[4]} Sem {s[5]}")

            print("=" * 70)

    except Exception as e:
        print(f"Connection Failed: {e}")
        print("\nPlease check your DATABASE_URL in .env or provide a valid connection string.")


def run_custom_query(query: str):
    print("=" * 70)
    print(f"Executing SQL Query on ({'PostgreSQL' if settings.is_postgres else 'SQLite'}):")
    print(f"SQL: {query}")
    print("-" * 70)

    try:
        engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            res = conn.execute(text(query))
            if res.returns_rows:
                headers = list(res.keys())
                rows = res.fetchall()
                header_line = " | ".join(f"{h:<16}" for h in headers)
                print(header_line)
                print("-" * len(header_line))
                for r in rows:
                    row_str = " | ".join(f"{str(v):<16}" for v in r)
                    print(row_str)
                print("-" * 70)
                print(f"Total Rows: {len(rows)}")
            else:
                conn.commit()
                print("Statement executed successfully (0 rows returned).")
        print("=" * 70)
    except Exception as e:
        print(f"Database Error: {e}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        custom_q = " ".join(sys.argv[1:])
        run_custom_query(custom_q)
    else:
        connect_and_inspect()
