'use client';

import { useEffect, useState } from 'react';

interface TweetEmbedProps {
  tweetUrl: string;
}

interface TweetData {
  author_name: string;
  author_url: string;
  html: string;
}

// Extract tweet info from URL
function extractTweetInfo(url: string): { username: string; tweetId: string } | null {
  const pattern = /(?:twitter\.com|x\.com)\/(\w+)\/status(?:es)?\/(\d+)/;
  const match = url.match(pattern);
  if (match) {
    return { username: match[1], tweetId: match[2] };
  }
  return null;
}

// Extract tweet text from oEmbed HTML response
function extractTweetText(html: string): string | null {
  // The oEmbed HTML contains the tweet text in a <p> tag
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (match) {
    // Remove HTML tags and decode entities
    let text = match[1]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
    return text || null;
  }
  return null;
}

// Check if a string contains a Twitter/X URL
export function containsTweetUrl(text: string): string | null {
  const urlPattern = /(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status(?:es)?\/\d+)/gi;
  const match = text.match(urlPattern);
  return match ? match[0] : null;
}

export default function TweetEmbed({ tweetUrl }: TweetEmbedProps) {
  const [tweetText, setTweetText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tweetInfo = extractTweetInfo(tweetUrl);

  useEffect(() => {
    if (!tweetInfo) {
      setLoading(false);
      return;
    }

    const fetchTweetData = async () => {
      try {
        // Use Twitter's oEmbed API (doesn't require auth)
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true&hide_media=true&hide_thread=true`;
        const response = await fetch(oembedUrl);
        
        if (response.ok) {
          const data: TweetData = await response.json();
          const text = extractTweetText(data.html);
          setTweetText(text);
        }
      } catch (err) {
        console.error('Error fetching tweet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTweetData();
  }, [tweetUrl, tweetInfo]);

  if (!tweetInfo) {
    return null;
  }

  return (
    <a 
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 p-4 bg-[#141414] border border-gray-700 rounded-xl hover:border-[#1DA1F2]/50 hover:bg-[#1a1a1a] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0 border border-gray-700">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white font-medium text-sm group-hover:text-[#1DA1F2] transition-colors">
              @{tweetInfo.username}
            </span>
          </div>
          
          {/* Tweet text */}
          {loading ? (
            <div className="h-4 w-3/4 bg-gray-700/50 rounded animate-pulse" />
          ) : tweetText ? (
            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
              {tweetText}
            </p>
          ) : (
            <p className="text-gray-500 text-xs">
              View post on X
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
            <span>View on X</span>
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}
