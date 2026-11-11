import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import AnnouncementCard from '@/components/AnnouncementCard';

export default function AnnoncesPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
          Annonces
        </h1>
        <p className="text-gray-400 mt-1">Les dernières nouvelles</p>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-orange-400 animate-pulse">Chargement des annonces...</div>}>
        <ListeAnnonces />
      </Suspense>

      <BottomNav />
    </div>
  );
}

async function ListeAnnonces() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
        Aucune annonce pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((annonce) => (
        // 👇 REGARDEZ BIEN CETTE LIGNE 50
        <AnnouncementCard key={annonce.id} annonce={annonce} isAdmin={isAdmin} />
      ))}
    </div>
  );
}