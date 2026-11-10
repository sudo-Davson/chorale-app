'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminChantsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [category, setCategory] = useState('Messe');
  const [lyrics, setLyrics] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    async function loadSongs() {
      const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
      if (data) setSongs(data);
    }
    loadSongs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('Ajout en cours...');

    const { data: { user } } = await supabase.auth.getUser();

    let pdfUrl = null;
    let audioUrl = null;

    try {
      // 1. Upload du PDF
      if (pdfFile) {
        const fileName = `${Date.now()}-${Math.random()}.pdf`;
        const { error: uploadError } = await supabase.storage.from('songs').upload(`pdfs/${fileName}`, pdfFile);
        if (uploadError) throw new Error(`Erreur PDF : ${uploadError.message}`);
        
        const { data } = supabase.storage.from('songs').getPublicUrl(`pdfs/${fileName}`);
        pdfUrl = data.publicUrl;
      }

      // 2. Upload de l'audio
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('songs').upload(`audios/${fileName}`, audioFile);
        if (uploadError) throw new Error(`Erreur Audio : ${uploadError.message}`);

        const { data } = supabase.storage.from('songs').getPublicUrl(`audios/${fileName}`);
        audioUrl = data.publicUrl;
      }

      // 3. Insertion dans la base de données
      const { data: newSong, error: dbError } = await supabase.from('songs').insert({
        title, composer, category, lyrics,
        pdf_url: pdfUrl, audio_full_url: audioUrl,
        created_by: user?.id
      }).select().single();

      if (dbError) throw dbError;

      setMessage('Chant ajouté avec succès !');
      setSongs([newSong, ...songs]);
      setTitle(''); setComposer(''); setLyrics(''); setPdfFile(null); setAudioFile(null);
      
      router.push(`/admin/chants/${newSong.id}`);

    } catch (error: any) {
      setMessage(error.message); // Affichera l'erreur exacte si l'upload échoue
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Gérer les chants</h1>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-bold mb-4 text-emerald-400">Ajouter un nouveau chant</h2>
        {message && (
          <div className={`p-3 mb-4 rounded-xl text-sm ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Titre du chant *" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input type="text" placeholder="Compositeur" value={composer} onChange={e => setComposer(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="Messe" className="text-slate-900 bg-white">Messe</option>
            <option value="Louange" className="text-slate-900 bg-white">Louange</option>
            <option value="Noël" className="text-slate-900 bg-white">Noël</option>
          </select>

          <textarea placeholder="Paroles..." rows={3} value={lyrics} onChange={e => setLyrics(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>

          <div className="p-3 border border-white/10 rounded-xl bg-white/5 space-y-3">
            <div>
              <label className="text-xs text-emerald-400 block mb-1">Partition (PDF)</label>
              <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-emerald-500/10 file:text-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-purple-400 block mb-1">Audio Principal (MP3)</label>
              <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-purple-500/10 file:text-purple-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 p-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Enregistrement...' : 'Ajouter le chant'}
          </button>
        </form>
      </div>

      <h2 className="text-lg font-bold mb-4">Chants existants ({songs.length})</h2>
      
      {songs.length === 0 ? (
        <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
          Aucun chant pour le moment. Utilisez le formulaire ci-dessus.
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map(song => (
            <Link href={`/admin/chants/${song.id}`} key={song.id} className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{song.title}</h3>
                  <p className="text-xs text-gray-400">{song.composer || 'Auteur inconnu'}</p>
                </div>
                <span className="text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  Gérer les voix →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}