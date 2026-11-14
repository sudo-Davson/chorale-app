'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import ChatAudioRecorder from '@/components/ChatAudioRecorder';

export default function ChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(profile);
      }

      // 👇 Requête simplifiée et sécurisée
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Erreur Supabase :", error);
        // Si la jointure échoue, on récupère au moins les messages sans les profils
        const { data: rawData } = await supabase.from('posts').select('*').order('created_at', { ascending: true });
        if (rawData) setMessages(rawData);
      } else if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 200);
    }
  };

  useEffect(() => {
    loadData();

    // Écoute en temps réel
    const channel = supabase.channel('chat_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setUploading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `chat-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(`chat/${fileName}`, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`chat/${fileName}`);
        imageUrl = publicUrl;
      }

      await supabase.from('posts').insert({
        profile_id: currentUser.id,
        content: content.trim() || "📸 Photo",
        image_url: imageUrl,
        message_type: imageUrl ? 'image' : 'text'
      });

      setContent('');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // On force le rechargement immédiatement
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAudioSend = async (audioUrl: string) => {
    await supabase.from('posts').insert({
      profile_id: currentUser.id,
      content: "🎤 Note vocale",
      audio_url: audioUrl,
      message_type: 'audio'
    });
    setIsRecordingAudio(false);
    loadData();
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      
      <header className="pt-6 pb-4 px-4 bg-slate-950/80 backdrop-blur-lg border-b border-white/10 z-10 sticky top-0 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          💬 Chat de la Chorale
        </h1>
        {/* 👇 Bouton de rafraîchissement manuel */}
        <button onClick={loadData} className="text-sm text-gray-400 hover:text-white">🔄</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {loading ? (
          <div className="text-center text-gray-400 animate-pulse mt-10">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">Aucun message pour le moment. Soyez le premier !</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.profile_id === currentUser?.id;
            const dateStr = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr });

            // 👇 Sécurité : on gère le cas où le profil n'est pas chargé
            const authorName = msg.profiles?.first_name || (isMe ? currentUser?.first_name : "Membre");
            const authorAvatar = msg.profiles?.avatar_url || null;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {!isMe && (
                    <span className="text-xs text-gray-400 mb-1 ml-1">{authorName}</span>
                  )}

                  <div className={`p-3 rounded-2xl ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.message_type !== 'audio' && msg.message_type !== 'image' && (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.image_url && (
                      <img src={msg.image_url} alt="Chat" className="rounded-xl max-h-60 object-cover mb-1" />
                    )}

                    {msg.audio_url && (
                      <audio src={msg.audio_url} controls className="w-56 h-10" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 mr-1">{dateStr}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto p-3 bg-slate-950/90 backdrop-blur-lg border-t border-white/5">
        
        {imageFile && (
          <div className="mb-2 relative inline-block">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 rounded-lg object-cover" />
            <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
          </div>
        )}

        {isRecordingAudio ? (
          <ChatAudioRecorder 
            onSuccess={handleAudioSend} 
            onCancel={() => setIsRecordingAudio(false)} 
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors">
              📷
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            
            <input
              type="text"
              placeholder="Votre message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none px-2 py-2"
            />

            {content.trim() || imageFile ? (
              <button type="submit" disabled={uploading} className="p-2 text-purple-500 hover:text-purple-400 transition-colors">
                {uploading ? '...' : '➤'}
              </button>
            ) : (
              <button type="button" onClick={() => setIsRecordingAudio(true)} className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors">
                🎤
              </button>
            )}
          </form>
        )}
      </div>

      <BottomNav />
    </div>
  );
}