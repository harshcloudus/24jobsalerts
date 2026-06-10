<?php
/**
 * pagination.php — preserves query params, swaps `page`.
 * Expects: $page, $total, $page_size, $base_path, $query (params sans page).
 */
require_once __DIR__ . '/../includes/helpers.php';

$totalPages = $page_size > 0 ? (int) ceil($total / $page_size) : 1;
if ($totalPages < 1) {
    $totalPages = 1;
}
$mk = static function (int $p) use ($base_path, $query): string {
    $q = array_merge($query, ['page' => $p]);
    $q = array_filter($q, static fn($v) => $v !== null && $v !== '' && $v !== false);
    return url($base_path) . '?' . http_build_query($q);
};
if ($totalPages > 1):
?>
<nav class="pagination-row flex items-center justify-center gap-4 mt-10 flex-wrap">
  <?php if ($page > 1): ?>
    <a href="<?= eattr($mk($page - 1)) ?>" class="btn-outline">Previous</a>
  <?php endif; ?>
  <span class="text-sm text-text-muted">Page <?= (int) $page ?> of <?= (int) $totalPages ?> · <?= (int) $total ?> jobs</span>
  <?php if ($page < $totalPages): ?>
    <a href="<?= eattr($mk($page + 1)) ?>" class="btn-outline">Next</a>
  <?php endif; ?>
</nav>
<?php endif; ?>
