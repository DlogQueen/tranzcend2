import React, { useState } from 'react';
import DeepARFilter from '../components/DeepARFilter';

const LiveCamera = () => {
  const [searchParams] = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  const handleCameraReady = () => {
    setIsReady(true);
    // Notify the parent window (the dashboard) that the camera is live
    window.parent.postMessage({ type: 'camera-ready' }, '*');
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'black' }}>
      <DeepARFilter
        apiKey="9b0493f3a383b6e0b99204d0691be3a030d6d8faa0e90928442a243493a0a16c0a3a43109da538aa"
        onReady={handleCameraReady}
      />
    </div>
  );
};

export default LiveCamera;
