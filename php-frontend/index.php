<?php
/**
 * index.php — homepage. Content + markup mirror the Next page.tsx EXACTLY:
 * same hero badge / heading / sub / dual-field search / trust bar / section
 * eyebrows + headings / tile counts / why-us cards / page_size=4. The only
 * intentional difference is SSR vs CSR (data is server-rendered here).
 *
 * Job-type order matches page.tsx: Government Job, Private Job, then alpha.
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

$filters = get_filters(SITEMAP_CACHE_TTL);
$quals = $filters['qualifications'] ?? [];
$types = $filters['job_types'] ?? [];

// order job types: "government job" first, "private job" second, then alpha
usort($types, static function ($a, $b) {
    $na = strtolower(trim($a));
    $nb = strtolower(trim($b));
    $sa = $na === 'government job' ? 0 : ($na === 'private job' ? 1 : 2);
    $sb = $nb === 'government job' ? 0 : ($nb === 'private job' ? 1 : 2);
    return $sa !== $sb ? $sa - $sb : strcmp($a, $b);
});

$latest = get_jobs(['page' => 1, 'page_size' => 4, 'only_recent' => true], SITEMAP_CACHE_TTL);
$all = get_jobs(['page' => 1, 'page_size' => 4], SITEMAP_CACHE_TTL);

$why = [
    ['bolt', 'Daily updates', 'New jobs are posted every single day so you never miss an opportunity.'],
    ['verified', 'Verified listings', 'Every job links to the official source so you can verify before applying.'],
    ['filter_alt', 'Clean filters', 'Filter by sector, qualification, or job type — no spammy popups.'],
    ['bookmark', 'Save & revisit', 'Bookmark jobs in your browser and come back to them anytime.'],
];

$page_meta = ['title_is_default' => true, 'canonical' => site_url() . '/'];
require __DIR__ . '/includes/header.php';
?>
<!-- ===== HERO ===== -->
<section class="hero-home">
  <div class="hero-bg"></div>
  <div class="hero-grid-overlay"></div>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-center">
    <div class="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] text-on-dark mb-4 sm:mb-5 max-w-full">
      <span class="hero-badge-dot"></span>
      <span class="hidden sm:inline">Updated daily ·</span>
      <span class="sm:hidden">Daily ·</span>
      <span class="hero-badge-chip" style="white-space:nowrap;">2,438 this week</span>
    </div>

    <h1 class="hero-heading">Every job alert, <span class="text-primary italic font-medium">friendlier.</span></h1>

    <p class="text-[14px] sm:text-[17px] text-on-dark-muted leading-[1.55] max-w-[60ch] mx-auto mb-6 sm:mb-7 px-1 sm:px-2">Verified government, banking, railway and private listings — sorted, searchable, and saved before the deadline catches you off guard.</p>

    <form class="hero-search-bar" method="get" action="<?= eattr(url('/search.php')) ?>">
      <label class="hero-search-field">
        <span class="material-symbols-rounded" style="font-size:20px;color:var(--color-text-subtle);">search</span>
        <input type="text" name="search" placeholder="Job title, exam, or employer">
      </label>
      <span class="hero-search-divider" aria-hidden="true"></span>
      <label class="hero-search-field">
        <span class="material-symbols-rounded" style="font-size:20px;color:var(--color-text-subtle);">tune</span>
        <input type="text" name="qualification" placeholder="Qualification or type">
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

<!-- ===== LATEST JOBS ===== -->
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
  <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
    <div>
      <div class="section-eyebrow">Fresh today</div>
      <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">Latest job openings</h2>
    </div>
    <a href="<?= eattr(url('/latest-jobs/')) ?>" class="view-all">View all <span class="material-symbols-rounded">arrow_forward</span></a>
  </div>
  <div class="job-grid">
    <?php if (empty($latest['items'])): ?>
      <div class="col-span-full text-center text-text-muted py-10 card-base">No recent jobs found.</div>
    <?php else: foreach ($latest['items'] as $job): require __DIR__ . '/templates/job-card.php'; endforeach; endif; ?>
  </div>
</section>

<!-- ===== JOB TYPES ===== -->
<section class="bg-surface border-y border-hairline">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
      <div>
        <div class="section-eyebrow">Browse by field</div>
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">Find jobs by type</h2>
      </div>
      <a href="<?= eattr(url('/job-types/')) ?>" class="view-all">All types <span class="material-symbols-rounded">arrow_forward</span></a>
    </div>
    <div class="tile-grid">
      <?php if (empty($types)): ?>
        <div class="col-span-full text-center text-text-muted py-6">No data.</div>
      <?php else: foreach ($types as $type): ?>
        <a class="tile" href="<?= eattr(url('/job-types/' . slugify_label($type) . '/')) ?>">
          <div class="tile-icon"><span class="material-symbols-rounded"><?= e(job_type_icon($type)) ?></span></div>
          <div class="tile-body"><div class="tile-title"><?= e($type) ?></div><div class="tile-count">Browse jobs</div></div>
          <div class="tile-arrow"><span class="material-symbols-rounded">arrow_forward</span></div>
        </a>
      <?php endforeach; endif; ?>
    </div>
  </div>
</section>

<!-- ===== QUALIFICATIONS ===== -->
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
  <div class="flex items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
    <div class="min-w-0">
      <div class="section-eyebrow">Browse by qualification</div>
      <h2 class="text-lg sm:text-3xl font-semibold tracking-[-0.015em] text-ink">Jobs that fit what you&apos;ve earned</h2>
    </div>
    <a href="<?= eattr(url('/qualifications/')) ?>" class="view-all shrink-0">All qualifications <span class="material-symbols-rounded">arrow_forward</span></a>
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

<!-- wide ad (page.tsx AdSenseDisplay variant="wide" className="py-6") -->
<?= ja_ad('wide') ?>

<!-- ===== ALL JOBS ===== -->
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
  <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
    <div>
      <div class="section-eyebrow">Open right now</div>
      <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">All job openings</h2>
    </div>
    <a href="<?= eattr(url('/all-jobs/')) ?>" class="view-all">View all <span class="material-symbols-rounded">arrow_forward</span></a>
  </div>
  <div class="job-grid">
    <?php if (empty($all['items'])): ?>
      <div class="col-span-full text-center text-text-muted py-10 card-base">No jobs found.</div>
    <?php else: foreach ($all['items'] as $job): require __DIR__ . '/templates/job-card.php'; endforeach; endif; ?>
  </div>
</section>

<!-- ===== WHY US ===== -->
<section class="bg-surface border-y border-hairline">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <div class="max-w-2xl mb-8 sm:mb-10">
      <div class="section-eyebrow">Why 24JobsAlerts</div>
      <h2 class="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink mb-3">Built for serious job seekers.</h2>
      <p class="text-base text-text-body leading-relaxed">Clean, accurate, daily-updated job alerts with direct links to the official source.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <?php foreach ($why as [$icon, $title, $desc]): ?>
        <div class="why-card">
          <div class="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-4">
            <span class="material-symbols-rounded text-primary" style="font-size:20px;font-variation-settings:'FILL' 1;"><?= e($icon) ?></span>
          </div>
          <h3 class="text-base font-semibold text-ink mb-1.5"><?= e($title) ?></h3>
          <p class="text-sm text-text-body leading-relaxed"><?= e($desc) ?></p>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
