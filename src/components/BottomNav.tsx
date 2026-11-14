'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Calendar, MessageCircle, Bell, User } from 'lucide-react';

const items = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/chants', label: 'Chants', icon: Music },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/annonces', label: 'Alertes', icon: Bell },
  { href: '/profil', label: 'Profil', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-white/10 z-40 pb-safe">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`mb-0.5 transition-transform ${active ? 'scale-110' : ''}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <div className="text-[10px] font-medium">{item.label}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}