import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Set

import requests

from jobkaka_scraper import fetch_page, parse_job_page, init_db, save_job_to_db


SITEMAP_INDEX_URL = "https://www.jobkaka.com/sitemap_index.xml"


def fetch_sitemap_urls(index_url: str) -> List[str]:
    """Fetch sitemap index and return all post-sitemap URLs."""
    resp = requests.get(index_url, timeout=20)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls: List[str] = []

    for loc in root.findall(".//sm:loc", ns):
        href = loc.text or ""
        if "post-sitemap" in href:
            urls.append(href.strip())
    return urls


def fetch_post_urls_from_sitemap(sitemap_url: str) -> List[str]:
    """Fetch a single post-sitemap.xml and return all <loc> URLs."""
    resp = requests.get(sitemap_url, timeout=20)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls: List[str] = []
    for loc in root.findall(".//sm:loc", ns):
        href = loc.text or ""
        if href:
            urls.append(href.strip())
    return urls


def main() -> None:
    parser = argparse.ArgumentParser(description="Crawl JobKaka post sitemaps and store all jobs in DB")
    parser.add_argument(
        "--db",
        default="jobkaka_jobs.db",
        help="SQLite DB path (default: jobkaka_jobs.db)",
    )
    args = parser.parse_args()
    db_path = Path(args.db)

    # Discover all post-sitemap URLs
    sitemap_urls = fetch_sitemap_urls(SITEMAP_INDEX_URL)

    # Collect all unique post URLs
    post_urls: Set[str] = set()
    for sm_url in sitemap_urls:
        for u in fetch_post_urls_from_sitemap(sm_url):
            post_urls.add(u)

    # Initialize DB once
    init_db(db_path)

    # Scrape and store each job URL
    for url in sorted(post_urls):
        try:
            html = fetch_page(url)
            job = parse_job_page(html, url)
            save_job_to_db(job, db_path)
        except Exception as exc:
            # Keep going even if some URLs fail
            print(f"Failed to process {url}: {exc}")


if __name__ == "__main__":
    main()

