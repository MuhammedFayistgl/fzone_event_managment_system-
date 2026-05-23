import type { FC } from 'react';
import { Tag } from 'rsuite';
import type { EventResponseType, EventDay } from '../../Types/event';

interface RegisterInfoProps {
    event: EventResponseType;
}

const RegisterInfo: FC<RegisterInfoProps> = ({ event } ) => {
    // ================= HOOKS =================


    return (
        <>
            <div className="app-card overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500/90 to-blue-600/90 text-app-text p-6 space-y-3">

                    <div className="flex justify-between items-start gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold leading-snug">
                            {event?.title}
                        </h1>

                        <Tag color={event?.isPaid ? "red" : "green"} className="!px-3 !py-1">
                            {event?.isPaid ? `₹ ${event?.price}` : "FREE"}
                        </Tag>
                    </div>

                    <p className="text-white/90 text-sm leading-relaxed">
                        {event?.description}
                    </p>

                    {/* QUICK BADGES */}
                    <div className="flex flex-wrap gap-2 text-xs">

                        <Tag color="cyan">
                            🌐 {event?.locationType}
                        </Tag>

                        {event?.locationType === "offline" && event?.location && (
                            <Tag color="violet">
                                📍 {event?.location}
                            </Tag>
                        )}

                        <Tag color="blue">
                            📅 {event?.eventDays?.length} Days
                        </Tag>

                        <Tag
                            color={
                                event?.allowGuests
                                    ? (event?.maxPerUser ?? 0) > 0
                                        ? "green"
                                        : "orange"
                                    : "red"
                            }
                        >
                            {event?.allowGuests
                                ? `👥 Guests Allowed • Max ${event?.maxPerUser ?? 0}`
                                : "🚫 Guests Not Allowed"}
                        </Tag>

                    </div>
                </div>

                {/* ================= BODY ================= */}
                <div className="p-6 space-y-6">

                    {/* META GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        <div className="app-card-muted p-4 rounded-xl">
                            <p className="text-xs text-app-muted">Registration</p>
                            <p className="font-semibold text-sm text-app-text">
                                {event.registrationStart
                                    ? new Date(event.registrationStart).toLocaleDateString()
                                    : "N/A"}{" "}
                                →{" "}
                                {event.registrationDeadline
                                    ? new Date(event.registrationDeadline).toLocaleDateString()
                                    : "N/A"}
                            </p>
                        </div>

                        <div className="app-card-muted p-4 rounded-xl">
                            <p className="text-xs text-app-muted">Capacity</p>
                            <p className="font-semibold text-sm text-app-text">
                                {event.maxParticipants || "Unlimited"}
                            </p>
                        </div>

                        <div className="app-card-muted p-4 rounded-xl">
                            <p className="text-xs text-app-muted">Refund</p>
                            <p className="font-semibold text-sm text-app-text">
                                {event.isRefundable ? "Allowed" : "Not Allowed"}
                            </p>
                        </div>

                        <div className="app-card-muted p-4 rounded-xl">
                            <p className="text-xs text-app-muted">Mode</p>
                            <p className="font-semibold text-sm text-app-text">
                                {event.locationType}
                            </p>
                        </div>

                    </div>

                    {/* ================= SCHEDULE ================= */}
                    <div>
                        <h2 className="font-bold text-app-text mb-3">📅 Schedule Timeline</h2>
                        <div className="space-y-3 border-l-2 border-app-accent/30 pl-4">

                            {event.eventDays?.map((d: EventDay, i: number) => (
                                <div key={i} className="relative">

                                    <div className="absolute -left-[9px] top-2 w-3 h-3 bg-blue-500 rounded-full"></div>

                                    <div className="app-card-muted p-3 rounded-xl">
                                        <p className="font-semibold text-sm text-app-text">
                                            {d.date ? new Date(d.date).toDateString() : "N/A"}
                                        </p>

                                        <p className="text-xs text-app-muted">
                                            ⏰ {d.startTime ? new Date(d.startTime).toLocaleTimeString() : "N/A"} -{" "}
                                            {d.endTime ? new Date(d.endTime).toLocaleTimeString() : "N/A"}
                                        </p>
                                    </div>

                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default RegisterInfo;