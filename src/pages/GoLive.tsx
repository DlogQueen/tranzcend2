import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';
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
    <div className="relative h-screen bg-black overflow-hidden flex">
      {/* Main Content: Video + Controls */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview Layer */}
        <div className="flex-1 relative">
          <DeepARFilter apiKey="dea1c815326088852a20b0341935dfe50f157413cb64a28498357683c8514a6e0593741d1323330c" effects={effects} currentEffect={currentEffect} />

          {/* Overlay UI */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-white font-bold text-sm uppercase">{isStreaming ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            
            {isStreaming && (
              <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white text-sm">
                <Users className="w-4 h-4" />
                <span>0 Viewers</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="absolute bottom-32 left-0 right-0 flex justify-center p-4">
          <div className="flex space-x-2 bg-black/30 backdrop-blur-md p-2 rounded-full">
            {effects.map((effect, index) => (
              <button 
                key={effect.name}
                onClick={() => setCurrentEffect(index)}
                className={`w-12 h-12 rounded-full text-xs font-medium transition-all ${currentEffect === index ? 'bg-primary text-white scale-110' : 'bg-zinc-700/50 text-zinc-300'}`}>
                {effect.name.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 p-6">
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
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-96 h-full">
        {user && <LiveChat streamId={user.id} />}
      </div>
    </div>
  );
}
