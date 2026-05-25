import React from "react";
import type { NavigateFunction } from "react-router-dom";
import { Avatar, Input, Tag, IconButton, InputGroup } from "rsuite";
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import clsx from "clsx";
import type { RegistrationRow } from "./ResentRegistration/RecentRegistrationsContainer";

type Props = {
    preview?: boolean;
    navigate: NavigateFunction;
    filtered: RegistrationRow[];
    loading: boolean;
    search: string;
    setSearch: (v: string) => void;
    onExport?: () => void;
    isHighlighted?: (row: { id?: string; phone?: string }) => boolean;
    pagination?: { total: number; totalPages: number; page: number; limit: number } | null;
    page?: number;
    onPageChange?: (page: number) => void;
    onView?: (row: RegistrationRow) => void;
};

function formatRowTime(value: string | Date) {
    const date = value instanceof Date ? value : parseISO(String(value));
    if (!isValid(date)) return "—";
    return format(date, "dd MMM · hh:mm a");
}

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
    pagination,
    page = 1,
    onPageChange,
    onView,
}) => {
    const showActions = !preview && onView;
    const totalPages = pagination?.totalPages ?? 1;

    return (
        <div className="app-card p-5 w-full transition">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
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
                <div className="flex items-center gap-3">
                    <span className="text-xs text-app-muted">
                        {pagination && !preview
                            ? `Page ${page} · ${filtered.length} shown · ${pagination.total} total`
                            : `${filtered.length} entries`}
                    </span>
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
            </div>

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
                                "flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl hover:bg-[var(--color-card-hover)] transition-all duration-200",
                                isHighlighted?.(item) && "notif-row-highlight"
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-[180px] flex-1">
                                <Avatar
                                    circle
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                >
                                    {(item.name || "?").charAt(0)}
                                </Avatar>

                                <div>
                                    <h3 className="text-sm font-semibold text-app-text">{item.name}</h3>
                                    <p className="text-xs text-app-muted">{item.phone}</p>
                                    {item.eventTitle && (
                                        <p className="text-xs text-app-muted">{item.eventTitle}</p>
                                    )}
                                </div>
                            </div>

                            <div className="hidden md:block">
                                <Tag className="bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded-full text-xs">
                                    {item.category}
                                </Tag>
                            </div>

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

                            <div className="flex items-center gap-2">
                                <span
                                    className={clsx(
                                        "w-2 h-2 rounded-full",
                                        item.checkIn ? "bg-emerald-500" : "bg-app-muted"
                                    )}
                                />
                                <span className="text-xs text-app-muted">{item.checkIn ? "Checked" : "Pending"}</span>
                            </div>

                            <div className="hidden lg:block text-xs text-app-muted min-w-[120px]">
                                {formatRowTime(item.time)}
                            </div>

                            {showActions && (
                                <div className="flex gap-2">
                                    <IconButton
                                        icon={<Eye size={16} />}
                                        appearance="subtle"
                                        title="View in event attendance (block/manage)"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onView!(item);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {!preview && pagination && totalPages > 1 && onPageChange && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-app-border">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-app-accent disabled:opacity-40"
                        disabled={page <= 1 || loading}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>
                    <span className="text-xs text-app-muted">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-app-accent disabled:opacity-40"
                        disabled={page >= totalPages || loading}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentRegistrationsUI;
