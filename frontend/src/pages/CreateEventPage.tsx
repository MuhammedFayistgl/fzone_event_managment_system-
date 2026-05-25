import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import EventForm from "../components/event/EventForm";
import EventList from "../components/event/EventList";
import { createEvent, fetchCreatedEvents, updateEvent } from "../redux/EventThunks";
import { resetForm, setEditEventId, setFormData } from "../redux/EventSlice";
import { eventSchema } from "../validators/eventSchema";
import { normalizeZodErrors } from "../util/erorrNormalizer";
import { getStepIndexForFieldPath } from "../components/event/eventWizardConfig";
import toast from "react-hot-toast";
import AppPageLayout from "../layouts/AppPageLayout";

function countErrors(obj: Record<string, any>): number {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (typeof v === "string" && v) n += 1;
    else if (Array.isArray(v)) n += v.filter(Boolean).length;
    else if (v && typeof v === "object") n += countErrors(v);
  }
  return n;
}

export default function CreateEventPage() {
  const dispatch = useAppDispatch();

  const form = useAppSelector((s) => s.event.form);
  const loading = useAppSelector((s) => s.event.loading);
  const apiError = useAppSelector((s) => s.event.error);
  const events = useAppSelector((s) => s.event.events);
  const editEventId = useAppSelector((s) => s.event.editEventId);

  const [errors, setErrors] = useState<Record<string, any>>({});
  const [formResetKey, setFormResetKey] = useState(0);
  const [targetStepIndex, setTargetStepIndex] = useState<number | null>(null);

  const loadEvents = () => {
    dispatch(fetchCreatedEvents(""));
  };

  useEffect(() => {
    loadEvents();
  }, [dispatch]);

  const handleCancelEdit = () => {
    if (form.title?.trim() && !window.confirm("Discard unsaved changes?")) return;
    dispatch(resetForm());
    setErrors({});
    setFormResetKey((k) => k + 1);
  };

  const handleClearForm = () => {
    if (form.title?.trim() && !window.confirm("Clear the form?")) return;
    dispatch(resetForm());
    setErrors({});
    setFormResetKey((k) => k + 1);
  };

  const handleSubmit = () => {
    const result = eventSchema.safeParse(form);

    if (!result.success) {
      const formatted = normalizeZodErrors(result.error);
      setErrors(formatted);

      const firstError = result.error.issues[0];
      if (firstError?.path?.length) {
        const field = firstError.path.map(String).join(".");
        setTargetStepIndex(getStepIndexForFieldPath(field));
        const el = document.querySelector(`[name="${field}"]`);
        if (el) (el as HTMLElement).focus();
      }

      toast.error("Please fix the errors in the form");
      return;
    }

    setErrors({});

    if (editEventId) {
      dispatch(updateEvent({ id: editEventId, data: form })).then((res: any) => {
        if (res.payload?.success) {
          toast.success("Event updated successfully");
          dispatch(resetForm());
          setFormResetKey((k) => k + 1);
          loadEvents();
        } else if (res.payload) {
          toast.error(typeof res.payload === "string" ? res.payload : "Update failed");
        }
      });
    } else {
      dispatch(createEvent(form)).then((res: any) => {
        if (res.payload?.success) {
          const newId = res.payload?.data?._id;
          toast.success(
            newId
              ? "Event published — customize ticket design in the Ticket step"
              : "Event published successfully"
          );
          if (newId) {
            dispatch(setEditEventId(newId));
            dispatch(setFormData({ ...form, ticketDesign: form.ticketDesign }));
            setTargetStepIndex(3);
          } else {
            dispatch(resetForm());
            setFormResetKey((k) => k + 1);
          }
          loadEvents();
        } else if (res.payload) {
          toast.error(typeof res.payload === "string" ? res.payload : "Create failed");
        }
      });
    }
  };

  const errorCount = countErrors(errors);

  return (
    <AppPageLayout
      eyebrow="Event Studio"
      title="Create & Manage Events"
      subtitle="Build events, set registration rules, and manage your event catalog in one place."
      embedded
      showGlow
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="event-form-top" className="space-y-4">
          {editEventId && (
            <div className="event-edit-banner">
              <span>
                Editing: <strong>{form.title || "Event"}</strong>
              </span>
              <button type="button" onClick={handleCancelEdit} className="event-edit-banner__cancel">
                <X size={16} /> Cancel edit
              </button>
            </div>
          )}

          <div className="app-card-raised event-wizard-card p-4 lg:p-5">
            {errorCount > 0 && (
              <div className="event-error-summary mb-3" role="alert">
                <AlertCircle size={18} />
                <span>
                  {errorCount} field{errorCount !== 1 ? "s need" : " needs"} attention — check the highlighted step.
                </span>
              </div>
            )}

            <EventForm
              errors={errors}
              formResetKey={formResetKey}
              loading={loading}
              editEventId={editEventId}
              targetStepIndex={targetStepIndex}
              onStepSynced={() => setTargetStepIndex(null)}
              onSubmit={handleSubmit}
              onClear={handleClearForm}
              onCancelEdit={handleCancelEdit}
            />

            {apiError && <div className="text-red-400 text-sm mt-3">{apiError}</div>}
          </div>
        </div>

        <div className="app-card-raised p-4 lg:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xl font-bold text-app-text">Your Events</h2>
              <p className="text-xs text-app-muted mt-1">{events.length} total</p>
            </div>
          </div>
          <EventList events={events} onRefresh={loadEvents} />
        </div>
      </div>
    </AppPageLayout>
  );
}
