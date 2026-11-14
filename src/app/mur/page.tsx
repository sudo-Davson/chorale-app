'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

export default function MurPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour la création de post
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(profile);
    }

    // Récupérer les posts avec le profil de l'auteur et les likes
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(first_name, last_name, avatar_url), post_likes(profile_id)')
      .order('created_at', { ascending: false });
    
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setUploading(true);

    try {
      let imageUrl = null;

      // Upload de l'image si présente
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `posts/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Insertion du post
      const { error } = await supabase.from('posts').insert({
        profile_id: currentUser.id,
        content: content.trim() || "📸 Photo partagée",
        image_url: imageUrl
      });

      if (error) throw error;

      setContent('');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
      toast.success('Publication ajoutée !');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    // Mise à jour visuelle instantanée (Optimistic UI)
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLikes = isLiked 
          ? p.post_likes.filter((l: any) => l.profile_id !== currentUser.id)
          : [...p.post_likes, { profile_id: currentUser.id }];
        return { ...p, post_likes: newLikes };
      }
      return p;
    }));

    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('profile_id', currentUser.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, profile_id: currentUser.id });
    }
  };

  return (
    <div className="pb-32 max-w-lg mx-auto p-4 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      
      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
          Le Mur
        </h1>
        <p className="text-gray-400 mt-1">Partagez des moments avec la chorale</p>
      </header>

      {/* 👇 FORMULAIRE DE CRÉATION DE POST */}
      <form onSubmit={handleCreatePost} className="bg-white/5 border border-white/10 p-4 rounded-3xl mb-8">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-purple-500 flex items-center justify-center font-bold text-white">
            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} className="w-full h-full object-cover" /> : currentUser?.first_name?.charAt(0)}
          </div>
          <textarea
            placeholder="Quoi de neuf ?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none resize-none pt-2"
            rows={2}
          />
        </div>
        
        {imageFile && (
          <div className="mt-2 ml-12 relative">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="rounded-xl max-h-48 object-cover" />
            <button type="button" onClick={() => setImageFile(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">✕</button>
          </div>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium">
            📷 Photo
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          
          <button type="submit" disabled={uploading || (!content.trim() && !imageFile)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {uploading ? 'Envoi...' : 'Publier'}
          </button>
        </div>
      </form>

      {/* 👇 LISTE DES POSTS */}
      {loading ? (
        <div className="text-center text-gray-400 animate-pulse mt-10">Chargement du mur...</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = post.post_likes.some((like: any) => like.profile_id === currentUser?.id);
            const dateStr = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

            return (
              <div key={post.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white flex-shrink-0">
                    {post.profiles.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : post.profiles.first_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{post.profiles.first_name} {post.profiles.last_name}</h3>
                    <p className="text-[10px] text-gray-400">{dateStr}</p>
                  </div>
                </div>

                <p className="text-gray-200 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="w-full rounded-2xl mb-3 object-cover max-h-80" />
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => toggleLike(post.id, isLiked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                      isLiked ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                    {post.post_likes.length > 0 && post.post_likes.length}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}