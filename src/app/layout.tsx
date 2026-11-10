import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from 'sonner'; // 👈 Import
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chorale App',
  description: 'Gestion de la chorale',
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geist.className} bg-slate-950 text-white min-h-screen antialiased`}>
        {children}
        {/* 👇 Le gestionnaire de notifications */}
        <Toaster 
          theme="dark" 
          position="top-center"
          toastOptions={{
            style: { background: '#0f172a', border: '1px solid #1e293b', color: 'white' }
          }}
        />
      </body>
    </html>
  );
}