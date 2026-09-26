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
            fallback_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "smart_department.db")
            fallback_url = f"sqlite:///{fallback_path.replace(chr(92), '/')}"
            print(f"[!] Warning: MySQL connection failed ({e}). Falling back to SQLite: {fallback_url}")
            return create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)

    elif url.startswith("sqlite"):
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
    """Ensure all SQLAlchemy tables are created in development."""
    import app.models
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
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
