import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, ShieldCheck, UserCheck, Users } from "lucide-react";

import React, { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCreatedEvents } from "../../redux/EventThunks";

import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";
import EventRegistorDataTable from "./EventRegistorDataTable";

const EventAttendanceDetails = ({ selectID }: any) => {

    const { id } = useParams();
    const dispatch = useAppDispatch();

    const events = useAppSelector(
        (s) => s.event.events
    );
    const selectedEvent = events.find((event) => (event._id === (id || selectID)));


    // ================= LOAD EVENTS =================

    useEffect(() => {

        if (!selectedEvent) {
            dispatch(fetchCreatedEvents(""));
        }

    }, [dispatch]);

    useEffect(() => {
        const selectedID = selectID || id
        dispatch(eventRegistrationDetils_Get_ById(selectedID) as any)

    }, []);
    if (!event) {
        return (
            <div className="text-white p-10">
                Event not found
            </div>
        );
    }

    return (
        <div className={id && `  min-h-screen bg-[#060816] text-white overflow-hidden `}>
            < >
                <div className="relative p-8 overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20" />

                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-200 text-sm">
                                {selectedEvent?.location}
                            </span>

                            <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                                {selectedEvent?.isPaid ? "Paid" : "Free"}
                            </span>

                            {selectedEvent?.isRefundable && (
                                <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-200 text-sm">
                                    Refundable
                                </span>
                            )}
                        </div>

                        <h2 className="text-4xl font-black">
                            {selectedEvent?.title}
                        </h2>

                        <p className="text-gray-300 mt-4 text-lg">
                            {selectedEvent?.description}
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 mt-8">
                            <div className="rounded-2xl bg-black/20 border border-white/10 p-5">
                                <p className="text-gray-400 text-sm mb-2">
                                    Location
                                </p>

                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-cyan-300" />
                                    <span className="font-semibold">
                                        {selectedEvent?.location}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-black/20 border border-white/10 p-5">
                                <p className="text-gray-400 text-sm mb-2">
                                    Guests
                                </p>

                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-fuchsia-300" />
                                    <span className="font-semibold">
                                        {selectedEvent?.allowGuests
                                            ? "Allowed"
                                            : "Not Allowed"}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-black/20 border border-white/10 p-5">
                                <p className="text-gray-400 text-sm mb-2">
                                    Max Participants
                                </p>

                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-300" />
                                    <span className="font-semibold">
                                        {selectedEvent?.maxParticipants === 0
                                            ? "Unlimited"
                                            : selectedEvent?.maxParticipants}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ATTENDEES */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold">
                            Registered Members
                        </h3>

                        <div className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-200 text-sm">
                            {/* {attendees.length} Registered */}
                        </div>
                    </div>
                    <EventRegistorDataTable selectID={selectID || id} />

                </div>
            </>
        </div>



    );
}

export default EventAttendanceDetails;