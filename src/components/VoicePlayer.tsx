'use client';

import { useState } from 'react';

export default function VoicePlayer({ tracks }: { tracks: any[] }) {
  const [activeVoice, setActiveVoice] = useState<string | null>(tracks.length > 0 ? tracks[0].voice : null);

  if (!tracks || tracks.length === 0) return null;

  const activeTrack = tracks.find(t => t.voice === activeVoice);
  const voix = ['soprano', 'alto', 'tenor', 'basse'];
  const colors: Record<string, string> = {
    soprano: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    alto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    tenor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    basse: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8">
      <h2 className="text-lg font-bold text-white mb-4">🎧 Entraînement par voix</h2>
      
      {/* Boutons de sélection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {voix.map(v => {
          const hasTrack = tracks.some(t => t.voice === v);
          if (!hasTrack) return null;
          
          return (
            <button
              key={v}
              onClick={() => setActiveVoice(v)}
              className={`py-2 px-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                activeVoice === v ? colors[v] : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* Lecteur audio */}
      {activeTrack && (
        <div className="mt-4">
          <audio key={activeTrack.audio_url} controls autoPlay className="w-full">
            <source src={activeTrack.audio_url} type="audio/mpeg" />
          </audio>
        </div>
      )}
    </div>
  );
}