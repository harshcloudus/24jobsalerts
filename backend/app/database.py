from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _normalize_database_url(raw: str) -> str:
    # Some providers (and older configs) use postgres:// which SQLAlchemy treats as invalid.
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


db_url = _normalize_database_url(settings.DATABASE_URL)
url = make_url(db_url)

# Supabase Postgres requires SSL in production.
if url.drivername.startswith("postgresql") and "sslmode" not in url.query:
    url = url.set(query={**dict(url.query), "sslmode": "require"})

engine = create_engine(url, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
