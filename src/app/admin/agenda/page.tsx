'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminAgendaPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('repetition');
  const [startAt, setStartAt] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase.from('events').select('*').order('start_at', { ascending: true });
      if (data) setEvents(data);
    }
    loadEvents();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    const isoDate = new Date(startAt).toISOString();

    const { data: newEvent, error } = await supabase.from('events').insert({
      title, type, start_at: isoDate, location, created_by: user?.id
    }).select().single();

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage('Événement créé avec succès !');
      setEvents([...events, newEvent]);
      setTitle(''); setStartAt(''); setLocation('');
      setTimeout(() => router.push(`/admin/agenda/${newEvent.id}`), 1000); // Redirection vers la gestion
    }
    setLoading(false);
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Gérer l'agenda</h1>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-bold mb-4 text-emerald-400">Créer un événement</h2>
        {message && <div className="p-3 mb-4 rounded-xl text-sm bg-green-500/20 text-green-400">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Titre (ex: Messe du dimanche)" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          
          <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="repetition" className="text-slate-900">🎼 Répétition</option>
            <option value="celebration" className="text-slate-900">⛪ Messe</option>
            <option value="concert" className="text-slate-900">🎤 Concert</option>
          </select>

          <input type="datetime-local" required value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl [color-scheme:dark] outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="text" placeholder="Lieu" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 p-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Création...' : 'Créer et préparer le programme'}
          </button>
        </form>
      </div>

      <h2 className="text-lg font-bold mb-4">Événements à venir</h2>
      <div className="space-y-3">
        {events.map(event => (
          <Link href={`/admin/agenda/${event.id}`} key={event.id} className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{event.title}</h3>
                <p className="text-xs text-gray-400">{new Date(event.start_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="text-sm text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full">Gérer →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}