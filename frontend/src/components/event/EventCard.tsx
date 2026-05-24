import {
  CalendarDays,
  Clock,
  Globe,
  MapPin,
  Users,
  Wallet,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
  Lock,
  Ticket,
} from "lucide-react";
import { getDaysLeft, getEventStatus } from "../../util/dataHelpers";
import { closeEventRegistration, deleteEvent } from "../../redux/EventThunks";
import { useAppDispatch } from "../../hooks/hooks";
import Swal, { type SweetAlertResult } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { setFormData, setEditEventId } from "../../redux/EventSlice";
import { Button } from "rsuite";
import toast from "react-hot-toast";
import { formatEventPricingLabel } from "../../utils/pricing";

interface EventType {
  _id: string;
  title: string;
  description: string;
  locationType: "online" | "offline";
  location?: string;
  isPaid: boolean;
  price?: number;
  investorIsFree?: boolean;
  investorPrice?: number;
  guestPaymentEnabled?: boolean;
  guestPrice?: number;
  freeGuestCount?: number;
  eventDays: any[];
  isRefundable?: boolean;
  allowGuests?: boolean;
  maxPerUser?: number;
  maxParticipants?: number;
  isRegistrationClosed: boolean;
  ticketDesign?: { mode?: string; backgroundUrl?: string | null };
  registrationStart?: string;
  registrationDeadline?: string;
  createdAt?: string;
}

const swalDark = {
  background: "#0f1117",
  color: "#e4e4e7",
  confirmButtonColor: "#22d3ee",
  cancelButtonColor: "#3f3f46",
};

export default function EventCard({
  event,
  onRefresh,
}: {
  event: EventType;
  onRefresh?: () => void;
}) {
  const dispatch = useAppDispatch();
  const status = getEventStatus(event.eventDays);
  const days = getDaysLeft(event.eventDays);
  const publicUrl = `${window.location.origin}/event/${event._id}`;

  const handleDelete = async (): Promise<void> => {
    if (!event?._id) return;

    const result: SweetAlertResult = await Swal.fire({
      title: "Delete Event?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      ...swalDark,
    });

    if (!result.isConfirmed) return;

    const res: any = await dispatch(deleteEvent(event._id));

    if (res.payload?.success) {
      toast.success("Event deleted");
      onRefresh?.();
    }
  };

  const handleEdit = () => {
    dispatch(setFormData(event));
    dispatch(setEditEventId(event._id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Registration link copied");
  };

  return (
    <div className="app-card-raised hover:shadow-app-card transition-all duration-300 p-5 space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-app-text leading-snug truncate">{event.title}</h2>
          {event.registrationStart && event.registrationDeadline && (
            <p className="text-xs text-app-muted mt-1">
              Reg: {new Date(event.registrationStart).toLocaleDateString()} →{" "}
              {new Date(event.registrationDeadline).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {status === "LIVE" && (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
              Live
            </span>
          )}
          {status === "UPCOMING" && (
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">
              {days} days left
            </span>
          )}
          {status === "ENDED" && (
            <span className="text-xs px-3 py-1 rounded-full bg-app-surface-muted text-app-muted border border-app-border font-semibold">
              Ended
            </span>
          )}
          {event.isRegistrationClosed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 inline-flex items-center gap-1">
              <Lock size={11} /> Closed
            </span>
          )}
          {event.ticketDesign?.mode === "custom" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 inline-flex items-center gap-1">
              <Ticket size={11} /> Custom ticket
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-app-secondary leading-relaxed line-clamp-2">{event.description}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 bg-app-surface-muted px-3 py-2 rounded-lg border border-app-border min-w-0">
          {event.locationType === "online" ? (
            <>
              <Globe size={14} className="text-cyan-400 shrink-0" />
              <span className="text-cyan-400 font-medium truncate">Online</span>
            </>
          ) : (
            <>
              <MapPin size={14} className="text-cyan-400 shrink-0" />
              <span className="text-app-text truncate">{event.location}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 bg-app-surface-muted px-3 py-2 rounded-lg border border-app-border">
          <Wallet size={14} className="shrink-0 text-app-muted" />
          <span className="text-emerald-400 font-semibold text-sm">{formatEventPricingLabel(event)}</span>
        </div>
        <div className="flex items-center gap-2 bg-app-surface-muted px-3 py-2 rounded-lg border border-app-border">
          <Users size={14} className="shrink-0 text-app-muted" />
          <span className="truncate">
            {event.allowGuests ? `Guests (${event.maxPerUser})` : "No guests"}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-app-surface-muted px-3 py-2 rounded-lg border border-app-border">
          <Users size={14} className="shrink-0 text-app-muted" />
          <span>{event.maxParticipants ? `Cap ${event.maxParticipants}` : "Unlimited"}</span>
        </div>
      </div>

      <div className="app-card-muted p-3 space-y-1 text-xs text-app-secondary">
        <div className="font-semibold text-app-text mb-1 inline-flex items-center gap-1">
          <CalendarDays size={13} /> Schedule
        </div>
        {event.eventDays?.map((day: any, i: number) => (
          <div key={i} className="flex justify-between gap-2">
            <span>{new Date(day.date).toLocaleDateString()}</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {new Date(day.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(day.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className="event-card-action" onClick={copyLink}>
          <Link2 size={13} /> Copy link
        </button>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="event-card-action">
          <ExternalLink size={13} /> View public
        </a>
        <button type="button" className="event-card-action event-card-action--edit" onClick={handleEdit}>
          <Pencil size={13} /> Edit
        </button>
        <button type="button" className="event-card-action event-card-action--danger" onClick={handleDelete}>
          <Trash2 size={13} /> Delete
        </button>
        <Button
          size="xs"
          appearance="ghost"
          disabled={event.isRegistrationClosed}
          onClick={() => dispatch(closeEventRegistration(event._id))}
        >
          {event.isRegistrationClosed ? "Registration closed" : "Close registration"}
        </Button>
      </div>
    </div>
  );
}
