'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/accueil', label: 'Accueil', icon: '🏠' },
  { href: '/chants', label: 'Chants', icon: '🎼' },
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/annonces', label: 'Alertes', icon: '📢' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex justify-around py-3 px-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                active 
                  ? 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg scale-110' 
                  : 'hover:bg-white/10 text-gray-400'
              }`}
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <div className={`text-[10px] font-medium ${active ? 'text-white' : 'text-gray-400'}`}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}