import { format } from "date-fns";
import { Eye, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Avatar, IconButton, Tag, Whisper, Tooltip } from "rsuite";
import GenderBadge from "../common/GenderBadge";
import {
    getRegistrationInvestorInitial,
    getRegistrationInvestorName,
} from "../../utils/getRegistrationInvestorName";
import {
  paymentRequired,
  calculateRegistrationTotal,
  isPaymentSufficient,
  formatCurrency,
  type EventPricingFields,
} from "../../utils/pricing";

export type RegistrationTableColumn =
    | "user"
    | "gender"
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

type ColumnMeta = ColumnMetaBase & {
  key: RegistrationTableColumn;
  widthPx: number;
};

const COLUMN_DEFS: Record<RegistrationTableColumn, ColumnMetaBase> = {
    user: { label: "User" },
    gender: { label: "Gender", hideMobile: true },
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
        user: 200,
        gender: 88,
        category: 108,
        pass: 88,
        status: 160,
        time: 104,
        actions: 88,
    },
    attendancePanel: {
        user: 200,
        gender: 80,
        guests: 72,
        payment: 88,
        checkin: 132,
        registered: 168,
        actions: 80,
    },
    attendancePanelCompact: {
        user: 188,
        gender: 72,
        guests: 64,
        payment: 80,
        checkin: 118,
        registered: 162,
    },
};

const DEFAULT_WIDTHS: Record<RegistrationTableColumn, number> = {
    user: 180,
    gender: 84,
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

export const REGISTRATION_TABLE_LAYOUTS = {
    eventDetail: ["user", "gender", "category", "pass", "status", "time", "actions"] as RegistrationTableColumn[],
    attendancePanel: ["user", "gender", "guests", "payment", "checkin", "registered", "actions"] as RegistrationTableColumn[],
    attendancePanelCompact: ["user", "gender", "guests", "payment", "checkin", "registered"] as RegistrationTableColumn[],
} as const;

function resolveLayoutKey(columns: RegistrationTableColumn[]): string {
    const layouts = Object.entries(REGISTRATION_TABLE_LAYOUTS) as [string, RegistrationTableColumn[]][];
    const current = columns.join(",");
    const match = layouts.find(([, cols]) => cols.join(",") === current);
    return match?.[0] ?? "custom";
}

function buildColumnMeta(columns: RegistrationTableColumn[]): ColumnMeta[] {
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

type RegistrationDataTableProps = {
    rows: any[];
    columns: RegistrationTableColumn[];
    event?: EventPricingFields;
    emptyMessage?: string;
    showDeleteAction?: boolean;
    hideActions?: boolean;
    dateFormat?: "full" | "compact";
    minWidth?: number;
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

const columnWidthPercent = (widthPx: number, total: number) =>
    `${((widthPx / total) * 100).toFixed(4)}%`;

function formatPhone(value: unknown) {
    return String(value ?? "").replace(/\s/g, "\u00A0");
}

function PassBadge({
  item,
  event,
}: {
  item: any;
  event?: EventPricingFields;
}) {
  const guestCount = item.participants?.length ?? item.participantsCount ?? 0;
  const requiresPayment = paymentRequired(event, guestCount);
  const paidTotal =
    Number(item.payment?.paidTotal ?? 0) ||
    (item.payment?.status === "success" ? Number(item.payment?.amount ?? 0) : 0);
  const isSufficient = isPaymentSufficient(event, guestCount, paidTotal);

  let className = "reg-badge reg-badge--free";
  let label = "FREE";

  if (requiresPayment) {
    if (isSufficient) {
      className = "reg-badge reg-badge--paid";
      label = "PAID";
    } else if (paidTotal > 0) {
      className = "reg-badge reg-badge--partial";
      label = "PARTIAL";
    } else {
      className = "reg-badge reg-badge--pending";
      label = "PENDING";
    }
  }

  return <span className={className}>{label}</span>;
}

function PaymentAmountBadge({
  item,
  event,
}: {
  item: any;
  event?: EventPricingFields;
}) {
  const guestCount = item.participants?.length ?? item.participantsCount ?? 0;
  const { total } = calculateRegistrationTotal(event, guestCount);
  const paidTotal =
    Number(item.payment?.paidTotal ?? 0) ||
    (item.payment?.status === "success" ? Number(item.payment?.amount ?? 0) : 0);
  const requiresPayment = total > 0;
  const amountDue = Math.max(0, total - paidTotal);

  if (!requiresPayment) {
    return <span className="reg-badge reg-badge--free text-xs">FREE</span>;
  }

  if (paidTotal >= total) {
    return (
      <span className="reg-badge reg-badge--paid text-xs whitespace-nowrap">
        PAID {formatCurrency(paidTotal)}
      </span>
    );
  }

  return (
    <span className="reg-badge reg-badge--partial text-xs whitespace-nowrap">
      DUE {formatCurrency(amountDue)}
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
    showDeleteAction?: boolean,
    dateFormat: RegistrationDataTableProps["dateFormat"] = "full"
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
                        <p className="text-xs text-app-muted truncate whitespace-nowrap">{formatPhone(item.phone)}</p>
                    </div>
                </div>
            );
        case "category":
            return <Tag className="reg-tag reg-tag--category">General</Tag>;
        case "gender":
            return <GenderBadge gender={item.investor?.Gender} size="md" />;
        case "guests": {
            const list = item.participants || [];
            const count = item.participantsCount ?? list.length;
            const tip =
                list.length > 0
                    ? list
                          .map((p: any) => {
                            const status = p.isCheckedIn ? " ✓" : " —";
                            return `${p.name} (${p.gender || "Other"})${status}`;
                          })
                          .join("\n")
                    : "No guests";
            return (
                <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={<Tooltip>{tip}</Tooltip>}
                >
                    <Tag className="reg-tag reg-tag--guests cursor-help">{count}</Tag>
                </Whisper>
            );
        }
        case "pass":
            return <PassBadge item={item} event={event} />;
        case "payment":
            return <PaymentAmountBadge item={item} event={event} />;
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
                    {item.createdAt
                        ? format(
                              new Date(item.createdAt),
                              dateFormat === "compact" ? "dd MMM yyyy · hh:mm a" : "dd MMM yyyy, hh:mm a"
                          )
                        : "—"}
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
    hideActions = false,
    dateFormat = "full",
    minWidth,
    className = "",
}: RegistrationDataTableProps) {
    const visibleColumns = useMemo(
        () => (hideActions ? columns.filter((col) => col !== "actions") : columns),
        [columns, hideActions]
    );
    const columnMeta = buildColumnMeta(visibleColumns);
    const computedMinWidth = tableMinWidth(columnMeta);
    const tableMinWidthPx = Math.max(computedMinWidth, minWidth ?? 0);

    return (
        <div className={`registration-table-frame ${className}`.trim()}>
            <div className="registration-table-scroll">
                <table
                    className="registration-table border-collapse"
                    style={{ width: "100%", minWidth: tableMinWidthPx, tableLayout: "fixed" }}
                >
                    <colgroup>
                        {columnMeta.map((col) => (
                            <col
                                key={col.key}
                                style={{ width: columnWidthPercent(col.widthPx, computedMinWidth) }}
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
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="registration-table-empty px-4 py-10 text-center text-app-muted">
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
                                            className={tdClass(col)}
                                        >
                                            {renderCell(col.key, item, event, showDeleteAction, dateFormat)}
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
