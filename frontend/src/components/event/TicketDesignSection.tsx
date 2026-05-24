import { useCallback, useRef, useState } from "react";
import { Toggle } from "rsuite";
import { Download, ImagePlus, Trash2, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { updateField } from "../../redux/EventSlice";
import {
  deleteTicketBackground,
  updateTicketDesignMode,
  uploadTicketBackground,
} from "../../redux/EventThunks";
import { downloadTicketDesignTemplate } from "../../utils/generateTicketDesignTemplate";
import { generateEntryTicketImage } from "../../utils/generateEntryTicket";
import { buildSampleTicketInput } from "../../utils/ticketPreviewHelpers";
import type { TicketTextTheme } from "../../Types/event";
import TicketDesignPreview from "./TicketDesignPreview";
import { resolveUploadUrl } from "../../utils/resolveUploadUrl";

const MIN_W = 480;
const MIN_H = 840;
const TARGET_RATIO = MIN_W / MIN_H;

function validateImageFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      reject(new Error("Use PNG, JPG, or WebP"));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error("Max file size is 3MB"));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < MIN_W || img.height < MIN_H) {
        reject(new Error(`Minimum size ${MIN_W}×${MIN_H}px (recommended 960×1680)`));
        return;
      }
      const ratio = img.width / img.height;
      if (Math.abs(ratio - TARGET_RATIO) > 0.02) {
        reject(new Error("Aspect ratio must match 480:840 ticket template"));
        return;
      }
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export default function TicketDesignSection() {
  const dispatch = useAppDispatch();
  const editEventId = useAppSelector((s) => s.event.editEventId);
  const form = useAppSelector((s) => s.event.form);
  const ticketDesign = useAppSelector((s) => s.event.form.ticketDesign);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const isCustom = ticketDesign?.mode === "custom" || Boolean(localPreview);
  const textTheme = ticketDesign?.textTheme ?? "dark";
  const hasBackground = Boolean(localPreview || ticketDesign?.backgroundUrl);
  const thumbUrl = localPreview
    || (ticketDesign?.backgroundUrl ? resolveUploadUrl(ticketDesign.backgroundUrl) : null);

  const handleToggle = async (checked: boolean) => {
    if (checked && !ticketDesign?.backgroundUrl && !localPreview) {
      toast.error("Upload a background image first");
      return;
    }

    const mode = checked ? "custom" : "default";
    dispatch(updateField({ key: "ticketDesign", value: { ...ticketDesign, mode } }));

    if (!editEventId) {
      toast.success(checked ? "Custom preview enabled" : "Using default ticket");
      return;
    }

    const res: any = await dispatch(
      updateTicketDesignMode({ eventId: editEventId, mode, textTheme: ticketDesign?.textTheme })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(checked ? "Custom ticket enabled" : "Using default ticket");
    } else {
      toast.error(res.payload || "Could not update ticket mode");
    }
  };

  const handleTextTheme = async (theme: TicketTextTheme) => {
    if (theme === textTheme) return;

    dispatch(updateField({ key: "ticketDesign", value: { ...ticketDesign, textTheme: theme } }));

    if (!editEventId) return;

    const res: any = await dispatch(
      updateTicketDesignMode({
        eventId: editEventId,
        mode: ticketDesign?.mode ?? "default",
        textTheme: theme,
      })
    );
    if (res.meta.requestStatus !== "fulfilled") {
      toast.error(res.payload || "Could not update text theme");
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      try {
        await validateImageFile(file);
      } catch (err: any) {
        toast.error(err.message || "Invalid image");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);
      dispatch(updateField({
        key: "ticketDesign",
        value: { ...ticketDesign, mode: "custom" },
      }));

      if (!editEventId) {
        toast.success("Preview ready — save event to upload to server");
        return;
      }

      setUploading(true);

      const res: any = await dispatch(
        uploadTicketBackground({
          eventId: editEventId,
          file,
          textTheme: ticketDesign?.textTheme,
        })
      );

      setUploading(false);

      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Ticket background uploaded");
        if (res.payload?.data?.backgroundUrl) {
          setLocalPreview(null);
        }
      } else {
        toast.error(res.payload || "Upload failed");
      }
    },
    [dispatch, editEventId, ticketDesign]
  );

  const openFilePicker = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = async () => {
    if (!editEventId) {
      dispatch(updateField({
        key: "ticketDesign",
        value: { mode: "default", textTheme: "dark", backgroundUrl: null },
      }));
      setLocalPreview(null);
      return;
    }

    const res: any = await dispatch(deleteTicketBackground(editEventId));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Ticket background removed");
      setLocalPreview(null);
    } else {
      toast.error(res.payload || "Could not remove background");
    }
  };

  const handleSampleTicket = async () => {
    try {
      const blob = await generateEntryTicketImage(
        buildSampleTicketInput(form, ticketDesign, localPreview)
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sample-entry-ticket.png";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Sample ticket downloaded");
    } catch {
      toast.error("Could not generate sample ticket");
    }
  };

  return (
    <div className="ticket-design">
      <p className="ticket-design__spec">
        960 × 1680 px · 2× HD · PNG/JPG/WebP · max 3MB
      </p>
      <p className="ticket-design__spec-hint">
        Top half: your design only (no auto text). Bottom half: background art — QR, guest name, and event info appear in readable boxes.
      </p>

      <div className="ticket-design__layout">
        <div className="ticket-design__controls">
          <div className="ticket-design__actions">
            <button
              type="button"
              className="ticket-design__btn ticket-design__btn--primary"
              onClick={openFilePicker}
              disabled={uploading}
            >
              <ImagePlus size={14} />
              Upload image
            </button>
            <button
              type="button"
              className="ticket-design__btn"
              onClick={() => downloadTicketDesignTemplate().catch(() => toast.error("Template failed"))}
            >
              <Download size={14} />
              Template
            </button>
            <button
              type="button"
              className="ticket-design__btn ticket-design__btn--secondary"
              onClick={() => handleSampleTicket()}
            >
              <Ticket size={14} />
              Sample download
            </button>
          </div>

          {!editEventId && (
            <p className="ticket-design__hint">
              You can pick an image for preview now. Publish or save the event to store it on the server.
            </p>
          )}

          <div
            className={`ticket-design__drop${uploading ? " ticket-design__drop--busy" : ""}${hasBackground ? " ticket-design__drop--compact" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={openFilePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onFileChange}
              disabled={uploading}
            />
            <div className="ticket-design__drop-empty">
              {thumbUrl ? (
                <img src={thumbUrl} alt="Uploaded background" className="ticket-design__thumb" />
              ) : (
                <>
                  <ImagePlus size={28} strokeWidth={1.5} />
                  <span>{uploading ? "Uploading…" : "Drop image or click to upload"}</span>
                </>
              )}
              {thumbUrl && (
                <span className="ticket-design__drop-label">
                  {uploading ? "Uploading…" : "Click to replace image"}
                </span>
              )}
            </div>
          </div>

          <div className="ticket-design__toggle-row">
            <div>
              <p className="event-form-label">Custom background</p>
              <p className="event-form-hint">
                {isCustom ? "Active on downloads" : "Default F-Zone layout"}
              </p>
            </div>
            <Toggle
              checked={isCustom}
              onChange={handleToggle}
              disabled={!ticketDesign?.backgroundUrl && !localPreview && !isCustom}
            />
          </div>

          {(hasBackground || localPreview) && (
            <div className="ticket-design__theme">
              <p className="event-form-label">Text on background</p>
              <div className="ticket-design__theme-segments" role="group" aria-label="Text theme">
                <button
                  type="button"
                  className={`ticket-design__theme-btn${textTheme === "dark" ? " ticket-design__theme-btn--active" : ""}`}
                  onClick={() => handleTextTheme("dark")}
                >
                  Dark text
                </button>
                <button
                  type="button"
                  className={`ticket-design__theme-btn${textTheme === "light" ? " ticket-design__theme-btn--active" : ""}`}
                  onClick={() => handleTextTheme("light")}
                >
                  Light text
                </button>
              </div>
            </div>
          )}

          {(hasBackground || localPreview) && (
            <button type="button" className="ticket-design__btn ticket-design__btn--danger" onClick={handleReset}>
              <Trash2 size={14} />
              Reset to default
            </button>
          )}
        </div>

        <div className="ticket-design__preview-panel">
          <TicketDesignPreview
            form={form}
            ticketDesign={ticketDesign}
            pendingBackgroundUrl={localPreview}
          />
        </div>
      </div>
    </div>
  );
}
