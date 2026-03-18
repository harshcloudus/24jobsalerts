from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .crud.jobs import distinct_filters, get_job as get_job_crud, list_jobs
from .database import Base, engine
from .deps import get_db
from .schemas import FilterOptions, JobDetail, JobListResponse, JobSummary

Base.metadata.bind = engine

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

origins = [
    "http://localhost:3000",
    "https://your-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/jobs", response_model=JobListResponse)
def api_list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    job_type: Optional[str] = None,
    qualification: Optional[str] = None,
    category: Optional[str] = None,
    only_recent: bool = Query(
        False,
        description="If true, only jobs from the last 6 months are returned",
    ),
    db: Session = Depends(get_db),
):
    jobs, total = list_jobs(
        db, page, page_size, search, job_type, qualification, category, only_recent
    )
    summaries = [JobSummary.model_validate(j) for j in jobs]
    return JobListResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/api/jobs/{job_id}", response_model=JobDetail)
def api_get_job(job_id: int, db: Session = Depends(get_db)):
    job = get_job_crud(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobDetail.model_validate(job)


@app.get("/api/filters", response_model=FilterOptions)
def api_filters(db: Session = Depends(get_db)):
    job_types, qualifications, categories = distinct_filters(db)
    return FilterOptions(
        job_types=[jt for jt in job_types if jt],
        qualifications=[q for q in qualifications if q],
        categories=[c for c in categories if c],
    )
