import argparse
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

import requests

from jobkaka_scraper import fetch_page, parse_job_page, init_db, save_job_to_db


SITEMAP_INDEX_URL = "https://www.jobkaka.com/sitemap_index.xml"
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def parse_iso_datetime(value: str) -> Optional[datetime]:
    try:
        # Yoast lastmod: "2026-03-07T17:39:00+00:00"
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        # Normalize to UTC naive for easy comparison
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except Exception:
        return None


def get_latest_created_at(db_path: Path) -> Optional[datetime]:
    if not db_path.exists():
        return None
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT MAX(created_at) FROM jobs")
    row = cur.fetchone()
    conn.close()
    if not row or not row[0]:
        return None
    try:
        # SQLite default CURRENT_TIMESTAMP: "YYYY-MM-DD HH:MM:SS"
        return datetime.fromisoformat(row[0])
    except Exception:
        return None


def fetch_post_sitemaps(index_url: str) -> List[str]:
    resp = requests.get(index_url, timeout=20)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    urls: List[str] = []
    for loc in root.findall(".//sm:loc", SITEMAP_NS):
        href = (loc.text or "").strip()
        if "post-sitemap" in href:
            urls.append(href)
    return urls


def fetch_post_entries(sitemap_url: str) -> List[Tuple[str, Optional[datetime]]]:
    """
    Return list of (url, lastmod_datetime) from a single post-sitemap.xml.
    """
    resp = requests.get(sitemap_url, timeout=20)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)

    entries: List[Tuple[str, Optional[datetime]]] = []
    for url_el in root.findall(".//sm:url", SITEMAP_NS):
        loc_el = url_el.find("sm:loc", SITEMAP_NS)
        if loc_el is None or not loc_el.text:
            continue
        href = loc_el.text.strip()
        lastmod_el = url_el.find("sm:lastmod", SITEMAP_NS)
        lastmod_dt = parse_iso_datetime(lastmod_el.text.strip()) if lastmod_el is not None and lastmod_el.text else None
        entries.append((href, lastmod_dt))
    return entries


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Incremental JobKaka scraper based on post-sitemap lastmod dates"
    )
    parser.add_argument(
        "--db",
        default="jobkaka_jobs.db",
        help="SQLite DB path (default: jobkaka_jobs.db)",
    )
    args = parser.parse_args()
    db_path = Path(args.db)

    # Determine cutoff time from DB
    last_created = get_latest_created_at(db_path)

    init_db(db_path)

    sitemap_urls = fetch_post_sitemaps(SITEMAP_INDEX_URL)

    to_process: List[str] = []
    for sm_url in sitemap_urls:
        for href, lastmod in fetch_post_entries(sm_url):
            if last_created is None:
                to_process.append(href)
            else:
                # Process if sitemap says it's newer than what we have
                if lastmod is None or lastmod > last_created:
                    to_process.append(href)

    # Remove duplicates while preserving order
    seen = set()
    unique_urls: List[str] = []
    for u in to_process:
        if u not in seen:
            seen.add(u)
            unique_urls.append(u)

    print(f"Found {len(unique_urls)} URLs to update.")

    for url in unique_urls:
        try:
            html = fetch_page(url)
            job = parse_job_page(html, url)
            save_job_to_db(job, db_path)
            print(f"Stored {url}")
        except Exception as exc:
            print(f"Failed {url}: {exc}")


if __name__ == "__main__":
    main()

