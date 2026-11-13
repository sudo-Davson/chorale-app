'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminVoiceRecorder({ 
  songId, voiceId, onSuccess, onCancel 
}: { 
  songId: string, voiceId: string, onSuccess: () => void, onCancel: () => void 
}) {
  const supabase = createClient();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordingTime(0);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Impossible d'accéder au micro. Vérifiez vos permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    setUploading(true);

    try {
      const fileName = `${songId}-${voiceId}.webm`;
      
      // Upload sur Supabase Storage (on écrase l'ancien avec upsert: true)
      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(`voices/${fileName}`, audioBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(`voices/${fileName}`);

      // Mise à jour de la table voice_tracks
      const { error: dbError } = await supabase.from('voice_tracks').upsert({
        song_id: songId,
        voice: voiceId,
        audio_url: publicUrl
      }, { onConflict: 'song_id, voice' });

      if (dbError) throw dbError;

      toast.success('Enregistrement sauvegardé avec succès !');
      onSuccess(); // Rafraîchit la page
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black/30 p-4 rounded-xl border border-white/10 mt-3">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-white">Enregistrement direct</h4>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-white">✕ Fermer</button>
      </div>

      {!audioUrl ? (
        <div className="flex flex-col items-center justify-center py-2">
          {isRecording ? (
            <button onClick={stopRecording} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </button>
          ) : (
            <button onClick={startRecording} className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 shadow-lg">
              <span className="text-2xl">🎤</span>
            </button>
          )}
          <p className={`mt-3 font-mono font-bold ${isRecording ? 'text-red-400' : 'text-gray-500'}`}>
            {isRecording ? formatTime(recordingTime) : "Appuyez pour enregistrer"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <audio src={audioUrl} controls className="w-full h-10" />
          <div className="flex gap-2">
            <button onClick={() => { setAudioBlob(null); setAudioUrl(null); }} className="flex-1 bg-white/10 text-white text-xs py-2 rounded-lg font-medium">Recommencer</button>
            <button onClick={saveRecording} disabled={uploading} className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded-lg font-bold disabled:opacity-50">
              {uploading ? 'Sauvegarde...' : 'Sauvegarder la piste'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}