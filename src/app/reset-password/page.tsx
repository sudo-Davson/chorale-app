'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Vérifier si l'utilisateur est bien authentifié via le lien (Supabase le fait automatiquement)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Lien invalide ou expiré. Veuillez recommencer la procédure.");
      }
    };
    checkSession();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/accueil'), 2000);
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-950">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-8">
        <h1 className="text-2xl font-extrabold text-center mb-2 text-white">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        {success ? (
          <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-medium">Mot de passe modifié !</p>
            <p className="text-xs text-gray-400 mt-2">Redirection vers l'accueil...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder="Nouveau mot de passe" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6} 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
            />
            <input 
              type="password" 
              placeholder="Confirmer le mot de passe" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              minLength={6} 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
            />

            {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}