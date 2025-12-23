'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';

interface AdminNavbarProps {
  onMenuClick: () => void;
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-black border-b border-gray-800">
      <div className="flex items-center h-16 px-4">
        {/* Hamburger Menu - visible on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 mr-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo and Title */}
        <Link href="/admin" className="flex items-center gap-3">
          <span className="relative h-8 w-8 overflow-hidden rounded-md">
            <Image
              src="/slopcel-logo.jpg"
              alt="Slopcel logo"
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
          <span className="text-xl font-bold text-white">Slopcel</span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-[#d4a017]/20 text-[#d4a017] rounded">
            Admin
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Back to Site Link */}
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </nav>
  );
}

