import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import BlogContent from '@/components/BlogContent';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on the Slopcel blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on the Slopcel blog`,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      images: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read ${post.title} on the Slopcel blog`,
      images: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !post) {
    notFound();
  }

  const readingTime = estimateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Image */}
      {post.thumbnail_url && (
        <div className="relative h-64 sm:h-80 lg:h-96 w-full">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className={`relative ${post.thumbnail_url ? '-mt-32' : 'pt-8'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to blog
            </Link>

            {/* Title & Meta */}
            <header className="mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-400">
                <span className="flex items-center gap-2">
                  <Calendar size={18} />
                  {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={18} />
                  {readingTime} min read
                </span>
              </div>

              {post.excerpt && (
                <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Content */}
            <div className="prose-container">
              <BlogContent content={post.content} />
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link 
                  href="/blog" 
                  className="flex items-center gap-2 text-[#d4a017] hover:underline"
                >
                  <ArrowLeft size={18} />
                  More articles
                </Link>
                
                <ShareButton title={post.title} />
              </div>
            </footer>
          </div>
        </div>
      </article>

      {/* Spacer */}
      <div className="h-16 sm:h-24" />
    </div>
  );
}

