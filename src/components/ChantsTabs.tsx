'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChantsTabs({ songs, userVoice }: { songs: any[], userVoice?: string }) {
  const [activeTab, setActiveTab] = useState<'audio' | 'partitions'>('audio');
  const [searchTerm, setSearchTerm] = useState(''); // 👈 État pour la recherche

  // 1. Filtrage de base (par voix pour l'audio, par PDF pour les partitions)
  const songsAudioBase = songs.filter(song => {
    if (!userVoice) return true; // Si pas de voix définie, on montre tout
    return song.voice_tracks?.some((track: any) => track.voice === userVoice);
  });

  const songsPartitionsBase = songs.filter(song => song.pdf_url);

  // 2. Filtrage par recherche (Titre ou Compositeur)
  const filterBySearch = (list: any[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(song => 
      song.title.toLowerCase().includes(term) || 
      (song.composer && song.composer.toLowerCase().includes(term))
    );
  };

  const songsAudio = filterBySearch(songsAudioBase);
  const songsPartitions = filterBySearch(songsPartitionsBase);

  const gradients = [
    'from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500'
  ];

  return (
    <>
      {/* 👇 BARRE DE RECHERCHE */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Rechercher un chant ou un auteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Onglets */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎵 Ma voix {userVoice ? `(${userVoice})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('partitions')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'partitions' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          📄 Partitions PDF
        </button>
      </div>

      {/* Contenu : Onglet Audio */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          {songsAudio.length > 0 ? (
            songsAudio.map((song, index) => (
              <Link href={`/chants/${song.id}`} key={song.id} className="flex gap-4 items-center p-3 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl opacity-50">🎵</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white truncate">{song.title}</h3>
                  <p className="text-sm text-gray-400 truncate">{song.composer || 'Auteur inconnu'}</p>
                </div>
                <div className="pr-2 text-gray-500">▶</div>
              </Link>
            ))
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
              {searchTerm 
                ? `Aucun chant trouvé pour "${searchTerm}".`
                : "Aucun chant disponible pour votre voix."}
            </div>
          )}
        </div>
      )}

      {/* Contenu : Onglet Partitions */}
      {activeTab === 'partitions' && (
        <div className="space-y-3">
          {songsPartitions.length > 0 ? (
            songsPartitions.map((song) => (
              <a href={song.pdf_url} target="_blank" rel="noreferrer" key={song.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xl">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.composer || 'Auteur inconnu'}</p>
                </div>
                <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Ouvrir</div>
              </a>
            ))
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">
              {searchTerm 
                ? `Aucune partition trouvée pour "${searchTerm}".`
                : "Aucune partition n'est disponible pour le moment."}
            </div>
          )}
        </div>
      )}
    </>
  );
}