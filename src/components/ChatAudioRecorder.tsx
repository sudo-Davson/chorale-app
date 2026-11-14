'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ChatAudioRecorder({ 
  onSuccess, onCancel 
}: { 
  onSuccess: (audioUrl: string) => void, onCancel: () => void 
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

  // Démarrer l'enregistrement automatiquement à l'ouverture
  useEffect(() => {
    startRecording();
    return () => stopRecording();
  }, []);

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
      toast.error("Veuillez autoriser l'accès au micro.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const fileName = `chat-audio-${user.id}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(`chat/${fileName}`, audioBlob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`chat/${fileName}`);
      onSuccess(publicUrl);
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
    <div className="flex items-center gap-3 w-full animate-in slide-in-from-bottom-2">
      {!audioUrl ? (
        <>
          <div className="flex-1 bg-white/5 rounded-full px-4 py-3 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2 text-red-400 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-mono text-sm font-bold">{formatTime(recordingTime)}</span>
            </div>
            <span className="text-xs text-gray-400">Enregistrement...</span>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-2">✕</button>
        </>
      ) : (
        <>
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-2">✕</button>
          <button onClick={handleSend} disabled={uploading} className="bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-500 disabled:opacity-50">
            {uploading ? '...' : '➤'}
          </button>
        </>
      )}
    </div>
  );
}