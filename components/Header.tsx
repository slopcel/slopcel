'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { links } from '@/constants';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [pinned, setPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        menuButtonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      if (user) {
        // Check admin status via API (does not leak email)
        try {
          const res = await fetch('/api/auth/check-admin', { cache: 'no-store' });
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <>
      <nav className={`nav-shell ${pinned ? 'is-pinned' : 'border-b border-gray-800'} flex items-center justify-between p-6`}>
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-8 w-8 overflow-hidden rounded-md">
            <Image
              src="/slopcel-logo.jpg"
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
              {isLoggedIn && (
                <Link href={isAdmin ? '/admin' : '/dashboard'} aria-label="Dashboard" className="nav-link text-gray-300">
                  <LayoutDashboard size={20} />
                </Link>
              )}
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
              {isLoggedIn && (
                <Link href={isAdmin ? '/admin' : '/dashboard'} className="nav-link text-gray-300">Dashboard</Link>
              )}
              <Link href="/#pricing" className="nav-link text-gray-300">Pricing</Link>
              <Link href="/hall-of-fame" className="nav-link text-gray-300">Hall of Fame</Link>
              <Link href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="nav-link text-gray-300">Discord</Link>
              <Link href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" className="nav-link text-gray-300">Twitter</Link>
            </>
          )}
        </div>

        <button
          ref={menuButtonRef}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div ref={menuRef} className="fixed left-1/2 -translate-x-1/2 z-40 mt-2 w-[94%] max-w-[640px]" style={{ top: pinned ? 72 : 88 }}>
          <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-lg p-2 shadow-2xl text-gray-300">
            {isLoggedIn && (
              <Link href={isAdmin ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
                <LayoutDashboard size={18} className="text-gray-300" />
                <span>Dashboard</span>
              </Link>
            )}
            <Link href="/#pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <img src="/icons/price.svg" alt="" height={20} width={20}/>
              <span>Pricing</span>
            </Link>
            <Link href="/hall-of-fame" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
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


