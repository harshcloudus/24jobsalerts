<?php
/**
 * sitemap.php — /sitemap.xml sitemap INDEX (Next api/sitemap/route.ts).
 * Fetches total via /api/jobs?page=1&page_size=1, emits page-sitemap +
 * ceil(total/SITEMAP_PAGE_SIZE) post-sitemap children. Page 1 suffix "" so
 * /post-sitemap.xml == page 1, /post-sitemap2.xml == page 2 (doc §9).
 * Empty-but-valid on API failure.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';

const SITEMAP_PAGE_SIZE = 1000;

$base = site_url();
$totalData = get_jobs(['page' => 1, 'page_size' => 1], SITEMAP_CACHE_TTL);
$total = (int) ($totalData['total'] ?? 0);
$postPages = $total > 0 ? (int) ceil($total / SITEMAP_PAGE_SIZE) : 0;
$now = gmdate('Y-m-d\TH:i:s.000\Z');

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600, s-maxage=3600');

$entries = ["  <sitemap><loc>{$base}/page-sitemap.xml</loc><lastmod>{$now}</lastmod></sitemap>"];
for ($i = 1; $i <= $postPages; $i++) {
    $suffix = $i === 1 ? '' : (string) $i;
    $entries[] = "  <sitemap><loc>{$base}/post-sitemap{$suffix}.xml</loc><lastmod>{$now}</lastmod></sitemap>";
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo implode("\n", $entries) . "\n";
echo '</sitemapindex>';
