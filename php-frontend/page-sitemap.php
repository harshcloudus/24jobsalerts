<?php
/**
 * page-sitemap.php — /page-sitemap.xml static-page sitemap
 * (Next api/sitemap/page/route.ts). 10 hardcoded routes, exact changefreq +
 * priority. Trailing slashes preserved (trailingSlash:true parity).
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

$base = site_url();
$now = gmdate('Y-m-d\TH:i:s.000\Z');

$entries = [
    ['/', 'daily', '1'],
    ['/latest-jobs/', 'daily', '0.9'],
    ['/all-jobs/', 'daily', '0.9'],
    ['/qualifications/', 'weekly', '0.7'],
    ['/job-types/', 'weekly', '0.7'],
    ['/about-us/', 'yearly', '0.4'],
    ['/contact-us/', 'yearly', '0.4'],
    ['/privacy-policy/', 'yearly', '0.3'],
    ['/terms-and-conditions/', 'yearly', '0.3'],
    ['/disclaimer/', 'yearly', '0.3'],
];

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600, s-maxage=3600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($entries as [$path, $freq, $pr]) {
    echo "  <url><loc>{$base}{$path}</loc><lastmod>{$now}</lastmod><changefreq>{$freq}</changefreq><priority>{$pr}</priority></url>\n";
}
echo '</urlset>';
