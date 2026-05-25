import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EventRegistrationPanel from "./EventRegistrationPanel";
import AppPageLayout from "../../layouts/AppPageLayout";

const EventAttendanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <AppPageLayout showGlow={false} embedded>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-app-cyan hover:opacity-80 mb-4 transition"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="event-attendance-page">
        <EventRegistrationPanel eventId={id} variant="full" />
      </div>
    </AppPageLayout>
  );
};

export default EventAttendanceDetails;
