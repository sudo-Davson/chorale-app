'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
      {/* Le conteneur de la barre */}
      <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex justify-between items-center px-2 h-16 relative">
        
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center h-full outline-none"
            >
              {/* 👇 L'effet de glissement (La bulle violette) */}
              {active && (
                <motion.div
                  layoutId="active-tab-bubble"
                  className="absolute inset-0 m-auto w-12 h-12 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.6)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* L'icône */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-colors duration-300 ${
                    active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                />
                
                {/* Le texte (on l'affiche uniquement pour l'onglet actif) */}
                {active && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-bold text-white mt-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}