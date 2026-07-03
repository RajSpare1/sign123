'use client';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ─────────────────────────────────────────────────────────────────
//  TWEAK COORDINATES HERE
//  x = distance from LEFT edge of page (in points, 1 pt ≈ 0.35 mm)
//  y = distance from TOP  of page  (we use `height - y` internally)
//  Increase x  → moves RIGHT
//  Increase y  → moves DOWN
// ─────────────────────────────────────────────────────────────────
const COORDS = {
  page1: {
    // Top date ("Date: - XX-0X-202X" near the top of the form)
    topDate:       { x: 68,  y: 147 },

    // Signature image in the bottom section (before the dashed line)
    signature:     { x: 55,  y: 490, width: 190, height: 40 },

    // Bottom date (near "Date: XX-0X-202X" under the signature)
    bottomDate:    { x: 57,  y: 556 },
  },
  page2: {
    // Signature image in the declaration page
    signature:     { x: 55,  y: 593, width: 190, height: 40 },

    // Date under the signature
    date:          { x: 57,  y: 662 },
  },
} as const;
// ─────────────────────────────────────────────────────────────────

function todayFormatted() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export async function loadOriginalPDF(): Promise<Uint8Array> {
  const response = await fetch('/IT_Assets_Declartion_and_Undertaking_Draft copy.pdf');
  if (!response.ok) throw new Error('Failed to load PDF');
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function embedSignaturesInPDF(
  pdfBytes: Uint8Array,
  signatureImageBase64: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const dateStr = todayFormatted();
  const pages = pdfDoc.getPages();

  const base64Data = signatureImageBase64.split(',')[1] || signatureImageBase64;
  const signatureBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  // ── PAGE 1 ──────────────────────────────────────────────────────
  if (pages.length >= 1) {
    const p1 = pages[0];
    const { height } = p1.getSize();
    const c = COORDS.page1;

    // Top date
    p1.drawRectangle({ x: c.topDate.x - 2, y: height - c.topDate.y - 12, width: 100, height: 14, color: rgb(1, 1, 1) });
    p1.drawText(dateStr, { x: c.topDate.x, y: height - c.topDate.y, size: 10, font, color: rgb(0, 0, 0) });

    // Signature image
    p1.drawRectangle({ x: c.signature.x - 1, y: height - c.signature.y - c.signature.height, width: c.signature.width + 2, height: c.signature.height + 2, color: rgb(1, 1, 1) });
    p1.drawImage(signatureImage, { x: c.signature.x, y: height - c.signature.y - c.signature.height + 2, width: c.signature.width, height: c.signature.height });

    // Bottom date
    p1.drawRectangle({ x: c.bottomDate.x - 2, y: height - c.bottomDate.y - 12, width: 100, height: 14, color: rgb(1, 1, 1) });
    p1.drawText(dateStr, { x: c.bottomDate.x, y: height - c.bottomDate.y, size: 10, font, color: rgb(0, 0, 0) });
  }

  // ── PAGE 2 ──────────────────────────────────────────────────────
  if (pages.length >= 2) {
    const p2 = pages[1];
    const { height } = p2.getSize();
    const c = COORDS.page2;

    // Signature image
    p2.drawRectangle({ x: c.signature.x - 1, y: height - c.signature.y - c.signature.height, width: c.signature.width + 2, height: c.signature.height + 2, color: rgb(1, 1, 1) });
    p2.drawImage(signatureImage, { x: c.signature.x, y: height - c.signature.y - c.signature.height + 2, width: c.signature.width, height: c.signature.height });

    // Date
    p2.drawRectangle({ x: c.date.x - 2, y: height - c.date.y - 12, width: 100, height: 14, color: rgb(1, 1, 1) });
    p2.drawText(dateStr, { x: c.date.x, y: height - c.date.y, size: 10, font, color: rgb(0, 0, 0) });
  }

  return pdfDoc.save();
}
