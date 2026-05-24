const W = 960;
const H = 1680;
const DPI = 96;

function pxToCm(px: number): string {
  return ((px / DPI) * 2.54).toFixed(1);
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

function drawDimensionMarkers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.setLineDash([]);

  const wCm = pxToCm(w);
  const hCm = pxToCm(h);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 16, y + 28);
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(`${w} × ${h} px`, x + 16, y + 52);
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(`${wCm} × ${hCm} cm`, x + 16, y + 74);

  ctx.textAlign = "right";
  ctx.font = "500 11px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`${w}×${h}px`, x + w - 14, y + h - 14);
}

function drawQrGuide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.strokeStyle = "rgba(239, 68, 68, 0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, x, y, size, size, 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#dc2626";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QR — white frame added", x + size / 2, y + size / 2 - 8);
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText("Keep area clear", x + size / 2, y + size / 2 + 12);
}

function drawBoxGuide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.strokeStyle = "rgba(37, 99, 235, 0.45)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#2563eb";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export async function generateTicketDesignTemplate(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const pad = 48;
  const innerX = pad + 20;
  const innerW = W - (pad + 20) * 2;
  const splitY = pad + (H - pad * 2) / 2;
  const topH = splitY - pad - 20;
  const bottomY = splitY + 20;
  const bottomH = H - pad - bottomY - 20;

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 24);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("F-Zone Ticket Design Guide", W / 2, 88);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillText("Empty zones · design in Canva · export 960×1680 PNG", W / 2, 118);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(pad + 16, splitY);
  ctx.lineTo(W - pad - 16, splitY);
  ctx.stroke();
  ctx.setLineDash([]);

  drawDimensionMarkers(
    ctx,
    innerX,
    pad + 20,
    innerW,
    topH,
    "TOP HALF — your full design (no auto text)"
  );
  drawDimensionMarkers(
    ctx,
    innerX,
    bottomY,
    innerW,
    bottomH,
    "BOTTOM HALF — background art (system adds boxes)"
  );

  const qrFrame = 384;
  const qrY = bottomY + 16;
  drawQrGuide(ctx, (W - qrFrame) / 2, qrY, qrFrame);

  const boxW = innerW - 32;
  const boxX = innerX + 16;
  const guestY = qrY + qrFrame + 20;
  drawBoxGuide(ctx, boxX, guestY, boxW, 92, "Guest name — auto box");
  const eventY = guestY + 108;
  drawBoxGuide(ctx, boxX, eventY, boxW, 152, "Event details — auto box");

  ctx.fillStyle = "#64748b";
  ctx.font = "500 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Full canvas 960 × 1680 px · 25.4 × 44.5 cm · PNG/JPG/WebP", W / 2, H - 48);
  ctx.fillText("Upload finished design below in admin panel", W / 2, H - 28);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate template"));
      },
      "image/png",
      1
    );
  });
}

export function downloadTicketDesignTemplate() {
  return generateTicketDesignTemplate().then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fzone-ticket-template-960x1680.png";
    a.click();
    URL.revokeObjectURL(url);
  });
}
