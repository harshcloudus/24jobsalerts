<?php
/**
 * filters.php — filter sidebar. Sends documented param names exactly:
 * job_type (semantic bucket raw value), qualification (bucket KEY), category.
 * Expects: $filters, $action (self path), $active (applied params).
 */
require_once __DIR__ . '/../includes/helpers.php';
$active = $active ?? [];
?>
<form class="card-base" method="get" action="<?= eattr(url($action)) ?>" style="padding:18px;display:flex;flex-direction:column;gap:16px;position:sticky;top:84px;">
  <div style="display:flex;flex-direction:column;gap:6px;">
    <label class="text-xs font-semibold uppercase text-text-muted" style="letter-spacing:.05em;">Search</label>
    <input class="input-black-border" type="text" name="search" value="<?= eattr($active['search'] ?? '') ?>" placeholder="Job title, keyword…" style="padding:10px 12px;font-family:inherit;font-size:14px;">
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <label class="text-xs font-semibold uppercase text-text-muted" style="letter-spacing:.05em;">Job Type</label>
    <select class="input-black-border" name="job_type" style="padding:10px 12px;font-family:inherit;font-size:14px;">
      <option value="">All types</option>
      <?php foreach (($filters['job_types'] ?? []) as $jt): ?>
        <option value="<?= eattr($jt) ?>"<?= (($active['job_type'] ?? '') === $jt) ? ' selected' : '' ?>><?= e($jt) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <label class="text-xs font-semibold uppercase text-text-muted" style="letter-spacing:.05em;">Qualification</label>
    <select class="input-black-border" name="qualification" style="padding:10px 12px;font-family:inherit;font-size:14px;">
      <option value="">All qualifications</option>
      <?php foreach (($filters['qualifications'] ?? []) as $q): ?>
        <option value="<?= eattr($q) ?>"<?= (($active['qualification'] ?? '') === $q) ? ' selected' : '' ?>><?= e($q) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <?php if (!empty($filters['categories'])): ?>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <label class="text-xs font-semibold uppercase text-text-muted" style="letter-spacing:.05em;">Category</label>
    <select class="input-black-border" name="category" style="padding:10px 12px;font-family:inherit;font-size:14px;">
      <option value="">All categories</option>
      <?php foreach ($filters['categories'] as $c): ?>
        <option value="<?= eattr($c) ?>"<?= (($active['category'] ?? '') === $c) ? ' selected' : '' ?>><?= e($c) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <?php endif; ?>
  <button type="submit" class="btn-primary" style="justify-content:center;">Apply Filters</button>
</form>
