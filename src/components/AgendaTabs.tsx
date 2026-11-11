'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard'; // 👈 Import de la carte

export default function AgendaTabs({ events, isAdmin }: { events: any[], isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<'events' | 'programs'>('events');

  const now = new Date().toISOString();
  
  const eventsFuturs = events
    .filter(e => e.start_at >= now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const programmesPdf = events
    .filter(e => e.program_pdf_url)
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <>
      <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'events' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 À venir
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'programs' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          📄 Archives PDF
        </button>
      </div>

      {activeTab === 'events' && (
        <div className="space-y-4">
          {eventsFuturs.length > 0 ? (
            eventsFuturs.map((event) => (
              // 👇 On utilise le composant EventCard qui contient le bouton supprimer
              <EventCard key={event.id} event={event} isAdmin={isAdmin} />
            ))
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">Aucun événement à venir.</div>
          )}
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-3">
          {programmesPdf.length > 0 ? (
            programmesPdf.map((event) => (
              <a href={event.program_pdf_url} target="_blank" rel="noreferrer" key={event.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xl">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{event.title}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(event.start_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Ouvrir</div>
              </a>
            ))
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">Aucun programme PDF archivé.</div>
          )}
        </div>
      )}
    </>
  );
}