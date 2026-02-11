import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType, Post } from '../types';
import { Button } from '../components/ui/Button';
import { Loader2, Lock, Settings, MessageCircle, DollarSign, Unlock, Video, ShieldCheck, UserMinus, Ban, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'exclusive'>('public');
  const [unlockedPosts, setUnlockedPosts] = useState<Set<string>>(new Set());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();

  const [subscriberCount, setSubscriberCount] = useState(0);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (id) {
        fetchProfile(id);
        fetchSubscriberCount();
        if (currentUser) {
            fetchUnlocks();
            checkSubscription();
        }
    }
  }, [id, currentUser]);

  const fetchSubscriberCount = async () => {
      const { count } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', id);
      setSubscriberCount(count || 0);
  };

  const checkSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', currentUser!.id)
        .eq('creator_id', id)
        .single();
      setIsSubscribed(!!data);
  };

  const handleSubscribe = async () => {
      if (!profile) return;
      
      if (isSubscribed) {
          // Unsubscribe
          await supabase.from('subscriptions').delete().eq('subscriber_id', currentUser!.id).eq('creator_id', id);
          setIsSubscribed(false);
          setSubscriberCount(prev => prev - 1);
      } else {
          // Subscribe logic (Always Paid for Creators)
          if (profile.subscription_price > 0) {
              const confirmed = confirm(`Subscribe for $${profile.subscription_price}/mo?`);
              if (!confirmed) return;
              // In real app: process payment
          }

          await supabase.from('subscriptions').insert({ subscriber_id: currentUser!.id, creator_id: id });
          setIsSubscribed(true);
          setSubscriberCount(prev => prev + 1);
      }
  };

  const handleBlock = async () => {
      if (!confirm(`Are you sure you want to block ${profile?.username}? You won't see them on the grid or feed anymore.`)) return;
      
      const { error } = await supabase.from('blocks').insert({
          blocker_id: currentUser!.id,
          blocked_id: id
      });

      if (!error) {
          alert('User blocked');
          navigate('/discover');
      }
  };

  const fetchUnlocks = async () => {
      const { data } = await supabase.from('unlocks').select('post_id').eq('user_id', currentUser!.id);
      if (data) {
          setUnlockedPosts(new Set(data.map(u => u.post_id)));
      }
  };

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData as Post[]);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (postId: string) => {
      if (!confirm(`Unlock this post for $${profile?.subscription_price}?`)) return;
      
      // Mock payment + unlock
      const { error } = await supabase.from('unlocks').insert({
          user_id: currentUser!.id,
          post_id: postId
      });
      
      if (!error) {
          setUnlockedPosts(prev => new Set(prev).add(postId));
      }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-center">User not found</div>;
  }

  const filteredPosts = posts.filter(post => 
    activeTab === 'public' ? !post.is_locked : post.is_locked
  );

  return (
    <div className="pb-20">
      {/* Header / Hero */}
      <div className="relative">
        <div className="h-48 w-full bg-zinc-800">
           {profile.banner_url ? (
             <img src={profile.banner_url} className="h-full w-full object-cover" />
           ) : (
             <div className="h-full w-full bg-gradient-to-r from-purple-900 to-zinc-900" />
           )}
        </div>
        
        <div className="px-4 pb-4">
           <div className="relative -mt-20 mb-4 flex justify-between items-end">
             <div className="rounded-full p-1 bg-background relative group">
               <img 
                  src={profile.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"} 
                  alt="Avatar" 
                  className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-background"
               />
               {isOwnProfile && (
                   <Link to="/profile/edit" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                       <Camera className="text-white h-8 w-8" />
                   </Link>
               )}
             </div>
             
             {isOwnProfile ? (
                 <div className="flex gap-2 mb-2">
                    <Link to="/profile/edit">
                        <Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>
                    </Link>
                    {!profile.is_verified && (
                        <Link to="/verification">
                             <Button variant="secondary" size="sm" className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border-purple-500/50">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Verify
                             </Button>
                        </Link>
                    )}
                    {profile.is_verified && (
                        <Link to="/go-live">
                             <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700 text-white border-none animate-pulse">
                                <Video className="mr-2 h-4 w-4" /> GO LIVE
                             </Button>
                        </Link>
                    )}
                 </div>
            ) : (
                <div className="flex gap-2 mb-2">
                    <Link to={`/messages/${profile.id}`}>
                        <Button variant="secondary" size="sm"><MessageCircle className="mr-2 h-4 w-4" /> Chat</Button>
                    </Link>
                    
                    {profile.is_creator && (
                        <>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleSubscribe}
                                className={isSubscribed ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gradient-to-r from-purple-600 to-teal-600"}
                            >
                                {isSubscribed ? <UserMinus className="mr-2 h-4 w-4" /> : <DollarSign className="mr-2 h-4 w-4" />}
                                {isSubscribed 
                                    ? 'Unsubscribe' 
                                    : `Subscribe $${profile.subscription_price}`
                                }
                            </Button>
                            
                            {/* Always show Tip button */}
                            <Button variant="secondary" size="sm">
                                <DollarSign className="mr-2 h-4 w-4" /> Tip
                            </Button>
                        </>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleBlock} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <Ban className="h-4 w-4" />
                    </Button>
                </div>
            )}
           </div>

           <div>
              <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                  {profile.is_verified && <VerifiedBadge className="bg-blue-500 text-white" />}
              </div>
              <p className="text-zinc-400 text-sm mt-1">@{profile.username?.toLowerCase().replace(/\s/g, '')}</p>
              
              {/* Tags Display */}
              {profile.tags && profile.tags.length > 0 && (
                 <div className="flex gap-2 mt-3 flex-wrap">
                    {profile.tags.map(tag => (
                       <span key={tag} className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                         {tag}
                       </span>
                    ))}
                 </div>
              )}

              {profile.bio && <p className="text-zinc-200 mt-3 whitespace-pre-wrap">{profile.bio}</p>}
              
              {(profile.website || profile.location_name) && (
                <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                  {profile.location_name && <span>📍 {profile.location_name}</span>}
                  {profile.website && <a href={profile.website} target="_blank" className="text-purple-400 hover:underline">🔗 {profile.website}</a>}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 flex border-b border-zinc-800 bg-background/95 backdrop-blur">
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'public' ? 'border-b-2 border-primary text-primary' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Public
        </button>
        <button
          onClick={() => setActiveTab('exclusive')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'exclusive' ? 'border-b-2 border-primary text-primary' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Exclusive <Lock className="inline h-3 w-3 ml-1" />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {filteredPosts.map((post) => {
          const isLocked = post.is_locked && !isOwnProfile && !unlockedPosts.has(post.id);
          const isVideo = post.media_url.match(/\.(mp4|webm|mov|ogg)$/i);
          
          return (
            <Link 
                to={`/post/${post.id}`}
                key={post.id} 
                className="relative aspect-square overflow-hidden bg-zinc-900 cursor-pointer"
            >
                {isLocked ? (
                <div className="relative h-full w-full">
                    {/* Blurry Background */}
                    {isVideo ? (
                        <video src={post.media_url} className="h-full w-full object-cover blur-xl brightness-50" />
                    ) : (
                        <img src={post.media_url} className="h-full w-full object-cover blur-xl brightness-50" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <p className="mt-2 text-xs font-bold text-white">Unlock ${profile.subscription_price}</p>
                    </div>
                </div>
                ) : (
                    isVideo ? (
                        <video src={post.media_url} className="h-full w-full object-cover" />
                    ) : (
                        <img
                            src={post.media_url}
                            alt={post.caption || "Post"}
                            className="h-full w-full object-cover"
                        />
                    )
                )}
            </Link>
        )})}
      </div>
      
      {filteredPosts.length === 0 && (
          <div className="py-20 text-center text-zinc-500">
              No {activeTab} content yet.
          </div>
      )}
    </div>
  );
}
