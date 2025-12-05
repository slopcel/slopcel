'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import PricingModal from '@/components/PricingModal';
import { User } from 'lucide-react';
import { toast } from 'sonner';

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

// TEMPORARY: Mock data for visualization - Remove this after testing
const SHOW_MOCK_DATA = false;
const mockProjects: HallOfFameProject[] = [
  // Position 1 - Premium ($300)
  { id: '1', name: 'SlopTracker Pro', description: 'The ultimate project tracking tool for indie hackers. Built with Next.js and powered by AI. Ship faster, track smarter.', image_url: 'https://picsum.photos/seed/sloptrack/800/400', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 1, amount: 30000, user_id: '1', profile: { display_name: 'Alex Builder', avatar_url: 'https://i.pravatar.cc/150?u=alex', twitter_url: 'https://x.com/alexbuilder', is_anonymous: false } },
  // Positions 2-10 - Standard ($150)
  { id: '2', name: 'VibeCheck AI', description: 'Sentiment analysis for your codebase. Know when your code is happy.', image_url: 'https://picsum.photos/seed/vibecheck/400/300', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 2, amount: 15000, user_id: '2', profile: { display_name: 'Sarah Dev', avatar_url: 'https://i.pravatar.cc/150?u=sarah', twitter_url: 'https://twitter.com/sarahdev', is_anonymous: false } },
  { id: '3', name: 'DeployDemon', description: 'One-click deployments that actually work. No more YAML nightmares.', image_url: 'https://picsum.photos/seed/deploydemon/400/300', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 3, amount: 15000, user_id: '3', profile: null },
  { id: '4', name: 'CopyCraft', description: 'AI copywriting that doesn\'t sound like a robot wrote it.', image_url: 'https://picsum.photos/seed/copycraft/400/300', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 4, amount: 15000, user_id: '4', profile: { display_name: null, avatar_url: null, twitter_url: null, is_anonymous: true } },
  { id: '5', name: 'BugSquasher', description: 'Find bugs before your users do. Automated testing made simple.', image_url: 'https://picsum.photos/seed/bugsquash/400/300', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 5, amount: 15000, user_id: '5', profile: { display_name: 'Mike Coder', avatar_url: 'https://i.pravatar.cc/150?u=mike', twitter_url: null, is_anonymous: false } },
  { id: '6', name: 'LaunchPad X', description: 'Landing pages in minutes. No code required, all vibes included.', image_url: 'https://picsum.photos/seed/launchpadx/400/300', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 6, amount: 15000, user_id: '6', profile: { display_name: 'Lisa Maker', avatar_url: null, twitter_url: 'https://x.com/lisamaker', is_anonymous: false } },
  { id: '7', name: 'MetricsMaster', description: 'Analytics without the complexity. Know your numbers instantly.', image_url: 'https://picsum.photos/seed/metrics/400/300', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 7, amount: 15000, user_id: null, profile: null },
  { id: '8', name: 'CodeReviewBot', description: 'AI code reviews that actually help. Better than your coworker.', image_url: 'https://picsum.photos/seed/codereview/400/300', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 8, amount: 15000, user_id: '8', profile: { display_name: 'John Reviewer', avatar_url: 'https://i.pravatar.cc/150?u=john', twitter_url: null, is_anonymous: false } },
  { id: '9', name: 'TaskFlow', description: 'Project management for people who hate project management.', image_url: 'https://picsum.photos/seed/taskflow/400/300', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 9, amount: 15000, user_id: '9', profile: { display_name: null, avatar_url: null, twitter_url: null, is_anonymous: false } },
  { id: '10', name: 'APIForge', description: 'Build and mock APIs in seconds. Your backend\'s best friend.', image_url: 'https://picsum.photos/seed/apiforge/400/300', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 10, amount: 15000, user_id: '10', profile: { display_name: 'API King', avatar_url: 'https://i.pravatar.cc/150?u=apiking', twitter_url: 'https://x.com/apiking', is_anonymous: false } },
  // Positions 11-100 - Hall of Fame ($75)
  { id: '11', name: 'QuickDB', description: null, image_url: 'https://picsum.photos/seed/quickdb/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 11, amount: 7500, user_id: null, profile: null },
  { id: '12', name: 'FormBuilder', description: null, image_url: 'https://picsum.photos/seed/formbuilder/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 12, amount: 7500, user_id: '12', profile: { display_name: 'Form Master', avatar_url: null, twitter_url: null, is_anonymous: false } },
  { id: '13', name: 'NotifyMe', description: null, image_url: 'https://picsum.photos/seed/notifyme/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 13, amount: 7500, user_id: null, profile: null },
  { id: '14', name: 'CacheKing', description: null, image_url: 'https://picsum.photos/seed/cacheking/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 14, amount: 7500, user_id: null, profile: null },
  { id: '15', name: 'LogStream', description: null, image_url: 'https://picsum.photos/seed/logstream/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 15, amount: 7500, user_id: null, profile: null },
  { id: '16', name: 'AuthBox', description: null, image_url: 'https://picsum.photos/seed/authbox/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 16, amount: 7500, user_id: null, profile: null },
  { id: '17', name: 'DataPipe', description: null, image_url: 'https://picsum.photos/seed/datapipe/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 17, amount: 7500, user_id: null, profile: null },
  { id: '18', name: 'ChartGen', description: null, image_url: 'https://picsum.photos/seed/chartgen/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 18, amount: 7500, user_id: null, profile: null },
  { id: '19', name: 'PixelPerfect', description: null, image_url: 'https://picsum.photos/seed/pixelperfect/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 19, amount: 7500, user_id: null, profile: null },
  { id: '20', name: 'TestRunner', description: null, image_url: 'https://picsum.photos/seed/testrunner/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 20, amount: 7500, user_id: null, profile: null },
  { id: '21', name: 'MailJet', description: null, image_url: 'https://picsum.photos/seed/mailjet/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 21, amount: 7500, user_id: null, profile: null },
  { id: '22', name: 'DocuGen', description: null, image_url: 'https://picsum.photos/seed/docugen/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 22, amount: 7500, user_id: null, profile: null },
  { id: '23', name: 'QueueMaster', description: null, image_url: 'https://picsum.photos/seed/queuemaster/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 23, amount: 7500, user_id: null, profile: null },
  { id: '24', name: 'CloudSync', description: null, image_url: 'https://picsum.photos/seed/cloudsync/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 24, amount: 7500, user_id: null, profile: null },
  { id: '25', name: 'CodeSnip', description: null, image_url: 'https://picsum.photos/seed/codesnip/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 25, amount: 7500, user_id: null, profile: null },
  { id: '26', name: 'HashGen', description: null, image_url: 'https://picsum.photos/seed/hashgen/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 26, amount: 7500, user_id: null, profile: null },
  { id: '27', name: 'ScriptHub', description: null, image_url: 'https://picsum.photos/seed/scripthub/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 27, amount: 7500, user_id: null, profile: null },
  { id: '28', name: 'TerminalX', description: null, image_url: 'https://picsum.photos/seed/terminalx/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 28, amount: 7500, user_id: null, profile: null },
  { id: '29', name: 'ConfigMan', description: null, image_url: 'https://picsum.photos/seed/configman/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 29, amount: 7500, user_id: null, profile: null },
  { id: '30', name: 'BackupBuddy', description: null, image_url: 'https://picsum.photos/seed/backupbuddy/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 30, amount: 7500, user_id: null, profile: null },
  { id: '35', name: 'CronJob', description: null, image_url: 'https://picsum.photos/seed/cronjob/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 35, amount: 7500, user_id: null, profile: null },
  { id: '42', name: 'ImageOpt', description: null, image_url: 'https://picsum.photos/seed/imageopt/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 42, amount: 7500, user_id: null, profile: null },
  { id: '55', name: 'SecureVault', description: null, image_url: 'https://picsum.photos/seed/securevault/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 55, amount: 7500, user_id: null, profile: null },
  { id: '67', name: 'QueryBuilder', description: null, image_url: 'https://picsum.photos/seed/querybuilder/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 67, amount: 7500, user_id: null, profile: null },
  { id: '78', name: 'StatusPage', description: null, image_url: 'https://picsum.photos/seed/statuspage/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 78, amount: 7500, user_id: null, profile: null },
  { id: '89', name: 'WebHooker', description: null, image_url: 'https://picsum.photos/seed/webhooker/200/150', live_url: null, github_url: 'https://github.com', hall_of_fame_position: 89, amount: 7500, user_id: null, profile: null },
  { id: '95', name: 'FeatureFlag', description: null, image_url: 'https://picsum.photos/seed/featureflag/200/150', live_url: 'https://example.com', github_url: null, hall_of_fame_position: 95, amount: 7500, user_id: null, profile: null },
  { id: '100', name: 'SloppyBot', description: null, image_url: 'https://picsum.photos/seed/sloppybot/200/150', live_url: 'https://example.com', github_url: 'https://github.com', hall_of_fame_position: 100, amount: 7500, user_id: null, profile: null },
];

export default function HallOfFame() {
  const [hofProjects, setHofProjects] = useState<HallOfFameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum'>('hall_of_fame');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [availability, setAvailability] = useState<{
    premium: boolean | null;
    standard: boolean | null;
    hallOfFame: boolean | null;
  }>({
    premium: null,
    standard: null,
    hallOfFame: null,
  });
  const supabase = createClient();

  useEffect(() => {
    // TEMPORARY: Use mock data for visualization
    if (SHOW_MOCK_DATA) {
      setHofProjects(mockProjects);
      setLoading(false);
    } else {
      fetchHallOfFameProjects();
    }
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
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

  const handleCardClick = (position: number) => {
    let tier: 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum' = 'hall_of_fame';
    if (position === 1) {
      tier = 'premium';
    } else if (position >= 2 && position <= 11) {
      tier = 'standard';
    } else {
      tier = 'hall_of_fame';
    }
    setSelectedTier(tier);
    setModalOpen(true);
  };

  const handleCheckout = async (tier: 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum') => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/dodo/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        if (data.requiresAuth) {
          window.location.href = '/login';
        } else {
          toast.error(data.error);
          setCheckoutLoading(false);
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

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

  // Helper to get price label for position
  const getPriceLabel = (position: number) => {
    if (position === 1) return '$300';
    if (position >= 2 && position <= 11) return '$150';
    return '$75';
  };

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
              ? 'Placeholder wall for upcoming featured apps.'
              : 'The finest projects hosted on Slopcel, ranked by their hall of fame position.'}
          </p>
        </div>
      </section>

      {hofProjects.length === 0 ? (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Placeholder Wall */}
            <div className="flex justify-center">
              <div className="cursor-pointer" onClick={() => handleCardClick(1)}>
                <div className="relative w-full md:w-[820px] h-[220px] rounded-xl border-4 border-dashed border-yellow-400 grid place-items-center hover:border-yellow-300 transition-colors">
                  <div className="text-5xl font-extrabold text-yellow-400">$300</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-3xl font-bold text-yellow-400">1</div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => {
                const num = i + 2;
                return (
                  <div key={i} className="flex flex-col items-center">
                      <div className="w-full cursor-pointer rounded-lg border-2 border-dashed border-white/70 h-40 grid place-items-center hover:border-white/90 transition-colors" onClick={() => handleCardClick(num)}>
                        <div className="text-3xl font-bold text-white">$150</div>
                      </div>
                    <div className="mt-2 text-lg font-bold text-white">{num}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4">
              {Array.from({ length: 90 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className="w-full cursor-pointer h-24 rounded-md border border-dashed border-gray-700 grid place-items-center hover:border-gray-600 transition-colors" onClick={() => handleCardClick(i + 12)}>
                      <div className="text-xl text-gray-300">$75</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{i + 11}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Position 1 - Premium */}
            <div className="flex flex-col items-center">
              {positionMap.get(1) ? (
                <div className="w-full md:w-[820px] cursor-pointer">
                  <ProjectCard project={positionMap.get(1)!} isPremium />
                  <div className="mb-2 text-center">
                    <span className="text-3xl mt-2 text-center font-bold text-yellow-400">1</span>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => handleCardClick(1)}>
                  <div className="relative w-full md:w-[820px] h-[220px] rounded-xl border-4 border-dashed border-yellow-400 grid place-items-center hover:border-yellow-300 transition-colors">
                    <div className="text-5xl font-extrabold text-yellow-400">$300</div>
                  </div>
                  <div className="mt-2 text-center text-3xl font-bold text-yellow-400">1</div>
                </div>
              )}
            </div>

            {/* Positions 2-10 - Standard */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }, (_, i) => {
                const position = i + 2;
                const project = positionMap.get(position);
                return (
                  <div key={position} className="flex flex-col items-center">
                    {project ? (
                      <div className="w-full cursor-pointer">
                        <ProjectCard project={project} />
                        <div className="w-full mt-2 text-center">
                          <span className="text-lg font-bold text-white">{position}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full cursor-pointer" onClick={() => handleCardClick(position)}>
                        <div className="w-full rounded-lg border-2 border-dashed border-white-400/50 h-[280px] grid place-items-center hover:border-yellow-400/70 transition-colors">
                          <div className="text-3xl font-bold text-white/80">$150</div>
                        </div>
                        <div className="mt-2 text-center text-lg font-bold text-white">{position}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Positions 11-100 - Standard */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4">
              {Array.from({ length: 90 }, (_, i) => {
                const position = i + 11;
                const project = positionMap.get(position);
                return (
                  <div key={position} className="flex flex-col items-center">
                    {project ? (
                      <div className="w-full cursor-pointer">
                        <ProjectCard project={project} isSmall />
                        <div className="w-full mb-1 mt-2 text-center">
                          <span className="text-xs text-gray-500">{position}</span>
                        </div>
                      </div>
                    ) : (
                        <div className='w-full cursor-pointer'>
                          <div className="h-24 rounded-md border border-dashed border-gray-700 grid place-items-center hover:border-gray-600 transition-colors" onClick={() => handleCardClick(position)}>
                            <div className="text-xl text-gray-300">$75</div>
                          </div>
                          <div className="mt-2 text-xs text-center text-gray-500">{position}</div>
                        </div>
                    )}
                    
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <PricingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tier={selectedTier}
        availability={
          selectedTier === 'premium'
            ? availability.premium
            : selectedTier === 'standard'
            ? availability.standard
            : availability.hallOfFame
        }
        onCheckout={handleCheckout}
        loading={checkoutLoading}
      />
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
