from sqlalchemy import Column, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB

from .database import Base


class Job(Base):
    __tablename__ = "jobs_24jobsalerts"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, unique=True, index=True)
    title = Column(Text, index=True)
    posted_date = Column(Text, index=True)
    job_type = Column(Text, index=True)
    qualification = Column(Text, index=True)
    intro_text = Column(Text)
    application_fee = Column(Text)
    selection_process = Column(Text)
    official_site = Column(Text)
    official_site_text = Column(Text)
    eligibility_text = Column(Text)
    requirement_text = Column(Text)
    last_date_text = Column(Text)
    category = Column(Text, index=True)
    tables_json = Column(JSONB)
    search_by_qualification_json = Column(JSONB)
    search_by_type_json = Column(JSONB)
    related_jobs_json = Column(JSONB)
    created_at = Column(DateTime, index=True)
