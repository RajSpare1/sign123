'use client';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateContractPDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard US Letter size

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Header
  page.drawText('SERVICE AGREEMENT', {
    x: 180,
    y: 740,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Date
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  page.drawText(`Date: ${today}`, {
    x: 50,
    y: 700,
    size: 12,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Introduction
  const intro = 'This Service Agreement ("Agreement") is entered into by and between the parties identified below.';
  page.drawText(intro, {
    x: 50,
    y: 650,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Parties Section
  page.drawText('PARTIES', {
    x: 50,
    y: 600,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const parties = [
    'Provider: [Company Name], a corporation organized under the laws of the State of California,',
    'with its principal place of business at [Company Address].',
    '',
    'Client: [Client Name], an individual residing at [Client Address].',
  ];

  let yPos = 580;
  for (const line of parties) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 15;
  }

  // Services Section
  page.drawText('SERVICES', {
    x: 50,
    y: 480,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const services = [
    'The Provider agrees to provide the following services to the Client:',
    '',
    '1. Consulting and advisory services related to [specific domain]',
    '2. Development and implementation of agreed-upon solutions',
    '3. Ongoing maintenance and support as outlined in Exhibit A',
    '4. Regular progress reports and documentation',
  ];

  yPos = 460;
  for (const line of services) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 15;
  }

  // Terms Section
  page.drawText('TERMS AND CONDITIONS', {
    x: 50,
    y: 360,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const terms = [
    '1. This Agreement shall commence on the date of signature and continue for a period',
    '   of twelve (12) months unless terminated earlier as provided herein.',
    '',
    '2. Either party may terminate this Agreement with thirty (30) days written notice.',
    '',
    '3. All intellectual property created during this engagement shall belong to the Client.',
    '',
    '4. The Provider agrees to maintain confidentiality of all Client information.',
  ];

  yPos = 340;
  for (const line of terms) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 15;
  }

  // Compensation Section
  page.drawText('COMPENSATION', {
    x: 50,
    y: 220,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const compensation = [
    'In consideration for the services provided, the Client shall pay the Provider',
    'a fee of $[Amount] per month, payable within 15 days of invoice receipt.',
  ];

  yPos = 200;
  for (const line of compensation) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 15;
  }

  // Signature Lines
  page.drawText('SIGNATURES', {
    x: 50,
    y: 140,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Client signature area
  page.drawText('Client Signature:', {
    x: 50,
    y: 110,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: 150, y: 100 },
    end: { x: 350, y: 100 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Signature placeholder box (this is where we'll embed the signature)
  page.drawRectangle({
    x: 150,
    y: 70,
    width: 180,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  // Provider signature area
  page.drawText('Provider Signature:', {
    x: 380,
    y: 110,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: 480, y: 100 },
    end: { x: 480, y: 100 }, // Short line
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawRectangle({
    x: 380,
    y: 70,
    width: 180,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  // Footer
  page.drawText('By signing below, both parties acknowledge they have read and agree to the terms of this Agreement.', {
    x: 50,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function embedSignatureInPDF(
  pdfBytes: Uint8Array,
  signatureImageBase64: string,
  position: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Convert base64 to Uint8Array
  const signatureBase64 = signatureImageBase64.split(',')[1] || signatureImageBase64;
  const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

  // Embed the PNG image
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  // Get the first page
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Draw the signature at the specified position
  firstPage.drawImage(signatureImage, {
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  });

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}
