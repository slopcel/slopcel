import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Slopcel's terms of service. Read our terms and conditions for using our platform.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

