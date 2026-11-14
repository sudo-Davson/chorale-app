'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function ProfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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

  // 👇 FONCTION D'UPLOAD DE LA PHOTO
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      // 1. Upload sur Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // 3. Mettre à jour le profil
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Photo de profil mise à jour !');
      router.refresh(); // Pour mettre à jour l'avatar sur l'accueil
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // 👇 FONCTION POUR SUPPRIMER LA PHOTO
  const handleRemoveImage = async () => {
    if (!confirm("Supprimer votre photo de profil ?")) return;
    
    try {
      // On extrait le nom du fichier de l'URL
      const fileName = profile.avatar_url.split('/').pop();
      
      // 1. Supprimer du Storage
      if (fileName) {
        await supabase.storage.from('avatars').remove([fileName]);
      }

      // 2. Retirer du profil
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
      
      setProfile({ ...profile, avatar_url: null });
      toast.success('Photo supprimée.');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
      first_name: editData.first_name,
      last_name: editData.last_name,
      phone: editData.phone,
      voice: editData.voice
    }).eq('id', profile.id);

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setProfile({ ...profile, ...editData });
      setMessage('Profil mis à jour avec succès !');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="animate-pulse text-purple-400">Chargement...</div></div>;

  const moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const isStaff = profile?.roles?.some((r: string) => ['admin', 'super_admin', 'maitre_choeur'].includes(r));

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      
      <header className="mt-4 mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-white">Profil</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-sm text-blue-400 bg-blue-400/10 px-4 py-2 rounded-full border border-blue-400/20 font-medium hover:bg-blue-400/20 transition-colors">Modifier</button>
          )}
          <button onClick={handleLogout} className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20 font-medium hover:bg-red-400/20 transition-colors">Quitter</button>
        </div>
      </header>

      {message && <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 text-center">{message}</div>}

      {profile && (
        <>
          <div className="flex flex-col items-center mb-10">
            {/* 👇 AVATAR CLIQUABLE POUR CHANGER LA PHOTO */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(168,85,247,0.4)] border-4 border-slate-900 mb-4 text-white font-bold">
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.first_name?.charAt(0) || '👤'
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-4">
                <span className="text-2xl">📷</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            
            <div className="flex gap-2 mb-2">
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-400 hover:underline">Changer la photo</button>
              {profile.avatar_url && (
                <button onClick={handleRemoveImage} className="text-xs text-red-400 hover:underline">Supprimer</button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
            <p className="text-purple-400 font-medium mt-1 uppercase tracking-wider text-sm">🎤 {profile.voice || 'Voix non définie'}</p>
          </div>

          {/* ... (Le bloc "Ma situation", le mode édition et les infos de contact restent inchangés) ... */}
          {/* ... (Copiez-collez la partie correspondante du code précédent) ... */}
          
          <div className="mb-8 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="font-bold text-white">📊 Ma situation</h3>
              <span className="text-xs text-gray-400 capitalize">{moisActuel}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-black/20 rounded-xl p-2"><p className="text-[10px] text-gray-400 uppercase">Présent</p><p className="text-lg font-bold text-emerald-400">{stats.presents}</p></div>
              <div className="bg-black/20 rounded-xl p-2"><p className="text-[10px] text-gray-400 uppercase">Retard</p><p className="text-lg font-bold text-orange-400">{stats.lates}</p></div>
              <div className="bg-black/20 rounded-xl p-2"><p className="text-[10px] text-gray-400 uppercase">Absent</p><p className="text-lg font-bold text-red-400">{stats.absents}</p></div>
              <div className="bg-black/20 rounded-xl p-2"><p className="text-[10px] text-gray-400 uppercase">Permis</p><p className="text-lg font-bold text-blue-400">{stats.excused}</p></div>
            </div>

            <div className={`p-4 rounded-xl flex justify-between items-center ${stats.totalDue > 0 ? 'bg-red-500/20 border border-red-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
              <div>
                <p className={`text-xs font-bold uppercase ${stats.totalDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Total à payer</p>
                <p className="text-2xl font-black text-white">{stats.totalDue} F</p>
              </div>
              {stats.totalDue === 0 && <span className="text-3xl">✅</span>}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 ml-1">Prénom</label><input type="text" required value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl outline-none text-white" /></div>
                <div><label className="text-xs text-gray-400 ml-1">Nom</label><input type="text" required value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl outline-none text-white" /></div>
              </div>
              <div><label className="text-xs text-gray-400 ml-1">Téléphone</label><input type="text" inputMode="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl outline-none text-white" /></div>
              <div>
                <label className="text-xs text-gray-400 ml-1">Votre voix</label>
                <select value={editData.voice} onChange={e => setEditData({...editData, voice: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl outline-none text-white appearance-none">
                  <option value="" style={{ color: 'black' }}>-- Choisir --</option>
                  <option value="soprano" style={{ color: 'black' }}>Soprano</option>
                  <option value="alto" style={{ color: 'black' }}>Alto</option>
                  <option value="tenor" style={{ color: 'black' }}>Ténor</option>
                  <option value="basse" style={{ color: 'black' }}>Basse</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/10 text-white p-3 rounded-xl font-medium">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold disabled:opacity-50">{saving ? '...' : 'Enregistrer'}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center"><div className="text-gray-400 text-sm">Email</div><div className="font-medium text-white text-sm">{profile.email}</div></div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center"><div className="text-gray-400 text-sm">Téléphone</div><div className="font-medium text-white text-sm">{profile.phone || 'Non renseigné'}</div></div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div className="text-gray-400 text-sm">Rôles</div>
                <div className="font-medium text-white capitalize text-sm">{profile.roles?.join(', ') || 'Choriste'}</div>
              </div>
            </div>
          )}

          {isStaff && !isEditing && (
            <button onClick={() => router.push('/admin')} className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-3xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2">
              <span>⚙️</span> Panneau d'administration
            </button>
          )}
          
          <div className="mt-8 p-5 rounded-3xl border border-white/5 bg-slate-900/50 text-center">
            <p className="text-xs text-gray-500">Chorale App - Version 1.0.0</p>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}