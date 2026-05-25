import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  ChevronRight,
  Clock3,
  BadgeCheck,
  Sparkles,
  Wallet,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCreatedEvents } from "../../redux/EventThunks";
import { useNavigate } from "react-router";
import EventRegistrationPanel from "./EventRegistrationPanel";
import AppPageLayout from "../../layouts/AppPageLayout";
import { formatEventPricingLabel, paymentRequired } from "../../utils/pricing";

export default function AttendencePage() {
  const dispatch = useAppDispatch();

  const events = useAppSelector((s) => s.event.events || []);
  const loading = useAppSelector((s) => s.event.loading);

  const statistics = useAppSelector(
    (s: any) => s.eventRegistorData?.eventsRegistors?.data?.statistics
  );
  const registrationsLoading = useAppSelector(
    (s: any) => s.eventRegistorData?.loading
  );

  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [focusRegistrations, setFocusRegistrations] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1280);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1280);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchCreatedEvents(""));
  }, [dispatch]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      event.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  const handleEventClick = (event: any) => {
    if (isMobile) {
      navigate(`/event-attendance/${event._id}`);
    } else {
      setSelectedEvent(event);
      setFocusRegistrations(true);
    }
  };

  const statsCards = selectedEvent
    ? [
        { title: "Registrations", value: statistics?.totalRegistrations ?? 0, icon: Users, color: "from-cyan-500 to-blue-500" },
        { title: "Checked In", value: statistics?.checkedInCount ?? 0, icon: BadgeCheck, color: "from-emerald-500 to-green-500" },
        { title: "Pending Entry", value: statistics?.pendingCheckInCount ?? 0, icon: UserCheck, color: "from-amber-500 to-orange-500" },
      ]
    : [
        { title: "Total Events", value: events.length, icon: CalendarDays, color: "from-cyan-500 to-blue-500" },
        { title: "Monetized Events", value: events.filter((e: any) => paymentRequired(e, 0)).length, icon: Wallet, color: "from-pink-500 to-fuchsia-500" },
        { title: "With Guests", value: events.filter((e: any) => e.allowGuests).length, icon: Users, color: "from-emerald-500 to-green-500" },
      ];

  return (
    <AppPageLayout showGlow embedded>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-app-surface border border-app-border backdrop-blur-xl mb-4">
            <Sparkles className="w-4 h-4 text-app-cyan" />
            <span className="text-sm text-app-cyan">Smart Event Attendance Dashboard</span>
          </div>

          <h1 className="app-heading text-3xl md:text-5xl leading-tight text-app-text">
            Event Attendance
          </h1>

          <p className="text-app-secondary mt-2 max-w-xl">
            {selectedEvent
              ? `Viewing registrations for "${selectedEvent.title}"`
              : "Select an event to view live registration and check-in data."}
          </p>
        </div>

        <div className="relative w-full lg:w-[380px]">
          <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-app-muted" />
          <input
            type="text"
            placeholder="Search event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="app-input w-full h-14 pl-12 pr-4 rounded-2xl backdrop-blur-xl outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statsCards.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className="relative overflow-hidden app-card-raised p-6"
          >
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${item.color}`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-app-secondary text-sm">{item.title}</p>
                <h2 className="text-4xl font-black mt-2 text-app-text">
                  {registrationsLoading && selectedEvent ? "…" : item.value}
                </h2>
              </div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl`}>
                <item.icon className="w-8 h-8 text-app-text" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${focusRegistrations && selectedEvent ? "xl:grid-cols-1" : "xl:grid-cols-12"}`}>
        {!(focusRegistrations && selectedEvent) && (
        <div className="xl:col-span-5">
          <div className="app-card-flat overflow-hidden">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-app-text">Created Events</h2>
              <div className="text-sm text-app-muted">{filteredEvents.length} Events</div>
            </div>

            <div className="max-h-[800px] overflow-y-auto p-4 space-y-4 custom-scroll">
              {loading ? (
                <div className="text-center py-20 text-app-muted">Loading events...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-app-muted">No events found</div>
              ) : (
                filteredEvents.map((event: any, index: number) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleEventClick(event)}
                    className={`group relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${
                      selectedEvent?._id === event._id
                        ? "border-app-cyan bg-[var(--color-selected-bg)]"
                        : "border-app-border bg-app-surface-muted hover:border-app-cyan/50"
                    }`}
                  >
                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold mb-3 text-app-text">{event.title}</h3>
                          <div className="space-y-2 text-sm text-app-muted">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-app-cyan" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 className="w-4 h-4 text-app-fuchsia" />
                              <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-400" />
                              <span>Max per user: {event.maxPerUser}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-app-muted group-hover:text-app-cyan transition" />
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-app-cyan text-xs">
                          {event.locationType}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-app-surface text-app-text text-xs border border-app-border">
                          {formatEventPricingLabel(event)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {!isMobile && (
          <div className={focusRegistrations && selectedEvent ? "w-full" : "xl:col-span-7"}>
            <AnimatePresence mode="wait">
              {selectedEvent ? (
                <motion.div
                  key={selectedEvent._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="app-card-raised overflow-hidden reg-attendance-workspace-shell"
                >
                  {focusRegistrations && (
                    <div className="px-6 py-3 border-b border-app-border flex items-center justify-between">
                      <button
                        type="button"
                        className="text-sm text-app-cyan hover:opacity-80"
                        onClick={() => setFocusRegistrations(false)}
                      >
                        Show event list
                      </button>
                      <span className="text-xs text-app-muted">Full-width registration workspace</span>
                    </div>
                  )}
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto custom-scroll">
                    <EventRegistrationPanel eventId={selectedEvent._id} variant="compact" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[600px] rounded-3xl border border-dashed border-app-border bg-app-surface-muted flex flex-col items-center justify-center text-center p-10"
                >
                  <CalendarDays className="w-24 h-24 text-app-cyan mb-6" />
                  <h2 className="text-3xl font-bold mb-3 text-app-text">Select an Event</h2>
                  <p className="text-app-muted max-w-md">
                    Click any event to load registrations, check-in status, payments, and participant details.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppPageLayout>
  );
}
