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
  
  // On trouve l'index de la page actuelle
  const activeIndex = items.findIndex(item => pathname.startsWith(item.href));
  const currentIndex = activeIndex !== -1 ? activeIndex : 0;

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pb-safe">
      <div className="max-w-md mx-auto relative h-16 bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl flex items-center px-2">
        
        {/* 👇 LE CERCLE QUI GLISSE (Avec l'effet Spring) */}
        <motion.div
          className="absolute top-0 bottom-0 my-auto w-14 h-14 bg-[#39FF14] rounded-full flex items-center justify-center z-20 pointer-events-none"
          animate={{
            x: `calc(${(100 / items.length)}% * ${currentIndex} + ${(100 / items.length) / 2}% - 28px)`
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {(() => {
            const Icon = items[currentIndex].icon;
            return <Icon size={24} strokeWidth={2.5} className="text-black" />;
          })()}
        </motion.div>

        {/* 👇 L'EFFET D'ENCOCHE (Le faux creux autour du cercle) */}
        <motion.div
          className="absolute top-0 bottom-0 my-auto w-16 h-16 bg-slate-900 rounded-full border-2 border-slate-950 z-10 pointer-events-none"
          animate={{
            x: `calc(${(100 / items.length)}% * ${currentIndex} + ${(100 / items.length) / 2}% - 32px)`
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {/* Ce petit rond noir "creuse" la barre pour faire l'encoche */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 rounded-full" />
        </motion.div>

        {/* 👇 LES VRAIS BOUTONS CLIQUABLES (Next.js Link) */}
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 h-full flex flex-col items-center justify-center relative z-30 outline-none"
            >
              {/* L'icône (elle devient invisible si le bouton est actif pour laisser voir l'icône noire dans le cercle) */}
              <Icon 
                size={22} 
                className={`transition-colors duration-200 ${
                  isActive ? 'opacity-0' : 'text-gray-500 hover:text-gray-300'
                }`} 
              />
              <span className={`text-[9px] font-medium mt-1 transition-colors duration-200 ${
                isActive ? 'opacity-0' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}