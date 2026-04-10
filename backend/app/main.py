import re
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import settings
from .crud.jobs import distinct_filters, get_job as get_job_crud, list_jobs
from .database import Base, engine
from .deps import get_db
from .models import NewsletterSubscriber
from .schemas import (
    FilterOptions,
    JobDetail,
    JobListResponse,
    JobSummary,
    NewsletterSubscribeRequest,
    NewsletterSubscribeResponse,
)

Base.metadata.bind = engine

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

origins = [
    "http://localhost:3000",
    "https://your-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def extract_salary_from_tables(tables_json: Any) -> Optional[str]:
    if not isinstance(tables_json, list):
        return None

    salary_column_keywords = (
        "salary",
        "pay",
        "pay scale",
        "monthly pay",
        "monthly salary",
        "stipend",
        "remuneration",
        "ctc",
    )

    for table in tables_json:
        if not isinstance(table, dict):
            continue
        columns = table.get("columns")
        rows = table.get("rows")
        if not isinstance(columns, list) or not isinstance(rows, list):
            continue

        salary_idx = next(
            (
                idx
                for idx, col in enumerate(columns)
                if isinstance(col, str)
                and any(
                    keyword in col.strip().lower()
                    for keyword in salary_column_keywords
                )
            ),
            None,
        )
        if salary_idx is None:
            continue

        for row in rows:
            if not isinstance(row, list):
                continue
            if salary_idx >= len(row):
                continue
            value = row[salary_idx]
            if value is None:
                continue
            salary = str(value).strip()
            if salary:
                return salary

        # Salary column exists but value not found; keep it empty.
        return None

    return None


@app.get("/")
def root():
    return {"status": "ok"}


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
    summaries = []
    for job in jobs:
        payload = JobSummary.model_validate(job).model_dump()
        payload["salary"] = extract_salary_from_tables(getattr(job, "tables_json", None))
        summaries.append(JobSummary.model_validate(payload))
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
    payload = JobDetail.model_validate(job).model_dump()
    payload["salary"] = extract_salary_from_tables(getattr(job, "tables_json", None))
    return JobDetail.model_validate(payload)


@app.get("/api/filters", response_model=FilterOptions)
def api_filters(db: Session = Depends(get_db)):
    job_types, qualifications, categories = distinct_filters(db)
    return FilterOptions(
        job_types=[jt for jt in job_types if jt],
        qualifications=[q for q in qualifications if q],
        categories=[c for c in categories if c],
    )


def _is_valid_email(email: str) -> bool:
    # Lightweight validation; avoids extra dependencies.
    email = (email or "").strip()
    if len(email) < 6 or len(email) > 254:
        return False
    return re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email) is not None


@app.post("/api/newsletter/subscribe", response_model=NewsletterSubscribeResponse)
def newsletter_subscribe(payload: NewsletterSubscribeRequest, db: Session = Depends(get_db)):
    email = (payload.email or "").strip().lower()
    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")

    sub = NewsletterSubscriber(email=email)
    db.add(sub)
    try:
        db.commit()
        return NewsletterSubscribeResponse(ok=True, created=True)
    except IntegrityError:
        db.rollback()
        # already subscribed
        return NewsletterSubscribeResponse(ok=True, created=False)
