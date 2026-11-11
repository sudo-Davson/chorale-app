'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function NotificationListener() {
  // 👇 On affiche un petit point rouge temporaire pour être sûr que le composant est chargé
  console.log("🟢 Le composant NotificationListener est monté !");

  useEffect(() => {
    const supabase = createClient();
    let channel: any;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("🔴 Pas d'utilisateur connecté.");
        return;
      }

      console.log("🔔 Écoute des notifications activée pour :", user.id);

      channel = supabase
        .channel(`user_notifs_${user.id}`) // Nom unique pour éviter les conflits
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🎉 Nouvelle notification reçue !", payload);
            toast(payload.new.title, {
              description: payload.new.message,
              duration: 10000,
              icon: '🔔',
            });
          }
        )
        .subscribe((status) => {
          console.log("Statut de la connexion Realtime :", status);
        });
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []); // Tableau de dépendances vide pour ne lancer qu'une seule fois

  // 👇 On affiche un point visuel très discret sur la page pour confirmer
  return (
    <div className="fixed top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Notifications actives"></div>
  );
}