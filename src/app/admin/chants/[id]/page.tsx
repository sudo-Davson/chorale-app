'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import AdminVoiceRecorder from '@/components/AdminVoiceRecorder';

const VOIX = [
  { id: 'soprano', label: 'Soprano', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'alto', label: 'Alto', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'tenor', label: 'Ténor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'basse', label: 'Basse', color: 'text-teal-400', bg: 'bg-teal-500/10' },
];

export default function AdminVoixPage() {
  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin/chants" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-xl font-bold">Gestion du chant</h1>
      </header>
      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse mt-20">Chargement...</div>}>
        <VoixContent />
      </Suspense>
    </div>
  );
}

function VoixContent() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const [song, setSong] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [recordingVoice, setRecordingVoice] = useState<string | null>(null);
  
  const supabase = createClient();

  const loadData = async () => {
    if (!songId) return;
    const { data: songData } = await supabase.from('songs').select('*').eq('id', songId).single();
    setSong(songData);
    const { data: trackData } = await supabase.from('voice_tracks').select('*').eq('song_id', songId);
    setTracks(trackData || []);
  };

  useEffect(() => { loadData(); }, [songId]);

  async function handleUpload(voiceId: string, file: File) {
    setUploading(voiceId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${songId}-${voiceId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('songs').upload(`voices/${fileName}`, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(`voices/${fileName}`);
      
      const { error: dbError } = await supabase.from('voice_tracks').upsert({
        song_id: songId, voice: voiceId, audio_url: publicUrl
      }, { onConflict: 'song_id, voice' });
      
      if (dbError) throw dbError;
      loadData();
      toast.success('Piste audio mise à jour !');
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteVoice(voiceId: string, audioUrl: string) {
    if (!confirm(`Supprimer la piste ${voiceId} ?`)) return;
    try {
      await supabase.from('voice_tracks').delete().eq('song_id', songId).eq('voice', voiceId);
      const fileName = audioUrl.split('/').pop();
      if (fileName) await supabase.storage.from('songs').remove([`voices/${fileName}`]);
      setTracks(tracks.filter(t => !(t.song_id === songId && t.voice === voiceId)));
      toast.success('Piste supprimée.');
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  }

  async function handleDeleteSong() {
    if (!confirm("Supprimer définitivement ce chant et toutes ses voix ?")) return;
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    if (error) toast.error(error.message);
    else router.push('/admin/chants');
  }

  if (!song) return <div className="text-center mt-10 text-gray-400">Chargement...</div>;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{song.title}</h2>
        <p className="text-xs text-gray-400">{song.composer || 'Auteur inconnu'}</p>
      </div>

      <div className="space-y-4">
        {VOIX.map(voix => {
          const existingTrack = tracks.find(t => t.voice === voix.id);
          const isUploading = uploading === voix.id;
          const isRecordingThisVoice = recordingVoice === voix.id;

          return (
            <div key={voix.id} className={`p-5 rounded-3xl border border-white/10 ${voix.bg}`}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-bold ${voix.color}`}>{voix.label}</h2>
                {existingTrack ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">✅ Ajoutée</span>
                ) : (
                  <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">Manquante</span>
                )}
              </div>

              {existingTrack && (
                <div className="flex items-center gap-2 mb-3">
                  <audio controls className="w-full h-10">
                    <source src={existingTrack.audio_url} type="audio/mpeg" />
                  </audio>
                  <button onClick={() => handleDeleteVoice(voix.id, existingTrack.audio_url)} className="p-2.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors">🗑️</button>
                </div>
              )}

              {!isRecordingThisVoice && (
                <div className="flex gap-2">
                  <label className="flex-1 text-center py-2 px-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer text-xs font-medium transition-colors">
                    {isUploading ? 'Envoi...' : existingTrack ? 'Remplacer' : 'Ajouter Fichier'}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(voix.id, file);
                    }} disabled={isUploading} />
                  </label>
                  <button onClick={() => setRecordingVoice(voix.id)} className="flex-1 text-center py-2 px-2 rounded-xl border border-emerald-500/30 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold transition-colors">
                    🎤 Enregistrer
                  </button>
                </div>
              )}

              {isRecordingThisVoice && (
                <AdminVoiceRecorder 
                  songId={songId} voiceId={voix.id} 
                  onSuccess={() => { setRecordingVoice(null); loadData(); }}
                  onCancel={() => setRecordingVoice(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 👇 Le bouton est maintenant accessible au Maître de chœur sans restriction */}
      <button onClick={handleDeleteSong} className="w-full mt-10 bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl font-bold hover:bg-red-500/20 transition-all">
        🗑️ Supprimer définitivement ce chant
      </button>
    </>
  );
}