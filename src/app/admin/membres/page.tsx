'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminMembresPage() {
  const supabase = createClient();
  const [membres, setMembres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMembre, setSelectedMembre] = useState<any>(null);
  const [membreASupprimer, setMembreASupprimer] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(profile);
      }
      fetchMembres();
    }
    init();
  }, [supabase]);

  async function fetchMembres() {
    const { data } = await supabase.from('profiles').select('*').order('last_name');
    if (data) setMembres(data);
    setLoading(false);
  }

  async function confirmToggleRole() {
    if (!selectedMembre) return;
    const newRole = selectedMembre.role === 'choriste' ? 'admin' : 'choriste';
    
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selectedMembre.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Le rôle a été mis à jour en ${newRole}.`);
      fetchMembres();
    }
  }

  async function handleDeleteUser() {
    if (!membreASupprimer) return;
    
    // Appel de la fonction RPC sécurisée que nous avons créée dans Supabase
    const { error } = await supabase.rpc('delete_user_by_admin', { 
      target_user_id: membreASupprimer.id 
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Le compte a été définitivement supprimé.');
      fetchMembres();
    }
  }

  // Fonction pour savoir si on affiche le bouton supprimer
  const peutSupprimer = (membre: any) => {
    if (!currentUser) return false;
    if (membre.id === currentUser.id) return false; // On ne peut pas se supprimer soi-même
    
    if (currentUser.role === 'super_admin') return true; // Le super admin peut tout supprimer
    if (currentUser.role === 'admin' && membre.role === 'choriste') return true; // L'admin simple ne peut supprimer que les choristes
    
    return false;
  };

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-xs text-gray-400">Gérer les rôles et les accès</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {membres.map(membre => (
            <div key={membre.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {membre.first_name} {membre.last_name}
                  {membre.role === 'super_admin' && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full">SUPER ADMIN</span>}
                </h3>
                <p className="text-xs text-gray-400 capitalize">{membre.voice || 'Voix non définie'}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Bouton pour changer le rôle (seulement si ce n'est pas un super_admin) */}
                {membre.role !== 'super_admin' && (
                  <button 
                    onClick={() => setSelectedMembre(membre)}
                    disabled={membre.id === currentUser?.id}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors disabled:opacity-50 ${
                      membre.role === 'admin' 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {membre.id === currentUser?.id ? 'Vous' : membre.role === 'admin' ? 'Admin' : 'Nommer Admin'}
                  </button>
                )}

                {/* Bouton de suppression */}
                {peutSupprimer(membre) && (
                  <button 
                    onClick={() => setMembreASupprimer(membre)}
                    className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors"
                    title="Supprimer le compte"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de changement de rôle */}
      <ConfirmModal 
        isOpen={!!selectedMembre}
        onClose={() => setSelectedMembre(null)}
        onConfirm={confirmToggleRole}
        title="Changer le rôle"
        message={selectedMembre ? `Voulez-vous passer ${selectedMembre.first_name} en ${selectedMembre.role === 'admin' ? 'choriste' : 'administrateur'} ?` : ''}
        isDestructive={selectedMembre?.role === 'admin'}
      />

      {/* Modale de suppression de compte */}
      <ConfirmModal 
        isOpen={!!membreASupprimer}
        onClose={() => setMembreASupprimer(null)}
        onConfirm={handleDeleteUser}
        title="Supprimer le compte"
        message={`Voulez-vous vraiment supprimer définitivement le compte de ${membreASupprimer?.first_name} ${membreASupprimer?.last_name} ? Cette action est irréversible.`}
        isDestructive={true}
      />
    </div>
  );
}