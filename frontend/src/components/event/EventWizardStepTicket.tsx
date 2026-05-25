import { Ticket } from "lucide-react";
import { useAppSelector } from "../../hooks/hooks";
import TicketDesignSection from "./TicketDesignSection";

export default function EventWizardStepTicket() {
  const editEventId = useAppSelector((s) => s.event.editEventId);

  return (
    <div className="event-wizard-step space-y-4">
      <p className="event-wizard-step__intro">
        Customize the entry pass appearance. Attendees receive this after registration.
      </p>
      {!editEventId && (
        <div className="event-wizard-ticket-notice" role="status">
          <Ticket size={16} aria-hidden />
          <div>
            <p className="event-wizard-ticket-notice__title">Publish first to upload custom art</p>
            <p className="event-wizard-ticket-notice__text">
              Use the default ticket for now, or publish the event to unlock background upload and preview.
            </p>
          </div>
        </div>
      )}
      <div id="ticket-design">
        <TicketDesignSection />
      </div>
    </div>
  );
}
