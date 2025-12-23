import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest articles, tutorials, and updates about web development and AI-powered app deployment.',
  openGraph: {
    title: 'Blog | Slopcel',
    description: 'Read our latest articles, tutorials, and updates about web development and AI-powered app deployment.',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

