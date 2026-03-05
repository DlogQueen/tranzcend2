
import React, { useRef, useEffect, useState } from 'react';
import * as deepar from 'deepar';

interface DeepARFilterProps {
  apiKey: string;
  onReady?: () => void;
  onError?: (message: string) => void;
}

const DeepARFilter: React.FC<DeepARFilterProps> = ({ apiKey, onReady, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
    const deepARRef = useRef<deepar.DeepAR | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {
        return;
        }

        let deepAR: deepar.DeepAR | null = null;

        const initialize = async () => {
        try {
            deepAR = await deepar.initialize({
            licenseKey: apiKey,
            canvas: canvasRef.current!,
            rootPath: '/deepar-resources',
            additionalOptions: {
                cameraConfig: {
                    facingMode: 'user',
                    cameraPermissionAsked: () => {
                        console.log('Camera permission asked');
                    },
                    cameraPermissionGranted: () => {
                        console.log('Camera permission granted');
                    }
                },
                hint: ['faceInit', 'segmentationInit']
            }
            });
            console.log('DeepARFilter: Initialized DeepAR with canvas dimensions:', canvasRef.current?.width, canvasRef.current?.height);

            deepARRef.current = deepAR;

            let onReadyCalled = false;
            
            // Start camera after initialization
            await deepAR.startCamera({
                mirror: true,
                mediaStreamConstraints: {
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: false
                },
                cameraPermissionGranted: () => {
                    console.log('DeepARFilter: Camera permission granted');
                    if (onReady && !onReadyCalled) {
                        onReady();
                        onReadyCalled = true;
                    }
                }
            });

            console.log('DeepARFilter: Camera started successfully');

        } catch (err) {
            console.error('Failed to initialize DeepAR:', err);
            let message = 'An unknown error occurred while initializing the camera.';
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    message = 'Camera permission denied. Please allow camera access and refresh.';
                } else if (err.name === 'NotFoundError') {
                    message = 'No camera found. Please connect a camera and refresh.';
                } else {
                    message = 'Could not start the camera. Please check browser permissions.';
                }
            }
            setError(message);
            onError?.(message);
        }
        };

        initialize();

        return () => {
            if (deepAR) {
                deepAR.shutdown();
                deepARRef.current = null;
            }
        };
    }, [apiKey, onReady, onError]);


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          display: 'block'
        }} 
      />
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default DeepARFilter;
