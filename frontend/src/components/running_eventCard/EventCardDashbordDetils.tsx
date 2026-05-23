import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Input, Tag, IconButton, Avatar, InputGroup } from "rsuite";
import { Search, ArrowLeft, Eye, Trash2 } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { useAppSelector } from "../../hooks/hooks";
import { fetchRunningEvents } from "../../redux/Thunks/RunningEventThunk";
import { useDispatch } from "react-redux";
import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";

const EventCardDashbordDetils = () => {
    const dispatch = useDispatch();

    const event = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.event);
    const registrations = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.registrations);
    const statistics = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.statistics);

    const { id } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        if (!event?._id) {
            dispatch(eventRegistrationDetils_Get_ById(id) as any);
        }
    }, []);

    const [search, setSearch] = useState("");

    console.log('====', event)

    const filtered = registrations?.filter((r: any) =>
        r.investor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search)
    );

    if (!event?._id) return <div className="p-6">Event not found</div>;

    return (

        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-2 transition"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <h1 className="text-2xl font-bold text-gray-800">
                        {event.title}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {event.description}
                    </p>
                </div>

                <div className="text-right">
                    <span className="text-sm text-gray-400">
                        {event.totalRegistrations} registrations
                    </span>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-white/70 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-md p-4">
                <InputGroup>
                    <Input
                        placeholder="Search name or phone..."
                        value={search}
                        onChange={(v) => setSearch(v)}
                    />
                    <InputGroup.Addon>
                        <Search size={16} />
                    </InputGroup.Addon>
                </InputGroup>
            </div>

            {/* TABLE */}
            <div className="bg-white/70 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-md overflow-x-auto">

                {/* ✅ IMPORTANT WRAPPER */}
                <div className="min-w-[900px]">

                    {/* HEADER */}
                    <div className="grid grid-cols-6 bg-gray-50 text-xs text-gray-500 px-4 py-3">
                        <div>User</div>
                        <div className="hidden md:block">Category</div>
                        <div>Pass</div>
                        <div>Status</div>
                        <div className="hidden md:block">Time</div>
                        <div>Actions</div>
                    </div>

                    {/* BODY */}
                    <div>
                        {filtered?.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                No registrations found
                            </div>
                        ) : (
                            filtered?.map((item: any) => (
                                <div
                                    key={item._id}
                                    className="
                                    group relative grid grid-cols-6 items-center
                                    px-4 py-3 border-t
                                    transition-all duration-200 ease-out
                                    hover:bg-gray-50 hover:scale-[1.01]
                                    cursor-pointer
                                    "
                                >
                                    {/* USER */}
                                    <div className="flex items-center gap-3 relative z-10">
                                        <Avatar
                                            circle
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white transition group-hover:scale-110"
                                        >
                                            {item.investor?.name?.charAt(0)}
                                        </Avatar>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">
                                                {item.investor?.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* CATEGORY */}
                                    <div className="hidden md:block relative z-10">
                                        <Tag className="bg-purple-100 text-purple-600 text-xs">
                                            General
                                        </Tag>
                                    </div>

                                    {/* PASS */}
                                    <div className="relative z-10">
                                        <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-600">
                                            PAID
                                        </span>
                                    </div>

                                    {/* STATUS */}

                                    <div className="flex items-center gap-2 relative z-10">
                                        {item?.isCheckedIn ? (

                                            <>
                                                {/* <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                                <span className="text-xs text-gray-600">
                                                    Checked
                                                </span> */}
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                                                </span>

                                                <span className="text-xs font-medium text-green-600">
                                                    Entered Hall
                                                </span>
                                            </>


                                        ) : <>
                                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>

                                            <span className="text-xs font-medium text-orange-500">
                                                Not Entered
                                            </span>

                                        </>}
                                    </div>


                                    {/* TIME */}
                                    <div className="hidden md:block text-xs text-gray-400 relative z-10">
                                        {format(new Date(item.createdAt), "hh:mm a")}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex gap-2 relative z-10">
                                        <IconButton
                                            icon={<Eye size={16} />}
                                            appearance="subtle"
                                            className="hover:scale-110 transition"
                                        />
                                        <IconButton
                                            icon={<Trash2 size={16} />}
                                            appearance="subtle"
                                            color="red"
                                            className="hover:scale-110 hover:rotate-3 transition"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EventCardDashbordDetils;