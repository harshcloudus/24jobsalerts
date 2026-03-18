from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.sql import func
from .database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    description = Column(Text)
    job_type = Column(String(50))
    salary_min = Column(Float)
    salary_max = Column(Float)
    apply_url = Column(String(500))
    posted_date = Column(DateTime)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
