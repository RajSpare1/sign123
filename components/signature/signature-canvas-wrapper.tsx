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
    const [width, setWidth] = useState(500);

    useEffect(() => {
      const update = () => {
        if (containerRef.current) {
          setWidth(Math.floor(containerRef.current.getBoundingClientRect().width));
        }
      };
      update();
      const observer = new ResizeObserver(update);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    useImperativeHandle(ref, () => ({
      isEmpty: () => canvasRef.current?.isEmpty() ?? true,
      clear: () => canvasRef.current?.clear(),
      toDataURL: (type?: string, quality?: any) => canvasRef.current?.toDataURL(type, quality) ?? '',
      getCanvas: () => canvasRef.current?.getCanvas() as HTMLCanvasElement,
    }));

    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 200, touchAction: 'none', cursor: 'crosshair' }}
      >
        <SignatureCanvas
          ref={canvasRef}
          penColor={penColor}
          minWidth={minWidth}
          maxWidth={maxWidth}
          backgroundColor={backgroundColor}
          canvasProps={{
            width,
            height: 200,
            style: { width: '100%', height: '100%', display: 'block' },
          }}
          dotSize={3}
          velocityFilterWeight={0.7}
        />
      </div>
    );
  }
);

SignatureCanvasWrapper.displayName = 'SignatureCanvasWrapper';

export default SignatureCanvasWrapper;
