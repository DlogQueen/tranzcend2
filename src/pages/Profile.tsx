import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post } from '../types';
import { Button } from '../components/ui/Button';
import { Loader2, Lock, Settings, MessageCircle, Video, Camera, MoreHorizontal, Rss, Twitter, Instagram, Linkedin, MapPin, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserPosts } from '../hooks/useUserPosts';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

type UnlockRow = { post_id: string };

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { profile, loading: profileLoading, error: profileError } = useUserProfile(id);
  const { posts, loading: postsLoading, error: postsError } = useUserPosts(id);

  const [activeTab, setActiveTab] = useState<'public' | 'exclusive'>('public');
  const [unlockedPosts, setUnlockedPosts] = useState<Set<string>>(new Set());
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'pending_them' | 'pending_me' | 'none'>('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const isOwnProfile = currentUser?.id === id;

  const loading = profileLoading || postsLoading;

  const fetchSubscriberCount = useCallback(async () => {
    if (!id) return;
    const { count } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', id);
    setSubscriberCount(count || 0);
  }, [id]);

  const fetchUnlocks = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('unlocks')
      .select('post_id')
      .eq('user_id', currentUser.id);

    if (data) {
      const unlockRows = data as UnlockRow[];
      setUnlockedPosts(new Set(unlockRows.map((u) => u.post_id)));
    }
  }, [currentUser]);

  const checkFriendshipStatus = useCallback(async () => {
    if (!currentUser || !id || currentUser.id === id) return;

    // Check if blocked
    const { data: blockData } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', currentUser.id)
      .eq('blocked_id', id)
      .single();

    if (blockData) {
      setIsBlocked(true);
      return;
    }

    // Check for an existing friendship
    const { data: friendship } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id_1.eq.${Math.min(currentUser.id, id)},user_id_2.eq.${Math.max(currentUser.id, id)})`)
      .single();

    if (friendship) {
      setFriendshipStatus('friends');
      return;
    }

    // Check for a pending friend request
    const { data: request } = await supabase
      .from('friend_requests')
      .select('requester_id')
      .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${currentUser.id})`)
      .eq('status', 'pending')
      .single();

    if (request) {
      if (request.requester_id === currentUser.id) {
        setFriendshipStatus('pending_them');
      } else {
        setFriendshipStatus('pending_me');
      }
    } else {
      setFriendshipStatus('none');
    }
  }, [currentUser, id]);

  useEffect(() => {
    if (id) {
      fetchSubscriberCount();
      if (currentUser) {
        fetchUnlocks();
        checkFriendshipStatus();
      }
    }
  }, [id, currentUser, fetchSubscriberCount, fetchUnlocks, checkFriendshipStatus]);

  const handleBlock = async () => {
    if (!currentUser || !id) return;
    
    if (isBlocked) {
      // Unblock
      if (!confirm(`Unblock ${profile?.username}?`)) return;
      
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', id);

      if (!error) {
        setIsBlocked(false);
        alert('User unblocked');
      }
    } else {
      // Block
      if (!confirm(`Are you sure you want to block ${profile?.username}? You won't see them on the grid or feed anymore.`)) return;

      const { error } = await supabase.from('blocks').insert({
        blocker_id: currentUser.id,
        blocked_id: id,
      });

      if (!error) {
        setIsBlocked(true);
        alert('User blocked');
      }
    }
  };

  const handleReport = async () => {
    if (!currentUser || !id) return;
    const reason = prompt("Please provide a reason for reporting this user:");
    if (!reason) return;

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      reported_id: id,
      reason: reason,
    });

    if (!error) {
      alert('User reported. Thank you for your feedback.');
      setShowMenu(false);
    } else {
      alert('Failed to report user. Please try again later.');
    }
  };

  const handleFriendRequest = async () => {
    if (!currentUser || !id) return;

    if (friendshipStatus === 'none') {
      const { error } = await supabase.from('friend_requests').insert({ requester_id: currentUser.id, receiver_id: id });
      if (!error) {
        setFriendshipStatus('pending_them');
      }
    }
    // Other statuses can be handled here (e.g., accepting a request)
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

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);

  const filteredPosts = regularPosts.filter((post) =>
    activeTab === 'public' ? !post.is_locked : post.is_locked
  );

  const handleSubscribe = async () => {
    if (!currentUser || !id) return;

    // Insert subscription
    const { error } = await supabase.from('subscriptions').insert({
      subscriber_id: currentUser.id,
      creator_id: id
    });

    if (!error) {
      // Try to grant early fan premium
      const { data } = await supabase.rpc('grant_early_fan_premium', { p_creator_id: id });
      if (data?.success) {
        alert(`Subscribed! 🎉 ${data.message}`);
      } else {
        alert('Subscribed!');
      }
      fetchSubscriberCount();
    }
  };

  const renderFriendButton = () => {
    switch (friendshipStatus) {
      case 'friends':
        return <Button variant="secondary">Friends</Button>;
      case 'pending_them':
        return <Button variant="secondary" disabled>Request Sent</Button>;
      case 'pending_me':
        return <Button onClick={handleFriendRequest}>Accept Request</Button>;
      default:
        return <Button onClick={handleFriendRequest}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
    }
  };

  return (
    <div className="pb-20">
      {/* --- HEADER --- */}
      <div className="relative h-48 w-full">
        {profile.banner_url ? (
          <img src={profile.banner_url} className="h-full w-full object-cover" alt="Profile banner" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-purple-900 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* --- PROFILE INFO --- */}
      <div className="p-4">
        {/* Avatar & Actions */}
        <div className="relative -mt-24 flex items-end justify-between">
          <div className="relative group rounded-full bg-background p-1.5">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
              alt="Avatar"
              className="h-32 w-32 rounded-full border-4 border-background object-cover md:h-40 md:w-40"
            />
            {isOwnProfile && (
              <Link
                to="/profile/edit"
                className="absolute inset-1.5 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <Camera className="h-8 w-8 text-white" />
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Link to="/profile/edit">
                  <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" /> Edit Profile</Button>
                </Link>
                {profile.is_verified && (
                  <Link to="/studio">
                    <Button variant="primary" size="sm" className="animate-pulse border-none bg-red-600 text-white hover:bg-red-700">
                      <Video className="mr-2 h-4 w-4" /> GO LIVE
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                {renderFriendButton()}
                <Button onClick={handleSubscribe} variant="secondary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-none">
                  Subscribe
                </Button>
                <Link to={`/messages/${profile.id}`}>
                  <Button variant="secondary" size="sm"><MessageCircle className="mr-2 h-4 w-4" /> Message</Button>
                </Link>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowMenu(!showMenu)}>
                      <MoreHorizontal className="h-5 w-5" />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                      <button onClick={handleBlock} className={`block w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 ${isBlocked ? 'text-green-400' : 'text-red-400'}`}>
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </button>
                      <button onClick={handleReport} className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700">Report User</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name, Bio, Stats */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
            {profile.is_verified && <VerifiedBadge />}
          </div>
          <p className="text-sm text-zinc-400">@{profile.username?.toLowerCase().replace(/\s/g, '')}</p>

          {profile.bio && <p className="mt-3 max-w-prose whitespace-pre-wrap text-zinc-300">{profile.bio}</p>}

          {/* Social & Location Links */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
            {profile.location_name && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{profile.location_name}</span>
              </div>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                <Rss className="h-4 w-4" />
                <span>{profile.website.replace(/^(https?:\/\/)?(www.)?/, '')}</span>
              </a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <p><strong className="font-medium text-white">{posts.length}</strong> <span className="text-zinc-400">Posts</span></p>
            <p><strong className="font-medium text-white">{subscriberCount}</strong> <span className="text-zinc-400">Subscribers</span></p>
            {/* <p><strong className="font-medium text-white">123</strong> <span className="text-zinc-400">Following</span></p> */}
          </div>
        </div>
      </div>

      {/* --- PINNED POSTS --- */}
      {pinnedPosts.length > 0 && (
        <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Pinned Posts</h2>
            <div className="grid grid-cols-3 gap-1">
                {pinnedPosts.map(post => (
                    <Link to={`/post/${post.id}`} key={post.id} className="relative aspect-square cursor-pointer overflow-hidden bg-zinc-900 rounded-md">
                        <img src={post.media_url} alt={post.caption || 'Pinned Post'} className="h-full w-full object-cover" />
                    </Link>
                ))}
            </div>
        </div>
      )}

      {/* --- TABS & FEED --- */}
      <div className="sticky top-0 z-10 flex border-y border-zinc-800 bg-background/95 backdrop-blur">
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'public' ? 'border-b-2 border-primary text-primary' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Public
        </button>
        <button
          onClick={() => setActiveTab('exclusive')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'exclusive' ? 'border-b-2 border-primary text-primary' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Exclusive <Lock className="ml-1 inline h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0.5">
        {filteredPosts.map((post) => {
          const isLocked = post.is_locked && !isOwnProfile && !unlockedPosts.has(post.id);
          const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(post.media_url);

          return (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className="relative aspect-square cursor-pointer overflow-hidden bg-zinc-900"
            >
              {isLocked ? (
                <div className="relative h-full w-full">
                  {isVideo ? (
                    <video src={post.media_url} className="h-full w-full object-cover brightness-50 blur-xl" />
                  ) : (
                    <img src={post.media_url} className="h-full w-full object-cover brightness-50 blur-xl" alt="Locked post preview" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ) : isVideo ? (
                <video src={post.media_url} className="h-full w-full object-cover" />
              ) : (
                <img src={post.media_url} alt={post.caption || 'Post'} className="h-full w-full object-cover" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
