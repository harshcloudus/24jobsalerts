<?php
/** latest-jobs.php — Next latest-jobs/page.tsx (eyebrow "Latest first", pageSize 9, only_recent). */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

$listing = [
    'eyebrow' => 'Latest first',
    'h1' => 'Latest job openings',
    'self_path' => '/latest-jobs/',
    'page_size' => 9,
    'only_recent' => true,
    'sub_loading' => 'Searching latest jobs…',
    'sub_done' => 'Showing %s fresh openings updated daily.',
    'page_meta' => [
        'title' => 'Latest Government Jobs 2026',
        'description' => 'Latest government job notifications updated daily — SSC, UPSC, Railway, Banking, Police, Defence and PSU recruitment with eligibility, last date and direct apply links.',
        'canonical' => site_url() . '/latest-jobs/',
        'keywords' => [
            'latest government jobs 2026', 'sarkari naukri', 'free job alert',
            'ssc', 'upsc', 'railway jobs', 'bank jobs', 'police recruitment', '24JobsAlerts',
        ],
    ],
];
require __DIR__ . '/templates/listing.php';
