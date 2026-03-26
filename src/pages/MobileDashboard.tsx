import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Users, DollarSign, MessageCircle, Bell, Video, VideoOff, Activity, TrendingUp, Heart, Gift } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_username: string;
  content: string;
  is_tip: boolean;
  amount?: number;
  created_at: string;
}

interface StreamStats {
  viewers: number;
  revenue: number;
  tips: number;
  isLive: boolean;
}

export default function MobileDashboard() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<StreamStats>({
    viewers: 0,
    revenue: 0,
    tips: 0,
    isLive: false
  });
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'stats' | 'requests'>('chat');

  const fetchStats = useCallback(async () => {
    if (!user) return;

    // Check if stream is live
    const { data: streamData } = await supabase
      .from('live_streams')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'live')
      .single();

    // Get session earnings
    const { data: earnings } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'earning')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const sessionRevenue = earnings?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    setStats({
      viewers: streamData?.viewer_count || 0,
      revenue: sessionRevenue,
      tips: earnings?.length || 0,
      isLive: !!streamData
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    // Subscribe to live chat
    const channel = supabase
      .channel('mobile-live-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `creator_id=eq.${user.id}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages(prev => [...prev, newMsg]);
          
          // Show notification for tips
          if (newMsg.is_tip && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  const sendAnnouncement = async () => {
    if (!newMessage.trim() || !user) return;

    await supabase.from('live_chat_messages').insert({
      creator_id: user.id,
      sender_username: 'Creator',
      content: newMessage,
      is_announcement: true
    });

    setNewMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-background text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Mobile Dashboard</h1>
            <p className="text-xs text-zinc-400">Control your stream on the go</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stats.isLive ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
            <div className={`w-2 h-2 rounded-full ${stats.isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
            <span className="text-xs font-bold">{stats.isLive ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-zinc-400">Viewers</span>
            </div>
            <p className="text-2xl font-bold">{stats.viewers}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-zinc-400">Earned</span>
            </div>
            <p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-zinc-400">Tips</span>
            </div>
            <p className="text-2xl font-bold">{stats.tips}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-500'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stats' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-500'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Stats
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'requests' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-500'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Requests
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center text-zinc-600 mt-10">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-zinc-700 mt-1">Chat will appear here when viewers message</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${
                      msg.is_tip 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                        : 'bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`font-bold text-sm ${msg.is_tip ? 'text-yellow-400' : 'text-purple-400'}`}>
                        {msg.sender_username}
                      </span>
                      {msg.is_tip && msg.amount && (
                        <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          ${msg.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 text-sm">{msg.content}</p>
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Send Announcement */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAnnouncement()}
                  placeholder="Send announcement to chat..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
                />
                <Button onClick={sendAnnouncement} className="bg-purple-600 hover:bg-purple-700">
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-900/50 to-teal-900/50 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold">Session Performance</h3>
                  <p className="text-xs text-zinc-400">Last 24 hours</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Peak Viewers</p>
                  <p className="text-2xl font-bold">{stats.viewers}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">${stats.revenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Tips Received</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.tips}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Avg. Tip</p>
                  <p className="text-2xl font-bold">
                    ${stats.tips > 0 ? (stats.revenue / stats.tips).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                Engagement
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Messages</span>
                  <span className="font-bold">{chatMessages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Active Viewers</span>
                  <span className="font-bold">{stats.viewers}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-4">
            <div className="text-center text-zinc-600 mt-10">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pending requests</p>
              <p className="text-xs text-zinc-700 mt-1">Private show requests will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Stream Status Indicator */}
      {!stats.isLive && (
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500">
            <VideoOff className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Stream Offline</p>
              <p className="text-xs">Start streaming from your computer to use this dashboard</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
