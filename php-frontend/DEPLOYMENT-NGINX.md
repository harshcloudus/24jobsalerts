# Nginx deployment — 24jobsalerts PHP frontend

Coexists with the existing FastAPI backend and Next.js frontend. **Nothing in
`backend/`, `cron/`, or `frontend/` is changed.** Nginx has no `.htaccess`, so
the routing the bundled `.htaccess` does on Apache is expressed here in the
server block.

## Requirements
- PHP 8.0+ with `php-fpm`, `curl`, `json`.
- Nginx.
- FastAPI backend reachable (default `http://127.0.0.1:8000`).

## 1. Env
```bash
cd /var/www/24jobsalerts/php-frontend
cp .env.example .env          # set SITE_URL, API_BASE, Firebase keys
chmod -R 775 cache
```

## 2. Server block
```nginx
server {
    listen 80;
    server_name www.24jobsalerts.com;
    root /var/www/24jobsalerts/php-frontend;
    index index.php;

    # ---- sitemaps (Yoast-style URLs -> PHP) ----
    location = /sitemap.xml      { rewrite ^ /sitemap.php       last; }
    location = /page-sitemap.xml { rewrite ^ /page-sitemap.php  last; }
    location = /post-sitemap.xml { rewrite ^ /post-sitemap.php?n=1 last; }
    location ~ ^/post-sitemap(\d+)\.xml$ { rewrite ^ /post-sitemap.php?n=$1 last; }

    # ---- robots ----
    location = /robots.txt { rewrite ^ /robots.php last; }

    # ---- slug pages ----
    location ~ ^/jobs/([^/]+)/?$            { rewrite ^ /job-detail.php?slug=$1 last; }
    location = /qualifications/             { rewrite ^ /qualification.php last; }
    location = /qualifications              { return 301 /qualifications/; }
    location ~ ^/qualifications/([^/]+)/?$  { rewrite ^ /qualification.php?slug=$1 last; }
    location = /job-types/                  { rewrite ^ /job-type.php last; }
    location = /job-types                   { return 301 /job-types/; }
    location ~ ^/job-types/([^/]+)/?$       { rewrite ^ /job-type.php?slug=$1 last; }

    # ---- pretty list routes ----
    location ~ ^/all-jobs/?$    { rewrite ^ /all-jobs.php    last; }
    location ~ ^/latest-jobs/?$ { rewrite ^ /latest-jobs.php last; }
    location ~ ^/search/?$      { rewrite ^ /search.php      last; }
    location ~ ^/bookmarks/?$   { rewrite ^ /bookmarks.php   last; }
    location ~ ^/newsletter/?$  { rewrite ^ /newsletter.php  last; }

    # ---- block internal dirs ----
    location ~ ^/(includes|templates|cache)/ { deny all; return 403; }

    # ---- static assets ----
    location /assets/ { try_files $uri =404; access_log off; expires 7d; }

    # ---- php-fpm ----
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
}
```

Reload:
```bash
nginx -t && systemctl reload nginx
```

## 3. Coexistence
- **Backend FastAPI** stays on its own port (`127.0.0.1:8000`); `API_BASE` in
  `.env` points at it. Often itself proxied at `/api` on the backend vhost —
  the PHP app calls it directly, server-to-server, so CORS is irrelevant.
- **Next.js frontend** (PM2) can keep its own `server_name` / upstream. Give the
  PHP app the apex/`www` and Next a subdomain, or vice versa. Both read the same
  `saved_job_ids` cookie on a shared domain.

## 4. HTTPS
`certbot --nginx`. `SITE_URL` in `.env` controls canonical scheme/host.

## 5. Subpath deploy (optional)
Set `BASE_PATH=/jobs` in `.env` and wrap the routes above under
`location /jobs/ { ... }` adjusting the rewrite targets accordingly.

## 6. Verify
```bash
curl -I https://www.24jobsalerts.com/
curl    https://www.24jobsalerts.com/sitemap.xml
curl -I https://www.24jobsalerts.com/jobs/some-title-123/
```
