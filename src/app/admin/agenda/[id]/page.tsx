'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminEventDetailPage() {
  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <header className="mt-4 mb-6 flex items-center gap-4">
        <Link href="/admin/agenda" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-xl font-bold">Gestion de l'événement</h1>
      </header>
      <Suspense fallback={<div className="text-center p-8 text-purple-400 animate-pulse mt-20">Chargement...</div>}>
        <EventDetailContent />
      </Suspense>
    </div>
  );
}

function EventDetailContent() {
  const params = useParams();
  const eventId = params.id as string;
  const supabase = createClient();

  const [event, setEvent] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, any>>({}); 
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!eventId) return;
    const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEvent(eventData);
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_name');
    setMembres(profiles || []);
    const { data: att } = await supabase.from('attendance').select('*').eq('event_id', eventId);
    const attMap: Record<string, any> = {};
    att?.forEach(a => { attMap[a.profile_id] = a; });
    setAttendance(attMap);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [eventId]);

  const calculerFrais = (status: string, eventType: string) => {
    // 👇 Permission (excused) ne coûte pas d'argent
    if (status === 'present' || status === 'requested' || status === 'excused') return 0;
    if (status === 'late') return 50;
    if (status === 'absent') return eventType === 'celebration' ? 300 : 100;
    return 0;
  };

  const updateAttendance = async (profileId: string, status: string, sendNotification = false) => {
    const currentStatus = attendance[profileId]?.status;

    if (currentStatus === status) {
      await supabase.from('attendance').delete().eq('event_id', eventId).eq('profile_id', profileId);
      const newAtt = { ...attendance };
      delete newAtt[profileId];
      setAttendance(newAtt);
      toast.info('Pointage annulé.');
      return;
    }

    const fee = calculerFrais(status, event.type);
    const currentAtt = attendance[profileId];

    setAttendance({
      ...attendance,
      [profileId]: { ...currentAtt, status, fee, is_paid: currentAtt?.is_paid || false }
    });

    if (currentAtt && currentAtt.id) {
      await supabase.from('attendance').update({ status, fee }).eq('id', currentAtt.id);
    } else {
      const { data } = await supabase.from('attendance').insert({
        event_id: eventId, profile_id: profileId, status, fee
      }).select().single();
      if (data) setAttendance(prev => ({ ...prev, [profileId]: data }));
    }

    // 👇 Envoi de la notification si c'est une acceptation de permission
    if (sendNotification) {
      await supabase.from('notifications').insert({
        profile_id: profileId,
        title: 'Permission accordée',
        message: `Votre demande d'absence pour "${event.title}" a été acceptée.`
      });
    }

    toast.success('Pointage mis à jour.');
  };

  const annulerPointage = async (profileId: string) => {
    if (!confirm("Voulez-vous annuler ce pointage ?")) return;
    await supabase.from('attendance').delete().eq('event_id', eventId).eq('profile_id', profileId);
    const newAtt = { ...attendance };
    delete newAtt[profileId];
    setAttendance(newAtt);
    toast.success('Pointage remis à zéro.');
  };

  const togglePaid = async (profileId: string) => {
    const att = attendance[profileId];
    if (!att || !att.id) return;
    const newStatus = !att.is_paid;
    setAttendance({ ...attendance, [profileId]: { ...att, is_paid: newStatus } });
    await supabase.from('attendance').update({ is_paid: newStatus }).eq('id', att.id);
  };

  if (loading) return <div className="text-center mt-10 text-gray-400">Chargement...</div>;

  const demandesEnAttente = membres.filter(m => attendance[m.id]?.status === 'requested');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">{event?.title}</h2>
        <p className="text-sm text-purple-400">
          {event?.type === 'celebration' ? '⛪ Messe' : '🎼 Répétition'}
        </p>
      </div>

      {demandesEnAttente.length > 0 && (
        <section className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
          <h3 className="text-lg font-bold text-orange-400 mb-2">⚠️ Demandes en attente</h3>
          <div className="space-y-2">
            {demandesEnAttente.map(m => (
              <div key={m.id} className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl">
                <div>
                  <p className="font-bold">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-gray-400 italic">" {attendance[m.id]?.request_reason} "</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateAttendance(m.id, 'absent')} className="flex-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-500/30">Refuser</button>
                  {/* 👇 On appelle updateAttendance avec sendNotification = true et le statut 'excused' */}
                  <button onClick={() => updateAttendance(m.id, 'excused', true)} className="flex-1 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-500/30">Accepter</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">✅ Pointage & Amendes</h3>
        <div className="space-y-3">
          {membres.map(membre => {
            const att = attendance[membre.id];
            const status = att?.status;
            const fee = att?.fee || 0;

            return (
              <div key={membre.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{membre.first_name} {membre.last_name}</span>
                    {status && (
                      <button onClick={() => annulerPointage(membre.id)} className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded-md">✕ Annuler</button>
                    )}
                  </div>
                  {fee > 0 && (
                    <button onClick={() => togglePaid(membre.id)} className={`px-3 py-1 rounded-full text-xs font-bold ${att.is_paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {fee} F - {att.is_paid ? 'Payé ✅' : 'À payer ❌'}
                    </button>
                  )}
                </div>
                
                {/* 👇 Les boutons de pointage */}
                <div className="flex gap-2">
                  <button onClick={() => updateAttendance(membre.id, 'present')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${status === 'present' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400'}`}>Présent</button>
                  <button onClick={() => updateAttendance(membre.id, 'excused')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${status === 'excused' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>Permission</button>
                  <button onClick={() => updateAttendance(membre.id, 'late')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${status === 'late' ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-400'}`}>Retard</button>
                  <button onClick={() => updateAttendance(membre.id, 'absent')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${status === 'absent' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400'}`}>Absent</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}