import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader2, User, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Friend {
  friend_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  last_seen: string | null;
}

export default function Messages() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_friends_list');
      
      if (error) throw error;
      setFriends(data || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <Link to="/friend-requests">
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Requests
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {friends.length === 0 ? (
          <div className="text-center text-zinc-500 py-10">
            <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No friends yet</p>
            <p className="text-sm mt-2">Add friends to start messaging</p>
            <Link to="/discover">
              <Button className="mt-4" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Find Friends
              </Button>
            </Link>
          </div>
        ) : (
          friends.map((friend) => (
            <Link
              key={friend.friend_id}
              to={`/messages/${friend.friend_id}`}
              className="flex items-center gap-4 rounded-xl bg-surface p-4 transition-colors hover:bg-zinc-800"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-700">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <User className="h-6 w-6" />
                  </div>
                )}
                {friend.last_seen && new Date(friend.last_seen) > new Date(Date.now() - 5 * 60 * 1000) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white truncate">{friend.username}</h3>
                  {friend.is_verified && (
                    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm text-zinc-400 truncate">{friend.bio || 'Tap to chat'}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
