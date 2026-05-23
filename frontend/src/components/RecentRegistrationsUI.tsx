import React, { useMemo, useState } from "react";
import { Avatar, Input, Tag, IconButton } from "rsuite";
import { Eye, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";


type Props = {
    preview?: boolean;
    navigate: any;
    filtered: any[];
    loading: boolean;
    search: string;
    setSearch: (v: string) => void;
};
type Participant = {
    id: string;
    name: string;
    phone: string;
    gender: "Male" | "Female";
    category: string;
    passStatus: "RELEASED" | "PENDING";
    checkIn: boolean;
    time: Date;
};


const mockData: Participant[] = [
    {
        id: "1",
        name: "Aisha",
        phone: "8848883036",
        gender: "Female",
        category: "Family",
        passStatus: "RELEASED",
        checkIn: true,
        time: new Date(),
    },
    {
        id: "2",
        name: "Jaza",
        phone: "9747396811",
        gender: "Female",
        category: "VIP",
        passStatus: "RELEASED",
        checkIn: true,
        time: new Date(),
    },
    {
        id: "3",
        name: "Faiha",
        phone: "9496276210",
        gender: "Female",
        category: "General",
        passStatus: "PENDING",
        checkIn: false,
        time: new Date(),
    },
];

const SkeletonRow = () => (
    <div className="flex items-center justify-between p-3 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
                <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
                <div className="w-16 h-2 bg-gray-100 rounded"></div>
            </div>
        </div>
        <div className="w-16 h-3 bg-gray-200 rounded"></div>
        <div className="w-20 h-3 bg-gray-200 rounded"></div>
        <div className="w-16 h-3 bg-gray-200 rounded"></div>
    </div>
);
const RecentRegistrationsUI: React.FC<Props> = ({
    preview,
    navigate,
    filtered,
    loading,
    search,
    setSearch,
}) => {




    return (
        <>
            <div className="bg-white/70 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-md p-5 w-full transition">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Recent Registrations
                        {preview ?
                            <button
                                onClick={() => navigate("/allregistrations")}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition pl-3"
                            >
                                View All →
                            </button>
                            :
                            <button
                                onClick={() => navigate(-1)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition pl-3"
                            >
                                Previus ↩
                            </button>
                        }

                    </h2>

                    <span className="text-xs text-gray-400">
                        {filtered.length} entries
                    </span>

                </div>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search name or phone..."
                        value={search}
                        onChange={(value) => setSearch(value)}
                        prefix={<Search size={16} />}
                        className="!rounded-xl"
                    />
                </div>

                {/* List */}
                <div className="space-y-2">
                    {loading ? (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-400 py-6">
                            No results found
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                            >
                                {/* Left */}
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        circle
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                    >
                                        {item.name.charAt(0)}
                                    </Avatar>

                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {item.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="hidden md:block">
                                    <Tag className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                                        {item.category}
                                    </Tag>
                                </div>

                                {/* Pass */}
                                <div>
                                    <span
                                        className={clsx(
                                            "text-xs px-3 py-1 rounded-full font-medium",
                                            item.passStatus === "RELEASED"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-orange-100 text-orange-600"
                                        )}
                                    >
                                        {item.passStatus}
                                    </span>
                                </div>

                                {/* Check-in */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className={clsx(
                                            "w-2 h-2 rounded-full",
                                            item.checkIn
                                                ? "bg-green-500 animate-ping"
                                                : "bg-gray-400"
                                        )}
                                    ></span>
                                    <span className="text-xs text-gray-600">
                                        {item.checkIn ? "Checked" : "Pending"}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="hidden md:block text-xs text-gray-400">
                                    {format(item.time, "hh:mm a")}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <IconButton
                                        icon={<Eye size={16} />}
                                        appearance="subtle"
                                    />
                                    <IconButton
                                        icon={<Trash2 size={16} />}
                                        appearance="subtle"
                                        color="red"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default RecentRegistrationsUI;