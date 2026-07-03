'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Pen, Type, Upload, Smartphone, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createSession, generateSessionCode, subscribeToSession } from '@/lib/supabase';
import SignatureCanvasWrapper, { SignatureCanvasRef } from './signature-canvas-wrapper';

type SignatureMode = 'draw' | 'type' | 'upload' | 'mobile';
type SignatureColor = '#000000' | '#0047AB' | '#C41E3A';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSignatureReady: (signatureData: string) => void;
}

const SIGNATURE_COLORS = [
  { value: '#000000', label: 'Black', color: 'bg-black' },
  { value: '#0047AB', label: 'Blue', color: 'bg-blue-600' },
  { value: '#C41E3A', label: 'Red', color: 'bg-red-600' },
];

const FONT_STYLES = [
  { font: "'Caveat', cursive", weight: 500, name: 'Caveat' },
  { font: "'Pacifico', cursive", weight: 400, name: 'Pacifico' },
  { font: "'Dancing Script', cursive", weight: 600, name: 'Dancing Script' },
  { font: "'Great Vibes', cursive", weight: 400, name: 'Great Vibes' },
];

export default function SignatureModal({ open, onClose, onSignatureReady }: SignatureModalProps) {
  const sigCanvasRef = useRef<SignatureCanvasRef>(null);
  const [activeTab, setActiveTab] = useState<SignatureMode>('draw');
  const [selectedColor, setSelectedColor] = useState<SignatureColor>('#000000');
  const [typedName, setTypedName] = useState('');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileSessionCode, setMobileSessionCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the base URL for QR code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setShowQRModal(false);
      setMobileSessionCode(null);
    }
  }, [open]);

  // Mobile session subscription
  useEffect(() => {
    if (!mobileSessionCode) return;

    const unsubscribe = subscribeToSession(mobileSessionCode, (signatureData) => {
      // Signature received from mobile
      onSignatureReady(signatureData);
      setShowQRModal(false);
      setMobileSessionCode(null);
    });

    return () => {
      unsubscribe();
    };
  }, [mobileSessionCode, onSignatureReady]);

  const clearSignature = useCallback(() => {
    sigCanvasRef.current?.clear();
  }, []);

  const handleDrawSubmit = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const signatureData = sigCanvasRef.current.toDataURL('image/png');
      onSignatureReady(signatureData);
    }
  }, [onSignatureReady]);

  const handleTypeSubmit = useCallback(() => {
    if (!typedName.trim()) return;

    // Create a canvas to render the typed signature
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = selectedColor;
      ctx.font = `400 36px ${FONT_STYLES[selectedFontIndex].font.replace(/'/g, '')}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

      const signatureData = canvas.toDataURL('image/png');
      onSignatureReady(signatureData);
    }
  }, [typedName, selectedColor, selectedFontIndex, onSignatureReady]);

  const handleUploadSubmit = useCallback(() => {
    if (uploadedImage) {
      onSignatureReady(uploadedImage);
    }
  }, [uploadedImage, onSignatureReady]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const startMobileSession = useCallback(async () => {
    const code = generateSessionCode();
    const session = await createSession(code);
    if (session) {
      setMobileSessionCode(code);
      setShowQRModal(true);
    }
  }, []);

  if (showQRModal && mobileSessionCode) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Sign from Mobile Device</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg border mb-4">
              <QRCodeSVG
                value={`${baseUrl}/mobile-sign/${mobileSessionCode}`}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-2">
              Scan this QR code with your mobile device
            </p>
            <div className="mt-4 w-full">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm font-medium mb-1">Session Code</p>
                <p className="text-3xl font-bold tracking-widest text-primary">{mobileSessionCode}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Or visit: {baseUrl}/mobile-sign and enter code
                </p>
              </div>
            </div>
            <Button variant="outline" className="mt-6" onClick={() => setShowQRModal(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Your Signature</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SignatureMode)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pen className="w-4 h-4" />
              <span className="hidden sm:inline">Draw</span>
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Type</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Color:</Label>
                  <div className="flex gap-2">
                    {SIGNATURE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value as SignatureColor)}
                        className={cn(
                          'w-8 h-8 rounded-full transition-all border-2',
                          color.color,
                          selectedColor === color.value
                            ? 'border-primary ring-2 ring-primary/20 scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        aria-label={color.label}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
                <SignatureCanvasWrapper
                  ref={sigCanvasRef}
                  penColor={selectedColor}
                  minWidth={2}
                  maxWidth={4}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'w-full touch-none',
                    style: { width: '100%', height: '200px' },
                  }}
                  backgroundColor="transparent"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleDrawSubmit}>
                  Apply Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-0">
            <div className="space-y-4">
              <div>
                <Label htmlFor="signature-name">Type your name</Label>
                <Input
                  id="signature-name"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-sm">Color:</Label>
                <div className="flex gap-2">
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value as SignatureColor)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all border-2',
                        color.color,
                        selectedColor === color.value
                          ? 'border-primary ring-2 ring-primary/20 scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      aria-label={color.label}
                    />
                  ))}
                </div>
              </div>

              {typedName && (
                <div className="border-2 rounded-lg p-6 bg-white">
                  <p className="text-sm text-muted-foreground mb-3">Choose a style:</p>
                  <div className="space-y-3">
                    {FONT_STYLES.map((fontStyle, index) => (
                      <button
                        key={fontStyle.name}
                        onClick={() => setSelectedFontIndex(index)}
                        className={cn(
                          'w-full p-4 rounded-lg border-2 transition-all text-left',
                          selectedFontIndex === index
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <span
                          style={{
                            fontFamily: fontStyle.font,
                            fontWeight: fontStyle.weight,
                            color: selectedColor,
                            fontSize: '28px',
                          }}
                        >
                          {typedName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleTypeSubmit} disabled={!typedName.trim()}>
                  Apply Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                  isDragging && 'border-primary bg-primary/5',
                  uploadedImage && 'border-solid border-green-500'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                {uploadedImage ? (
                  <div className="space-y-3">
                    <img
                      src={uploadedImage}
                      alt="Uploaded signature"
                      className="max-h-40 mx-auto object-contain"
                    />
                    <p className="text-sm text-green-600">Signature uploaded successfully</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drag and drop your signature image here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PNG, JPG, and SVG
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {uploadedImage && (
                  <Button variant="outline" onClick={() => setUploadedImage(null)}>
                    Remove
                  </Button>
                )}
                <Button onClick={handleUploadSubmit} disabled={!uploadedImage}>
                  Apply Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0">
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Sign from your mobile device</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Get a better signing experience on your phone&apos;s touchscreen.
                  We&apos;ll generate a QR code for you to scan.
                </p>
              </div>
              <Button onClick={startMobileSession} size="lg">
                Generate QR Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
