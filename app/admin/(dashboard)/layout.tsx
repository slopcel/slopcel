import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/Header';

export const runtime = 'edge';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  // Only enforce admin email check if the env var is set
  if (adminEmail && user.email !== adminEmail) {
    console.warn(`Access denied: User email ${user.email} does not match ADMIN_EMAIL ${adminEmail}`);
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

