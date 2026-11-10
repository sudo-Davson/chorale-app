'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [voice, setVoice] = useState(''); // 👈 Nouvel état pour la voix
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/accueil');
    } 
    else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            first_name: firstName, 
            last_name: lastName,
            voice: voice || null // 👈 On envoie la voix au Trigger
          } 
        },
      });
      if (error) setError(error.message);
      else router.push('/accueil');
    } 
    else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSuccessMsg("Un lien de réinitialisation vous a été envoyé par email.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-950">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          🎼 Chorale
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          {mode === 'login' && 'Ravi de vous revoir'}
          {mode === 'signup' && 'Rejoignez la chorale'}
          {mode === 'forgot' && 'Réinitialiser le mot de passe'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                <input type="text" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
              </div>
              <select 
                value={voice} 
                onChange={(e) => setVoice(e.target.value)} 
                required 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="" disabled className="text-slate-900">Choisissez votre voix</option>
                <option value="soprano" className="text-slate-900">Soprano</option>
                <option value="alto" className="text-slate-900">Alto</option>
                <option value="tenor" className="text-slate-900">Ténor</option>
                <option value="basse" className="text-slate-900">Basse</option>
              </select>
            </>
          )}
          
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          
          {mode !== 'forgot' && (
            <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          )}

          {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
          {successMsg && <p className="text-sm text-green-400 bg-green-400/10 p-3 rounded-xl border border-green-400/20">{successMsg}</p>}

          <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? "S'inscrire" : "Envoyer le lien"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-gray-400">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('forgot')} className="hover:text-white transition-colors">Mot de passe oublié ?</button>
              <button type="button" onClick={() => setMode('signup')} className="hover:text-white transition-colors">Pas de compte ? S'inscrire</button>
            </>
          )}
          {mode === 'signup' && (
            <button type="button" onClick={() => setMode('login')} className="hover:text-white transition-colors">Déjà un compte ? Se connecter</button>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('login')} className="hover:text-white transition-colors">← Retour à la connexion</button>
          )}
        </div>
      </div>
    </div>
  );
}