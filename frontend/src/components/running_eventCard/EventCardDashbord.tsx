import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";
import { useDispatch } from "react-redux";
import { fetchRunningEvents } from "../../redux/Thunks/RunningEventThunk";
import { CalendarDays, MapPin, Users, Clock, CalendarX2, Radio, History } from "lucide-react";
import type { RunningEventType } from "../../Types/eventExtendedTypes";
import { formatEventPricingLabel } from "../../utils/pricing";

type EventTab = "upcoming" | "running" | "past";

const TAB_CONFIG: {
    key: EventTab;
    label: string;
    countKey: "upcoming" | "running" | "past";
    icon: React.ElementType;
}[] = [
    { key: "upcoming", label: "Upcoming", countKey: "upcoming", icon: CalendarDays },
    { key: "running", label: "Live", countKey: "running", icon: Radio },
    { key: "past", label: "Past", countKey: "past", icon: History },
];

const EMPTY_COPY: Record<
    EventTab,
    { title: string; description: string; secondaryLabel: string; secondaryPath: string }
> = {
    upcoming: {
        title: "No upcoming events",
        description: "Schedule your next event to start accepting registrations.",
        secondaryLabel: "View attendance logs",
        secondaryPath: "/attendance-logs",
    },
    running: {
        title: "No live events right now",
        description: "Events happening today will appear here.",
        secondaryLabel: "View all registrations",
        secondaryPath: "/allregistrations",
    },
    past: {
        title: "No past events yet",
        description: "Completed events and their registration history will show here.",
        secondaryLabel: "Create your first event",
        secondaryPath: "/event",
    },
};

function resolveDefaultTab(counts: { upcoming: number; running: number; past: number }): EventTab {
    if (counts.running > 0) return "running";
    if (counts.upcoming > 0) return "upcoming";
    return "past";
}

function StatusBadge({ event }: { event: RunningEventType }) {
    if (event.status === "running") {
        return (
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-400">
                Live
            </span>
        );
    }
    if (event.status === "upcoming") {
        return (
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-400">
                {event.daysLeft > 0 ? `${event.daysLeft} days left` : "Starts today"}
            </span>
        );
    }
    return (
        <span className="text-xs px-3 py-1 rounded-full font-medium bg-app-surface-muted text-app-muted border border-app-border">
            Ended
        </span>
    );
}

function EventCard({ event, onOpen }: { event: RunningEventType; onOpen: (id: string) => void }) {
    const startDate = new Date(event.startTime);

    return (
        <motion.div
            key={event._id}
            onClick={() => onOpen(event._id)}
            className="relative min-w-[320px] rounded-2xl p-5 app-card shadow-md hover:shadow-sm transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-blue-500/10 to-indigo-500/10" />

            <div className="flex justify-between items-start relative z-10 gap-3">
                <h3 className="text-md font-semibold text-app-text line-clamp-2">{event.title}</h3>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge event={event} />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-surface-muted text-app-muted border border-app-border whitespace-nowrap">
                        {formatEventPricingLabel(event)}
                    </span>
                </div>
            </div>

            <p className="text-xs text-app-muted mt-1 line-clamp-2 relative z-10">{event.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-app-muted relative z-10">
                <div className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={14} />
                    {event.totalRegistrations} joined
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <div className="w-full h-2 bg-app-surface-muted rounded-full overflow-hidden border border-app-border">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(event.totalRegistrations * 10, 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 text-xs text-app-muted relative z-10">
                <span>{event.totalRegistrations} registrations</span>
                <span className="group-hover:text-app-accent transition">View →</span>
            </div>
        </motion.div>
    );
}

function EventsEmptyState({ tab }: { tab: EventTab }) {
    const copy = EMPTY_COPY[tab];

    return (
        <div className="events-empty-state">
            <div className="events-empty-state__icon">
                <CalendarX2 size={32} />
            </div>
            <h3 className="events-empty-state__title">{copy.title}</h3>
            <p className="events-empty-state__desc">{copy.description}</p>
            <div className="events-empty-state__actions">
                <Link to="/event" className="events-empty-state__cta">
                    Create Event
                </Link>
                <Link to={copy.secondaryPath} className="events-empty-state__link">
                    {copy.secondaryLabel}
                </Link>
            </div>
        </div>
    );
}

const EventCardDashbord: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { upcoming, running, past, counts, loading, error, lastFetched } = useAppSelector(
        (s) => s.runninEvents
    );

    const [activeTab, setActiveTab] = useState<EventTab>("upcoming");
    const [tabInitialized, setTabInitialized] = useState(false);

    useEffect(() => {
        dispatch(fetchRunningEvents() as any);
    }, [dispatch]);

    useEffect(() => {
        if (tabInitialized || loading) return;
        setActiveTab(resolveDefaultTab(counts));
        setTabInitialized(true);
    }, [counts, loading, tabInitialized]);

    const tabEvents = useMemo(() => {
        if (activeTab === "upcoming") return upcoming;
        if (activeTab === "running") return running;
        return past;
    }, [activeTab, upcoming, running, past]);

    const handleRetry = () => {
        dispatch(fetchRunningEvents() as any);
    };

    return (
        <div className="events-dashboard">
            <div className="events-dashboard__header">
                <div>
                    <h2 className="events-dashboard__title">Events</h2>
                    <p className="events-dashboard__subtitle">
                        Upcoming, live, and past events with registration overview
                    </p>
                </div>
                <Link to="/event" className="events-dashboard__create hidden sm:inline-flex">
                    + Create Event
                </Link>
            </div>

            <div className="events-dashboard-tabs" role="tablist" aria-label="Event lifecycle">
                {TAB_CONFIG.map(({ key, label, countKey, icon: Icon }) => {
                    const count = counts[countKey];
                    const isActive = activeTab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(key)}
                            className={`events-dashboard-tab${isActive ? " events-dashboard-tab--active" : ""}`}
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                            <span className="events-dashboard-tab__count">{count}</span>
                        </button>
                    );
                })}
            </div>

            {loading && !lastFetched ? (
                <div className="events-dashboard-loading">
                    <div className="events-dashboard-loading__spinner" />
                    <p>Loading events...</p>
                </div>
            ) : error ? (
                <div className="events-dashboard-error">
                    <p>{error}</p>
                    <button type="button" onClick={handleRetry} className="events-empty-state__cta">
                        Retry
                    </button>
                </div>
            ) : tabEvents.length === 0 ? (
                <EventsEmptyState tab={activeTab} />
            ) : (
                <div className="events-dashboard-cards">
                    {tabEvents.map((event) => (
                        <EventCard
                            key={event._id}
                            event={event}
                            onOpen={(id) => navigate(`/runningevent/${id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventCardDashbord;
