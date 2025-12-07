import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your Slopcel orders and projects from your personal dashboard.",
  robots: {
    index: false, // Don't index user dashboards
    follow: false,
  },
};

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
