import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link'; // 👈 Import de Link

export default function AgendaPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Agenda</h1>
        <p className="text-gray-400 mt-1">Vos prochains rendez-vous</p>
      </header>
      <Suspense fallback={<div className="text-center p-8 text-blue-400 animate-pulse">Chargement...</div>}>
        <ListeEvenements />
      </Suspense>
      <BottomNav />
    </div>
  );
}

async function ListeEvenements() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: events } = await supabase
    .from('events').select('*').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true });

  if (!events || events.length === 0) {
    return <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">Aucun événement à venir.</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const date = new Date(event.start_at);
        const isRepetition = event.type === 'repetition';
        
        return (
          // 👇 C'EST ICI QUE ÇA CHANGE : On utilise <Link> au lieu de <div>
          <Link href={`/agenda/${event.id}`} key={event.id} className="block p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
            <div className="flex gap-5 items-start">
              <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl flex-shrink-0 ${isRepetition ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                <span className="text-xs font-bold uppercase">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                <span className="text-2xl font-black">{date.getDate()}</span>
              </div>
              <div className="flex-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isRepetition ? 'text-purple-400' : 'text-blue-400'}`}>
                  {isRepetition ? '🎼 Répétition' : '⛪ Événement'}
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{event.title}</h3>
                <p className="text-sm text-gray-400 mt-1">🕒 {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-gray-400 mt-1 truncate">📍 {event.location || 'Lieu à définir'}</p>
              </div>
              <div className="text-gray-500 self-center">▶</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}