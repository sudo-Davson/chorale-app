'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPresencesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [membresStats, setMembresStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPresences();
  }, [selectedMonth]);

  async function fetchPresences() {
    setLoading(true);
    
    // 1. Récupérer les événements du mois
    const startDate = `${selectedMonth}-01T00:00:00Z`;
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: events } = await supabase
      .from('events')
      .select('id')
      .gte('start_at', startDate)
      .lte('start_at', endDate);

    if (!events || events.length === 0) {
      setMembresStats([]);
      setLoading(false);
      return;
    }

    const eventIds = events.map(e => e.id);

    // 2. Récupérer toutes les présences pour ces événements
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*')
      .in('event_id', eventIds);

    // 3. Récupérer tous les profils
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('last_name');

    // 4. Fusionner et calculer les statistiques par membre
    const stats = profiles?.map(profile => {
      const userAtts = attendances?.filter(a => a.profile_id === profile.id) || [];
      
      const presents = userAtts.filter(a => a.status === 'present').length;
      const absents = userAtts.filter(a => a.status === 'absent').length;
      const lates = userAtts.filter(a => a.status === 'late').length;
      const excused = userAtts.filter(a => a.status === 'excused').length;
      
      const totalDu = userAtts.reduce((sum, a) => sum + (a.is_paid ? 0 : (a.fee || 0)), 0);
      const totalPaye = userAtts.reduce((sum, a) => sum + (a.is_paid ? (a.fee || 0) : 0), 0);

      return {
        ...profile,
        presents, absents, lates, excused,
        totalDu, totalPaye,
        totalEvents: userAtts.length
      };
    }) || [];

    setMembresStats(stats);
    setLoading(false);
  }

  // Filtrer par nom de famille ou prénom
  const membresFiltres = membresStats.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculs globaux pour le résumé
  const totalAbsences = membresStats.reduce((sum, m) => sum + m.absents, 0);
  const totalRetards = membresStats.reduce((sum, m) => sum + m.lates, 0);
  const totalAmendesDues = membresStats.reduce((sum, m) => sum + m.totalDu, 0);
  const totalAmendesPayees = membresStats.reduce((sum, m) => sum + m.totalPaye, 0);

  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-2xl font-bold">Registre</h1>
        </div>
      </header>

      {/* Sélecteur de mois */}
      <div className="mb-6">
        <label className="text-xs text-gray-400 ml-1">Sélectionner le mois</label>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-xl [color-scheme:dark] text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Résumé global du mois */}
      {!loading && membresStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Absences totales</p>
            <p className="text-2xl font-black text-red-400">{totalAbsences}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Retards totaux</p>
            <p className="text-2xl font-black text-orange-400">{totalRetards}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Amendes payées</p>
            <p className="text-2xl font-black text-emerald-400">{totalAmendesPayees} F</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Amendes dues</p>
            <p className="text-2xl font-black text-amber-400">{totalAmendesDues} F</p>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="🔍 Rechercher un membre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 mt-10 animate-pulse">Analyse des données...</div>
      ) : membresStats.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
          Aucun événement enregistré pour ce mois.
        </div>
      ) : (
        <div className="space-y-3">
          {membresFiltres.map(m => (
            <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white">{m.first_name} {m.last_name}</h3>
                {m.totalDu > 0 ? (
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                    Doit: {m.totalDu} F
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                    À jour
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Présent</p>
                  <p className="text-lg font-bold text-emerald-400">{m.presents}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Retard</p>
                  <p className="text-lg font-bold text-orange-400">{m.lates}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Absent</p>
                  <p className="text-lg font-bold text-red-400">{m.absents}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Excusé</p>
                  <p className="text-lg font-bold text-blue-400">{m.excused}</p>
                </div>
              </div>

              <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
                <span>Payé : <strong className="text-white">{m.totalPaye} F</strong></span>
                <span>Événements pointés : <strong className="text-white">{m.totalEvents}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}