<?php
/**
 * job-type.php — /job-types/ index (tiles) + /job-types/{slug}/ detail.
 * Detail mirrors Next job-types/[slug]/page.tsx EXACTLY: back link, "Sector"
 * eyebrow, h1=name, sub count, "Browse by qualification" tiles, "{type} jobs"
 * heading + grid + circle pagination. Backend matches job_type semantically.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

$slug = isset($_GET['slug']) ? trim((string) $_GET['slug'], '/') : '';
$filters = get_filters(SITEMAP_CACHE_TTL);
$jobTypes = $filters['job_types'] ?? [];
$quals = $filters['qualifications'] ?? [];

// ---- index (no slug) ----
if ($slug === '') {
    $page_meta = [
        'title' => 'Jobs by Type — Permanent, Contract, Internship, Apprentice',
        'description' => 'Government job openings filtered by employment type — permanent, contract, apprenticeship, internship and walk-in interviews across India.',
        'canonical' => site_url() . '/job-types/',
        'keywords' => [
            'permanent government jobs', 'contract jobs', 'apprenticeship',
            'internship', 'walk-in interview', 'sarkari naukri', '24JobsAlerts',
        ],
    ];
    $sorted = sort_job_types($jobTypes);
    require __DIR__ . '/includes/header.php';
    ?>
    <div class="bg-canvas">
      <section class="hero-band-dark"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20"><div class="max-w-3xl">
        <div class="section-eyebrow" style="color:var(--color-primary);">Browse by sector</div>
        <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">Explore by job type</h1>
        <p class="text-sm sm:text-base md:text-lg text-on-dark-muted">Pick a sector — government, private, railways, banking, healthcare — and browse openings tailored to that field.</p>
      </div></div></section>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div>
          <h2 class="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">All sectors</h2>
          <?php if (empty($sorted)): ?>
            <div class="text-center text-text-muted py-10">No job types available.</div>
          <?php else: ?>
            <div class="tile-grid">
              <?php foreach ($sorted as $type): ?>
                <a class="tile" href="<?= eattr(url('/job-types/' . slugify_label($type) . '/')) ?>">
                  <div class="tile-icon"><span class="material-symbols-rounded"><?= e(job_type_tile_icon($type)) ?></span></div>
                  <div class="tile-body"><div class="tile-title"><?= e($type) ?></div><div class="tile-count">Browse jobs</div></div>
                  <div class="tile-arrow"><span class="material-symbols-rounded">arrow_forward</span></div>
                </a>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
      </main>
    </div>
    <?php
    require __DIR__ . '/includes/footer.php';
    return;
}

// ---- detail (slug) ----
$resolved = null;
foreach ($jobTypes as $t) {
    if (slugify_label($t) === $slug) {
        $resolved = $t;
        break;
    }
}

$pageSize = 9;
$currentPage = clamp_page($_GET['page'] ?? 1);
$jobs = [];
$total = 0;
$totalPages = 1;
if ($resolved !== null) {
    $res = get_jobs(['page' => $currentPage, 'page_size' => $pageSize, 'job_type' => $resolved], SITEMAP_CACHE_TTL);
    $jobs = $res['items'] ?? [];
    $total = (int) ($res['total'] ?? 0);
    $totalPages = max(1, (int) ceil($total / $pageSize));
}
$mkPage = static function (int $p) use ($slug) {
    return url('/job-types/' . $slug . '/') . ($p > 1 ? '?' . http_build_query(['page' => $p]) : '');
};

if ($resolved !== null) {
    $rlow = mb_strtolower($resolved);
    $page_meta = [
        'title' => $resolved . ' Jobs — Latest Openings',
        'description' => 'Browse the latest ' . $resolved . ' openings on 24JobsAlerts with eligibility, last date, and direct apply links.',
        'canonical' => site_url() . '/job-types/' . $slug . '/' . ($currentPage > 1 ? '?page=' . $currentPage : ''),
        'keywords' => [
            $rlow . ' jobs', $rlow . ' recruitment 2026', 'sarkari naukri',
            'government job', 'free job alert', '24JobsAlerts',
        ],
    ];
} else {
    $page_meta = ['title' => 'Sector not found', 'robots' => 'noindex'];
}
if ($resolved === null) {
    http_response_code(404);
}
require __DIR__ . '/includes/header.php';
?>
<div class="bg-canvas">
  <section class="hero-band-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20"><div class="max-w-3xl">
      <div class="mb-3">
        <a href="<?= eattr(url('/job-types/')) ?>" class="inline-flex items-center gap-1 text-sm text-on-dark-muted hover:text-on-dark transition-colors">
          <span class="material-symbols-rounded" style="font-size:18px;">arrow_back</span> All sectors
        </a>
      </div>
      <div class="section-eyebrow" style="color:var(--color-primary);">Sector</div>
      <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3 break-words"><?= e($resolved ?? 'Unknown sector') ?></h1>
      <p class="text-sm sm:text-base md:text-lg text-on-dark-muted">
        <?php if ($resolved === null): ?>This sector could not be found.
        <?php else: ?><?= e(number_format($total)) ?> <?= $total === 1 ? 'opening' : 'openings' ?> in <?= e($resolved) ?>.<?php endif; ?>
      </p>
    </div></div>
  </section>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <?php if ($resolved === null): ?>
      <div class="card-base text-center py-16 text-text-muted">
        <div class="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center"><span class="material-symbols-rounded text-text-muted" style="font-size:22px;">search_off</span></div>
        <p class="font-medium text-ink mb-1">Sector not found</p>
        <p class="text-sm mb-5">We couldn&apos;t find a sector that matches this URL.</p>
        <a href="<?= eattr(url('/job-types/')) ?>" class="btn-primary inline-flex items-center gap-1 px-4 py-2">Browse all sectors</a>
      </div>
    <?php else: ?>
      <?php if (!empty($quals)): ?>
        <div class="mb-10 sm:mb-12">
          <h2 class="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">Browse by qualification</h2>
          <div class="tile-grid">
            <?php foreach ($quals as $qual): ?>
              <a class="tile qual-tile" href="<?= eattr(url('/qualifications/' . slugify_label($qual) . '/')) ?>">
                <div class="tile-icon"><span class="material-symbols-rounded"><?= e(qualification_icon($qual)) ?></span></div>
                <div class="tile-body"><div class="tile-title"><?= e($qual) ?></div><div class="tile-count">View jobs</div></div>
                <div class="tile-arrow"><span class="material-symbols-rounded">arrow_forward</span></div>
              </a>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endif; ?>

      <div class="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6"><div class="min-w-0">
        <h3 class="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-ink break-words"><?= e($resolved) ?> jobs</h3>
        <p class="text-xs sm:text-sm text-text-muted mt-1"><?= e(number_format($total)) ?> <?= $total === 1 ? 'job' : 'jobs' ?> in this sector</p>
      </div></div>

      <div class="job-grid">
        <?php if (empty($jobs)): ?>
          <div class="col-span-full card-base text-center py-16 text-text-muted">
            <div class="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center"><span class="material-symbols-rounded text-text-muted" style="font-size:22px;">search_off</span></div>
            <p class="font-medium text-ink mb-1">No jobs found</p>
            <p class="text-sm">No openings for <?= e($resolved) ?> right now.</p>
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
    <?php endif; ?>
  </main>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
