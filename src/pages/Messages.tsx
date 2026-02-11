import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { Loader2, User } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // In a real app, we'd have a 'conversations' table.
      // Here we'll fetch unique sender_ids and receiver_ids from messages involving the current user.
      // This is not performant for large datasets but works for MVP.
      
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('receiver_id')
        .eq('sender_id', user!.id)
        .order('created_at', { ascending: false });

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user!.id)
        .order('created_at', { ascending: false });

      const contactIds = new Set<string>();
      sentMessages?.forEach(m => contactIds.add(m.receiver_id));
      receivedMessages?.forEach(m => contactIds.add(m.sender_id));

      if (contactIds.size === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(contactIds));

      setConversations(profiles as Profile[] || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold text-white">Messages</h1>

      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center text-zinc-500">
            <p>No messages yet.</p>
            <p className="text-sm">Start a chat from a profile!</p>
          </div>
        ) : (
          conversations.map((profile) => (
            <Link
              key={profile.id}
              to={`/messages/${profile.id}`}
              className="flex items-center gap-4 rounded-xl bg-surface p-4 transition-colors hover:bg-zinc-800"
            >
              <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-700">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{profile.username}</h3>
                <p className="text-sm text-zinc-400">Tap to chat</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
