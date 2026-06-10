<?php
/** privacy-policy.php — exact content port of Next privacy-policy/page.tsx. */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';

$page_meta = [
    'title' => 'Privacy policy',
    'description' => 'Read the 24JobsAlerts privacy policy and how we handle information on this website.',
    'canonical' => site_url() . '/privacy-policy/',
];
$eyebrow = 'Legal';
$heading = 'Privacy policy';
$sub = 'How we handle information when you use 24JobsAlerts.';
$sections = [
    ['Information we collect', 'We may collect basic usage information (such as pages visited and approximate location derived from IP address) to improve site performance and content quality.'],
    ['Cookies', 'Cookies may be used to remember preferences and to measure traffic and engagement. You can disable cookies in your browser settings, but some features may not work as expected.'],
    ['Advertising (Google AdSense)', 'This site may display ads served by Google (including Google AdSense). Google may use cookies or similar technologies to serve and personalize ads and to measure their effectiveness.'],
    ['Third-party links', 'Job listings may include links to third-party websites (for example, official application portals). We are not responsible for the privacy practices of external sites.'],
    ['Updates', 'We may update this policy from time to time. Changes will be posted on this page.'],
];
require __DIR__ . '/templates/legal-sections.php';
