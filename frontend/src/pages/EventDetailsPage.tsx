import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Input } from "rsuite";
import { Search } from "lucide-react";
import axios from "axios";

const EventDetailsPage = () => {
    const { id } = useParams();

    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        axios.get(`/api/registrations/${id}`).then((res) => {
            setData(res.data);
        });
    }, [id]);

    const filtered = data.filter(
        (item) =>
            item.phone.includes(search) ||
            item.participants.some((p: any) =>
                p.name.toLowerCase().includes(search.toLowerCase())
            )
    );

    return (
        <div className="p-6">

            {/* Header */}
            <h1 className="text-2xl font-semibold mb-4">
                Event Registrations
            </h1>

            {/* Search */}
            <div className="mb-4 max-w-sm">
                <Input
                    placeholder="Search..."
                    prefix={<Search size={14} />}
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-md border overflow-hidden">

                <div className="grid grid-cols-5 px-4 py-3 text-xs font-semibold bg-gray-50">
                    <div>User</div>
                    <div>Phone</div>
                    <div>Participants</div>
                    <div>Count</div>
                    <div>Date</div>
                </div>

                {filtered.map((item) => (
                    <div
                        key={item._id}
                        className="grid grid-cols-5 px-4 py-3 border-t items-center hover:bg-gray-50 transition"
                    >
                        {/* Investor */}
                        <div className="flex items-center gap-2">
                            <Avatar circle>
                                {item.participants[0]?.name?.[0]}
                            </Avatar>
                            <span className="text-sm">
                                {item.participants[0]?.name}
                            </span>
                        </div>

                        <div className="text-sm">{item.phone}</div>

                        {/* Participants */}
                        <div className="text-xs text-gray-600">
                            {item.participants.map((p: any) => p.name).join(", ")}
                        </div>

                        <div className="text-sm">
                            {item.participants.length}
                        </div>

                        <div className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventDetailsPage;