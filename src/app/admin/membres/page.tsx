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

  // 👇 Fonction pour changer le rôle via le menu déroulant
  async function handleRoleChange(membreId: string, newRole: string) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', membreId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Le rôle a été mis à jour.`);
      fetchMembres();
    }
  }

  async function handleDeleteUser() {
    if (!membreASupprimer) return;
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: membreASupprimer.id });
    if (error) toast.error(error.message);
    else { toast.success('Compte supprimé.'); fetchMembres(); }
  }

  const peutSupprimer = (membre: any) => {
    if (!currentUser) return false;
    if (membre.id === currentUser.id) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin' && membre.role !== 'super_admin' && membre.role !== 'admin') return true;
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
            <div key={membre.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">
                    {membre.first_name} {membre.last_name}
                    {membre.role === 'super_admin' && <span className="ml-2 text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full">SUPER ADMIN</span>}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">{membre.voice || 'Voix non définie'}</p>
                </div>
                
                {peutSupprimer(membre) && (
                  <button onClick={() => setMembreASupprimer(membre)} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors">
                    🗑️
                  </button>
                )}
              </div>

              {/* 👇 LE SÉLECTEUR DE RÔLE */}
              {membre.role !== 'super_admin' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 w-16">Rôle :</span>
                  <select 
                    value={membre.role}
                    onChange={(e) => handleRoleChange(membre.id, e.target.value)}
                    disabled={membre.id === currentUser?.id}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="choriste" className="text-slate-900">Choriste</option>
                    <option value="maitre_choeur" className="text-slate-900">Maître de chœur</option>
                    <option value="admin" className="text-slate-900">Admin</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!membreASupprimer}
        onClose={() => setMembreASupprimer(null)}
        onConfirm={handleDeleteUser}
        title="Supprimer le compte"
        message={`Voulez-vous vraiment supprimer le compte de ${membreASupprimer?.first_name} ${membreASupprimer?.last_name} ?`}
        isDestructive={true}
      />
    </div>
  );
}