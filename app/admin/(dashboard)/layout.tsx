import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

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
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
