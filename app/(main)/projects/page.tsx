'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { User } from 'lucide-react';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface ProjectProfile {
  display_name: string | null;
  avatar_url: string | null;
  twitter_url: string | null;
  is_anonymous: boolean;
}

interface ProjectWithProfile {
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

export default function Projects() {
  const [projects, setProjects] = useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithProfile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Get unique user IDs
      const userIds = new Set(data.map(p => p.user_id).filter(Boolean));
      
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
      const projectsWithProfiles = data.map(project => ({
        ...project,
        profile: project.user_id ? profilesMap[project.user_id] || null : null,
      }));

      setProjects(projectsWithProfiles);
    } else {
      setProjects([]);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8]">
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-gray-400">Loading projects...</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">Projects</h1>
          <p className="text-gray-400 mb-12">Look on my Works, ye Mighty, and despair!</p>
        </div>
      </section>

      {projects.length === 0 ? (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400">No projects yet. Check back soon!</p>
          </div>
        </section>
      ) : (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const showProfile = project.profile && !project.profile.is_anonymous;
                
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="card-hover bg-[#0d0d0d] rounded-xl border border-gray-800 overflow-hidden cursor-pointer group"
                  >
                    {/* Project Image */}
                    {project.image_url ? (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={project.image_url}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {project.featured && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-[#d4a017] text-black text-xs font-bold rounded">
                            ⭐ Featured
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-gradient-to-br from-[#d4a017]/20 to-[#d4a017]/5">
                        {project.featured && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-[#d4a017] text-black text-xs font-bold rounded">
                            ⭐ Featured
                          </div>
                        )}
                      </div>
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
                          {project.profile?.twitter_url && (
                            <a
                              href={project.profile.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-500 hover:text-[#1DA1F2] transition-colors ml-auto"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold mb-2 text-white line-clamp-1">{project.name}</h3>
                      {project.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
                      )}
                      
                      {/* Quick action buttons */}
                      <div className="flex gap-2 mt-4">
                        {project.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-primary text-xs py-1.5 px-3 flex-1 text-center"
                          >
                            Visit
                          </a>
                        )}
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-inverse text-xs py-1.5 px-3 flex-1 text-center"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
