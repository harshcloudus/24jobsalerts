<?php
/**
 * legal-sections.php — section-list layout for privacy/terms (Next page.tsx EXACT).
 * Expects: $eyebrow, $heading, $sub, $sections (array of [heading, body]).
 */
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="bg-canvas">
<section class="hero-band-dark">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
    <div class="section-eyebrow" style="color:var(--color-primary);"><?= e($eyebrow) ?></div>
    <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3"><?= e($heading) ?></h1>
    <p class="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl"><?= e($sub) ?></p>
  </div>
</section>
<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  <div class="card-base p-5 sm:p-6 md:p-10">
    <div class="divide-y divide-hairline-soft">
      <?php foreach ($sections as [$h, $b]): ?>
        <section class="py-5 sm:py-6 first:pt-0 last:pb-0">
          <h2 class="text-base sm:text-lg font-semibold text-ink mb-2 tracking-tight"><?= e($h) ?></h2>
          <p class="text-sm sm:text-base text-text-body leading-relaxed"><?= e($b) ?></p>
        </section>
      <?php endforeach; ?>
    </div>
  </div>
</main>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
