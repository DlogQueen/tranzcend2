import React, { useEffect, useRef, useState } from 'react';
import DeepARFilter from '../components/DeepARFilter';

const LiveCamera = () => {
  const [useFallbackCamera, setUseFallbackCamera] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentEffect, setCurrentEffect] = useState(0);

  const effects = [
    { name: 'None', path: '' },
    { name: 'Aviators', path: '/deepar-resources/effects/aviators' },
    { name: 'Dalmatian', path: '/deepar-resources/effects/dalmatian' },
    { name: 'Galaxy', path: '/deepar-resources/effects/galaxy_background' },
    { name: 'Koala', path: '/deepar-resources/effects/koala' },
    { name: 'Lion', path: '/deepar-resources/effects/lion' },
  ];

  const handleCameraReady = () => {
    console.log('LiveCamera: handleCameraReady called.');
    // Notify the parent window (the dashboard) that the camera is live
    window.parent.postMessage({ type: 'camera-ready' }, '*');
    console.log('LiveCamera: Sent camera-ready message to parent.');
  };

  const handleDeepARError = (message: string) => {
    console.warn('LiveCamera: DeepAR failed, falling back to native camera:', message);
    setUseFallbackCamera(true);
  };

  useEffect(() => {
    if (!useFallbackCamera || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const startFallbackCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        handleCameraReady();
      } catch (err) {
        console.error('LiveCamera fallback failed:', err);
        setFallbackError('Fallback camera failed. Please allow camera access and refresh.');
      }
    };

    startFallbackCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [useFallbackCamera]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'black' }}>
      {useFallbackCamera ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {fallbackError && (
            <div style={{ position: 'absolute', top: 12, left: 12, color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '8px 10px', borderRadius: 8 }}>
              {fallbackError}
            </div>
          )}
        </>
      ) : (
        <DeepARFilter
          apiKey={import.meta.env.VITE_DEEPAR_API_KEY}
          effects={effects}
          currentEffect={currentEffect}
          onReady={handleCameraReady}
          onError={handleDeepARError}
        />
      )}
    </div>
  );
};

export default LiveCamera;
