import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import {
  Users, DollarSign, Settings, Video, X, MessageCircle,
  Activity, Mic, MicOff, VideoOff, Disc, ArrowLeftFromLine,
  Sparkles, Camera, Smartphone, Shield, Target, ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isTip?: boolean;
  amount?: number;
}

type SettingsTab = 'stream' | 'camera' | 'filters' | 'privacy';

const EFFECTS = [
  { name: 'None', path: '', emoji: '🚫' },
  { name: 'Beauty', path: '/deepar-resources/effects/background_blur.deepar', emoji: '✨' },
  { name: 'Blur BG', path: '/deepar-resources/effects/background_blur.deepar', emoji: '🌫️' },
  { name: 'Replace BG', path: '/deepar-resources/effects/background_replacement.deepar', emoji: '🖼️' },
  { name: 'Aviators', path: '/deepar-resources/effects/aviators', emoji: '🕶️' },
  { name: 'Galaxy', path: '/deepar-resources/effects/galaxy_background', emoji: '🌌' },
  { name: 'Koala', path: '/deepar-resources/effects/koala', emoji: '🐨' },
  { name: 'Lion', path: '/deepar-resources/effects/lion', emoji: '🦁' },
];

// Teal/seafoam input style
const inputCls = "w-full bg-zinc-900 border border-teal-500/40 rounded-lg p-3 text-white placeholder-zinc-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 outline-none transition-colors";
const labelCls = "text-xs text-teal-400 uppercase font-bold tracking-wider mb-1 block";

export default function Studio() {
  const { user: currentUser } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [isStreamStarting, setIsStreamStarting] = useState(false);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('stream');
  const [revenue, setRevenue] = useState(0);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [privateRequests, setPrivateRequests] = useState(0);
  const [viewers] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  // Stream settings
  const [streamTitle, setStreamTitle] = useState('Just chilling! ☕️');
  const [goalTitle, setGoalTitle] = useState('Monthly Goal');
  const [goalAmount, setGoalAmount] = useState(1000);

  // Camera settings
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraSource, setCameraSource] = useState<'webcam' | 'phone'>('webcam');
  const [currentEffect, setCurrentEffect] = useState(0);

  // Privacy settings
  const [blurBackground, setBlurBackground] = useState(false);
  const [hideLocation, setHideLocation] = useState(true);
  const [allowScreenshots, setAllowScreenshots] = useState(false);

  const fetchRealtimeStats = useCallback(async () => {
    if (!currentUser) return;
    const { data: earnings } = await supabase.from('transactions').select('amount').eq('user_id', currentUser.id).eq('type', 'earning');
    const total = earnings?.reduce((s, t) => s + t.amount, 0) || 0;
    setRevenue(total);
    setCurrentTokens(total);
    const { count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', currentUser.id);
    setTotalSubscribers(count || 0);
    const { count: pr } = await supabase.from('private_requests').select('*', { count: 'exact', head: true }).eq('creator_id', currentUser.id).eq('status', 'pending');
    setPrivateRequests(pr || 0);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchRealtimeStats();
    const channel = supabase.channel('live-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages' }, (payload) => {
        const m = payload.new;
        if (m.creator_id === currentUser.id) {
          setChatMessages(prev => [...prev, { id: m.id, sender: m.sender_username, text: m.content, isTip: m.is_tip, amount: m.amount }]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, fetchRealtimeStats]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const iframe = document.getElementById('camera-iframe') as HTMLIFrameElement | null;
      if (!iframe?.contentWindow || e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'camera-ready') { setIsLive(true); setIsStreamStarting(false); }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const toggleLive = () => {
    if (isLive) setIsLive(false);
    else setIsStreamStarting(true);
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim() || !currentUser) return;
    await supabase.from('live_chat_messages').insert({ creator_id: currentUser.id, sender_username: 'Creator', content: announcement, is_announcement: true });
    setAnnouncement('');
  };

  const settingsTabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'stream', label: 'Stream', icon: Activity },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'filters', label: 'Filters', icon: Sparkles },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-black text-white overflow-hidden relative">

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">Studio Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {settingsTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                      settingsTab === tab.id ? 'text-teal-400 border-b-2 border-teal-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

              {/* STREAM TAB */}
              {settingsTab === 'stream' && (
                <>
                  <div>
                    <label className={labelCls}>Stream Title</label>
                    <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)} className={inputCls} placeholder="What are you doing today?" />
                  </div>
                  <div>
                    <label className={labelCls}>Goal Title</label>
                    <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className={inputCls} placeholder="e.g. New outfit goal" />
                  </div>
                  <div>
                    <label className={labelCls}>Goal Amount (Tokens)</label>
                    <input type="number" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} className={inputCls} />
                  </div>
                </>
              )}

              {/* CAMERA TAB */}
              {settingsTab === 'camera' && (
                <>
                  <div>
                    <label className={labelCls}>Camera Source</label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => setCameraSource('webcam')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          cameraSource === 'webcam' ? 'border-teal-400 bg-teal-400/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <Video className="w-6 h-6" />
                        <span className="text-sm font-medium">Webcam</span>
                        <span className="text-xs text-zinc-400">Computer camera</span>
                      </button>
                      <button
                        onClick={() => setCameraSource('phone')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          cameraSource === 'phone' ? 'border-teal-400 bg-teal-400/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <Smartphone className="w-6 h-6" />
                        <span className="text-sm font-medium">Phone</span>
                        <span className="text-xs text-zinc-400">Use as webcam</span>
                      </button>
                    </div>
                    {cameraSource === 'phone' && (
                      <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs text-teal-300">
                        Open <strong>/mobile-dashboard</strong> on your phone to use it as a live chat controller while streaming from your computer.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* FILTERS TAB */}
              {settingsTab === 'filters' && (
                <>
                  <label className={labelCls}>AR Filters & Effects</label>
                  <div className="grid grid-cols-4 gap-2">
                    {EFFECTS.map((effect, i) => (
                      <button
                        key={effect.name}
                        onClick={() => { setCurrentEffect(i); }}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          currentEffect === i ? 'border-teal-400 bg-teal-400/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-2xl">{effect.emoji}</span>
                        <span className="text-xs text-zinc-300 text-center leading-tight">{effect.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Beauty filter smooths skin. Blur/Replace BG hides your location for privacy.</p>
                </>
              )}

              {/* PRIVACY TAB */}
              {settingsTab === 'privacy' && (
                <>
                  {[
                    { key: 'blurBackground', label: 'Blur Background', desc: 'Hide your location and surroundings', value: blurBackground, set: setBlurBackground },
                    { key: 'hideLocation', label: 'Hide Location', desc: 'Don\'t show your city/region to viewers', value: hideLocation, set: setHideLocation },
                    { key: 'allowScreenshots', label: 'Allow Screenshots', desc: 'Let viewers screenshot your stream', value: allowScreenshots, set: setAllowScreenshots },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                      <div>
                        <p className="font-medium text-white text-sm">{s.label}</p>
                        <p className="text-xs text-zinc-400">{s.desc}</p>
                      </div>
                      <button
                        onClick={() => s.set(!s.value)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${s.value ? 'bg-teal-500' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${s.value ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-5 border-t border-zinc-800">
              <Button onClick={() => setShowSettings(false)} className="w-full bg-teal-600 hover:bg-teal-700">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-60 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-3">
        <div className="mb-2">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Creator Studio</h1>
          <p className="text-xs text-zinc-500">Control Panel</p>
        </div>

        <div className="p-3 bg-zinc-800 rounded-lg border border-teal-500/20">
          <p className="text-xs text-teal-400 uppercase font-bold">Session Earnings</p>
          <p className="text-2xl font-bold text-green-400">${revenue.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-400 uppercase font-bold">Subscribers</p>
          <p className="text-2xl font-bold text-white">{totalSubscribers}</p>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => { setShowSettings(true); setSettingsTab('stream'); }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-teal-400" /> Stream Settings</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
        <button
          onClick={() => { setShowSettings(true); setSettingsTab('camera'); }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <span className="flex items-center gap-2"><Camera className="w-4 h-4 text-teal-400" /> Camera Source</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
        <button
          onClick={() => { setShowSettings(true); setSettingsTab('filters'); }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-teal-400" /> AR Filters</span>
          <span className="text-xs text-teal-400">{EFFECTS[currentEffect].emoji} {EFFECTS[currentEffect].name}</span>
        </button>
        <button
          onClick={() => { setShowSettings(true); setSettingsTab('privacy'); }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-teal-400" /> Privacy</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
        <button
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Private Requests</span>
          {privateRequests > 0 && <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">{privateRequests}</span>}
        </button>
        <Link to="/wallet">
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors">
            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" /> Payouts</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        </Link>

        <div className="pt-3 border-t border-zinc-800">
          <Link to={`/profile/${currentUser?.id}`}>
            <Button variant="outline" className="w-full justify-start text-sm">
              <ArrowLeftFromLine className="mr-2 h-4 w-4" /> Exit Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* CENTER: Video */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {/* Top Bar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
              {isLive ? 'ON AIR' : 'OFFLINE'}
            </div>
            {isLive && (
              <div className="flex items-center gap-3 text-zinc-400 text-xs font-mono">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> LIVE</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {viewers}</span>
                {isRecording && <span className="flex items-center gap-1 text-red-400 animate-pulse"><Disc className="w-3 h-3" /> REC</span>}
              </div>
            )}
          </div>
          <Button
            onClick={toggleLive}
            disabled={isStreamStarting}
            className={isLive ? 'bg-zinc-700 hover:bg-zinc-600 text-sm' : 'bg-purple-600 hover:bg-purple-700 text-sm'}
          >
            {isLive ? 'End Stream' : isStreamStarting ? 'Starting...' : 'Go Live'}
          </Button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {(isLive || isStreamStarting) && !isCameraOff ? (
            <iframe
              id="camera-iframe"
              src="/live-camera"
              className="w-full h-full border-0"
              allow="camera; microphone"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <VideoOff className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-sm">{isCameraOff ? 'Camera is off' : 'Click Go Live to start'}</p>
            </div>
          )}

          {/* Goal Overlay */}
          {isLive && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur rounded-lg p-3 w-56 border border-white/10">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-teal-400 flex items-center gap-1"><Target className="w-3 h-3" /> {goalTitle}</span>
                <span className="text-zinc-300">{currentTokens}/{goalAmount}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min((currentTokens / goalAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-3 px-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`h-10 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${isRecording ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            <Disc className="w-4 h-4" />
            {isRecording ? 'Stop REC' : 'Record'}
          </button>
          <button
            onClick={() => { setShowSettings(true); setSettingsTab('filters'); }}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Filters"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowSettings(true); setSettingsTab('stream'); }}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div className="w-full md:w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Chat</span>
          {isLive && <span className="text-xs text-teal-400">{viewers} watching</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.length === 0 ? (
            <div className="text-center text-zinc-600 mt-10">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Chat will appear here</p>
            </div>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} className={`text-sm rounded-lg px-3 py-2 ${msg.isTip ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-zinc-800'}`}>
                <span className={`font-bold mr-1 ${msg.isTip ? 'text-yellow-400' : 'text-teal-400'}`}>{msg.sender}:</span>
                <span className="text-zinc-300">{msg.text}</span>
                {msg.isTip && msg.amount && <span className="ml-2 text-yellow-400 text-xs font-bold">+${msg.amount}</span>}
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendAnnouncement()}
              placeholder="Announce to chat..."
              className="flex-1 bg-zinc-800 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-teal-400 outline-none"
            />
            <button onClick={sendAnnouncement} className="p-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
              <MessageCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
