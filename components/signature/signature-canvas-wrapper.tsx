'use client';

import React, { forwardRef, useImperativeHandle, useRef, ComponentProps } from 'react';
import SignatureCanvas from 'react-signature-canvas';

type SignatureCanvasProps = ComponentProps<typeof SignatureCanvas>;

interface SignatureCanvasWrapperProps extends Omit<SignatureCanvasProps, 'ref'> {}

export interface SignatureCanvasRef {
  isEmpty: () => boolean;
  clear: () => void;
  toDataURL: (type?: string, quality?: any) => string;
  getCanvas: () => HTMLCanvasElement;
}

const SignatureCanvasWrapper = forwardRef<SignatureCanvasRef, SignatureCanvasWrapperProps>(
  (props, ref) => {
    const canvasRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      isEmpty: () => canvasRef.current?.isEmpty() ?? true,
      clear: () => canvasRef.current?.clear(),
      toDataURL: (type?: string, quality?: any) => canvasRef.current?.toDataURL(type, quality) ?? '',
      getCanvas: () => canvasRef.current?.getCanvas() as HTMLCanvasElement,
    }));

    return <SignatureCanvas ref={canvasRef} {...props} />;
  }
);

SignatureCanvasWrapper.displayName = 'SignatureCanvasWrapper';

export default SignatureCanvasWrapper;
