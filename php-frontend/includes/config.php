<?php
/**
 * config.php — environment loading + global constants.
 *
 * Mirrors the Next.js frontend env vars (PROJECT_DOCUMENTATION.md §12) so the
 * PHP frontend is a drop-in alternative consuming the SAME FastAPI backend.
 *
 * Loads .env from php-frontend/.env, then repo-root .env (same precedence idea
 * as the cron scraper). Every var has a hardcoded fallback identical to the
 * Next.js defaults so the stack works out of the box.
 */

declare(strict_types=1);

if (!defined('JA_BOOTSTRAPPED')) {
    define('JA_BOOTSTRAPPED', true);

    // ---- minimal .env loader (no Composer dependency) --------------------
    $envLoad = static function (string $path): void {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            $eq = strpos($line, '=');
            if ($eq === false) {
                continue;
            }
            $key = trim(substr($line, 0, $eq));
            $val = trim(substr($line, $eq + 1));
            // strip surrounding quotes
            if (strlen($val) >= 2 && ($val[0] === '"' || $val[0] === "'") && substr($val, -1) === $val[0]) {
                $val = substr($val, 1, -1);
            }
            if ($key !== '' && getenv($key) === false) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    };

    $envLoad(__DIR__ . '/../.env');
    $envLoad(__DIR__ . '/../../.env');

    $env = static function (string $key, string $default): string {
        $v = getenv($key);
        return ($v === false || $v === '') ? $default : $v;
    };

    // ---- public config (names map 1:1 to NEXT_PUBLIC_* doc §12) ----------
    // API base — the single data source. Same default as Next.
    define('API_BASE', rtrim($env('API_BASE', $env('NEXT_PUBLIC_API_BASE', 'http://localhost:8000')), '/'));

    // Canonical / OG / sitemap base. NOTE: doc gotcha — Next default points at
    // the WRONG host (mediresponse.org). Set SITE_URL in .env for production.
    define('SITE_URL', rtrim($env('SITE_URL', $env('NEXT_PUBLIC_SITE_URL', 'https://mediresponse.org/24jobsalert')), '/'));

    // Subpath deploy support (mirrors NEXT_PUBLIC_BASE_PATH).
    // If BASE_PATH is not explicitly set, auto-detect it from the request so the
    // app works whether it's served at a vhost root (DocumentRoot = php-frontend)
    // OR opened directly under a subfolder like /24jobsalerts/php-frontend.
    // This keeps /assets/* links resolving correctly with zero config.
    $explicitBase = $env('BASE_PATH', $env('NEXT_PUBLIC_BASE_PATH', '__JA_UNSET__'));
    if ($explicitBase === '__JA_UNSET__') {
        // Derive from the directory of the front controller, dropping a trailing
        // "/<page>.php" if present. e.g. /24jobsalerts/php-frontend/index.php
        //   -> /24jobsalerts/php-frontend ; vhost root index.php -> "".
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $dir = str_replace('\\', '/', dirname($script));
        $autoBase = ($dir === '/' || $dir === '.') ? '' : rtrim($dir, '/');
        define('BASE_PATH', $autoBase);
    } else {
        define('BASE_PATH', rtrim($explicitBase, '/'));
    }

    // AdSense (doc §12 defaults).
    define('ADSENSE_CLIENT', $env('ADSENSE_CLIENT', $env('NEXT_PUBLIC_ADSENSE_CLIENT', 'ca-pub-4476723703068552')));
    define('ADSENSE_SLOT', $env('ADSENSE_SLOT', $env('NEXT_PUBLIC_ADSENSE_SLOT', '6350182318')));

    // Google Tag Manager id (hardcoded in Next layout.tsx).
    define('GTM_ID', $env('GTM_ID', 'GTM-W5LTLXZ5'));

    // Firebase Analytics config (analytics only — no auth, no firestore).
    define('FIREBASE_API_KEY', $env('FIREBASE_API_KEY', $env('NEXT_PUBLIC_FIREBASE_API_KEY', '')));
    define('FIREBASE_AUTH_DOMAIN', $env('FIREBASE_AUTH_DOMAIN', $env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', '')));
    define('FIREBASE_PROJECT_ID', $env('FIREBASE_PROJECT_ID', $env('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '')));
    define('FIREBASE_STORAGE_BUCKET', $env('FIREBASE_STORAGE_BUCKET', $env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', '')));
    define('FIREBASE_MESSAGING_SENDER_ID', $env('FIREBASE_MESSAGING_SENDER_ID', $env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '')));
    define('FIREBASE_APP_ID', $env('FIREBASE_APP_ID', $env('NEXT_PUBLIC_FIREBASE_APP_ID', '')));
    define('FIREBASE_MEASUREMENT_ID', $env('FIREBASE_MEASUREMENT_ID', $env('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', '')));

    // Detail-page cache TTL — ISR revalidate=300 equivalent (doc §5.3).
    define('DETAIL_CACHE_TTL', (int) $env('DETAIL_CACHE_TTL', '300'));
    // Sitemap / filters cache TTL — Next uses revalidate=3600.
    define('SITEMAP_CACHE_TTL', (int) $env('SITEMAP_CACHE_TTL', '3600'));

    define('CACHE_DIR', __DIR__ . '/../cache');

    // Bookmark cookie — MUST match Next exactly (doc §5.3 gotcha).
    define('BOOKMARK_COOKIE', 'saved_job_ids');
    define('BOOKMARK_MAXAGE', 60 * 60 * 24 * 30); // 30 days
}

if (!function_exists('ja_log')) {
    /**
     * ja_log — single logging sink for the frontend. Writes to PHP's error_log
     * (configured per-host via the error_log directive / FPM catch_all). Every
     * degraded path (API failure, malformed JSON, cache I/O failure) calls this
     * so production outages are visible instead of silent (audit finding C5).
     * $level is advisory free text (ERROR / WARN / INFO).
     */
    function ja_log(string $message, string $level = 'ERROR'): void
    {
        error_log('[24ja] ' . $level . ' ' . $message);
    }
}
