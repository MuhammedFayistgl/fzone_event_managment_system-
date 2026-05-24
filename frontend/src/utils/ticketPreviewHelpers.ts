import type { EventResponseType, TicketDesign } from "../Types/event";
import type { EntryTicketInput } from "./generateEntryTicket";

export function makePlaceholderQr(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 220, 220);
  ctx.fillStyle = "#0b0f14";
  const cell = 10;
  for (let y = 0; y < 22; y += 1) {
    for (let x = 0; x < 22; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  return canvas.toDataURL("image/png");
}

export const SAMPLE_INVESTOR = {
  Name: "Sample Investor",
  No: 1001,
  Code_No: "DEMO",
  Phone_No: "9999999999",
};

export const SAMPLE_QR_TOKEN = "SAMPLE-TOKEN-PREVIEW-0001";

type PreviewFormSlice = {
  title?: string;
  description?: string;
  eventDays?: EventResponseType["eventDays"];
  location?: string;
  locationType?: EventResponseType["locationType"];
};

export function buildSampleTicketInput(
  form: PreviewFormSlice,
  ticketDesign: TicketDesign | undefined,
  pendingBackgroundUrl?: string | null
): EntryTicketInput {
  const backgroundUrl = pendingBackgroundUrl || ticketDesign?.backgroundUrl || null;
  const mode = pendingBackgroundUrl
    ? "custom"
    : backgroundUrl && ticketDesign?.mode === "custom"
      ? "custom"
      : "default";

  const sampleEvent = {
    title: form.title || "Sample Event",
    description: form.description,
    eventDays: form.eventDays,
    location: form.location,
    locationType: form.locationType,
    ticketDesign: {
      mode,
      textTheme: ticketDesign?.textTheme ?? "dark",
      backgroundUrl,
    },
  } as EventResponseType;

  return {
    event: sampleEvent,
    investor: SAMPLE_INVESTOR,
    qrCodeImage: makePlaceholderQr(),
    qrToken: SAMPLE_QR_TOKEN,
    passType: "investor",
  };
}
