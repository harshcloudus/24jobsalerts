import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import BackToTopButton from "./components/BackToTopButton";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SiteTopAd from "./components/SiteTopAd";
import AdSenseDisplay from "./components/AdSenseDisplay";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "24jobsalerts - Premium Job Alerts Portal",
  description:
    "24jobsalerts helps you find the right government and private jobs faster with clean, structured job alerts and details.",
  icons: {
    icon: "/24jobsalerts_favicon.png",
    apple: "/24jobsalerts_favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1236097872832305"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} antialiased font-display`}>
        <SiteTopAd />
        <Header />
        {children}
        <AdSenseDisplay
          variant="wide"
          wrapperClassName="bg-white py-6 border-t-2 border-charcoal/10"
        />
        <Footer />
        <BackToTopButton />
      </body>
    </html>
  );
}

