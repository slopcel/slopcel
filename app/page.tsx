'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Home() {
  useEffect(() => {
    // Easter egg console log
    console.log("Welcome to Slopcel — haha if you see this send me a dm that says 'Cow'.");
    
  }, []);

  
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  useEffect(() => {}, []);

  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      {/* Navigation now rendered from shared Header component */}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Subtle, smaller hero gradient */}
        <div className="hero-gradient"></div>
        
        {/* Floating particles removed for a cleaner, larger hero backdrop */}
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-8xl font-bold mb-6 text-white">
           Vercel for Vibecoded Projects
          </h1>
          <p className="text-lg md:text-2xl mb-10 text-gray-300 max-w-2xl mx-auto">
            Slopcel is the world's worst hosting platform. Built by AI, for AI — and possibly for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button className="btn-primary hover-shake">
              Submit an Idea
            </button>
            <Link href="/projects" className="btn-inverse">View the Slop</Link>
          </div>
          
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[320px_1fr] gap-10 md:gap-12 items-start">
            {/* Profile image (centered) */}
            <div className="mx-auto md:mx-0 w-[320px]">
              <div className="rounded-xl border border-gray-800 bg-[#141414] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex items-center justify-center">
                <div className="relative h-44 w-44 rounded-2xl overflow-hidden">
                  <Image
                    src="https://pbs.twimg.com/profile_images/1742232317178060800/CBBMsEg0_400x400.jpg"
                    alt="Madiou profile picture"
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Narrative text */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Hey, it's Madiou <span role="img" aria-label="waving hand">👋</span></h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                  I hate AI vibecoded slop and I hate Vercel. However I cannot deny how powerful vibecoding is, so I decided to kill 2 birds with one stone by building my own hosting platform.             
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                Despite the hilarious name and the unserious presentation of this website, I do want to try my hand at vibecoding, and for that I need your help.
                Unlike Vercel, where anyone can deploy their project, this website is solely dedicated to my vibecoded slop. But you can submit your own ideas and they will be deployed by me. Here is how it works:
              </p>
              <ol className="list-decimal pl-6 space-y-3 text-gray-200 mb-8">
                <li><span className="font-semibold">Submit an idea</span>—by either paying a fee or by reaching out to me on my Twitter posts</li>
                <li><span className="font-semibold">I will build and deploy it</span>—if I like the idea or if there is enough popular demand</li>
                <li><span className="font-semibold">For those who pay premium</span>—your project will be immediately accepted and appear on the hall of fame</li>
              </ol>

              <p className="text-gray-300">
                <Link href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-90">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                    <path d="M18.244 2H21l-6.543 7.48L22 22h-6.828l-4.77-6.223L4.8 22H2l7.028-8.04L2 2h6.828l4.325 5.77L18.244 2Zm-1.197 18h1.887L7.03 4h-1.89l10.906 16Z"/>
                  </svg>
                  <span className="underline">Follow on X (Twitter)</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apps Section */}
      {/* <section id="projects" className="py-20 px-6 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            🧩 Featured Slop
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Some of the finest dumpster fires hosted on Slopcel.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#ff6b6b] to-[#ff8c42] rounded mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Calculator Yeller</h3>
              <p className="text-gray-400 mb-4">Screams math results at you</p>
              <button className="btn-secondary w-full">Visit App</button>
            </div>
            
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#ff8c42] to-[#ffd93d] rounded mb-4"></div>
              <h3 className="text-xl font-bold mb-2">AI That Apologizes</h3>
              <p className="text-gray-400 mb-4">An app that can't stop saying sorry</p>
              <button className="btn-secondary w-full">Visit App</button>
            </div>
            
            <div className="card-hover bg-[#0d0d0d] p-6 rounded-lg border border-gray-800">
              <div className="w-full h-32 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] rounded mb-4"></div>
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
      </section> */}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            💰 Pricing
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Choose your level of slop
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-[800px] mx-auto items-stretch justify-center">
            {/* Free Tier */}
            <div className="card-hover bg-[#0d0d0d] justify-center max-w-[380px] p-8 rounded-lg border border-gray-800 relative flex">
              <div className="text-center flex flex-col w-full">
                <h3 className="text-2xl font-bold mb-2">The Bare Minimum</h3>
                <div className="text-4xl font-bold text-white mb-4">$50</div>
                <p className="text-gray-400 mb-6">Host 1 slop app</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 1 app deployment</li>
                  <li>✓ Complete access to code and repo</li>
                  <li>✓ Complimentary regret</li>
                  <li>✗ Support (I'm busy)</li>
                </ul>
                <button className="btn-secondary w-full mt-auto">Get Started</button>
              </div>
            </div>
            
            {/* Pro Tier */}
            <div className="card-hover bg-[#0d0d0d] max-w-[380px] p-8 rounded-lg border border-gray-800 relative flex">
              <div className="text-center flex flex-col w-full">
                <h3 className="text-2xl font-bold mb-2">Hall of Famer</h3>
                <div className="text-4xl font-bold text-white mb-4">$75</div>
                <p className="text-gray-400 mb-6">1 app, and an entry in hall of fame</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 1 app deployment</li>
                  <li>✓ Placement in hall of fame</li>
                  <li>✓ Slightly better design</li>
                  <li>✓ Premium functionalities like auth and analytics</li>
                  <li>✓ Complete access to code and repo</li>
                  <li>✓ Complimentary regret</li>
                  <li>✓ Actual support (up to 3 revisions)</li>
                </ul>
                <button className="btn-primary w-full mt-auto">Get your spot</button>
              </div>
            </div>
            
            {/* Enterprise Tier */}
            {/* <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border border-gray-800 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Custom Needs</h3>
                <div className="text-4xl font-bold gradient-text mb-4">$$$</div>
                <p className="text-gray-400 mb-6">For more serious enquiries</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ Real apps</li>
                  <li>✓ Bring your idea to life</li>
                  <li>✓ Actual human effort and supervision</li>
                  <li>✓ Maximum chaos</li>
                  <li>✓ VIP</li>
                </ul>
                <button className="btn-secondary w-full">Contact AI</button>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

{/* FAQ Section */}
<section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">FAQ</h2>
          <p className="text-center text-gray-400 mb-10">Answers to common questions</p>

          {[
            { q: 'What is Slopcel?', a: 'A parody hosting platform for vibecoded slop—projects are built and deployed manually by me.' },
            { q: 'Can I submit an idea?', a: 'Yes. Pay a fee or rally interest on Twitter; if I like it, I will build and deploy.' },
            { q: 'Will my app be online forever?', a: 'No guarantees. This is for fun—expect experiments and occasional chaos.' },
          ].map((item, i) => {
            const isOpen = faqOpenIndex === i;
            return (
              <div key={i} className="mb-3">
                <button
                  onClick={() => setFaqOpenIndex(isOpen ? null : i)}
                  className="w-full text-left rounded-xl border border-gray-800 bg-[#0d0d0d] hover:bg-[#111] transition-colors p-5 flex items-start justify-between gap-6"
                  aria-expanded={isOpen}
                >
                  <div>
                    <div className="text-white font-semibold mb-1">{item.q}</div>
                    {isOpen && (
                      <div className="text-gray-400 leading-relaxed">{item.a}</div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-md border border-gray-800 p-2 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                    <Plus size={18} className="text-gray-300" />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>      
    </div>
  );
}