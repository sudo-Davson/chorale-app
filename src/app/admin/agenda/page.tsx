'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminAgendaPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // États pour la création
  const [title, setTitle] = useState('');
  const [type, setType] = useState('repetition');
  const [startAt, setStartAt] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // États pour la liste
  const [events, setEvents] = useState<any[]>([]);
  
  // États pour l'édition
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // État pour la suppression
  const [deletingEvent, setDeletingEvent] = useState<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('start_at', { ascending: true });
    if (data) setEvents(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('Upload en cours...');

    const { data: { user } } = await supabase.auth.getUser();
    const isoDate = new Date(startAt).toISOString();
    let pdfUrl = null;

    try {
      if (pdfFile) {
        const fileName = `programme-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage.from('songs').upload(`programs/${fileName}`, pdfFile);
        if (uploadError) throw new Error(`Erreur Upload : ${uploadError.message}`);
        
        const { data } = supabase.storage.from('songs').getPublicUrl(`programs/${fileName}`);
        pdfUrl = data.publicUrl;
      }

      const { data: newEvent, error } = await supabase.from('events').insert({
        title, type, start_at: isoDate, location, created_by: user?.id,
        liturgy_notes: notes || null,
        program_pdf_url: pdfUrl
      }).select().single();

      if (error) throw error;

      setMessage('Événement créé avec succès !');
      setEvents([...events, newEvent]);
      setTitle(''); setStartAt(''); setLocation(''); setNotes(''); setPdfFile(null);
      setTimeout(() => router.push(`/admin/agenda/${newEvent.id}`), 1000);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditType(event.type);
    setEditLocation(event.location || '');
    setEditNotes(event.liturgy_notes || '');
    
    const dateObj = new Date(event.start_at);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
    setEditStartAt(localISOTime);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    const isoDate = new Date(editStartAt).toISOString();
    const { error } = await supabase.from('events').update({
      title: editTitle, type: editType, start_at: isoDate, location: editLocation,
      liturgy_notes: editNotes || null
    }).eq('id', editingEvent.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Événement modifié avec succès !');
      setEditingEvent(null);
      loadEvents();
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    const { error } = await supabase.from('events').delete().eq('id', deletingEvent.id);
    if (error) toast.error(error.message);
    else { toast.success('Événement supprimé.'); loadEvents(); }
  };

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Gérer l'agenda</h1>
      </header>

      {/* FORMULAIRE DE CRÉATION */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-bold mb-4 text-emerald-400">Créer un événement</h2>
        {message && <div className={`p-3 mb-4 rounded-xl text-sm ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Titre (ex: Messe du dimanche)" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          
          <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="repetition" className="text-slate-900">🎼 Répétition</option>
            <option value="celebration" className="text-slate-900">⛪ Messe</option>
            <option value="concert" className="text-slate-900">🎤 Concert</option>
          </select>

          <input type="datetime-local" required value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl [color-scheme:dark] outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="text" placeholder="Lieu" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          
          <textarea placeholder="Thème / Évangile du jour (ex: 26e dimanche du temps ordinaire...)" rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl resize-none outline-none focus:ring-2 focus:ring-emerald-500 text-sm"></textarea>

          <div className="p-3 border border-white/10 rounded-xl bg-white/5">
            <label className="text-xs text-blue-400 block mb-1">Programme de messe (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-500/10 file:text-blue-400" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 p-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Création...' : 'Créer l\'événement'}
          </button>
        </form>
      </div>

      {/* LISTE DES ÉVÉNEMENTS */}
      <h2 className="text-lg font-bold mb-4">Tous les événements</h2>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-white">{event.title}</h3>
                <p className="text-xs text-gray-400">{new Date(event.start_at).toLocaleDateString('fr-FR')} à {new Date(event.start_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${event.type === 'celebration' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {event.type === 'celebration' ? 'Messe' : event.type === 'repetition' ? 'Répétition' : 'Événement'}
              </span>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
              <Link href={`/admin/agenda/${event.id}`} className="flex-1 bg-emerald-600/20 text-emerald-400 text-center py-2 rounded-lg text-sm font-bold hover:bg-emerald-600/30 transition-colors">
                Gérer
              </Link>
              <button onClick={() => openEditModal(event)} className="flex-1 bg-blue-600/20 text-blue-400 text-center py-2 rounded-lg text-sm font-bold hover:bg-blue-600/30 transition-colors">
                ✏️ Modifier
              </button>
              <button onClick={() => setDeletingEvent(event)} className="flex-1 bg-red-600/20 text-red-400 text-center py-2 rounded-lg text-sm font-bold hover:bg-red-600/30 transition-colors">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE DE MODIFICATION */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Modifier l'événement</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              
              <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500">
                <option value="repetition" className="text-slate-900">🎼 Répétition</option>
                <option value="celebration" className="text-slate-900">⛪ Messe</option>
                <option value="concert" className="text-slate-900">🎤 Concert</option>
              </select>

              <input type="datetime-local" required value={editStartAt} onChange={e => setEditStartAt(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl [color-scheme:dark] outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Lieu" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              
              <textarea placeholder="Thème / Évangile" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 bg-white/10 p-3 rounded-xl font-medium">Annuler</button>
                <button type="submit" className="flex-1 bg-blue-600 p-3 rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        title="Supprimer l'événement"
        message={`Voulez-vous vraiment supprimer "${deletingEvent?.title}" ?`}
        isDestructive={true}
      />
    </div>
  );
}