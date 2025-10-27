'use client';

export default function HallOfFame() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f8f8f8]">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold gradient-text pulse-neon">
          Slopcel
        </a>
        <div className="flex gap-6">
          <a href="/#about" className="hover:text-[#ff00cc] transition-colors">About</a>
          <a href="/#projects" className="hover:text-[#ff00cc] transition-colors">Projects</a>
          <a href="/#pricing" className="hover:text-[#ff00cc] transition-colors">Pricing</a>
          <a href="/hall-of-fame" className="text-[#ff00cc] font-bold">Hall of Fame</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 gradient-text">
            🏆 Hall of Fame
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Behold the greatest slop ever deployed.
          </p>
          <p className="text-lg text-gray-400">
            These brave creators paid their way to the top of the garbage heap.
          </p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-20 px-6 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* First Place */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border-2 border-yellow-400 relative">
              <div className="absolute -top-4 left-6 bg-yellow-400 text-black px-4 py-2 rounded-full text-lg font-bold">
                🥇 #1
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg glow-pink"></div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2">The Ultimate Slop Generator</h3>
                  <p className="text-gray-400 mb-4">
                    An AI that generates increasingly worse code until your app becomes sentient and starts debugging itself.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">Slop Rating:</span>
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                    <span className="text-yellow-400 font-bold">100/100</span>
                  </div>
                  <button className="btn-primary">Launch App</button>
                </div>
              </div>
            </div>

            {/* Second Place */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border-2 border-gray-400 relative">
              <div className="absolute -top-4 left-6 bg-gray-400 text-black px-4 py-2 rounded-full text-lg font-bold">
                🥈 #2
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg glow-cyan"></div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2">Error Message Poetry</h3>
                  <p className="text-gray-400 mb-4">
                    Turns your 404 errors into beautiful haikus. Sometimes crashes while generating the poem.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">Slop Rating:</span>
                    <div className="flex">
                      {[...Array(9)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                      <span className="text-gray-400">⭐</span>
                    </div>
                    <span className="text-yellow-400 font-bold">95/100</span>
                  </div>
                  <button className="btn-secondary">Launch App</button>
                </div>
              </div>
            </div>

            {/* Third Place */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border-2 border-orange-400 relative">
              <div className="absolute -top-4 left-6 bg-orange-400 text-black px-4 py-2 rounded-full text-lg font-bold">
                🥉 #3
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg glow-purple"></div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2">Loading Screen Simulator</h3>
                  <p className="text-gray-400 mb-4">
                    A loading screen that loads loading screens. The loading never ends, but the animations are mesmerizing.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">Slop Rating:</span>
                    <div className="flex">
                      {[...Array(8)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                      <span className="text-gray-400">⭐⭐</span>
                    </div>
                    <span className="text-yellow-400 font-bold">88/100</span>
                  </div>
                  <button className="btn-secondary">Launch App</button>
                </div>
              </div>
            </div>

            {/* Honorable Mentions */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-8 gradient-text">
                Honorable Mentions
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
                  <h4 className="text-xl font-bold mb-2">#4 - Password Generator</h4>
                  <p className="text-gray-400 mb-4">Generates passwords so secure, even you can't remember them.</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">Rating:</span>
                    <span className="text-yellow-400 font-bold">85/100</span>
                  </div>
                  <button className="btn-secondary w-full">Launch</button>
                </div>
                
                <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
                  <h4 className="text-xl font-bold mb-2">#5 - Weather App</h4>
                  <p className="text-gray-400 mb-4">Shows weather for cities that don't exist. Very accurate.</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">Rating:</span>
                    <span className="text-yellow-400 font-bold">82/100</span>
                  </div>
                  <button className="btn-secondary w-full">Launch</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold gradient-text mb-2">Slopcel</div>
              <p className="text-gray-400 text-sm">
                © 2025 Slopcel. All rights reserved (for some reason).
              </p>
              <p className="text-gray-500 text-xs">
                Made with ❤️, irony, and a lot of caffeine.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-[#ff00cc] transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-[#ff00cc] transition-colors">GitHub</a>
              <a href="#" className="text-gray-400 hover:text-[#ff00cc] transition-colors">Privacy</a>
              <a href="/hall-of-fame" className="text-[#ff00cc] font-bold">Hall of Fame</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
