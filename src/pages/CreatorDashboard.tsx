import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, TrendingUp, Video, Lock, MessageCircle, Heart, Settings, Activity, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isTip?: boolean;
  amount?: number;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [tokenGoal, setTokenGoal] = useState(1000);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [revenue, setRevenue] = useState(0);
  const [totalSubscribers, setTotalSubscribers] = useState(0);

  // Settings State
  const [streamTitle, setStreamTitle] = useState("Just chilling! ☕️");
  const [goalTitle, setGoalTitle] = useState("Oil Change");
  const [goalAmount, setGoalAmount] = useState(1000);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchRealtimeStats();
    setLoading(false);
  }, [user]);

  const fetchRealtimeStats = async () => {
      if (!user) return;
      // 1. Get Revenue (Sum of 'earning' transactions)
      const { data: earnings } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'earning');
      
      const totalRevenue = earnings?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
      setRevenue(totalRevenue);

      // 2. Get Subscribers Count
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);
      
      setTotalSubscribers(count || 0);

      // 3. Update Token Goal Progress (Simulated logic for now, usually linked to specific campaign)
      // For now, we'll just say currentTokens is a fraction of revenue for the goal demo
      // In a real app, you'd have a separate 'campaign_contributions' table
      setCurrentTokens(Math.floor(totalRevenue * 10)); // 1 USD = 10 Tokens (Example)
  };

  const toggleLive = async () => {
      if (!isLive) {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              if (videoRef.current) videoRef.current.srcObject = stream;
              setIsLive(true);
              // Wait for real viewers
              setViewers(0); 
          } catch (e) {
              alert("Camera access required to go live.");
          }
      } else {
          if (videoRef.current?.srcObject) {
              const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
              tracks.forEach(t => t.stop());
          }
          setIsLive(false);
          setViewers(0);
      }
  };

  const saveSettings = () => {
      setTokenGoal(goalAmount);
      // Here you would save to DB
      setShowSettings(false);
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading studio...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-black text-white overflow-hidden relative">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4">
                  <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-bold text-white">Stream Settings</h2>
                      <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold">Stream Title</label>
                      <input 
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold">Goal Title</label>
                      <input 
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold">Goal Amount (Tokens)</label>
                      <input 
                        type="number"
                        value={goalAmount}
                        onChange={(e) => setGoalAmount(Number(e.target.value))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                      />
                  </div>

                  <Button onClick={saveSettings} className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                      Save Changes
                  </Button>
              </div>
          </div>
      )}

      {/* LEFT: Sidebar / Quick Actions */}
      <div className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-4">
          <div className="mb-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Creator Studio</h1>
              <p className="text-xs text-zinc-500">Control Panel</p>
          </div>

          <div className="space-y-2">
              <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-400 uppercase font-bold">Session Earnings</p>
                  <p className="text-2xl font-bold text-green-400">${revenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-400 uppercase font-bold">Total Subscribers</p>
                  <p className="text-2xl font-bold text-white">{totalSubscribers}</p>
              </div>
          </div>

          <div className="flex-1"></div>

          <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowSettings(true)}
              >
                  <Settings className="mr-2 h-4 w-4" /> Stream Settings
              </Button>
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Private Requests (2)</Button>
              <Link to="/wallet">
                  <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white"><DollarSign className="mr-2 h-4 w-4" /> Payouts</Button>
              </Link>
          </div>
      </div>

      {/* CENTER: Live Monitor */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
          {/* Top Bar */}
          <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur">
              <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLive ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                      <span className="text-xs font-bold">{isLive ? 'ON AIR' : 'OFFLINE'}</span>
                  </div>
                  {isLive && (
                      <div className="flex items-center gap-2 text-zinc-300 text-sm">
                          <Users className="h-4 w-4" /> {viewers}
                          <Activity className="h-4 w-4 ml-2" /> Excellent
                      </div>
                  )}
              </div>
              
              <Button 
                onClick={toggleLive}
                className={isLive ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
              >
                  {isLive ? 'End Stream' : 'Start Streaming'}
              </Button>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-center">
                          <Video className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                          <p className="text-zinc-500">Camera is offline</p>
                      </div>
                  </div>
              )}
              
              {/* Goal Overlay */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur rounded-lg p-3 w-64 border border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-purple-400">Next Goal: {goalTitle}</span>
                      <span>{currentTokens} / {tokenGoal}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${Math.min((currentTokens / tokenGoal) * 100, 100)}%` }}
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* RIGHT: Chat & Alerts */}
      <div className="w-full md:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-3 border-b border-zinc-800 font-bold text-sm text-zinc-400 uppercase tracking-wider">
              Live Chat
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                  <div className="text-center text-zinc-600 mt-10">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Chat is quiet. Start streaming to engage!</p>
                  </div>
              ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`text-sm ${msg.isTip ? 'bg-yellow-500/10 border border-yellow-500/20 p-2 rounded' : ''}`}>
                        <span className={`font-bold mr-2 ${msg.isTip ? 'text-yellow-500' : 'text-purple-400'}`}>
                            {msg.sender}:
                        </span>
                        <span className="text-zinc-300">{msg.text}</span>
                    </div>
                  ))
              )}
          </div>

          <div className="p-3 border-t border-zinc-800">
              <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Send announcement..."
                  />
                  <Button size="sm" variant="ghost"><MessageCircle className="h-4 w-4" /></Button>
              </div>
          </div>
      </div>
    </div>
  );
}
