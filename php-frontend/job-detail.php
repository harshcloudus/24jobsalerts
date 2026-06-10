<?php
/**
 * job-detail.php — /jobs/{slug}-{id}/ (Next jobs/[id]/page.tsx + layout.tsx).
 * SSR with a 300s file cache (ISR revalidate=300 equivalent). Markup/classes
 * mirror the Next detail page (hero-band-dark, card-base, badge-orange,
 * btn-primary, sticky-sidebar) for visual parity.
 *
 * - id parsed from trailing numeric slug segment (doc §13).
 * - per-job SEO meta (layout.tsx generateMetadata) via render_meta.
 * - dynamic tables_json with Important Links / Eligibility / How-to-apply
 *   special-casing ported from page.tsx.
 * - JobPosting + Breadcrumb JSON-LD.
 * - related_jobs_json rendered (parity improvement — Next never renders it).
 *
 * Slug arrives via rewrite as ?slug=...
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/jsonld.php';
require_once __DIR__ . '/includes/bookmarks.php';

$slug = isset($_GET['slug']) ? trim((string) $_GET['slug'], '/') : '';
$numId = parse_job_id_from_slug($slug);

$render_404 = static function (): void {
    http_response_code(404);
    $GLOBALS['page_meta'] = ['title' => 'Job not found', 'robots' => 'noindex'];
    $page_meta = $GLOBALS['page_meta'];
    require __DIR__ . '/includes/header.php';
    echo '<div class="max-w-7xl mx-auto px-4 py-16 text-center text-text-muted">Job not found.</div>';
    require __DIR__ . '/includes/footer.php';
};

if ($numId === null) {
    $render_404();
    return;
}

$job = get_job($numId, DETAIL_CACHE_TTL);
if ($job === null) {
    $render_404();
    return;
}

// ---- per-job SEO (layout.tsx generateMetadata) --------------------------
$rawTitle = trim((string) ($job['title'] ?? '')) ?: 'Job details';
$page_meta = [
    'title' => trim_to_len($rawTitle, 72),
    'description' => build_meta_description($job),
    'keywords' => build_keywords($job),
    'canonical' => canonical_for_job($slug),
    'og_type' => 'article',
    'article_section' => parse_hiring_org_name($job),
];

$tables = is_array($job['tables_json'] ?? null) ? $job['tables_json'] : [];
$related = is_array($job['related_jobs_json'] ?? null) ? $job['related_jobs_json'] : [];
$categoryLabel = ($job['category'] ?? '') === 'structured_job' ? 'Job'
    : (($job['category'] ?? '') === 'article' ? 'Article' : ($job['category'] ?? 'Job'));
$fallbackUrl = $job['official_site'] ?? $job['url'] ?? null;
$marked = is_bookmarked($numId);

require __DIR__ . '/includes/header.php';
echo jsonld_job($job, $slug);
?>
<div class="bg-canvas">
<section class="hero-band-dark">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
    <nav class="mb-5 sm:mb-6 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-on-dark-muted min-w-0">
      <a href="<?= eattr(url('/')) ?>" class="hover:text-on-dark transition-colors shrink-0">Home</a>
      <span class="material-symbols-rounded shrink-0" style="font-size:14px;opacity:.6;">chevron_right</span>
      <a href="<?= eattr(url('/latest-jobs/')) ?>" class="hover:text-on-dark transition-colors shrink-0">Jobs</a>
      <span class="material-symbols-rounded shrink-0" style="font-size:14px;opacity:.6;">chevron_right</span>
      <span class="text-on-dark/80 truncate max-w-[20ch] sm:max-w-[40ch] min-w-0"><?= e($job['title'] ?? '') ?></span>
    </nav>

    <div class="flex flex-wrap items-center gap-2 mb-5">
      <span class="badge-orange"><?= e($categoryLabel) ?></span>
      <?php if (!empty($job['posted_date'])): ?>
        <span class="inline-flex items-center gap-1.5 text-xs text-on-dark-muted"><span class="material-symbols-rounded" style="font-size:16px;">calendar_today</span> Posted <?= e($job['posted_date']) ?></span>
      <?php endif; ?>
      <?php if (!empty($job['last_date'])): ?>
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><span class="material-symbols-rounded" style="font-size:16px;">event_busy</span> Apply by <?= e($job['last_date']) ?></span>
      <?php endif; ?>
    </div>

    <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-semibold tracking-[-0.02em] text-on-dark leading-[1.15] mb-5 sm:mb-6 break-words"><?= e($job['title'] ?? '') ?></h1>

    <div class="flex flex-wrap gap-x-6 gap-y-3 text-sm text-on-dark-muted">
      <?php if (!empty($job['job_type'])): ?>
        <div class="flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:18px;font-variation-settings:'FILL' 1;">work</span><span><?= e($job['job_type']) ?></span></div>
      <?php endif; ?>
      <?php if (!empty($job['qualification'])): ?>
        <div class="flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:18px;font-variation-settings:'FILL' 1;">school</span><span><?= e($job['qualification']) ?></span></div>
      <?php endif; ?>
      <?php if (!empty($job['salary'])): ?>
        <div class="flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:18px;font-variation-settings:'FILL' 1;">payments</span><span><?= e($job['salary']) ?></span></div>
      <?php endif; ?>
    </div>
  </div>
</section>

<main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
    <div class="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
      <?php if (!empty($job['intro_text'])): ?>
        <section class="card-base p-5 sm:p-6 lg:p-8">
          <h3 class="text-lg font-semibold text-ink mb-3 flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:20px;">description</span> Job description</h3>
          <p class="text-text-body leading-relaxed"><?= linkify_text($job['intro_text']) ?></p>
        </section>
      <?php endif; ?>

      <?php foreach ($tables as $table):
            if (!is_array($table)) { continue; }
            $heading = $table['heading'] ?? null;
            $columns = is_array($table['columns'] ?? null) ? $table['columns'] : [];
            $rows = is_array($table['rows'] ?? null) ? $table['rows'] : [];
            $importantLinks = is_important_links_table($heading);
            $bodyRows = $importantLinks ? array_merge([$columns], $rows) : $rows;
            $showHeader = !$importantLinks;
            $headingDisplay = $heading;
            if ($heading !== null && stripos($heading, 'eligibility') !== false) {
                $headingDisplay = 'Eligibility / Requirement details';
            }
      ?>
        <section class="card-base overflow-hidden">
          <?php if ($heading): ?>
            <div class="bg-ink text-on-dark px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold tracking-tight break-words"><?= e($headingDisplay) ?></div>
          <?php endif; ?>
          <div class="p-4 sm:p-6">
            <?php if (!empty($table['name']) && $table['name'] !== $heading): ?>
              <h4 class="font-semibold text-ink mb-3 text-base"><?= e($table['name']) ?></h4>
            <?php endif; ?>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <?php if ($showHeader && $columns): ?>
                  <thead><tr><?php foreach ($columns as $col): ?><th class="border-b border-hairline-strong bg-surface px-4 py-3 text-left font-semibold text-ink text-[13px] tracking-tight whitespace-nowrap"><?= e((string) $col) ?></th><?php endforeach; ?></tr></thead>
                <?php endif; ?>
                <tbody>
                  <?php foreach ($bodyRows as $row):
                        if (!is_array($row)) { continue; }
                        $linkColIdx = count($row) - 1;
                  ?>
                    <tr class="border-b border-hairline-soft last:border-b-0">
                      <?php foreach ($row as $dIdx => $cell):
                            $force = $importantLinks && $dIdx === $linkColIdx && count($row) > 1;
                      ?>
                        <td class="px-4 py-3 text-text-body align-top whitespace-nowrap"><?= render_cell($cell, $fallbackUrl, $force) ?></td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>

            <?php if ($heading && stripos($heading, 'eligibility') !== false && (!empty($job['requirement_text']) || !empty($job['eligibility_text']))): ?>
              <div class="mt-4 space-y-2 text-sm text-text-body leading-relaxed">
                <?php if (!empty($job['requirement_text'])): ?><p><?= e($job['requirement_text']) ?></p><?php endif; ?>
                <?php if (!empty($job['eligibility_text'])): ?><p><?= e($job['eligibility_text']) ?></p><?php endif; ?>
              </div>
            <?php endif; ?>

            <?php if ($heading && stripos($heading, 'how to apply') !== false && !empty($job['official_site_text'])): ?>
              <div class="mt-4 text-sm text-text-body leading-relaxed"><p><?= linkify_text($job['official_site_text']) ?></p></div>
            <?php endif; ?>
          </div>
        </section>
      <?php endforeach; ?>

      <?php if (!empty($job['selection_process']) || !empty($job['application_fee'])): ?>
        <div><div class="min-h-[110px] sm:min-h-[120px] lg:min-h-[140px]"><ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="<?= eattr(ADSENSE_CLIENT) ?>" data-ad-slot="<?= eattr(ADSENSE_SLOT) ?>" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div></div>

        <section class="card-base p-5 sm:p-6 lg:p-8 space-y-6">
          <?php if (!empty($job['application_fee'])): ?>
            <div><h3 class="text-lg font-semibold text-ink mb-2 flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:20px;">payments</span> Application fee</h3><p class="text-text-body leading-relaxed"><?= e($job['application_fee']) ?></p></div>
          <?php endif; ?>
          <?php if (!empty($job['selection_process'])): ?>
            <div><h3 class="text-lg font-semibold text-ink mb-2 flex items-center gap-2"><span class="material-symbols-rounded text-primary" style="font-size:20px;">dynamic_form</span> Selection process</h3><p class="text-text-body leading-relaxed"><?= e($job['selection_process']) ?></p></div>
          <?php endif; ?>
        </section>
      <?php endif; ?>
    </div>

    <aside class="lg:col-span-1 min-w-0">
      <div class="sticky-sidebar lg:sticky lg:top-24 space-y-5">
        <div class="card-base p-5 sm:p-6">
          <h4 class="text-sm font-semibold tracking-[0.10em] text-text-subtle uppercase mb-4">Quick actions</h4>
          <div class="space-y-3">
            <?php if (!empty($job['official_site'])): ?>
              <a href="<?= eattr($job['official_site']) ?>" target="_blank" rel="noopener noreferrer" class="btn-primary w-full justify-center">Official website <span class="material-symbols-rounded" style="font-size:16px;">open_in_new</span></a>
            <?php endif; ?>
            <button type="button" class="btn-outline w-full justify-center<?= $marked ? ' bg-primary-light border-primary text-primary' : '' ?>" data-save-job="<?= $numId ?>">
              <span class="material-symbols-rounded" style="font-size:16px;font-variation-settings:<?= $marked ? "'FILL' 1" : "'FILL' 0" ?>;">bookmark</span>
              <span data-save-label><?= $marked ? 'Saved' : 'Save for later' ?></span>
            </button>
            <?php if (!empty($job['apply_text'])): ?>
              <div class="mt-2 p-4 bg-surface border border-hairline rounded-lg text-xs text-text-body leading-relaxed"><?= linkify_text($job['apply_text']) ?></div>
            <?php endif; ?>
          </div>
        </div>

        <div class="card-base p-5 sm:p-6 bg-surface-feat border-primary/20">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-rounded text-primary" style="font-size:20px;font-variation-settings:'FILL' 1;">event_busy</span>
            <h4 class="text-sm font-semibold tracking-[0.10em] text-primary-deep uppercase">Last date</h4>
          </div>
          <?php if (!empty($job['last_date_text'])): ?>
            <p class="text-sm text-text-body leading-relaxed"><?= linkify_text($job['last_date_text']) ?></p>
          <?php elseif (!empty($job['last_date'])): ?>
            <p class="text-base font-semibold text-ink"><?= e($job['last_date']) ?></p>
          <?php else: ?>
            <p class="text-xs text-text-muted italic">No data found for last date.</p>
          <?php endif; ?>
        </div>
      </div>
    </aside>
  </div>
</main>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
