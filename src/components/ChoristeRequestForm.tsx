'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ChoristeRequestForm({ 
  eventId, 
  eventType, 
  existingStatus, 
  existingReason 
}: { 
  eventId: string, 
  eventType: string, 
  existingStatus?: string, 
  existingReason?: string 
}) {
  const supabase = createClient();
  const [reason, setReason] = useState(existingReason || '');
  const [loading, setLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(existingStatus === 'requested');
  const [attendanceId, setAttendanceId] = useState<string | null>(null);

  // Au chargement, on vérifie si une demande existe déjà pour récupérer son ID
  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (data) {
        setAttendanceId(data.id);
        if (data.status === 'requested') setIsRequested(true);
      }
    }
    checkExisting();
  }, [eventId, supabase]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté.");
      setLoading(false);
      return;
    }

    let error;

    if (attendanceId) {
      // Si une ligne existe déjà, on la met à jour
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ status: 'requested', request_reason: reason, fee: 0 })
        .eq('id', attendanceId);
      error = updateError;
    } else {
      // Sinon, on insère une nouvelle ligne
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          event_id: eventId,
          profile_id: user.id,
          status: 'requested',
          request_reason: reason,
          fee: 0
        });
      error = insertError;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Votre demande a été envoyée à l'administration.");
      setIsRequested(true);
    }
    setLoading(false);
  }

  return (
    <section className="bg-white/5 border border-white/10 p-5 rounded-3xl">
      <h2 className="text-lg font-bold text-white mb-2">🚫 Demander une permission</h2>
      <p className="text-xs text-gray-400 mb-4">
        {eventType === 'celebration' 
          ? "Une absence non justifiée à une messe coûte 300 FCFA." 
          : "Une absence non justifiée à une répétition coûte 100 FCFA. Un retard coûte 50 FCFA."}
      </p>

      {isRequested ? (
        <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl text-sm font-medium text-center">
          ⏳ Demande envoyée. En attente de validation par l'admin.
        </div>
      ) : (
        <form onSubmit={handleRequest} className="space-y-3">
          <textarea 
            required
            placeholder="Raison de votre absence (ex: Maladie, Travail...)" 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm resize-none focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50">
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>
      )}
    </section>
  );
}