# Apache deployment — 24jobsalerts PHP frontend

The PHP frontend coexists with the existing FastAPI backend and Next.js
frontend on the same VPS. **Nothing in `backend/`, `cron/`, or `frontend/` is
changed.** The PHP app is a separate vhost/subdomain that calls the same
FastAPI API over HTTP.

## Requirements
- PHP 8.0+ (`php-fpm` recommended) with `curl` and `json` extensions.
- Apache 2.4 with `mod_rewrite`, `mod_proxy_fcgi` (for php-fpm).
- The FastAPI backend reachable (default `http://localhost:8000`).

## 1. Place the code
The repo already contains `php-frontend/`. On the VPS it lives at e.g.
`/var/www/24jobsalerts/php-frontend`.

## 2. Configure env
```bash
cd /var/www/24jobsalerts/php-frontend
cp .env.example .env
# edit .env: set SITE_URL to the real host, API_BASE to the backend,
# Firebase keys if analytics is wanted.
chmod -R 775 cache         # web server must be able to write the cache dir
```

## 3. Virtual host
Point a dedicated vhost DocumentRoot at the `php-frontend/` directory so the
bundled `.htaccess` handles routing:

```apache
<VirtualHost *:80>
    ServerName www.24jobsalerts.com
    DocumentRoot /var/www/24jobsalerts/php-frontend

    <Directory /var/www/24jobsalerts/php-frontend>
        AllowOverride All          # required so .htaccess rewrites apply
        Require all granted
    </Directory>

    # php-fpm
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php/php8.2-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog  ${APACHE_LOG_DIR}/24jobsalerts-php-error.log
    CustomLog ${APACHE_LOG_DIR}/24jobsalerts-php-access.log combined
</VirtualHost>
```

Enable + reload:
```bash
a2enmod rewrite proxy_fcgi
a2ensite 24jobsalerts-php.conf
systemctl reload apache2
```

## 4. Coexistence
- **Backend (FastAPI):** unchanged, keep it on `:8000` (uvicorn/gunicorn behind
  whatever you already run). The PHP app just sets `API_BASE` to it.
- **Next.js frontend:** unchanged. If you keep it live, give it its own
  ServerName (e.g. `next.24jobsalerts.com`) or a different port behind PM2, and
  give the PHP app the apex/`www`. They can run side by side.
- **Shared bookmark cookie:** both frontends use `saved_job_ids` on the same
  registrable domain — saves made on one are visible on the other.

## 5. HTTPS
Add Let's Encrypt as usual (`certbot --apache`). The `.htaccess` rewrites are
scheme-agnostic; `SITE_URL` in `.env` controls the canonical scheme/host.

## 6. Subpath deploy (optional)
To serve under `/jobs`, set `BASE_PATH=/jobs` in `.env`, mount the app with an
`Alias /jobs /var/www/24jobsalerts/php-frontend`, and add `RewriteBase /jobs/`
to the top of `.htaccess`.

## 7. Verify
```bash
curl -I https://www.24jobsalerts.com/                 # 200
curl    https://www.24jobsalerts.com/robots.txt       # disallows /api/ /bookmarks/
curl    https://www.24jobsalerts.com/sitemap.xml      # index, post-sitemapN children
curl -I https://www.24jobsalerts.com/all-jobs/        # 200, SSR list in HTML
```
