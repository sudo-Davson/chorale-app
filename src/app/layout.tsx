import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Script from 'next/script'; // 👈 Ajoutez cet import

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
        {/* 👇 Ajoutez ce script pour activer le Service Worker */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker enregistré avec succès:', registration.scope);
                }, function(err) {
                  console.log('Échec de l\\'enregistrement du ServiceWorker:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}