'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChantsTabs({ songs, userVoice }: { songs: any[], userVoice?: string }) {
  const [activeTab, setActiveTab] = useState<'audio' | 'partitions'>('audio');

  // Filtrage pour l'onglet Audio (seulement les chants qui ont la voix de l'utilisateur)
  const songsAudio = songs.filter(song => {
    if (!userVoice) return true;
    return song.voice_tracks?.some((track: any) => track.voice === userVoice);
  });

  // Filtrage pour l'onglet Partitions (seulement les chants qui ont un PDF)
  const songsPartitions = songs.filter(song => song.pdf_url);

  const gradients = [
    'from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500'
  ];

  return (
    <>
      {/* Onglets */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎵 Audio {userVoice ? `(${userVoice})` : ''}
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
              Aucun chant disponible pour votre voix.
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
              Aucune partition n'est disponible pour le moment.
            </div>
          )}
        </div>
      )}
    </>
  );
}