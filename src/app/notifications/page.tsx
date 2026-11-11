'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Supprimer cette notification ?")) return;
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification supprimée.');
  };

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accueil" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gray-400 animate-pulse mt-10">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
          Aucune notification pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-2xl border transition-colors relative group ${
                notif.is_read 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
              }`}
            >
              {!notif.is_read && (
                <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
              
              <h3 className={`font-bold mb-1 pr-6 ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>
                {notif.title}
              </h3>
              <p className="text-sm text-gray-400 mb-3">{notif.message}</p>
              
              <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3">
                <span className="text-xs text-gray-500">
                  {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className="flex gap-2">
                  {!notif.is_read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500/30 transition-colors"
                    >
                      Marquer comme lu
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/20 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}