<?php
/**
 * job-card.php — single listing card. Markup + classes mirror the Next.js
 * JobCard.tsx exactly (.job-card / .job-employer-mark / .job-meta-row / etc.)
 * so it renders identically. Whole-card click goes through navigateWithAdBreak
 * (adbreak.js) before hard navigation (monetization, doc §5.3).
 *
 * Expects: $job (array from /api/jobs items).
 */

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/bookmarks.php';

// $showBookmark defaults FALSE (matches Next JobCard default — homepage cards
// have no bookmark button). Pages that want it set $showBookmark = true.
$showBookmark = $showBookmark ?? false;
$href = job_path($job);
$jid = (int) ($job['id'] ?? 0);
$marked = is_bookmarked($jid);
$title = (string) ($job['title'] ?? 'Untitled role');
$shortTitle = mb_strlen($title) > 140 ? mb_substr($title, 0, 137) . '…' : $title;
$jobType = (string) ($job['job_type'] ?? '');
$qual = (string) ($job['qualification'] ?? '');
$salary = (string) ($job['salary'] ?? '');
$lastDate = (string) ($job['last_date'] ?? '');
$postedDate = $job['posted_date'] ? relative_date((string) $job['posted_date']) : '';

/** Employer shortname — port of getEmployerShortname(). */
$shortname = (static function (string $t): string {
    $clean = trim($t);
    $first = preg_split('/[\s\-–]/u', $clean)[0] ?? '';
    if (preg_match('/^[A-Z]{2,5}$/', $first)) {
        return mb_substr($first, 0, 3);
    }
    $words = preg_split('/\s+/u', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $ini = '';
    foreach (array_slice($words, 0, 2) as $w) {
        $ini .= mb_strtoupper(mb_substr($w, 0, 1));
    }
    return $ini !== '' ? $ini : 'J';
})($title);
?>
<article class="job-card" role="button" tabindex="0" data-job-card data-href="<?= eattr($href) ?>" style="-webkit-tap-highlight-color: transparent;">
  <div class="job-card-header">
    <div class="job-employer-mark" aria-hidden="true"><?= e($shortname) ?></div>
    <?php if ($showBookmark): ?>
      <button class="job-bookmark-btn<?= $marked ? ' saved' : '' ?>" type="button" data-save-job="<?= $jid ?>"
              aria-label="<?= $marked ? 'Remove bookmark' : 'Save job' ?>">
        <span class="material-symbols-rounded" style="font-size:18px;font-variation-settings:<?= $marked ? "'FILL' 1" : "'FILL' 0" ?>;">bookmark</span>
      </button>
    <?php endif; ?>
  </div>

  <h3 class="job-card-title"><?= e($shortTitle) ?></h3>

  <div class="job-meta-row">
    <?php if ($salary !== ''): ?>
      <span class="job-meta-item"><span class="material-symbols-rounded">payments</span><span><?= e($salary) ?></span></span>
    <?php elseif ($jobType !== ''): ?>
      <span class="job-meta-item"><span class="material-symbols-rounded">work</span><span><?= e($jobType) ?></span></span>
    <?php endif; ?>
    <?php if ($postedDate !== ''): ?>
      <span class="job-meta-item"><span class="material-symbols-rounded">schedule</span><span>Posted <?= e($postedDate) ?></span></span>
    <?php elseif ($qual !== ''): ?>
      <span class="job-meta-item"><span class="material-symbols-rounded">school</span><span><?= e($qual) ?></span></span>
    <?php endif; ?>
  </div>

  <div class="job-card-tags">
    <?php if ($jobType !== ''): ?><span class="job-tag"><?= e($jobType) ?></span><?php endif; ?>
    <?php if ($qual !== ''): ?><span class="job-tag"><?= e($qual) ?></span><?php endif; ?>
  </div>

  <div class="job-card-footer">
    <?php if ($lastDate !== ''): ?>
      <span class="job-deadline"><span class="material-symbols-rounded">calendar_today</span>Apply by <?= e($lastDate) ?></span>
    <?php else: ?>
      <span></span>
    <?php endif; ?>
    <a href="<?= eattr($href) ?>" class="job-card-apply" data-card-link>
      Read more <span class="material-symbols-rounded">arrow_forward</span>
    </a>
  </div>
</article>
