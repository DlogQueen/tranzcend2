import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function CreatorRequests() {
  const [requests, setRequests] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('creator_request_pending', true);

    if (error) {
      console.error('Error fetching creator requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRequest = async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_creator: approve,
        creator_request_pending: false 
      })
      .eq('id', userId);

    if (!error) {
      fetchRequests(); // Refresh the list
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Creator Requests</h1>
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">No pending creator requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center">
              <Link to={`/profile/${request.id}`} className="flex items-center gap-4 mb-4 md:mb-0">
                <img src={request.avatar_url || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h2 className="font-semibold text-white text-lg">{request.username}</h2>
                  <p className="text-sm text-zinc-400">@{request.username?.toLowerCase()}</p>
                </div>
              </Link>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => handleRequest(request.id, false)}><X className="h-4 w-4 mr-2" /> Deny</Button>
                <Button onClick={() => handleRequest(request.id, true)}><Check className="h-4 w-4 mr-2" /> Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
