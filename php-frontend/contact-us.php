<?php
/** contact-us.php — exact content port of Next contact-us/page.tsx. */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/seo.php';
require_once __DIR__ . '/includes/helpers.php';

const SUPPORT_EMAIL = '24jobsalert@mediresponse.org';

$page_meta = [
    'title' => 'Contact us',
    'description' => 'Get in touch with 24JobsAlerts support. Reach us for feedback, corrections, or help.',
    'canonical' => site_url() . '/contact-us/',
];
require __DIR__ . '/includes/header.php';
?>
<div class="bg-canvas">
<section class="hero-band-dark">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
    <div class="section-eyebrow" style="color:var(--color-primary);">Get in touch</div>
    <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">Contact us</h1>
    <p class="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">For support, feedback, or corrections — email us and we&apos;ll get back to you as soon as possible.</p>
  </div>
</section>
<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
    <div class="card-base p-5 sm:p-6 md:p-8">
      <div class="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
        <span class="material-symbols-rounded" style="font-size:20px;font-variation-settings:'FILL' 1;">mail</span>
      </div>
      <div class="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-1.5">Email</div>
      <a class="inline-flex items-center gap-2 text-ink font-semibold hover:text-primary transition-colors break-all" href="mailto:<?= eattr(SUPPORT_EMAIL) ?>"><?= e(SUPPORT_EMAIL) ?></a>
      <p class="text-sm text-text-muted mt-3 leading-relaxed">We typically respond within 1&ndash;2 business days.</p>
    </div>
    <div class="card-base p-5 sm:p-6 md:p-8">
      <div class="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
        <span class="material-symbols-rounded" style="font-size:20px;font-variation-settings:'FILL' 1;">checklist</span>
      </div>
      <div class="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-2">What to include</div>
      <ul class="text-sm text-text-body space-y-1.5 list-disc pl-5">
        <li>Job title and the page URL (if reporting an issue)</li>
        <li>What looks incorrect or missing</li>
        <li>Any official source link you want us to verify</li>
      </ul>
    </div>
  </div>
</main>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
