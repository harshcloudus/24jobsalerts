from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from ..models import Job


# Normalized qualification buckets -> raw text fragments to match in Job.qualification
QUALIFICATION_BUCKETS = {
    # Post-school
    "7th Pass": ["7th pass", "7th passed"],
    "8th Pass": ["class viii passed", "8th pass"],
    # 10th / matric
    "10th Pass": ["10th pass", "passed 10th", "10वीं पास", "madhyamik", "matric"],
    # 12th / higher secondary
    "12th Pass": ["10+2", "12th pass", "government 12th pass", "higher secondary"],
    # Undergraduate
    "Undergraduate": [
        "b.sc",
        "bsc",
        "b. com",
        "b.com",
        "bachelor's degree",
        "bachelors degree",
        "graduate with min 50%",
        "graduate with minimum 50%",
        "graduate degree",
        "llb",
        "law faculty",
    ],
    # Postgraduate & research
    "Postgraduate & Research": [
        "post graduation",
        "post-graduation",
        "master's degree",
        "masters degree",
        "m.sc",
        "msc",
        "post graduate in public health",
        "post graduate in social work",
        "post graduate in law",
        "ph.d",
        "phd",
    ],
    # Professional
    "Professional": [
        "member of the institute of chartered accountants",
        "chartered accountant",
        "c.a.",
        "ca ",
    ],
}


def list_jobs(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str],
    job_type: Optional[str],
    qualification: Optional[str],
    category: Optional[str],
    only_recent: bool = False,
) -> Tuple[List[Job], int]:
    query = select(Job)
    conditions = []

    # Permanently ban root JobKaka homepage entry from all responses
    banned_url = "https://www.jobkaka.com/"
    conditions.append(Job.url != banned_url)

    if search:
        like = f"%{search.lower()}%"
        conditions.append(func.lower(Job.title).like(like))

    if job_type:
        conditions.append(Job.job_type == job_type)

    if qualification:
        bucket = QUALIFICATION_BUCKETS.get(qualification)
        if bucket:
            lowered = func.lower(Job.qualification)
            qual_clauses = [lowered.like(f"%{fragment.lower()}%") for fragment in bucket]
            conditions.append(or_(*qual_clauses))
        else:
            conditions.append(Job.qualification == qualification)

    if category:
        conditions.append(Job.category == category)

    if only_recent:
        # Use posted_date text column (e.g. "12 January 2022") instead of created_at
        # Convert to DATE in Postgres and compare with a 6‑month cutoff
        cutoff = datetime.utcnow() - timedelta(days=180)
        cutoff_str = cutoff.strftime("%Y-%m-%d")
        date_expr = func.to_date(Job.posted_date, "DD Month YYYY")
        conditions.append(Job.posted_date.isnot(None))
        conditions.append(Job.posted_date != "")
        conditions.append(date_expr >= cutoff_str)

    if conditions:
        query = query.where(and_(*conditions))

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    # Sort by posted_date (newest first). Fallback to created_at when needed.
    posted_date_expr = func.to_date(Job.posted_date, "DD Month YYYY")

    query = (
        query.order_by(
            posted_date_expr.desc().nullslast(),
            Job.created_at.desc().nullslast(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = db.execute(query).scalars().all()
    return items, total


def get_job(db: Session, job_id: int) -> Optional[Job]:
    return db.get(Job, job_id)


def distinct_filters(db: Session):
    job_types = [
        r[0]
        for r in db.execute(
            select(func.distinct(Job.job_type)).where(Job.job_type.isnot(None))
        ).all()
    ]
    # Use normalized qualification buckets instead of raw distinct values
    qualifications = list(QUALIFICATION_BUCKETS.keys())
    categories = [
        r[0]
        for r in db.execute(
            select(func.distinct(Job.category)).where(Job.category.isnot(None))
        ).all()
    ]
    return job_types, qualifications, categories

