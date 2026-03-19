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

