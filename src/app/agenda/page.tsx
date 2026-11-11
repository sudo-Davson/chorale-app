import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import AgendaTabs from '@/components/AgendaTabs';

export default function AgendaPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
          Agenda & Programmes
        </h1>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-blue-400 animate-pulse">Chargement...</div>}>
        <ListeDonnees />
      </Suspense>

      <BottomNav />
    </div>
  );
}

async function ListeDonnees() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  // 👇 On autorise l'admin ET le super_admin
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role);

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: false });

  // On passe aussi isAdmin à AgendaTabs et EventCard
  return <AgendaTabs events={events || []} isAdmin={isAdmin} />;
}