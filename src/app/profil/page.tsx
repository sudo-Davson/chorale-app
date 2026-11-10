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
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    voice: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        if (data) {
          setEditData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            voice: data.voice || ''
          });
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // 👈 Vide le cache de Next.js pour oublier la session
    router.push('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
        voice: editData.voice
      })
      .eq('id', profile.id);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-purple-400 font-medium">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      
      <header className="mt-4 mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-white">Profil</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-sm text-blue-400 bg-blue-400/10 px-4 py-2 rounded-full border border-blue-400/20 font-medium hover:bg-blue-400/20 transition-colors"
            >
              Modifier
            </button>
          )}
          <button 
            onClick={handleLogout} 
            className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20 font-medium hover:bg-red-400/20 transition-colors"
          >
            Quitter
          </button>
        </div>
      </header>

      {message && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 text-center">
          {message}
        </div>
      )}

      {profile && (
        <>
          <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(168,85,247,0.4)] border-4 border-slate-900 mb-4 text-white font-bold">
              {profile.first_name?.charAt(0) || '👤'}
            </div>
            <h2 className="text-2xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
            <p className="text-purple-400 font-medium mt-1 uppercase tracking-wider text-sm">
              🎤 {profile.voice || 'Voix non définie'}
            </p>
          </div>

          {/* Mode Édition */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 ml-1">Prénom</label>
                  <input type="text" required value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1">Nom</label>
                  <input type="text" required value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 ml-1">Téléphone</label>
                <input 
                  type="text" 
                  inputMode="tel" 
                  value={editData.phone} 
                  onChange={e => setEditData({...editData, phone: e.target.value})} 
                  className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                  placeholder="Ex: 0612345678" 
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 ml-1">Votre voix</label>
                <select 
                  value={editData.voice} 
                  onChange={e => setEditData({...editData, voice: e.target.value})} 
                  className="w-full mt-1 p-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-white"
                >
                  <option value="" style={{ color: 'black', backgroundColor: 'white' }}>-- Choisir --</option>
                  <option value="soprano" style={{ color: 'black', backgroundColor: 'white' }}>Soprano</option>
                  <option value="alto" style={{ color: 'black', backgroundColor: 'white' }}>Alto</option>
                  <option value="tenor" style={{ color: 'black', backgroundColor: 'white' }}>Ténor</option>
                  <option value="basse" style={{ color: 'black', backgroundColor: 'white' }}>Basse</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/10 text-white p-3 rounded-xl font-medium">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold disabled:opacity-50">
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            /* Mode Lecture */
            <div className="space-y-3">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div className="text-gray-400 text-sm">Email</div>
                <div className="font-medium text-white text-sm">{profile.email}</div>
              </div>
              
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div className="text-gray-400 text-sm">Téléphone</div>
                <div className="font-medium text-white text-sm">{profile.phone || 'Non renseigné'}</div>
              </div>

              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div className="text-gray-400 text-sm">Rôle</div>
                <div className="font-medium text-white capitalize text-sm">{profile.role}</div>
              </div>
            </div>
          )}

          {/* Bouton Admin */}
          {profile.role === 'admin' && !isEditing && (
            <button 
              onClick={() => router.push('/admin')} 
              className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-3xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>⚙️</span> Panneau d'administration
            </button>
          )}
          
          <div className="mt-10 p-5 rounded-3xl border border-white/5 bg-slate-900/50 text-center">
            <p className="text-xs text-gray-500">Chorale App - Version 1.0.0</p>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}