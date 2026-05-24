import { useEffect, useRef, useState } from "react";
import type { TicketDesign } from "../../Types/event";
import { generateEntryTicketImage } from "../../utils/generateEntryTicket";
import { buildSampleTicketInput } from "../../utils/ticketPreviewHelpers";

type PreviewFormSlice = {
  title?: string;
  description?: string;
  eventDays?: Parameters<typeof buildSampleTicketInput>[0]["eventDays"];
  location?: string;
  locationType?: Parameters<typeof buildSampleTicketInput>[0]["locationType"];
};

type Props = {
  form: PreviewFormSlice;
  ticketDesign: TicketDesign | undefined;
  pendingBackgroundUrl?: string | null;
};

export default function TicketDesignPreview({
  form,
  ticketDesign,
  pendingBackgroundUrl,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const objectUrlRef = useRef<string | null>(null);

  const isCustom = Boolean(
    (pendingBackgroundUrl || ticketDesign?.backgroundUrl)
    && (ticketDesign?.mode === "custom" || pendingBackgroundUrl)
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const blob = await generateEntryTicketImage(
          buildSampleTicketInput(form, ticketDesign, pendingBackgroundUrl)
        );
        if (cancelled) return;

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    form.title,
    form.description,
    form.location,
    form.locationType,
    form.eventDays,
    ticketDesign?.mode,
    ticketDesign?.backgroundUrl,
    ticketDesign?.textTheme,
    pendingBackgroundUrl,
  ]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="ticket-design-preview">
      <div className="ticket-design-preview__head">
        <span className="ticket-design-preview__label">Live preview</span>
        <span
          className={`ticket-design-preview__badge${
            isCustom ? " ticket-design-preview__badge--custom" : ""
          }`}
        >
          {isCustom ? "Custom" : "Default"}
        </span>
      </div>

      <div className="ticket-design-preview__frame">
        {loading && (
          <div className="ticket-design-preview__skeleton" aria-hidden />
        )}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Ticket preview"
            className={`ticket-design-preview__img${loading ? " ticket-design-preview__img--hidden" : ""}`}
          />
        )}
        {!loading && !previewUrl && (
          <p className="ticket-design-preview__fallback">Preview unavailable</p>
        )}
      </div>
    </div>
  );
}
