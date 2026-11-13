import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("uvicorn")

Base = declarative_base()

connect_args = {}
db_url = settings.effective_database_url

def _ensure_vercel_sqlite():
    tmp_db = "/tmp/smart_department.db"
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bundled_dbs = [
        os.path.join(root_dir, "smart_department.db"),
        os.path.join(root_dir, "backend", "smart_department.db"),
        os.path.join(os.getcwd(), "smart_department.db"),
        os.path.join(os.getcwd(), "backend", "smart_department.db"),
    ]
    if not os.path.exists(tmp_db):
        for b_db in bundled_dbs:
            if os.path.exists(b_db):
                try:
                    import shutil
                    shutil.copy2(b_db, tmp_db)
                    print(f"[*] Copied bundled database ({os.path.getsize(b_db)} bytes) from {b_db} to {tmp_db}")
                    break
                except Exception as cp_err:
                    print(f"[!] Warning copying database to /tmp: {cp_err}")
    return f"sqlite:///{tmp_db}"

def create_app_engine(url: str):
    global connect_args
    if url.startswith("mysql+pymysql://"):
        # Attempt to verify or create MySQL database
        try:
            import pymysql
            from urllib.parse import urlparse
            parsed = urlparse(url.replace("mysql+pymysql://", "http://"))
            db_name = parsed.path.lstrip("/") or "smart_department_db"
            db_user = parsed.username or "root"
            db_pass = parsed.password or ""
            db_host = parsed.hostname or "localhost"
            db_port = parsed.port or 3306

            conn = pymysql.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_pass,
                connect_timeout=2
            )
            with conn.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.commit()
            conn.close()
            print(f"[*] Connected to MySQL 8.0 on {db_host}:{db_port}, database '{db_name}' ready.")
            return create_engine(url, pool_pre_ping=True, echo=False)
        except Exception as e:
            if os.environ.get("VERCEL"):
                fallback_url = _ensure_vercel_sqlite()
            else:
                fallback_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "smart_department.db")
                fallback_url = f"sqlite:///{fallback_path.replace(chr(92), '/')}"
            print(f"[!] Warning: MySQL connection failed ({e}). Falling back to SQLite: {fallback_url}")
            return create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)

    elif url.startswith("sqlite"):
        if os.environ.get("VERCEL"):
            url = _ensure_vercel_sqlite()

        return create_engine(url, connect_args={"check_same_thread": False}, echo=False)
    else:
        return create_engine(url, echo=False)

engine = create_app_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_dev_tables():
    """Ensure all SQLAlchemy tables are created in development and update schema if needed."""
    import app.models
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            user_cols = [
                ("full_name", "VARCHAR(255)"),
                ("username", "VARCHAR(100)"),
                ("mobile_number", "VARCHAR(50)"),
                ("usn_or_employee_id", "VARCHAR(100)"),
                ("designation", "VARCHAR(100)"),
                ("account_status", "VARCHAR(50) DEFAULT 'Approved'"),
                ("reset_token", "VARCHAR(255)"),
                ("reset_token_expires_at", "DATETIME"),
            ]
            for col_name, col_type in user_cols:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception:
                    pass

            try:
                conn.execute(text("UPDATE users SET full_name = name WHERE full_name IS NULL"))
                conn.execute(text("UPDATE users SET mobile_number = phone WHERE mobile_number IS NULL"))
                conn.execute(text("UPDATE users SET account_status = 'Approved' WHERE account_status IS NULL"))
                conn.commit()
            except Exception:
                pass

            try:
                conn.execute(text("ALTER TABLE student_attendance ADD COLUMN attendance_method VARCHAR(50) DEFAULT 'MANUAL'"))
                conn.commit()
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE attendance ADD COLUMN attendance_method VARCHAR(50) DEFAULT 'MANUAL'"))
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass


def init_db():
    """Initialize database tables and run seed data."""
    import app.models
    Base.metadata.create_all(bind=engine)
    from app.seed_data import seed_database
    seed_database()
