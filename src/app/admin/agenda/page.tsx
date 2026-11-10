import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import EventCard from '@/components/EventCard';

export default function AgendaPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
          Agenda
        </h1>
        <p className="text-gray-400 mt-1">Vos prochains rendez-vous</p>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-blue-400 animate-pulse">Chargement de l'agenda...</div>}>
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

  // 👇 On récupère le rôle
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true });

  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
        Aucun événement à venir.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        // 👇 On ajoute bien `isAdmin={isAdmin}`
        <EventCard key={event.id} event={event} isAdmin={isAdmin} />
      ))}
    </div>
  );
}