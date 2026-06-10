<?php
/**
 * helpers.php — pure utility functions ported 1:1 from the Next.js frontend.
 * Slug, id-extraction, linkify and table-cell rendering all mirror the exact
 * TypeScript logic so PHP-rendered URLs and detail pages match the Next ones
 * (doc §13 "slug coupling" — these MUST agree or canonicals/sitemap mismatch).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/** HTML escape. */
function e($s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Attribute-safe escape for href/src. */
function eattr($s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES, 'UTF-8');
}

/** Prefix BASE_PATH for internal links (mirrors HardLink/Header behaviour). */
function url(string $path): string
{
    if ($path === '' || $path[0] !== '/') {
        $path = '/' . $path;
    }
    return BASE_PATH . $path;
}

/**
 * slugify — EXACT port of post-sitemap route.ts slugify():
 *   lower -> [^a-z0-9]+ => "-" -> trim leading/trailing "-" -> slice(0,80)
 *   -> "{slug}-{id}", empty slug => "{id}".
 */
function slugify_job(string $title, int $id): string
{
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = preg_replace('/^-|-$/', '', $slug);
    $slug = substr($slug, 0, 80);
    return $slug !== '' && $slug !== null ? "$slug-$id" : (string) $id;
}

/** Build the canonical detail path "/jobs/{slug}-{id}/" (trailingSlash:true). */
function job_path(array $job): string
{
    $slug = slugify_job((string) ($job['title'] ?? ''), (int) ($job['id'] ?? 0));
    return url('/jobs/' . $slug . '/');
}

/**
 * parse_job_id_from_slug — EXACT port: id = trailing "-{number}" segment.
 * Returns null if the last segment is not numeric (NaN -> notFound).
 */
function parse_job_id_from_slug(string $slug): ?int
{
    $slug = rtrim($slug, '/');
    $parts = explode('-', $slug);
    $last = end($parts);
    if ($last === false || $last === '' || !preg_match('/^\d+$/', $last)) {
        return null;
    }
    return (int) $last;
}

// ---- text rendering (ported from jobs/[id]/page.tsx) --------------------

/** normalizeText: collapse NBSP + whitespace. */
function normalize_text(string $s): string
{
    $s = str_replace("\xC2\xA0", ' ', $s);   // non-breaking space
    $s = preg_replace('/\s+/u', ' ', $s);
    return trim($s);
}

function is_url(string $s): bool
{
    return (bool) preg_match('#^https?://\S+$#i', $s);
}
function is_domain(string $s): bool
{
    return (bool) preg_match('#^(?:https?://)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?:/[\w\-./?&=\#%]*)?$#i', $s);
}
function is_email(string $s): bool
{
    return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $s);
}

function to_absolute_url(string $raw): string
{
    if (preg_match('#^https?://#i', $raw)) {
        return $raw;
    }
    if (preg_match('/^mailto:|^tel:/i', $raw)) {
        return $raw;
    }
    return 'https://' . preg_replace('/^www\./i', '', $raw);
}

function truncate_for_display(string $u, int $max = 50): string
{
    return mb_strlen($u) <= $max ? $u : mb_substr($u, 0, $max - 1) . '…';
}

/** CTA phrases that become links when a fallback url is present. */
function is_cta(string $s): bool
{
    return (bool) preg_match('/^(apply now|click here|apply online|apply offline|register now|register here|apply here|download(?:\s+(?:notification|pdf|form|the notification|notification pdf))?|notification|view notification|official notification|application form|download form|view details|check here|get details|here|view here|read more|details here|click to apply|apply|link|view link)$/i', $s);
}

/**
 * linkify_text — port of linkifyText(): turns bare http(s) URLs in free text
 * into anchors, preserving trailing punctuation. Returns HTML-safe string.
 */
function linkify_text(?string $text): string
{
    if ($text === null || $text === '') {
        return '';
    }
    $out = '';
    $offset = 0;
    if (preg_match_all('#(https?://[^\s<>"\')]+)#i', $text, $m, PREG_OFFSET_CAPTURE)) {
        foreach ($m[0] as $hit) {
            $matchStr = $hit[0];
            $idx = $hit[1];
            $out .= e(substr($text, $offset, $idx - $offset));
            $url = $matchStr;
            $tail = '';
            if (preg_match('/[.,;:!?]+$/', $url, $pm)) {
                $tail = $pm[0];
                $url = substr($url, 0, strlen($url) - strlen($tail));
            }
            $out .= '<a href="' . eattr($url) . '" target="_blank" rel="noopener noreferrer" class="ja-link" title="' . eattr($url) . '">'
                . e(truncate_for_display($url)) . '</a>' . e($tail);
            $offset = $idx + strlen($matchStr);
        }
    }
    $out .= e(substr($text, $offset));
    return $out;
}

/** isImportantLinksTable */
function is_important_links_table(?string $heading): bool
{
    return $heading !== null && (bool) preg_match('/important\s*links?/i', $heading);
}

/**
 * render_cell — port of renderCellContent(). Handles {text,href} objects and
 * plain strings; links urls/domains/emails/CTA. $forceLink mirrors the
 * "Important Links" column behaviour.
 */
function render_cell($cell, ?string $fallbackUrl = null, bool $forceLink = false): string
{
    // forward-compatible {text, href} object (decoded as assoc array)
    if (is_array($cell) && array_key_exists('text', $cell)) {
        $text = normalize_text((string) ($cell['text'] ?? ''));
        $href = isset($cell['href']) && is_string($cell['href']) ? trim($cell['href']) : '';
        if ($text !== '' && $href !== '' && $forceLink) {
            return '<a href="' . eattr(to_absolute_url($href)) . '" target="_blank" rel="noopener noreferrer" class="ja-link">' . e($text) . '</a>';
        }
        return render_cell($text, $fallbackUrl, $forceLink);
    }

    if (!is_string($cell)) {
        return $cell === null ? '' : e((string) $cell);
    }

    $trimmed = normalize_text($cell);
    if ($trimmed === '') {
        return e($cell);
    }
    if (is_url($trimmed)) {
        return '<a href="' . eattr($trimmed) . '" target="_blank" rel="noopener noreferrer" class="ja-link">' . e($trimmed) . '</a>';
    }
    if (is_domain($trimmed)) {
        return '<a href="' . eattr(to_absolute_url($trimmed)) . '" target="_blank" rel="noopener noreferrer" class="ja-link">' . e($trimmed) . '</a>';
    }
    if (is_email($trimmed)) {
        return '<a href="mailto:' . eattr($trimmed) . '" class="ja-link">' . e($trimmed) . '</a>';
    }
    if ($fallbackUrl && (is_cta($trimmed) || $forceLink)) {
        return '<a href="' . eattr($fallbackUrl) . '" target="_blank" rel="noopener noreferrer" class="ja-link">' . e($trimmed) . '</a>';
    }
    return e($cell);
}

// ---- qualification / job-type slug mapping ------------------------------
// QUALIFICATION_BUCKETS keys mirror backend crud/jobs.py:129. Slug pages must
// resolve a slug back to the exact bucket KEY the API expects (doc §13 coupling).

function qualification_buckets(): array
{
    // keys only — the API matches fragments internally; PHP just sends the key.
    return [
        '7th Pass',
        '8th Pass',
        '10th Pass',
        '12th Pass',
        'Undergraduate',
        'Postgraduate & Research',
        'Professional',
    ];
}

/**
 * slugify a label for /qualifications/{slug}/ and /job-types/{slug}/.
 * EXACT port of page.tsx slugify(): lower -> trim -> [^a-z0-9]+ => "-" ->
 * strip leading/trailing "-". (No "&"->"and" — "&" is dropped, so
 * "Postgraduate & Research" -> "postgraduate-research".)
 */
function slugify_label(string $label): string
{
    $s = strtolower(trim($label));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return preg_replace('/^-|-$/', '', $s);
}

/** Resolve a qualification slug back to the exact bucket key, or null. */
function qualification_from_slug(string $slug): ?string
{
    foreach (qualification_buckets() as $key) {
        if (slugify_label($key) === $slug) {
            return $key;
        }
    }
    return null;
}

/** Resolve a job-type slug back to a raw job_type value from /api/filters. */
function job_type_from_slug(string $slug, array $jobTypes): ?string
{
    foreach ($jobTypes as $jt) {
        if (slugify_label($jt) === $slug) {
            return $jt;
        }
    }
    return null;
}

/** Job-type Material Symbol icon — port of page.tsx getJobTypeIcon(). */
function job_type_icon(string $type): string
{
    $t = strtolower($type);
    if (str_contains($t, 'police')) return 'local_police';
    if (str_contains($t, 'health')) return 'health_and_safety';
    if (str_contains($t, 'railway')) return 'train';
    if (str_contains($t, 'municipal') || str_contains($t, 'corporation')) return 'location_city';
    if (str_contains($t, 'post office') || str_contains($t, 'postal')) return 'mail';
    if (str_contains($t, 'airline')) return 'flight';
    if (str_contains($t, 'psc') || str_contains($t, 'public service')) return 'account_balance';
    if (str_contains($t, 'bank')) return 'account_balance_wallet';
    if (str_contains($t, 'forest')) return 'park';
    if (str_contains($t, 'private')) return 'work';
    return 'work';
}

/** Richer job-type tile icon — port of lib/jobTypeIcons.ts getJobTypeIcon. */
function job_type_tile_icon(string $type): string
{
    $t = strtolower($type);
    if (str_contains($t, 'government job') && !str_contains($t, 'airline') && !str_contains($t, 'bank')
        && !str_contains($t, 'forest') && !str_contains($t, 'health') && !str_contains($t, 'court')
        && !str_contains($t, 'municipal') && !str_contains($t, 'post') && !str_contains($t, 'psc')
        && !str_contains($t, 'police') && !str_contains($t, 'railway')) {
        return 'account_balance';
    }
    if (str_contains($t, 'private')) return 'business_center';
    if (str_contains($t, 'airline') || str_contains($t, 'aviation')) return 'flight';
    if (str_contains($t, 'bank')) return 'account_balance_wallet';
    if (str_contains($t, 'forest')) return 'park';
    if (str_contains($t, 'health')) return 'health_and_safety';
    if (str_contains($t, 'high court') || str_contains($t, 'court')) return 'gavel';
    if (str_contains($t, 'municipal') || str_contains($t, 'corporation')) return 'location_city';
    if (str_contains($t, 'police')) return 'local_police';
    if (str_contains($t, 'post office') || str_contains($t, 'postal')) return 'mail';
    if (str_contains($t, 'psc') || str_contains($t, 'public service')) return 'how_to_reg';
    if (str_contains($t, 'railway') || str_contains($t, 'rail')) return 'train';
    if (str_contains($t, 'defence') || str_contains($t, 'army') || str_contains($t, 'military')) return 'military_tech';
    if (str_contains($t, 'teaching') || str_contains($t, 'education') || str_contains($t, 'school')) return 'school';
    if (str_contains($t, 'engineer') || str_contains($t, 'technical')) return 'engineering';
    if (str_contains($t, 'it') || str_contains($t, 'software') || str_contains($t, 'tech')) return 'computer';
    if (str_contains($t, 'science') || str_contains($t, 'research')) return 'science';
    $fallbacks = ['work', 'badge', 'verified_user', 'star', 'groups'];
    $hash = 0;
    foreach (str_split($t) as $ch) {
        $hash += ord($ch);
    }
    return $fallbacks[$hash % count($fallbacks)];
}

/** sortJobTypes — port of lib/jobTypeIcons.ts JOB_TYPE_ORDER. */
function sort_job_types(array $types): array
{
    $order = [
        'government job' => 0, 'private job' => 1, 'government railway job' => 2,
        'government bank job' => 3, 'government police job' => 4, 'government post office job' => 5,
        'government airline job' => 6, 'government forest job' => 7, 'government health job' => 8,
        'government high court job' => 9, 'government municipal job' => 10, 'government psc job' => 11,
        'other' => 99,
    ];
    usort($types, static function ($a, $b) use ($order) {
        $an = strtolower(trim($a));
        $bn = strtolower(trim($b));
        $as = $order[$an] ?? 50;
        $bs = $order[$bn] ?? 50;
        return $as !== $bs ? $as - $bs : strcmp($a, $b);
    });
    return $types;
}

/** "Browse by sector" combo label — port of makeComboLabel. */
function combo_label(string $qual, string $type): string
{
    $simplified = preg_replace('/\s+job$/i', '', $type);
    $simplified = preg_replace('/^government\s+/i', '', $simplified);
    $simplified = trim($simplified);
    return "$qual $simplified Jobs";
}

/** Qualification Material Symbol icon — port of lib/qualificationIcons.ts. */
function qualification_icon(string $qual): string
{
    $key = strtolower(trim($qual));
    $map = [
        '7th pass' => 'workspace_premium',
        '8th pass' => 'workspace_premium',
        '10th pass' => 'menu_book',
        '12th pass' => 'auto_stories',
        'undergraduate' => 'workspace_premium',
        'postgraduate & research' => 'school',
        'professional' => 'workspace_premium',
    ];
    if (isset($map[$key])) {
        return $map[$key];
    }
    if (str_contains($key, '10th') || str_contains($key, 'matriculation') || str_contains($key, 'madhyamik')) return 'menu_book';
    if (str_contains($key, '12th') || str_contains($key, 'intermediate') || str_contains($key, '10+2') || str_contains($key, 'higher secondary')) return 'auto_stories';
    if (str_contains($key, 'post') || str_contains($key, ' pg') || str_contains($key, 'pg ') || str_contains($key, 'master') || str_contains($key, 'ph.d') || str_contains($key, 'phd') || str_contains($key, 'm.sc') || str_contains($key, 'msc')) return 'school';
    if (str_contains($key, 'b.e') || str_contains($key, 'b.tech') || str_contains($key, 'engineering')) return 'memory';
    if (str_contains($key, 'mbbs') || str_contains($key, 'medical') || str_contains($key, 'health')) return 'health_and_safety';
    if (str_contains($key, 'iti') || str_contains($key, 'vocational')) return 'construction';
    if (str_contains($key, 'diploma')) return 'badge';
    if (str_contains($key, '7th') || str_contains($key, '8th')) return 'workspace_premium';
    return 'workspace_premium';
}

/**
 * AdSense unit — mirrors Next AdSenseDisplay component. $variant: 'wide' |
 * 'inline'. Outer wrapper + min-height reserve box + full-width <ins>, matching
 * the Next markup so ad slots reserve the same vertical space.
 * $wrapperClass appended to the outer div (e.g. bg-canvas border-t...).
 */
function ja_ad(string $variant = 'wide', string $wrapperClass = ''): string
{
    $client = eattr(ADSENSE_CLIENT);
    $slot = eattr(ADSENSE_SLOT);
    $reserve = 'min-h-[110px] sm:min-h-[120px] lg:min-h-[140px]';
    $ins = '<div class="' . $reserve . '">'
        . '<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="' . $client . '" data-ad-slot="' . $slot . '" data-ad-format="auto" data-full-width-responsive="true"></ins>'
        . '<script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>';

    // Next AdSenseDisplay: full-width OUTER wrapper (bg/border/py) wraps an
    // INNER constrained max-w-7xl container, so bg/border span the viewport.
    $inner = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' . $ins . '</div>';
    if ($wrapperClass !== '') {
        return '<div class="' . $wrapperClass . ' py-6">' . $inner . '</div>';
    }
    // wide on homepage: AdSenseDisplay className="py-6" — outer py-6 only.
    return '<div class="py-6">' . $inner . '</div>';
}

/** Relative posted date — port of JobCard.tsx getRelativeDate(). */
function relative_date(string $dateStr): string
{
    if ($dateStr === '') {
        return '';
    }
    $ts = strtotime($dateStr);
    if ($ts === false) {
        return $dateStr;
    }
    $diff = (int) floor((time() - $ts) / 86400);
    if ($diff < 0) {
        return '';
    }
    if ($diff === 0) {
        return 'Today';
    }
    if ($diff === 1) {
        return 'Yesterday';
    }
    if ($diff < 7) {
        return $diff . 'd ago';
    }
    if ($diff < 30) {
        return (int) floor($diff / 7) . 'w ago';
    }
    return $dateStr;
}

/** Clamp page param (>=1). */
function clamp_page($v): int
{
    $n = (int) $v;
    return $n >= 1 ? $n : 1;
}

/** Clamp page_size to documented 1..100 (default 20). */
function clamp_page_size($v, int $default = 20): int
{
    $n = (int) $v;
    if ($n < 1) {
        return $default;
    }
    return min($n, 100);
}
