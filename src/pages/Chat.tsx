import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Message, Profile } from '../types';
import { Loader2, Send, ArrowLeft, Image, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
        supabase.from('profiles').select('is_creator, is_admin').eq('id', user.id).single()
        .then(({ data }) => {
             setIsCreator(!!data?.is_creator);
             setIsAdmin(!!data?.is_admin);
        });
    }
  }, [user]);

  useEffect(() => {
    if (id && user) {
      fetchUser();
      fetchMessages();
      checkSubscription();
      subscribeToMessages();
    }
  }, [id, user]);

  const checkSubscription = async () => {
      // Check if current user subscribes to the other user (who is a creator)
      // Or if current user has a 'Premium All Access' (Not implemented yet, but placeholders here)
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user!.id)
        .eq('creator_id', id)
        .single();
      
      if (data) setIsSubscribed(true);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchUser = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setOtherUser(data);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user!.id})`)
      .order('created_at', { ascending: true });

    setMessages(data as Message[] || []);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        if (
          (newMessage.sender_id === user!.id && newMessage.receiver_id === id) ||
          (newMessage.sender_id === id && newMessage.receiver_id === user!.id)
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: id,
        content: newMessage,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user || !id) return;

      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `chat/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('media') 
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

          const { error } = await supabase.from('messages').insert([
              {
                  sender_id: user.id,
                  receiver_id: id,
                  content: 'Sent a photo',
                  media_url: publicUrl,
              }
          ]);

          if (error) throw error;
      } catch (error) {
          console.error('Error sending photo:', error);
          alert('Failed to send photo');
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-800 bg-surface p-4">
        <Link to="/messages" className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        {otherUser && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-700">
                {otherUser.avatar_url && <img src={otherUser.avatar_url} alt={otherUser.username} className="h-full w-full object-cover" />}
            </div>
            <h2 className="font-bold text-white">{otherUser.username}</h2>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {msg.media_url && (
                    <img src={msg.media_url} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.media_url, '_blank')} />
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-zinc-800 bg-surface p-4">
        {/* Media Attachments (Only for Creators, Subscribers, or Admins) */}
        {(!isCreator && !isSubscribed && !isAdmin) && (
            <div className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> 
                <span>Subscribe to send photos</span>
            </div>
        )}

        <div className="flex gap-2">
          {/* Photo Button */}
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*"
             onChange={handleFileUpload}
          />
          <button 
             type="button"
             disabled={!isCreator && !isSubscribed && !isAdmin}
             onClick={() => fileInputRef.current?.click()}
             className={`p-2 rounded-lg transition ${
                 isCreator || isSubscribed || isAdmin
                 ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                 : 'text-zinc-700 cursor-not-allowed'
             }`}
          >
              <Image className="w-6 h-6" />
          </button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
