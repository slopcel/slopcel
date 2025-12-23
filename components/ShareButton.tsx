'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
    >
      <Share2 size={18} />
      Share
    </button>
  );
}

