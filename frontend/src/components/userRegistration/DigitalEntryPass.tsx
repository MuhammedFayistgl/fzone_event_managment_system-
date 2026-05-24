import { useCallback, useState } from "react";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Download,
  Lock,
  ShieldOff,
  Hash,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "../../hooks/hooks";
import { useLivePassSync } from "../../hooks/useLivePassSync";
import GenderBadge from "../common/GenderBadge";
import type { EventResponseType } from "../../Types/event";
import type { PassType } from "../../Types/eventExtendedTypes";
import {
  entryTicketFilename,
  generateEntryTicketImage,
  type EntryTicketInput,
  type GuestTicketInfo,
  type InvestorTicketInfo,
} from "../../utils/generateEntryTicket";

type Props = {
  event?: EventResponseType | null;
};

function truncateToken(token: string, start = 8, end = 6): string {
  if (!token || token.length <= start + end + 3) return token;
  return `${token.slice(0, start)}…${token.slice(-end)}`;
}

type PassCardProps = {
  passType: PassType;
  event?: EventResponseType | null;
  investor: InvestorTicketInfo;
  guest?: GuestTicketInfo;
  qrCodeImage?: string;
  qrToken?: string;
  checkedIn: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
};

function PassCard({
  passType,
  event,
  investor,
  guest,
  qrCodeImage,
  qrToken,
  checkedIn,
  isBlocked = false,
  blockedReason = "",
}: PassCardProps) {
  const [downloading, setDownloading] = useState(false);
  const isGuest = passType === "guest";
  const hasQr = Boolean(qrCodeImage);

  const holderName = isGuest ? guest?.name || "Guest" : investor?.Name || "Investor";
  const initial = holderName.charAt(0)?.toUpperCase() || "?";

  const status: "checkedIn" | "registered" | "verified" | "blocked" = checkedIn
    ? "checkedIn"
    : isBlocked
      ? "blocked"
      : hasQr
        ? "registered"
        : "verified";

  const handleCopyToken = useCallback(async () => {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
      toast.success("Token copied");
    } catch {
      toast.error("Could not copy token");
    }
  }, [qrToken]);

  const handleDownloadTicket = useCallback(async () => {
    if (!qrCodeImage || downloading) return;

    setDownloading(true);
    try {
      const ticketInput: EntryTicketInput = {
        event,
        investor,
        qrCodeImage,
        qrToken,
        checkedIn,
        passType,
        guest: isGuest ? guest : undefined,
        linkedInvestor: isGuest ? investor : undefined,
      };

      const blob = await generateEntryTicketImage(ticketInput);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = entryTicketFilename(event?.title, investor?.No, {
        passType,
        guestName: guest?.name,
      });
      link.click();
      URL.revokeObjectURL(url);
      toast.success(isGuest ? "Guest ticket downloaded" : "Ticket downloaded");
    } catch {
      toast.error("Could not generate ticket");
    } finally {
      setDownloading(false);
    }
  }, [checkedIn, downloading, event, guest, investor, isGuest, passType, qrCodeImage, qrToken]);

  return (
    <article
      className={`event-register-pass pro-animate-in event-register-pass--${status} event-register-pass--${passType}${
        isBlocked ? " event-register-pass--blocked" : ""
      }`}
    >
      <div className="event-register-pass__glow" aria-hidden />

      <header className="event-register-pass__head">
        <div className="event-register-pass__head-main min-w-0">
          <p className="event-register-pass__eyebrow">
            {isGuest ? "Guest entry pass" : "Investor entry pass"}
          </p>
          {event?.title && (
            <h3 className="event-register-pass__event-title">{event.title}</h3>
          )}
        </div>
        <span className={`event-register-pass__status event-register-pass__status--${status}`}>
          {status === "checkedIn" && (
            <>
              <Lock size={12} aria-hidden />
              Checked in
            </>
          )}
          {status === "registered" && (
            <>
              <QrCode size={12} aria-hidden />
              {isGuest ? "Guest pass" : "Entry pass"}
            </>
          )}
          {status === "blocked" && (
            <>
              <ShieldOff size={12} aria-hidden />
              Entry blocked
            </>
          )}
          {status === "verified" && (
            <>
              <ShieldCheck size={12} aria-hidden />
              Pending
            </>
          )}
        </span>
      </header>

      <div className="event-register-pass__body">
        <section className="event-register-pass__profile">
          <div className="event-register-pass__identity">
            <div className="event-register-pass__avatar" aria-hidden>
              {initial}
            </div>
            <div className="event-register-pass__identity-text min-w-0">
              <h4 className="event-register-pass__name">{holderName}</h4>
              <div className="event-register-pass__badges">
                {isGuest ? (
                  <>
                    {guest?.type && (
                      <span className="event-register-pass__id capitalize">{guest.type}</span>
                    )}
                    {guest?.gender && <GenderBadge gender={guest.gender} size="sm" />}
                  </>
                ) : (
                  <>
                    <span className="event-register-pass__id">ID {investor?.No}</span>
                    {investor?.Gender && (
                      <GenderBadge gender={investor.Gender} size="sm" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {isGuest && (
            <p className="event-register-pass__guest-of">
              Guest of {investor?.Name}
              {investor?.No != null ? ` · ID ${investor.No}` : ""}
            </p>
          )}

          <div className="event-register-pass__facts">
            {isGuest ? (
              <>
                {guest?.phone && (
                  <div className="event-register-pass__fact">
                    <Phone size={13} aria-hidden />
                    <span className="event-register-pass__fact-label">Phone</span>
                    <span className="event-register-pass__fact-value">{guest.phone}</span>
                  </div>
                )}
                <div className="event-register-pass__fact event-register-pass__fact--accent">
                  <Users size={13} aria-hidden />
                  <span className="event-register-pass__fact-label">Role</span>
                  <span className="event-register-pass__fact-value">Guest</span>
                </div>
              </>
            ) : (
              <>
                <div className="event-register-pass__fact">
                  <Hash size={13} aria-hidden />
                  <span className="event-register-pass__fact-label">Code</span>
                  <span className="event-register-pass__fact-value">{investor?.Code_No}</span>
                </div>
                <div className="event-register-pass__fact">
                  <Phone size={13} aria-hidden />
                  <span className="event-register-pass__fact-label">Phone</span>
                  <span className="event-register-pass__fact-value">{investor?.Phone_No}</span>
                </div>
                <div className="event-register-pass__fact event-register-pass__fact--accent">
                  <UserRound size={13} aria-hidden />
                  <span className="event-register-pass__fact-label">Role</span>
                  <span className="event-register-pass__fact-value">Investor</span>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="event-register-pass__divider" aria-hidden />

        <section className="event-register-pass__qr-zone">
          {isBlocked && hasQr && (
            <p className="event-register-pass__blocked-note">
              {blockedReason ||
                "This pass is blocked due to insufficient payment balance after a refund."}
            </p>
          )}
          {hasQr ? (
            <>
              <div
                className={`event-register-pass__qr-frame${
                  checkedIn ? " event-register-pass__qr-frame--locked" : ""
                }${isBlocked ? " event-register-pass__qr-frame--blocked" : ""}`}
              >
                <img
                  src={qrCodeImage}
                  alt={`${isGuest ? "Guest" : "Investor"} entry QR code`}
                  className="event-register-pass__qr-img"
                />
                {checkedIn && (
                  <div className="event-register-pass__qr-lock">
                    <Lock size={22} aria-hidden />
                    <span>Pass used</span>
                  </div>
                )}
                {isBlocked && !checkedIn && (
                  <div className="event-register-pass__qr-lock">
                    <ShieldOff size={22} aria-hidden />
                    <span>Blocked</span>
                  </div>
                )}
              </div>

              <div className="event-register-pass__token-row">
                {qrToken ? (
                  <div className="event-register-pass__token-text min-w-0">
                    <span className="event-register-pass__token-label">Token</span>
                    <code className="event-register-pass__token-value">
                      {truncateToken(qrToken)}
                    </code>
                  </div>
                ) : (
                  <div className="event-register-pass__token-text min-w-0" />
                )}
                <div className="event-register-pass__token-actions">
                  {qrToken && (
                    <button
                      type="button"
                      className="event-register-pass__action-btn"
                      onClick={handleCopyToken}
                      title="Copy token"
                    >
                      <Copy size={14} aria-hidden />
                      Copy
                    </button>
                  )}
                  <button
                    type="button"
                    className="event-register-pass__action-btn"
                    onClick={handleDownloadTicket}
                    disabled={downloading}
                    title="Download ticket"
                  >
                    <Download size={14} aria-hidden />
                    {downloading ? "Saving…" : "Download ticket"}
                  </button>
                </div>
              </div>

              {checkedIn && (
                <p className="event-register-pass__checked-note">
                  Check-in completed — this pass has already been scanned.
                </p>
              )}
            </>
          ) : (
            <div className="event-register-pass__placeholder">
              <div className="event-register-pass__placeholder-icon">
                <QrCode size={32} strokeWidth={1.5} aria-hidden />
              </div>
              <p className="event-register-pass__placeholder-title">Pass not issued yet</p>
              <p className="event-register-pass__placeholder-desc">
                Complete registration to unlock this entry QR code.
              </p>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

export default function DigitalEntryPass({ event }: Props) {
  const investor = useAppSelector((s: any) => s.eventRegistor?.data?.investor || {});
  const registration = useAppSelector((s: any) => s.eventRegistor?.data?.registration || {});
  const participants = registration?.participants || [];

  const passPhone = String(registration?.phone || investor?.Phone_No || "").replace(/\D/g, "");

  useLivePassSync({
    eventId: event?._id,
    phone: passPhone,
    enabled: Boolean(event?._id && passPhone && (registration?.qrToken || participants.length > 0)),
  });

  const investorTicketInfo: InvestorTicketInfo = {
    Name: investor?.Name,
    No: investor?.No,
    Code_No: investor?.Code_No,
    Phone_No: investor?.Phone_No,
    Gender: investor?.Gender,
  };

  return (
    <div className="event-register-pass-list">
      <PassCard
        passType="investor"
        event={event}
        investor={investorTicketInfo}
        qrCodeImage={registration?.qrCodeImage}
        qrToken={registration?.qrToken}
        checkedIn={Boolean(registration?.isCheckedIn)}
        isBlocked={Boolean(registration?.isBlocked)}
        blockedReason={registration?.blockedReason || ""}
      />

      {participants.map((p: any, index: number) => (
        <PassCard
          key={p._id || `${p.name}-${index}`}
          passType="guest"
          event={event}
          investor={investorTicketInfo}
          guest={{
            name: p.name,
            type: p.type,
            gender: p.gender,
            phone: p.phone,
          }}
          qrCodeImage={p.qrCodeImage}
          qrToken={p.qrToken}
          checkedIn={Boolean(p.isCheckedIn)}
          isBlocked={Boolean(p.isBlocked)}
          blockedReason={p.blockedReason || ""}
        />
      ))}
    </div>
  );
}
