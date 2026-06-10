# 24jobsalerts — PHP Frontend

A **second** frontend for 24jobsalerts, written in pure PHP + HTML + CSS + JS.
It is added **alongside** the existing Next.js frontend and consumes the **same
FastAPI backend** exactly as documented. Nothing in `backend/`, `cron/`,
`frontend/`, the database, or the deploy pipeline is modified.

```
24jobsalerts/
├── backend/          (FastAPI — untouched)
├── cron/             (scraper — untouched)
├── frontend/         (Next.js — untouched)
└── php-frontend/     (this app — new)
```

## Quick start (local / Laragon)

Laragon serves `D:\laragon\www\24jobsalerts` — so this app is already reachable.

1. Start the FastAPI backend (so the API exists):
   ```powershell
   cd ..\backend
   uvicorn app.main:app --reload --port 8000
   ```
2. Copy env and (optionally) edit:
   ```powershell
   cd ..\php-frontend
   copy .env.example .env
   ```
   For local dev the defaults already point at `http://localhost:8000`.
3. Open in a browser:
   - `http://24jobsalerts.test/php-frontend/` (Laragon auto-vhost), **or**
   - `http://localhost/24jobsalerts/php-frontend/`

   Because Laragon's docroot isn't this folder, pretty URLs (`/all-jobs/`,
   `/jobs/slug-123/`) need the `.htaccess` rewrites to apply at this path. The
   simplest local option: open `index.php` and the `*.php` files directly
   (e.g. `.../php-frontend/all-jobs.php`, `.../php-frontend/job-detail.php?slug=foo-123`).
   For pretty URLs locally, create a Laragon vhost whose docroot is the
   `php-frontend/` folder — then `http://24jobsalerts-php.test/all-jobs/` works.

## Pages
| URL | File | Notes |
|---|---|---|
| `/` | `index.php` | hero+search, latest, all, tiles, trust bar, newsletter |
| `/all-jobs/` | `all-jobs.php` | paginated, filters |
| `/latest-jobs/` | `latest-jobs.php` | `only_recent=true` |
| `/search/` | `search.php` | **noindex,nofollow** |
| `/bookmarks/` | `bookmarks.php` | `saved_job_ids` cookie, robots-disallowed |
| `/qualifications/{slug}/` | `qualification.php` | slug → bucket key |
| `/job-types/{slug}/` | `job-type.php` | slug → raw job_type (semantic match) |
| `/jobs/{slug}-{id}/` | `job-detail.php` | id from trailing number; JSON-LD |
| `/newsletter/` | `newsletter.php` | POST proxy, idempotent |
| `/robots.txt` | `robots.php` | |
| `/sitemap.xml` | `sitemap.php` | index |
| `/page-sitemap.xml` | `page-sitemap.php` | 10 static |
| `/post-sitemap{n}.xml` | `post-sitemap.php` | job URLs |

## API compatibility
Consumes **only** the documented endpoints, unchanged: `GET /api/jobs`
(page, page_size, search, job_type, qualification, category, only_recent),
`GET /api/jobs/{id}`, `GET /api/filters`, `GET /api/admin/unmapped-job-types`,
`POST /api/newsletter/subscribe`. The `salary` field is consumed as-returned
(the backend derives it from `tables_json`).

---

## Migration report (parity matrix)

| Feature | Next.js | PHP implementation | Status |
|---|---|---|---|
| Listing / search / filter / pagination | CSR | SSR pass-through to `/api/jobs` with exact param names | ✅ + SSR improvement |
| qualification buckets | bucket key sent | `qualification_from_slug()` → exact `QUALIFICATION_BUCKETS` key | ✅ (manual sync, same as Next) |
| job_type semantic match | raw value sent | raw `job_type` passed; backend `CATEGORY_KEYWORDS` matches | ✅ |
| category exact filter | param | param | ✅ |
| only_recent (6 months) | param | fixed param on latest-jobs | ✅ |
| sorting | backend | backend (unchanged) | ✅ |
| slug `slugify(title)-id` | route.ts | `slugify_job()` exact port | ✅ |
| id from slug tail | `split('-').pop()` | `parse_job_id_from_slug()` exact | ✅ |
| job detail tables + linkify + Important Links + Eligibility/How-to-apply extras | page.tsx | ported cell-by-cell (`render_cell`, `linkify_text`) | ✅ |
| **related_jobs_json** | present in schema, **NOT rendered** | **rendered** | ⬆ improvement |
| salary chip | from API | from API | ✅ |
| JobPosting + Breadcrumb JSON-LD | seo.ts | `seo.php`/`jsonld.php` exact port | ✅ |
| Organization + WebSite JSON-LD | root layout | every page head | ✅ |
| per-job OG image | generic `og-default.png` | same | ✅ |
| title template `%s \| 24JobsAlerts` | metadata | `render_meta()` | ✅ |
| canonical / robots / OG / Twitter | metadata | `render_meta()` | ✅ |
| search noindex | layout | `robots=noindex` | ✅ |
| sitemaps (index/page/post) + math (1000/100/10) | route handlers | `sitemap.php` / `page-sitemap.php` / `post-sitemap.php` exact | ✅ |
| trailing slash | `trailingSlash:true` | `.htaccess` / nginx rewrites | ✅ |
| empty-but-valid XML on API down | yes | yes | ✅ |
| bookmarks cookie | `saved_job_ids` cookie, JSON, 30d | identical (`bookmarks.php` read + `bookmarks.js` write) | ✅ |
| newsletter idempotent | API | proxy | ✅ |
| AdSense top/display/inline | components | `<ins class="adsbygoogle">` units | ✅ |
| AdSense reward/vignette interstitial | `navigateWithAdBreak` | `adbreak.js` port | ⚠ depends on Google AdSense JS (same limit as Next) |
| GTM | layout | header | ✅ |
| Firebase analytics only | npm module | CDN dynamic import, `isSupported()` guard | ✅ |
| trust-bar stats | hardcoded copy | hardcoded copy | ✅ |

### Cannot be replicated exactly
- **Next ISR internals** (build-time revalidation) — replaced by a filesystem
  TTL cache (`DETAIL_CACHE_TTL=300`, `SITEMAP_CACHE_TTL=3600`). Functionally
  equivalent, not identical machinery.
- **AdSense interstitial rendering** — produced by Google's AdSense `adBreak`
  JS, not by our code. Identical limitation to the Next frontend; without the
  AdSense script the nav degrades to a plain redirect.

### Improvements over the Next frontend
- **SSR list pages** — listing HTML now contains the jobs (Next list pages were
  CSR-only and absent from SSR HTML), so list-page SEO is stronger.
- **related_jobs rendered** — the API returns `related_jobs_json`; Next never
  renders it. The PHP detail page does.

### Known gotchas carried over (doc §13)
- `SITE_URL` default points at the **wrong host** (`mediresponse.org`). **Set
  `SITE_URL` in `.env`** in production or every canonical/OG/sitemap URL is wrong.
- `QUALIFICATION_BUCKETS` keys and job-type slugs are **manually coupled** to
  `backend/app/crud/jobs.py` — if the backend buckets change, update
  `helpers.php::qualification_buckets()`.
- The bookmark cookie name/format must stay `saved_job_ids` / JSON array to keep
  interop with the Next frontend on a shared domain.

## Deployment
See `DEPLOYMENT-APACHE.md` and `DEPLOYMENT-NGINX.md`. The app is a standalone
PHP vhost that calls the existing FastAPI backend server-to-server; it does not
require Vercel and does not touch the existing PM2/Next deploy.
