<?php
/**
 * search.php — Next search/page.tsx EXACT. hero-home dual-field search, badge +
 * heading change with query, qualification tiles, results section (only when a
 * query is present). noindex,nofollow (doc §9). pageSize=9.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

$searchQuery = isset($_GET['search']) ? trim((string) $_GET['search']) : '';
$qualQuery = isset($_GET['qualification']) ? trim((string) $_GET['qualification']) : '';
$currentPage = clamp_page($_GET['page'] ?? 1);
$hasQuery = $searchQuery !== '' || $qualQuery !== '';
$displayLabel = implode(' + ', array_filter([$searchQuery, $qualQuery]));

$filters = get_filters(SITEMAP_CACHE_TTL);
$quals = $filters['qualifications'] ?? [];

$pageSize = 9;
$jobs = [];
$total = 0;
$totalPages = 1;
if ($hasQuery) {
    $res = get_jobs([
        'page' => $currentPage, 'page_size' => $pageSize,
        'search' => $searchQuery ?: null, 'qualification' => $qualQuery ?: null,
    ], SITEMAP_CACHE_TTL);
    $jobs = $res['items'] ?? [];
    $total = (int) ($res['total'] ?? 0);
    $totalPages = max(1, (int) ceil($total / $pageSize));
}

$mkPage = static function (int $p) use ($searchQuery, $qualQuery) {
    $q = array_filter(['search' => $searchQuery ?: null, 'qualification' => $qualQuery ?: null, 'page' => $p], static fn($v) => $v !== null && $v !== '');
    return url('/search.php') . '?' . http_build_query($q);
};

$page_meta = [
    'title' => 'Search Jobs',
    'description' => 'Search the latest government job notifications on 24JobsAlerts.',
    'canonical' => site_url() . '/search/',
    'robots' => 'noindex',
];
require __DIR__ . '/includes/header.php';
?>
<div class="bg-canvas">
  <section class="hero-home">
    <div class="hero-bg"></div>
    <div class="hero-grid-overlay"></div>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-center">
      <div class="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] text-on-dark mb-4 sm:mb-5 max-w-full">
        <span class="hero-badge-dot"></span>
        <?php if ($hasQuery): ?>
          <span>Search results</span><span class="text-on-dark-muted">·</span>
          <span class="hero-badge-chip truncate max-w-[18ch]">&ldquo;<?= e($displayLabel) ?>&rdquo;</span>
        <?php else: ?>
          <span>Search jobs</span>
        <?php endif; ?>
      </div>

      <h1 class="hero-heading">
        <?php if ($hasQuery): ?>
          Results for <span class="text-primary italic font-medium">&ldquo;<?= e($displayLabel) ?>&rdquo;</span>
        <?php else: ?>
          Find your <span class="text-primary italic font-medium">perfect job.</span>
        <?php endif; ?>
      </h1>

      <p class="text-[14px] sm:text-[17px] text-on-dark-muted leading-[1.55] max-w-[60ch] mx-auto mb-6 sm:mb-7 px-1 sm:px-2">
        <?php if ($hasQuery): ?>
          <?= e(number_format($total)) ?> result<?= $total === 1 ? '' : 's' ?> found. Refine your search below.
        <?php else: ?>
          Enter a job title, exam name, or employer to find matching opportunities.
        <?php endif; ?>
      </p>

      <form class="hero-search-bar" method="get" action="<?= eattr(url('/search.php')) ?>">
        <label class="hero-search-field">
          <span class="material-symbols-rounded" style="font-size:20px;color:var(--color-text-subtle);">search</span>
          <input type="text" name="search" value="<?= eattr($searchQuery) ?>" placeholder="Job title, exam, or employer">
        </label>
        <span class="hero-search-divider" aria-hidden="true"></span>
        <label class="hero-search-field">
          <span class="material-symbols-rounded" style="font-size:20px;color:var(--color-text-subtle);">tune</span>
          <input type="text" name="qualification" value="<?= eattr($qualQuery) ?>" placeholder="Qualification or type">
        </label>
        <button class="btn-primary" type="submit"><span class="material-symbols-rounded" style="font-size:18px;">search</span> Find jobs</button>
      </form>

      <div class="hero-trust-bar">
        <span class="hero-trust-item"><span class="material-symbols-rounded">verified</span> 14,832 verified listings</span>
        <span class="hero-trust-divider"></span>
        <span class="hero-trust-item"><span class="material-symbols-rounded">groups</span> 2.6M monthly seekers</span>
        <span class="hero-trust-divider"></span>
        <span class="hero-trust-item"><span class="material-symbols-rounded">schedule</span> Updated every morning</span>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
      <div>
        <div class="section-eyebrow">Browse by qualification</div>
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">Jobs that fit what you&apos;ve earned</h2>
      </div>
      <a href="<?= eattr(url('/qualifications/')) ?>" class="view-all">All qualifications <span class="material-symbols-rounded">arrow_forward</span></a>
    </div>
    <div class="tile-grid">
      <?php if (empty($quals)): ?>
        <div class="col-span-full text-center text-text-muted py-6">No data.</div>
      <?php else: foreach ($quals as $qual): ?>
        <a class="tile qual-tile" href="<?= eattr(url('/qualifications/' . slugify_label($qual) . '/')) ?>">
          <div class="tile-icon"><span class="material-symbols-rounded"><?= e(qualification_icon($qual)) ?></span></div>
          <div class="tile-body"><div class="tile-title"><?= e($qual) ?></div><div class="tile-count">View jobs</div></div>
          <div class="tile-arrow"><span class="material-symbols-rounded">arrow_forward</span></div>
        </a>
      <?php endforeach; endif; ?>
    </div>
  </section>

  <?php if ($hasQuery): ?>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 border-t border-hairline">
      <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
        <div>
          <div class="section-eyebrow">Search results</div>
          <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink"><?= e(number_format($total)) ?> result<?= $total === 1 ? '' : 's' ?> for "<?= e($displayLabel) ?>"</h2>
        </div>
      </div>
      <div class="job-grid">
        <?php if (empty($jobs)): ?>
          <div class="col-span-full card-base text-center py-16 text-text-muted">
            <div class="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
              <span class="material-symbols-rounded text-text-muted" style="font-size:22px;">search_off</span>
            </div>
            <p class="font-medium text-ink mb-1">No matching jobs found</p>
            <p class="text-sm">Try a different keyword or fewer words.</p>
          </div>
        <?php else: foreach ($jobs as $job): require __DIR__ . '/templates/job-card.php'; endforeach; endif; ?>
      </div>
      <?php if ($totalPages > 1): ?>
        <div class="pagination-row mt-10 sm:mt-12 flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
          <?php if ($currentPage > 1): ?><a href="<?= eattr($mkPage($currentPage - 1)) ?>" class="w-10 h-10 rounded-full border border-hairline-strong text-ink hover:bg-surface transition-colors flex items-center justify-center shrink-0"><span class="material-symbols-rounded" style="font-size:20px;">chevron_left</span></a><?php else: ?><span class="w-10 h-10 rounded-full border border-hairline-strong text-ink opacity-30 flex items-center justify-center shrink-0"><span class="material-symbols-rounded" style="font-size:20px;">chevron_left</span></span><?php endif; ?>
          <span class="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-text-body bg-surface border border-hairline whitespace-nowrap">Page <?= (int) $currentPage ?> of <?= (int) $totalPages ?></span>
          <?php if ($currentPage < $totalPages): ?><a href="<?= eattr($mkPage($currentPage + 1)) ?>" class="w-10 h-10 rounded-full border border-hairline-strong text-ink hover:bg-surface transition-colors flex items-center justify-center shrink-0"><span class="material-symbols-rounded" style="font-size:20px;">chevron_right</span></a><?php else: ?><span class="w-10 h-10 rounded-full border border-hairline-strong text-ink opacity-30 flex items-center justify-center shrink-0"><span class="material-symbols-rounded" style="font-size:20px;">chevron_right</span></span><?php endif; ?>
        </div>
      <?php endif; ?>
    </section>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
