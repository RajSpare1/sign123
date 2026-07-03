'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Pen, Download, CircleCheck as CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFViewer } from '@/components/pdf-viewer';
import SignatureModal from '@/components/signature/signature-modal';
import { loadOriginalPDF, embedSignaturesInPDF } from '@/lib/generate-contract';
import { toast } from 'sonner';

export default function Home() {
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    loadOriginalPDF()
      .then(setOriginalPdfBytes)
      .catch(() => toast.error('Failed to load document'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSignatureReady = useCallback(async (signatureData: string) => {
    setShowSignatureModal(false);
    setIsProcessing(true);
    try {
      if (!originalPdfBytes) { toast.error('No document loaded'); return; }
      const modified = await embedSignaturesInPDF(originalPdfBytes, signatureData);
      setSignedPdfBytes(modified);
      setIsSigned(true);
      toast.success('Signature applied!');
    } catch {
      toast.error('Failed to apply signature');
    } finally {
      setIsProcessing(false);
    }
  }, [originalPdfBytes]);

  const handleDownload = useCallback(() => {
    if (!signedPdfBytes) return;
    const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'IT_Assets_Declaration_Signed.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  }, [signedPdfBytes]);

  const handleClear = useCallback(() => {
    setSignedPdfBytes(null);
    setIsSigned(false);
    toast.success('Signature cleared');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">IT Assets Declaration</h1>
              <p className="text-xs text-gray-500">Ampcus Tech Private Limited</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSigned && (
              <div className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Signed</span>
              </div>
            )}
            {isSigned && (
              <Button size="sm" onClick={handleDownload} className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            )}
            {isSigned && (
              <Button size="sm" variant="outline" onClick={handleClear}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-5xl">
          <PDFViewer pdfBytes={signedPdfBytes || originalPdfBytes} />
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-3 py-2 flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-500 pl-2">
            {isSigned ? 'Replace your signature' : 'Sign this document'}
          </span>
          <Button
            size="lg"
            className="flex items-center gap-2 px-6"
            onClick={() => setShowSignatureModal(true)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Pen className="w-4 h-4" />
                {isSigned ? 'Re-Sign' : 'Sign Document'}
              </>
            )}
          </Button>
        </div>
      </div>

      <SignatureModal
        open={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSignatureReady={handleSignatureReady}
        hasSignature={isSigned}
      />
    </div>
  );
}
