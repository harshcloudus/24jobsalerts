from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class JobSummary(BaseModel):
    id: int
    url: Optional[str] = None
    title: str
    posted_date: Optional[str] = None
    job_type: Optional[str] = None
    qualification: Optional[str] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True


class JobDetail(JobSummary):
    intro_text: Optional[str] = None
    application_fee: Optional[str] = None
    selection_process: Optional[str] = None
    official_site: Optional[str] = None
    official_site_text: Optional[str] = None
    eligibility_text: Optional[str] = None
    requirement_text: Optional[str] = None
    last_date_text: Optional[str] = None
    tables_json: Optional[List[Any]] = None
    search_by_qualification_json: Optional[List[Any]] = None
    search_by_type_json: Optional[List[Any]] = None
    related_jobs_json: Optional[List[Any]] = None
    created_at: Optional[datetime] = None


class JobListResponse(BaseModel):
    items: List[JobSummary]
    total: int
    page: int
    page_size: int


class FilterOptions(BaseModel):
    job_types: List[str]
    qualifications: List[str]
    categories: List[str]

