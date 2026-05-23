import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EventRegistrationPanel from "./EventRegistrationPanel";
import AppPageLayout from "../../layouts/AppPageLayout";

const EventAttendanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <AppPageLayout showGlow embedded className="!overflow-visible">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-app-cyan hover:opacity-80 mb-4 transition"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <EventRegistrationPanel eventId={id} variant="full" />
    </AppPageLayout>
  );
};

export default EventAttendanceDetails;
