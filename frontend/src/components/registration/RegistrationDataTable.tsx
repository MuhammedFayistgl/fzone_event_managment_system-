import { format } from "date-fns";
import { Eye, Trash2 } from "lucide-react";
import { Avatar, IconButton, Tag } from "rsuite";
import {
    getRegistrationInvestorInitial,
    getRegistrationInvestorName,
} from "../../utils/getRegistrationInvestorName";

export type RegistrationTableColumn =
    | "user"
    | "category"
    | "guests"
    | "pass"
    | "payment"
    | "status"
    | "checkin"
    | "time"
    | "registered"
    | "actions";

type ColumnMetaBase = {
    label: string;
    hideMobile?: boolean;
    align?: "left" | "right" | "center";
};

type ColumnMeta = ColumnMetaBase & { widthPx: number };

const COLUMN_DEFS: Record<RegistrationTableColumn, ColumnMetaBase> = {
    user: { label: "User" },
    category: { label: "Category", hideMobile: true },
    guests: { label: "Guests", hideMobile: true },
    pass: { label: "Pass" },
    payment: { label: "Payment" },
    status: { label: "Status" },
    checkin: { label: "Check-in" },
    time: { label: "Time", hideMobile: true },
    registered: { label: "Registered", hideMobile: true },
    actions: { label: "Actions", align: "right" },
};

/** Fixed px widths per layout — header & body stay aligned */
const LAYOUT_WIDTHS: Record<string, Partial<Record<RegistrationTableColumn, number>>> = {
    eventDetail: {
        user: 196,
        category: 112,
        pass: 88,
        status: 168,
        time: 108,
        actions: 88,
    },
    attendancePanel: {
        user: 196,
        guests: 72,
        payment: 88,
        checkin: 140,
        registered: 150,
        actions: 88,
    },
};

const DEFAULT_WIDTHS: Record<RegistrationTableColumn, number> = {
    user: 180,
    category: 110,
    guests: 80,
    pass: 90,
    payment: 90,
    status: 150,
    checkin: 130,
    time: 100,
    registered: 150,
    actions: 88,
};

function resolveLayoutKey(columns: RegistrationTableColumn[]): string {
    const eventCols = REGISTRATION_TABLE_LAYOUTS.eventDetail.join(",");
    const attendanceCols = REGISTRATION_TABLE_LAYOUTS.attendancePanel.join(",");
    const current = columns.join(",");
    if (current === eventCols) return "eventDetail";
    if (current === attendanceCols) return "attendancePanel";
    return "custom";
}

function buildColumnMeta(columns: RegistrationTableColumn[]) {
    const layoutKey = resolveLayoutKey(columns);
    const layoutWidths = LAYOUT_WIDTHS[layoutKey] ?? {};

    return columns.map((key) => ({
        key,
        ...COLUMN_DEFS[key],
        widthPx: layoutWidths[key] ?? DEFAULT_WIDTHS[key],
    }));
}

function tableMinWidth(columnMeta: ReturnType<typeof buildColumnMeta>) {
    return columnMeta.reduce((sum, col) => sum + col.widthPx, 0);
}

export const REGISTRATION_TABLE_LAYOUTS = {
    eventDetail: ["user", "category", "pass", "status", "time", "actions"] as RegistrationTableColumn[],
    attendancePanel: ["user", "guests", "payment", "checkin", "registered", "actions"] as RegistrationTableColumn[],
} as const;

type RegistrationDataTableProps = {
    rows: any[];
    columns: RegistrationTableColumn[];
    event?: { isPaid?: boolean };
    emptyMessage?: string;
    showDeleteAction?: boolean;
    className?: string;
};

const thClass = (col: ColumnMetaBase) =>
    [
        "px-3 py-3 font-medium align-middle whitespace-nowrap",
        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
        col.hideMobile ? "hidden md:table-cell" : "",
    ]
        .filter(Boolean)
        .join(" ");

const tdClass = (col: ColumnMetaBase) =>
    [
        "px-3 py-3 align-middle",
        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
        col.hideMobile ? "hidden md:table-cell" : "",
    ]
        .filter(Boolean)
        .join(" ");

const cellWidthStyle = (widthPx: number) =>
    ({ width: widthPx, minWidth: widthPx, maxWidth: widthPx }) as const;

function PassBadge({ item, isPaid }: { item: any; isPaid?: boolean }) {
    const paid = item.payment?.status === "success";
    const className = paid
        ? "reg-badge reg-badge--paid"
        : isPaid
          ? "reg-badge reg-badge--pending"
          : "reg-badge reg-badge--free";
    return (
        <span className={className}>
            {isPaid ? (paid ? "PAID" : "PENDING") : "FREE"}
        </span>
    );
}

function CheckinStatus({ item, variant }: { item: any; variant: "hall" | "compact" }) {
    if (item?.isCheckedIn) {
        return (
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                </span>
                <span className="text-xs font-medium text-green-400 whitespace-nowrap">
                    {variant === "hall" ? "Entered Hall" : "Entered"}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
            <span className="text-xs font-medium text-orange-400 whitespace-nowrap">
                {variant === "hall" ? "Not Entered" : "Pending"}
            </span>
        </div>
    );
}

function renderCell(
    key: RegistrationTableColumn,
    item: any,
    event: RegistrationDataTableProps["event"],
    showDeleteAction?: boolean
) {
    switch (key) {
        case "user":
            return (
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar circle className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        {getRegistrationInvestorInitial(item)}
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-app-text truncate group-hover:text-app-accent transition">
                            {getRegistrationInvestorName(item)}
                        </p>
                        <p className="text-xs text-app-muted truncate">{item.phone}</p>
                    </div>
                </div>
            );
        case "category":
            return <Tag className="reg-tag reg-tag--category">General</Tag>;
        case "guests":
            return (
                <Tag className="reg-tag reg-tag--guests">
                    {item.participantsCount ?? item.participants?.length ?? 0}
                </Tag>
            );
        case "pass":
        case "payment":
            return <PassBadge item={item} isPaid={event?.isPaid} />;
        case "status":
            return <CheckinStatus item={item} variant="hall" />;
        case "checkin":
            return <CheckinStatus item={item} variant="compact" />;
        case "time":
            return (
                <span className="reg-time-cell">
                    {item.createdAt ? format(new Date(item.createdAt), "hh:mm a") : "—"}
                </span>
            );
        case "registered":
            return (
                <span className="reg-time-cell">
                    {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a") : "—"}
                </span>
            );
        case "actions":
            return (
                <div className="inline-flex gap-1 justify-end">
                    <IconButton icon={<Eye size={16} />} appearance="subtle" size="sm" />
                    {showDeleteAction && (
                        <IconButton icon={<Trash2 size={16} />} appearance="subtle" color="red" size="sm" />
                    )}
                </div>
            );
        default:
            return null;
    }
}

export default function RegistrationDataTable({
    rows,
    columns,
    event,
    emptyMessage = "No registrations found",
    showDeleteAction = true,
    className = "",
}: RegistrationDataTableProps) {
    const columnMeta = buildColumnMeta(columns);
    const minTableWidth = tableMinWidth(columnMeta);

    return (
        <div className={`registration-table-frame ${className}`.trim()}>
            <div className="registration-table-scroll">
                <table
                    className="registration-table w-full border-collapse"
                    style={{ minWidth: minTableWidth, tableLayout: "fixed" }}
                >
                    <colgroup>
                        {columnMeta.map((col) => (
                            <col
                                key={col.key}
                                style={cellWidthStyle(col.widthPx)}
                                className={col.hideMobile ? "hidden md:table-column" : undefined}
                            />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="pro-table-head-row registration-table-head-row">
                            {columnMeta.map((col) => (
                                <th
                                    key={col.key}
                                    className={`pro-table-head-cell ${thClass(col)}`}
                                    style={cellWidthStyle(col.widthPx)}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="registration-table-empty px-4 py-10 text-center text-app-muted">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map((item, index) => (
                                <tr
                                    key={item._id}
                                    className={`registration-table-row group border-t border-app-border hover:bg-[var(--color-card-hover)] transition-colors${index % 2 === 1 ? " registration-table-row--alt" : ""}`}
                                >
                                    {columnMeta.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`${tdClass(col)}`}
                                            style={cellWidthStyle(col.widthPx)}
                                        >
                                            {renderCell(col.key, item, event, showDeleteAction)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
