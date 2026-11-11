'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminAnnoncesPage() {
  const supabase = createClient();
  
  // États pour la création
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal'); // 👈 C'est ici qu'on gère l'importance
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // États pour la liste et la suppression
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [annonceASupprimer, setAnnonceASupprimer] = useState<any>(null);

  useEffect(() => {
    loadAnnonces();
  }, []);

  async function loadAnnonces() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnonces(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('announcements').insert({
      title, content, priority, created_by: user?.id
    });

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage('Annonce publiée avec succès !');
      setTitle(''); setContent(''); setPriority('normal');
      loadAnnonces(); // Rafraîchit la liste
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!annonceASupprimer) return;
    
    const { error } = await supabase.from('announcements').delete().eq('id', annonceASupprimer.id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Annonce supprimée.');
      loadAnnonces(); // Rafraîchit la liste
    }
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Gérer les annonces</h1>
      </header>

      {/* 👇 FORMULAIRE DE CRÉATION */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-bold mb-4 text-orange-400">Publier une info importante</h2>
        {message && <div className={`p-3 mb-4 rounded-xl text-sm ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Titre de l'annonce *" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          
          <textarea required rows={4} placeholder="Écrivez votre message ici..." value={content} onChange={e => setContent(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl resize-none outline-none focus:ring-2 focus:ring-orange-500 text-sm"></textarea>

          {/* 👇 CHOIX DE L'IMPORTANCE */}
          <div>
            <label className="text-xs text-gray-400 ml-1 mb-1 block">Niveau d'importance</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-orange-500">
              <option value="normal" className="text-slate-900">📢 Normale</option>
              <option value="important" className="text-slate-900">🚨 Importante (Mise en avant)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 p-3 rounded-xl font-bold disabled:opacity-50 hover:bg-orange-500 transition-colors">
            {loading ? 'Publication...' : 'Publier l\'annonce'}
          </button>
        </form>
      </div>

      {/* 👇 LISTE DES ANNONCES PUBLIÉES AVEC BOUTON POUBELLE */}
      <h2 className="text-lg font-bold mb-4">Annonces publiées ({annonces.length})</h2>
      <div className="space-y-3">
        {annonces.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
            Aucune annonce publiée.
          </div>
        ) : (
          annonces.map(annonce => (
            <div key={annonce.id} className={`p-4 rounded-2xl border ${annonce.priority === 'important' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`font-bold ${annonce.priority === 'important' ? 'text-orange-400' : 'text-white'}`}>
                    {annonce.title}
                  </h3>
                  {annonce.priority === 'important' && (
                    <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full mt-1 inline-block">IMPORTANT</span>
                  )}
                </div>
                <button 
                  onClick={() => setAnnonceASupprimer(annonce)}
                  className="text-red-400 bg-red-500/10 p-2 rounded-full hover:bg-red-500/20 transition-colors"
                  title="Supprimer l'annonce"
                >
                  🗑️
                </button>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2">{annonce.content}</p>
              <p className="text-xs text-gray-500 mt-2">Publié le {new Date(annonce.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          ))
        )}
      </div>

      {/* MODALE DE SUPPRESSION */}
      <ConfirmModal 
        isOpen={!!annonceASupprimer}
        onClose={() => setAnnonceASupprimer(null)}
        onConfirm={handleDelete}
        title="Supprimer l'annonce"
        message={`Voulez-vous vraiment supprimer l'annonce "${annonceASupprimer?.title}" ?`}
        isDestructive={true}
      />
    </div>
  );
}