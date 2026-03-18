from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    apply_url: Optional[str] = None
    posted_date: Optional[datetime] = None
    is_published: bool = True


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    apply_url: Optional[str] = None
    posted_date: Optional[datetime] = None
    is_published: Optional[bool] = None


class Job(JobBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
