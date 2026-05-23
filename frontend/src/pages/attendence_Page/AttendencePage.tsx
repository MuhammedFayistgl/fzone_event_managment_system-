import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  ChevronRight,
  Clock3,
  BadgeCheck,
  UserCheck,
  Sparkles,
  Wallet,
  ShieldCheck,
} from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";

import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCreatedEvents } from "../../redux/EventThunks";
import { useNavigate } from "react-router";
import EventAttendanceDetails from "./EventAttendanceDetails";

export default function AttendencePage() {
  const dispatch = useAppDispatch();

  const events = useAppSelector((s) => s.event.events || []);
  const loading = useAppSelector((s) => s.event.loading);

  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1280);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const handleEventClick = (event: any) => {
    if (isMobile) {
      navigate(`/event-attendance/${event._id}`);
    } else {
      setSelectedEvent(event);
    }
  };



  // ================= LOAD EVENTS =================
  const loadEvents = () => {
    dispatch(fetchCreatedEvents(""));
  };

  useEffect(() => {
    loadEvents();
  }, [dispatch]);

  // ================= FILTER EVENTS =================
  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      event.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  // ================= DUMMY REGISTERED USERS =================
  // Replace with API data later
  const attendees = [
    {
      id: 1,
      name: "Muhammed Fayis",
      email: "fayis@gmail.com",
      phone: "+91 9876543210",
      status: "Confirmed",
    },
    {
      id: 2,
      name: "Ameen",
      email: "ameen@gmail.com",
      phone: "+91 9999999999",
      status: "Pending",
    },
    {
      id: 3,
      name: "Shamil",
      email: "shamil@gmail.com",
      phone: "+91 8888888888",
      status: "Confirmed",
    },
  ];

  return (
    <div className="min-h-screen bg-[#060816] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/20 blur-[140px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl mb-4">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-sm text-cyan-200">
                Smart Event Attendance Dashboard
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              Event Attendance
            </h1>

            <p className="text-gray-400 mt-2 max-w-xl">
              Manage registrations, attendees, and event participation with a
              premium modern dashboard UI.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:w-[380px]">
            <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Search event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl outline-none focus:ring-2 focus:ring-cyan-400 text-white"
            />
          </div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            {
              title: "Total Events",
              value: events.length,
              icon: CalendarDays,
              color: "from-cyan-500 to-blue-500",
            },
            {
              title: "Registrations",
              value: attendees.length,
              icon: Users,
              color: "from-pink-500 to-fuchsia-500",
            },
            {
              title: "Confirmed",
              value: attendees.filter((a) => a.status === "Confirmed").length,
              icon: BadgeCheck,
              color: "from-emerald-500 to-green-500",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl p-6"
            >
              <div
                className={`absolute inset-0 opacity-20 bg-gradient-to-br ${item.color}`}
              />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">{item.title}</p>

                  <h2 className="text-4xl font-black mt-2">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl`}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* EVENTS */}
          <div className="xl:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Created Events</h2>

                <div className="text-sm text-gray-300">
                  {filteredEvents.length} Events
                </div>
              </div>

              <div className="max-h-[800px] overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center py-20 text-gray-400">
                    Loading events...
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    No events found
                  </div>
                ) : (
                  filteredEvents.map((event: any, index: number) => (
                    <motion.div
                      key={event?._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      onClick={() => handleEventClick(event)}
                      className={`group relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${selectedEvent?._id === event?._id
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-black/20 hover:border-cyan-500/50"
                        }`}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10" />

                      <div className="relative p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-2xl font-bold mb-3">
                              {event?.title}
                            </h3>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-300">
                                <MapPin className="w-4 h-4 text-cyan-300" />
                                <span>{event?.location}</span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-300">
                                <Clock3 className="w-4 h-4 text-pink-300" />
                                <span>
                                  {new Date(
                                    event?.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-300">
                                <Users className="w-4 h-4 text-emerald-300" />
                                <span>
                                  Max Per User : {event?.maxPerUser}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-cyan-300 transition" />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5">
                          <span className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-200 text-sm">
                            {event?.locationType}
                          </span>

                          {event?.isPaid ? (
                            <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-200 text-sm flex items-center gap-2">
                              <Wallet className="w-4 h-4" />
                              Paid
                            </span>
                          ) : (
                            <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-200 text-sm">
                              Free Event
                            </span>
                          )}

                          {event?.allowGuests && (
                            <span className="px-4 py-2 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-sm">
                              Guests Allowed
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* DETAILS */}
          {!isMobile &&
            // <EventAttendanceDetails />

            <div className="xl:col-span-7">
              <AnimatePresence mode="wait">
                {selectedEvent ? (
                  <motion.div
                    key={selectedEvent?._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl overflow-hidden"
                  >
                    {/* HEADER */}

                    <EventAttendanceDetails selectID={selectedEvent._id} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[600px] rounded-3xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-10"
                  >
                    <CalendarDays className="w-24 h-24 text-cyan-300 mb-6" />

                    <h2 className="text-3xl font-bold mb-3">
                      Select an Event
                    </h2>

                    <p className="text-gray-400 max-w-md">
                      Click any event from the left panel to view registrations,
                      attendance details, and event analytics.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          }

        </div>
      </div>
    </div>
  );
}