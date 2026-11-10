import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

export default function ChantsPage() {
  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Bibliothèque
        </h1>
        <p className="text-gray-400 mt-1">Tous les chants de la chorale</p>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse">Chargement des chants...</div>}>
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

  // 1. Récupérer le profil pour connaître la voix
  const { data: profile } = await supabase.from('profiles').select('voice').eq('id', user.id).single();
  const userVoice = profile?.voice;

  // 2. Récupérer tous les chants et leurs pistes vocales
  const { data: songs } = await supabase
    .from('songs')
    .select('*, voice_tracks(voice)')
    .order('created_at', { ascending: false });

  // 3. Le tri intelligent
  let chantsAffiches = songs || [];
  if (userVoice) {
    // On garde les chants qui ont la piste de la voix de l'utilisateur
    chantsAffiches = chantsAffiches.filter(song => 
      song.voice_tracks?.some((track: any) => track.voice === userVoice)
    );
  }

  const gradients = [
    'from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500'
  ];

  return (
    <>
      {userVoice && (
        <div className="mb-4 bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2 text-sm text-gray-300">
          <span>🎤 Filtré pour votre voix :</span>
          <span className="font-bold text-white capitalize">{userVoice}</span>
        </div>
      )}

      <div className="space-y-4">
        {chantsAffiches.length > 0 ? (
          chantsAffiches.map((song, index) => (
            <Link href={`/chants/${song.id}`} key={song.id} className="flex gap-4 items-center p-3 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center shadow-lg`}>
                <span className="text-3xl opacity-50">🎵</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white truncate">{song.title}</h3>
                <p className="text-sm text-gray-400 truncate">{song.composer || 'Auteur inconnu'}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-white/10 rounded-md text-[10px] text-gray-300 uppercase tracking-wider">
                  {song.category || 'Non classé'}
                </span>
              </div>
              <div className="pr-2 text-gray-500">
                ▶
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
            {userVoice 
              ? `Aucun chant n'a encore été enregistré pour la voix ${userVoice}.`
              : "Aucun chant dans la bibliothèque."}
          </div>
        )}
      </div>
    </>
  );
}