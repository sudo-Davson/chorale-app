import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="pb-20 max-w-lg mx-auto p-6 min-h-screen bg-slate-950 text-white">
      <Suspense fallback={<div className="text-center p-8 text-emerald-400 animate-pulse mt-20">Vérification des accès...</div>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  // 👇 On autorise l'admin ET le super_admin
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 mt-10">
        <h1 className="text-2xl font-bold mb-2 text-red-400">Accès refusé 🚫</h1>
        <p className="text-gray-400 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
        <Link href="/accueil" className="text-purple-400 underline hover:text-purple-300">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      <header className="mt-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Espace Admin</h1>
          <p className="text-gray-400 mt-1">Gestion de la chorale</p>
        </div>
        <Link href="/accueil" className="text-sm bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">Quitter</Link>
      </header>

      {/* ... (Gardez tous les boutons de menu ici, ils sont inchangés) ... */}
      <div className="grid grid-cols-1 gap-4">
        <Link href="/admin/chants" className="p-6 rounded-3xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-400 transition-all flex items-center justify-between group">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">🎼 Gérer les chants</h2>
            <p className="text-sm text-gray-400">Ajouter, modifier ou supprimer un chant</p>
          </div>
          <span className="text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link href="/admin/agenda" className="p-6 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between group">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">📅 Gérer l'agenda</h2>
            <p className="text-sm text-gray-400">Créer, modifier ou supprimer un événement</p>
          </div>
          <span className="text-purple-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link href="/admin/annonces" className="p-6 rounded-3xl bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30 hover:border-orange-400 transition-all flex items-center justify-between group">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">📢 Gérer les annonces</h2>
            <p className="text-sm text-gray-400">Publier une information importante</p>
          </div>
          <span className="text-orange-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link href="/admin/membres" className="p-6 rounded-3xl bg-gradient-to-r from-teal-600/20 to-emerald-600/20 border border-teal-500/30 hover:border-teal-400 transition-all flex items-center justify-between group">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">👥 Gérer les membres</h2>
            <p className="text-sm text-gray-400">Nommer des administrateurs</p>
          </div>
          <span className="text-teal-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link href="/admin/presences" className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 hover:border-indigo-400 transition-all flex items-center justify-between group">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">📋 Registre de présence</h2>
            <p className="text-sm text-gray-400">Consulter les présences et les amendes</p>
          </div>
          <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </>
  );
}