import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";
import { useDispatch } from "react-redux";
import { fetchRunningEvents } from "../../redux/Thunks/RunningEventThunk";


import { CalendarDays, MapPin, Users, Clock } from "lucide-react";


type Event = {
    _id: string;
    title: string;
    description: string;
    location: string;
    isRegistrationClosed: boolean;
    eventDays: { date: string }[];
};



const EventCardDashbord: React.FC = () => {
    const Dispath = useDispatch()

    const events = useAppSelector((e) => e.runninEvents)
    // console.log(events, 'events frm Running event')
    const navigate = useNavigate();

    const getStatus = (event: Event) => {
        const now = new Date();
        const lastDay = new Date(event.eventDays[event.eventDays.length - 1].date);

        if (event.isRegistrationClosed) return "Closed";
        if (lastDay >= now) return "Live";
        return "Completed";
    };

    useEffect(() => {
        Dispath(fetchRunningEvents() as any)
    }, [Dispath])

    return (
        <div className="w-full overflow-x-auto flex gap-4 pb-2">

            {events.events?.map((event: any) => {
                const status = event?.status; // 🔥 backend already sending
                const startDate = new Date(event?.startTime);

                return (
                    <motion.div
                        key={event._id}
                        // whileHover={{ scale: 1.04, y: -4 }}
                        // transition={{ duration: 0.25 }}
                        onClick={() => navigate(`/runningevent/${event._id}`)}
                        className="relative min-w-[320px] rounded-2xl p-5 app-card shadow-md hover:shadow-sm transition-all duration-300 cursor-pointer group overflow-hidden"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>

                        {/* HEADER */}
                        <div className="flex justify-between items-start relative z-10">
                            <h3 className="text-md font-semibold text-app-text">
                                {event.title}
                            </h3>

                            {/* STATUS BADGE */}
                            <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${status === "running"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : status === "upcoming"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-app-surface-muted text-app-muted border border-app-border"
                                    }`}
                            >
                                {status === "running"
                                    ? "Live"
                                    : status === "upcoming"
                                        ? `${event.daysLeft} days left`
                                        : "Ended"}
                            </span>
                        </div>

                        {/* DESCRIPTION */}
                        <p className="text-xs text-app-muted mt-1 line-clamp-2 relative z-10">
                            {event.description}
                        </p>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-app-muted relative z-10">

                            {/* DATE */}
                            <div className="flex items-center gap-2">
                                <CalendarDays size={14} />
                                {startDate.toLocaleDateString()}
                            </div>

                            {/* TIME */}
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>

                            {/* LOCATION */}
                            <div className="flex items-center gap-2">
                                <MapPin size={14} />
                                {event.location}
                            </div>

                            {/* REG COUNT */}
                            <div className="flex items-center gap-2">
                                <Users size={14} />
                                {event.totalRegistrations} joined
                            </div>
                        </div>

                        {/* PROGRESS BAR (registration feel) */}
                        <div className="mt-4 relative z-10">
                            <div className="w-full h-2 bg-app-surface-muted rounded-full overflow-hidden border border-app-border">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(event.totalRegistrations * 10, 100)}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-between items-center mt-4 text-xs text-app-muted relative z-10">
                            <span>{event.totalRegistrations} registrations</span>
                            <span className="group-hover:text-app-accent transition">View →</span>
                        </div>
                    </motion.div>
                );
            })}

        </div>
    );
};

export default EventCardDashbord;



