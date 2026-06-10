<?php
/**
 * listing.php — shared shell for all-jobs + latest-jobs. Renders the dark hero
 * (eyebrow/h1/sub + search-pill-large) and category pill-tabs server-side, then
 * mounts jobs-app.js to fetch + render the grid/pagination CLIENT-SIDE with
 * loading skeletons — matching the Next CSR pages exactly.
 *
 * $listing: eyebrow, h1, self_path, page_size, only_recent(bool),
 *   sub_loading, sub_done(fn-ish via sprintf string), page_meta.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/helpers.php';

$search = isset($_GET['search']) ? trim((string) $_GET['search']) : '';
$category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';

// categories for pill-tabs (server fetch — small, cached)
$filters = get_filters(SITEMAP_CACHE_TTL);
$categories = $filters['categories'] ?? [];

$catLabel = static function (string $c): string {
    $l = strtolower($c);
    if ($l === 'structured_job') return 'Job';
    if ($l === 'article') return 'Article';
    return $c ?: 'All';
};
$mkUrl = static function (?string $cat) use ($listing, $search) {
    $q = array_filter(['search' => $search ?: null, 'category' => $cat ?: null], static fn($v) => $v !== null && $v !== '');
    $qs = $q ? '?' . http_build_query($q) : '';
    return url($listing['self_path']) . $qs;
};

$page_meta = $listing['page_meta'] ?? [];
require __DIR__ . '/../includes/header.php';
?>
<div class="bg-canvas">
  <section class="hero-band-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
      <div class="max-w-3xl">
        <div class="section-eyebrow" style="color:var(--color-primary);"><?= e($listing['eyebrow']) ?></div>
        <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3"><?= e($listing['h1']) ?></h1>
        <p class="text-sm sm:text-base md:text-lg text-on-dark-muted" data-sub><?= e($listing['sub_loading']) ?></p>
      </div>

      <div class="mt-6 sm:mt-8 max-w-3xl">
        <form class="search-pill-large flex items-center gap-1.5 sm:gap-2 pl-3 sm:pl-5 pr-1.5 sm:pr-2" method="get" action="<?= eattr(url($listing['self_path'])) ?>">
          <span class="material-symbols-rounded text-text-muted shrink-0" style="font-size:20px;">search</span>
          <input name="search" value="<?= eattr($search) ?>" class="flex-1 min-w-0 bg-transparent outline-none text-ink placeholder:text-text-muted text-sm sm:text-base h-full" placeholder="Search jobs…" aria-label="Search jobs" type="text">
          <?php if ($category !== ''): ?><input type="hidden" name="category" value="<?= eattr($category) ?>"><?php endif; ?>
          <button type="submit" class="btn-primary px-3 sm:px-5 shrink-0 h-11 sm:h-12" aria-label="Find jobs">
            <span class="hidden sm:inline">Find jobs</span>
            <span class="material-symbols-rounded" style="font-size:18px;">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  </section>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <?php if (!empty($categories)): ?>
      <div class="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
        <span class="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mr-1 sm:mr-2">Filter:</span>
        <a href="<?= eattr($mkUrl(null)) ?>" class="<?= $category === '' ? 'pill-tab pill-tab-active' : 'pill-tab' ?>">All</a>
        <?php foreach ($categories as $c): ?>
          <a href="<?= eattr($mkUrl($c)) ?>" class="<?= $category === $c ? 'pill-tab pill-tab-active' : 'pill-tab' ?>"><?= e($catLabel($c)) ?></a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <div class="job-grid" data-grid></div>
    <div data-pager></div>
  </main>
</div>

<script>
window.JA_LISTING = {
  gridSelector: "[data-grid]",
  pagerSelector: "[data-pager]",
  subSelector: "[data-sub]",
  pageSize: <?= (int) $listing['page_size'] ?>,
  showBookmark: true,
  smoothScroll: true,
  subLoading: <?= json_encode($listing['sub_loading']) ?>,
  params: <?= json_encode(array_filter([
      'search' => $search ?: null,
      'category' => $category ?: null,
      'only_recent' => !empty($listing['only_recent']) ? 'true' : null,
  ], static fn($v) => $v !== null && $v !== '')) ?>,
  subDoneTpl: <?= json_encode($listing['sub_done']) ?>,
  emptyTitle: "No jobs found",
  emptySub: "Try a different keyword or clear the filter.",
};
window.JA_LISTING.subDone = function (total) {
  return window.JA_LISTING.subDoneTpl.replace("%s", total.toLocaleString());
};
</script>
<script src="<?= eattr(url('/assets/js/jobs-app.js')) ?>" defer></script>
<?php require __DIR__ . '/../includes/footer.php'; ?>
