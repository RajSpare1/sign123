'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Pen, Download, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFViewer } from '@/components/pdf-viewer';
import SignatureModal from '@/components/signature/signature-modal';
import { generateContractPDF, embedSignatureInPDF } from '@/lib/generate-contract';
import { toast } from 'sonner';

// Signature position in the PDF (coordinates for client signature box)
const SIGNATURE_POSITION = {
  x: 150,
  y: 70,
  width: 180,
  height: 50,
};

export default function Home() {
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const pdf = await generateContractPDF();
        setOriginalPdfBytes(pdf);
      } catch (error) {
        console.error('Failed to generate contract:', error);
        toast.error('Failed to load contract');
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, []);

  // Always sign from the original PDF to avoid layering signatures
  const handleSignatureReady = useCallback(async (signatureData: string) => {
    setShowSignatureModal(false);
    setIsProcessing(true);

    try {
      // Always use original PDF bytes to prevent signature stacking
      if (!originalPdfBytes) {
        toast.error('No document loaded');
        return;
      }

      const modifiedPdf = await embedSignatureInPDF(
        originalPdfBytes,
        signatureData,
        SIGNATURE_POSITION
      );

      setSignedPdfBytes(modifiedPdf);
      setIsSigned(true);
      toast.success('Signature applied successfully!');
    } catch (error) {
      console.error('Failed to embed signature:', error);
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
    link.download = 'signed-contract.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  }, [signedPdfBytes]);

  const handleClearSignature = useCallback(() => {
    setSignedPdfBytes(null);
    setIsSigned(false);
    toast.success('Signature cleared');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Contract Signing</h1>
              <p className="text-sm text-muted-foreground">
                Service Agreement - {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSigned && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Document Signed</span>
              </div>
            )}

            {isSigned && (
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Signed PDF
              </Button>
            )}

            {isSigned && (
              <Button variant="outline" onClick={handleClearSignature} className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Signature
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex items-stretch">
          <PDFViewer pdfBytes={signedPdfBytes || originalPdfBytes} />
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-2xl shadow-2xl border p-2 flex items-center gap-4">
          <div className="hidden sm:block text-sm text-muted-foreground px-3">
            {isSigned ? 'Click to replace your signature' : 'Click to sign this document'}
          </div>
          <Button
            size="lg"
            className="flex items-center gap-2 px-8"
            onClick={() => setShowSignatureModal(true)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Pen className="w-5 h-5" />
                {isSigned ? 'Re-Sign Contract' : 'Sign Contract'}
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
