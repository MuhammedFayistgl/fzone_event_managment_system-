import { format } from "date-fns";
import {
  Ban,
  Download,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import GenderBadge from "../common/GenderBadge";
import {
  formatCurrency,
  getGuestPaymentStatuses,
  type EventPricingFields,
  type GuestPaymentStatus,
} from "../../utils/pricing";
import type { RegistrationAttendanceRow } from "../../Types/registrationAttendance.types";

function GuestPayBadge({ status }: { status: GuestPaymentStatus }) {
  const labels: Record<GuestPaymentStatus, string> = {
    free: "Free",
    paid: "Paid",
    due: "Due",
  };
  return <span className={`guest-pay-badge guest-pay-badge--${status}`}>{labels[status]}</span>;
}

type Props = {
  row: RegistrationAttendanceRow;
  event?: EventPricingFields;
  paidTotal: number;
  onDownloadInvestor: () => void;
  onDownloadGuest: (index: number) => void;
  onBlockInvestor: (blocked: boolean) => void;
  onBlockGuest: (index: number, blocked: boolean) => void;
};

export default function GuestExpandPanel({
  row,
  event,
  paidTotal,
  onDownloadInvestor,
  onDownloadGuest,
  onBlockInvestor,
  onBlockGuest,
}: Props) {
  const guests = row.participants || [];
  const guestCount = guests.length;
  const statuses = getGuestPaymentStatuses(event, guestCount, paidTotal);
  const investorName = row.investor?.Name || "Investor";

  return (
    <div className="reg-expand-panel">
      <div className="reg-expand-panel__investor-row">
        <div className="flex items-center gap-3 min-w-0">
          <UserRound size={16} className="text-app-cyan shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-app-text truncate">{investorName}</p>
            <p className="text-xs text-app-muted">Investor pass · Paid total {formatCurrency(paidTotal)}</p>
          </div>
          <GenderBadge gender={row.investor?.Gender} size="sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {row.isBlocked && (
            <span className="reg-blocked-badge">Blocked</span>
          )}
          <button type="button" className="reg-action-btn" onClick={onDownloadInvestor} disabled={!row.qrCodeImage}>
            <Download size={14} /> Investor PDF
          </button>
          <button
            type="button"
            className={`reg-action-btn ${row.isBlocked ? "reg-action-btn--success" : "reg-action-btn--danger"}`}
            onClick={() => onBlockInvestor(!row.isBlocked)}
          >
            <Ban size={14} /> {row.isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-app-muted py-2">No guests for this registration.</p>
      ) : (
        <div className="reg-expand-panel__table-wrap">
          <table className="reg-expand-panel__table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Paid</th>
                <th>Check-in</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, index) => (
                <tr key={`${guest.name}-${index}`}>
                  <td className="font-medium">{guest.name}</td>
                  <td><GenderBadge gender={guest.gender} size="sm" /></td>
                  <td className="text-app-muted text-xs">{guest.phone || "—"}</td>
                  <td>{statuses[index] && <GuestPayBadge status={statuses[index]} />}</td>
                  <td>
                    {guest.isCheckedIn ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={12} /> In
                      </span>
                    ) : (
                      <span className="text-xs text-orange-400">Pending</span>
                    )}
                  </td>
                  <td>
                    {guest.isBlocked ? (
                      <span className="reg-blocked-badge">Blocked</span>
                    ) : (
                      <span className="text-xs text-app-muted">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="reg-action-btn reg-action-btn--sm"
                        onClick={() => onDownloadGuest(index)}
                        disabled={!guest.qrCodeImage}
                      >
                        <Download size={12} /> PDF
                      </button>
                      <button
                        type="button"
                        className={`reg-action-btn reg-action-btn--sm ${guest.isBlocked ? "reg-action-btn--success" : "reg-action-btn--danger"}`}
                        onClick={() => onBlockGuest(index, !guest.isBlocked)}
                      >
                        <Ban size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {row.createdAt && (
        <p className="text-xs text-app-muted mt-3">
          Registered {format(new Date(row.createdAt), "dd MMM yyyy · hh:mm a")}
        </p>
      )}
    </div>
  );
}
