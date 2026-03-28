'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ArrowRight, User } from 'lucide-react';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
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
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<FeaturedProject | null>(null);

  useEffect(() => {
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
            <Link href="/projects" className="btn-primary hover-shake">View the Slop</Link>
            <Link href="/hall-of-fame" className="btn-inverse">Hall of Fame</Link>
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
                Despite the hilarious name and the unserious presentation of this website, I do want to try my hand at vibecoding. This site now serves as an archive of the projects I've built.
              </p>

              {/* Migration Notice */}
              <div className="bg-[#1a1a1a] border border-[#d4a017]/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-[#d4a017] mb-3">Slopcel is Moving!</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Slopcel has evolved and is now becoming <span className="font-bold text-white">cookd.fun</span> — a bigger, better platform for vibecoded projects. Head over there for the full experience, including new features, submissions, and more slop than ever before.
                </p>
                <Link 
                  href="https://cookd.fun" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Visit cookd.fun
                  <ArrowRight size={18} />
                </Link>
              </div>

              <p className="text-gray-300">
                <Link href="https://x.com/_madiou" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-90">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                    <path d="M18.244 2H21l-6.543 7.48L22 22h-6.828l-4.77-6.223L4.8 22H2l7.028-8.04L2 2h6.828l4.325 5.77L18.244 2Zm-1.197 18h1.887L7.03 4h-1.89l10.906 16Z"/>
                  </svg>
                  <span className="underline">Follow on Twitter</span>
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

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">FAQ</h2>
          <p className="text-center text-gray-400 mb-10">Answers to common questions</p>

          {[
            { q: 'What is Slopcel?', a: 'A parody hosting platform for vibecoded slop—projects were built and deployed manually by me.' },
            { q: 'Where is Slopcel going?', a: 'Slopcel has evolved into cookd.fun — a bigger, better platform for vibecoded projects. This site remains as an archive.' },
            { q: 'Will my app be online forever?', a: 'Yes. All existing projects will remain hosted and accessible.' },
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