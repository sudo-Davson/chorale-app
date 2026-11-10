import { Geist } from 'next/font/google';
import './globals.css';
import type { Metadata, Viewport } from 'next';

const geist = Geist({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#020617', 
};

export const metadata: Metadata = {
  title: 'Chorale',
  description: 'Application de gestion de chorale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      {/* On utilise un fond très sombre (slate-950) et un texte clair */}
      <body className={`${geist.className} bg-slate-950 text-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}