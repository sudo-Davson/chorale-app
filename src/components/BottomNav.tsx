'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/accueil', label: 'Accueil', icon: '🏠' },
  { href: '/chants', label: 'Chants', icon: '🎼' },
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/chat', label: 'Chat', icon: '💬' }, // 👈 Modifié ici
  { href: '/annonces', label: 'Alertes', icon: '📢' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-white/10 z-40 pb-safe">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`text-xl mb-0.5 transition-transform ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <div className="text-[10px] font-medium">{item.label}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}