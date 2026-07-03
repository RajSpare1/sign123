'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Pen, Download, CircleCheck as CheckCircle, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PDFViewer } from '@/components/pdf-viewer';
import SignatureModal from '@/components/signature/signature-modal';
import { loadOriginalPDF, fillPDFFields, embedSignaturesInPDF } from '@/lib/generate-contract';
import { toast } from 'sonner';

export default function Home() {
  const [employeeName, setEmployeeName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [filledPdfBytes, setFilledPdfBytes] = useState<Uint8Array | null>(null);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const handleNameSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    setIsLoading(true);
    try {
      const raw = await loadOriginalPDF();
      const filled = await fillPDFFields(raw, name);
      setOriginalPdfBytes(raw);
      setFilledPdfBytes(filled);
      setEmployeeName(name);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [nameInput]);

  const handleSignatureReady = useCallback(async (signatureData: string) => {
    setShowSignatureModal(false);
    setIsProcessing(true);

    try {
      if (!originalPdfBytes) {
        toast.error('No document loaded');
        return;
      }

      // Always embed into the original to avoid stacking; re-fill fields too
      const modifiedPdf = await embedSignaturesInPDF(originalPdfBytes, signatureData, employeeName);
      setSignedPdfBytes(modifiedPdf);
      setIsSigned(true);
      toast.success('Signature applied successfully!');
    } catch (error) {
      console.error('Failed to embed signature:', error);
      toast.error('Failed to apply signature');
    } finally {
      setIsProcessing(false);
    }
  }, [originalPdfBytes, employeeName]);

  const handleDownload = useCallback(() => {
    const bytes = signedPdfBytes;
    if (!bytes) return;

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IT_Assets_Declaration_${employeeName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  }, [signedPdfBytes, employeeName]);

  const handleClearSignature = useCallback(() => {
    setSignedPdfBytes(null);
    setIsSigned(false);
    toast.success('Signature cleared');
  }, []);

  // ── NAME ENTRY SCREEN ───────────────────────────────────────────────────
  if (!employeeName) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">IT Assets Declaration</h1>
            <p className="text-gray-500 mt-2 text-sm">Ampcus Tech Private Limited</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter Your Name</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your name will be filled in the declaration form before signing.
            </p>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Full name (e.g. Rahul Sharma)"
                  className="pl-10"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!nameInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading document...
                  </>
                ) : (
                  'Continue to Document'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN SIGNING SCREEN ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 leading-tight">IT Assets Declaration</h1>
              <p className="text-xs text-gray-500">{employeeName} · {new Date().toLocaleDateString('en-IN')}</p>
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
              <Button size="sm" variant="outline" onClick={handleClearSignature}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-5xl">
          <PDFViewer pdfBytes={signedPdfBytes || filledPdfBytes} />
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
