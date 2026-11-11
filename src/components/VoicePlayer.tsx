'use client';

import { useState } from 'react';

const VOIX_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  soprano: { label: 'Soprano', color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-500/30' },
  alto: { label: 'Alto', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
  tenor: { label: 'Ténor', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  basse: { label: 'Basse', color: 'text-teal-400', bg: 'bg-teal-500/20 border-teal-500/30' },
};

export default function VoicePlayer({ tracks, userVoice }: { tracks: any[], userVoice?: string }) {
  const [activeVoice, setActiveVoice] = useState<string | null>(
    userVoice || (tracks.length > 0 ? tracks[0].voice : null)
  );
  const [isLooping, setIsLooping] = useState(false);

  if (!tracks || tracks.length === 0) return null;

  const tracksAffichees = userVoice 
    ? tracks.filter(t => t.voice === userVoice) 
    : tracks;

  const activeTrack = tracks.find(t => t.voice === activeVoice);

  if (tracksAffichees.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 text-center text-gray-400 text-sm">
        Aucune piste audio n'est disponible pour votre voix ({userVoice}).
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8">
      <h2 className="text-lg font-bold text-white mb-4">
        🎧 Entraînement {userVoice ? `(Voix : ${userVoice})` : 'par voix'}
      </h2>
      
      {!userVoice && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {tracksAffichees.map(t => {
            const config = VOIX_CONFIG[t.voice];
            if (!config) return null;
            
            return (
              <button
                key={t.voice}
                onClick={() => setActiveVoice(t.voice)}
                className={`py-2 px-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                  activeVoice === t.voice ? config.bg + ' ' + config.color : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {activeTrack && (
        <div className="mt-2 flex items-center gap-3">
          <audio key={activeTrack.audio_url} controls autoPlay loop={isLooping} className="w-full">
            <source src={activeTrack.audio_url} type="audio/mpeg" />
          </audio>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-3 rounded-2xl border flex-shrink-0 transition-colors ${
              isLooping 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            title="Lire en boucle"
          >
            🔁
          </button>
        </div>
      )}
    </div>
  );
}