'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminFinancesPage() {
  const supabase = createClient();
  const [membres, setMembres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchFinances();
  }, [selectedMonth]);

  async function fetchFinances() {
    setLoading(true);
    // 1. Récupérer tous les profils
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_name');
    
    // 2. Récupérer toutes les amendes du mois sélectionné
    const startDate = `${selectedMonth}-01T00:00:00Z`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString();
    
    // On joint les événements pour filtrer par date
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*, events!inner(start_at)')
      .gte('events.start_at', startDate)
      .lte('events.start_at', endDate);

    // 3. Fusionner les données : calculer les dettes par membre
    const finances = profiles?.map(profile => {
      const atts = attendances?.filter(a => a.profile_id === profile.id) || [];
      const totalDu = atts.reduce((sum, a) => sum + (a.is_paid ? 0 : (a.fee || 0)), 0);
      const totalPaye = atts.reduce((sum, a) => sum + (a.is_paid ? (a.fee || 0) : 0), 0);
      const nbAbsences = atts.filter(a => a.status === 'absent').length;
      const nbRetards = atts.filter(a => a.status === 'late').length;
      
      return { ...profile, totalDu, totalPaye, nbAbsences, nbRetards };
    }) || [];

    setMembres(finances);
    setLoading(false);
  }

  const handleMarkPaidAll = async (profileId: string) => {
    if (!confirm("Marquer toutes les amendes de ce mois comme payées ?")) return;
    
    const { error } = await supabase.rpc('mark_all_paid', { 
      p_profile_id: profileId, 
      p_month: selectedMonth 
    });

    // Note: On utilisera une requête simple plutôt qu'une RPC pour l'instant
    const startDate = `${selectedMonth}-01T00:00:00Z`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString();
    
    // On doit faire une mise à jour complexe, on va simplifier en mettant à jour via une boucle ou un RPC
    // Pour faire simple, on va juste recharger la page
    toast.success("Fonctionnalité en cours de développement");
  };

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-2xl font-bold">Finances</h1>
        </div>
      </header>

      <div className="mb-6">
        <label className="text-xs text-gray-400 ml-1">Sélectionner le mois</label>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl [color-scheme:dark] text-white"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Calcul des finances...</div>
      ) : (
        <div className="space-y-4">
          {membres.map(m => (
            <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">{m.first_name} {m.last_name}</h3>
                {m.totalDu > 0 ? (
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                    Doit: {m.totalDu} F
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                    À jour ✅
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>❌ Absences: {m.nbAbsences}</span>
                <span>⏱️ Retards: {m.nbRetards}</span>
                <span>💸 Payé: {m.totalPaye} F</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}