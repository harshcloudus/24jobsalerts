from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/jobkaka"
    API_TITLE: str = "JobKaka API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
