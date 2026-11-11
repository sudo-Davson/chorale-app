'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AgendaTabs({ events }: { events: any[] }) {
  const [activeTab, setActiveTab] = useState<'events' | 'programs'>('events');

  const now = new Date().toISOString();
  
  // Onglet 1 : Événements à venir
  const eventsFuturs = events
    .filter(e => e.start_at >= now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  // Onglet 2 : Programmes PDF (on ne garde que ceux qui ont un PDF)
  const programmesPdf = events
    .filter(e => e.program_pdf_url)
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <>
      {/* Onglets */}
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

      {/* Contenu : Onglet Événements à venir */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {eventsFuturs.length > 0 ? (
            eventsFuturs.map((event) => {
              const date = new Date(event.start_at);
              const isRepetition = event.type === 'repetition';
              
              return (
                <Link href={`/agenda/${event.id}`} key={event.id} className="block p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
                  <div className="flex gap-5 items-start">
                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl flex-shrink-0 ${isRepetition ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      <span className="text-xs font-bold uppercase">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      <span className="text-2xl font-black">{date.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isRepetition ? 'text-purple-400' : 'text-blue-400'}`}>
                        {isRepetition ? '🎼 Répétition' : '⛪ Événement'}
                      </span>
                      <h3 className="font-bold text-lg text-white mt-1">{event.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">🕒 {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-gray-500 self-center">▶</div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400">Aucun événement à venir.</div>
          )}
        </div>
      )}

      {/* Contenu : Onglet Archives PDF */}
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