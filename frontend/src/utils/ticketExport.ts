import { jsPDF } from "jspdf";
import JSZip from "jszip";
import {
  entryTicketFilename,
  generateEntryTicketImage,
  type EntryTicketInput,
} from "./generateEntryTicket";

export type TicketExportItem = {
  input: EntryTicketInput;
  filename: string;
};

export async function pngBlobToPdfBlob(pngBlob: Blob): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(pngBlob);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width, img.height],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  return pdf.output("blob");
}

export function pdfFilenameFromPng(pngFilename: string): string {
  return pngFilename.replace(/\.png$/i, ".pdf");
}

export async function generateEntryTicketPdf(
  input: EntryTicketInput
): Promise<Blob> {
  const pngBlob = await generateEntryTicketImage(input);
  return pngBlobToPdfBlob(pngBlob);
}

export async function downloadTicketPdf(item: TicketExportItem): Promise<void> {
  const pdfBlob = await generateEntryTicketPdf(item.input);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdfFilenameFromPng(item.filename);
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadTicketsZip(
  items: TicketExportItem[],
  zipName = "event-tickets.zip"
): Promise<void> {
  if (items.length === 0) return;

  const zip = new JSZip();

  for (const item of items) {
    const pdfBlob = await generateEntryTicketPdf(item.input);
    zip.file(pdfFilenameFromPng(item.filename), pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipName;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildTicketItemsFromRegistration(
  row: {
    investor?: EntryTicketInput["investor"] | null;
    phone?: string;
    qrCodeImage?: string | null;
    qrToken?: string | null;
    isCheckedIn?: boolean;
    participants?: Array<{
      name: string;
      type?: string;
      gender?: string;
      phone?: string;
      qrCodeImage?: string;
      qrToken?: string;
      isCheckedIn?: boolean;
    }>;
  },
  event: EntryTicketInput["event"]
): TicketExportItem[] {
  const items: TicketExportItem[] = [];
  const investor = {
    Name: row.investor?.Name,
    No: row.investor?.No,
    Code_No: row.investor?.Code_No,
    Phone_No: row.investor?.Phone_No ?? row.phone,
    Gender: row.investor?.Gender,
  };

  if (row.qrCodeImage) {
    items.push({
      input: {
        event,
        investor,
        qrCodeImage: row.qrCodeImage,
        qrToken: row.qrToken ?? undefined,
        checkedIn: row.isCheckedIn,
        passType: "investor",
      },
      filename: entryTicketFilename(event?.title, investor?.No, {
        passType: "investor",
      }),
    });
  }

  (row.participants || []).forEach((guest) => {
    if (!guest.qrCodeImage) return;
    items.push({
      input: {
        event,
        investor,
        qrCodeImage: guest.qrCodeImage,
        qrToken: guest.qrToken,
        checkedIn: guest.isCheckedIn,
        passType: "guest",
        guest: {
          name: guest.name,
          type: guest.type,
          gender: guest.gender,
          phone: guest.phone,
        },
        linkedInvestor: investor,
      },
      filename: entryTicketFilename(event?.title, investor?.No, {
        passType: "guest",
        guestName: guest.name,
      }),
    });
  });

  return items;
}
