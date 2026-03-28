'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { User, ArrowRight } from 'lucide-react';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  twitter_url: string | null;
  is_anonymous: boolean;
}

interface HallOfFameProject {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  live_url: string | null;
  github_url: string | null;
  hall_of_fame_position: number;
  amount: number;
  user_id: string | null;
  profile: UserProfile | null;
}

export default function HallOfFame() {
  const [hofProjects, setHofProjects] = useState<HallOfFameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchHallOfFameProjects();
  }, []);

  const fetchHallOfFameProjects = async () => {
    setLoading(true);
    // Get orders with completed status and hall of fame positions, join with projects
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        hall_of_fame_position,
        amount,
        project_id,
        user_id,
        projects:project_id (
          id,
          name,
          description,
          image_url,
          live_url,
          github_url,
          user_id
        )
      `)
      .eq('status', 'completed')
      .not('hall_of_fame_position', 'is', null)
      .order('hall_of_fame_position', { ascending: true });

    if (ordersError) {
      console.error('Error fetching hall of fame projects:', ordersError);
    } else {
      // Get unique user IDs from orders and projects
      const userIds = new Set<string>();
      (orders || []).forEach(order => {
        if (order.user_id) userIds.add(order.user_id);
        if ((order.projects as any)?.user_id) userIds.add((order.projects as any).user_id);
      });

      // Fetch profiles for all users
      let profilesMap: Record<string, UserProfile> = {};
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

      // Transform the data to include project and profile info
      const projects = (orders || [])
        .filter(order => order.projects)
        .map(order => {
          const projectData = order.projects as any;
          // Prefer project's user_id, fallback to order's user_id
          const userId = projectData?.user_id || order.user_id;
          return {
            ...projectData,
            hall_of_fame_position: order.hall_of_fame_position,
            amount: order.amount,
            user_id: userId,
            profile: userId ? profilesMap[userId] || null : null,
          };
        }) as HallOfFameProject[];
      
      setHofProjects(projects);
    }
    setLoading(false);
  };

  // Create a map of positions to projects for easy lookup
  const positionMap = new Map(hofProjects.map(p => [p.hall_of_fame_position, p]));

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8]">
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-gray-400">Loading hall of fame...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl flex flex-col items-center justify-center gap-4 md:text-6xl font-bold mb-4 text-white">
            <span role="img" aria-label="trophy"><img src="/icons/trophy-img.png" alt="Hall of Fame Icon" height={100} width={100}/></span> Hall of Fame
          </h1>
          <p className="text-gray-400">
            {hofProjects.length === 0
              ? 'An archive of the Hall of Fame from when Slopcel was accepting submissions.'
              : 'The finest projects hosted on Slopcel, ranked by their hall of fame position.'}
          </p>
        </div>
      </section>

      {hofProjects.length === 0 ? (
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-10">
              <p className="text-gray-400 text-lg mb-6">
                No projects in the Hall of Fame yet. This archive is from when Slopcel was accepting submissions.
              </p>
              <Link 
                href="https://cookd.fun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                Check out cookd.fun
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Position 1 - Premium */}
            {positionMap.get(1) && (
              <div className="flex flex-col items-center">
                <div className="w-full md:w-[820px]">
                  <ProjectCard project={positionMap.get(1)!} isPremium />
                  <div className="mb-2 text-center">
                    <span className="text-3xl mt-2 text-center font-bold text-yellow-400">1</span>
                  </div>
                </div>
              </div>
            )}

            {/* Positions 2-10 - Standard */}
            {hofProjects.some(p => p.hall_of_fame_position >= 2 && p.hall_of_fame_position <= 10) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {hofProjects
                  .filter(p => p.hall_of_fame_position >= 2 && p.hall_of_fame_position <= 10)
                  .sort((a, b) => a.hall_of_fame_position - b.hall_of_fame_position)
                  .map((project) => (
                    <div key={project.id} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProjectCard project={project} />
                        <div className="w-full mt-2 text-center">
                          <span className="text-lg font-bold text-white">{project.hall_of_fame_position}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Positions 11+ */}
            {hofProjects.some(p => p.hall_of_fame_position >= 11) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4">
                {hofProjects
                  .filter(p => p.hall_of_fame_position >= 11)
                  .sort((a, b) => a.hall_of_fame_position - b.hall_of_fame_position)
                  .map((project) => (
                    <div key={project.id} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProjectCard project={project} isSmall />
                        <div className="w-full mb-1 mt-2 text-center">
                          <span className="text-xs text-gray-500">{project.hall_of_fame_position}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ProjectCard({ project, isPremium = false, isSmall = false }: { 
  project: HallOfFameProject; 
  isPremium?: boolean;
  isSmall?: boolean;
}) {
  const showProfile = project.profile && !project.profile.is_anonymous;
  
  // For small cards (positions 11-100), use a compact fixed height
  if (isSmall) {
    return (
      <div className="card-hover bg-[#0d0d0d] p-2 rounded-md border border-gray-700 h-24 flex flex-col overflow-hidden">
        {project.image_url ? (
          <div className="relative w-full h-12 rounded overflow-hidden flex-shrink-0">
            <Image
              src={project.image_url}
              alt={project.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-12 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded flex-shrink-0"></div>
        )}
        <h3 className="text-xs font-bold mt-1 text-white truncate">{project.name}</h3>
      </div>
    );
  }
  
  // For standard cards (positions 2-10)
  const isStandard = project.hall_of_fame_position >= 2 && project.hall_of_fame_position <= 10;
  
  return (
    <div className={`card-hover bg-[#0d0d0d] p-4 rounded-lg overflow-hidden ${
      isPremium 
        ? 'border-4 border-yellow-400' 
        : isStandard 
          ? 'border-2 border-yellow-400/50' 
          : 'border border-gray-700'
    } ${isStandard ? 'h-[280px]' : ''} flex flex-col`}>
      {project.image_url ? (
        <div className={`relative w-full ${isPremium ? 'h-40' : 'h-28'} rounded-lg overflow-hidden flex-shrink-0`}>
          <Image
            src={project.image_url}
            alt={project.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`w-full ${isPremium ? 'h-40' : 'h-28'} bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg flex-shrink-0`}></div>
      )}
      
      {/* Creator Profile */}
      {showProfile && (
        <div className="flex items-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
            {project.profile?.avatar_url ? (
              <img
                src={project.profile.avatar_url}
                alt={project.profile.display_name || 'Creator'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <User className="text-gray-500 w-3 h-3" />
            )}
          </div>
          <span className="text-gray-400 text-xs truncate flex-1">
            {project.profile?.display_name || 'Anonymous'}
          </span>
          {project.profile?.twitter_url && (
            <a
              href={project.profile.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-[#1DA1F2] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}
        </div>
      )}
      
      <h3 className={`${isPremium ? 'text-xl' : 'text-base'} font-bold mt-2 text-white line-clamp-1`}>{project.name}</h3>
      
      {project.description && (
        <p className="text-gray-400 mt-1 text-xs line-clamp-2 flex-1">{project.description}</p>
      )}
      
      <div className="flex gap-2 mt-3">
        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-center text-xs py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            Visit
          </a>
        )}
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-inverse flex-1 text-center text-xs py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
