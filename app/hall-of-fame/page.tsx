'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X, BadgeDollarSign, Award as AwardIcon, MessageCircle, Twitter as TwitterIcon } from 'lucide-react';

export default function HallOfFame() {
  const [pinned, setPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      {/* Navigation */}
      <nav className={`nav-shell ${pinned ? 'is-pinned' : 'border-b border-gray-800'} flex items-center justify-between p-6`}>
        <a href="/" className="flex items-center gap-3">
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
        </a>
        <div className="hidden md:flex items-center gap-5">
          {pinned ? (
            <>
              <a href="/#pricing" aria-label="Pricing" className="text-gray-300 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 4.5V12c0 5-3.8 8.9-9 9-5.2-.1-9-4-9-9V7.5L12 3Zm0 4-5 2.5V12c0 3.9 2.9 6.9 6.8 7 3.9-.1 6.2-3.1 6.2-7V9.5L12 7Zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>
              </a>
              <a href="/hall-of-fame" aria-label="Hall of Fame" className="text-gray-300 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9.5 8H3l5 3.6L6.5 18 12 14.4 17.5 18 16 11.6 21 8h-6.5L12 2Z"/></svg>
              </a>
              <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-gray-300 hover:text-white transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.7 19.7 0 0 0 15.9 3l-.2.3c1.6.5 2.9 1.2 4.1 2.1-1.7-.8-3.3-1.3-4.9-1.6-.9.2-1.8.5-2.9.9-1.1-.4-2-.7-2.9-.9-1.7.3-3.3.8-4.9 1.6 1.2-.9 2.6-1.6 4.1-2.1L8.1 3A19.7 19.7 0 0 0 3.7 4.4C1.4 8 1 11.4 1.2 14.7c1.8 1.4 3.6 2.3 5.3 2.9l1.1-1.7c-.6-.2-1.1-.6-1.6-1 .3.2.7.3 1.1.5 2.3 1 4.8 1 7.1 0 .4-.2.8-.3 1.1-.5-.5.4-1 .8-1.6 1l1.1 1.7c1.7-.6 3.5-1.5 5.3-2.9.3-3.3-.2-6.7-2.5-10.3ZM8.8 13.6c-.7 0-1.3-.7-1.3-1.5 0-.9.6-1.5 1.3-1.5s1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm6.4 0c-.7 0-1.3-.7-1.3-1.5 0-.9.6-1.5 1.3-1.5s1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z"/></svg>
              </a>
              <a href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-300 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.543 7.48L22 22h-6.828l-4.77-6.223L4.8 22H2l7.028-8.04L2 2h6.828l4.325 5.77L18.244 2Zm-1.197 18h1.887L7.03 4h-1.89l10.906 16Z"/></svg>
              </a>
            </>
          ) : (
            <>
              <a href="/#pricing" className="hover:text-[#ff00cc] transition-colors">Pricing</a>
              <a href="/hall-of-fame" className="hover:text-[#ff00cc] transition-colors">Hall of Fame</a>
              <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff00cc] transition-colors">Discord</a>
              <a href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff00cc] transition-colors">Twitter</a>
            </>
          )}
        </div>
        {/* Mobile menu button */}
        <button aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="md:hidden text-gray-300 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 mt-2 w-[94%] max-w-[640px]" style={{ top: pinned ? 72 : 88 }}>
          <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-lg p-2 shadow-2xl">
            <a href="/#pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <BadgeDollarSign size={18} className="text-gray-300" />
              <span>Pricing</span>
            </a>
            <a href="/hall-of-fame" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <AwardIcon size={18} className="text-gray-300" />
              <span>Hall of Fame</span>
            </a>
            <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <MessageCircle size={18} className="text-gray-300" />
              <span>Discord</span>
            </a>
            <a href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
              <TwitterIcon size={18} className="text-gray-300" />
              <span>Twitter</span>
            </a>
          </div>
        </div>
      )}


      {/* Title */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">🏆 Hall of Fame</h1>
          <p className="text-gray-400">Placeholder wall for upcoming featured apps.</p>
        </div>
      </section>

      {/* Placeholder Wall */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Top: Biggest box with crown and $300 */}
          <div className="flex justify-center">
            <div className="relative w-full md:w-[820px] h-[220px] rounded-xl border-4 border-dashed border-yellow-400 grid place-items-center">
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl">👑</div>
              <div className="text-5xl font-extrabold text-yellow-400">$300</div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">1</div>

          {/* Middle: Nine white dotted boxes with $150 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => {
              const num = i + 2; // 2..10
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full rounded-lg border-2 border-dashed border-white/70 h-40 grid place-items-center">
                    <div className="text-3xl font-bold text-white">$150</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{num}</div>
                </div>
              );
            })}
          </div>

          {/* Bottom: 90 grey dotted boxes with $75 and index below */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4">
            {Array.from({ length: 90 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full h-24 rounded-md border border-dashed border-gray-700 grid place-items-center">
                  <div className="text-xl text-gray-300">$75</div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{i + 11}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer (matching home) */}
      <footer className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-16">
            <div>
              <div className="text-2xl font-bold text-white mb-3">Slopcel</div>
              <p className="text-gray-400 text-sm max-w-md mb-6">
                Deploy your slop in seconds. Built for speed, not for sanity.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300"><path d="M18.244 2H21l-6.543 7.48L22 22h-6.828l-4.77-6.223L4.8 22H2l7.028-8.04L2 2h6.828l4.325 5.77L18.244 2Zm-1.197 18h1.887L7.03 4h-1.89l10.906 16Z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 17.93c-2.83.48-5.43-.3-7.43-1.93h.01c.51-1.52 2.05-2.64 3.92-2.64H13v4.57ZM19.36 17.6A7.96 7.96 0 0 0 20 12c0-1.61-.48-3.11-1.31-4.36H18c-1.1 0-2 .9-2 2v1h-4V7h2V5h-2V4.07c.33-.05.66-.07 1-.07 4.42 0 8 3.58 8 8 0 1.61-.48 3.11-1.31 4.36h-.33Z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300"><path d="M12 12.713 2 6.75V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.75l-10 5.963ZM12 10 2 4h20L12 10Z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 17.93A8.001 8.001 0 0 1 4.07 13H11v6.93ZM4.07 11A8.001 8.001 0 0 1 11 4.07V11H4.07ZM13 4.07A8.001 8.001 0 0 1 19.93 11H13V4.07ZM13 13h6.93A8.001 8.001 0 0 1 13 19.93V13Z"/></svg>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div>
                <div className="text-gray-200 font-semibold mb-3">Product</div>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Overview</a></li>
                  <li><a href="#" className="hover:text-white">Docs</a></li>
                  <li><a href="#" className="hover:text-white">Changelog</a></li>
                </ul>
              </div>
              <div>
                <div className="text-gray-200 font-semibold mb-3">Company</div>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">About</a></li>
                  <li><a href="#" className="hover:text-white">Careers</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <div className="text-gray-200 font-semibold mb-3">Legal</div>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                </ul>
              </div>
              <div>
                <div className="text-gray-200 font-semibold mb-3">More</div>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Hall of Fame</a></li>
                  <li><a href="#" className="hover:text-white">Status</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>© 2025 Slopcel. All rights reserved.</div>
            <div className="text-gray-500">Made with ❤️ and caffeine.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
