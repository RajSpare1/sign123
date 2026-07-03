'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Pen, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSessionByCode, submitSignature, updateSessionStatus } from '@/lib/supabase';
import SignatureCanvasWrapper, { SignatureCanvasRef } from '@/components/signature/signature-canvas-wrapper';

type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'not-found';

export default function MobileSignPage() {
  const params = useParams();
  const sessionCode = params?.code as string;
  const sigCanvasRef = useRef<SignatureCanvasRef>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [penColor, setPenColor] = useState('#000000');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionCode) {
        setStatus('error');
        setErrorMessage('Invalid session code');
        return;
      }

      const session = await getSessionByCode(sessionCode);
      if (!session) {
        setStatus('not-found');
        return;
      }

      if (session.status === 'completed') {
        setStatus('error');
        setErrorMessage('This session has already been completed');
        return;
      }

      // Mark as connected
      await updateSessionStatus(sessionCode, 'connected');
      setStatus('ready');
    };

    validateSession();
  }, [sessionCode]);

  const clearSignature = useCallback(() => {
    sigCanvasRef.current?.clear();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;

    setStatus('submitting');
    const signatureData = sigCanvasRef.current.toDataURL('image/png');

    await submitSignature(sessionCode, signatureData);
    setStatus('success');
  }, [sessionCode]);

  const COLORS = [
    { value: '#000000', label: 'Black' },
    { value: '#0047AB', label: 'Blue' },
    { value: '#C41E3A', label: 'Red' },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The signing session you&apos;re looking for doesn&apos;t exist or has expired.
          </p>
          <p className="text-sm text-muted-foreground">
            Please scan the QR code again from the desktop application.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Signature Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Your signature has been sent to the desktop application. You can close this window now.
          </p>
          <p className="text-sm text-muted-foreground">
            Return to your computer to continue.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Sign Document</h1>
            <p className="text-sm text-muted-foreground">Session: {sessionCode}</p>
          </div>
          <Pen className="w-6 h-6 text-primary" />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <p className="text-sm text-muted-foreground text-center">
              Sign with your finger or stylus below
            </p>
          </div>

          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPenColor(color.value)}
                    className={`w-8 h-8 rounded-full transition-all border-2 ${
                      penColor === color.value
                        ? 'border-primary ring-2 ring-primary/20 scale-110'
                        : 'border-transparent'
                    } ${color.value === '#000000' ? 'bg-black' : color.value === '#0047AB' ? 'bg-blue-600' : 'bg-red-600'}`}
                    aria-label={color.label}
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-xl overflow-hidden bg-slate-50">
              <SignatureCanvasWrapper
                ref={sigCanvasRef}
                penColor={penColor}
                minWidth={2}
                maxWidth={5}
                canvasProps={{
                  width: 400,
                  height: 300,
                  className: 'w-full touch-none',
                  style: { width: '100%', height: '300px' },
                }}
                backgroundColor="transparent"
              />
            </div>
          </div>

          <div className="p-4 border-t bg-slate-50">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Pen className="w-5 h-5 mr-2" />
                  Submit Signature
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By submitting, you agree that this signature will be embedded into your document.
          </p>
        </div>
      </main>
    </div>
  );
}
