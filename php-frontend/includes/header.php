<?php
/**
 * header.php — opens <html>, renders <head> (meta + AdSense bootstrap + adBreak
 * config + GTM + site JSON-LD + Firebase analytics) and the sticky nav with the
 * saved-jobs badge. Replicates frontend/src/app/layout.tsx + Header.tsx.
 *
 * Expects $page_meta (array) to be set by the including page; passed to
 * render_meta(). Falls back to site defaults if absent.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/seo.php';
require_once __DIR__ . '/jsonld.php';
require_once __DIR__ . '/bookmarks.php';

$page_meta = isset($page_meta) && is_array($page_meta) ? $page_meta : [];
$savedCount = count(saved_job_ids());
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<meta name="theme-color" content="#001e2b">
<?= render_meta($page_meta) ?>

<!-- Google AdSense (doc §9 monetization; client/slot from config) -->
<script async data-ad-client="<?= eattr(ADSENSE_CLIENT) ?>" data-ad-frequency-hint="30s"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" crossorigin="anonymous"></script>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
<!-- adBreak interstitial config (navigateWithAdBreak relies on this) -->
<script>
window.adsbygoogle = window.adsbygoogle || [];
var adBreak = (adConfig = function (o) { adsbygoogle.push(o); });
adConfig({ preloadAdBreaks: "on", sound: "off" });
</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','<?= e(GTM_ID) ?>');</script>
<!-- End Google Tag Manager -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet">
<link rel="stylesheet" href="<?= eattr(url('/assets/css/tailwind.css')) ?>">

<?= jsonld_site() ?>
<!-- Firebase Analytics config (analytics only — no auth/firestore) -->
<script>
window.JA_FIREBASE_CONFIG = <?= json_encode([
    'apiKey' => FIREBASE_API_KEY,
    'authDomain' => FIREBASE_AUTH_DOMAIN,
    'projectId' => FIREBASE_PROJECT_ID,
    'storageBucket' => FIREBASE_STORAGE_BUCKET,
    'messagingSenderId' => FIREBASE_MESSAGING_SENDER_ID,
    'appId' => FIREBASE_APP_ID,
    'measurementId' => FIREBASE_MEASUREMENT_ID,
], JSON_UNESCAPED_SLASHES) ?>;
</script>
<script type="module" src="<?= eattr(url('/assets/js/firebase-analytics.js')) ?>"></script>
</head>
<body class="ja-body">
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?= e(GTM_ID) ?>"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<?php
// active-nav helper based on current request path (strip BASE_PATH + query)
$ja_path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (BASE_PATH !== '' && strpos($ja_path, BASE_PATH) === 0) {
    $ja_path = substr($ja_path, strlen(BASE_PATH)) ?: '/';
}
// SiteTopAd is hidden on /latest-jobs and /job-types (matches Next SiteTopAd).
$ja_hide_top_ad = (strpos($ja_path, '/latest-jobs') === 0) || (strpos($ja_path, '/job-types') === 0);
?>
<?php if (!$ja_hide_top_ad): ?>
<!-- Site top ad (SiteTopAd: AdSenseDisplay variant=wide, wrapper bg-canvas border-b border-hairline py-3) -->
<div class="bg-canvas border-b border-hairline py-3">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="min-h-[110px] sm:min-h-[120px] lg:min-h-[140px]">
      <ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="<?= eattr(ADSENSE_CLIENT) ?>"
           data-ad-slot="<?= eattr(ADSENSE_SLOT) ?>" data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
  </div>
</div>
<?php endif; ?>

<?php
$ja_active = static function (string $href) use ($ja_path): string {
    $match = $href === '/' ? ($ja_path === '/' || $ja_path === '/index.php') : strpos($ja_path, $href) === 0;
    return $match ? ' active' : '';
};
$ja_nav = [
    ['/', 'Home'],
    ['/latest-jobs/', 'Latest Jobs'],
    ['/all-jobs/', 'All Jobs'],
    ['/job-types/', 'Job Types'],
    ['/qualifications/', 'Qualification'],
];
?>
<nav class="sticky top-0 z-50 nav-solid transition-shadow duration-300" data-site-nav>
  <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
    <div class="flex items-center h-16 min-w-0 gap-1.5 sm:gap-3">
      <a href="<?= eattr(url('/')) ?>" class="flex items-center gap-2 shrink min-w-0">
        <img src="<?= eattr(url('/assets/images/24jobsalerts_logo.png')) ?>" alt="24JobsAlerts" class="h-7 sm:h-8 w-auto" style="max-width:140px;" width="140" height="36">
      </a>

      <div class="hidden md:flex items-center gap-0 lg:gap-1 pl-2 lg:pl-4 min-w-0">
        <?php foreach ($ja_nav as [$href, $label]): ?>
          <a href="<?= eattr(url($href)) ?>" class="nav-link-pill<?= $ja_active($href) ?>"><?= e($label) ?></a>
        <?php endforeach; ?>
      </div>

      <div class="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 ml-auto">
        <a href="<?= eattr(url('/bookmarks/')) ?>" class="header-icon-btn<?= $ja_active('/bookmarks/') ? ' border-primary/40' : '' ?>" aria-label="Saved jobs">
          <span class="material-symbols-rounded" style="font-size:20px;font-variation-settings:'FILL' 0;">bookmark</span>
          <span class="header-icon-btn-badge" data-saved-badge<?= $savedCount > 0 ? '' : ' hidden' ?>><?= $savedCount > 99 ? '99+' : (int) $savedCount ?></span>
        </a>
        <a href="<?= eattr(url('/latest-jobs/')) ?>" class="btn-primary header-cta">
          <span class="header-cta-label">Browse jobs</span>
          <span class="material-symbols-rounded header-cta-arrow" style="font-size:16px;">arrow_forward</span>
        </a>
        <button type="button" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-hairline-strong bg-canvas text-ink hover:bg-surface transition-colors shrink-0" data-nav-toggle aria-label="Toggle navigation" aria-expanded="false">
          <span class="material-symbols-rounded" style="font-size:20px;" data-nav-icon>menu</span>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div class="md:hidden overflow-hidden transition-all duration-300 ease-in-out" data-mobile-menu style="max-height:0;opacity:0;">
      <div class="pt-2 border-t border-hairline flex flex-col gap-1 pb-4">
        <?php foreach ($ja_nav as [$href, $label]):
              $act = $ja_active($href); ?>
          <a href="<?= eattr(url($href)) ?>" class="flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium transition-colors <?= $act ? 'bg-primary-light text-primary' : 'text-text-body hover:bg-surface hover:text-ink' ?>">
            <?= e($label) ?>
            <span class="material-symbols-rounded" style="font-size:16px;opacity:.6;">chevron_right</span>
          </a>
        <?php endforeach; ?>
        <a href="<?= eattr(url('/bookmarks/')) ?>" class="flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors <?= $ja_active('/bookmarks/') ? 'bg-primary-light text-primary' : 'text-text-body hover:bg-surface hover:text-ink' ?>">
          <span class="material-symbols-rounded" style="font-size:18px;font-variation-settings:'FILL' 1;">bookmark</span>
          Saved Jobs
        </a>
        <a href="<?= eattr(url('/latest-jobs/')) ?>" class="mt-3 btn-primary justify-center">
          Browse jobs <span class="material-symbols-rounded" style="font-size:16px;">arrow_forward</span>
        </a>
      </div>
    </div>
  </div>
</nav>
<main>
