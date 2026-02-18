
import React, { useRef, useEffect, useState } from 'react';
import { loadJeelizScript } from '../lib/script-loader';

const BEAUTY_FRAGMENTSHADER = `
precision highp float;
varying vec2 vUV;
uniform sampler2D uun_source;
uniform vec2 uun_texelSize;

const float beautyAmount = 0.75;

void main() {
  vec4 color = texture2D(uun_source, vUV);
  vec2 blurCoordinates[8];
  blurCoordinates[0] = vUV + uun_texelSize * vec2(0.0, -2.0);
  blurCoordinates[1] = vUV + uun_texelSize * vec2(1.414, -1.414);
  blurCoordinates[2] = vUV + uun_texelSize * vec2(2.0, 0.0);
  blurCoordinates[3] = vUV + uun_texelSize * vec2(1.414, 1.414);
  blurCoordinates[4] = vUV + uun_texelSize * vec2(0.0, 2.0);
  blurCoordinates[5] = vUV + uun_texelSize * vec2(-1.414, 1.414);
  blurCoordinates[6] = vUV + uun_texelSize * vec2(-2.0, 0.0);
  blurCoordinates[7] = vUV + uun_texelSize * vec2(-1.414, -1.414);

  float centralLuminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float sum = 1.0;
  vec3 blurredColor = color.rgb;

  for (int i = 0; i < 8; i++) {
    vec4 sampleColor = texture2D(uun_source, blurCoordinates[i]);
    float sampleLuminance = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
    float luminanceDelta = abs(sampleLuminance - centralLuminance);
    float weight = 1.0 - smoothstep(0.03, 0.1, luminanceDelta);
    blurredColor += sampleColor.rgb * weight;
    sum += weight;
  }

  blurredColor /= sum;
  vec3 finalColor = mix(color.rgb, blurredColor, beautyAmount);
  finalColor = (finalColor - 0.5) * 1.05 + 0.5;
  vec3 satBoost = vec3(1.1, 1.1, 1.1);
  finalColor *= satBoost;

  gl_FragColor = vec4(finalColor, color.a);
}
`;

interface FaceFilterProps {
  onReady?: () => void;
  videoSettings: {
    width: number;
    height: number;
  };
  isBeautyEnabled: boolean;
}

const FaceFilter: React.FC<FaceFilterProps> = ({ onReady, videoSettings, isBeautyEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const postProcessingRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await loadJeelizScript();
      const JEELIZFACEFILTER = (window as any).JEELIZFACEFILTER;

      if (JEELIZFACEFILTER && canvasRef.current) {
        JEELIZFACEFILTER.init({
          canvas: canvasRef.current,
          NNCPath: '/',
          videoSettings,
          callbackReady: (errCode: any) => {
            if (errCode) {
              console.error('An error occurred with Jeeliz FaceFilter:', errCode);
              return;
            }
            console.log('Jeeliz FaceFilter is ready!');
            postProcessingRef.current = JEELIZFACEFILTER.create_postProcessing(BEAUTY_FRAGMENTSHADER, []);
            setIsInitialized(true);
            if (onReady) onReady();
          },
          callbackTrack: () => {},
        });
      }
    };

    initialize();

    return () => {
      const JEELIZFACEFILTER = (window as any).JEELIZFACEFILTER;
      if (JEELIZFACEFILTER) {
        JEELIZFACEFILTER.destroy();
      }
    };
  }, [onReady, videoSettings]);

  useEffect(() => {
    const JEELIZFACEFILTER = (window as any).JEELIZFACEFILTER;
    if (isInitialized && JEELIZFACEFILTER && postProcessingRef.current) {
        JEELIZFACEFILTER.toggle_postProcessingTrack(postProcessingRef.current, isBeautyEnabled);
    }
  }, [isBeautyEnabled, isInitialized]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
};

export default FaceFilter;
