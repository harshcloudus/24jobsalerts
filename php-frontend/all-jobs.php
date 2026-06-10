<?php
/** all-jobs.php — Next all-jobs/page.tsx (eyebrow "All opportunities", pageSize 12). */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

$listing = [
    'eyebrow' => 'All opportunities',
    'h1' => 'All job openings',
    'self_path' => '/all-jobs/',
    'page_size' => 12,
    'only_recent' => false,
    'sub_loading' => 'Searching jobs…',
    'sub_done' => 'Showing %s matches across every sector.',
    'page_meta' => [
        'title' => 'All Government Jobs in India',
        'description' => 'Browse every government job notification listed on 24JobsAlerts — central, state, banking, defence, railway, teaching and more, with eligibility and direct apply links.',
        'canonical' => site_url() . '/all-jobs/',
        'keywords' => [
            'all government jobs', 'sarkari naukri', 'central government jobs',
            'state government jobs', 'psu jobs', 'free job alert', '24JobsAlerts',
        ],
    ],
];
require __DIR__ . '/templates/listing.php';
