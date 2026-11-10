import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chorale App',
    short_name: 'Chorale',
    description: 'Application de gestion et d\'entraînement pour la chorale',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // Le bleu nuit de votre design
    theme_color: '#020617',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}