'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose prose-invert prose-lg max-w-none
      prose-headings:font-bold prose-headings:text-white
      prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-[#d4a017]
      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
      prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-[#d4a017] prose-a:no-underline hover:prose-a:underline
      prose-strong:text-white prose-strong:font-semibold
      prose-code:text-[#d4a017] prose-code:bg-[#1a1a1a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-blockquote:border-l-[#d4a017] prose-blockquote:bg-[#0d0d0d]/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-400
      prose-ul:text-gray-300 prose-ol:text-gray-300
      prose-li:marker:text-[#d4a017]
      prose-hr:border-gray-800
      prose-img:rounded-lg prose-img:border prose-img:border-gray-800
      prose-table:border-collapse
      prose-th:bg-[#141414] prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-gray-800 prose-th:text-left
      prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-800
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom link component to handle external links
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom image component
          img: ({ node, src, alt, ...props }) => (
            <img
              src={src}
              alt={alt || ''}
              className="w-full rounded-lg border border-gray-800"
              loading="lazy"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

