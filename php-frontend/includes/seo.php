<?php
/**
 * seo.php — 1:1 port of frontend/src/lib/seo.ts (string builders) plus the
 * per-page <meta> emitter. Output matches the Next.js metadata so canonicals,
 * titles, descriptions, keywords, OG and Twitter tags are identical.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

/** siteUrl() — SITE_URL with trailing slash stripped. */
function site_url(): string
{
    return rtrim(SITE_URL, '/');
}

/** canonicalForJob(slug) */
function canonical_for_job(string $slug): string
{
    return site_url() . '/jobs/' . $slug . '/';
}

/** trimToLen — collapse whitespace, ellipsis at word boundary. */
function trim_to_len(string $s, int $max): string
{
    $clean = trim(preg_replace('/\s+/u', ' ', $s));
    if (mb_strlen($clean) <= $max) {
        return $clean;
    }
    $cut = mb_substr($clean, 0, $max - 1);
    $cut = preg_replace('/\s+\S*$/u', '', $cut);
    return $cut . '…';
}

/** parseHiringOrgName — first \b[A-Z]{3,6}\b in title, else official_site host, else brand. */
function parse_hiring_org_name(array $job): string
{
    if (!empty($job['title']) && preg_match('/\b[A-Z]{3,6}\b/', (string) $job['title'], $m)) {
        return $m[0];
    }
    if (!empty($job['official_site'])) {
        $host = parse_url((string) $job['official_site'], PHP_URL_HOST);
        if ($host) {
            return preg_replace('/^www\./', '', $host);
        }
    }
    return '24JobsAlerts';
}

/** buildMetaDescription — intro>=60 -> trim 155, else assembled sentence. */
function build_meta_description(array $job): string
{
    $intro = trim(preg_replace('/\s+/u', ' ', (string) ($job['intro_text'] ?? '')));
    if (mb_strlen($intro) >= 60) {
        return trim_to_len($intro, 155);
    }
    $parts = [];
    $parts[] = 'Apply online for ' . ($job['title'] ?? '') . '.';
    if (!empty($job['last_date'])) {
        $parts[] = 'Last date ' . $job['last_date'] . '.';
    }
    if (!empty($job['qualification'])) {
        $parts[] = 'Eligibility: ' . $job['qualification'] . '.';
    }
    $parts[] = 'Latest government job notification on 24JobsAlerts.';
    return trim_to_len(implode(' ', $parts), 155);
}

/** buildKeywords — dedup, max 12. Mirrors literal "recruitment 2026"/"2026". */
function build_keywords(array $job): array
{
    $org = strtolower(parse_hiring_org_name($job));
    $raw = array_filter([
        isset($job['title']) ? strtolower((string) $job['title']) : null,
        isset($job['qualification']) ? strtolower((string) $job['qualification']) : null,
        isset($job['job_type']) ? strtolower((string) $job['job_type']) : null,
        isset($job['category']) ? strtolower((string) $job['category']) : null,
        $org,
        "$org recruitment 2026",
        'sarkari naukri',
        'government job 2026',
        'free job alert',
        'latest jobs 2026',
        '24JobsAlerts',
    ], static fn($v) => is_string($v) && $v !== '');
    return array_slice(array_values(array_unique($raw)), 0, 12);
}

// ---- JSON-LD builders (see jsonld.php for emission) ---------------------

const SEO_MONTH_MAP = [
    'january' => '01', 'february' => '02', 'march' => '03', 'april' => '04',
    'may' => '05', 'june' => '06', 'july' => '07', 'august' => '08',
    'september' => '09', 'october' => '10', 'november' => '11', 'december' => '12',
];

function seo_parse_date_text(?string $text): ?string
{
    if (!$text) {
        return null;
    }
    if (preg_match('/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/', $text, $m)) {
        $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $month = SEO_MONTH_MAP[strtolower($m[2])] ?? null;
        if ($month) {
            return "{$m[3]}-{$month}-{$day}";
        }
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $text)) {
        return $text;
    }
    return null;
}

function seo_parse_salary_text(?string $salary): ?array
{
    if (!$salary) {
        return null;
    }
    $nums = [];
    if (preg_match_all('/[\d,]+/', $salary, $mm)) {
        foreach ($mm[0] as $n) {
            $v = (int) str_replace(',', '', $n);
            if ($v >= 1000) {
                $nums[] = $v;
            }
        }
    }
    if (!$nums) {
        return null;
    }
    $unitText = preg_match('/month|monthly|p\.?m\b/i', $salary) ? 'MONTH' : 'YEAR';
    $value = ['@type' => 'QuantitativeValue', 'unitText' => $unitText];
    if (count($nums) >= 2) {
        $value['minValue'] = min($nums);
        $value['maxValue'] = max($nums);
    } else {
        $value['value'] = $nums[0];
    }
    return ['@type' => 'MonetaryAmount', 'currency' => 'INR', 'value' => $value];
}

function seo_map_employment_type(?string $t): string
{
    $s = strtolower((string) $t);
    if (str_contains($s, 'intern')) {
        return 'INTERN';
    }
    if (str_contains($s, 'contract')) {
        return 'CONTRACTOR';
    }
    if (str_contains($s, 'part')) {
        return 'PART_TIME';
    }
    if (str_contains($s, 'temp')) {
        return 'TEMPORARY';
    }
    return 'FULL_TIME';
}

function seo_intro_to_html(string $intro): string
{
    $safe = str_replace(['&', '<', '>'], ['&amp;', '&lt;', '&gt;'], $intro);
    $paragraphs = preg_split('/\n\n+/', $safe);
    $html = '';
    foreach ($paragraphs as $p) {
        $html .= '<p>' . str_replace("\n", '<br>', $p) . '</p>';
    }
    return $html;
}

/** buildJobPostingJsonLd — exact structural port (Surat/Gujarat hardcoded). */
function build_job_posting_jsonld(array $job, string $slug): array
{
    $datePosted = $job['posted_date'] ?? gmdate('Y-m-d');
    $intro = trim((string) ($job['intro_text'] ?? ''));
    $descHtml = $intro !== '' ? seo_intro_to_html($intro) : '<p>' . ($job['title'] ?? '') . '. Apply on the official website.</p>';
    $org = parse_hiring_org_name($job);

    $node = [
        '@context' => 'https://schema.org/',
        '@type' => 'JobPosting',
        'title' => $job['title'] ?? '',
        'description' => $descHtml,
        'datePosted' => $datePosted,
        'employmentType' => seo_map_employment_type($job['job_type'] ?? null),
        'hiringOrganization' => [
            '@type' => 'Organization',
            'name' => $org,
            'sameAs' => $job['official_site'] ?? site_url(),
        ],
        'jobLocation' => [
            '@type' => 'Place',
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => 'Surat',
                'streetAddress' => '24JobsAlerts, Surat',
                'addressRegion' => 'Gujarat',
                'postalCode' => '395101',
                'addressCountry' => 'IN',
            ],
        ],
        'applicantLocationRequirements' => ['@type' => 'Country', 'name' => 'India'],
        'url' => canonical_for_job($slug),
        'identifier' => [
            '@type' => 'PropertyValue',
            'name' => $org,
            'value' => (string) ($job['id'] ?? ''),
        ],
        'occupationalCategory' => $job['category'] ?? 'Government Job',
        'directApply' => false,
    ];

    if (!empty($job['qualification'])) {
        $node['qualifications'] = $job['qualification'];
    }

    $validThrough = seo_parse_date_text($job['last_date'] ?? $job['last_date_text'] ?? null);
    $node['validThrough'] = $validThrough ?: gmdate('Y-m-d', time() + 30 * 24 * 60 * 60);

    $baseSalary = seo_parse_salary_text($job['salary'] ?? null);
    $node['baseSalary'] = $baseSalary ?: ['@type' => 'MonetaryAmount', 'currency' => 'INR', 'value' => 'Not disclosed'];

    return $node;
}

/** buildBreadcrumbJsonLd — exact port. */
function build_breadcrumb_jsonld(array $job, string $slug): array
{
    $base = site_url();
    return [
        '@context' => 'https://schema.org/',
        '@type' => 'BreadcrumbList',
        'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => "$base/"],
            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Jobs', 'item' => "$base/latest-jobs"],
            ['@type' => 'ListItem', 'position' => 3, 'name' => $job['title'] ?? '', 'item' => "$base/jobs/$slug"],
        ],
    ];
}

/** buildOrganizationJsonLd — exact port. */
function build_organization_jsonld(): array
{
    $base = site_url();
    return [
        '@context' => 'https://schema.org/',
        '@type' => 'Organization',
        'name' => '24JobsAlerts',
        'url' => $base,
        'logo' => "$base/24jobsalerts_logo.png",
        'sameAs' => [$base],
        'description' => '24JobsAlerts publishes the latest Indian government job notifications with eligibility, last date, and direct apply links.',
    ];
}

/** buildWebSiteJsonLd — exact port (SearchAction -> /all-jobs?search=). */
function build_website_jsonld(): array
{
    $base = site_url();
    return [
        '@context' => 'https://schema.org/',
        '@type' => 'WebSite',
        'name' => '24JobsAlerts',
        'url' => $base,
        'potentialAction' => [
            '@type' => 'SearchAction',
            'target' => "$base/all-jobs?search={search_term_string}",
            'query-input' => 'required name=search_term_string',
        ],
    ];
}

/**
 * Render <head> meta tags. $opts keys:
 *   title, description, canonical, keywords[], robots ('index'|'noindex'),
 *   og_type, og_image, article_section. Defaults mirror the Next root
 *   layout.tsx metadata.
 */
function render_meta(array $opts = []): string
{
    $base = site_url();
    $defaultTitle = '24JobsAlerts — Latest Government Jobs & Sarkari Naukri 2026';
    $title = $opts['title'] ?? $defaultTitle;
    // Next applies template "%s | 24JobsAlerts" to page titles (not the default).
    if (!empty($opts['title']) && empty($opts['title_is_default'])) {
        $fullTitle = $opts['title'] . ' | 24JobsAlerts';
    } else {
        $fullTitle = $defaultTitle;
    }
    $desc = $opts['description'] ?? '24JobsAlerts brings the latest government job notifications in India — SSC, UPSC, Railway, Banking, Police, Defence and PSU — with eligibility, last date and direct apply links updated daily.';
    $canonical = $opts['canonical'] ?? ($base . '/');
    $robots = $opts['robots'] ?? 'index,follow';
    $ogType = $opts['og_type'] ?? 'website';
    $ogImage = $opts['og_image'] ?? ($base . '/og-default.png');
    $keywords = $opts['keywords'] ?? [
        'sarkari naukri', 'government jobs', 'free job alert', 'latest jobs 2026',
        'ssc', 'upsc', 'railway recruitment', 'bank jobs', 'rojgar samachar', '24JobsAlerts',
    ];

    $robotsContent = $robots === 'noindex'
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    $h = '';
    $h .= '<title>' . e($fullTitle) . "</title>\n";
    $h .= '<meta name="description" content="' . eattr($desc) . "\">\n";
    $h .= '<meta name="keywords" content="' . eattr(implode(', ', $keywords)) . "\">\n";
    $h .= '<meta name="robots" content="' . eattr($robotsContent) . "\">\n";
    $h .= '<meta name="application-name" content="24JobsAlerts">' . "\n";
    $h .= '<meta name="author" content="24JobsAlerts">' . "\n";
    $h .= '<link rel="canonical" href="' . eattr($canonical) . "\">\n";
    $h .= '<link rel="icon" type="image/png" href="' . eattr("$base/24jobsalerts_favicon.png") . "\">\n";
    $h .= '<link rel="apple-touch-icon" href="' . eattr("$base/24jobsalerts_favicon.png") . "\">\n";
    // OpenGraph
    $h .= '<meta property="og:type" content="' . eattr($ogType) . "\">\n";
    $h .= '<meta property="og:locale" content="en_IN">' . "\n";
    $h .= '<meta property="og:site_name" content="24JobsAlerts">' . "\n";
    $h .= '<meta property="og:title" content="' . eattr($fullTitle) . "\">\n";
    $h .= '<meta property="og:description" content="' . eattr($desc) . "\">\n";
    $h .= '<meta property="og:url" content="' . eattr($canonical) . "\">\n";
    $h .= '<meta property="og:image" content="' . eattr($ogImage) . "\">\n";
    $h .= '<meta property="og:image:width" content="1200">' . "\n";
    $h .= '<meta property="og:image:height" content="630">' . "\n";
    $h .= '<meta property="og:image:alt" content="24JobsAlerts">' . "\n";
    // Twitter
    $h .= '<meta name="twitter:card" content="summary_large_image">' . "\n";
    $h .= '<meta name="twitter:title" content="' . eattr($fullTitle) . "\">\n";
    $h .= '<meta name="twitter:description" content="' . eattr($desc) . "\">\n";
    $h .= '<meta name="twitter:image" content="' . eattr($ogImage) . "\">\n";
    // article:section — only on per-job pages (Next layout.tsx other tag).
    if (!empty($opts['article_section'])) {
        $h .= '<meta property="article:section" content="' . eattr($opts['article_section']) . "\">\n";
    }
    return $h;
}
