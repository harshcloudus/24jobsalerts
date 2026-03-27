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
    Walk all elements after the article h1 until the first h2/h3.
    - First text matching the date pattern = meta line
    - All <p> tags after that (excluding 'Advertisements') = intro text
    """
    posted_date = None
    job_type = None
    qualification = None
    meta_found = False
    intro_paras: List[str] = []

    for el in h1.find_all_next():
        if not isinstance(el, Tag):
            continue
        if el.name in ("h2", "h3"):
            break

        text = el.get_text(strip=True)
        if not text or text.lower() == "advertisements":
            continue

        if not meta_found:
            m = re.match(r"^(\d{1,2}\s+\w+\s+\d{4})\s*(.*)$", text)
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
                meta_found = True
            continue

        if el.name == "p":
            intro_paras.append(text)

    return {
        "posted_date": posted_date,
        "job_type": job_type,
        "qualification": qualification,
        "intro_text": " ".join(intro_paras) if intro_paras else None,
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
        "official_site_text": None,
        "eligibility_text": None,
        "requirement_text": None,
        "last_date_text": None,
        "tables": [],
        "category": None,
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
        if "last date of online application" in lower or "last date of offline application" in lower:
            if data["last_date_text"] is None:
                data["last_date_text"] = p

    # requirement_text & eligibility_text from the "Eligibility / Requirements" section
    elig_heading = None
    for heading in soup.find_all(["h2", "h3"]):
        htxt = heading.get_text().lower()
        if "eligibility" in htxt or "requirement" in htxt:
            elig_heading = heading
            break

    if elig_heading:
        seen_table = False
        for sib in elig_heading.find_all_next():
            if not isinstance(sib, Tag):
                continue
            if sib.name in ("h2",) and sib != elig_heading:
                break
            if sib.name == "table":
                seen_table = True
                continue
            if sib.name == "p" and sib.get_text(strip=True):
                if not seen_table and data["requirement_text"] is None:
                    data["requirement_text"] = sib.get_text(strip=True)
                elif seen_table and data["eligibility_text"] is None:
                    data["eligibility_text"] = sib.get_text(strip=True)
                    break

    # official_site_text: paragraph after the "How to Apply" section's table
    how_to_apply_heading = None
    for heading in soup.find_all(["h2", "h3"]):
        if "how to apply" in heading.get_text().lower():
            how_to_apply_heading = heading
            break

    if how_to_apply_heading:
        for sib in how_to_apply_heading.find_all_next():
            if not isinstance(sib, Tag):
                continue
            if sib.name in ("h2", "h3", "h1"):
                break
            if sib.name == "p" and sib.get_text(strip=True):
                data["official_site_text"] = sib.get_text(strip=True)
                link = sib.find("a", href=True)
                if link:
                    data["official_site"] = link["href"]
                else:
                    m = re.search(r"([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", sib.get_text())
                    if m:
                        site = m.group(1)
                        if not site.startswith("http"):
                            site = "https://" + site
                        data["official_site"] = site
                break

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

