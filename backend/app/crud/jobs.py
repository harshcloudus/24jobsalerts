import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.sql import case
from sqlalchemy.orm import Session

from ..models import Job


# Tile shown for rows whose job_type is NULL/blank.
OTHER_CATEGORY = "Other"

# Per-category keyword lists used to broaden the filter beyond strict
# equality. When the user picks a category, we search these keywords as
# whole words (case-insensitive) across job_type + title + intro_text +
# category. Example: clicking "Government Bank Job" returns every row
# whose text mentions "bank" / "SBI" / "RBI" / etc., even if its raw
# job_type is the generic "Government Job".
#
# Keys MUST exactly match the raw Job.job_type values that exist in the
# DB — we do NOT invent new tiles. If a brand-new raw value appears in
# the DB and isn't a key here, the filter falls back to deriving
# keywords from the name itself (see _keywords_for_category).
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Government Job": [
        "government", "govt", "sarkari", "ministry",
        "psu", "public sector",
    ],
    "Private Job": [
        "private", "pvt ltd", "private limited", "company", "mnc",
    ],
    "Government Post Office Job": [
        "post office", "postal", "india post", "gds",
        "gramin dak sevak",
    ],
    "Government Railway Job": [
        "railway", "railways", "rrb", "rrc", "indian rail",
        "metro rail", "konkan railway", "dfccil",
    ],
    "Government Police Job": [
        "police", "crpf", "bsf", "cisf", "itbp", "ssb",
        "paramilitary",
    ],
    "Government PSC Job": [
        "psc", "upsc", "public service commission", "tnpsc",
        "mpsc", "appsc", "kpsc", "tspsc", "wbpsc", "bpsc",
    ],
    "Government Bank Job": [
        "bank", "banking", "sbi", "rbi", "ibps", "nabard",
        "sidbi", "punjab national", "canara",
    ],
    "Government Airline Job": [
        "airline", "airlines", "aviation", "airport", "aai",
        "air india",
    ],
    "Government High Court Job": [
        "high court", "supreme court", "district court", "court",
        "judicial", "judiciary",
    ],
    "Government Forest Job": [
        "forest", "wildlife", "forestry",
    ],
    "Government Health Department Job": [
        "health", "hospital", "medical", "aiims", "icmr",
        "nhm", "esic", "nurse", "doctor", "pharmacist",
        "paramedical",
    ],
    "Government Municipal Job": [
        "municipal", "municipality", "corporation", "nagar nigam",
        "nagar palika", "panchayat",
    ],
}


def _strip_generic_words(name: str) -> List[str]:
    # Pulls the "meaningful" tokens out of a category name by dropping
    # filler words. Used as a fallback so brand-new raw job_type values
    # still produce a reasonable keyword search without code changes.
    stopwords = {
        "government", "govt", "job", "jobs", "department", "the", "of",
        "a", "an", "and", "for",
    }
    tokens = re.findall(r"[a-z0-9]+", name.lower())
    return [t for t in tokens if t and t not in stopwords]


def _keywords_for_category(name: str) -> List[str]:
    if name in CATEGORY_KEYWORDS:
        return CATEGORY_KEYWORDS[name]
    derived = _strip_generic_words(name)
    # If nothing meaningful is left (e.g. "Government Job" without a
    # mapping), fall back to the raw name itself so we at least match it.
    return derived or [name.lower()]


def _keyword_regex(keywords: List[str]) -> str:
    # Postgres regex with word boundaries (\y), case-insensitive applied
    # at call site via lower(). Escape so multi-word keywords like
    # "post office" or "pvt ltd" work as literals.
    escaped = [re.escape(k.strip().lower()) for k in keywords if k.strip()]
    if not escaped:
        return r"$^"  # matches nothing
    return r"\y(?:" + "|".join(escaped) + r")\y"


def _category_match_condition(category: str):
    """SQL condition: rows that belong to the given category, by keyword
    match across job_type + title + intro_text + category."""
    if category == OTHER_CATEGORY:
        # "Other" = rows with no job_type AND no other category match.
        return or_(Job.job_type.is_(None), func.trim(Job.job_type) == "")
    keywords = _keywords_for_category(category)
    pattern = _keyword_regex(keywords)
    haystack = func.lower(
        func.concat_ws(
            " ",
            func.coalesce(Job.job_type, ""),
            func.coalesce(Job.title, ""),
            func.coalesce(Job.intro_text, ""),
            func.coalesce(Job.category, ""),
        )
    )
    return haystack.op("~")(pattern)


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
        # Strict, relevance-focused search:
        #   * Only the columns that genuinely describe the job are searched —
        #     dates, fees, URLs and process boilerplate are excluded so they
        #     can't pull in unrelated matches.
        #   * Each search term must appear as a WHOLE WORD (Postgres regex
        #     word boundary \y) so "ca" no longer matches "California" and
        #     "art" no longer matches "smart" or "article".
        #   * Every term must match at least one field (AND across terms,
        #     OR across fields).
        searchable_columns = [
            Job.title,
            Job.qualification,
            Job.job_type,
            Job.category,
            Job.intro_text,
            Job.eligibility_text,
            Job.requirement_text,
        ]
        raw_terms = [t for t in search.strip().split() if t]
        if not raw_terms:
            raw_terms = [search.strip()]
        for term in raw_terms:
            # Escape regex metacharacters so user input like "C++" or "10+2"
            # is treated literally rather than as a regex pattern.
            escaped = re.escape(term)
            pattern = rf"\y{escaped}\y"
            # op("~*") is Postgres case-insensitive regex match
            conditions.append(
                or_(*[col.op("~*")(pattern) for col in searchable_columns])
            )

    if job_type:
        # Don't filter by strict equality on job_type. Instead match the
        # category's keywords across job_type + title + intro_text +
        # category, so e.g. "Government Bank Job" returns every row that
        # mentions a bank even if its raw job_type is just "Government
        # Job". "Other" picks up rows with no job_type at all.
        conditions.append(_category_match_condition(job_type))

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
        cutoff_date = cutoff.date()
        # Only attempt parsing for values that look like "12 January 2022"
        valid_date_pattern = r"^[0-9]{1,2} [A-Za-z]+ [0-9]{4}$"
        date_expr = case(
            (Job.posted_date.op("~")(valid_date_pattern), func.to_date(Job.posted_date, "DD Month YYYY")),
            else_=None,
        )
        conditions.append(Job.posted_date.isnot(None))
        conditions.append(Job.posted_date != "")
        conditions.append(date_expr.isnot(None))
        conditions.append(date_expr >= cutoff_date)

    if conditions:
        query = query.where(and_(*conditions))

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    # Sort by posted_date (newest first). Fallback to created_at when needed.
    valid_date_pattern = r"^[0-9]{1,2} [A-Za-z]+ [0-9]{4}$"
    posted_date_expr = case(
        (Job.posted_date.op("~")(valid_date_pattern), func.to_date(Job.posted_date, "DD Month YYYY")),
        else_=None,
    )

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
    # Tiles = the raw job_type values that already exist in the DB
    # (deduped, blanks dropped), plus "Other" when there are NULL/blank
    # rows. We do NOT invent new tiles. New raw values added by the
    # scraper appear automatically the next time the API is called.
    rows = db.execute(
        select(Job.job_type, func.count())
        .where(Job.url != "https://www.jobkaka.com/")
        .group_by(Job.job_type)
    ).all()

    has_blank = False
    raw_values: List[Tuple[str, int]] = []
    for value, count in rows:
        if value is None or not value.strip():
            has_blank = True
        else:
            raw_values.append((value.strip(), count))

    # Stable order: most populous first, then alphabetical.
    raw_values.sort(key=lambda r: (-r[1], r[0].lower()))
    job_types = [v for v, _ in raw_values]
    if has_blank:
        job_types.append(OTHER_CATEGORY)

    # Use normalized qualification buckets instead of raw distinct values
    qualifications = list(QUALIFICATION_BUCKETS.keys())
    categories = [
        r[0]
        for r in db.execute(
            select(func.distinct(Job.category)).where(Job.category.isnot(None))
        ).all()
    ]
    return job_types, qualifications, categories


def unmapped_job_types(db: Session) -> List[Tuple[str, int]]:
    """Raw Job.job_type values that don't have an entry in
    CATEGORY_KEYWORDS yet. The filter still works for these (it falls
    back to deriving keywords from the name), but adding an explicit
    keyword list gives cleaner results. Use this to spot new variations
    coming out of the scraper.
    """
    rows = db.execute(
        select(Job.job_type, func.count().label("n"))
        .where(Job.url != "https://www.jobkaka.com/")
        .where(Job.job_type.isnot(None))
        .where(func.trim(Job.job_type) != "")
        .group_by(Job.job_type)
        .order_by(func.count().desc())
    ).all()
    return [(r[0], r[1]) for r in rows if r[0] not in CATEGORY_KEYWORDS]

