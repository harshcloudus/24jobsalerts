import argparse
import json
import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag


def fetch_page(url: str) -> str:
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    return resp.text


def _extract_meta_and_intro(h1: Tag) -> Dict[str, Any]:
    """
    From just under the title, extract:
    - meta line (date, job type, qualification)
    - intro text (main description)
    """
    meta_line: Optional[str] = None
    intro_paras: List[str] = []

    for sib in h1.next_siblings:
        if isinstance(sib, Tag) and sib.name in ("h2", "h3"):
            break
        if isinstance(sib, Tag):
            text = sib.get_text(strip=True)
        else:
            text = str(sib).strip()
        if not text:
            continue

        if meta_line is None:
            meta_line = text
        else:
            if isinstance(sib, Tag) and sib.name == "p":
                intro_paras.append(text)

    posted_date = None
    job_type = None
    qualification = None

    if meta_line:
        # e.g. "26 December 2023 Government Job  12th Pass"
        m = re.match(r"^(\d{1,2}\s+\w+\s+\d{4})\s*(.*)$", meta_line)
        if m:
            posted_date = m.group(1)
            rest = m.group(2).strip()
            if rest:
                idx = rest.find("Job")
                if idx != -1:
                    job_type = rest[: idx + 3].strip()
                    qualification = rest[idx + 3 :].strip()
                else:
                    qualification = rest

    return {
        "posted_date": posted_date,
        "job_type": job_type,
        "qualification": qualification,
        "intro_text": " ".join(intro_paras) if intro_paras else None,
        "meta_line": meta_line,
    }


def parse_job_page(html: str, url: str) -> Dict[str, Any]:
    """
    Parse a JobKaka job page into:
    - fixed scalar fields
    - all tables in one list
    - link lists
    """
    soup = BeautifulSoup(html, "html.parser")

    data: Dict[str, Any] = {
        "url": url,
        "title": None,
        "posted_date": None,
        "job_type": None,
        "qualification": None,
        "intro_text": None,
        "application_fee": None,
        "selection_process": None,
        "official_site": None,
        "last_date": None,
        "apply_text": None,
        "tables": [],
        "category": None,
        "search_by_qualification": [],
        "search_by_type": [],
        "related_jobs": [],
    }

    # Title and meta/intro
    h1 = soup.find("h1")
    if h1:
        data["title"] = h1.get_text(strip=True)
        meta_intro = _extract_meta_and_intro(h1)
        data["posted_date"] = meta_intro["posted_date"]
        data["job_type"] = meta_intro["job_type"]
        data["qualification"] = meta_intro["qualification"]
        data["intro_text"] = meta_intro["intro_text"]

    # Paragraph-based fields
    all_p_tags = [p for p in soup.find_all("p") if p.get_text(strip=True)]
    paragraphs = [p.get_text(strip=True) for p in all_p_tags]
    for p in paragraphs:
        lower = p.lower()
        if "application fees for this job" in lower and data["application_fee"] is None:
            data["application_fee"] = p
        if "selection process of candidates" in lower and data["selection_process"] is None:
            data["selection_process"] = p
        if "application for this job" in lower and data["apply_text"] is None:
            data["apply_text"] = p
        if "last date of online application" in lower or "last date of offline application" in lower:
            if data["last_date"] is None:
                data["last_date"] = p

    # Try to detect official site from any paragraph mentioning "official website"
    for p in paragraphs:
        lower = p.lower()
        if "official website" in lower or "official site" in lower:
            m = re.search(r"([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", p)
            if m:
                site = m.group(1)
                if not site.startswith("http"):
                    site = "https://" + site
                data["official_site"] = site
                break

    # If intro_text is still empty, build it from the first block of paragraphs
    # before any main section heading (h2/h3). This matches the "intro text"
    # area you highlighted in the screenshot.
    if not data["intro_text"]:
        intro_paras: List[str] = []
        for p_tag in all_p_tags:
            # stop when we reach first h2/h3 above this paragraph (section start)
            if p_tag.find_previous(["h2", "h3"]):
                break
            txt = p_tag.get_text(strip=True)
            if txt:
                intro_paras.append(txt)
        if intro_paras:
            data["intro_text"] = " ".join(intro_paras)

    # All tables -> combined list
    for table in soup.find_all("table"):
        # section heading (nearest previous h2/h3)
        heading_text = None
        for prev in table.find_all_previous():
            if isinstance(prev, Tag) and prev.name in ("h2", "h3"):
                heading_text = prev.get_text(strip=True)
                break

        # sub-name just above table (h3/h4)
        name_text = None
        for sib in table.find_previous_siblings():
            if isinstance(sib, Tag) and sib.name in ("h3", "h4"):
                name_text = sib.get_text(strip=True)
                break
            if isinstance(sib, Tag) and sib.name in ("h2", "h3"):
                break

        rows = table.find_all("tr")
        if not rows:
            continue
        header_cells = rows[0].find_all(["th", "td"])
        columns = [c.get_text(strip=True) for c in header_cells]
        body_rows: List[List[str]] = []
        for row in rows[1:]:
            cells = [td.get_text(strip=True) for td in row.find_all("td")]
            if cells:
                body_rows.append(cells)

        data["tables"].append(
            {
                "heading": heading_text,
                "name": name_text,
                "columns": columns,
                "rows": body_rows,
            }
        )

    # Simple category heuristic
    if data["tables"]:
        data["category"] = "structured_job"
    else:
        data["category"] = "article"

    # Search-by links
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        if not text:
            continue
        href = urljoin(url, a["href"])
        if "Pass Jobs" in text:
            data["search_by_qualification"].append({"label": text, "url": href})
        elif text.endswith("Jobs"):
            data["search_by_type"].append({"label": text, "url": href})

    # Related jobs
    related_heading = None
    for tag in soup.find_all(["h1", "h2", "h3"]):
        if "Related Jobs" in tag.get_text():
            related_heading = tag
            break

    if related_heading:
        for a in related_heading.find_all_next("a", href=True):
            text = a.get_text(strip=True)
            href = urljoin(url, a["href"])
            if text and "jobkaka.com" in href:
                data["related_jobs"].append({"title": text, "url": href})

    return data


def init_db(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE,
            title TEXT,
            posted_date TEXT,
            job_type TEXT,
            qualification TEXT,
            intro_text TEXT,
            application_fee TEXT,
            selection_process TEXT,
            official_site TEXT,
            last_date TEXT,
            apply_text TEXT,
            category TEXT,
            tables_json TEXT,
            search_by_qualification_json TEXT,
            search_by_type_json TEXT,
            related_jobs_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # In case table existed without category column (older version), try to add it.
    try:
        cur.execute("ALTER TABLE jobs ADD COLUMN category TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()


def save_job_to_db(job: Dict[str, Any], db_path: Path) -> int:
    """
    Save a parsed job dict into a single SQLite table row.
    One job URL = one row.
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Delete existing row with same URL, if any
    cur.execute("DELETE FROM jobs WHERE url = ?", (job["url"],))

    cur.execute(
        """
        INSERT INTO jobs (
            url, title, posted_date, job_type, qualification,
            intro_text, application_fee, selection_process,
            official_site, last_date, apply_text, category,
            tables_json,
            search_by_qualification_json,
            search_by_type_json,
            related_jobs_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            job.get("url"),
            job.get("title"),
            job.get("posted_date"),
            job.get("job_type"),
            job.get("qualification"),
            job.get("intro_text"),
            job.get("application_fee"),
            job.get("selection_process"),
            job.get("official_site"),
            job.get("last_date"),
            job.get("apply_text"),
            job.get("category"),
            json.dumps(job.get("tables", []), ensure_ascii=False),
            json.dumps(job.get("search_by_qualification", []), ensure_ascii=False),
            json.dumps(job.get("search_by_type", []), ensure_ascii=False),
            json.dumps(job.get("related_jobs", []), ensure_ascii=False),
        ),
    )

    job_id = cur.lastrowid
    conn.commit()
    conn.close()
    return job_id


def main() -> None:
    parser = argparse.ArgumentParser(description="JobKaka job scraper -> single-table SQLite + JSON")
    parser.add_argument("--url", required=True, help="JobKaka job URL")
    parser.add_argument(
        "--db",
        default="jobkaka_jobs.db",
        help="SQLite DB path (default: jobkaka_jobs.db)",
    )
    parser.add_argument(
        "--print-json",
        action="store_true",
        help="Print the parsed job as JSON to stdout",
    )

    args = parser.parse_args()
    db_path = Path(args.db)

    html = fetch_page(args.url)
    job = parse_job_page(html, args.url)

    init_db(db_path)
    job_id = save_job_to_db(job, db_path)

    if args.print_json:
        print(json.dumps({"job_id": job_id, **job}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

