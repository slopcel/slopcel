'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ArrowRight, User } from 'lucide-react';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface ProjectProfile {
  display_name: string | null;
  avatar_url: string | null;
  twitter_url: string | null;
  is_anonymous: boolean;
}

interface FeaturedProject {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  user_id: string | null;
  created_at: string;
  profile?: ProjectProfile | null;
}

export default function Home() {
  useEffect(() => {
    // Easter egg console log
    console.log("Welcome to Slopcel — haha if you see this send me a dm that says 'Cow'.");
    
  }, []);

  
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<FeaturedProject | null>(null);
  const [availability, setAvailability] = useState<{
    premium: boolean | null;
    standard: boolean | null;
    hallOfFame: boolean | null;
  }>({
    premium: null,
    standard: null,
    hallOfFame: null,
  });

  useEffect(() => {
    checkAvailability();
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    const supabase = createClient();
    
    // Fetch featured projects (limit to 6 for the homepage)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    if (projects && projects.length > 0) {
      // Get unique user IDs
      const userIds = new Set(projects.map(p => p.user_id).filter(Boolean));
      
      // Fetch profiles for project creators
      let profilesMap: Record<string, ProjectProfile> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, twitter_url, is_anonymous')
          .in('id', Array.from(userIds));
        
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = {
              display_name: p.display_name,
              avatar_url: p.avatar_url,
              twitter_url: p.twitter_url,
              is_anonymous: p.is_anonymous,
            };
          });
        }
      }

      // Merge profiles with projects
      const projectsWithProfiles = projects.map(project => ({
        ...project,
        profile: project.user_id ? profilesMap[project.user_id] || null : null,
      }));

      setFeaturedProjects(projectsWithProfiles);
    }
  };

  const checkAvailability = async () => {
    const supabase = createClient();
    
    // Check each tier
    const [premium, standard, hallOfFame] = await Promise.all([
      supabase.rpc('check_tier_availability', { amount_cents: 30000 }),
      supabase.rpc('check_tier_availability', { amount_cents: 15000 }),
      supabase.rpc('check_tier_availability', { amount_cents: 7500 }),
    ]);

    setAvailability({
      premium: premium.data ?? null,
      standard: standard.data ?? null,
      hallOfFame: hallOfFame.data ?? null,
    });
  };

  const handleSubmitIdea = async () => {
    // Redirect to pricing section
    window.location.href = '#pricing';
  };

  const handleCheckout = async (tier: 'bare_minimum' | 'premium' | 'standard' | 'hall_of_fame') => {
    setLoading(true);
    try {
      const response = await fetch('/api/dodo/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      // Read body as text first, then parse as JSON
      const text = await response.text();
      let data: any = null;
      
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Non-JSON response from create-checkout:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 500), // First 500 chars
        });
        // Show more helpful error based on status
        if (response.status === 500) {
          toast.error('Server error. Check console for details.', {
            description: text.substring(0, 100),
            duration: 10000,
          });
        } else if (response.status === 404) {
          toast.error('Payment endpoint not found. Please contact support.');
        } else {
          toast.error(`Payment service error (${response.status})`, {
            description: text.substring(0, 100),
            duration: 10000,
          });
        }
        setLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        // Log detailed error info for debugging
        console.error('Checkout error:', {
          code: data.code,
          error: data.error,
          details: data.details,
          tier: data.tier,
        });
        
        // Show user-friendly error message
        toast.error(data.error, {
          duration: 5000,
          description: data.code === 'TIER_SOLD_OUT' 
            ? 'Check other tiers for availability.' 
            : data.code === 'RATE_LIMITED'
            ? 'Please wait a moment before trying again.'
            : undefined,
        });
        setLoading(false);
        
        // Refresh availability if tier sold out
        if (data.code === 'TIER_SOLD_OUT') {
          checkAvailability();
        }
      } else {
        toast.error('Failed to create checkout. Please try again.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error?.message || 'Connection error. Please check your internet and try again.');
      setLoading(false);
    }
  };

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
            <button 
              onClick={handleSubmitIdea}
              className="btn-primary hover-shake"
            >
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
                    src="/madiou_logo.jpg"
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

      {/* Featured Projects Section - Only show if there are projects */}
      {featuredProjects.length > 0 && (
        <section id="projects" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              Featured Projects
            </h2>
            <p className="text-center text-gray-400 mb-12">
              Some of the finest dumpster fires hosted on Slopcel.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => {
                const showProfile = project.profile && !project.profile.is_anonymous;
                
                return (
                  <div 
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="card-hover bg-[#0d0d0d] rounded-xl border border-gray-800 overflow-hidden cursor-pointer group"
                  >
                    {/* Project Image */}
                    {project.image_url ? (
                      <div className="relative w-full h-40 overflow-hidden">
                        <Image
                          src={project.image_url}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-[#d4a017]/20 to-[#d4a017]/5" />
                    )}
                    
                    <div className="p-5">
                      {/* Creator Profile */}
                      {showProfile && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                            {project.profile?.avatar_url ? (
                              <img
                                src={project.profile.avatar_url}
                                alt={project.profile.display_name || 'Creator'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="text-gray-500 w-3 h-3" />
                            )}
                          </div>
                          <span className="text-gray-400 text-xs truncate">
                            {project.profile?.display_name || 'Anonymous'}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{project.name}</h3>
                      {project.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-10">
              <Link 
                href="/projects" 
                className="btn-primary bg-white text-black  inline-flex items-center gap-2"
              >
                View More Slop
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            Pricing
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Choose your level of slop
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[800px] mx-auto items-stretch">
            {/* Bare Minimum - $50 */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border border-gray-800 relative flex">
              <div className="text-center flex flex-col w-full">
                <h3 className="text-2xl font-bold mb-2">The Bare Minimum</h3>
                <div className="text-4xl font-bold text-white mb-4">$50</div>
                <p className="text-gray-400 mb-6">Host 1 slop app (no Hall of Fame)</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 1 app deployment</li>
                  <li>✓ Complete access to code and repo</li>
                  <li>✓ Complimentary regret</li>
                  <li>✗ Support (I'm busy)</li>
                  <li>✗ Hall of Fame placement</li>
                </ul>
                <button 
                  onClick={() => handleCheckout('bare_minimum')}
                  disabled={loading}
                  className="btn-secondary w-full mt-auto disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Get Started'}
                </button>
              </div>
            </div>
            
            {/* Hall of Famer Tier - $75 */}
            <div className="card-hover bg-[#0d0d0d] p-8 rounded-lg border border-gray-800 relative flex">
              <div className="text-center flex flex-col w-full">
                <h3 className="text-2xl font-bold mb-2">Hall of Famer</h3>
                <div className="text-4xl font-bold text-white mb-4">$75</div>
                <p className="text-gray-400 mb-6">Hall of Fame positions 12-100</p>
                <ul className="text-left space-y-2 mb-8">
                  <li>✓ 1 app deployment</li>
                  <li>✓ Hall of Fame (positions 12-100)</li>
                  <li>✓ Slightly better design</li>
                  <li>✓ Premium functionalities</li>
                  <li>✓ Complete access to code and repo</li>
                  <li>✓ Support (up to 3 revisions)</li>
                </ul>
                {availability.hallOfFame === false && (
                  <p className="text-red-400 text-sm mb-4">All spots taken</p>
                )}
                {availability.hallOfFame === true && (
                  <p className="text-[#d4a017] text-sm mb-4">Positions 12-100 available</p>
                )}
                <button 
                  onClick={() => handleCheckout('hall_of_fame')}
                  disabled={loading || availability.hallOfFame === false}
                  className="btn-primary w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : availability.hallOfFame === false ? 'Sold Out' : 'Get Your Spot'}
                </button>
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

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}