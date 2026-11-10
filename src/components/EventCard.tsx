'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';

export default function EventCard({ event, isAdmin }: { event: any, isAdmin: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const date = new Date(event.start_at);
  const isRepetition = event.type === 'repetition';

  async function handleDelete() {
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Événement annulé avec succès.');
      router.refresh();
    }
  }

  return (
    <>
      <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex gap-5 items-start relative group hover:bg-white/10 transition-colors backdrop-blur-md">
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl flex-shrink-0 ${isRepetition ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
          <span className="text-xs font-bold uppercase">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
          <span className="text-2xl font-black">{date.getDate()}</span>
        </div>
        <div className="flex-1 pr-6">
          <span className={`text-xs font-bold uppercase tracking-wider ${isRepetition ? 'text-purple-400' : 'text-blue-400'}`}>
            {isRepetition ? '🎼 Répétition' : '⛪ Événement'}
          </span>
          <h3 className="font-bold text-lg text-white mt-1">{event.title}</h3>
          <p className="text-sm text-gray-400 mt-1">🕒 {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-sm text-gray-400 mt-1 truncate">📍 {event.location || 'Lieu à définir'}</p>
        </div>
        
        {/* 👇 Le bouton n'apparaît que si isAdmin est true */}
        {isAdmin && (
          <button onClick={() => setShowDeleteModal(true)} className="absolute top-4 right-4 text-red-400 bg-red-500/10 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            ✕
          </button>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Annuler l'événement"
        message="Voulez-vous vraiment annuler cet événement ? Les choristes ne le verront plus dans l'agenda."
        isDestructive={true}
      />
    </>
  );
}