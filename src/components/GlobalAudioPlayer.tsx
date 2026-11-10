'use client';

import { useState } from 'react';

export default function GlobalAudioPlayer({ url }: { url: string }) {
  const [isLooping, setIsLooping] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <audio controls loop={isLooping} className="w-full">
        <source src={url} type="audio/mpeg" />
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
  );
}