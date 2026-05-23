import { getDaysLeft, getEventStatus } from "../../util/dataHelpers";
import { closeEventRegistration, deleteEvent } from "../../redux/EventThunks";
import { useAppDispatch } from "../../hooks/hooks";
import Swal, { type SweetAlertResult } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  setFormData,
  setEditEventId
} from "../../redux/EventSlice";
import { Button } from "rsuite";

interface EventType {
  _id: string;
  title: string;
  description: string;
  locationType: "online" | "offline";
  location?: string;
  isPaid: boolean;
  price?: number;
  eventDays: any[];
  isRefundable?: boolean;
  allowGuests?: boolean;
  maxPerUser?: number;
  maxParticipants?: number;
  isRegistrationClosed: boolean;
}

export default function EventCard({
  event,
  onRefresh
}: {
  event: EventType;
  onRefresh?: () => void;
}) {
  const dispatch = useAppDispatch();
  const status = getEventStatus(event.eventDays);
  const days = getDaysLeft(event.eventDays);

  // ================= DELETE =================
  const handleDelete = async (): Promise<void> => {
    if (!event?._id) return;

    const result: SweetAlertResult = await Swal.fire({
      title: "Delete Event?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete"
    });

    if (!result.isConfirmed) return;

    const res: any = await dispatch(deleteEvent(event._id));

    if (res.payload?.success) {
      await Swal.fire("Deleted!", "Event removed", "success");
      onRefresh?.();
    }
  };

  // ================= EDIT =================
  const handleEdit = () => {
    dispatch(setFormData(event));
    dispatch(setEditEventId(event._id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 space-y-4 border border-gray-100 hover:border-blue-200">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-3">

        <div>
          <h2 className="font-bold text-lg text-gray-800 leading-snug">
            {event.title}
          </h2>

          {/* REGISTRATION */}
          {/* {event.registrationStart && event.registrationDeadline && (
            <p className="text-xs text-gray-400 mt-1">
              Registration:{" "}
              {new Date(event.registrationStart).toLocaleDateString()} →{" "}
              {new Date(event.registrationDeadline).toLocaleDateString()}
            </p>
          )} */}
        </div>

        {/* STATUS BADGE */}
        <div>
          {status === "LIVE" && (
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-600 font-semibold animate-pulse">
              🔴 LIVE
            </span>
          )}

          {status === "UPCOMING" && (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">
              ⏳ {days} days left
            </span>
          )}

          {status === "ENDED" && (
            <span className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-500 font-semibold">
              ENDED
            </span>
          )}
        </div>

      </div>

      {/* DESCRIPTION */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
        {event.description}
      </p>

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-3 text-sm">

        {/* LOCATION */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
          {event.locationType === "online" ? (
            <>
              <span>🌐</span>
              <span className="text-blue-600 font-medium">
                Online Event
              </span>
            </>
          ) : (
            <>
              <span>📍</span>
              <span className="text-gray-700 truncate">
                {event.location}
              </span>
            </>
          )}
        </div>

        {/* PRICE */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
          {event.isPaid ? (
            <>
              <span>💰</span>
              <span className="text-red-500 font-semibold">
                ₹ {event.price}
              </span>
            </>
          ) : (
            <>
              <span>🎟️</span>
              <span className="text-green-500 font-semibold">
                Free
              </span>
            </>
          )}
        </div>

        {/* GUEST */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
          <span>👥</span>
          <span>
            {event.allowGuests
              ? `Guests Allowed (${event.maxPerUser})`
              : "No Guests"}
          </span>
        </div>

        {/* REFUND */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
          <span>💸</span>
          <span>
            {event.isRefundable ? "Refundable" : "Non Refundable"}
          </span>
        </div>

      </div>

      {/* EVENT DAYS */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs text-gray-600">
        <div className="font-semibold text-gray-700 mb-1">
          📅 Event Schedule
        </div>

        {event.eventDays?.map((day: any, i: number) => (
          <div key={i} className="flex justify-between">
            <span>
              {new Date(day.date).toLocaleDateString()}
            </span>
            <span>
              {new Date(day.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" - "}
              {new Date(day.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="pt-2 space-y-2">

        <div className="flex justify-between items-center">

          <span className="text-xs text-gray-400">
            {event.eventDays?.length} day event
          </span>

          <button
            className="text-xs px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/event/${event._id}`
              )
            }
          >
            Copy Link
          </button>

          {/* ACTIONS */}
          <div className="flex gap-2">

            <button
              className="text-xs px-3 py-1 rounded-md bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
              onClick={handleEdit}
            >
              Edit
            </button>

            <button
              className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition"
              onClick={handleDelete}
            >
              Delete
            </button>
            <Button
              size="xs"
              color="red"
              appearance="ghost"
              disabled={event.isRegistrationClosed}
              onClick={() => dispatch(closeEventRegistration(event._id))}
            >
              {event.isRegistrationClosed ? "Closed" : "Close Registration"}
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}