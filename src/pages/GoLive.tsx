import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Users, Settings, X, Maximize } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DeepARFilter from '../components/DeepARFilter';
import LiveChat from '../components/LiveChat';

export default function GoLive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentEffect, setCurrentEffect] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const checkPermissions = useCallback(async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_creator, is_premium').eq('id', user.id).single();
      if (data) {
          setIsCreator(data.is_creator);
          setIsPremium(data.is_premium);
          
          // Free users cannot live stream at all
          if (!data.is_creator && !data.is_premium) {
              alert("Live features are available for Creators or Premium users only.");
              navigate('/wallet'); // Redirect to upgrade page
          }
      }
      setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    checkPermissions();
  }, [user, checkPermissions]);

  const toggleStream = () => {
    setIsStreaming(!isStreaming);
    if (!isStreaming) {
        if (isCreator) {
             // In production: Connect to RTMP/WebRTC Server
             console.log("Connecting to ingest server...");
        } else if (isPremium) {
             console.log("Initializing P2P handshake...");
        }
    } else {
        // Stop logic
    }
  };

  const effects = [
    { name: 'Aviators', path: '/deepar-resources/effects/aviators' },
    { name: 'Dalmatian', path: '/deepar-resources/effects/dalmatian' },
    { name: 'Galaxy', path: '/deepar-resources/effects/galaxy_background' },
    { name: 'Koala', path: '/deepar-resources/effects/koala' },
    { name: 'Lion', path: '/deepar-resources/effects/lion' },
  ];

  return (
    <div className={`relative h-screen bg-black overflow-hidden flex ${isFullscreen ? '' : 'flex-col md:flex-row'}`}>
      {/* Main Content: Video + Controls */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview Layer */}
        <div className="flex-1 relative">
          <DeepARFilter apiKey={import.meta.env.VITE_DEEPAR_API_KEY} effects={effects} currentEffect={currentEffect} />

          {/* Overlay UI */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-white font-bold text-sm uppercase">{isStreaming ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isStreaming && (
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white text-sm">
                  <Users className="w-4 h-4" />
                  <span>0 Viewers</span>
                </div>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`bg-zinc-900 p-6 ${isFullscreen ? 'hidden' : ''}`}>
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => setMicOn(!micOn)}
              className={`p-4 rounded-full ${micOn ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
            >
              {micOn ? <Mic /> : <MicOff />}
            </button>

            <button 
              onClick={toggleStream}
              className={`px-8 py-4 rounded-full font-bold text-lg transition ${
                isStreaming 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isStreaming ? 'End Stream' : 'GO LIVE'}
            </button>

            <button 
              onClick={() => setCamOn(!camOn)}
              className={`p-4 rounded-full ${camOn ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
            >
              {camOn ? <Video /> : <VideoOff />}
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-4 rounded-full bg-zinc-800 text-white"
            >
              <Settings />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={`w-full md:w-96 h-full ${isFullscreen ? 'hidden' : ''}`}>
        {user && <LiveChat streamId={user.id} />}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Stream Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-zinc-400">Filters</h3>
              <div className="flex flex-wrap gap-2">
                {effects.map((effect, index) => (
                  <button 
                    key={effect.name}
                    onClick={() => setCurrentEffect(index)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      currentEffect === index 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}>
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
