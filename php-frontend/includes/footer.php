<?php
/**
 * footer.php — closes <main>, bottom wide AdSense unit, footer (markup + classes
 * mirror Next Footer.tsx: .footer-region / .footer-link / grid columns / why-us
 * rows / inline newsletter). Loads site JS (adbreak + bookmarks + main).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$col_explore = [
    ['/latest-jobs/', 'Latest jobs'],
    ['/all-jobs/', 'All jobs'],
    ['/job-types/', 'Job types'],
    ['/qualifications/', 'Qualifications'],
    ['/bookmarks/', 'Saved jobs'],
];
$col_company = [
    ['/about-us/', 'About us'],
    ['/contact-us/', 'Contact us'],
];
$col_legal = [
    ['/privacy-policy/', 'Privacy policy'],
    ['/terms-and-conditions/', 'Terms & conditions'],
    ['/disclaimer/', 'Disclaimer'],
];
$col_head = 'mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white';
$why = [['verified', 'Verified listings'], ['update', 'Daily updates'], ['lock', 'Privacy first']];
?>
</main>

<!-- bottom wide ad (layout.tsx AdSenseDisplay variant="wide" wrapperClassName="bg-canvas py-6 border-t border-hairline") -->
<?= ja_ad('wide', 'bg-canvas border-t border-hairline') ?>

<footer class="footer-region mt-8">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 gap-x-6 gap-y-8 pb-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 md:grid-cols-12 md:gap-x-6 md:gap-y-10 lg:gap-x-8 lg:gap-y-0 lg:items-start">
      <!-- Brand + newsletter -->
      <div class="min-w-0 col-span-2 sm:col-span-2 md:col-span-12 lg:col-span-4">
        <div class="flex max-w-lg flex-col gap-3">
          <a href="<?= eattr(url('/')) ?>" class="group block w-fit max-w-full leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#001220] rounded-sm">
            <img src="<?= eattr(url('/assets/images/footer-logo.png')) ?>" alt="24 Jobs Alerts" class="block h-9 w-auto max-w-full align-top object-left object-contain sm:h-10 md:h-11 lg:h-12 transition-opacity duration-200 group-hover:opacity-95">
          </a>
          <p class="text-[14px] leading-relaxed text-on-dark-muted">One place for every government and private job alert in India — clean, structured listings with eligibility, deadlines, and official application links.</p>
        </div>

        <div class="mt-6 max-w-md">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">Get jobs in your inbox</p>
          <form method="post" action="<?= eattr(url('/newsletter.php')) ?>" data-newsletter-form
                class="flex min-h-[48px] w-full flex-row items-center rounded-full border border-white/[0.12] bg-white/[0.06] pl-3 pr-1 sm:pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/25 transition-[border-color,box-shadow] duration-200">
            <input name="email" type="email" placeholder="your@email.com" aria-label="Email for newsletter" autocomplete="email" enterkeyhint="send"
                   class="min-h-[48px] min-w-0 flex-1 border-0 bg-transparent py-3 text-[14px] leading-none text-white placeholder:text-white/40 focus:outline-none">
            <button type="submit" class="btn-primary h-10 min-h-[40px] shrink-0 rounded-full px-3.5 sm:px-5 !py-0 text-[13px] sm:text-[14px] leading-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">Subscribe</button>
          </form>
          <div class="mt-3 rounded-md px-3 py-2 text-xs font-medium" data-newsletter-msg hidden></div>
        </div>
      </div>

      <nav class="min-w-0 order-1 md:order-none md:col-span-3 lg:col-span-2" aria-label="Explore">
        <h5 class="<?= $col_head ?>">Explore</h5>
        <ul class="flex flex-col gap-1.5">
          <?php foreach ($col_explore as [$h, $l]): ?><li><a class="footer-link" href="<?= eattr(url($h)) ?>"><?= e($l) ?></a></li><?php endforeach; ?>
        </ul>
      </nav>

      <nav class="min-w-0 order-3 md:order-none md:col-span-3 lg:col-span-2" aria-label="Company">
        <h5 class="<?= $col_head ?>">Company</h5>
        <ul class="flex flex-col gap-1.5">
          <?php foreach ($col_company as [$h, $l]): ?><li><a class="footer-link" href="<?= eattr(url($h)) ?>"><?= e($l) ?></a></li><?php endforeach; ?>
        </ul>
      </nav>

      <nav class="min-w-0 order-2 md:order-none md:col-span-3 lg:col-span-2" aria-label="Legal">
        <h5 class="<?= $col_head ?>">Legal</h5>
        <ul class="flex flex-col gap-1.5">
          <?php foreach ($col_legal as [$h, $l]): ?><li><a class="footer-link" href="<?= eattr(url($h)) ?>"><?= e($l) ?></a></li><?php endforeach; ?>
        </ul>
      </nav>

      <div class="min-w-0 order-4 md:order-none md:col-span-3 lg:col-span-2">
        <h5 class="<?= $col_head ?>">Why us</h5>
        <ul class="flex flex-col gap-3">
          <?php foreach ($why as [$icon, $label]): ?>
            <li class="flex items-center gap-2.5 text-[13px] leading-snug text-on-dark-muted sm:text-[14px]">
              <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20" style="color:#f5a886;" aria-hidden>
                <span class="material-symbols-rounded text-[16px] leading-none select-none" style="font-variation-settings:'FILL' 0, 'wght' 400;"><?= e($icon) ?></span>
              </span>
              <span class="min-w-0 flex-1"><?= e($label) ?></span>
            </li>
          <?php endforeach; ?>
        </ul>
      </div>
    </div>

    <div class="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
      <p class="text-center text-[13px] text-on-dark-muted sm:text-left">© <?= gmdate('Y') ?> 24JobsAlerts. All rights reserved.</p>
      <p class="text-center text-[13px] text-on-dark-muted sm:text-right">Made for job seekers across India.</p>
    </div>
  </div>
</footer>

<button class="ja-back-to-top" data-back-to-top aria-label="Back to top">
  <span class="material-symbols-rounded">arrow_upward</span>
</button>

<script>window.JA_BASE_PATH = <?= json_encode(BASE_PATH) ?>;</script>
<script src="<?= eattr(url('/assets/js/adbreak.js')) ?>" defer></script>
<script src="<?= eattr(url('/assets/js/bookmarks.js')) ?>" defer></script>
<script src="<?= eattr(url('/assets/js/main.js')) ?>" defer></script>
</body>
</html>
