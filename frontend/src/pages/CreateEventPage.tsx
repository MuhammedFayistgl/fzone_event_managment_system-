import { useState, useEffect } from "react";
import { Button } from "rsuite";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import EventForm from "../components/event/EventForm";
import EventList from "../components/event/EventList";
import { createEvent, fetchCreatedEvents, updateEvent } from "../redux/EventThunks";
import { eventSchema } from "../validators/eventSchema";
import { normalizeZodErrors } from "../util/erorrNormalizer";
import toast from "react-hot-toast";

export default function CreateEventPage() {
  const dispatch = useAppDispatch();

  const form = useAppSelector((s) => s.event.form);
  const loading = useAppSelector((s) => s.event.loading);
  const apiError = useAppSelector((s) => s.event.error);
  const events = useAppSelector((s) => s.event.events);
  const editEventId = useAppSelector((s) => s.event.editEventId);


  const [errors, setErrors] = useState<any>({});

  // ================= LOAD EVENTS =================
  const loadEvents = () => {
    dispatch(fetchCreatedEvents(""));
  };

  useEffect(() => {
    loadEvents();
  }, [dispatch]);

  const handleSubmit = () => {
    const result = eventSchema.safeParse(form);
   
if (!result.success) {
  const formatted = normalizeZodErrors(result.error);

  setErrors(formatted); // 🔥 THIS WAS MISSING

  // focus first error
  const firstError = result.error.issues[0];
  if (firstError?.path?.length) {
    const field = firstError.path.join(".");
    const el = document.querySelector(`[name="${field}"]`);
    if (el) (el as HTMLElement).focus();
  }

  toast.error("Please fix the errors in the form");

  return; // 🔥 VERY IMPORTANT (stop submit)
}

    setErrors({});

    if (editEventId) {
      // ✅ UPDATE MODE
      dispatch(updateEvent({ id: editEventId, data: form }))
        .then((res: any) => {
          if (res.payload?.success) {
            loadEvents();
          }
        });
    } else {
      // ✅ CREATE MODE
      dispatch(createEvent(form))
        .then((res: any) => {
          if (res.payload?.success) {
            loadEvents();
          }
        });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:p-6 bg-gray-100 min-h-screen">

      {/* LEFT - FORM */}
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow space-y-4">
        <h1 className="text-xl font-bold">Create Event</h1>

        <EventForm errors={errors} />

        {apiError && <div className="text-red-500">{apiError}</div>}

        <Button
          appearance="primary"
          loading={loading}
          onClick={handleSubmit}
          block
        >
          Publish Event
        </Button>
      </div>

      {/* RIGHT - LIST */}
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow flex flex-col">
        <h1 className="text-xl font-bold mb-4">Events</h1>

        <div >
          <EventList events={events} onRefresh={loadEvents} />
        </div>
      </div>

    </div>
  );
}