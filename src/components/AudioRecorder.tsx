'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AudioRecorder({ songId }: { songId: string }) {
  const supabase = createClient();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion du chronomètre
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
        stream.getTracks().forEach(track => track.stop()); // Éteint le micro
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

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const sendRecording = async () => {
    if (!audioBlob) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // 1. Upload de l'audio
      const fileName = `sub_${user.id}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(`submissions/${fileName}`, audioBlob);

      if (uploadError) throw uploadError;

      // 2. Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(`submissions/${fileName}`);

      // 3. Enregistrement dans la base
      const { error: dbError } = await supabase.from('song_submissions').insert({
        profile_id: user.id,
        song_id: songId,
        audio_url: publicUrl,
        status: 'pending'
      });

      if (dbError) throw dbError;

      toast.success("Enregistrement envoyé au maître de chœur !");
      resetRecording();
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
    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl mb-8">
      <h3 className="text-lg font-bold text-white mb-2">🎙️ Prouver que je maîtrise</h3>
      <p className="text-xs text-gray-400 mb-4">Enregistrez-vous en chantant votre partition et envoyez-le au maître de chœur.</p>

      {!audioUrl ? (
        <div className="flex flex-col items-center justify-center py-4">
          {isRecording ? (
            <button onClick={stopRecording} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </button>
          ) : (
            <button onClick={startRecording} className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-lg">
              <span className="text-3xl">🎤</span>
            </button>
          )}
          <p className={`mt-4 font-mono text-xl font-bold ${isRecording ? 'text-red-400' : 'text-gray-500'}`}>
            {isRecording ? formatTime(recordingTime) : "Appuyez pour enregistrer"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button onClick={resetRecording} className="flex-1 bg-white/10 text-white p-3 rounded-xl font-medium">Recommencer</button>
            <button onClick={sendRecording} disabled={uploading} className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold disabled:opacity-50">
              {uploading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}