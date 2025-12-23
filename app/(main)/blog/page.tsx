import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export const runtime = 'edge';

export const metadata = {
  title: 'Blog',
  description: 'Read our latest articles, tutorials, and updates about web development and AI-powered app deployment.',
};

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default async function BlogPage() {
  const supabase = await createClient();
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4a017]/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              The Slopcel Blog
            </h1>
            <p className="text-lg sm:text-xl text-gray-400">
              Insights, tutorials, and updates from the world of AI-powered app deployment
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          {!posts || posts.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-16">
              <h2 className="text-2xl font-bold text-white mb-2">No posts yet</h2>
              <p className="text-gray-400">
                We&apos;re working on some great content. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden hover:border-[#d4a017]/50 transition-all duration-300 hover:-translate-y-1 ${
                    index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`relative overflow-hidden ${index === 0 ? 'h-64 sm:h-80' : 'h-48'}`}>
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#d4a017]/20 to-[#d4a017]/5 flex items-center justify-center">
                        <span className="text-6xl opacity-50">📄</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {estimateReadingTime(post.content)} min read
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className={`font-bold text-white mb-2 group-hover:text-[#d4a017] transition-colors ${
                      index === 0 ? 'text-xl sm:text-2xl' : 'text-lg'
                    }`}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className={`text-gray-400 mb-4 ${index === 0 ? 'line-clamp-3' : 'line-clamp-2'}`}>
                        {post.excerpt}
                      </p>
                    )}

                    {/* Read More */}
                    <div className="flex items-center gap-2 text-[#d4a017] text-sm font-medium group-hover:gap-3 transition-all">
                      Read more
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

