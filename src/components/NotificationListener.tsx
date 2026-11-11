'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function NotificationListener() {
  const supabase = createClient();

  useEffect(() => {
    let channel: any;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // On écoute les nouvelles notifications pour cet utilisateur
      channel = supabase
        .channel('user_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            // On affiche le toast quand une notification arrive
            toast(payload.new.title, {
              description: payload.new.message,
              duration: 10000, // 10 secondes
              icon: '🔔',
            });
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  return null; // Ce composant ne s'affiche pas visuellement
}