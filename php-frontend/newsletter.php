<?php
/**
 * newsletter.php — newsletter page + POST handler.
 * GET  -> renders the signup page.
 * POST -> proxies to POST /api/newsletter/subscribe (idempotent, duplicate-safe
 *         via backend caught IntegrityError -> {ok:true, created:false}).
 *         AJAX (X-Requested-With) gets JSON; plain form POST re-renders page.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

$newsletter_msg = null;
$newsletter_ok = false;

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
    && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = isset($_POST['email']) ? trim((string) $_POST['email']) : '';
    $res = subscribe_newsletter($email);

    if ($isAjax) {
        header('Content-Type: application/json');
        if (($res['status'] ?? 0) === 200) {
            echo json_encode(['ok' => true, 'created' => $res['created'],
                'message' => $res['created'] ? 'Subscribed! Check your inbox.' : 'You are already subscribed.']);
        } else {
            http_response_code(($res['status'] ?? 0) === 400 ? 400 : 502);
            echo json_encode(['ok' => false, 'message' => $res['error'] ?? 'Subscription failed. Try again.']);
        }
        return;
    }

    if (($res['status'] ?? 0) === 200) {
        $newsletter_ok = true;
        $newsletter_msg = $res['created'] ? 'Subscribed! Check your inbox.' : 'You are already subscribed.';
    } else {
        $newsletter_msg = $res['error'] ?? 'Subscription failed. Please try again.';
    }
}

$page_meta = [
    'title' => 'Newsletter',
    'description' => 'Subscribe to 24JobsAlerts for the latest government job notifications by email.',
    'canonical' => site_url() . '/newsletter/',
];
require __DIR__ . '/includes/header.php';
?>
<section class="hero-band-dark"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <h1 class="text-4xl font-semibold text-on-dark">Newsletter</h1>
  <p class="text-on-dark-muted mt-2">Get the latest government job notifications delivered to your inbox.</p></div></section>
<?php require __DIR__ . '/templates/newsletter-form.php'; ?>
<?php require __DIR__ . '/includes/footer.php'; ?>
