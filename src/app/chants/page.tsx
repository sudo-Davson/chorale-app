import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import ChantsTabs from '@/components/ChantsTabs';

export default function ChantsPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Bibliothèque
        </h1>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse">Chargement...</div>}>
        <ListeChants />
      </Suspense>

      <BottomNav />
    </div>
  );
}

async function ListeChants() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('voice').eq('id', user.id).single();
  const userVoice = profile?.voice;

  const { data: songs } = await supabase
    .from('songs')
    .select('*, voice_tracks(voice)')
    .order('title', { ascending: true });

  return <ChantsTabs songs={songs || []} userVoice={userVoice} />;
}