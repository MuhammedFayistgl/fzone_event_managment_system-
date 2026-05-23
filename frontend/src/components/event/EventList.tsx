import EventCard from "./EventCard";

export default function EventList({ events }: any) {
  return (
    <div className="space-y-4">
      {events.map((e: any) => (
        <EventCard key={e._id} event={e} />
      ))}
    </div>
  );
}