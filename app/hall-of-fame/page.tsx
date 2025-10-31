'use client';

import { useEffect, useState } from 'react';

export default function HallOfFame() {
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      {/* Navigation now comes from shared Header component */}


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

      
    </div>
  );
}
