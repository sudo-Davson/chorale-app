'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminAgendaPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('repetition');
  const [startAt, setStartAt] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isoDate = new Date(startAt).toISOString();

    const { error } = await supabase.from('events').insert({
      title,
      type,
      start_at: isoDate,
      location,
      created_by: user?.id
    });

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage('Événement créé avec succès !');
      setTitle(''); setStartAt(''); setLocation('');
      setTimeout(() => router.push('/admin'), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Nouvel Événement</h1>
      </header>

      {message && (
        <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 ml-1">Titre de l'événement *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Répétition générale" className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 ml-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none appearance-none">
            <option value="repetition" className="text-slate-900 bg-white">🎼 Répétition</option>
            <option value="celebration" className="text-slate-900 bg-white">⛪ Messe / Célébration</option>
            <option value="concert" className="text-slate-900 bg-white">🎤 Concert</option>
            <option value="reunion" className="text-slate-900 bg-white">👥 Réunion</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 ml-1">Date et Heure *</label>
          <input type="datetime-local" required value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none [color-scheme:dark]" />
        </div>

        <div>
          <label className="text-xs text-gray-400 ml-1">Lieu</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Salle paroissiale" className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>

        <button type="submit" disabled={loading} className="w-full mt-6 bg-purple-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-purple-500 transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Créer l\'événement'}
        </button>
      </form>
    </div>
  );
}