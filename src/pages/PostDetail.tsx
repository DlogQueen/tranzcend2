import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, Heart, MessageCircle, Lock, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPostData();
  }, [id]);

  const fetchPostData = async () => {
    setLoading(true);
    // 1. Fetch Post
    const { data: postData } = await supabase.from('posts').select('*').eq('id', id).single();
    if (postData) {
        setPost(postData);
        
        // 2. Fetch Creator
        const { data: creatorData } = await supabase.from('profiles').select('*').eq('id', postData.user_id).single();
        setCreator(creatorData);

        // 3. Check Subscription
        if (user && creatorData) {
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('subscriber_id', user.id)
                .eq('creator_id', creatorData.id)
                .single();
            setIsSubscribed(!!subData || user.id === creatorData.id);
        }

        // 4. Fetch Comments
        fetchComments();
    }
    setLoading(false);
  };

  const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      if (data) setComments(data as any);
  };

  const handlePostComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim() || !user || !post) return;

      const { error } = await supabase.from('comments').insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment
      });

      if (!error) {
          setNewComment('');
          fetchComments();
      }
  };

  const handleShare = async () => {
    if (!post || !creator) return;

    // Use Web Share API if available (Mobile Native Share)
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Check out ${creator.username} on Tranzcend X`,
                text: post.caption,
                url: window.location.href
            });
            // Unlock content logic could go here if we were strictly gating it
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback for Desktop: Copy Link
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard! Share it on Twitter to unlock.');
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading...</div>;
  if (!post || !creator) return <div className="p-10 text-center">Post not found</div>;

  return (
    <div className="flex min-h-screen flex-col bg-black pb-20">
      {/* Header */}
      <div className="absolute top-0 z-10 w-full bg-gradient-to-b from-black/80 to-transparent p-4">
        <button onClick={() => navigate(-1)} className="text-white hover:text-zinc-300">
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Image Container */}
      <div className="flex flex-1 items-center justify-center bg-black relative group">
          <img src={post.media_url} className="max-h-[80vh] w-full object-contain" />
          
          {/* Share Overlay (Viral Loop) */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button onClick={handleShare} className="bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg">
                  <Share2 className="w-4 h-4 mr-2" /> Share to Unlock
              </Button>
          </div>
      </div>

      {/* Info & Comments */}
      <div className="bg-zinc-900 p-4 rounded-t-2xl -mt-6 relative z-10 min-h-[30vh]">
          <div className="flex items-center gap-3 mb-4">
              <img src={creator.avatar_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full object-cover" />
              <div>
                  <h3 className="font-bold text-white">{creator.username}</h3>
                  <p className="text-xs text-zinc-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
          </div>
          
          <p className="text-zinc-200 mb-6">{post.caption}</p>

          {/* Comments Section */}
          <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Comments ({comments.length})
              </h4>
              
              <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                  {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                          <img src={comment.profiles?.avatar_url || "https://via.placeholder.com/30"} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                              <p className="text-sm font-semibold text-white">{comment.profiles?.username}</p>
                              <p className="text-sm text-zinc-300">{comment.content}</p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Comment Input (Gated) */}
              {isSubscribed ? (
                  <form onSubmit={handlePostComment} className="flex gap-2">
                      <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-white outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <Button type="submit" size="icon" disabled={!newComment.trim()}>
                          <Send className="w-4 h-4" />
                      </Button>
                  </form>
              ) : (
                  <div className="bg-zinc-800/50 p-3 rounded-xl text-center">
                      <p className="text-zinc-400 text-sm flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" /> Only subscribers can comment
                      </p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="text-purple-400"
                        onClick={() => navigate(`/profile/${creator.id}`)}
                      >
                          Subscribe for ${creator.subscription_price}
                      </Button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
