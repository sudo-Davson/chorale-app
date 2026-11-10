'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminAnnoncesPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('announcements').insert({
      title,
      content,
      priority,
      created_by: user?.id
    });

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage('Annonce publiée avec succès !');
      setTitle(''); setContent(''); setPriority('normal');
      setTimeout(() => router.push('/admin'), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Nouvelle Annonce</h1>
      </header>

      {message && (
        <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 ml-1">Titre de l'annonce *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Changement d'horaire" className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 ml-1">Contenu *</label>
          <textarea required rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Écrivez votre message ici..." className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"></textarea>
        </div>

        <div>
          <label className="text-xs text-gray-400 ml-1">Niveau d'importance</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none">
            <option value="normal" className="text-slate-900 bg-white">📢 Normale</option>
            <option value="important" className="text-slate-900 bg-white">🚨 Importante (Mise en avant)</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-6 bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-orange-500 transition-colors disabled:opacity-50">
          {loading ? 'Publication...' : 'Publier l\'annonce'}
        </button>
      </form>
    </div>
  );
}