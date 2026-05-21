import type { AnchorHTMLAttributes } from "react";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

interface HardLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function HardLink({ href, children, ...props }: HardLinkProps) {
  const fullHref = href.startsWith("/") ? `${BASE}${href}` : href;
  return (
    <a href={fullHref} {...props}>
      {children}
    </a>
  );
}
