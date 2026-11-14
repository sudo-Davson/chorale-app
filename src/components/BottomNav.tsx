'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useMotionTemplate, animate } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeIndex = items.findIndex(item => pathname.startsWith(item.href));
  const [currentIndex, setCurrentIndex] = useState(activeIndex !== -1 ? activeIndex : 0);
  
  const x = useMotionValue(0);

  // 👇 useLayoutEffect permet de calculer la position AVANT que l'écran ne s'affiche (évite le saut)
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const tabWidth = containerWidth / items.length;
    const targetX = (tabWidth * currentIndex) + (tabWidth / 2);
    
    // On place le cercle instantanément au bon endroit au premier chargement
    x.set(targetX);
  }, [currentIndex, x]);

  // Gérer les changements de page
  useEffect(() => {
    if (activeIndex !== -1 && activeIndex !== currentIndex) {
      setCurrentIndex(activeIndex);
    }
  }, [pathname, activeIndex]);

  // 👇 On anime le déplacement quand l'utilisateur clique
  const handleTabClick = (index: number) => {
    if (!containerRef.current) return;
    setCurrentIndex(index);
    
    const containerWidth = containerRef.current.offsetWidth;
    const tabWidth = containerWidth / items.length;
    const targetX = (tabWidth * index) + (tabWidth / 2);
    
    animate(x, targetX, { type: 'spring', stiffness: 400, damping: 35 });
  };

  // 👇 Le masque qui crée l'encoche (on enlève le flou de la barre pour que le trou soit net)
  const maskImage = useMotionTemplate`radial-gradient(circle 42px at ${x}px -12px, transparent 99%, black 100%), linear-gradient(black, black)`;

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pb-safe">
      <div ref={containerRef} className="max-w-md mx-auto relative h-16">
        
        {/* LA BARRE NOIRE (Opaque, sans flou pour que le masque fonctionne) */}
        <motion.div 
          className="absolute inset-0 bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl"
          style={{ 
            maskImage, 
            WebkitMaskImage: maskImage 
          }}
        />

        {/* LE CERCLE VERT QUI GLISSE */}
        <motion.div
          className="absolute -top-5 w-14 h-14 bg-[#39FF14] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)] z-20"
          style={{ 
            left: x,
            translateX: '-50%' 
          }}
        >
          {items[currentIndex] && (
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {(() => {
                const Icon = items[currentIndex].icon;
                return <Icon size={26} strokeWidth={2.5} className="text-black" />;
              })()}
            </motion.div>
          )}
        </motion.div>

        {/* LES ICÔNES CLIQUABLES */}
        <div className="absolute inset-0 flex items-center justify-around z-10">
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                onClick={() => handleTabClick(index)}
                className="flex-1 h-full flex flex-col items-center justify-center group outline-none"
              >
                <Icon 
                  size={22} 
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-transparent' : 'text-gray-500 group-hover:text-gray-300'
                  }`} 
                />
                <span className={`text-[9px] font-medium mt-1 transition-colors duration-300 ${
                  isActive ? 'text-transparent' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {item.label}
                </span>
                
                {/* On utilise un lien Next.js caché pour déclencher la navigation */}
                <Link href={item.href} className="absolute inset-0 opacity-0" aria-label={item.label} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}