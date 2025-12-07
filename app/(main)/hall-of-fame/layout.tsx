import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "The legendary slop apps that made it to the Hall of Fame. See the top AI-generated projects deployed on Slopcel and get your own spot.",
  keywords: [
    "Hall of Fame",
    "top AI apps",
    "best slop apps",
    "featured projects",
    "AI showcase",
    "deployed apps",
  ],
  openGraph: {
    title: "Hall of Fame | Slopcel",
    description: "The legendary slop apps that made it to the Hall of Fame. See the top AI-generated projects deployed on Slopcel.",
    images: [
      {
        url: "/og-images/hall-of-fame-og-image.png",
        width: 1200,
        height: 630,
        alt: "Slopcel Hall of Fame - Top AI Apps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hall of Fame | Slopcel",
    description: "The legendary slop apps that made it to the Hall of Fame.",
    images: ["/og-images/hall-of-fame-og-image.png"],
  },
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

