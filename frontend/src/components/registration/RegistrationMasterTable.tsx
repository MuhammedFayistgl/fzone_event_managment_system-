import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, Dropdown } from "rsuite";
import GenderBadge from "../common/GenderBadge";
import GuestExpandPanel from "./GuestExpandPanel";
import {
  calculateRegistrationTotal,
  formatCurrency,
  type EventPricingFields,
} from "../../utils/pricing";
import {
  getRegistrationInvestorInitial,
  getRegistrationInvestorName,
} from "../../utils/getRegistrationInvestorName";
import type { RegistrationAttendanceRow } from "../../Types/registrationAttendance.types";

function PaymentAmountBadge({
  item,
  event,
}: {
  item: RegistrationAttendanceRow;
  event?: EventPricingFields;
}) {
  const guestCount = item.participants?.length ?? item.participantsCount ?? 0;
  const { total } = calculateRegistrationTotal(event, guestCount);
  const paidTotal =
    Number(item.payment?.paidTotal ?? 0) ||
    (item.payment?.status === "success" ? Number(item.payment?.amount ?? 0) : 0);
  const amountDue = Math.max(0, total - paidTotal);

  if (total <= 0) {
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

function CheckinStatus({ checkedIn }: { checkedIn?: boolean }) {
  if (checkedIn) {
    return <span className="text-xs font-medium text-green-400">Entered</span>;
  }
  return <span className="text-xs font-medium text-orange-400">Pending</span>;
}

type Props = {
  rows: RegistrationAttendanceRow[];
  event?: EventPricingFields & { title?: string; ticketDesign?: unknown };
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onDownloadInvestor: (row: RegistrationAttendanceRow) => void;
  onDownloadGuest: (row: RegistrationAttendanceRow, guestIndex: number) => void;
  onDownloadRowAll: (row: RegistrationAttendanceRow) => void;
  onBlockInvestor: (row: RegistrationAttendanceRow, blocked: boolean) => void;
  onBlockGuest: (row: RegistrationAttendanceRow, guestIndex: number, blocked: boolean) => void;
};

export default function RegistrationMasterTable({
  rows,
  event,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDownloadInvestor,
  onDownloadGuest,
  onDownloadRowAll,
  onBlockInvestor,
  onBlockGuest,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allIds = useMemo(() => rows.map((r) => r._id), [rows]);
  const allSelected = rows.length > 0 && allIds.every((id) => selectedIds.has(id));

  if (rows.length === 0) {
    return (
      <div className="reg-master-table__empty">
        No registrations match your filters.
      </div>
    );
  }

  return (
    <div className="reg-master-table">
      <div className="reg-master-table__head">
        <label className="reg-master-table__check">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll(allIds)}
          />
        </label>
        <span className="reg-master-table__col reg-master-table__col--investor">Investor</span>
        <span className="reg-master-table__col reg-master-table__col--payment">Payment</span>
        <span className="reg-master-table__col reg-master-table__col--checkin">Check-in</span>
        <span className="reg-master-table__col reg-master-table__col--block">Block</span>
        <span className="reg-master-table__col reg-master-table__col--actions">Actions</span>
      </div>

      <div className="reg-master-table__body">
        {rows.map((row) => {
          const guestCount = row.participants?.length ?? 0;
          const hasGuests = guestCount > 0;
          const isExpanded = expandedId === row._id;
          const paidTotal =
            Number(row.payment?.paidTotal ?? 0) ||
            (row.payment?.status === "success" ? Number(row.payment?.amount ?? 0) : 0);
          const isRowBlocked =
            row.isBlocked || (row.participants || []).some((p) => p.isBlocked);

          return (
            <div key={row._id} className="reg-master-table__row-wrap">
              <div className={`reg-master-table__row ${isExpanded ? "reg-master-table__row--expanded" : ""}`}>
                <label className="reg-master-table__check">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row._id)}
                    onChange={() => onToggleSelect(row._id)}
                  />
                </label>

                <button
                  type="button"
                  className="reg-master-table__expand"
                  onClick={() => setExpandedId(isExpanded ? null : row._id)}
                  disabled={!hasGuests}
                  aria-label={hasGuests ? "Toggle guests" : "No guests"}
                >
                  {hasGuests ? (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  ) : (
                    <span className="w-4" />
                  )}
                </button>

                <div className="reg-master-table__investor min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar circle className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      {getRegistrationInvestorInitial(row)}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-app-text truncate">
                        {getRegistrationInvestorName(row)}
                      </p>
                      <p className="text-xs text-app-muted truncate">{row.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <GenderBadge gender={row.investor?.Gender} size="sm" />
                    {hasGuests && (
                      <span className="text-xs text-app-muted">{guestCount} guest{guestCount === 1 ? "" : "s"}</span>
                    )}
                    {row.createdAt && (
                      <span className="text-xs text-app-muted hidden sm:inline">
                        {format(new Date(row.createdAt), "dd MMM yyyy")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="reg-master-table__payment">
                  <PaymentAmountBadge item={row} event={event} />
                </div>

                <div className="reg-master-table__checkin">
                  <CheckinStatus checkedIn={row.isCheckedIn} />
                </div>

                <div className="reg-master-table__block">
                  {isRowBlocked ? (
                    <span className="reg-blocked-badge">Blocked</span>
                  ) : (
                    <span className="text-xs text-app-muted">—</span>
                  )}
                </div>

                <div className="reg-master-table__actions">
                  <Dropdown
                    renderToggle={(props, ref) => (
                      <button type="button" className="reg-action-btn reg-action-btn--icon" {...props} ref={ref}>
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                    placement="bottomEnd"
                  >
                    <Dropdown.Item onClick={() => onDownloadInvestor(row)} disabled={!row.qrCodeImage}>
                      <Download size={14} className="inline mr-2" /> Investor PDF
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => onDownloadRowAll(row)}>
                      <Download size={14} className="inline mr-2" /> All passes (row)
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => onBlockInvestor(row, !row.isBlocked)}>
                      <Ban size={14} className="inline mr-2" /> {row.isBlocked ? "Unblock investor" : "Block investor"}
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </div>

              {isExpanded && hasGuests && (
                <GuestExpandPanel
                  row={row}
                  event={event}
                  paidTotal={paidTotal}
                  onDownloadInvestor={() => onDownloadInvestor(row)}
                  onDownloadGuest={(index) => onDownloadGuest(row, index)}
                  onBlockInvestor={(blocked) => onBlockInvestor(row, blocked)}
                  onBlockGuest={(index, blocked) => onBlockGuest(row, index, blocked)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
