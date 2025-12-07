import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Slopcel's refund policy. Learn about our refund terms and conditions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

