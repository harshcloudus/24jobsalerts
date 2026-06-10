<?php
/**
 * post-sitemap.php — /post-sitemap{n}.xml job-URL sitemap
 * (Next api/sitemap/post/[page]/route.ts).
 *
 * Math (doc §9, EXACT):
 *   SITEMAP_PAGE_SIZE      = 1000
 *   API_PAGE_SIZE          = 100
 *   API_PAGES_PER_SITEMAP  = 10
 *   sitemap page n -> API pages (n-1)*10+1 .. n*10
 *
 * Each job -> /jobs/{slugify(title)-id}/ (slug max 80, trailing slash).
 * Empty-but-valid XML if the API is offline (returns whatever was collected).
 *
 * Page number arrives via rewrite as ?n=... (default 1).
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

const SITEMAP_PAGE_SIZE = 1000;
const API_PAGE_SIZE = 100;
const API_PAGES_PER_SITEMAP = SITEMAP_PAGE_SIZE / API_PAGE_SIZE;

$page = max(1, (int) ($_GET['n'] ?? 1));
$base = site_url();

$apiPageStart = ($page - 1) * API_PAGES_PER_SITEMAP + 1;
$apiPageEnd = $page * API_PAGES_PER_SITEMAP;

$urls = [];
for ($p = $apiPageStart; $p <= $apiPageEnd; $p++) {
    $data = get_jobs(['page' => $p, 'page_size' => API_PAGE_SIZE], SITEMAP_CACHE_TTL);
    $items = $data['items'] ?? [];
    if (empty($items)) {
        break;
    }
    foreach ($items as $job) {
        $slug = slugify_job((string) ($job['title'] ?? ''), (int) ($job['id'] ?? 0));
        $lastmod = sitemap_iso_date($job['posted_date'] ?? null);
        $urls[] = "  <url><loc>{$base}/jobs/{$slug}/</loc><lastmod>{$lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>";
    }
    if (count($items) < API_PAGE_SIZE) {
        break;
    }
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600, s-maxage=3600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo implode("\n", $urls) . ($urls ? "\n" : '');
echo '</urlset>';

/** safeIsoDate port — valid date -> ISO, else now. */
function sitemap_iso_date(?string $value): string
{
    if ($value) {
        $ts = strtotime($value);
        if ($ts !== false) {
            return gmdate('Y-m-d\TH:i:s.000\Z', $ts);
        }
    }
    return gmdate('Y-m-d\TH:i:s.000\Z');
}
