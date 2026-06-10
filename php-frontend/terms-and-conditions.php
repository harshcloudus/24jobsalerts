<?php
/** terms-and-conditions.php — exact content port of Next terms page. */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

$page_meta = [
    'title' => 'Terms & conditions',
    'description' => 'Read the terms and conditions for using 24JobsAlerts.',
    'canonical' => site_url() . '/terms-and-conditions/',
];
$eyebrow = 'Legal';
$heading = 'Terms & conditions';
$sub = 'By using 24JobsAlerts, you agree to the terms below.';
$sections = [
    ['Content information', 'We try to keep job information accurate and up to date, but we do not guarantee completeness or correctness. Always verify details on the official website / application portal.'],
    ['External links', 'Our site may link to third-party websites. We are not responsible for their content, availability, or policies.'],
    ['Changes', 'We may update these terms at any time by posting changes on this page.'],
];
require __DIR__ . '/templates/legal-sections.php';
