import { useEffect, useRef, useState, useCallback } from 'react';
import DeepARFilter from '../components/DeepARFilter';
import { Sparkles, EyeOff, Brush, X } from 'lucide-react';

// Privacy-focused effects using your existing DeepAR resources
const effects = [
  { name: 'None', path: '', emoji: '🚫', category: 'none' },
  { name: 'Beauty', path: '/deepar-resources/effects/background_blur.deepar', emoji: '✨', category: 'beauty' },
  { name: 'Blur BG', path: '/deepar-resources/effects/background_blur.deepar', emoji: '🌫️', category: 'privacy' },
  { name: 'Replace BG', path: '/deepar-resources/effects/background_replacement.deepar', emoji: '🖼️', category: 'privacy' },
  { name: 'Aviators', path: '/deepar-resources/effects/aviators', emoji: '🕶️', category: 'fun' },
  { name: 'Galaxy', path: '/deepar-resources/effects/galaxy_background', emoji: '🌌', category: 'fun' },
  { name: 'Koala', path: '/deepar-resources/effects/koala', emoji: '🐨', category: 'fun' },
  { name: 'Lion', path: '/deepar-resources/effects/lion', emoji: '🦁', category: 'fun' },
];

interface BlurZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function LiveCamera() {
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [currentEffect, setCurrentEffect] = useState(0);
  const [showEffects, setShowEffects] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [blurZones, setBlurZones] = useState<BlurZone[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentDraw, setCurrentDraw] = useState<BlurZone | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleReady = useCallback(() => {
    window.parent.postMessage({ type: 'camera-ready' }, '*');
  }, []);

  const handleDeepARError = useCallback(() => {
    setUseFallback(true);
  }, []);

  useEffect(() => {
    if (!useFallback || !videoRef.current) return;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        handleReady();
      } catch {
        setFallbackError('Camera access denied. Please allow camera and refresh.');
      }
    };

    start();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [useFallback, handleReady]);

  // Draw blur zone handlers
  const getRelativePos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const onDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode) return;
    const pos = getRelativePos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setCurrentDraw({ id: Date.now().toString(), x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawMode) return;
    const pos = getRelativePos(e);
    setCurrentDraw({
      id: Date.now().toString(),
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y)
    });
  };

  const onDrawEnd = () => {
    if (!isDrawing || !currentDraw) return;
    if (currentDraw.w > 2 && currentDraw.h > 2) {
      setBlurZones(prev => [...prev, { ...currentDraw, id: Date.now().toString() }]);
    }
    setIsDrawing(false);
    setCurrentDraw(null);
  };

  const filteredEffects = activeCategory === 'all'
    ? effects
    : effects.filter(e => e.category === activeCategory || e.category === 'none');

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>

      {/* Camera Feed */}
      {useFallback ? (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <DeepARFilter
          apiKey={import.meta.env.VITE_DEEPAR_API_KEY}
          effects={effects}
          currentEffect={currentEffect}
          onReady={handleReady}
          onError={handleDeepARError}
        />
      )}

      {/* Blur Zones Overlay */}
      <div
        ref={overlayRef}
        onMouseDown={onDrawStart}
        onMouseMove={onDrawMove}
        onMouseUp={onDrawEnd}
        onTouchStart={onDrawStart}
        onTouchMove={onDrawMove}
        onTouchEnd={onDrawEnd}
        style={{
          position: 'absolute', inset: 0,
          cursor: drawMode ? 'crosshair' : 'default'
        }}
      >
        {/* Existing blur zones */}
        {blurZones.map(zone => (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: `${zone.x}%`, top: `${zone.y}%`,
              width: `${zone.w}%`, height: `${zone.h}%`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'rgba(0,0,0,0.1)',
              border: '1px dashed rgba(255,255,255,0.3)',
              borderRadius: 4
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBlurZones(prev => prev.filter(z => z.id !== zone.id));
              }}
              style={{
                position: 'absolute', top: -10, right: -10,
                width: 20, height: 20, borderRadius: '50%',
                background: '#ef4444', border: 'none',
                color: '#fff', cursor: 'pointer', fontSize: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Currently drawing zone */}
        {currentDraw && (
          <div style={{
            position: 'absolute',
            left: `${currentDraw.x}%`, top: `${currentDraw.y}%`,
            width: `${currentDraw.w}%`, height: `${currentDraw.h}%`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2px dashed #a78bfa',
            borderRadius: 4
          }} />
        )}
      </div>

      {/* Error */}
      {fallbackError && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          color: '#fff', background: 'rgba(0,0,0,0.7)',
          padding: '8px 12px', borderRadius: 8, fontSize: 13
        }}>
          {fallbackError}
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 24,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        width: '90%', maxWidth: 500
      }}>

        {/* Effects Panel */}
        {showEffects && (
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16, padding: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            width: '100%'
          }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['all', 'privacy', 'beauty', 'fun'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 11,
                    fontWeight: 'bold', textTransform: 'capitalize',
                    background: activeCategory === cat ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    color: '#fff', border: 'none', cursor: 'pointer'
                  }}
                >
                  {cat === 'privacy' ? '🔒 Privacy' : cat === 'beauty' ? '✨ Beauty' : cat === 'fun' ? '🎭 Fun' : '⭐ All'}
                </button>
              ))}
            </div>

            {/* Effect buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {filteredEffects.map((effect, i) => {
                const realIndex = effects.indexOf(effect);
                return (
                  <button
                    key={effect.name}
                    onClick={() => setCurrentEffect(realIndex)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4,
                      padding: '8px 12px', borderRadius: 12,
                      background: currentEffect === realIndex ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                      color: '#fff', border: currentEffect === realIndex ? '2px solid #a78bfa' : '2px solid transparent',
                      cursor: 'pointer', minWidth: 60, fontSize: 20
                    }}
                  >
                    <span>{effect.emoji}</span>
                    <span style={{ fontSize: 10 }}>{effect.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Draw mode instructions */}
        {drawMode && (
          <div style={{
            background: 'rgba(124,58,237,0.8)', borderRadius: 8,
            padding: '6px 14px', color: '#fff', fontSize: 12, textAlign: 'center'
          }}>
            Draw a box over any area to blur it (tattoos, identifying marks, etc.)
          </div>
        )}

        {/* Bottom toolbar */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          padding: '10px 16px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Filters toggle */}
          <button
            onClick={() => setShowEffects(p => !p)}
            style={{
              background: showEffects ? '#7c3aed' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 999,
              padding: '8px 14px', color: '#fff',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, fontSize: 13
            }}
          >
            <Sparkles size={14} /> Filters
          </button>

          {/* Blur zone draw tool */}
          <button
            onClick={() => setDrawMode(p => !p)}
            title="Draw blur zones to hide tattoos or identifying marks"
            style={{
              background: drawMode ? '#7c3aed' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 999,
              padding: '8px 14px', color: '#fff',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, fontSize: 13
            }}
          >
            <Brush size={14} /> Hide Area
          </button>

          {/* Clear all blur zones */}
          {blurZones.length > 0 && (
            <button
              onClick={() => setBlurZones([])}
              style={{
                background: 'rgba(239,68,68,0.3)',
                border: 'none', borderRadius: 999,
                padding: '8px 14px', color: '#f87171',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6, fontSize: 13
              }}
            >
              <EyeOff size={14} /> Clear ({blurZones.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
