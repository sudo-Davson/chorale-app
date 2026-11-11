'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // 👈 Import du router

export default function NotificationListener() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`user_notifs_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            // 1. On affiche quand même le toast en direct
            toast(payload.new.title, {
              description: payload.new.message,
              duration: 5000,
              icon: '🔔',
            });
            // 2. On force Next.js à recharger les données pour mettre à jour le badge
            router.refresh(); 
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return null;
}