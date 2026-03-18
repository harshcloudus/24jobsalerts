import json
import sqlite3
from pathlib import Path

from db_pg import init_db, upsert_job


SQLITE_DB = Path("jobkaka_jobs.db")


def main():
    if not SQLITE_DB.exists():
        print("SQLite DB not found:", SQLITE_DB)
        return

    conn = sqlite3.connect(SQLITE_DB)
    cur = conn.cursor()
    cur.execute(
        "SELECT url, title, posted_date, job_type, qualification, intro_text, "
        "application_fee, selection_process, official_site, last_date, apply_text, "
        "category, tables_json, search_by_qualification_json, "
        "search_by_type_json, related_jobs_json "
        "FROM jobs"
    )
    rows = cur.fetchall()
    conn.close()

    print("Migrating", len(rows), "rows to Supabase...")
    init_db()

    for row in rows:
        (
            url,
            title,
            posted_date,
            job_type,
            qualification,
            intro_text,
            application_fee,
            selection_process,
            official_site,
            last_date,
            apply_text,
            category,
            tables_json,
            search_by_qualification_json,
            search_by_type_json,
            related_jobs_json,
        ) = row

        job = {
            "url": url,
            "title": title,
            "posted_date": posted_date,
            "job_type": job_type,
            "qualification": qualification,
            "intro_text": intro_text,
            "application_fee": application_fee,
            "selection_process": selection_process,
            "official_site": official_site,
            "last_date": last_date,
            "apply_text": apply_text,
            "category": category,
            "tables": json.loads(tables_json or "[]"),
            "search_by_qualification": json.loads(search_by_qualification_json or "[]"),
            "search_by_type": json.loads(search_by_type_json or "[]"),
            "related_jobs": json.loads(related_jobs_json or "[]"),
        }

        upsert_job(job)

    print("Done.")


if __name__ == "__main__":
    main()

