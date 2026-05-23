import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Input, InputGroup } from "rsuite";
import { Search } from "lucide-react";
import axios from "axios";
import AppPageLayout from "../layouts/AppPageLayout";

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
        <AppPageLayout title="Event Registrations" showGlow={false}>
            <div className="mb-4 max-w-sm">
                <InputGroup inside>
                    <Input placeholder="Search..." value={search} onChange={setSearch} />
                    <InputGroup.Addon><Search size={14} /></InputGroup.Addon>
                </InputGroup>
            </div>

            <div className="app-card-flat overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse">
                    <thead>
                        <tr className="border-b border-app-border bg-app-surface-muted text-xs uppercase tracking-wide text-app-muted">
                            <th className="px-4 py-3 text-left font-medium align-middle w-[28%]">User</th>
                            <th className="px-4 py-3 text-left font-medium align-middle w-[16%]">Phone</th>
                            <th className="px-4 py-3 text-left font-medium align-middle w-[30%]">Participants</th>
                            <th className="px-4 py-3 text-left font-medium align-middle w-[10%]">Count</th>
                            <th className="px-4 py-3 text-left font-medium align-middle w-[16%]">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-app-muted">
                                    No registrations found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr
                                    key={item._id}
                                    className="border-t border-app-border hover:bg-[var(--color-card-hover)] transition-colors"
                                >
                                    <td className="px-4 py-3 align-middle">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Avatar circle className="shrink-0">
                                                {item.participants[0]?.name?.[0]}
                                            </Avatar>
                                            <span className="text-sm text-app-text truncate">
                                                {item.participants[0]?.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-sm text-app-text whitespace-nowrap">
                                        {item.phone}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-xs text-app-secondary">
                                        <span className="line-clamp-2">
                                            {item.participants.map((p: any) => p.name).join(", ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-sm text-app-text">
                                        {item.participants.length}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-xs text-app-muted whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AppPageLayout>
    );
};

export default EventDetailsPage;
