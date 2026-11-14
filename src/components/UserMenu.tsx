'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function UserMenu({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* L'Avatar (Bouton) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 hover:border-purple-500 transition-colors focus:outline-none flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-xl"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          profile?.first_name?.charAt(0) || '👤'
        )}
      </button>

      {/* Le Menu Déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 border-b border-white/10 mb-2">
            <p className="text-sm font-bold text-white truncate">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          
          <Link href="/profil" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            👤 Mon profil
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-1"
          >
            🚪 Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}