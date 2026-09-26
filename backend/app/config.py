import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    MYSQL_PASSWORD: str = ""
    DATABASE_URL: str = "mysql+pymysql://root:${MYSQL_PASSWORD}@localhost:3306/smart_department_db"
    SECRET_KEY: str = "smart_department_production_secret_key_jwt_2026_safe"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    # Geofence configuration
    DEPARTMENT_LATITUDE: float = 12.183700
    DEPARTMENT_LONGITUDE: float = 76.694200
    DEPARTMENT_RADIUS_METERS: float = 300.0

    COLLEGE_LAT: float = 12.183700
    COLLEGE_LON: float = 76.694200
    ATTENDANCE_RADIUS_METERS: float = 300.0

    @property
    def cors_origin_list(self) -> List[str]:
        origins = [x.strip() for x in self.CORS_ORIGINS.split(",") if x.strip()]
        if self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    @property
    def effective_database_url(self) -> str:
        url = self.DATABASE_URL
        mysql_pwd = self.MYSQL_PASSWORD or os.environ.get("MYSQL_PASSWORD", "")
        if "${MYSQL_PASSWORD}" in url:
            url = url.replace("${MYSQL_PASSWORD}", mysql_pwd)
        elif "$MYSQL_PASSWORD" in url:
            url = url.replace("$MYSQL_PASSWORD", mysql_pwd)

        # On Vercel serverless, root is read-only so fallback SQLite uses /tmp
        if os.environ.get("VERCEL") and "sqlite:///./" in url:
            return "sqlite:////tmp/smart_department.db"
        # Support postgres:// URL format provided by Supabase / Neon / Render
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        if url.startswith("sqlite:///./"):
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(backend_dir, url.replace("sqlite:///./", ""))
            return f"sqlite:///{db_path.replace(chr(92), '/')}"
        return url

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
