import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import NotificationListener from '@/components/NotificationListener';
import NotificationBadge from '@/components/NotificationBadge';
import UserMenu from '@/components/UserMenu'; // 👈 Import

export default function AccueilPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <NotificationListener />
      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse mt-20">Chargement...</div>}>
        <AccueilContent />
      </Suspense>
      <BottomNav />
    </div>
  );
}

async function AccueilContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, eventRes, announcementRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('events').select('*').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
  ]);

  const profile = profileRes.data;
  const nextEvent = eventRes.data;
  const lastAnnouncement = announcementRes.data;

  return (
    <>
      <header className="flex justify-between items-center mb-8 mt-4">
        <div>
          <p className="text-gray-400 text-sm">Bonjour 👋</p>
          <h1 className="text-2xl font-bold text-white">{profile?.first_name || 'Choriste'}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationBadge />
          {/* 👇 On utilise le UserMenu */}
          <UserMenu profile={profile} />
        </div>
      </header>

      {/* ... (Le reste de la page d'accueil ne change pas) ... */}
    </>
  );
}