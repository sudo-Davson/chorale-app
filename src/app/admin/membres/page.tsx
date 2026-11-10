'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminMembresPage() {
  const supabase = createClient();
  const [membres, setMembres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      fetchMembres();
    }
    init();
  }, []);

  async function fetchMembres() {
    const { data } = await supabase.from('profiles').select('*').order('last_name');
    if (data) setMembres(data);
    setLoading(false);
  }

  async function toggleRole(id: string, currentRole: string) {
    if (id === currentUserId) {
      alert("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }

    const newRole = currentRole === 'admin' ? 'choriste' : 'admin';
    if (!confirm(`Passer ce membre en ${newRole} ?`)) return;

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      fetchMembres();
    }
  }

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-xs text-gray-400">Gérer les rôles de la chorale</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {membres.map(membre => (
            <div key={membre.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{membre.first_name} {membre.last_name}</h3>
                <p className="text-xs text-gray-400">{membre.voice || 'Voix non définie'}</p>
              </div>
              <button 
                onClick={() => toggleRole(membre.id, membre.role)}
                disabled={membre.id === currentUserId}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors disabled:opacity-50 ${
                  membre.role === 'admin' 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
              >
                {membre.id === currentUserId ? 'Vous' : membre.role === 'admin' ? 'Admin ✓' : 'Nommer Admin'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}