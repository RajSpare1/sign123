'use client';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const today = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export async function loadOriginalPDF(): Promise<Uint8Array> {
  const response = await fetch('/IT_Assets_Declartion_and_Undertaking_Draft copy.pdf');
  if (!response.ok) throw new Error('Failed to load PDF');
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function fillPDFFields(
  pdfBytes: Uint8Array,
  employeeName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const dateStr = today();
  const pages = pdfDoc.getPages();

  // ── PAGE 1 – REQUEST FOR IT ASSETS ──────────────────────────────────────
  if (pages.length >= 1) {
    const p1 = pages[0];
    const { height } = p1.getSize();

    // Top date: cover placeholder "XX-0X-202X" and write real date
    p1.drawRectangle({ x: 66, y: height - 148, width: 100, height: 14, color: rgb(1, 1, 1) });
    p1.drawText(dateStr, { x: 68, y: height - 147, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Name in "I Mr/Ms-" blank: cover the underline area
    p1.drawRectangle({ x: 116, y: height - 176, width: 180, height: 13, color: rgb(1, 1, 1) });
    p1.drawText(employeeName, { x: 118, y: height - 175, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Bottom signature section – Employee Name
    p1.drawRectangle({ x: 130, y: height - 540, width: 180, height: 13, color: rgb(1, 1, 1) });
    p1.drawText(employeeName, { x: 132, y: height - 539, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Bottom date
    p1.drawRectangle({ x: 55, y: height - 557, width: 120, height: 13, color: rgb(1, 1, 1) });
    p1.drawText(dateStr, { x: 57, y: height - 556, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  }

  // ── PAGE 2 – DECLARATION / UNDERTAKING ──────────────────────────────────
  if (pages.length >= 2) {
    const p2 = pages[1];
    const { height } = p2.getSize();

    // Employee Name
    p2.drawRectangle({ x: 130, y: height - 645, width: 180, height: 13, color: rgb(1, 1, 1) });
    p2.drawText(employeeName, { x: 132, y: height - 644, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Date
    p2.drawRectangle({ x: 55, y: height - 663, width: 120, height: 13, color: rgb(1, 1, 1) });
    p2.drawText(dateStr, { x: 57, y: height - 662, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  }

  return pdfDoc.save();
}

export async function embedSignaturesInPDF(
  pdfBytes: Uint8Array,
  signatureImageBase64: string,
  employeeName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const dateStr = today();

  const base64Data = signatureImageBase64.split(',')[1] || signatureImageBase64;
  const signatureBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  const pages = pdfDoc.getPages();

  // ── PAGE 1 – embed signature + name + date ───────────────────────────────
  if (pages.length >= 1) {
    const p1 = pages[0];
    const { height } = p1.getSize();

    // Signature image (above the "Employee Name" line)
    p1.drawRectangle({ x: 54, y: height - 530, width: 200, height: 44, color: rgb(1, 1, 1) });
    p1.drawImage(signatureImage, { x: 55, y: height - 528, width: 190, height: 40 });

    // Employee Name (re-write since fillPDFFields may have already written it)
    p1.drawRectangle({ x: 130, y: height - 542, width: 180, height: 13, color: rgb(1, 1, 1) });
    p1.drawText(employeeName, { x: 132, y: height - 541, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Date
    p1.drawRectangle({ x: 55, y: height - 559, width: 120, height: 13, color: rgb(1, 1, 1) });
    p1.drawText(dateStr, { x: 57, y: height - 558, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  }

  // ── PAGE 2 – embed signature + name + date ───────────────────────────────
  if (pages.length >= 2) {
    const p2 = pages[1];
    const { height } = p2.getSize();

    // Signature image
    p2.drawRectangle({ x: 54, y: height - 635, width: 200, height: 44, color: rgb(1, 1, 1) });
    p2.drawImage(signatureImage, { x: 55, y: height - 633, width: 190, height: 40 });

    // Employee Name
    p2.drawRectangle({ x: 130, y: height - 647, width: 180, height: 13, color: rgb(1, 1, 1) });
    p2.drawText(employeeName, { x: 132, y: height - 646, size: 10, font: helvetica, color: rgb(0, 0, 0) });

    // Date
    p2.drawRectangle({ x: 55, y: height - 665, width: 120, height: 13, color: rgb(1, 1, 1) });
    p2.drawText(dateStr, { x: 57, y: height - 664, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  }

  return pdfDoc.save();
}
