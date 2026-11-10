'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';

export default function AnnouncementCard({ annonce }: { annonce: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isImportant = annonce.priority === 'important';

  async function handleDelete() {
    const { error } = await supabase.from('announcements').delete().eq('id', annonce.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Annonce supprimée.');
      router.refresh();
    }
  }

  return (
    <>
      <div className={`p-5 rounded-3xl backdrop-blur-md border relative group ${
        isImportant ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex justify-between items-start mb-2 pr-6">
          <h3 className={`font-bold text-lg ${isImportant ? 'text-orange-400' : 'text-white'}`}>
            {annonce.title}
          </h3>
          {isImportant && (
            <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full">IMPORTANT</span>
          )}
        </div>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{annonce.content}</p>
        <p className="text-xs text-gray-500 mt-4">Publié le {new Date(annonce.created_at).toLocaleDateString('fr-FR')}</p>
        <button onClick={() => setShowDeleteModal(true)} className="absolute top-4 right-4 text-red-400 bg-red-500/10 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          ✕
        </button>
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'annonce"
        message="Voulez-vous vraiment supprimer cette annonce ?"
        isDestructive={true}
      />
    </>
  );
}