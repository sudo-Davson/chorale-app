'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/accueil', label: 'Accueil', icon: '🏠' },
  { href: '/chants', label: 'Chants', icon: '🎼' },
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/annonces', label: 'Alertes', icon: '📢' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // On remonte un peu la barre du bas (bottom-6) pour laisser de la place au bouton
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4">
      <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex justify-between items-center px-2 h-16">
        
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {/* Le bouton actif qui ressort */}
              {active ? (
                <div className="absolute -top-7 flex flex-col items-center animate-in zoom-in-75 duration-300">
                  <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(147,51,234,0.5)] border-4 border-slate-950">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 mt-1">{item.label}</span>
                </div>
              ) : (
                /* Les boutons inactifs restent dans la barre */
                <div className="flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                  <div className="text-xl grayscale">{item.icon}</div>
                  <span className="text-[9px] font-medium text-gray-400 mt-1">{item.label}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}