'use client';

import React, { useEffect, useState } from 'react';
import { FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  pdfBytes?: Uint8Array | null;
}

const BASE_WIDTH = 612;
const BASE_HEIGHT = 792;

export function PDFViewer({ pdfBytes }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfBytes]);

  const zoomIn = () => setScale((p) => Math.min(+(p + 0.2).toFixed(1), 2.0));
  const zoomOut = () => setScale((p) => Math.max(+(p - 0.2).toFixed(1), 0.4));
  const resetZoom = () => setScale(1);

  const scaledW = Math.round(BASE_WIDTH * scale);
  const scaledH = Math.round(BASE_HEIGHT * scale * 2 + 40); // room for 2 pages

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-200 min-h-[600px]">
        <FileText className="w-16 h-16 text-gray-400 mb-3" />
        <p className="text-gray-500 text-sm">No document loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shrink-0">
        <span className="text-sm font-medium text-gray-700">Document Preview</span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.4}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500 w-14 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2.0}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={resetZoom} title="Reset">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable canvas area */}
      <div
        className="flex-1 overflow-auto bg-gray-300"
        style={{ minHeight: 'calc(100vh - 140px)' }}
      >
        <div className="flex justify-center py-6 px-4">
          <div
            className="shadow-2xl rounded overflow-hidden bg-white"
            style={{ width: scaledW, flexShrink: 0 }}
          >
            <iframe
              key={pdfUrl}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="IT Assets Declaration"
              style={{
                width: scaledW,
                height: scaledH,
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
