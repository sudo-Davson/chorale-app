import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChoristeRequestForm from '@/components/ChoristeRequestForm';

export const instant = false;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single();
  const { data: program } = await supabase.from('event_songs').select('songs(id, title, composer)').eq('event_id', id);
  const { data: myAttendance } = await supabase.from('attendance').select('*').eq('event_id', id).eq('profile_id', user.id).maybeSingle();

  if (!event) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><p>Événement introuvable</p></div>;

  const date = new Date(event.start_at);

  return (
    <div className="pb-32 max-w-lg mx-auto p-6 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <header className="mt-4 mb-6">
        <Link href="/agenda" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">← Retour</Link>
        <h1 className="text-3xl font-extrabold text-white">{event.title}</h1>
        <p className="text-purple-400 font-medium mt-1">
          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-sm text-gray-400 mt-1">📍 {event.location || 'Lieu à définir'}</p>
      </header>

      {/* 👇 NOUVEAU : Affichage du PDF du programme (si uploadé) */}
      {event.program_pdf_url && (
        <a href={event.program_pdf_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-500 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <div className="text-sm opacity-90">Programme officiel</div>
              <div>Ouvrir le PDF de la messe</div>
            </div>
          </div>
          <span>→</span>
        </a>
      )}

      {/* 👇 NOUVEAU : Affichage du texte d'introduction / Évangile */}
      {event.liturgy_notes && (
        <div className="mb-8 p-5 rounded-3xl bg-white/5 border border-white/10 italic text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          "{event.liturgy_notes}"
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">📋 Chants à préparer</h2>
        {program && program.length > 0 ? (
          <div className="space-y-3">
            {program.map((item: any, index: number) => (
              <Link href={`/chants/${item.songs.id}`} key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{item.songs.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{item.songs.composer}</p>
                </div>
                <div className="text-sm font-bold text-purple-400">Écouter →</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
            L'admin n'a pas encore sélectionné de chants pour cet événement.
          </div>
        )}
      </section>

      <ChoristeRequestForm 
        eventId={id} eventType={event.type} 
        existingStatus={myAttendance?.status} existingReason={myAttendance?.request_reason}
      />
    </div>
  );
}