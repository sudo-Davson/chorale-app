import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VoicePlayer from '@/components/VoicePlayer';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

export const instant = false;

export default async function ChantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('voice').eq('id', user.id).single();
  const userVoice = profile?.voice;

  const { data: song } = await supabase.from('songs').select('*').eq('id', id).single();
  const { data: voiceTracks } = await supabase.from('voice_tracks').select('*').eq('song_id', id);

  if (!song) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Chant introuvable</h1>
        <Link href="/chants" className="text-purple-400 underline">Retour à la bibliothèque</Link>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8">
        <Link href="/chants" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
          ← Retour
        </Link>
        <h1 className="text-3xl font-extrabold text-white">{song.title}</h1>
        <p className="text-purple-400 font-medium mt-1">{song.composer || 'Auteur inconnu'}</p>
      </header>

      <div className="flex gap-3 mb-6">
        {song.pdf_url && (
          <a href={song.pdf_url} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 border border-white/20 text-white p-3 rounded-2xl text-center font-bold text-sm hover:bg-white/20 transition-all">
            📄 Partition PDF
          </a>
        )}
        {song.audio_full_url && (
          <div className="flex-1 bg-purple-600 text-white p-3 rounded-2xl text-center font-bold text-sm shadow-lg">
            🎧 Tous ensemble
          </div>
        )}
      </div>

      {song.audio_full_url && (
        <div className="mb-6 bg-white/5 p-4 rounded-3xl border border-white/10">
          <GlobalAudioPlayer url={song.audio_full_url} />
        </div>
      )}

      <VoicePlayer tracks={voiceTracks || []} userVoice={userVoice} />

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Paroles</h2>
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
          {song.lyrics || "Aucune parole n'a encore été ajoutée pour ce chant."}
        </div>
      </div>
    </div>
  );
}