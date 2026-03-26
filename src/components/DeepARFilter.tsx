import { useRef, useEffect, useState, useCallback } from 'react';
import * as deepar from 'deepar';
import { Sparkles } from 'lucide-react';

interface Effect {
  name: string;
  path: string;
  emoji: string;
}

interface DeepARFilterProps {
  apiKey: string;
  effects: Effect[];
  currentEffect: number;
  onReady?: (mediaStream: MediaStream) => void;
  onError?: (message: string) => void;
}

const DeepARFilter: React.FC<DeepARFilterProps> = ({
  apiKey, effects, currentEffect, onReady, onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deepARRef = useRef<deepar.DeepAR | null>(null);
  const initializedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const initialize = useCallback(async () => {
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Set canvas dimensions explicitly as per DeepAR docs
    canvasRef.current.width = 1280;
    canvasRef.current.height = 720;

    try {
      const deepAR = await deepar.initialize({
        licenseKey: apiKey,
        canvas: canvasRef.current,
        rootPath: '/deepar-resources',
        additionalOptions: {
          cameraConfig: { facingMode: 'user' },
          hint: ['faceInit', 'segmentationInit'],
        }
      });

      deepARRef.current = deepAR;

      await deepAR.startCamera({
        mirror: true,
        mediaStreamConstraints: {
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        }
      });

      // Load initial effect
      if (effects[currentEffect]?.path) {
        await deepAR.switchEffect(effects[currentEffect].path);
      }

      // Get canvas as MediaStream for streaming - key DeepAR feature
      const mediaStream = canvasRef.current.captureStream(30); // 30fps

      setReady(true);
      onReady?.(mediaStream);

    } catch (err) {
      initializedRef.current = false;
      let msg = 'Could not start camera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow access and refresh.';
        else if (err.name === 'NotFoundError') msg = 'No camera found.';
        else if (err.message?.includes('license')) msg = 'DeepAR license error. Check your API key.';
      }
      setError(msg);
      onError?.(msg);
    }
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initialize();
    return () => {
      deepARRef.current?.shutdown();
      deepARRef.current = null;
      initializedRef.current = false;
    };
  }, [initialize]);

  // Switch effect
  useEffect(() => {
    if (!deepARRef.current || !ready) return;
    const effect = effects[currentEffect];
    if (effect?.path) deepARRef.current.switchEffect(effect.path);
    else deepARRef.current.clearEffect();
  }, [currentEffect, effects, ready]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {!ready && !error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', gap: 12, zIndex: 10
        }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #14b8a6',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ fontSize: 13, color: '#6b7280' }}>Starting camera...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease'
        }}
      />

      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)', color: '#fff', padding: 24, textAlign: 'center', gap: 12
        }}>
          <Sparkles size={32} color="#f87171" />
          <p style={{ fontSize: 15, color: '#f87171', fontWeight: 'bold' }}>Camera Error</p>
          <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 280 }}>{error}</p>
          <button
            onClick={() => { setError(null); initializedRef.current = false; initialize(); }}
            style={{
              marginTop: 8, padding: '10px 24px', background: '#14b8a6',
              color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default DeepARFilter;
