import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import BackToTopButton from "./components/BackToTopButton";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SiteTopAd from "./components/SiteTopAd";
import AdSenseDisplay from "./components/AdSenseDisplay";
import FirebaseAnalytics from "./components/FirebaseAnalytics";
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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mediresponse.org/24jobsalert";
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#001e2b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "24JobsAlerts — Latest Government Jobs & Sarkari Naukri 2026",
    template: "%s | 24JobsAlerts",
  },
  description:
    "24JobsAlerts brings the latest government job notifications in India — SSC, UPSC, Railway, Banking, Police, Defence and PSU — with eligibility, last date and direct apply links updated daily.",
  applicationName: "24JobsAlerts",
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
    "24JobsAlerts",
  ],
  authors: [{ name: "24JobsAlerts" }],
  creator: "24JobsAlerts",
  publisher: "24JobsAlerts",
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
    icon: [
      { url: `${SITE_URL}/24jobsalerts_favicon.png`, type: "image/png" },
    ],
    shortcut: `${SITE_URL}/24jobsalerts_favicon.png`,
    apple: `${SITE_URL}/24jobsalerts_favicon.png`,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "24JobsAlerts",
    title: "24JobsAlerts — Latest Government Jobs & Sarkari Naukri 2026",
    description: "Latest Indian government job notifications updated daily.",
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "24JobsAlerts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "24JobsAlerts — Latest Government Jobs 2026",
    description: "Latest Indian government job notifications updated daily.",
    images: [`${SITE_URL}/og-default.png`],
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
      <head>
        <script
          async
          data-ad-client="ca-pub-4476723703068552"
          data-ad-frequency-hint="30s"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          crossOrigin="anonymous"
        />
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
          }}
        />
        <Script
          id="adbreak-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.adsbygoogle = window.adsbygoogle || [];
var adBreak = (adConfig = function (o) {
  adsbygoogle.push(o);
});
adConfig({ preloadAdBreaks: "on", sound: "off" });`,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W5LTLXZ5');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>

      <body
        className={`${bricolageGrotesque.variable} ${plusJakartaSans.variable} antialiased font-body bg-canvas text-ink`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W5LTLXZ5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
        <FirebaseAnalytics />
        <SiteTopAd />
        <Header />
        {children}
        <AdSenseDisplay
          variant="wide"
          wrapperClassName="bg-canvas py-6 border-t border-hairline"
        />
        <Footer />
        <BackToTopButton />
      </body>
    </html>
  );
}
