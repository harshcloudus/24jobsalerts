import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    # Load environment variables from local .env if present,
    # so SUPABASE_DB_URL is available when running scripts directly.
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except Exception:
    # If python-dotenv is not installed, we simply rely on the
    # environment already containing SUPABASE_DB_URL.
    pass


DB_URL = os.getenv("SUPABASE_DB_URL")


def get_conn():
    return psycopg2.connect(DB_URL)


def init_db():
    """
    Ensure the jobs table exists and has all columns that match
    the fields produced by jobkaka_scraper.parse_job_page.
    """
    conn = get_conn()
    cur = conn.cursor()

    # Base table (new table name: jobs_24jobsalerts)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS jobs_24jobsalerts (
            id SERIAL PRIMARY KEY,
            url TEXT UNIQUE,
            title TEXT,
            posted_date TEXT,
            job_type TEXT,
            qualification TEXT,
            intro_text TEXT,
            application_fee TEXT,
            selection_process TEXT,
            official_site TEXT,
            category TEXT,
            tables_json JSONB,
            search_by_qualification_json JSONB,
            search_by_type_json JSONB,
            related_jobs_json JSONB,
            -- created_at must be present on every row
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    # Add newer columns if they don't exist yet
    cur.execute(
        """
        ALTER TABLE jobs_24jobsalerts
        ADD COLUMN IF NOT EXISTS official_site_text TEXT,
        ADD COLUMN IF NOT EXISTS eligibility_text TEXT,
        ADD COLUMN IF NOT EXISTS requirement_text TEXT,
        ADD COLUMN IF NOT EXISTS last_date_text TEXT
        """
    )

    conn.commit()
    conn.close()


def upsert_job(job: dict):
    """
    Upsert a parsed job dict into the jobs table.
    All scalar fields map 1:1 to columns; lists are stored as JSONB.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO jobs_24jobsalerts (
            url,
            title,
            posted_date,
            job_type,
            qualification,
            intro_text,
            application_fee,
            selection_process,
            official_site,
            official_site_text,
            eligibility_text,
            requirement_text,
            last_date_text,
            category,
            tables_json,
            search_by_qualification_json,
            search_by_type_json,
            related_jobs_json
        )
        VALUES (
            %(url)s,
            %(title)s,
            %(posted_date)s,
            %(job_type)s,
            %(qualification)s,
            %(intro_text)s,
            %(application_fee)s,
            %(selection_process)s,
            %(official_site)s,
            %(official_site_text)s,
            %(eligibility_text)s,
            %(requirement_text)s,
            %(last_date_text)s,
            %(category)s,
            %(tables_json)s,
            %(search_by_qualification_json)s,
            %(search_by_type_json)s,
            %(related_jobs_json)s
        )
        ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            posted_date = EXCLUDED.posted_date,
            job_type = EXCLUDED.job_type,
            qualification = EXCLUDED.qualification,
            intro_text = EXCLUDED.intro_text,
            application_fee = EXCLUDED.application_fee,
            selection_process = EXCLUDED.selection_process,
            official_site = EXCLUDED.official_site,
            official_site_text = EXCLUDED.official_site_text,
            eligibility_text = EXCLUDED.eligibility_text,
            requirement_text = EXCLUDED.requirement_text,
            last_date_text = EXCLUDED.last_date_text,
            category = EXCLUDED.category,
            tables_json = EXCLUDED.tables_json,
            search_by_qualification_json = EXCLUDED.search_by_qualification_json,
            search_by_type_json = EXCLUDED.search_by_type_json,
            related_jobs_json = EXCLUDED.related_jobs_json
        """,
        {
            "url": job.get("url"),
            "title": job.get("title"),
            "posted_date": job.get("posted_date"),
            "job_type": job.get("job_type"),
            "qualification": job.get("qualification"),
            "intro_text": job.get("intro_text"),
            "application_fee": job.get("application_fee"),
            "selection_process": job.get("selection_process"),
            "official_site": job.get("official_site"),
            "official_site_text": job.get("official_site_text"),
            "eligibility_text": job.get("eligibility_text"),
            "requirement_text": job.get("requirement_text"),
            "last_date_text": job.get("last_date_text"),
            "category": job.get("category"),
            "tables_json": json.dumps(job.get("tables", [])),
            "search_by_qualification_json": json.dumps(job.get("search_by_qualification", [])),
            "search_by_type_json": json.dumps(job.get("search_by_type", [])),
            "related_jobs_json": json.dumps(job.get("related_jobs", [])),
        },
    )
    conn.commit()
    conn.close()


def latest_created_at():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT MAX(created_at) AS max_created FROM jobs_24jobsalerts")
    row = cur.fetchone()
    conn.close()
    return row["max_created"]

