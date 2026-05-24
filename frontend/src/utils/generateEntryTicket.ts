import type { EventResponseType, TicketTextTheme } from "../Types/event";
import { formatDayDate, formatDayTime } from "./eventFormat";
import { resolveUploadUrl } from "./resolveUploadUrl";
import logoUrl from "../assets/world-projects-logo-icon-hd.png";

const EXPORT_SCALE = 2; // 960×1680 HD output

export type InvestorTicketInfo = {
  Name?: string;
  No?: number;
  Code_No?: string;
  Phone_No?: number | string;
  Gender?: string;
};

export type PassType = "investor" | "guest";

export type GuestTicketInfo = {
  name: string;
  type?: string;
  gender?: string;
  phone?: string;
};

export type EntryTicketInput = {
  event?: EventResponseType | null;
  investor: InvestorTicketInfo;
  qrCodeImage: string;
  qrToken?: string;
  checkedIn?: boolean;
  passType?: PassType;
  guest?: GuestTicketInfo;
  linkedInvestor?: InvestorTicketInfo;
};

const TICKET_W = 480;
const TICKET_H = 840;
const CARD_X = 12;
const CARD_Y = 12;
const CARD_W = TICKET_W - 24;
const CARD_H = TICKET_H - 24;
const CARD_R = 18;
const PAD = 28;

const BRAND_BLUE = "#2563eb";
const BRAND_GUEST = "#c026d3";
const HEADER_H = 120;
const SPLIT_Y = CARD_Y + CARD_H / 2;
const QR_SIZE = 220;
const QR_QUIET = 16;
const CUSTOM_QR_SIZE = 168;
const CUSTOM_QR_QUIET = 12;

type OverlayColors = {
  title: string;
  label: string;
  value: string;
  meta: string;
  muted: string;
  token: string;
  gridBg: string;
  gridBorder: string;
  glass: (opacity: number) => string;
};

function getOverlayColors(textTheme: TicketTextTheme): OverlayColors {
  if (textTheme === "light") {
    return {
      title: "#ffffff",
      label: "#cbd5e1",
      value: "#ffffff",
      meta: "#e2e8f0",
      muted: "#94a3b8",
      token: "#ffffff",
      gridBg: "rgba(255, 255, 255, 0.12)",
      gridBorder: "rgba(255, 255, 255, 0.22)",
      glass: (opacity) => `rgba(15, 23, 42, ${opacity * 0.75})`,
    };
  }

  return {
    title: "#0f172a",
    label: "#64748b",
    value: "#0f172a",
    meta: "#475569",
    muted: "#64748b",
    token: "#0f172a",
    gridBg: "#f8fafc",
    gridBorder: "#e2e8f0",
    glass: (opacity) => `rgba(255, 255, 255, ${opacity})`,
  };
}

function getPassAccent(passType: PassType = "investor"): string {
  return passType === "guest" ? BRAND_GUEST : BRAND_BLUE;
}

function resolvePassType(input: EntryTicketInput): PassType {
  return input.passType ?? "investor";
}

function truncateToken(token: string, start = 8, end = 6): string {
  if (!token || token.length <= start + end + 3) return token;
  return `${token.slice(0, start)}…${token.slice(-end)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isBlobOrData = src.startsWith("blob:") || src.startsWith("data:");
    const isRelative = src.startsWith("/");
    if (!isBlobOrData && !isRelative) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

/** Strip near-black pixels so logo has no visible black box on light header */
async function loadTransparentLogo(src: string): Promise<HTMLImageElement> {
  const img = await loadImage(src);
  const off = document.createElement("canvas");
  off.width = img.width;
  off.height = img.height;
  const c = off.getContext("2d");
  if (!c) return img;

  c.drawImage(img, 0, 0);
  const data = c.getImageData(0, 0, off.width, off.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    if (r < 48 && g < 48 && b < 48) {
      data.data[i + 3] = 0;
    }
  }
  c.putImageData(data, 0, 0);
  return loadImage(off.toDataURL("image/png"));
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    let trimmed = last;
    while (trimmed.length > 3 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[maxLines - 1] = `${trimmed}…`;
  }

  return lines.length ? lines : [text.slice(0, 32)];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTicketShell(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#eef0f3";
  ctx.fillRect(0, 0, TICKET_W, TICKET_H);

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.stroke();
}

function drawCheckedInBanner(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  roundRect(ctx, CARD_X, y, CARD_W, 34, CARD_R);
  ctx.clip();
  ctx.fillStyle = "#fef2f2";
  ctx.fillRect(CARD_X, y, CARD_W, 34);
  ctx.fillStyle = "#dc2626";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CHECKED IN — PASS USED", TICKET_W / 2, y + 22);
  ctx.restore();
}

async function drawBrandHeader(
  ctx: CanvasRenderingContext2D,
  y: number,
  passType: PassType = "investor"
): Promise<number> {
  const accent = getPassAccent(passType);
  const gradEnd = passType === "guest" ? "#fdf4ff" : "#f0f7ff";
  const rolePill = passType === "guest" ? "GUEST" : "INVESTOR";

  ctx.save();
  roundRect(ctx, CARD_X, y, CARD_W, HEADER_H + CARD_R, CARD_R);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD_X, y, CARD_W, HEADER_H);

  const gradient = ctx.createLinearGradient(CARD_X, y, CARD_X, y + HEADER_H);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, gradEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(CARD_X, y, CARD_W, HEADER_H);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CARD_X + PAD, y + HEADER_H);
  ctx.lineTo(CARD_X + CARD_W - PAD, y + HEADER_H);
  ctx.stroke();
  ctx.restore();

  let logoBottom = y + 18;
  try {
    const logo = await loadTransparentLogo(logoUrl);
    const logoH = 58;
    const logoW = (logo.width / logo.height) * logoH;
    const logoX = (TICKET_W - logoW) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(logo, logoX, y + 14, logoW, logoH);
    logoBottom = y + 14 + logoH;
  } catch {
    ctx.fillStyle = accent;
    ctx.font = "800 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WP", TICKET_W / 2, y + 48);
    logoBottom = y + 54;
  }

  const pillY = logoBottom + 16;
  const pills = ["ADMIT ONE", rolePill];
  ctx.font = "700 9px system-ui, sans-serif";
  const pillWidths = pills.map((p) => ctx.measureText(p).width + 20);
  const gap = 8;
  const totalW = pillWidths[0] + pillWidths[1] + gap;
  let pillX = (TICKET_W - totalW) / 2;

  for (let i = 0; i < pills.length; i++) {
    const pw = pillWidths[i];
    ctx.fillStyle = i === 0 ? accent : passType === "guest" ? "#fdf4ff" : "#eff6ff";
    roundRect(ctx, pillX, pillY, pw, 22, 11);
    ctx.fill();
    ctx.strokeStyle = i === 0 ? accent : `${accent}73`;
    ctx.lineWidth = 1;
    roundRect(ctx, pillX, pillY, pw, 22, 11);
    ctx.stroke();
    ctx.fillStyle = i === 0 ? "#ffffff" : accent;
    ctx.textAlign = "center";
    ctx.fillText(pills[i], pillX + pw / 2, pillY + 15);
    pillX += pw + gap;
  }

  return y + HEADER_H;
}

function drawInfoGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  colors?: OverlayColors
) {
  ctx.fillStyle = colors?.gridBg ?? "#f8fafc";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = colors?.gridBorder ?? "#e2e8f0";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();

  ctx.fillStyle = colors?.label ?? "#64748b";
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 12, y + 18);

  ctx.fillStyle = colors?.value ?? "#0f172a";
  ctx.font = "600 12px system-ui, sans-serif";
  const valueLines = wrapLines(ctx, value, w - 24, 2);
  let vy = y + 36;
  for (const line of valueLines) {
    ctx.fillText(line, x + 12, vy);
    vy += 15;
  }
}

function drawInfoGrid(
  ctx: CanvasRenderingContext2D,
  y: number,
  event: EventResponseType | null | undefined,
  ticketRef: string,
  colors?: OverlayColors
): number {
  const firstDay = event?.eventDays?.[0];
  const dateVal = firstDay ? formatDayDate(firstDay.date) : "TBD";
  const timeVal = firstDay
    ? `${formatDayTime(firstDay.startTime)} – ${formatDayTime(firstDay.endTime)}`
    : "TBD";
  const isOnline = event?.locationType === "online";
  const venueVal = isOnline
    ? event?.location?.trim() || "Online"
    : event?.location?.trim() || "Venue TBD";

  const gridX = CARD_X + PAD - 4;
  const gridW = CARD_W - (PAD - 4) * 2;
  const colW = (gridW - 10) / 2;
  const cellH = 54;

  drawInfoGridCell(ctx, gridX, y, colW, cellH, "DATE", dateVal, colors);
  drawInfoGridCell(ctx, gridX + colW + 10, y, colW, cellH, "TIME", timeVal, colors);
  drawInfoGridCell(ctx, gridX, y + cellH + 10, colW, cellH, isOnline ? "ONLINE" : "VENUE", venueVal, colors);
  drawInfoGridCell(ctx, gridX + colW + 10, y + cellH + 10, colW, cellH, "TICKET #", ticketRef, colors);

  return y + cellH * 2 + 10;
}

function drawGuestBlock(
  ctx: CanvasRenderingContext2D,
  y: number,
  input: EntryTicketInput,
  colors?: OverlayColors
): number {
  const passType = resolvePassType(input);
  const label = passType === "guest" ? "GUEST" : "INVESTOR";

  ctx.fillStyle = colors?.label ?? "#64748b";
  ctx.font = "700 9px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, PAD + CARD_X - 4, y);

  y += 18;

  if (passType === "guest" && input.guest) {
    ctx.fillStyle = colors?.title ?? "#0f172a";
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.fillText(input.guest.name || "Guest", PAD + CARD_X - 4, y);

    y += 22;
    ctx.fillStyle = colors?.meta ?? "#475569";
    ctx.font = "500 12px system-ui, sans-serif";
    const meta = [
      input.guest.type ? input.guest.type : null,
      input.guest.gender ? input.guest.gender : null,
      input.guest.phone ? `Ph ${input.guest.phone}` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");

    const metaLines = wrapLines(ctx, meta || "—", CARD_W - PAD * 2, 2);
    for (const line of metaLines) {
      ctx.fillText(line, PAD + CARD_X - 4, y);
      y += 16;
    }

    y += 8;
    return drawLinkedInvestorBlock(ctx, y, input.linkedInvestor ?? input.investor, colors);
  }

  const investor = input.investor;
  ctx.fillStyle = colors?.title ?? "#0f172a";
  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillText(investor?.Name || "Guest", PAD + CARD_X - 4, y);

  y += 22;
  ctx.fillStyle = colors?.meta ?? "#475569";
  ctx.font = "500 12px system-ui, sans-serif";
  const meta = [
    investor?.No != null ? `ID ${investor.No}` : null,
    investor?.Code_No ? `Code ${investor.Code_No}` : null,
    investor?.Phone_No != null ? `Ph ${investor.Phone_No}` : null,
    investor?.Gender ? investor.Gender : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const metaLines = wrapLines(ctx, meta || "—", CARD_W - PAD * 2, 2);
  for (const line of metaLines) {
    ctx.fillText(line, PAD + CARD_X - 4, y);
    y += 16;
  }

  return y + 8;
}

function drawLinkedInvestorBlock(
  ctx: CanvasRenderingContext2D,
  y: number,
  investor: InvestorTicketInfo | undefined,
  colors?: OverlayColors
): number {
  const boxX = CARD_X + PAD - 8;
  const boxW = CARD_W - PAD * 2 + 16;
  const boxH = 52;

  drawGlassPanel(ctx, boxX, y, boxW, boxH, 0.9, colors);

  ctx.fillStyle = colors?.label ?? "#64748b";
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GUEST OF", TICKET_W / 2, y + 16);

  ctx.fillStyle = colors?.title ?? "#0f172a";
  ctx.font = "700 13px system-ui, sans-serif";
  const line = [
    investor?.Name || "Investor",
    investor?.No != null ? `ID ${investor.No}` : null,
    investor?.Code_No ? `Code ${investor.Code_No}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const lines = wrapLines(ctx, line, boxW - 24, 1);
  ctx.fillText(lines[0], TICKET_W / 2, y + 36);

  return y + boxH + 8;
}

function drawPerforation(ctx: CanvasRenderingContext2D, y: number) {
  const notchR = 10;
  const lineLeft = CARD_X + PAD;
  const lineRight = CARD_X + CARD_W - PAD;

  ctx.save();
  ctx.strokeStyle = "#cbd5e1";
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lineLeft, y);
  ctx.lineTo(lineRight, y);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(CARD_X, y, notchR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CARD_X + CARD_W, y, notchR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(CARD_X, y, notchR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CARD_X + CARD_W, y, notchR, 0, Math.PI * 2);
  ctx.stroke();
}

type QrZoneOptions = {
  qrSize?: number;
  qrQuiet?: number;
  labelOffset?: number;
  accentColor?: string;
};

function drawQrZone(
  ctx: CanvasRenderingContext2D,
  y: number,
  qrImg: HTMLImageElement,
  checkedIn: boolean,
  options?: QrZoneOptions
): number {
  const qrSize = options?.qrSize ?? QR_SIZE;
  const qrQuiet = options?.qrQuiet ?? QR_QUIET;
  const labelOffset = options?.labelOffset ?? 32;
  const accentColor = options?.accentColor ?? BRAND_BLUE;
  const frameSize = qrSize + qrQuiet * 2;
  const frameX = (TICKET_W - frameSize) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(15, 23, 42, 0.1)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, frameX, y, frameSize, frameSize, 14);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  roundRect(ctx, frameX, y, frameSize, frameSize, 14);
  ctx.stroke();

  const qrX = frameX + qrQuiet;
  const qrY = y + qrQuiet;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (checkedIn) {
    drawVoidStamp(ctx, frameX, y, frameSize, frameSize);
  }

  ctx.fillStyle = accentColor;
  ctx.font = "700 10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SCAN AT ENTRANCE", TICKET_W / 2, y + frameSize + 22);

  return y + frameSize + labelOffset;
}

function drawVoidStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.fillStyle = "rgba(254, 226, 226, 0.55)";
  ctx.fillRect(x, y, w, h);

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-18 * (Math.PI / 180));

  ctx.strokeStyle = "rgba(220, 38, 38, 0.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(-w * 0.38, -h * 0.14, w * 0.76, h * 0.28);

  ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VOID", 0, 0);
  ctx.restore();
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  qrToken: string | undefined,
  ticketRef: string,
  colors?: OverlayColors
) {
  if (qrToken) {
    ctx.fillStyle = colors?.muted ?? "#64748b";
    ctx.font = "700 8px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TOKEN", TICKET_W / 2, y);
    ctx.fillStyle = colors?.token ?? "#0f172a";
    ctx.font = "500 11px ui-monospace, monospace";
    ctx.fillText(truncateToken(qrToken), TICKET_W / 2, y + 16);
    y += 32;
  }

  ctx.fillStyle = colors?.muted ?? "#64748b";
  ctx.font = "600 9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Ref ${ticketRef}`, TICKET_W / 2, y);

  ctx.fillStyle = colors?.label ?? "#94a3b8";
  ctx.font = "500 10px system-ui, sans-serif";
  ctx.fillText("Non-transferable · Present at venue entrance", TICKET_W / 2, CARD_Y + CARD_H - 18);
  ctx.fillText("Powered by F-Zone Event Management", TICKET_W / 2, CARD_Y + CARD_H - 6);
}

export function entryTicketFilename(
  eventTitle: string | undefined,
  investorNo: number | string | undefined,
  options?: { passType?: PassType; guestName?: string }
): string {
  const slug = slugify(eventTitle || "event");
  if (options?.passType === "guest" && options.guestName) {
    return `entry-pass-${slug}-guest-${slugify(options.guestName)}.png`;
  }
  const no = investorNo ?? "guest";
  return `entry-pass-${slug}-${no}.png`;
}

function buildTicketRef(input: EntryTicketInput): string {
  if (input.passType === "guest" && input.guest?.name) {
    return `WP-G-${slugify(input.guest.name).slice(0, 12).toUpperCase()}`;
  }
  const no = input.investor?.No ?? "0";
  const code = input.investor?.Code_No ?? "NA";
  return `WP-${no}-${code}`;
}

function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity = 0.88,
  colors?: OverlayColors
) {
  ctx.fillStyle = colors ? colors.glass(opacity) : `rgba(255, 255, 255, ${opacity})`;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
}

async function drawCustomSplitBackground(
  ctx: CanvasRenderingContext2D,
  backgroundUrl: string
) {
  const bg = await loadImage(resolveUploadUrl(backgroundUrl));
  const bottomH = CARD_Y + CARD_H - SPLIT_Y;

  ctx.fillStyle = "#eef0f3";
  ctx.fillRect(0, 0, TICKET_W, TICKET_H);

  ctx.save();
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.clip();

  const srcHalfH = bg.height / 2;
  const topH = SPLIT_Y - CARD_Y;

  ctx.drawImage(
    bg,
    0,
    0,
    bg.width,
    srcHalfH,
    CARD_X,
    CARD_Y,
    CARD_W,
    topH
  );

  ctx.drawImage(
    bg,
    0,
    srcHalfH,
    bg.width,
    srcHalfH,
    CARD_X,
    SPLIT_Y,
    CARD_W,
    bottomH
  );

  ctx.restore();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.stroke();

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CARD_X + PAD, SPLIT_Y);
  ctx.lineTo(CARD_X + CARD_W - PAD, SPLIT_Y);
  ctx.stroke();
}

function drawPassHolderNameBox(
  ctx: CanvasRenderingContext2D,
  y: number,
  input: EntryTicketInput,
  colors: OverlayColors
): number {
  const passType = resolvePassType(input);
  const boxX = CARD_X + PAD - 8;
  const boxW = CARD_W - PAD * 2 + 16;
  const boxH = passType === "guest" ? 58 : 46;

  drawGlassPanel(ctx, boxX, y, boxW, boxH, 0.92, colors);

  ctx.fillStyle = colors.label;
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(passType === "guest" ? "GUEST" : "INVESTOR", TICKET_W / 2, y + 15);

  ctx.fillStyle = colors.title;
  ctx.font = "800 18px system-ui, sans-serif";
  const holderName =
    passType === "guest"
      ? input.guest?.name || "Guest"
      : input.investor?.Name || "Investor";
  const nameLines = wrapLines(ctx, holderName, boxW - 24, 1);
  ctx.fillText(nameLines[0], TICKET_W / 2, y + 36);

  if (passType === "guest" && input.guest) {
    ctx.fillStyle = colors.meta;
    ctx.font = "500 10px system-ui, sans-serif";
    const meta = [input.guest.type, input.guest.gender].filter(Boolean).join(" · ");
    if (meta) ctx.fillText(meta, TICKET_W / 2, y + 52);
  }

  return y + boxH + 8;
}

function drawEssentialEventDetails(
  ctx: CanvasRenderingContext2D,
  y: number,
  event: EventResponseType | null | undefined,
  colors: OverlayColors
): number {
  const firstDay = event?.eventDays?.[0];
  const dateVal = firstDay ? formatDayDate(firstDay.date) : "TBD";
  const timeVal = firstDay
    ? `${formatDayTime(firstDay.startTime)} – ${formatDayTime(firstDay.endTime)}`
    : "TBD";
  const isOnline = event?.locationType === "online";
  const venueVal = isOnline
    ? event?.location?.trim() || "Online"
    : event?.location?.trim() || "Venue TBD";

  const boxX = CARD_X + PAD - 8;
  const boxW = CARD_W - PAD * 2 + 16;
  const boxH = 76;

  drawGlassPanel(ctx, boxX, y, boxW, boxH, 0.92, colors);

  const cx = TICKET_W / 2;
  const innerW = boxW - 24;

  ctx.textAlign = "center";
  ctx.fillStyle = colors.title;
  ctx.font = "700 14px system-ui, sans-serif";
  const titleLines = wrapLines(ctx, event?.title || "Event", innerW, 1);
  ctx.fillText(titleLines[0], cx, y + 18);

  ctx.fillStyle = colors.meta;
  ctx.font = "500 11px system-ui, sans-serif";
  ctx.fillText(`${dateVal}  ·  ${timeVal}`, cx, y + 38);

  const venueLines = wrapLines(ctx, venueVal, innerW, 1);
  ctx.fillText(venueLines[0], cx, y + 56);

  ctx.fillStyle = colors.label;
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.fillText(isOnline ? "ONLINE" : "VENUE", cx, y + 70);

  return y + boxH + 6;
}

function renderCustomTicketBottom(
  ctx: CanvasRenderingContext2D,
  input: EntryTicketInput,
  ticketRef: string,
  qrImg: HTMLImageElement,
  options: { textTheme: TicketTextTheme }
) {
  const { event, qrToken, checkedIn = false } = input;
  const passType = resolvePassType(input);
  const accent = getPassAccent(passType);
  const colors = getOverlayColors(options.textTheme);
  let y = SPLIT_Y + 8;

  y = drawQrZone(ctx, y, qrImg, checkedIn, {
    qrSize: CUSTOM_QR_SIZE,
    qrQuiet: CUSTOM_QR_QUIET,
    labelOffset: 26,
    accentColor: accent,
  });
  y = drawPassHolderNameBox(ctx, y, input, colors);
  if (passType === "guest") {
    y = drawLinkedInvestorBlock(ctx, y, input.linkedInvestor ?? input.investor, colors);
  }
  y = drawEssentialEventDetails(ctx, y, event, colors);
  drawFooter(ctx, y, qrToken, ticketRef, colors);
}

async function renderTicketBody(
  ctx: CanvasRenderingContext2D,
  input: EntryTicketInput,
  ticketRef: string,
  qrImg: HTMLImageElement,
  options: {
    startY: number;
    useGlass: boolean;
    customLayout?: boolean;
    textTheme?: TicketTextTheme;
  }
) {
  const { event, qrToken, checkedIn = false } = input;
  const textTheme = options.textTheme ?? event?.ticketDesign?.textTheme ?? "dark";
  const topColors = options.customLayout ? getOverlayColors(textTheme) : undefined;
  const overlayColors = options.useGlass
    ? getOverlayColors(textTheme)
    : topColors;
  const bottomColors = options.customLayout ? getOverlayColors(textTheme) : overlayColors;
  let y = options.startY;

  if (options.useGlass && !options.customLayout) {
    drawGlassPanel(ctx, PAD + CARD_X - 8, y - 8, CARD_W - PAD * 2 + 16, 72, 0.9, overlayColors);
  } else if (options.customLayout) {
    drawGlassPanel(ctx, PAD + CARD_X - 8, y - 8, CARD_W - PAD * 2 + 16, 72, 0.88, topColors);
  }

  ctx.fillStyle = (options.customLayout ? topColors : overlayColors)?.title ?? "#0f172a";
  ctx.font = "800 22px system-ui, sans-serif";
  ctx.textAlign = "left";
  const titleLines = wrapLines(ctx, event?.title || "Event", CARD_W - PAD * 2, 2);
  for (const line of titleLines) {
    ctx.fillText(line, PAD + CARD_X - 4, y);
    y += 28;
  }

  y += 12;

  if (options.useGlass && !options.customLayout) {
    const gridX = CARD_X + PAD - 12;
    const gridW = CARD_W - (PAD - 12) * 2;
    drawGlassPanel(ctx, gridX, y - 6, gridW, 122, 0.9, overlayColors);
  } else if (options.customLayout) {
    const gridX = CARD_X + PAD - 12;
    const gridW = CARD_W - (PAD - 12) * 2;
    drawGlassPanel(ctx, gridX, y - 6, gridW, 122, 0.88, topColors);
  }

  y = drawInfoGrid(
    ctx,
    y,
    event,
    ticketRef,
    options.customLayout ? topColors : overlayColors
  );
  y += 16;

  if (options.useGlass && !options.customLayout) {
    drawGlassPanel(ctx, PAD + CARD_X - 8, y - 8, CARD_W - PAD * 2 + 16, 78, 0.9, overlayColors);
  } else if (options.customLayout) {
    drawGlassPanel(ctx, PAD + CARD_X - 8, y - 8, CARD_W - PAD * 2 + 16, 78, 0.88, topColors);
  }

  y = drawGuestBlock(
    ctx,
    y,
    input,
    options.customLayout ? topColors : overlayColors
  );
  y += 8;

  drawPerforation(ctx, y);
  y += 24;

  if (options.customLayout || options.useGlass) {
    const frameSize = QR_SIZE + QR_QUIET * 2;
    const frameX = (TICKET_W - frameSize) / 2;
    drawGlassPanel(
      ctx,
      frameX - 8,
      y - 8,
      frameSize + 16,
      frameSize + 56,
      0.92,
      bottomColors
    );
  }

  y = drawQrZone(ctx, y, qrImg, checkedIn, {
    accentColor: getPassAccent(resolvePassType(input)),
  });
  drawFooter(ctx, y, qrToken, ticketRef, options.customLayout ? bottomColors : overlayColors);
}

async function renderDefaultTicket(
  ctx: CanvasRenderingContext2D,
  input: EntryTicketInput,
  ticketRef: string,
  qrImg: HTMLImageElement
) {
  const { checkedIn = false } = input;
  drawTicketShell(ctx);

  let y = CARD_Y;
  if (checkedIn) {
    drawCheckedInBanner(ctx, y);
    y += 34;
  }

  y = await drawBrandHeader(ctx, y, resolvePassType(input));
  y += 16;
  await renderTicketBody(ctx, input, ticketRef, qrImg, { startY: y, useGlass: false });
}

async function renderCustomTicket(
  ctx: CanvasRenderingContext2D,
  input: EntryTicketInput,
  ticketRef: string,
  qrImg: HTMLImageElement
) {
  const { event, checkedIn = false } = input;
  const bgUrl = event?.ticketDesign?.backgroundUrl;
  if (!bgUrl) throw new Error("No custom background");

  await drawCustomSplitBackground(ctx, bgUrl);

  if (checkedIn) {
    drawCheckedInBanner(ctx, CARD_Y);
  }

  renderCustomTicketBottom(ctx, input, ticketRef, qrImg, {
    textTheme: event?.ticketDesign?.textTheme ?? "dark",
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate ticket image"));
      },
      "image/png",
      1
    );
  });
}

export async function generateEntryTicketImage(
  input: EntryTicketInput
): Promise<Blob> {
  const { event } = input;

  const canvas = document.createElement("canvas");
  canvas.width = TICKET_W * EXPORT_SCALE;
  canvas.height = TICKET_H * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const ticketRef = buildTicketRef(input);
  const qrImg = await loadImage(input.qrCodeImage);

  const useCustom =
    event?.ticketDesign?.mode === "custom" && Boolean(event.ticketDesign.backgroundUrl);

  if (useCustom) {
    try {
      await renderCustomTicket(ctx, input, ticketRef, qrImg);
      return canvasToBlob(canvas);
    } catch (err) {
      console.warn("Custom ticket render failed, using default", err);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
    }
  }

  await renderDefaultTicket(ctx, input, ticketRef, qrImg);
  return canvasToBlob(canvas);
}
