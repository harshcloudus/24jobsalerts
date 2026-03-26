/**
 * Must match NEXT_PUBLIC_BASE_PATH in .env (and next.config basePath at build time).
 * Empty string = app served at site root (local dev).
 */
export const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

/** Public file in /public — use for next/image src so the optimizer gets a correct path with basePath. */
export function assetUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}

/** Strip basePath from usePathname() for comparing to Link hrefs like "/latest-jobs". */
export function pathnameWithoutBase(pathname: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname;
}
