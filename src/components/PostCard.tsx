import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Post, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  creator?: Profile; // Optional if we fetch it inside, but better passed down
}

export default function PostCard({ post, creator: initialCreator }: PostCardProps) {
  const { user } = useAuth();
  const [creator, setCreator] = useState<Profile | null>(initialCreator || null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!initialCreator && post.user_id) {
      fetchCreator();
    }
    checkUnlockStatus();
  }, [post.user_id]);

  const fetchCreator = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id).single();
    if (data) setCreator(data);
  };

  const checkUnlockStatus = async () => {
    if (!user) return;
    if (post.user_id === user.id) {
      setIsUnlocked(true);
      return;
    }
    if (!post.is_locked) {
      setIsUnlocked(true);
      return;
    }

    // Check if unlocked in DB
    const { data } = await supabase
      .from('unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .single();
    
    if (data) setIsUnlocked(true);
  };

  const handleUnlock = async () => {
    if (!creator) return;
    if (confirm(`Unlock this post for $${creator.subscription_price}?`)) {
      const { error } = await supabase.from('unlocks').insert({
        user_id: user!.id,
        post_id: post.id
      });
      if (!error) setIsUnlocked(true);
    }
  };

  if (!creator) return <div className="animate-pulse h-96 bg-zinc-900 rounded-xl mb-4"></div>;

  const isLockedView = post.is_locked && !isUnlocked;
  
  const isVideo = post.media_url.match(/\.(mp4|webm|mov|ogg)$/i);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Link to={`/profile/${creator.id}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
            {creator.avatar_url && <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />}
          </div>
        </Link>
        <div>
          <Link to={`/profile/${creator.id}`} className="font-semibold text-white hover:underline">
            {creator.username}
          </Link>
          <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Image / Video */}
      <div className="relative aspect-square bg-black">
        {isLockedView ? (
          <div className="relative w-full h-full cursor-pointer" onClick={handleUnlock}>
            {isVideo ? (
                 <video src={post.media_url} className="w-full h-full object-cover blur-2xl brightness-50" />
            ) : (
                 <img src={post.media_url} className="w-full h-full object-cover blur-2xl brightness-50" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-white text-lg">Unlock Post</p>
              <p className="text-zinc-300 text-sm">Pay ${creator.subscription_price} to view</p>
            </div>
          </div>
        ) : (
          isVideo ? (
              <video src={post.media_url} controls className="w-full h-full object-cover" />
          ) : (
              <img src={post.media_url} className="w-full h-full object-cover" />
          )
        )}
      </div>

      {/* Footer */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsLiked(!isLiked)} className="text-white hover:text-red-500 transition">
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button className="text-white hover:text-purple-400 transition">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="text-white hover:text-teal-400 transition ml-auto">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        
        {post.caption && (
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white mr-2">{creator.username}</span>
            {post.caption}
          </p>
        )}
      </div>
    </div>
  );
}
