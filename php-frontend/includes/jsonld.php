<?php
/**
 * jsonld.php — emits <script type="application/ld+json"> blocks.
 * Site-wide Organization + WebSite (root layout equivalent) and per-job
 * JobPosting + Breadcrumb (jobs/[id]/page.tsx equivalent).
 */

declare(strict_types=1);

require_once __DIR__ . '/seo.php';

/** Serialize a JSON-LD node the same way Next does (JSON.stringify, unescaped slashes). */
function jsonld_script(array $node): string
{
    return '<script type="application/ld+json">'
        . json_encode($node, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        . '</script>';
}

/** Site-wide Org + WebSite — inject in every page <head> (root layout). */
function jsonld_site(): string
{
    return jsonld_script(build_organization_jsonld()) . "\n" . jsonld_script(build_website_jsonld());
}

/** Per-job JobPosting + Breadcrumb. */
function jsonld_job(array $job, string $slug): string
{
    return jsonld_script(build_job_posting_jsonld($job, $slug)) . "\n" . jsonld_script(build_breadcrumb_jsonld($job, $slug));
}
