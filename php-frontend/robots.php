<?php
/**
 * robots.php — /robots.txt (Next robots.ts).
 * Allow /, disallow /api/ and /bookmarks/, point at sitemap index.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

header('Content-Type: text/plain; charset=utf-8');
$base = site_url();
echo "User-agent: *\n";
echo "Allow: /\n";
echo "Disallow: /api/\n";
echo "Disallow: /bookmarks/\n";
echo "\nSitemap: {$base}/sitemap.xml\n";
