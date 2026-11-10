import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';

export default function AccueilPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse mt-20">Chargement de l'accueil...</div>}>
        <AccueilContent />
      </Suspense>
      <BottomNav />
    </div>
  );
}

async function AccueilContent() {
  // Force Next.js à attendre la requête client
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  const now = new Date().toISOString();

  const { data: nextEvent } = await supabase
    .from('events')
    .select('*')
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: lastAnnouncement } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <header className="flex justify-between items-center mb-8 mt-4">
        <div>
          <p className="text-gray-400 text-sm">Bonjour 👋</p>
          <h1 className="text-2xl font-bold text-white">{profile?.first_name || 'Choriste'}</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg border border-white/20 text-white font-bold">
          {profile?.first_name?.charAt(0) || '👤'}
        </div>
      </header>

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-white">Prochain événement</h2>
        </div>
        
        {nextEvent ? (
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-800 p-6 shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
              <span className="px-3 py-1 bg-white/20 text-xs font-bold rounded-full backdrop-blur-md text-white">
                {nextEvent.type === 'repetition' ? '🎼 Répétition' : '⛪ Événement'}
              </span>
              <h3 className="text-2xl font-extrabold mt-4 mb-1 text-white">{nextEvent.title}</h3>
              <p className="text-purple-200 font-medium">
                {new Date(nextEvent.start_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-purple-200">📍 {nextEvent.location || 'Lieu à définir'}</span>
                <button className="w-10 h-10 rounded-full bg-white text-purple-800 flex items-center justify-center shadow-lg font-bold">
                  ▶
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center text-gray-400">
            Aucun événement prévu
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4 text-white">Dernière annonce</h2>
        {lastAnnouncement ? (
          <div className="p-5 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 flex gap-4 items-start hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-slate-800 p-3 rounded-2xl">📢</div>
            <div>
              <h3 className="font-bold text-white mb-1">{lastAnnouncement.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2">{lastAnnouncement.content}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center text-gray-400">
            Aucune annonce
          </div>
        )}
      </section>
    </>
  );
}