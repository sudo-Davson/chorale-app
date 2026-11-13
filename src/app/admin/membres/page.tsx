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
  
  // 👇 État pour la barre de recherche
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (!['admin', 'super_admin'].includes(profile?.role)) {
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

  // 👇 Filtrer les membres selon la recherche
  const membresFiltres = membres.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-xs text-gray-400">Gérer les rôles et les accès</p>
        </div>
      </header>

      {/* 👇 BARRE DE RECHERCHE */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Rechercher un membre par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {membresFiltres.length === 0 ? (
            <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
              Aucun membre trouvé pour "{searchTerm}".
            </div>
          ) : (
            membresFiltres.map(membre => (
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

                {membre.role !== 'super_admin' && (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-16">Rôle :</span>
                      <select 
                        value={membre.role}
                        onChange={(e) => handleRoleChange(membre.id, e.target.value)}
                        disabled={membre.id === currentUser?.id}
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="choriste" className="text-slate-900">Choriste</option>
                        <option value="maitre_choeur" className="text-slate-900">Maître de chœur</option>
                        <option value="admin" className="text-slate-900">Admin (Bureau)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-gray-500 ml-20 italic">
                      L'Admin possède les droits du Bureau (sans la musique).
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
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