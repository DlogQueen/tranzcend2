import React, { useRef, useState, useEffect } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Settings, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function GoLive() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [user]);

  useEffect(() => {
    if (!loading && (isCreator || isPremium)) {
        startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [loading, isCreator, isPremium]);

  const checkPermissions = async () => {
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
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

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

  return (
    <div className="relative h-[calc(100vh-80px)] bg-black overflow-hidden flex flex-col">
      {/* Video Preview Layer */}
      <div className="flex-1 relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${!camOn && 'hidden'}`} 
        />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <Camera className="w-16 h-16 text-zinc-600" />
          </div>
        )}

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

      {/* Controls */}
      <div className="bg-zinc-900 p-6 pb-24">
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
  );
}
