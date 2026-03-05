import React, { useEffect, useRef, useState } from 'react';
import DeepARFilter from '../components/DeepARFilter';

const LiveCamera = () => {
  const [useFallbackCamera, setUseFallbackCamera] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
          apiKey="9b0493f3a383b6e0b99204d0691be3a030d6d8faa0e90928442a243493a0a16c0a3a43109da538aa"
          onReady={handleCameraReady}
          onError={handleDeepARError}
        />
      )}
    </div>
  );
};

export default LiveCamera;
