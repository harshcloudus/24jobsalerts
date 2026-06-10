<?php
/**
 * api.php — FastAPI client. Consumes the EXISTING backend exactly as documented
 * (PROJECT_DOCUMENTATION.md §7). No endpoint is invented or changed.
 *
 *   GET  /                              health
 *   GET  /api/jobs                      page,page_size,search,job_type,
 *                                       qualification,category,only_recent
 *   GET  /api/jobs/{id}                 detail (404 if missing)
 *   GET  /api/filters                   {job_types, qualifications, categories}
 *   GET  /api/admin/unmapped-job-types  diagnostic
 *   POST /api/newsletter/subscribe      {email} -> {ok, created}
 *
 * GET responses are cached on disk with a TTL — the equivalent of Next's
 * `fetch(..., { next: { revalidate } })` ISR behaviour. On API failure the
 * helpers return safe empties so pages/sitemaps degrade gracefully (matching
 * the Next routes that "swallow errors and return empty-but-valid" output).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/** Build a query string from non-null params, preserving documented names. */
function api_query(array $params): string
{
    $clean = [];
    foreach ($params as $k => $v) {
        if ($v === null || $v === '') {
            continue;
        }
        if (is_bool($v)) {
            $v = $v ? 'true' : 'false';
        }
        $clean[$k] = $v;
    }
    return $clean ? '?' . http_build_query($clean) : '';
}

/** Low-level GET with optional TTL file cache. Returns decoded array or null. */
function api_get(string $path, int $ttl = 0)
{
    $url = API_BASE . $path;
    $cacheFile = null;

    if ($ttl > 0) {
        if (!is_dir(CACHE_DIR)) {
            @mkdir(CACHE_DIR, 0775, true);
        }
        $cacheFile = CACHE_DIR . '/' . sha1($url) . '.json';
        if (is_file($cacheFile) && (time() - filemtime($cacheFile) < $ttl)) {
            $cached = file_get_contents($cacheFile);
            if ($cached !== false) {
                $data = json_decode($cached, true);
                if (is_array($data)) {
                    return $data;
                }
            }
        }
    }

    $body = http_get($url);
    if ($body === null) {
        // serve stale cache if present (resilience, like Next swallowing errors)
        if ($cacheFile && is_file($cacheFile)) {
            $stale = json_decode((string) file_get_contents($cacheFile), true);
            if (is_array($stale)) {
                return $stale;
            }
        }
        return null;
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return null;
    }
    if ($cacheFile) {
        @file_put_contents($cacheFile, $body, LOCK_EX);
    }
    return $data;
}

/** Raw HTTP GET. Returns body string on 2xx, else null. Uses curl if present. */
function http_get(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => '24jobsalerts-php-frontend/1.0',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $code < 200 || $code >= 300) {
            return null;
        }
        return (string) $body;
    }

    // fallback: stream context
    $ctx = stream_context_create(['http' => [
        'timeout' => 20,
        'header' => "Accept: application/json\r\nUser-Agent: 24jobsalerts-php-frontend/1.0\r\n",
        'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) {
        return null;
    }
    // crude status check from $http_response_header
    if (isset($http_response_header[0]) && !preg_match('/\s2\d\d\s/', $http_response_header[0])) {
        return null;
    }
    return $body;
}

/** POST JSON. Returns [httpStatus, decodedArrayOrNull]. */
function api_post_json(string $path, array $payload): array
{
    $url = API_BASE . $path;
    $json = json_encode($payload);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $data = is_string($body) ? json_decode($body, true) : null;
        return [$code, is_array($data) ? $data : null];
    }

    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
        'content' => $json,
        'timeout' => 20,
        'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    $code = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $code = (int) $m[1];
    }
    $data = is_string($body) ? json_decode($body, true) : null;
    return [$code, is_array($data) ? $data : null];
}

// ---- typed helpers over the documented endpoints ------------------------

/**
 * GET /api/jobs — every documented query param supported. Returns
 * {items, total, page, page_size}; empty-safe on failure.
 */
function get_jobs(array $params = [], int $ttl = 0): array
{
    $defaults = [
        'page' => 1,
        'page_size' => 20,
        'search' => null,
        'job_type' => null,
        'qualification' => null,
        'category' => null,
        'only_recent' => null,
    ];
    $params = array_merge($defaults, $params);
    $data = api_get('/api/jobs' . api_query($params), $ttl);
    if (!is_array($data)) {
        return ['items' => [], 'total' => 0, 'page' => (int) $params['page'], 'page_size' => (int) $params['page_size']];
    }
    $data['items'] = $data['items'] ?? [];
    $data['total'] = $data['total'] ?? 0;
    return $data;
}

/** GET /api/jobs/{id} — returns job array or null (404). */
function get_job(int $id, int $ttl = 0): ?array
{
    $data = api_get('/api/jobs/' . $id, $ttl);
    return is_array($data) ? $data : null;
}

/** GET /api/filters — {job_types, qualifications, categories}. */
function get_filters(int $ttl = 0): array
{
    $data = api_get('/api/filters', $ttl);
    return [
        'job_types' => $data['job_types'] ?? [],
        'qualifications' => $data['qualifications'] ?? [],
        'categories' => $data['categories'] ?? [],
    ];
}

/** GET /api/admin/unmapped-job-types — diagnostic pass-through. */
function get_unmapped_job_types(): array
{
    $data = api_get('/api/admin/unmapped-job-types', 0);
    return is_array($data) ? $data : ['total_unmapped_rows' => 0, 'items' => []];
}

/** POST /api/newsletter/subscribe — idempotent, returns {ok, created}. */
function subscribe_newsletter(string $email): array
{
    [$code, $data] = api_post_json('/api/newsletter/subscribe', ['email' => $email]);
    if ($code === 200 && is_array($data)) {
        return ['ok' => (bool) ($data['ok'] ?? false), 'created' => (bool) ($data['created'] ?? false), 'status' => 200];
    }
    if ($code === 400) {
        return ['ok' => false, 'created' => false, 'status' => 400, 'error' => 'Invalid email'];
    }
    return ['ok' => false, 'created' => false, 'status' => $code ?: 0, 'error' => 'Subscription failed'];
}
