'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/components/BottomNav';

export default function ProfilPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalDue: 0, totalPaid: 0,
    absents: 0, lates: 0, excused: 0, presents: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '', last_name: '', phone: '', voice: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
        
        if (profileData) {
          setEditData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            phone: profileData.phone || '',
            voice: profileData.voice || ''
          });
        }

        const { data: attendances } = await supabase.from('attendance').select('*, events(start_at)').eq('profile_id', user.id);

        if (attendances) {
          let totalDue = 0; let totalPaid = 0; let absents = 0; let lates = 0; let excused = 0; let presents = 0;
          const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();

          attendances.forEach(a => {
            if (!a.is_paid) totalDue += (a.fee || 0); else totalPaid += (a.fee || 0);
            const eventDate = a.events?.start_at ? new Date(a.events.start_at) : new Date(a.created_at);
            if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
              if (a.status === 'absent') absents++;
              if (a.status === 'late') lates++;
              if (a.status === 'excused') excused++;
              if (a.status === 'present') presents++;
            }
          });
          setStats({ totalDue, totalPaid, absents, lates, excused, presents });
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('profiles').update({
      first_name: editData.first_name, last_name: editData.last_name, phone: editData.phone, voice: editData.voice
    }).eq('id', profile.id);

    if (error) setMessage(`Erreur : ${error.message}`);
    else {
      setProfile({ ...profile, ...editData });
      setMessage('Profil mis à jour avec succès !');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="animate-pulse text-purple-400">Chargement...</div></div>;

  const moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  
  // 👇 On vérifie dans le tableau des rôles
  const isStaff = profile?.roles?.some((r: string) => ['admin', 'super_admin', 'maitre_choeur'].includes(r));

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      {/* ... (Le reste du code de la page Profil reste identique jusqu'au bouton) ... */}
      
      {profile && (
        <>
          {/* ... (Header, avatar, situation, édition/lecture) ... */}
          
          {/* 👇 Le bouton d'admin apparaît maintenant correctement */}
          {isStaff && !isEditing && (
            <button onClick={() => router.push('/admin')} className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-3xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2">
              <span>⚙️</span> Panneau d'administration
            </button>
          )}
          
          {/* ... (Footer) ... */}
        </>
      )}
      <BottomNav />
    </div>
  );
}