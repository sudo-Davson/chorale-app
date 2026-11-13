'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { useRouter } from 'next/navigation';

export default function AdminMembresPage() {
  const router = useRouter();
  const supabase = createClient();
  const [membres, setMembres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [membreASupprimer, setMembreASupprimer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!profile?.roles?.includes('admin') && !profile?.roles?.includes('super_admin')) {
          router.push('/admin');
          return;
        }
        setCurrentUser(profile);
      }
      fetchMembres();
    }
    init();
  }, [supabase, router]);

  async function fetchMembres() {
    const { data } = await supabase.from('profiles').select('*').order('last_name');
    if (data) setMembres(data);
    setLoading(false);
  }

  // 👇 Fonction pour ajouter ou retirer un rôle
  async function toggleRole(membreId: string, currentRoles: string[], roleToToggle: string) {
    let newRoles = [...(currentRoles || [])];
    
    if (newRoles.includes(roleToToggle)) {
      newRoles = newRoles.filter(r => r !== roleToToggle);
    } else {
      newRoles.push(roleToToggle);
    }
    
    // On s'assure qu'il reste toujours au moins "choriste"
    if (newRoles.length === 0) newRoles = ['choriste'];

    const { error } = await supabase.from('profiles').update({ roles: newRoles }).eq('id', membreId);
    if (error) toast.error(error.message);
    else { toast.success('Rôles mis à jour.'); fetchMembres(); }
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
    if (currentUser.roles?.includes('super_admin')) return true;
    if (currentUser.roles?.includes('admin') && !membre.roles?.includes('super_admin') && !membre.roles?.includes('admin')) return true;
    return false;
  };

  const membresFiltres = membres.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-xs text-gray-400">Cliquez sur une pastille pour ajouter/retirer un rôle</p>
        </div>
      </header>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {membresFiltres.map(membre => (
            <div key={membre.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {membre.first_name} {membre.last_name}
                    {membre.roles?.includes('super_admin') && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full">SUPER ADMIN</span>}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">Voix : {membre.voice || 'Non définie'}</p>
                </div>
                {peutSupprimer(membre) && (
                  <button onClick={() => setMembreASupprimer(membre)} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors">🗑️</button>
                )}
              </div>

              {/* 👇 LES PASTILLES DE RÔLES */}
              <div className="flex flex-wrap gap-2 mt-2">
                {membre.roles?.includes('super_admin') ? (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Tous les droits (Super Admin)
                  </span>
                ) : (
                  <>
                    <button 
                      onClick={() => toggleRole(membre.id, membre.roles, 'choriste')}
                      disabled={membre.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${membre.roles?.includes('choriste') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                    >
                      Choriste
                    </button>
                    <button 
                      onClick={() => toggleRole(membre.id, membre.roles, 'maitre_choeur')}
                      disabled={membre.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${membre.roles?.includes('maitre_choeur') ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                    >
                      Maître de chœur
                    </button>
                    <button 
                      onClick={() => toggleRole(membre.id, membre.roles, 'admin')}
                      disabled={membre.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${membre.roles?.includes('admin') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                    >
                      Membre du bureau
                    </button>
                  </>
                )}
              </div>
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