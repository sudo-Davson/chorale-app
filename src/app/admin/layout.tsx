import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 font-medium">Vérification des accès...</div>
      </div>
    }>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  // Force Next.js à faire cette vérification à chaque requête
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si pas connecté, on redirige vers login
  if (!user) {
    redirect('/login');
  }

  // 2. On vérifie le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // 3. Si ce n'est pas un admin, on le redirige vers l'accueil
  if (profile?.role !== 'admin') {
    redirect('/accueil');
  }

  // 4. Si c'est un admin, on affiche la page demandée
  return <>{children}</>;
}