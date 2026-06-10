<?php
/**
 * bookmarks.php — Next bookmarks/page.tsx EXACT (CSR). Renders the hero shell
 * server-side, then jobs-app.js loadBookmarks() fetches each saved id with a
 * skeleton grid + "Loading saved jobs…" sub-text, exactly like Next. Robots-
 * disallowed (doc §9) + noindex.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

$page_meta = [
    'title' => 'Saved Jobs',
    'description' => 'Your saved government job notifications on 24JobsAlerts.',
    'canonical' => site_url() . '/bookmarks/',
    'robots' => 'noindex',
];
require __DIR__ . '/includes/header.php';

// empty-state HTML (also emitted by JS) — kept identical to Next
$emptyHTML = '<div class="card-base p-10 text-center max-w-xl mx-auto">'
    . '<div class="w-14 h-14 rounded-full bg-primary-light mx-auto mb-4 flex items-center justify-center">'
    . '<span class="material-symbols-rounded text-primary" style="font-size:26px;font-variation-settings:&#39;FILL&#39; 1;">bookmark</span></div>'
    . '<h2 class="text-lg font-semibold text-ink mb-2">No saved jobs yet</h2>'
    . '<p class="text-sm text-text-body mb-6 leading-relaxed">Tap the bookmark icon on any job to add it here. Your saved jobs stay in this browser — no account needed.</p>'
    . '<a href="' . eattr(url('/latest-jobs/')) . '" class="btn-primary">Browse latest jobs <span class="material-symbols-rounded" style="font-size:16px;">arrow_forward</span></a></div>';
?>
<div class="bg-canvas">
  <section class="hero-band-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <div class="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div class="min-w-0 flex-1">
          <div class="section-eyebrow" style="color:var(--color-primary);">Your shortlist</div>
          <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-2">Saved jobs</h1>
          <p class="text-on-dark-muted text-sm sm:text-base md:text-lg" data-sub>Loading saved jobs…</p>
        </div>
        <a href="<?= eattr(url('/latest-jobs/')) ?>" class="btn-primary shrink-0">Browse jobs <span class="material-symbols-rounded" style="font-size:16px;">arrow_forward</span></a>
      </div>
    </div>
  </section>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" data-bookmarks-root>
    <div data-grid></div>
  </main>
</div>

<script>
window.JA_BOOKMARKS = {
  gridSelector: "[data-grid]",
  subSelector: "[data-sub]",
  emptyHTML: <?= json_encode($emptyHTML) ?>,
};
</script>
<script src="<?= eattr(url('/assets/js/jobs-app.js')) ?>" defer></script>
<?php require __DIR__ . '/includes/footer.php'; ?>
