import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../types';
import { Loader2, Send } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface LiveChatProps {
  streamId: string;
}

export default function LiveChat({ streamId }: LiveChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*, profile:profiles(username, avatar_url)')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true });

    setMessages(data as any[] || []);
    setLoading(false);
  }, [streamId]);

  const subscribeToMessages = useCallback(() => {
    const channel = supabase.channel(`live_chat:${streamId}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `stream_id=eq.${streamId}` }, async (payload) => {
        const { data: profileData } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single();
        const newMessage = { ...payload.new, profile: profileData };
        setMessages((prev) => [...prev, newMessage as any]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [streamId, fetchMessages, subscribeToMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('live_chat_messages').insert([
      {
        user_id: user.id,
        stream_id: streamId,
        content: newMessage,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-full flex-col bg-black/50 backdrop-blur-md border-l border-white/10">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <img src={(msg as any).profile?.avatar_url || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm font-bold text-white">{(msg as any).profile?.username || 'User'}</p>
              <p className="text-sm text-zinc-300">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {profile && (
        <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Say something..."
              className="flex-1 bg-zinc-800/50 border-zinc-700 text-white"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
