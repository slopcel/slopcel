'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Easter egg console log
    console.log("Welcome to Slopcel — where dreams go to debug.");
    
    // Add some interactive functionality
    const handleButtonClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.textContent?.includes('Submit an Idea')) {
        alert('Error: Too much slop detected. Please try again later.');
      } else if (target.textContent?.includes('Deploy')) {
        alert('Error: Deployment failed. Your slop was too sloppy.');
      }
    };

    // Add click listeners to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', handleButtonClick);
    });

    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', handleButtonClick);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f8f8f8]">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="text-2xl font-bold gradient-text pulse-neon">
          Slopcel
        </div>
        <div className="flex gap-6">
          <a href="#about" className="hover:text-[#ff00cc] transition-colors">About</a>
          <a href="#projects" className="hover:text-[#ff00cc] transition-colors">Projects</a>
          <a href="#pricing" className="hover:text-[#ff00cc] transition-colors">Pricing</a>
          <a href="/hall-of-fame" className="hover:text-[#ff00cc] transition-colors">Hall of Fame</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background gradient streak */}
        <div className="absolute inset-0 neon-gradient opacity-10 blur-3xl"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#ff00cc] rounded-full floating"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-[#00ffff] rounded-full floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-[#8b5cf6] rounded-full floating" style={{animationDelay: '4s'}}></div>
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text">
            Deploy your slop in seconds.
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-2xl mx-auto">
            Slopcel is the world's worst hosting platform. Built by AI, for AI — and possibly for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="btn-primary hover-shake">
              Submit an Idea
            </button>
            <button className="btn-secondary hover-glow">
              View the Slop
            </button>
          </div>
          
          {/* Fake Deploy Button */}
          <div className="mt-8">
            <button className="btn-primary hover-shake opacity-50">
              Deploy Now (Doesn't Work)
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="w-64 h-64 mx-auto bg-gradient-to-br from-[#ff00cc] to-[#00ffff] rounded-full glow-pink"></div>
              <div className="absolute inset-0 w-64 h-64 mx-auto bg-black rounded-full opacity-20"></div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6 gradient-text">
                About Slopcel
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Slopcel is a parody platform built to celebrate the art of bad automation.
                You submit an idea → AI builds it → We deploy it → Chaos ensues.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Follow the madness on <a href="#" className="text-[#ff00cc] hover:underline">Twitter → @slopcel</a>
              </p>
              <p className="text-xs text-gray-600">
                Made by humans (for now)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apps Section */}
      <section id="projects" className="py-20 px-6 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 gradient-text">
            🧩 Featured Slop
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Some of the finest dumpster fires hosted on Slopcel.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#ff00cc] to-[#8b5cf6] rounded mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Calculator Yeller</h3>
              <p className="text-gray-400 mb-4">Screams math results at you</p>
              <button className="btn-secondary w-full">Visit App</button>
            </div>
            
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#00ffff] to-[#ff00cc] rounded mb-4"></div>
              <h3 className="text-xl font-bold mb-2">AI That Apologizes</h3>
              <p className="text-gray-400 mb-4">An app that can't stop saying sorry</p>
              <button className="btn-secondary w-full">Visit App</button>
            </div>
            
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#8b5cf6] to-[#00ffff] rounded mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Moodboard Generator</h3>
              <p className="text-gray-400 mb-4">For moods you didn't ask for</p>
              <button className="btn-secondary w-full">Visit App</button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <button className="btn-primary">
              View More Slop
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 gradient-text">
            💰 Pricing (Parody Style)
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Choose your level of chaos
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border border-gray-800 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">The Bare Minimum</h3>
                <div className="text-4xl font-bold gradient-text mb-4">$0</div>
                <p className="text-gray-400 mb-6">Host 1 slop app. No refunds.</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 1 app deployment</li>
                  <li>✓ No uptime guarantee</li>
                  <li>✓ Complimentary regret</li>
                  <li>✗ Support (we're busy)</li>
                </ul>
                <button className="btn-secondary w-full">Get Started</button>
              </div>
            </div>
            
            {/* Pro Tier */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border-2 border-[#ff00cc] relative glow-pink">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#ff00cc] text-black px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">More Slop</h3>
                <div className="text-4xl font-bold gradient-text mb-4">$4.99/mo</div>
                <p className="text-gray-400 mb-6">10 apps, more chaos, still no uptime guarantee.</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 10 app deployments</li>
                  <li>✓ Slightly better errors</li>
                  <li>✓ Premium regret</li>
                  <li>✓ AI support (maybe)</li>
                </ul>
                <button className="btn-primary w-full">Go Pro</button>
              </div>
            </div>
            
            {/* Enterprise Tier */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border border-gray-800 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Maximum Slop</h3>
                <div className="text-4xl font-bold gradient-text mb-4">$$$</div>
                <p className="text-gray-400 mb-6">100+ apps, unlimited nonsense. Contact our AI sales rep.</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ Unlimited apps</li>
                  <li>✓ Maximum chaos</li>
                  <li>✓ VIP regret</li>
                  <li>✓ AI sales rep</li>
                </ul>
                <button className="btn-secondary w-full">Contact AI</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 gradient-text">
            What People Are Saying
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <p className="text-lg italic mb-4">"It deployed my app and my sanity."</p>
              <p className="text-gray-400">– Anonymous Developer</p>
            </div>
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <p className="text-lg italic mb-4">"Vercel but after 3 drinks."</p>
              <p className="text-gray-400">– Tech Blogger</p>
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
              <a href="/hall-of-fame" className="text-gray-400 hover:text-[#ff00cc] transition-colors">Hall of Fame</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}