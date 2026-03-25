import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackToTopButton from "./components/BackToTopButton";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "24jobsalerts - Premium Job Alerts Portal",
  description:
    "24jobsalerts helps you find the right government and private jobs faster with clean, structured job alerts and details.",
  icons: {
    icon: "/24jobsalertsfavicon.png",
    apple: "/24jobsalertsfavicon.png",
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
      </head>
      <body className={`${inter.variable} antialiased font-display`}>
        <Header />
        {children}
        <Footer />
        <BackToTopButton />
      </body>
    </html>
  );
}

