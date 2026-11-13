import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="animate-pulse text-emerald-400 font-medium">Vérification des accès...</div></div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('roles').eq('id', user.id).single();

  // 👇 On autorise les admins, super_admins ET maîtres de chœur
  const rolesAutorises = ['admin', 'super_admin', 'maitre_choeur'];
  
  if (!profile?.roles?.some((role: string) => rolesAutorises.includes(role))) {
    redirect('/accueil');
  }

  return <>{children}</>;
}