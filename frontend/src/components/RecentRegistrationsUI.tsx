import React from "react";
import { Avatar, Input, Tag, IconButton, InputGroup } from "rsuite";
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
    onExport?: () => void;
    isHighlighted?: (row: { id?: string; phone?: string }) => boolean;
};



const SkeletonRow = () => (
    <div className="flex items-center justify-between p-3 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-app-surface-muted rounded-full"></div>
            <div>
                <div className="w-24 h-3 bg-app-surface-muted rounded mb-1"></div>
                <div className="w-16 h-2 bg-app-surface-muted/70 rounded"></div>
            </div>
        </div>
        <div className="w-16 h-3 bg-app-surface-muted rounded"></div>
        <div className="w-20 h-3 bg-app-surface-muted rounded"></div>
        <div className="w-16 h-3 bg-app-surface-muted rounded"></div>
    </div>
);
const RecentRegistrationsUI: React.FC<Props> = ({
    preview,
    navigate,
    filtered,
    loading,
    search,
    setSearch,
    onExport,
    isHighlighted,
}) => {




    return (
        <>
            <div className="app-card p-5 w-full transition">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-app-text">
                        Recent Registrations
                        {preview ? (
                            <button type="button" onClick={() => navigate("/allregistrations")} className="text-sm font-medium text-app-accent hover:opacity-80 transition pl-3">
                                View All →
                            </button>
                        ) : (
                            <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-app-accent hover:opacity-80 transition pl-3">
                                Previous ↩
                            </button>
                        )}
                    </h2>
                    <span className="text-xs text-app-muted">{filtered.length} entries</span>
                    {!preview && onExport && (
                        <button
                            type="button"
                            className="text-xs font-semibold text-app-accent hover:opacity-80"
                            onClick={onExport}
                        >
                            Export CSV
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="mb-4">
                    <InputGroup inside className="!rounded-xl">
                        <Input
                            placeholder="Search name or phone..."
                            value={search}
                            onChange={(value) => setSearch(value)}
                        />
                        <InputGroup.Addon>
                            <Search size={16} />
                        </InputGroup.Addon>
                    </InputGroup>
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
                        <div className="text-center text-app-muted py-6">No results found</div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={item.id}
                                id={`reg-row-${item.id}`}
                                className={clsx(
                                    "flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-card-hover)] hover:scale-[1.01] transition-all duration-200 cursor-pointer",
                                    isHighlighted?.(item) && "notif-row-highlight"
                                )}
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
                                        <h3 className="text-sm font-semibold text-app-text">{item.name}</h3>
                                        <p className="text-xs text-app-muted">{item.phone}</p>
                                        {item.eventTitle && (
                                            <p className="text-xs text-app-muted">{item.eventTitle}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="hidden md:block">
                                    <Tag className="bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded-full text-xs">
                                        {item.category}
                                    </Tag>
                                </div>

                                {/* Pass */}
                                <div>
                                    <span
                                        className={clsx(
                                            "text-xs px-3 py-1 rounded-full font-medium",
                                            item.passStatus === "RELEASED"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-amber-500/20 text-amber-400"
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
                                                ? "bg-emerald-500 animate-ping"
                                                : "bg-app-muted"
                                        )}
                                    ></span>
                                    <span className="text-xs text-app-muted">{item.checkIn ? "Checked" : "Pending"}</span>
                                </div>

                                {/* Time */}
                                <div className="hidden md:block text-xs text-app-muted">
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