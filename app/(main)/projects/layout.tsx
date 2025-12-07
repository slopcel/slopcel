import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore all the slop apps deployed on Slopcel. Browse AI-generated projects and get inspired for your next build.",
  openGraph: {
    title: "Projects | Slopcel",
    description: "Explore all the slop apps deployed on Slopcel. Browse AI-generated projects.",
    images: [
      {
        url: "/og-images/main-og-image.png",
        width: 1200,
        height: 630,
        alt: "Slopcel Projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Slopcel",
    description: "Explore all the slop apps deployed on Slopcel.",
    images: ["/og-images/main-og-image.png"],
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

