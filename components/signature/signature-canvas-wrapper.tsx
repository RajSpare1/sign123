'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureCanvasWrapperProps {
  penColor?: string;
  minWidth?: number;
  maxWidth?: number;
  backgroundColor?: string;
}

export interface SignatureCanvasRef {
  isEmpty: () => boolean;
  clear: () => void;
  toDataURL: (type?: string, quality?: any) => string;
  getCanvas: () => HTMLCanvasElement;
}

const SignatureCanvasWrapper = forwardRef<SignatureCanvasRef, SignatureCanvasWrapperProps>(
  ({ penColor = 'black', minWidth = 2, maxWidth = 4, backgroundColor = 'transparent' }, ref) => {
    const canvasRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 500, height: 200 });

    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: rect.width,
            height: Math.max(200, rect.height),
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Clear signature when reset is called
    useEffect(() => {
      if (canvasRef.current) {
        canvasRef.current.clear();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      isEmpty: () => canvasRef.current?.isEmpty() ?? true,
      clear: () => canvasRef.current?.clear(),
      toDataURL: (type?: string, quality?: any) => canvasRef.current?.toDataURL(type, quality) ?? '',
      getCanvas: () => canvasRef.current?.getCanvas() as HTMLCanvasElement,
    }));

    // Use a fixed pixel ratio for better accuracy
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    return (
      <div
        ref={containerRef}
        className="w-full h-[200px] cursor-crosshair"
        style={{ touchAction: 'none' }}
      >
        <SignatureCanvas
          ref={canvasRef}
          penColor={penColor}
          minWidth={minWidth}
          maxWidth={maxWidth}
          backgroundColor={backgroundColor}
          canvasProps={{
            width: dimensions.width * pixelRatio,
            height: dimensions.height * pixelRatio,
            className: 'signature-canvas',
            style: {
              width: '100%',
              height: '100%',
              border: '1px solid transparent',
            },
          }}
          dotSize={4}
        />
        <style jsx global>{`
          .signature-canvas {
            touch-action: none;
          }
        `}</style>
      </div>
    );
  }
);

SignatureCanvasWrapper.displayName = 'SignatureCanvasWrapper';

export default SignatureCanvasWrapper;
