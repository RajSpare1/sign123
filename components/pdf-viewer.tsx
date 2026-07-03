'use client';

import React, { useEffect, useState } from 'react';
import { FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  pdfBytes?: Uint8Array | null;
}

export function PDFViewer({ pdfBytes }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (pdfBytes) {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfBytes]);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No document loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Document Preview</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={resetZoom} title="Reset Zoom">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto bg-gray-300 p-4 flex items-start justify-center"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div
          className="shadow-xl rounded-lg overflow-hidden border border-gray-400 bg-white"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
        >
          <object
            data={pdfUrl}
            type="application/pdf"
            width="612"
            height="792"
            className="block"
            style={{
              width: '612px',
              height: '792px',
            }}
          >
            <iframe
              src={pdfUrl}
              title="PDF Document"
              width="612"
              height="792"
              style={{
                border: 'none',
              }}
            />
          </object>
        </div>
      </div>
    </div>
  );
}
