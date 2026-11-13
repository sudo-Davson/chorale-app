'use client';

import { useState, useRef } from 'react';

export default function GlobalAudioPlayer({ url }: { url: string }) {
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <audio ref={audioRef} controls loop={isLooping} className="w-full">
          <source src={url} type="audio/mpeg" />
        </audio>
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`p-3 rounded-2xl border flex-shrink-0 transition-colors ${
            isLooping ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
          }`}
          title="Lire en boucle"
        >
          🔁
        </button>
      </div>
      
      {/* 👇 Boutons de vitesse */}
      <div className="flex gap-2 justify-center mt-1">
        {[0.5, 0.75, 1, 1.25].map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              speed === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}