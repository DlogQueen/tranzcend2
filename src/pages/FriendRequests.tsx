import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FriendRequest, Profile } from '../types';

interface FriendRequestWithProfile extends FriendRequest {
  profiles: Profile;
}

export default function FriendRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*, profiles:requester_id(*)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
    } else {
      setRequests(data as unknown as FriendRequestWithProfile[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRequest = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error && newStatus === 'accepted') {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('friends').insert({ user_id_1: request.requester_id, user_id_2: request.receiver_id });
      }
    }
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Friend Requests</h1>
      {requests.length === 0 ? (
        <p className="text-zinc-400">No new friend requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
              <Link to={`/profile/${request.profiles.id}`} className="flex items-center gap-3">
                <img src={request.profiles.avatar_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h2 className="font-semibold text-white">{request.profiles.username}</h2>
                  <p className="text-sm text-zinc-400">Wants to be your friend.</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleRequest(request.id, 'declined')}><X className="h-4 w-4" /></Button>
                <Button onClick={() => handleRequest(request.id, 'accepted')}><Check className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
