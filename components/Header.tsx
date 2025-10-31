'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, BadgeDollarSign, Award, MessageCircle, Twitter as TwitterIcon } from 'lucide-react';
import { links } from '@/constants';

export default function Header() {
  const [pinned, setPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`nav-shell ${pinned ? 'is-pinned' : 'border-b border-gray-800'} flex items-center justify-between p-6`}>
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-8 w-8 overflow-hidden rounded-md">
            <Image
              src="https://pbs.twimg.com/profile_images/1979532596615802880/dNH0WjJ4_400x400.jpg"
              alt="Slopcel logo"
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
          <span className="text-xl md:text-2xl font-bold text-white">Slopcel</span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {pinned ? (
            <>
              <Link href="/#pricing" aria-label="Pricing" className="nav-link text-gray-300">
                <img src="/icons/price.svg" alt="" height={20} width={20}/>
              </Link>
              <Link href="/hall-of-fame" aria-label="Hall of Fame" className="nav-link text-gray-300">
                <img src="/icons/trophy.svg" alt="" height={20} width={20}/>
              </Link>
              <Link href={links['discord']} target="_blank" rel="noopener noreferrer" aria-label="Discord" className="nav-link text-gray-300">
                <img src="/icons/discord.svg" alt="" height={20} width={20}/>
              </Link>
              <Link href={links['twitter']} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="nav-link text-gray-300">
                <img src="/icons/twitter.svg" alt="" height={20} width={20}/>
              </Link>
            </>
          ) : (
            <>
              <Link href="/#pricing" className="nav-link text-gray-300">Pricing</Link>
              <Link href="/hall-of-fame" className="nav-link text-gray-300">Hall of Fame</Link>
              <Link href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="nav-link text-gray-300">Discord</Link>
              <Link href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" className="nav-link text-gray-300">Twitter</Link>
            </>
          )}
        </div>

        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 mt-2 w-[94%] max-w-[640px]" style={{ top: pinned ? 72 : 88 }}>
          <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-lg p-2 shadow-2xl">
            <Link href="/#pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <img src="/icons/price.svg" alt="" height={20} width={20}/>
              <span>Pricing</span>
            </Link>
            <Link href="/hall-of-fame" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              {/* <Award size={18} className="text-gray-300" /> */}
              <img src="/icons/trophy.svg" alt="" height={20} width={20}/>
              <span>Hall of Fame</span>
            </Link>
            <Link href="https://discord.com/" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <img src="/icons/discord.svg" alt="" height={20} width={20}/>
              <span>Discord</span>
            </Link>
            <Link href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <img src="/icons/twitter.svg" alt="" height={20} width={20}/>
              <span>Twitter</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}


