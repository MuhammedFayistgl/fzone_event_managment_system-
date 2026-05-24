import { useMemo, useState } from "react";
import { Input, InputGroup } from "rsuite";
import { Search, CalendarX2 } from "lucide-react";
import EventCard from "./EventCard";
import { getEventStatus } from "../../util/dataHelpers";

type SortKey = "newest" | "date" | "title";
type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "ENDED";

type Props = {
  events: any[];
  onRefresh?: () => void;
};

export default function EventList({ events, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...events];

    if (q) {
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((e) => getEventStatus(e.eventDays) === statusFilter);
    }

    list.sort((a, b) => {
      if (sortKey === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortKey === "date") {
        const ad = a.eventDays?.[0]?.date ? new Date(a.eventDays[0].date).getTime() : 0;
        const bd = b.eventDays?.[0]?.date ? new Date(b.eventDays[0].date).getTime() : 0;
        return ad - bd;
      }
      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bc - ac;
    });

    return list;
  }, [events, search, statusFilter, sortKey]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "UPCOMING", label: "Upcoming" },
    { key: "LIVE", label: "Live" },
    { key: "ENDED", label: "Past" },
  ];

  return (
    <div className="events-panel">
      <div className="events-panel-toolbar">
        <InputGroup inside className="events-panel-search pro-search-input">
          <Input placeholder="Search events..." value={search} onChange={setSearch} />
          <InputGroup.Addon>
            <Search size={16} />
          </InputGroup.Addon>
        </InputGroup>

        <div className="events-dashboard-tabs events-panel-tabs">
          {statusTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`events-dashboard-tab${statusFilter === key ? " events-dashboard-tab--active" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className="events-panel-sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort events"
        >
          <option value="newest">Newest created</option>
          <option value="date">Event date</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <div className="events-panel-list custom-scroll">
        {filtered.length === 0 ? (
          <div className="events-empty-state">
            <div className="events-empty-state__icon">
              <CalendarX2 size={32} />
            </div>
            <h3 className="events-empty-state__title">
              {events.length === 0 ? "No events yet" : "No matching events"}
            </h3>
            <p className="events-empty-state__desc">
              {events.length === 0
                ? "Create your first event using the form on the left."
                : "Try a different search or filter."}
            </p>
            {events.length === 0 && (
              <div className="events-empty-state__actions">
                <a href="#event-form-top" className="events-empty-state__cta">
                  Create Event
                </a>
              </div>
            )}
          </div>
        ) : (
          filtered.map((e) => <EventCard key={e._id} event={e} onRefresh={onRefresh} />)
        )}
      </div>

      {events.length > 0 && (
        <p className="events-panel-count text-xs text-app-muted mt-3">
          Showing {filtered.length} of {events.length} events
        </p>
      )}
    </div>
  );
}
