from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://navihire:navihire123@localhost:5432/navihire_db"
    redis_url: str = "redis://localhost:6379"
    
    # API Keys
    gemini_api_key: str
    serpapi_key: Optional[str] = None
    
    # Application
    debug: bool = False
    log_level: str = "INFO"
    secret_key: str = "navihire-secret-key-change-in-production"
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = [".pdf", ".doc", ".docx"]
    
    # Email Configuration
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
