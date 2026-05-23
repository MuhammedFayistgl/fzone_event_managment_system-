import { useState, useEffect } from "react";
import { Button } from "rsuite";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import EventForm from "../components/event/EventForm";
import EventList from "../components/event/EventList";
import { createEvent, fetchCreatedEvents, updateEvent } from "../redux/EventThunks";
import { eventSchema } from "../validators/eventSchema";
import { normalizeZodErrors } from "../util/erorrNormalizer";
import toast from "react-hot-toast";
import AppPageLayout from "../layouts/AppPageLayout";

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
    <AppPageLayout title="Event Management" embedded showGlow={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card p-4 lg:p-6 space-y-4">
          <h2 className="text-xl font-bold text-app-text">Create Event</h2>
          <EventForm errors={errors} />
          {apiError && <div className="text-red-500">{apiError}</div>}
          <Button appearance="primary" loading={loading} onClick={handleSubmit} block>
            Publish Event
          </Button>
        </div>
        <div className="app-card p-4 lg:p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-app-text">Events</h2>
          <EventList events={events} onRefresh={loadEvents} />
        </div>
      </div>
    </AppPageLayout>
  );
}