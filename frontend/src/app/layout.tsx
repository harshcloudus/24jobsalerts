import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import BackToTopButton from "./components/BackToTopButton";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SiteTopAd from "./components/SiteTopAd";
import AdSenseDisplay from "./components/AdSenseDisplay";
import AdGateModal from "./components/AdGateModal";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://24jobsalert.dreamdazzly.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#001e2b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "24jobsalerts — Latest Government Jobs & Sarkari Naukri 2026",
    template: "%s | 24jobsalerts",
  },
  description:
    "24jobsalerts brings the latest government job notifications in India — SSC, UPSC, Railway, Banking, Police, Defence and PSU — with eligibility, last date and direct apply links updated daily.",
  applicationName: "24jobsalerts",
  keywords: [
    "sarkari naukri",
    "government jobs",
    "free job alert",
    "latest jobs 2026",
    "ssc",
    "upsc",
    "railway recruitment",
    "bank jobs",
    "rojgar samachar",
    "24jobsalerts",
  ],
  authors: [{ name: "24jobsalerts" }],
  creator: "24jobsalerts",
  publisher: "24jobsalerts",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: "/24jobsalerts_favicon.png",
    apple: "/24jobsalerts_favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "24jobsalerts",
    title: "24jobsalerts — Latest Government Jobs & Sarkari Naukri 2026",
    description: "Latest Indian government job notifications updated daily.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "24jobsalerts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "24jobsalerts — Latest Government Jobs 2026",
    description: "Latest Indian government job notifications updated daily.",
    images: ["/og-default.png"],
  },
  category: "jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgLd = buildOrganizationJsonLd();
  const siteLd = buildWebSiteJsonLd();
  return (
    <html lang="en">
      <body className={`${bricolageGrotesque.variable} ${plusJakartaSans.variable} antialiased font-body bg-canvas text-ink`}>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
        {/* Ad Placement API bootstrap — must run before adsbygoogle.js */}
        <Script id="ad-placement-init" strategy="beforeInteractive">
          {`window.adBreak=window.adConfig=function(o){(window.__adPlacements=window.__adPlacements||[]).push(o);};`}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4476723703068552"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W5LTLXZ5');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W5LTLXZ5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <SiteTopAd />
        <Header />
        {children}
        <AdSenseDisplay
          variant="wide"
          wrapperClassName="bg-canvas py-6 border-t border-hairline"
        />
        <Footer />
        <BackToTopButton />
        <AdGateModal />
      </body>
    </html>
  );
}

