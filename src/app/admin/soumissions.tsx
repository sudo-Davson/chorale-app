'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminSoumissionsPage() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const loadData = async () => {
    const { data } = await supabase
      .from('song_submissions')
      .select('*, profiles(first_name, last_name, voice), songs(title)')
      .order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedSub) return;
    
    const { error } = await supabase.from('song_submissions').update({
      status,
      feedback: feedback || null
    }).eq('id', selectedSub.id);

    if (error) {
      toast.error(error.message);
    } else {
      // Envoyer une notification au choriste
      await supabase.from('notifications').insert({
        profile_id: selectedSub.profile_id,
        title: status === 'approved' ? 'Chant validé ! 🎉' : 'Chant à retravailler',
        message: status === 'approved' 
          ? `Félicitations, votre maîtrise de "${selectedSub.songs.title}" est validée.`
          : `Votre enregistrement pour "${selectedSub.songs.title}" doit être retravaillé. ${feedback ? `Motif : ${feedback}` : ''}`
      });
      toast.success(status === 'approved' ? 'Chant validé !' : 'Soumission refusée.');
      setSelectedSub(null);
      setFeedback('');
      loadData();
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Soumissions des choristes</h1>
      </header>

      {submissions.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
          Aucun enregistrement pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white">{sub.profiles.first_name} {sub.profiles.last_name}</h3>
                  <p className="text-xs text-gray-400">Voix : {sub.profiles.voice || 'Non définie'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {sub.status === 'approved' ? 'Validé' : sub.status === 'rejected' ? 'Refusé' : 'En attente'}
                </span>
              </div>
              <p className="text-sm text-purple-400 font-medium mb-3">🎵 {sub.songs.title}</p>
              
              <audio src={sub.audio_url} controls className="w-full h-10 mb-3" />
              
              {sub.status === 'pending' && (
                <button onClick={() => setSelectedSub(sub)} className="w-full bg-blue-600 p-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">
                  Écouter et évaluer
                </button>
              )}
              {sub.feedback && (
                <p className="text-xs text-gray-400 italic mt-2">Note : "{sub.feedback}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODALE D'ÉVALUATION */}
      {selectedSub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Évaluer la prestation</h3>
            <p className="text-sm text-gray-400 mb-4">{selectedSub.profiles.first_name} - {selectedSub.songs.title}</p>
            
            <textarea 
              placeholder="Laissez un commentaire (optionnel)..." 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none mb-4"
            />
            
            <div className="flex gap-2">
              <button onClick={() => handleReview('rejected')} className="flex-1 bg-red-500/20 text-red-400 p-3 rounded-xl font-bold">Refuser</button>
              <button onClick={() => handleReview('approved')} className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-bold">Valider</button>
            </div>
            <button onClick={() => setSelectedSub(null)} className="w-full mt-3 text-gray-500 text-sm hover:text-white">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}