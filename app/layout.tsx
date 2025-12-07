import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import PlausibleProvider from "@/components/PlausibleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://slopcel.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Slopcel - We Deploy Your Slop Apps",
    template: "%s | Slopcel",
  },
  description: "Slopcel is the world's worst hosting platform. Built by AI, for AI — and possibly for you. Deploy your AI-generated apps and join the Hall of Fame.",
  keywords: [
    "AI apps",
    "slop apps",
    "AI hosting",
    "deploy AI apps",
    "AI generated",
    "vibe coding",
    "Hall of Fame",
    "app deployment",
  ],
  authors: [{ name: "Madiou", url: "https://x.com/_madiou" }],
  creator: "Madiou",
  publisher: "Slopcel",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Slopcel",
    title: "Slopcel - We Deploy Your Slop Apps",
    description: "The world's worst hosting platform. Built by AI, for AI — and possibly for you. Deploy your AI-generated apps and join the Hall of Fame.",
    images: [
      {
        url: "/og-images/main-og-image.png",
        width: 1200,
        height: 630,
        alt: "Slopcel - We Deploy Your Slop Apps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Slopcel - We Deploy Your Slop Apps",
    description: "The world's worst hosting platform. Built by AI, for AI — and possibly for you.",
    images: ["/og-images/main-og-image.png"],
    creator: "@_madiou",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/slopcel-logo.jpg",
  },
  manifest: "/manifest.json",
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Slopcel",
  url: siteUrl,
  description: "The world's worst hosting platform. Built by AI, for AI — and possibly for you.",
  publisher: {
    "@type": "Organization",
    name: "Slopcel",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/slopcel-logo.jpg`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/projects?q={search_term_string}`,
    "query-input": "required name=search_term_string",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlausibleProvider />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
