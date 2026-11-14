'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  // Trouver l'index actif
  const activeIndex = items.findIndex(item => pathname.startsWith(item.href));
  const [currentIndex, setCurrentIndex] = useState(activeIndex !== -1 ? activeIndex : 0);

  // Valeurs animées pour la position
  const x = useMotionValue(0);

  // Mettre à jour l'index si l'URL change
  useEffect(() => {
    if (activeIndex !== -1) setCurrentIndex(activeIndex);
  }, [pathname, activeIndex]);

  // Calculer la position X en fonction de la largeur de l'écran
  const updatePosition = (index: number, isInitial = false) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const tabWidth = containerWidth / items.length;
    const targetX = (tabWidth * index) + (tabWidth / 2);

    if (isInitial) {
      x.set(targetX);
    } else {
      // Animation "Spring" fluide (comme sur le GIF)
      animate(x, targetX, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  // Initialisation et gestion du redimensionnement
  useEffect(() => {
    updatePosition(currentIndex, true);
    
    const handleResize = () => updatePosition(currentIndex, true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Quand on clique sur un onglet
  useEffect(() => {
    updatePosition(currentIndex);
  }, [currentIndex]);

  // 👇 La magie du masque : On crée un trou (notch) qui suit la valeur X
  const maskImage = useMotionTemplate`radial-gradient(circle 40px at ${x}px -10px, transparent 98%, black 100%), linear-gradient(black, black)`;

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pb-safe">
      <div 
        ref={containerRef}
        className="max-w-md mx-auto relative h-16"
      >
        {/* 1. LA BARRE NOIRE AVEC LE MASQUE (L'encoche qui glisse) */}
        <motion.div 
          className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl"
          style={{ 
            maskImage, 
            WebkitMaskImage: maskImage // Pour la compatibilité iOS/Safari
          }}
        />

        {/* 2. LA BULLE VERTE (Qui glisse en même temps) */}
        <motion.div
          className="absolute -top-5 w-14 h-14 bg-[#39FF14] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]"
          style={{ 
            x, 
            translateX: '-50%' // Centre la bulle sur la valeur x
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

        {/* 3. LES ICÔNES CLIQUABLES (Au-dessus de la barre) */}
        <div className="absolute inset-0 flex items-center justify-around z-10">
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCurrentIndex(index)}
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
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}