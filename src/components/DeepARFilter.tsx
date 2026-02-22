
import React, { useRef, useEffect, useState } from 'react';
import * as deepar from 'deepar';

interface DeepARFilterProps {
  apiKey: string;
  onReady?: () => void;
}

const DeepARFilter: React.FC<DeepARFilterProps> = ({ apiKey, onReady, isBeautyEnabled }) => {
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
                    resolution: 'hd'
                }
            }
            });

            deepARRef.current = deepAR;

            let onReadyCalled = false;
            deepAR.callbacks.onInitialize = () => {
                deepAR.startVideo();
            };

            deepAR.callbacks.onCameraOpen = () => {
                if (onReady && !onReadyCalled) {
                    onReady();
                    onReadyCalled = true;
                }
            };

            deepAR.callbacks.onError = (error) => {
            console.error('DeepAR Error:', error);
            setError('An error occurred with the camera. Please refresh and try again.');
            };

        } catch (err) {
            console.error('Failed to initialize DeepAR:', err);
            setError('Could not start the camera. Please check browser permissions.');
        }
        };

        initialize();

        return () => {
            deepAR?.shutdown();
            deepARRef.current = null;
        };
    }, [apiKey, onReady]);


  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
};

export default DeepARFilter;
