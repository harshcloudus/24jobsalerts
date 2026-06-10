<?php
/**
 * newsletter-form.php — signup block (dark CTA band). Submits to newsletter.php
 * which proxies POST /api/newsletter/subscribe (idempotent). Works without JS;
 * main.js enhances to AJAX.
 * Optional: $newsletter_msg (string), $newsletter_ok (bool).
 */
require_once __DIR__ . '/../includes/helpers.php';
?>
<section class="hero-band-dark" id="newsletter">
  <div class="max-w-3xl mx-auto px-4 py-12 text-center">
    <h2 class="text-3xl font-semibold text-on-dark mb-2">Never miss a job alert</h2>
    <p class="text-on-dark-muted mb-6">Get the latest government job notifications in your inbox.</p>
    <?php if (!empty($newsletter_msg)): ?>
      <div class="ja-note <?= !empty($newsletter_ok) ? 'is-ok' : 'is-err' ?>" style="max-width:460px;margin:0 auto 12px;"><?= e($newsletter_msg) ?></div>
    <?php endif; ?>
    <form method="post" action="<?= eattr(url('/newsletter.php')) ?>" data-newsletter-form
          style="display:flex;align-items:center;max-width:460px;margin:0 auto;min-height:52px;border-radius:9999px;background:#fff;padding:6px;gap:6px;">
      <input name="email" type="email" required placeholder="you@example.com" aria-label="Email address"
             style="flex:1;min-width:0;border:0;background:transparent;padding:0 16px;font-size:15px;font-family:inherit;outline:none;color:var(--color-ink);">
      <button type="submit" class="btn-primary" style="box-shadow:none;">Subscribe</button>
    </form>
  </div>
</section>
